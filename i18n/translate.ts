#!/usr/bin/env bun
/**
 * 汉化执行器：按词典把界面文案替换为简体中文。
 *
 * 设计要点：
 * 1. **幂等**：替换后的文本不再匹配英文词典，重复执行不会二次改写。
 * 2. **精确**：只重写 AST 定位到的字符串节点，保留原有引号风格、
 *    模板字符串、注释与代码格式。
 * 3. **可逆**：每次运行都会输出 i18n/report.json，记录每条替换
 *    （文件、行、原文、译文），便于审查与回退。
 * 4. **不碰提示词**：范围完全由 i18n/rules.ts 决定，模型提示词与
 *    工具实现不在范围内。
 *
 * 用法：
 *   bun i18n/translate.ts            # 执行替换并写报告
 *   bun i18n/translate.ts --dry-run  # 只统计将发生的替换，不改文件
 *   bun i18n/translate.ts --report   # 打印报告摘要
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
import { translateByRule } from "./rules-translate";

const traverse = (traverseModule as unknown as { default?: unknown }).default ?? traverseModule;

const ROOT = path.join(import.meta.dir, "..");
const DICTIONARY_PATH = path.join(import.meta.dir, "dictionary.json");
const REPORT_PATH = path.join(import.meta.dir, "report.json");

export interface Replacement {
	readonly file: string;
	readonly line: number;
	readonly kind: string;
	readonly source: string;
	readonly text: string;
}

export interface TranslateResult {
	readonly replacements: readonly Replacement[];
	readonly filesChanged: number;
	readonly missing: readonly string[];
}

interface Range {
	start: number;
	end: number;
}

/** 读取词典；键是英文原文，值是中文译文。 */
export function loadDictionary(file = DICTIONARY_PATH): Map<string, string> {
	if (!fs.existsSync(file)) return new Map();
	const raw = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, string>;
	return new Map(Object.entries(raw));
}

/** 先查词典，再尝试规则翻译。 */
function resolve(source: string, dictionary: Map<string, string>): string | undefined {
	const exact = dictionary.get(source);
	if (exact !== undefined) return exact;
	return translateByRule(source);
}

/** 递归收集源文件。 */
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

/**
 * 收集一个文件中所有需要替换的字符串节点。
 *
 * 返回的是源码区间而不是 AST 节点替换结果：直接做区间拼接能完整保留
 * 引号风格、转义与周围格式。
 */
function findReplacements(
	relativePath: string,
	code: string,
	dictionary: Map<string, string>,
	onHit: (range: Range, source: string, kind: string, text: string) => void,
): void {
	let ast: unknown;
	try {
		ast = parse(code, { sourceType: "module", plugins: ["typescript", "jsx"] });
	} catch {
		return;
	}
	const allowWholeFile = allowsWholeFileLiterals(relativePath);

	/** 判断一个 Literal 节点是否需要替换，并回报区间。 */
	const consider = (node: any, kind: string, value: string | undefined): void => {
		if (value === undefined) return;
		const translated = resolve(value, dictionary);
		if (translated === undefined || translated === value) return;
		if (typeof node.start !== "number" || typeof node.end !== "number") return;
		onHit({ start: node.start, end: node.end }, value, kind, translated);
	};

	/** 处理模板字符串：仅当没有插值时才整体替换。 */
	const considerTemplate = (node: any, kind: string): void => {
		if (node.type !== "TemplateLiteral" || node.expressions.length > 0) return;
		const value = node.quasis.map((q: any) => q.value.cooked ?? "").join("");
		const translated = resolve(value, dictionary);
		if (translated === undefined || translated === value) return;
		onHit({ start: node.start, end: node.end }, value, kind, translated);
	};

	/** 选项对象：只翻译 `label` 与 `description`。 */
	const translateOptionObject = (object: any): void => {
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
			if (optionValue.type === "StringLiteral") consider(optionValue, `option:${optionName}`, optionValue.value);
			else if (optionValue.type === "TemplateLiteral") considerTemplate(optionValue, `option:${optionName}`);
		}
	};

	traverse(ast, {
		/** 与 extract.ts 的界面文案常量规则保持一致。 */
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
					if (value.type === "StringLiteral") consider(value, `map:${id.name}`, value.value);
					else if (value.type === "TemplateLiteral") considerTemplate(value, `map:${id.name}`);
					else if (value.type === "ObjectExpression") collectObject(value);
				}
			};
			collectObject(init);
		},
		ObjectProperty(p: any) {
			const key = p.node.key;
			const name = key.type === "Identifier" ? key.name : key.type === "StringLiteral" ? key.value : null;
			if (!name) return;
			const value = p.node.value;
			if (TRANSLATABLE_PROPERTIES.has(name)) {
				if (value.type === "StringLiteral") consider(value, `prop:${name}`, value.value);
				else if (value.type === "TemplateLiteral") considerTemplate(value, `prop:${name}`);
				else if (value.type === "ArrayExpression" && /^(labels|hints|groups)$/.test(name)) {
					for (const element of value.elements) {
						if (element?.type === "StringLiteral") consider(element, `prop:${name}[]`, element.value);
					}
				}
			}
			// 子菜单选项：`options: [{ value, label, description }]` 或内联的
			// `{ value, label, description }` 对象。选项文本同样显示给用户，
			// 必须翻译。
			const isOptionsProperty = name === "options" || name === "choices";
			if (isOptionsProperty && value.type === "ArrayExpression") {
				for (const element of value.elements) {
					if (element?.type === "ObjectExpression") translateOptionObject(element);
				}
			}
			if (value.type === "ObjectExpression") translateOptionObject(value);
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
			if (first?.type === "StringLiteral") consider(first, `call:${name}`, first.value);
			else if (first?.type === "TemplateLiteral") considerTemplate(first, `call:${name}`);
		},
		NewExpression(p: any) {
			const callee = p.node.callee;
			if (callee.type !== "Identifier" || !TRANSLATABLE_CONSTRUCTORS.has(callee.name)) return;
			const first = p.node.arguments[0];
			if (first?.type === "StringLiteral") consider(first, `new:${callee.name}`, first.value);
			else if (first?.type === "TemplateLiteral") considerTemplate(first, `new:${callee.name}`);
		},
		StringLiteral(p: any) {
			if (!allowWholeFile) return;
			const parent = p.parent;
			if (
				parent.type === "ImportDeclaration" ||
				parent.type === "ExportNamedDeclaration" ||
				parent.type === "ExportAllDeclaration" ||
				(parent.type === "ObjectProperty" && parent.key === p.node) ||
				parent.type === "TSLiteralType" ||
				parent.type === "JSXAttribute"
			) {
				return;
			}
			// 数组元素（如 TAB_GROUPS 的分组名）本身就是完整文案；其余位置
			// 要求至少两个单词，避免把单个标识符误当文案。
			const isArrayElement = parent.type === "ArrayExpression";
			if (!isArrayElement && p.node.value.trim().split(/\s+/).length < 2) return;
			consider(p.node, isArrayElement ? "array-literal" : "literal", p.node.value);
		},
	});
}

