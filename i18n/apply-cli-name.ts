#!/usr/bin/env bun
/**
 * 把 `omp` 改名成 `omp-zh` 的补丁重新套用到上游源码。
 *
 * 为什么需要单独的脚本：上游每次发版都会重写 `package.json` 的 `bin`
 * 字段，而 CI 同步是「切到上游源码 + 重新套用汉化」，所以改名必须和
 * 词条翻译一样，是可重放的变换而不是一次性编辑。
 *
 * 改名只影响「用户可见的命令名」：
 * - `package.json` 的 `bin`
 * - 帮助/用法文本里的命令名（→ `CLI_NAME`）
 *
 * 绝不改动内部标识：配置目录仍是 `~/.omp`，日志名、XDG 根目录、User-Agent
 * 仍是 `omp`，这样其它工具和推理网关依旧能识别这套安装。
 *
 * 幂等：已经改名过的文件不会被再次改动。
 */
import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.join(import.meta.dir, "..");

/** 帮助文本里出现命令名的文件。 */
const CLI_TEXT_FILES: readonly string[] = [
	"packages/coding-agent/src/cli.ts",
	"packages/coding-agent/src/cli/args.ts",
	"packages/coding-agent/src/cli/grep-cli.ts",
	"packages/coding-agent/src/cli/web-search-cli.ts",
	"packages/coding-agent/src/cli/plugin-cli.ts",
	"packages/coding-agent/src/cli/login-cli.ts",
	"packages/coding-agent/src/cli/shell-cli.ts",
	"packages/coding-agent/src/cli/setup-cli.ts",
	"packages/coding-agent/src/cli/config-cli.ts",
	"packages/coding-agent/src/cli/help-extra.ts",
	"packages/coding-agent/src/cli/update-cli.ts",
	"packages/coding-agent/src/main.ts",
	"packages/coding-agent/src/utils/resume-command.ts",
	"packages/coding-agent/src/subprocess/worker-client.ts",
];

/** 定义 `CLI_NAME` 的文件。 */
const DIRS_FILE = "packages/utils/src/dirs.ts";

const CLI_NAME_DEFINITION = `
/**
 * Command name users type, shown in help/usage text and \`--version\`.
 *
 * The 汉化 fork ships as \`omp-zh\` while keeping every internal identity on
 * APP_NAME: the config directory stays \`~/.omp\`, log files stay
 * \`omp.<day>.<pid>.log\`, XDG roots stay under the \`omp\` app root, and the
 * inference User-Agent stays \`omp/<version>\` so other tools and gateways still
 * recognise the installation.
 */
export const CLI_NAME: string = "omp-zh";
`;

/** 在上游源码里补上 CLI_NAME 定义。 */
function ensureCliNameConstant(): boolean {
	const file = path.join(ROOT, DIRS_FILE);
	if (!fs.existsSync(file)) return false;
	let source = fs.readFileSync(file, "utf8");
	if (source.includes("export const CLI_NAME")) return false;

	const anchor = 'export const APP_NAME: string = "omp";';
	if (!source.includes(anchor)) {
		throw new Error(`找不到 APP_NAME 定义，上游结构可能已变化：${DIRS_FILE}`);
	}
	source = source.replace(anchor, `${anchor}\n${CLI_NAME_DEFINITION}`);
	fs.writeFileSync(file, source, "utf8");
	return true;
}

/** 把 package.json 的 bin 改名为 omp-zh（保留指向的入口文件）。 */
function renameBin(): boolean {
	const file = path.join(ROOT, "packages/coding-agent/package.json");
	const manifest = JSON.parse(fs.readFileSync(file, "utf8")) as { bin?: Record<string, string> };
	if (!manifest.bin) return false;
	const entry = manifest.bin.omp ?? Object.values(manifest.bin)[0];
	if (!entry) return false;
	if (manifest.bin["omp-zh"] === entry) return false;
	manifest.bin = { "omp-zh": entry };
	fs.writeFileSync(file, `${JSON.stringify(manifest, null, "\t")}\n`);
	return true;
}

/**
 * 把帮助文本里的 `${APP_NAME}` 换成 `${CLI_NAME}`，并修正导入。
 *
 * 只改模板字符串里的插值，以及 `chalk.bold(APP_NAME)` 这种纯展示用法；
 * 进程名、路径拼接等内部用途保持 APP_NAME。
 */
function rewriteHelpText(relativePath: string): boolean {
	const file = path.join(ROOT, relativePath);
	if (!fs.existsSync(file)) return false;
	const original = fs.readFileSync(file, "utf8");
	let source = original;

	// 这些是「源码里要写入的文本」，其中的 ${...} 是给 TypeScript 的插值语法，
	// 不是本脚本要展开的模板，因此用普通字符串并转义美元符号。
	const CLI_INTERPOLATION = "$" + "{CLI_NAME}";
	source = source.replace(/\$\{APP_NAME\}/g, CLI_INTERPOLATION);
	source = source.replace(/chalk\.bold\(APP_NAME\)/g, "chalk.bold(CLI_NAME)");
	// 帮助文本里未插值的裸命令名（`omp agents unpack`）
	source = source.replace(/^(\s+)omp (agents|plugin|config|setup|shell) /gm, `$1${CLI_INTERPOLATION} $2 `);

	if (source === original) return false;

	// 修正导入：需要 CLI_NAME
	const importPattern = /import \{([^}]+)\} from "(@oh-my-pi\/pi-utils(?:\/dirs)?)"/;
	const match = importPattern.exec(source);
	if (match) {
		const names = match[1]
			.split(",")
			.map(name => name.trim())
			.filter(Boolean);
		if (!names.includes("CLI_NAME")) {
			const appIndex = names.indexOf("APP_NAME");
			if (appIndex >= 0) names[appIndex] = "CLI_NAME";
			else names.unshift("CLI_NAME");
			// 该文件仍用到 APP_NAME（如进程名）时保留两者
			if (/\bAPP_NAME\b/.test(source) && !names.includes("APP_NAME")) {
				names.push("APP_NAME");
			}
			source = source.replace(importPattern, `import { ${names.join(", ")} } from "${match[2]}"`);
		}
	}

	fs.writeFileSync(file, source, "utf8");
	return true;
}

/** 让开发用包装脚本安装成 omp-zh。 */
function renameLinkScript(): boolean {
	const file = path.join(ROOT, "scripts/link-omp.sh");
	if (!fs.existsSync(file)) return false;
	const original = fs.readFileSync(file, "utf8");
	// 只替换以 `omp` 结尾的路径段，避免把已经是 omp-zh 的再改一次
	const updated = original.replace(/\$global_bin\/omp(?![-\w])/g, "$global_bin/omp-zh");
	if (updated === original) return false;
	fs.writeFileSync(file, updated, "utf8");
	return true;
}

function main(): void {
	const changed: string[] = [];
	if (ensureCliNameConstant()) changed.push(DIRS_FILE);
	if (renameBin()) changed.push("packages/coding-agent/package.json");
	for (const file of CLI_TEXT_FILES) {
		if (rewriteHelpText(file)) changed.push(file);
	}
	if (renameLinkScript()) changed.push("scripts/link-omp.sh");

	if (changed.length === 0) {
		process.stdout.write("命令名已是 omp-zh，无需改动。\n");
		return;
	}
	process.stdout.write(`已应用命令名改动（${changed.length} 个文件）：\n`);
	for (const file of changed) process.stdout.write(`  ${file}\n`);
}

if (import.meta.main) main();
