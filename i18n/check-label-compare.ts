#!/usr/bin/env bun
/**
 * 校验「标签已译、比较仍英文」的分支失效隐患是否已被处理。
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
 * 面板看起来正常，点了没反应。
 *
 * ## 为什么用显式清单
 *
 * 同一份英文字符串在不同位置可能语义完全不同：`event.act === "close"`
 * 是事件 id（协议值，不能译），而 `actionHint("tui.select.cancel", "close")`
 * 是提示标签（该译）。两者字面相同，自动判据无法可靠区分——把这类
 * 协议值也改成双认，反而会放宽事件路由的判定条件。
 *
 * 因此这里采用与 `i18n/patch-report-keys.ts` 一致的做法：**人工确认的
 * 显式清单**。清单由 `i18n/patch-label-compare.ts` 负责改写，本脚本
 * 负责闸门——确认清单里的每一项都已是双认形式，没有回退。
 *
 * 用法：
 *   bun i18n/check-label-compare.ts   # 有未处理项时以非零码退出
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { LABEL_COMPARISONS, PREFIX_COMPARISONS } from "./patch-label-compare";

const ROOT = path.join(import.meta.dir, "..");

const findings: string[] = [];

for (const [relative, labels] of Object.entries(LABEL_COMPARISONS)) {
	const file = path.join(ROOT, relative);
	if (!fs.existsSync(file)) {
		findings.push(`${relative}\t文件不存在`);
		continue;
	}
	const code = fs.readFileSync(file, "utf8");
	for (const label of labels) {
		const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		// 裸比较：`x === "Label"` / `x !== "Label"`。
		const bare = new RegExp(`[!=]==?\\s*"${escaped}"`, "g");
		for (const match of code.matchAll(bare)) {
			const at = code.slice(0, match.index).split("\n").length;
			findings.push(`${relative}:${at}\t${JSON.stringify(label)}\t仍是裸比较，未做中英双认`);
		}
	}
}

for (const [relative, prefixes] of Object.entries(PREFIX_COMPARISONS)) {
	const file = path.join(ROOT, relative);
	if (!fs.existsSync(file)) continue;
	const code = fs.readFileSync(file, "utf8");
	for (const prefix of Object.keys(prefixes)) {
		const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const bare = new RegExp(`\\.startsWith\\("${escaped}"\\)`, "g");
		for (const match of code.matchAll(bare)) {
			const at = code.slice(0, match.index).split("\n").length;
			findings.push(`${relative}:${at}\t${JSON.stringify(prefix)}\t仍是裸前缀判定，未做中英双认`);
		}
	}
}

if (findings.length === 0) {
	process.stdout.write("标签比较均已做中英双认处理。\n");
	process.exit(0);
}
process.stdout.write(`发现 ${findings.length} 处未处理的标签比较：\n`);
for (const finding of findings) process.stdout.write(`  ${finding}\n`);
process.exit(1);
