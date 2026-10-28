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
	PROTOCOL_CONSTANTS,
	TRANSLATABLE_CALL_LABEL_INDEX,
	TRANSLATABLE_CALLS,
	TRANSLATABLE_CONSTRUCTORS,
	TRANSLATABLE_PROPERTIES,
	allowsWholeFileLiterals,
	displayTextArgumentIndex,
	isIncludedFile,
	looksLikeProseValue,
	PROSE_ONLY_PROPERTIES,
} from "./rules";
import { translateByRule } from "./rules-translate";

const traverse = (traverseModule as unknown as { default?: unknown }).default ?? traverseModule;

const ROOT = path.join(import.meta.dir, "..");
const DICTIONARY_PATH = path.join(import.meta.dir, "dictionary.json");
const REPORT_PATH = path.join(import.meta.dir, "report.json");

/**
 * 模板插值在词典键里的占位符。
 *
 * 词典用 `\u0000` 表示插值位置，例如
 * `"Switch model for this session (same as \u0000); accepts …"`。
 * 它不会出现在任何界面文案里，因此不会与真实字符冲突。
 */
const PLACEHOLDER = "\u0000";

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
	onMatch?: (source: string) => void,
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
		// 词典条目被源码命中，从「失效条目」中移除
		onMatch?.(value);
		if (typeof node.start !== "number" || typeof node.end !== "number") return;
		onHit({ start: node.start, end: node.end }, value, kind, translated);
	};

	/** 无插值模板字符串的字面内容；有插值时由调用方跳过。 */
	const templateText = (node: any): string =>
		node.quasis.map((quasi: any) => quasi.value.cooked ?? "").join("");

	/**
	 * 模板字符串里带插值的整句文案。
	 *
	 * `Switch model for this session (same as ${key})` 这类文案的英文在
	 * 插值两侧，AST 只能看到片段。这里把插值替换成占位符 `\u0000`，
	 * 用占位符形态在词典里查整句，再把译文按占位符切回源码片段。
	 */
	const considerInterpolatedTemplate = (node: any, kind: string): void => {
		const quasis: any[] = node.quasis;
		if (quasis.length < 2) return;
		const parts = quasis.map(quasi => quasi.value.cooked ?? "");
		const templateKey = parts.join(PLACEHOLDER);
		const translated = dictionary.get(templateKey);
		if (translated === undefined || translated === templateKey) return;
		const translatedParts = translated.split(PLACEHOLDER);
		// 占位符数量必须一致，否则无法安全映射回插值。
		if (translatedParts.length !== parts.length) return;
		onMatch?.(templateKey);
		for (const [index, quasi] of quasis.entries()) {
			const value = parts[index];
			const text = translatedParts[index];
			if (text === value) continue;
			if (typeof quasi.start !== "number" || typeof quasi.end !== "number") continue;
			// 转义交给 translateAll 统一做一次，这里再转会变成双重转义。
			onHit({ start: quasi.start, end: quasi.end }, value, `${kind}#part`, text);
		}
	};

	/** 处理模板字符串：无插值时整体替换，有插值时走占位符整句匹配。 */
	const considerTemplate = (node: any, kind: string): void => {
		if (node.type !== "TemplateLiteral") return;
		if (node.expressions.length > 0) {
			// `examples` 是「注释 + 命令」拼成的帮助片段，命令名走插值。
			// 只逐段翻译无插值的字面片段，插值本身原样保留。
			if (kind === "prop:examples") {
				for (const quasi of node.quasis) {
					const value = quasi.value.cooked ?? "";
					const translated = dictionary.get(value);
					if (translated === undefined || translated === value) continue;
					onMatch?.(value);
					if (typeof quasi.start !== "number" || typeof quasi.end !== "number") continue;
					onHit({ start: quasi.start, end: quasi.end }, value, `${kind}#part`, translated);
				}
				return;
			}
			considerInterpolatedTemplate(node, kind);
			return;
		}
		const value = templateText(node);
		const translated = resolve(value, dictionary);
		if (translated === undefined || translated === value) return;
		onMatch?.(value);
		onHit({ start: node.start, end: node.end }, value, kind, translated);
	};

	/** 三元/逻辑表达式里的字符串分支：`a ? "X" : b ? "Y" : "Z"`。 */
	const considerLiteralBranches = (expression: any, kind: string, depth = 0): void => {
		if (depth > 5 || !expression) return;
		if (expression.type === "StringLiteral") consider(expression, kind, expression.value);
		else if (expression.type === "TemplateLiteral") considerTemplate(expression, kind);
		else if (expression.type === "ConditionalExpression") {
			considerLiteralBranches(expression.consequent, kind, depth + 1);
			considerLiteralBranches(expression.alternate, kind, depth + 1);
		} else if (expression.type === "LogicalExpression") {
			considerLiteralBranches(expression.left, kind, depth + 1);
			considerLiteralBranches(expression.right, kind, depth + 1);
		}
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
			// 会进入协议 enum 的常量不能译（见 PROTOCOL_CONSTANTS）。
			if (PROTOCOL_CONSTANTS[id.name] === true) return;
			// 后缀白名单 + `helpText`（controller 里的帮助文本数组，camelCase 无后缀）
			// + `title`（面板标题，如变更日志的「最近的变更」/「最近 N 个版本」）。
			if (!/^(?:helpText|title|.*_(?:LABELS?|TITLES?|CHOICES|TEXT|HINTS?|HEADERS?|DESCRIPTIONS?|MESSAGES?|NOTES?|STATUS|WAIT|PROMPT|PLACEHOLDER|OPTION))$/.test(id.name)) {
				return;
			}
			const init = p.node.init;
			if (!init) return;
			// `const title = kind === "full" ? "Full Changelog" : "Recent Changes"`：
			// 标题常由三元分支给出，逐个分支查词典。是否替换仍由词典把关。
			if (init.type === "ConditionalExpression" || init.type === "LogicalExpression") {
				considerLiteralBranches(init, `const:${id.name}`);
				return;
			}
			// `const NATIVE_TITLE = "Plan review"`：单值的界面常量。
			if (init.type === "StringLiteral") {
				consider(init, `const:${id.name}`, init.value);
				return;
			}
			// `const helpText = ["Manage …", …].join("\n")`：帮助文本是字符串数组
			// 再 join，元素本身是完整文案。是否替换仍由词典把关。
			if (init.type === "ArrayExpression" || (init.type === "CallExpression" && init.callee?.property?.name === "join" && init.callee?.object?.type === "ArrayExpression")) {
				const elements = init.type === "ArrayExpression" ? init.elements : init.callee.object.elements;
				for (const element of elements) {
					if (element?.type === "StringLiteral") consider(element, `array:${id.name}`, element.value);
					else if (element?.type === "TemplateLiteral") considerTemplate(element, `array:${id.name}`);
				}
				return;
			}
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
			/** 宽泛属性（head/k/action…）只接受句子形态的值，避免改坏协议枚举。 */
			const proseOnly = PROSE_ONLY_PROPERTIES[name] === true;
			const accept = (text: string): boolean => !proseOnly || looksLikeProseValue(text);
			/** 属性值可能是三元/逻辑表达式（`lead: ok ? "…" : "…"`），逐个分支处理。 */
			const considerExpression = (expression: any, kind: string): void => {
				if (expression.type === "StringLiteral") {
					if (accept(expression.value)) consider(expression, kind, expression.value);
				} else if (expression.type === "TemplateLiteral") {
					if (accept(templateText(expression))) considerTemplate(expression, kind);
				} else if (expression.type === "ConditionalExpression") {
					considerExpression(expression.consequent, kind);
					considerExpression(expression.alternate, kind);
				} else if (expression.type === "LogicalExpression") {
					considerExpression(expression.left, kind);
					considerExpression(expression.right, kind);
				} else if (expression.type === "ObjectMethod") {
					// `get description() { return `…${key}…`; }`：描述由 getter 拼出，
					// 只处理其中的 return 语句。
					for (const statement of expression.body.body ?? []) {
						if (statement.type === "ReturnStatement" && statement.argument) {
							considerExpression(statement.argument, kind);
						}
					}
				}
			};
			if (TRANSLATABLE_PROPERTIES.has(name)) {
				if (value.type === "ArrayExpression" && /^(labels|hints|groups|examples)$/.test(name)) {
					for (const element of value.elements) {
						if (element?.type === "StringLiteral") consider(element, `prop:${name}[]`, element.value);
						else if (element?.type === "TemplateLiteral") considerTemplate(element, `prop:${name}`);
					}
				} else {
					considerExpression(value, `prop:${name}`);
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
		/** `get description() { return `…`; }`：getter 形式的界面文案。 */
		ObjectMethod(p: any) {
			const key = p.node.key;
			const name = key.type === "Identifier" ? key.name : key.type === "StringLiteral" ? key.value : null;
			if (!name || !TRANSLATABLE_PROPERTIES.has(name)) return;
			for (const statement of p.node.body?.body ?? []) {
				if (statement.type !== "ReturnStatement" || !statement.argument) continue;
				const argument = statement.argument;
				if (argument.type === "StringLiteral") consider(argument, `prop:${name}`, argument.value);
				else if (argument.type === "TemplateLiteral") considerTemplate(argument, `prop:${name}`);
			}
		},
		CallExpression(p: any) {
			const callee = p.node.callee;
			const name =
				callee.type === "Identifier"
					? callee.name
					: callee.type === "MemberExpression" && callee.property.type === "Identifier"
						? callee.property.name
						: callee.type === "MemberExpression" && callee.property.type === "PrivateName"
							? // `this.#showReport("…", …)`：私有方法同样只按函数名查白名单。
								callee.property.id.name
							: null;
			if (!name) return;
			if (TRANSLATABLE_CALLS.has(name)) {
				// `errorText(resultText(r) || "No todos")`、`toolHead(q, ok ? "a" : "b")`：
				// 回退文案藏在逻辑/条件表达式的分支里，逐个分支认词典。
				// 只沿分支/数组下钻，不进入普通函数调用的实参——那里可能是在
				// 比较工具输出。数组与 `[…].join()` 是 UI 报告的正文构造。
				const walk = (expression: any, depth: number): void => {
					if (depth > 5) return;
					if (expression?.type === "StringLiteral") consider(expression, `call:${name}`, expression.value);
					else if (expression?.type === "TemplateLiteral") considerTemplate(expression, `call:${name}`);
					else if (expression?.type === "LogicalExpression") {
						walk(expression.left, depth + 1);
						walk(expression.right, depth + 1);
					} else if (expression?.type === "ConditionalExpression") {
						walk(expression.consequent, depth + 1);
						walk(expression.alternate, depth + 1);
					} else if (expression?.type === "ArrayExpression") {
						for (const element of expression.elements) walk(element, depth + 1);
					} else if (
						expression?.type === "CallExpression" &&
						expression.callee?.property?.name === "join" &&
						expression.callee?.object?.type === "ArrayExpression"
					) {
						walk(expression.callee.object, depth + 1);
					}
				};
				walk(p.node.arguments[TRANSLATABLE_CALL_LABEL_INDEX[name] ?? 0], 0);
				// 报告/确认/选择器的第二个实参也是正文（`#showReport(标题, 正文)`、
				// `showHookConfirm(标题, 消息)`、`showHookSelector(标题, 选项[])`）。
				// 其余调用（span(text, kind)、toolHead(q, ok)…）的第二实参是
				// 渲染属性/条件，不能走。
				if (name === "showReport" || name === "showHookConfirm" || name === "showHookSelector") {
					walk(p.node.arguments[1], 0);
				}
				return;
			}
			// `theme.fg("muted", "…")`、`chalk.dim("…")`、`console.log("…")`：
			// 展示文案在第 2/1/1 个实参上，只有整串命中词典才会替换。
			const objectName =
				callee.type === "MemberExpression" && callee.object.type === "Identifier"
					? callee.object.name
					: null;
			const index = displayTextArgumentIndex(objectName, name);
			if (index === undefined) return;
			const argument = p.node.arguments[index];
			if (argument?.type === "StringLiteral") consider(argument, `display:${objectName}.${name}`, argument.value);
			else if (argument?.type === "TemplateLiteral") considerTemplate(argument, `display:${objectName}.${name}`);
		},
		NewExpression(p: any) {
			const callee = p.node.callee;
			if (callee.type !== "Identifier") return;
			// `new HookSelectorComponent(title, ["Yes", "No"], …)`：对话框标题与选项
			// 都是界面文案。选项同时是回传值，因此比较处需中英双认
			// （见 i18n/patch-label-compare.ts）。
			if (callee.name === "HookSelectorComponent") {
				const [title, options] = p.node.arguments;
				if (title?.type === "StringLiteral") consider(title, "new:selector:title", title.value);
				else if (title?.type === "TemplateLiteral") considerTemplate(title, "new:selector:title");
				if (options?.type === "ArrayExpression") {
					for (const element of options.elements) {
						if (element?.type === "StringLiteral") consider(element, "new:selector:option", element.value);
						else if (element?.type === "TemplateLiteral") considerTemplate(element, "new:selector:option");
					}
				}
				return;
			}
			if (!TRANSLATABLE_CONSTRUCTORS.has(callee.name)) return;
			const first = p.node.arguments[0];
			if (first?.type === "StringLiteral") consider(first, `new:${callee.name}`, first.value);
			else if (first?.type === "TemplateLiteral") considerTemplate(first, `new:${callee.name}`);
		},
		/**
		 * `this.searchInput.placeholder = "Type to search"`：把界面文案写进
		 * 成员属性。属性名在 `TRANSLATABLE_PROPERTIES` 内才认，避免把
		 * 协议字段（`this.headers["Content-Type"] = …`）当成文案。
		 */
		AssignmentExpression(p: any) {
			const left = p.node.left;
			if (left.type !== "MemberExpression" || left.property.type !== "Identifier") return;
			if (!TRANSLATABLE_PROPERTIES.has(left.property.name)) return;
			const right = p.node.right;
			if (right?.type === "StringLiteral") consider(right, `assign:${left.property.name}`, right.value);
			else if (right?.type === "TemplateLiteral") considerTemplate(right, `assign:${left.property.name}`);
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
		/**
		 * 整文件模式下的模板字符串：无插值整串替换，有插值按 `\u0000`
		 * 占位符整句查词典（如 oauth-reauth.ts 的
		 * `Server \"${name}\" is disabled. …`）。
		 */
		TemplateLiteral(p: any) {
			if (!allowWholeFile) return;
			if (p.parent.type === "ObjectProperty" && p.parent.key === p.node) return;
			considerTemplate(p.node, p.node.expressions.length === 0 ? "literal" : "interpolated");
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

/** 模板字符串片段里只需转义反引号、反斜杠与美元符号。 */
function escapeTemplatePart(translated: string): string {
	return translated.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
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
	/** 词典中从未被源码命中的条目：上游改动文案后，这些键会失效。 */
	const missing = new Set<string>(dictionary.keys());
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

			findReplacements(
				relative,
				code,
				dictionary,
				(range, source, kind, text) => {
					// 模板字符串的字面片段替换的是片段内容本身，不能加引号。
					const replacement = kind.endsWith("#part")
						? escapeTemplatePart(text)
						: quoteLike(code.slice(range.start, range.end), text);
					internal.push({
						file: relative,
						line: lineOf(lineStarts, range.start),
						kind,
						source,
						text,
						start: range.start,
						end: range.end,
						replacement,
					});
				},
				source => missing.delete(source),
			);

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

	// 词典里已不再被源码命中的条目：上游改了文案、或该条已译成中文。
	// 翻译是按原文精确匹配的，重跑时已翻译的条目自然不再命中——这不代表
	// 词典失效，而是「本仓库源码已处于汉化状态」。因此只在有替换发生时才
	// 提示，避免每次重跑都刷出全部条目。
	if (result.missing.length > 0 && result.replacements.length > 0) {
		process.stdout.write(
			`\n本次未命中的词典条目：${result.missing.length} 条（多数已在此前译好）。` +
				`\n示例：${result.missing
					.slice(0, 5)
					.map(s => JSON.stringify(s.slice(0, 50)))
					.join(", ")}\n`,
		);
	}

	if (showReport) {
		for (const item of result.replacements.slice(0, 40)) {
			process.stdout.write(
				`${item.file}:${item.line}  ${JSON.stringify(item.source)} → ${JSON.stringify(item.text)}\n`,
			);
		}
	}
}

if (import.meta.main) main();
