#!/usr/bin/env bun
/**
 * 从源码中提取「需要汉化的界面文案」。
 *
 * 产物：i18n/extracted.json
 *   { "原文": { "files": [...], "kinds": [...], "count": n } }
 *
 * 提取是幂等的，且只读：不会修改任何源码。翻译脚本以该清单为输入，
 * 与词典（i18n/dictionary.json）合并后执行 AST 重写。
 *
 * 用法：
 *   bun i18n/extract.ts                # 提取并写出 extracted.json
 *   bun i18n/extract.ts --check        # 只报告统计，不写文件
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
import {
	TRANSLATABLE_CALLS,
	TRANSLATABLE_CONSTRUCTORS,
	TRANSLATABLE_PROPERTIES,
	allowsWholeFileLiterals,
	isIncludedFile,
} from "./rules";

const traverse = (traverseModule as unknown as { default?: unknown }).default ?? traverseModule;

export interface ExtractionEntry {
	/** 源码中的英文原文。 */
	readonly source: string;
	/** 出现位置（相对仓库根目录）。 */
	readonly files: readonly string[];
	/** 命中的语法位置，例如 `prop:label`。 */
	readonly kinds: readonly string[];
}

export interface ExtractionResult {
	readonly entries: readonly ExtractionEntry[];
	/** 按文件统计，便于观察覆盖面。 */
	readonly perFile: ReadonlyMap<string, number>;
}

const ROOT = path.join(import.meta.dir, "..");

/** 递归收集 .ts/.tsx 源文件。 */
function collectSources(dir: string, out: string[] = []): string[] {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "test") continue;
			collectSources(full, out);
		} else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
			out.push(full);
		}
	}
	return out;
}

/** 样式 token 词汇表：这些词的组合是渲染属性，不是界面文案。 */
const STYLE_TOKENS: ReadonlySet<string> = new Set([
	"accent",
	"dim",
	"muted",
	"strong",
	"mono",
	"num",
	"bold",
	"italic",
	"emphasis",
	"warning",
	"error",
	"success",
	"info",
	"neutral",
]);

/** 是否是由样式词构成的 token 串（`accent strong`、`dim mono` 等）。 */
function isStyleToken(value: string): boolean {
	const words = value.trim().toLowerCase().split(/\s+/);
	if (words.length < 2 || words.length > 3) return false;
	return words.every(word => STYLE_TOKENS.has(word));
}

/**
 * 是否是「像一句给人看的英文」。
 *
 * 故意保守：宁可漏掉少量文案，也不把标识符、路径、格式串、
 * 协议字段误当成可翻译文本——那会破坏运行时行为。
 */