/** 把译文安全地序列化为源码字面量，尽量沿用原来的引号。 */
function quoteLike(original: string, translated: string): string {
	const quote = original.startsWith('"') ? '"' : original.startsWith("'") ? "'" : '"';
	let body = translated;
	// 转义引号与反斜杠，保留换行为 \n
	body = body.replace(/\\/g, "\\\\").replace(/\r/g, "\\r").replace(/\n/g, "\\n");
	if (quote === '"') body = body.replace(/"/g, '\\"');
	else body = body.replace(/'/g, "\\'");
	return `${quote}${body}${quote}`;
}

/** 写盘前的语法校验：翻译结果必须仍是合法 TypeScript。 */
function canParse(code: string): boolean {
	try {
		parse(code, { sourceType: "module", plugins: ["typescript", "jsx"] });
		return true;
	} catch {
		return false;
	}
}

/**
 * 对单个文件应用替换。
 *
 * 同一字符串节点可能被多条规则同时命中（例如设置项同时匹配属性规则与
 * 整文件字面量规则），因此先按区间去重；区间重叠时保留跨度更大的那个，
 * 否则两次替换同一段源码会把代码写坏。
 */
function dedupeByRange(items: readonly InternalReplacement[]): InternalReplacement[] {
	const byRange = new Map<string, InternalReplacement>();
	for (const item of items) {
		const key = `${item.start}:${item.end}`;
		const existing = byRange.get(key);
		if (!existing || item.end - item.start > existing.end - existing.start) {
			byRange.set(key, item);
		}
	}
	return [...byRange.values()];
}

/** 对单个文件应用替换（从后往前，避免偏移错位）。 */
function applyReplacements(code: string, items: readonly InternalReplacement[]): string {
	const unique = dedupeByRange(items);
	const sorted = [...unique].sort((a, b) => b.start - a.start);
	let output = code;
	for (const item of sorted) {
		output = output.slice(0, item.start) + item.replacement + output.slice(item.end);
	}
	return output;
}

interface InternalReplacement {
	readonly file: string;
	readonly line: number;
	readonly kind: string;
	readonly source: string;
	readonly text: string;
	readonly start: number;
	readonly end: number;
	readonly replacement: string;
}

/** 执行整个仓库的翻译。 */
export function translateAll(options: { dryRun?: boolean; root?: string } = {}): TranslateResult {
	const root = options.root ?? ROOT;
	const dictionary = loadDictionary();
	const replacements: Replacement[] = [];
	const missing = new Set<string>();
	let filesChanged = 0;

	for (const directory of ["packages/tui/src", "packages/coding-agent/src"]) {
		const absolute = path.join(root, directory);
		if (!fs.existsSync(absolute)) continue;
		for (const file of collectSources(absolute)) {
			const relative = path.relative(root, file).split(path.sep).join("/");
			if (!isIncludedFile(relative)) continue;
			const code = fs.readFileSync(file, "utf8");
			const lineStarts = computeLineStarts(code);
			const internal: InternalReplacement[] = [];

			findReplacements(relative, code, dictionary, (range, source, kind, text) => {
				internal.push({
					file: relative,
					line: lineOf(lineStarts, range.start),
					kind,
					source,
					text,
					start: range.start,
					end: range.end,
					replacement: quoteLike(code.slice(range.start, range.end), text),
				});
			});

			if (internal.length === 0) continue;
			const uniqueItems = dedupeByRange(internal);
			const translated = applyReplacements(code, internal);

			// 安全闸：翻译后的源码必须仍能被解析。任何一次替换写坏了语法，
			// 都在这里中止，而不是把破损代码留在仓库里。
			if (!canParse(translated)) {
				throw new Error(`汉化后源码无法解析，已中止：${relative}`);
			}

			filesChanged++;
			for (const item of uniqueItems) {
				replacements.push({
					file: item.file,
					line: item.line,
					kind: item.kind,
					source: item.source,
					text: item.text,
				});
			}
			if (!options.dryRun) {
				fs.writeFileSync(file, translated, "utf8");
			}
		}
	}

	return {
		replacements,
		filesChanged,
		missing: [...missing],
	};
}

/**
 * 翻译纯文本资源：`tips.txt`（欢迎界面的提示语，每行一条）。
 *
 * TypeScript 之外的资源无法走 AST 流程，但它们是首次启动最显眼的文案，
 * 必须覆盖。以整行精确匹配翻译，未命中的行原样保留。
 */
function translateTipsFile(root: string, dryRun: boolean): number {
	const file = path.join(root, "packages/tui/src/prompt/tips.txt");
	const dictionaryFile = path.join(import.meta.dir, "tips-zh.json");
	if (!fs.existsSync(file) || !fs.existsSync(dictionaryFile)) return 0;

	const dictionary = JSON.parse(fs.readFileSync(dictionaryFile, "utf8")) as Record<string, string>;
	const lines = fs.readFileSync(file, "utf8").split("\n");
	let changed = 0;
	const translated = lines.map(line => {
		const text = dictionary[line];
		if (text === undefined || text === line) return line;
		changed++;
		return text;
	});
	if (changed > 0 && !dryRun) {
		fs.writeFileSync(file, translated.join("\n"), "utf8");
	}
	return changed;
}

function computeLineStarts(code: string): number[] {
	const starts = [0];
	for (let i = 0; i < code.length; i++) {
		if (code[i] === "\n") starts.push(i + 1);
	}
	return starts;
}

function lineOf(starts: readonly number[], offset: number): number {
	let low = 0;
	let high = starts.length - 1;
	while (low < high) {
		const mid = Math.ceil((low + high) / 2);
		if (starts[mid] <= offset) low = mid;
		else high = mid - 1;
	}
	return low + 1;
}

function main(): void {
	const dryRun = process.argv.includes("--dry-run");
	const showReport = process.argv.includes("--report");
	const dictionary = loadDictionary();
	process.stdout.write(`词典条目：${dictionary.size}\n`);

	const result = translateAll({ dryRun });
	const tipsChanged = translateTipsFile(ROOT, dryRun);
	if (tipsChanged > 0) {
		process.stdout.write(`欢迎提示语（tips.txt）替换 ${tipsChanged} 行\n`);
	}
	// dry-run 只是预演，不能把真实报告覆盖成空内容。
	if (!dryRun) {
		fs.writeFileSync(REPORT_PATH, `${JSON.stringify(result.replacements, null, 2)}\n`);
	}

	process.stdout.write(
		`${dryRun ? "[dry-run] " : ""}替换 ${result.replacements.length} 处，涉及 ${result.filesChanged} 个文件\n`,
	);
	const byFile = new Map<string, number>();
	for (const item of result.replacements) byFile.set(item.file, (byFile.get(item.file) ?? 0) + 1);
	for (const [file, count] of [...byFile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
		process.stdout.write(`  ${String(count).padStart(4)}  ${file}\n`);
	}
	process.stdout.write(`报告：${path.relative(ROOT, REPORT_PATH)}\n`);

	if (showReport) {
		for (const item of result.replacements.slice(0, 40)) {
			process.stdout.write(
				`${item.file}:${item.line}  ${JSON.stringify(item.source)} → ${JSON.stringify(item.text)}\n`,
			);
		}
	}
}

if (import.meta.main) main();
