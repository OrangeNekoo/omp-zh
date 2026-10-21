#!/usr/bin/env bun
/**
 * 让「解析显示文案」的比较语句**同时接受中英文键**。
 *
 * `/session` 面板不是直接渲染字符串，而是先解析一份「键: 值」报告：
 * `session-info-overlay.ts` 用 `head === "Provider"`、`entry.k === "File"`
 * 这类**英文原值比较**来分组、合并与格式化。汉化把报告里的键改成中文后，
 * 这些比较会全部落空——分组、成本合计、仅追加行的归位都会失效。
 *
 * 这里把比较改写成 `reportKeyEq(expr, "英文", "中文")`：生产方与消费方任一侧
 * 的语言都能解析。改成函数调用而不是 `(a === "中" || a === "英")` 是为了幂等——
 * 改写后原位置不再有 `=== "Key"`，二次运行不会再次命中。
 *
 * 只处理显式列出的报告键，且只在两个解析文件内生效：其余位置的比较
 * （例如 `textContent.includes("No files found")`）比较的是工具输出，
 * 那部分不翻译，必须保持英文。
 */
import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.join(import.meta.dir, "..");

/** 参与报告解析的文件（相对仓库根目录）。 */
const PARSER_FILES: readonly string[] = [
	"packages/tui/src/overlays/session-info-overlay.ts",
	"packages/tui/src/overlays/agent-hub.ts",
];

/**
 * 报告里的键名。生产方用 `theme.bold("Provider")` / `theme.fg("dim", "Total:")`
 * 写出，汉化后变成中文；解析方的比较必须同步。
 */
const REPORT_KEYS: readonly string[] = [
	"Provider",
	"Cost",
	"Total",
	"File",
	"ID",
	"Append-Only",
	"Messages",
	"Tokens",
	"Task",
];

/** 注入到每个解析文件顶部的比较函数。 */
const HELPER_MARKER = "function reportKeyEq(";
const HELPER = `${HELPER_MARKER}actual: string | undefined, english: string, chinese: string): boolean {
	// 报告由本仓库的汉化源码产出（中文键），而上游测试与英文环境给出英文键；
	// 解析方不站队，两种都认，免得换个输入就丢分组。签名收 undefined 是为了
	// 完全对齐 x === "Key" 的语义——左侧可能是可选属性（facts[0]?.k）。
	return actual === english || actual === chinese;
}
`;

/** 读取词典。 */
function loadDictionary(): Record<string, string> {
	const file = path.join(import.meta.dir, "dictionary.json");
	return JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, string>;
}

/** 取键的左操作数：`section.head`、`entry.k`、`facts[0]?.k` 这类成员表达式。 */
const LHS = String.raw`(?<![\w$.\]])([A-Za-z_$][\w$]*(?:\s*(?:\??\.\s*[A-Za-z_$][\w$]*|\[[^\]\n]*\]))*)`;

/** 把 `x === "Key"` / `x !== "Key"` 改写成接受中英文两种键的比较。 */
export function patchReportKeyComparisons(code: string, dictionary: Record<string, string>): string {
	let output = code;
	for (const key of REPORT_KEYS) {
		// 报告行写作 `Key:`（解析时冒号被剥掉），词典按带冒号的原样收录。
		const label = dictionary[`${key}:`] ?? dictionary[key];
		if (label === undefined) continue;
		const translated = label.replace(/[：:]\s*$/, "");
		if (translated === key) continue;
		const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const pattern = new RegExp(`${LHS}\\s*(===|!==)\\s*"${escaped}"`, "g");
		output = output.replace(pattern, (_match, lhs: string, op: string) => {
			const call = `reportKeyEq(${lhs}, "${key}", "${translated}")`;
			return op === "!==" ? `!${call}` : call;
		});
	}
	if (output === code) return output;
	return output.includes(HELPER_MARKER) ? output : injectHelper(output);
}

/** 在 import 段之后插入 `reportKeyEq` 定义。 */
function injectHelper(code: string): string {
	const matches = [...code.matchAll(/^import .*;\n/gm)];
	const at = matches.length > 0 ? matches[matches.length - 1].index! + matches[matches.length - 1][0].length : 0;
	return `${code.slice(0, at)}\n${HELPER}${code.slice(at)}`;
}

function main(): void {
	const dictionary = loadDictionary();
	const changed: string[] = [];
	for (const relative of PARSER_FILES) {
		const file = path.join(ROOT, relative);
		if (!fs.existsSync(file)) continue;
		const original = fs.readFileSync(file, "utf8");
		const patched = patchReportKeyComparisons(original, dictionary);
		if (patched === original) continue;
		fs.writeFileSync(file, patched, "utf8");
		changed.push(relative);
	}
	if (changed.length === 0) {
		process.stdout.write("报告键比较已同时接受中英文，无需改动。\n");
		return;
	}
	process.stdout.write(`已改写报告键比较为中英文双认（${changed.length} 个文件）：\n`);
	for (const file of changed) process.stdout.write(`  ${file}\n`);
}

if (import.meta.main) main();
