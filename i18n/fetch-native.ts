#!/usr/bin/env bun
/**
 * 为源码工作区准备 pi_natives 原生模块。
 *
 * 为什么需要这一步：本仓库的 `packages/natives` 是 workspace 包，
 * `bun install` 不会安装 npm 上预编译的平台包——平台包（以及声明它们的
 * `optionalDependencies`）只在发布产物里生成。因此从源码运行 `omp-zh`
 * 时，加载器只会在 `packages/natives/native/` 下找
 * `pi_natives.<platform>-<arch>.node`。
 *
 * 本脚本从 npm 拉取与 `packages/natives/package.json` 同版本的平台包，
 * 解压出 `.node` 放到加载器查找的位置。无需 Rust 工具链。
 *
 * 若你要本地编译（修改了 crates/**），改用：
 *   bun --cwd=packages/natives run build
 *
 * 用法：
 *   bun i18n/fetch-native.ts            # 缺失时下载
 *   bun i18n/fetch-native.ts --force    # 强制重新下载
 *   bun i18n/fetch-native.ts --check    # 只检查，缺失时退出码 1
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { $ } from "bun";

const ROOT = path.join(import.meta.dir, "..");
const NATIVES_DIR = path.join(ROOT, "packages/natives");
const NATIVE_OUT = path.join(NATIVES_DIR, "native");

/** 平台标识 → npm 平台包后缀。 */
const PLATFORM_TAGS: Record<string, string> = {
	"darwin-arm64": "darwin-arm64",
	"darwin-x64": "darwin-x64",
	"linux-arm64": "linux-arm64",
	"linux-x64": "linux-x64",
	"win32-x64": "win32-x64",
	"win32-arm64": "win32-arm64",
};

/** x64 在 macOS/Linux 上有 baseline/modern 两种变体，加载器会依次尝试。 */
function addonFilenames(tag: string): string[] {
	if (tag.endsWith("-x64")) {
		return [`pi_natives.${tag}-baseline.node`, `pi_natives.${tag}-modern.node`, `pi_natives.${tag}.node`];
	}
	return [`pi_natives.${tag}.node`];
}

function platformTag(): string {
	return `${process.platform}-${process.arch}`;
}

/** 读取 workspace 的 natives 版本，平台包必须与之同版本（加载器会校验）。 */
function nativeVersion(): string {
	const manifest = JSON.parse(fs.readFileSync(path.join(NATIVES_DIR, "package.json"), "utf8")) as {
		version: string;
	};
	return manifest.version;
}

/** 把 `1.2.3` / `1.2.3-canary.4` 解析成可比较的数字段；预发布返回 null。 */
function stableParts(version: string): number[] | null {
	const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
	return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

/**
 * 解析要安装的平台包版本。
 *
 * 上游发版后，npm 上的平台包通常比 workspace 里的 `package.json` 晚几分钟
 * 到几十分钟。精确版本缺失时回退到已发布的最新稳定版：workspace 加载路径
 * 会跳过版本校验（`ctx.isWorkspaceLoad`），旧一版的原生模块仍可启动，
 * 比让整个同步流程卡住更有用。
 */
async function resolveNativeVersion(packageName: string, requested: string): Promise<string> {
	const listed = await $`npm view ${packageName} versions --json`.quiet().nothrow();
	if (listed.exitCode !== 0) return requested;
	let versions: string[];
	try {
		const parsed: unknown = JSON.parse(listed.stdout.toString());
		versions = Array.isArray(parsed)
			? parsed.filter((value): value is string => typeof value === "string")
			: typeof parsed === "string"
				? [parsed]
				: [];
	} catch {
		return requested;
	}
	if (versions.includes(requested)) return requested;
	const stable = versions
		.map(version => ({ version, parts: stableParts(version) }))
		.filter((entry): entry is { version: string; parts: number[] } => entry.parts !== null)
		.sort((a, b) => a.parts[0] - b.parts[0] || a.parts[1] - b.parts[1] || a.parts[2] - b.parts[2]);
	const newest = stable.at(-1);
	if (!newest) return requested;
	process.stdout.write(
		`${packageName}@${requested} 尚未发布，改用最新的已发布版本 ${newest.version}。\n` +
			`（原生模块版本落后一版时仍可运行；需要严格一致请稍后重跑或本地构建。）\n`,
	);
	return newest.version;
}

function alreadyInstalled(tag: string): boolean {
	return addonFilenames(tag).some(filename => fs.existsSync(path.join(NATIVE_OUT, filename)));
}

async function download(tag: string, version: string): Promise<void> {
	const packageName = `@oh-my-pi/pi-natives-${tag}`;
	const tempDir = path.join(os.tmpdir(), `omp-zh-native-${process.pid}`);
	fs.mkdirSync(tempDir, { recursive: true });

	process.stdout.write(`下载 ${packageName}@${version} …\n`);
	const packed = await $`npm pack ${packageName}@${version} --pack-destination ${tempDir}`
		.cwd(tempDir)
		.quiet()
		.nothrow();
	if (packed.exitCode !== 0) {
		throw new Error(`下载失败：${packageName}@${version}\n${packed.stderr.toString()}`);
	}

	const tarball = fs.readdirSync(tempDir).find(name => name.endsWith(".tgz"));
	if (!tarball) throw new Error(`未找到 tarball：${tempDir}`);

	await $`tar -xzf ${path.join(tempDir, tarball)} -C ${tempDir}`.quiet();
	const extractedDir = path.join(tempDir, "package");
	const source = fs.readdirSync(extractedDir).find(name => name.endsWith(".node"));
	if (!source) throw new Error(`平台包内没有 .node 文件：${extractedDir}`);

	fs.mkdirSync(NATIVE_OUT, { recursive: true });
	const destination = path.join(NATIVE_OUT, source);
	fs.copyFileSync(path.join(extractedDir, source), destination);
	fs.rmSync(tempDir, { recursive: true, force: true });
	process.stdout.write(`已安装 ${path.relative(ROOT, destination)}\n`);
}

async function main(): Promise<void> {
	const checkOnly = process.argv.includes("--check");
	const force = process.argv.includes("--force");
	const tag = platformTag();

	if (!PLATFORM_TAGS[tag]) {
		throw new Error(`不支持的平台：${tag}。请改用本地构建：bun --cwd=packages/natives run build`);
	}

	const installed = alreadyInstalled(tag);
	if (installed && !force) {
		process.stdout.write(`原生模块已就绪（${tag}）。\n`);
		return;
	}
	if (checkOnly) {
		process.stderr.write(`原生模块缺失（${tag}），请运行：bun i18n/fetch-native.ts\n`);
		process.exit(1);
	}

	await download(tag, await resolveNativeVersion(`@oh-my-pi/pi-natives-${tag}`, nativeVersion()));
}

if (import.meta.main) {
	await main();
}
