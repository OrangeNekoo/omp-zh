#!/usr/bin/env bun
/**
 * 让「解析显示文案」的比较语句跟随词典翻译。
 *
 * `/session` 面板不是直接渲染字符串，而是先解析一份「键: 值」报告：
 * `session-info-overlay.ts` 用 `head === "Provider"`、`entry.k === "File"`
 * 这类**英文原值比较**来分组、合并与格式化。汉化把报告里的键改成中文后，
 * 这些比较会全部落空——分组、成本合计、仅追加行的归位都会失效。
 *
 * 这里把比较语句里的英文键替换成词典译文，使解析方与生产方保持同一套
 * 标签。只处理显式列出的报告键，且只在两个解析文件内生效：
 * 其余位置的比较（例如 `textContent.includes("No files found")`）比较的
 * 是工具输出，那部分不翻译，必须保持英文。
 *
 * 幂等：替换后的比较值是中文，不再命中英文键表。
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

/** 读取词典。 */
function loadDictionary(): Record<string, string> {
	const file = path.join(import.meta.dir, "dictionary.json");
	return JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, string>;
}

/** 把 `x === "Key"` / `x !== "Key"` 里的键换成译文。 */
export function patchReportKeyComparisons(code: string, dictionary: Record<string, string>): string {
	let output = code;
	for (const key of REPORT_KEYS) {
		// 报告行写作 `Key:`（解析时冒号被剥掉），词典按带冒号的原样收录。
		const label = dictionary[`${key}:`] ?? dictionary[key];
		if (label === undefined) continue;
		const translated = label.replace(/[：:]\s*$/, "");
		if (translated === key) continue;
		const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		// 只替换比较运算符右侧的字符串字面量，保留原引号与缩进。
		const pattern = new RegExp(`(===|!==)\\s*"${escaped}"`, "g");
		output = output.replace(pattern, `$1 "${translated}"`);
	}
	return output;
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
		process.stdout.write("报告键比较已与词典一致，无需改动。\n");
		return;
	}
	process.stdout.write(`已同步报告键比较（${changed.length} 个文件）：\n`);
	for (const file of changed) process.stdout.write(`  ${file}\n`);
}

if (import.meta.main) main();
