#!/usr/bin/env bun
/**
 * 让「选择器回传值」的比较**同时接受中英文标签**。
 *
 * ## 问题
 *
 * 上游用选项的 `label` 当回传值，再用英文原文比较分支：
 *
 * ```ts
 * const choice = await this.showHookSelector("…", ["Yes", "No"]);
 * return choice === "Yes";                       // ← 英文
 * ```
 *
 * 汉化把选项标签换成中文后，比较处仍是英文，条件永远不成立：
 * 面板看起来正常，点了没反应。上游测试直接喂英文标签，所以比较处
 * 不能只留中文。
 *
 * ## 修法
 *
 * 把 `x === "English"` 改写成 `labelEq(x, "English", "中文")`，
 * `x !== "English"` 改写成 `!labelEq(x, "English", "中文")`。
 * 改成函数调用而不是 `(a === "中" || a === "英")` 是为了幂等——
 * 改写后原位置不再有 `=== "Key"`，二次运行不会再次命中。
 *
 * 只处理**显式列出**的（文件, 标签）对：同一份英文串既可能是界面标签，
 * 也可能是协议 id、工具输出或错误分类关键词，机器无法可靠区分，
 * 由人工逐条确认更安全。
 *
 * 用法：
 *   bun i18n/patch-label-compare.ts            # 应用
 *   bun i18n/patch-label-compare.ts --dry-run  # 只报告
 */
import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.join(import.meta.dir, "..");

/**
 * 需要双认比较的（文件 → 英文标签）清单。
 *
 * 每一项都满足两个条件：
 *  1. 该英文串在同文件里被汉化成了展示标签（选项 label、按钮 label…）；
 *  2. 同文件里另有一处以英文原值比较它来决定分支。
 *
 * 少一条就不是 bug（标签与比较都保持英文，或标签根本没被译）。
 */
export const LABEL_COMPARISONS: Readonly<Record<string, readonly string[]>> = {
	// 计划审查面板：选项 label 已译成中文，分支仍拿英文比较——
	// 「批准并执行」「批准并压缩上下文」「完善计划」三个分支全部失效，
	// 等于计划模式无法批准。
	"packages/coding-agent/src/modes/interactive-mode.ts": [
		"Approve and execute",
		"Approve and compact context",
		"Refine plan",
	],
	// hook 确认框：选项 ["是", "否"] 已译，`result === "Yes"` 恒为 false，
	// 所有 hook 确认一律判否。
	"packages/coding-agent/src/modes/controllers/extension-ui-controller.ts": ["Yes", "No"],
	// /seance 的选项 label 已译，两个分支都进不去。
	"packages/coding-agent/src/slash-commands/seance.ts": ["Use saved model", "Choose another model"],
};

/**
 * 前缀判定也要双认：模型浏览器用 chip 标签的英文前缀识别「键位条」。
 * 标签模板译成中文后前缀判定失败，标题会显示成别的内容。
 *
 * 这里显式给出中文前缀，不走词典——词典里的键是模板形态
 * （`for \u0000`），前缀形态（`for `）没有对应条目。
 */
export const PREFIX_COMPARISONS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
	"packages/tui/src/overlays/model-hub.ts": { "for ": "适用于 " },
};

/** 注入到被改写文件顶部的比较函数（按实际用到的那个注入，避免未使用告警）。 */
const LABEL_EQ_MARKER = "function labelEq(";
const LABEL_EQ = `${LABEL_EQ_MARKER}actual: string | undefined, english: string, chinese: string): boolean {
	// 选项标签经汉化后是中文，而上游测试与英文环境给出英文；比较方不站队。
	return actual === english || actual === chinese;
}
`;

const LABEL_STARTS_WITH_MARKER = "function labelStartsWith(";
const LABEL_STARTS_WITH = `${LABEL_STARTS_WITH_MARKER}actual: string | undefined, english: string, chinese: string): boolean {
	return actual !== undefined && (actual.startsWith(english) || actual.startsWith(chinese));
}
`;

