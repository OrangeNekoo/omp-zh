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
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";

/**
 * `@babel/traverse` 在 ESM 下把函数挂在 `default` 上，在 CJS 下就是模块本身。
 * 类型声明只描述其中一种形态，这里按运行时实际结构取一次。
 */
const traverseModuleShape: { default?: unknown } = traverseModule as unknown as { default?: unknown };
const traverse = (traverseModuleShape.default ?? traverseModule) as typeof traverseModule;

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
	"packages/coding-agent/src/cli/auth-broker-cli.ts",
	"packages/coding-agent/src/cli/skill-cli.ts",
	"packages/coding-agent/src/cli/browser-relay-cli.ts",
	"packages/coding-agent/src/main.ts",
	"packages/coding-agent/src/utils/resume-command.ts",
	"packages/coding-agent/src/subprocess/worker-client.ts",
	"packages/coding-agent/src/slash-commands/builtin-collaboration.ts",
	"packages/coding-agent/src/commands/login.ts",
	"packages/coding-agent/src/commands/completions.ts",
	"packages/coding-agent/src/commands/join.ts",
	"packages/coding-agent/src/commands/launch-help.ts",
	"packages/coding-agent/src/commands/models.ts",
	"packages/coding-agent/src/commands/play.ts",
];

/** 定义 `CLI_NAME` 的文件。 */
const DIRS_FILE = "packages/utils/src/dirs.ts";

/** 帮助文本里以 `omp <sub>` 形式出现的子命令。 */
const SUBCOMMAND_PATTERN =
	/\bomp (agents|plugin|config|setup|shell|skill|auth-broker|browser-relay|play|completions|join|models)\b/g;

/**
 * 把字符串字面量里的 `omp <sub>` 换成 `omp-zh <sub>`。
 *
 * 模板字符串里写成 `${CLI_NAME} <sub>`（插值，能跟随常量）；
 * 普通字符串里直接写 `omp-zh <sub>`——普通字符串中的 `${…}` 不会展开，
 * 写插值会原样打印出 `${CLI_NAME}`。
 *
 * 走 AST 而不是正则：注释里也有反引号与 `omp <sub>` 字样，按文本扫描会
 * 把注释当成模板字符串改写，还会因此引入未使用的导入。
 */
function rewriteCommandNamesInLiterals(source: string): string {
	let ast: unknown;
	try {
		ast = parse(source, { sourceType: "module", plugins: ["typescript", "jsx"] });
	} catch {
		return source;
	}
	interface Edit {
		start: number;
		end: number;
		text: string;
	}
	const edits: Edit[] = [];
	const rewriteRange = (start: number, end: number, quote: string): void => {
		const body = source.slice(start, end);
		const replaced = body.replace(SUBCOMMAND_PATTERN, (_match, sub: string) =>
			quote === "`" ? `$` + `{CLI_NAME} ${sub}` : `omp-zh ${sub}`,
		);
		if (replaced === body) return;
		edits.push({ start, end, text: replaced });
	};
	traverse(ast, {
		StringLiteral(p: any) {
			rewriteRange(p.node.start + 1, p.node.end - 1, source[p.node.start]);
		},
		TemplateElement(p: any) {
			// 插值之间的字面片段；带 `tail` 的片段仍属于同一个模板字符串。
			rewriteRange(p.node.start, p.node.end, "`");
		},
	});
	if (edits.length === 0) return source;
	edits.sort((a, b) => b.start - a.start);
	let output = source;
	for (const edit of edits) output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
	return output;
}

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
	// `--version` 的 bin 名与版本串前缀（`omp/X.Y.Z`）
	source = source.replace(/\bbin: APP_NAME\b/g, "bin: CLI_NAME");
	source = source.replace(/output\.slice\(APP_NAME\.length \+ 1\)/g, "output.slice(CLI_NAME.length + 1)");
	// 在 PATH 上查找命令本体（`omp update` 会据此判断装的是哪个命令）
	source = source.replace(/\$which\(APP_NAME\)/g, "$which(CLI_NAME)");
	source = source.replace(/\$which\("omp"/g, "$which(CLI_NAME");
	// 字符串字面量里的裸命令名：模板字符串用 `${CLI_NAME}` 插值，普通字符串
	// 直接写 `omp-zh`（普通字符串里的 `${…}` 不会展开）。
	source = rewriteCommandNamesInLiterals(source);

	if (source === original) return false;

	// 修正导入：需要 CLI_NAME，去掉因改名而不再使用的标识符。
	// 同一个文件可能从 `pi-utils` 与 `pi-utils/dirs` 各导入一次，两者都要清理；
	// 但 CLI_NAME 只能出现在其中一个导入里。
	const importPattern = /import \{([^}]+)\} from "(@oh-my-pi\/pi-utils(?:\/dirs)?)"/g;
	const importMatches = [...source.matchAll(importPattern)];
	// 改名只在源码里插入 `CLI_NAME`，不会移除 `$env`/`$which` 这类仍在用的导入；
	// 这里只在「本文件确实引用了该名字」时保留，避免把死导入留进源码。
	const referencedOutsideImports = (name: string): boolean => {
		// `$env`/`$which` 以非单词字符开头，`\b` 在它们前面不成立，改用前后
		// 环视排除标识符字符。
		const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const pattern = new RegExp(`(?<![\\w$])${escaped}(?![\\w$])`, "g");
		let total = 0;
		for (const match of source.matchAll(pattern)) {
			const index = match.index ?? 0;
			if (
				!importMatches.some(
					importMatch => index >= (importMatch.index ?? 0) && index < (importMatch.index ?? 0) + importMatch[0].length,
				)
			) {
				total++;
			}
		}
		return total > 0;
	};
	let cursor = 0;
	let output = "";
	let cliNameEmitted = false;
	for (const match of importMatches) {
		const names = match[1]
			.split(",")
			.map(name => name.trim())
			.filter(Boolean);
		const kept = names.filter(name => name !== "CLI_NAME" && referencedOutsideImports(name));
		if (!cliNameEmitted && (names.includes("CLI_NAME") || referencedOutsideImports("CLI_NAME"))) {
			kept.unshift("CLI_NAME");
			cliNameEmitted = true;
		}
		// 保留上游的排版：单行导入继续单行，多行导入继续多行。
		const wasMultiline = match[0].includes("\n");
		const rendered = wasMultiline
			? `import {\n${kept.map(name => `\t${name},`).join("\n")}\n} from "${match[2]}"`
			: `import { ${kept.join(", ")} } from "${match[2]}"`;
		output += source.slice(cursor, match.index) + rendered;
		cursor = (match.index ?? 0) + match[0].length;
	}
	output += source.slice(cursor);
	source = output;

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