export function looksLikeUiProse(value: string, options: { allowSingleToken?: boolean } = {}): boolean {
	if (value.length < 2 || value.length > 500) return false;
	// 必须至少包含一个英文单词
	if (!/[A-Za-z]{2}/.test(value)) return false;
	// 纯标识符、camelCase、点分路径、常量、颜色 token 全部排除
	if (/^[a-z][A-Za-z0-9]*$/.test(value)) return false;
	if (/^[a-z0-9_.\-/\\]+$/.test(value)) return false;
	// 全大写且超过 4 个字符的是常量名；LSP、Git、API 这类缩写是正常文案
	if (/^[A-Z][A-Z0-9_]*$/.test(value) && (value.length > 4 || value.includes("_"))) return false;
	if (/^(tui|app|editor|select|composer|model|session|tools|status)\./.test(value)) return false;
	// 主题 token（如 accent strong、dim mono）。只排除已知样式词组合：
	// `switch tabs`、`jump sections` 这类界面提示同样是小写短语，不能
	// 用「两个小写单词」一概而论。
	if (isStyleToken(value)) return false;
	// 文件/模块/协议字符串
	if (/\.(ts|tsx|js|json|md|yml|yaml|toml|rs|py|sh|css|node)$/.test(value)) return false;
	if (/^(node:|https?:\/\/|\/|\.\/|\.\.\/|@[a-z])/.test(value)) return false;
	if (/^[a-z][a-zA-Z0-9]*\.[a-z]/.test(value)) return false;
	// 纯符号/格式串/键名
	if (!/[A-Za-z]{2}/.test(value.replace(/\\[nrt]/g, ""))) return false;
	// 至少要像自然语言：包含空格，或首字母大写的单词。枚举/分组数组里
	// 的单个大写缩写（LSP、Git、AI）本身就是完整文案，允许通过。
	if (!options.allowSingleToken && !/\s/.test(value.trim()) && !/^[A-Z][a-z]/.test(value)) return false;
	// 以符号/竖线开头的片段是状态片段，不是独立文案
	if (/^[|·—–\-→←]/.test(value.trim())) return false;
	// 命令行用法串（占位符 + 选项）
	if (/^[[<]/.test(value.trim())) return false;
	if (/(?:^|\s)--[a-z][\w-]*/.test(value) && !/[.!?]\s/.test(value)) return false;
	// 纯代码/协议片段
	if (/^(exit|git|npm|bun|omp)\s+\S+$/.test(value.trim())) return false;
	if (/^[a-z][\w.-]+(?:\s*=\s*\S+)+$/.test(value.trim())) return false;
	return true;
}

/** 从 AST 中提取候选文案。 */
export function extractFromSource(
	relativePath: string,
	code: string,
	onHit: (source: string, kind: string) => void,
): void {
	let ast: unknown;
	try {
		ast = parse(code, { sourceType: "module", plugins: ["typescript", "jsx"] });
	} catch {
		return;
	}
	const allowWholeFile = allowsWholeFileLiterals(relativePath);

	const record = (value: string, kind: string) => {
		if (
			looksLikeUiProse(value, {
				// 数组元素与界面属性（label/title/hint…）里的单词本身就是完整文案，
				// 例如底部提示行的 `change`、`close`。
				allowSingleToken: kind === "array-literal" || kind.startsWith("prop:") || kind.startsWith("call:"),
			})
		) {
			onHit(value, kind);
		}
	};

	traverse(ast, {
		/**
		 * 界面文案常量：`const SCOPE_LABELS = { user: "Every project", … }`。
		 *
		 * 这类对象是纯显示映射（键是内部枚举，值是展示文本），整体捕获；
		 * 命名后缀作为白名单，避免把协议常量表误当文案。
		 */
		VariableDeclarator(p: any) {
			const id = p.node.id;
			if (id.type !== "Identifier") return;
			if (!/_(?:LABELS?|TITLES?|CHOICES|TEXT|HINTS?|HEADERS?|DESCRIPTIONS?|MESSAGES?|NOTES?)$/.test(id.name)) {
				return;
			}
			const init = p.node.init;
			if (!init) return;
			const collectObject = (object: any): void => {
				if (object.type !== "ObjectExpression") return;
				for (const property of object.properties) {
					if (property.type !== "ObjectProperty") continue;
					const value = property.value;
					if (value.type === "StringLiteral") record(value.value, `map:${id.name}`);
					else if (value.type === "TemplateLiteral" && value.expressions.length === 0) {
						record(value.quasis.map((q: any) => q.value.cooked ?? "").join(""), `map:${id.name}`);
					} else if (value.type === "ObjectExpression") {
						// 形如 { icon, label, description } 的嵌套条目
						collectObject(value);
					}
				}
			};
			collectObject(init);
		},
		ObjectProperty(p: any) {
			const key = p.node.key;
			const name = key.type === "Identifier" ? key.name : key.type === "StringLiteral" ? key.value : null;
			if (!name) return;
			const value = p.node.value;

			/** 选项对象：只取 `label` 与 `description`。 */
			const recordOptionObject = (object: any): void => {
				for (const property of object.properties ?? []) {
					if (property.type !== "ObjectProperty") continue;
					const optionKey = property.key;
					const optionName =
						optionKey.type === "Identifier"
							? optionKey.name
							: optionKey.type === "StringLiteral"
								? optionKey.value
								: null;
					if (optionName !== "label" && optionName !== "description") continue;
					const optionValue = property.value;
					if (optionValue.type === "StringLiteral") record(optionValue.value, `option:${optionName}`);
					else if (optionValue.type === "TemplateLiteral" && optionValue.expressions.length === 0) {
						record(optionValue.quasis.map((q: any) => q.value.cooked ?? "").join(""), `option:${optionName}`);
					}
				}
			};

			// 子菜单选项：`options: [{ value, label, description }]`
			if ((name === "options" || name === "choices") && value.type === "ArrayExpression") {
				for (const element of value.elements) {
					if (element?.type === "ObjectExpression") recordOptionObject(element);
				}
			}

			if (!TRANSLATABLE_PROPERTIES.has(name)) return;
			if (value.type === "StringLiteral") record(value.value, `prop:${name}`);
			else if (value.type === "TemplateLiteral" && value.expressions.length === 0) {
				record(value.quasis.map((q: any) => q.value.cooked ?? "").join(""), `prop:${name}`);
			} else if (value.type === "ArrayExpression" && /^(labels|hints|groups)$/.test(name)) {
				for (const element of value.elements) {
					if (element?.type === "StringLiteral") record(element.value, `prop:${name}[]`);
				}
			}
		},
		CallExpression(p: any) {
			const callee = p.node.callee;
			const name =
				callee.type === "Identifier"
					? callee.name
					: callee.type === "MemberExpression" && callee.property.type === "Identifier"
						? callee.property.name
						: null;
			if (!name || !TRANSLATABLE_CALLS.has(name)) return;
			const first = p.node.arguments[0];
			if (first?.type === "StringLiteral") record(first.value, `call:${name}`);
			else if (first?.type === "TemplateLiteral" && first.expressions.length === 0) {
				record(first.quasis.map((q: any) => q.value.cooked ?? "").join(""), `call:${name}`);
			}
		},
		NewExpression(p: any) {
			const callee = p.node.callee;
			if (callee.type !== "Identifier" || !TRANSLATABLE_CONSTRUCTORS.has(callee.name)) return;
			const first = p.node.arguments[0];
			if (first?.type === "StringLiteral") record(first.value, `new:${callee.name}`);
		},
		StringLiteral(p: any) {
			if (!allowWholeFile) return;
			const parent = p.parent;
			// 跳过导入语句、导出声明与对象键
			if (
				parent.type === "ImportDeclaration" ||
				parent.type === "ExportNamedDeclaration" ||
				parent.type === "ExportAllDeclaration" ||
				(parent.type === "ObjectProperty" && parent.key === p.node) ||
				parent.type === "TSLiteralType"
			) {
				return;
			}
			// 数组元素（如 TAB_GROUPS 的分组名）本身就是完整文案，不再要求多词；
			// 其余位置要求至少两个单词，避免把单个标识符误当文案。
			const isArrayElement = parent.type === "ArrayExpression";
			if (!isArrayElement && p.node.value.trim().split(/\s+/).length < 2) return;
			record(p.node.value, isArrayElement ? "array-literal" : "literal");
		},
	});
}

/** 扫描整个仓库，返回抽取结果。 */
export function extractAll(root: string = ROOT): ExtractionResult {
	const hits = new Map<string, { files: Set<string>; kinds: Set<string> }>();
	const perFile = new Map<string, number>();

	for (const directory of ["packages/tui/src", "packages/coding-agent/src"]) {
		const absolute = path.join(root, directory);
		if (!fs.existsSync(absolute)) continue;
		for (const file of collectSources(absolute)) {
			const relative = path.relative(root, file).split(path.sep).join("/");
			if (!isIncludedFile(relative)) continue;
			const code = fs.readFileSync(file, "utf8");
			let fileHits = 0;
			extractFromSource(relative, code, (source, kind) => {
				fileHits++;
				const existing = hits.get(source);
				if (existing) {
					existing.files.add(relative);
					existing.kinds.add(kind);
				} else {
					hits.set(source, { files: new Set([relative]), kinds: new Set([kind]) });
				}
			});
			if (fileHits > 0) perFile.set(relative, fileHits);
		}
	}

	const entries = [...hits.entries()]
		.map(([source, info]) => ({ source, files: [...info.files], kinds: [...info.kinds] }))
		.sort((a, b) => b.files.length - a.files.length || a.source.localeCompare(b.source));

	return { entries, perFile };
}

function main(): void {
	const checkOnly = process.argv.includes("--check");
	const before = performance.now();
	const result = extractAll();
	const elapsed = Math.round(performance.now() - before);

	const byKind = new Map<string, number>();
	for (const entry of result.entries) {
		for (const kind of entry.kinds) byKind.set(kind, (byKind.get(kind) ?? 0) + 1);
	}

	process.stdout.write(
		`扫描完成：${result.entries.length} 条唯一界面文案，${result.perFile.size} 个文件，耗时 ${elapsed}ms\n`,
	);
	process.stdout.write("命中位置分布：\n");
	for (const [kind, count] of [...byKind.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)) {
		process.stdout.write(`  ${String(count).padStart(5)}  ${kind}\n`);
	}

	if (!checkOnly) {
		const output = path.join(import.meta.dir, "extracted.json");
		fs.writeFileSync(output, `${JSON.stringify(result.entries, null, 2)}\n`);
		process.stdout.write(`\n已写出 ${path.relative(ROOT, output)}\n`);
	}
}

if (import.meta.main) main();