/** 取比较的左操作数：`choice`、`chip.label`、`event.value` 这类成员表达式。 */
const LHS = String.raw`(?<![\w$.\]])([A-Za-z_$][\w$]*(?:\s*(?:\??\.\s*[A-Za-z_$][\w$]*|\[[^\]\n]*\]))*)`;

/** 读取词典。 */
function loadDictionary(): Record<string, string> {
	const file = path.join(import.meta.dir, "dictionary.json");
	return JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, string>;
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 文件里是否调用了某个比较函数（排除定义本身）。 */
function usesHelper(code: string, name: string): boolean {
	return new RegExp(`(?<![\\w$.])${name}\\(`).test(code.replace(/function \w+\(/g, "def("));
}

/** 在 import 段之后插入用到的比较函数。 */
function injectHelpers(code: string): string {
	const helpers = [
		usesHelper(code, "labelEq") && !code.includes(LABEL_EQ_MARKER) ? LABEL_EQ : "",
		usesHelper(code, "labelStartsWith") && !code.includes(LABEL_STARTS_WITH_MARKER) ? LABEL_STARTS_WITH : "",
	].join("");
	if (helpers === "") return code;
	const matches = [...code.matchAll(/^import .*;\n/gm)];
	const at = matches.length > 0 ? matches[matches.length - 1].index! + matches[matches.length - 1][0].length : 0;
	return `${code.slice(0, at)}\n${helpers}${code.slice(at)}`;
}

/** 把某文件里针对指定英文标签的比较改成中英双认。 */
export function patchLabelComparisons(
	code: string,
	dictionary: Record<string, string>,
	labels: readonly string[],
	prefixes: Readonly<Record<string, string>>,
): string {
	let output = code;
	for (const label of labels) {
		const translated = dictionary[label];
		if (translated === undefined) continue;
		if (translated === label) continue;
		const escaped = escapeRegExp(label);
		const pattern = new RegExp(`${LHS}\\s*(===|!==)\\s*"${escaped}"`, "g");
		output = output.replace(pattern, (_match, lhs: string, op: string) => {
			const call = `labelEq(${lhs}, "${label}", "${translated}")`;
			return op === "!==" ? `!${call}` : call;
		});
	}
	for (const [prefix, translated] of Object.entries(prefixes)) {
		if (translated === prefix) continue;
		const escaped = escapeRegExp(prefix);
		const pattern = new RegExp(`${LHS}\\.startsWith\\("${escaped}"\\)`, "g");
		output = output.replace(pattern, (_match, lhs: string) =>
			`labelStartsWith(${lhs}, "${prefix}", "${translated}")`,
		);
	}
	return injectHelpers(output);
}

function main(): void {
	const dryRun = process.argv.includes("--dry-run");
	const dictionary = loadDictionary();
	const changed: string[] = [];
	for (const [relative, labels] of Object.entries(LABEL_COMPARISONS)) {
		const file = path.join(ROOT, relative);
		if (!fs.existsSync(file)) continue;
		const original = fs.readFileSync(file, "utf8");
		const patched = patchLabelComparisons(original, dictionary, labels, {});
		if (patched === original) continue;
		changed.push(relative);
		if (!dryRun) fs.writeFileSync(file, patched, "utf8");
	}
	for (const [relative, prefixes] of Object.entries(PREFIX_COMPARISONS)) {
		const file = path.join(ROOT, relative);
		if (!fs.existsSync(file)) continue;
		const original = fs.readFileSync(file, "utf8");
		const patched = patchLabelComparisons(original, dictionary, [], prefixes);
		if (patched === original) continue;
		if (!changed.includes(relative)) changed.push(relative);
		if (!dryRun) fs.writeFileSync(file, patched, "utf8");
	}
	if (changed.length === 0) {
		process.stdout.write("标签比较已同时接受中英文，无需改动。\n");
		return;
	}
	process.stdout.write(`${dryRun ? "将改写" : "已改写"}标签比较为中英双认（${changed.length} 个文件）：\n`);
	for (const file of changed) process.stdout.write(`  ${file}\n`);
}

if (import.meta.main) main();
