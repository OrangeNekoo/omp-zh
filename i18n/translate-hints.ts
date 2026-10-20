#!/usr/bin/env bun
/**
 * 翻译「键位 + to + 动作」这类拼接式提示。
 *
 * AST 重写器只能看到完整的字符串字面量，而 TUI 里大量提示是模板字符串
 * 拼出来的：
 *
 *   `${editorKey("tui.select.cancel")} to close`
 *
 * 这类片段的英文部分是一个稳定的小词表（close、cancel、expand…）。本脚本
 * 以**行内正则**把 `${…} to <action>` 的动作词换成中文，只匹配 `${` 之后、
 * 明确的 ` to ` 分隔符之后的动作词，不会碰到普通文本。
 *
 * 幂等：动作词一旦变成中文，正则不再命中。
 *
 * 用法：
 *   bun i18n/translate-hints.ts            # 应用
 *   bun i18n/translate-hints.ts --dry-run  # 只报告
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { isIncludedFile } from "./rules";

const ROOT = path.join(import.meta.dir, "..");

/** 动作词 → 中文。按长度降序替换，避免 `cancel` 先于 `cancel it first` 命中。 */
const ACTIONS: Readonly<Record<string, string>> = {
	"expand all": "全部展开",
	"collapse all": "全部折叠",
	"go back": "返回",
	"follow up": "追问",
	"branch": "分支",
	"it first": "先中断",
	"cancel it first": "先中断",
	"jump sections": "跳转分节",
	"jump tabs": "跳转标签页",
	"switch tabs": "切换标签页",
	"exit search": "退出搜索",
	"return first": "返回第一项",
	"to settings": "到设置",
	cycle: "循环",
	retry: "重试",
	save: "保存",
	select: "选择",
	edit: "编辑",
	close: "关闭",
	cancel: "取消",
	expand: "展开",
	collapse: "折叠",
	continue: "继续",
	return: "返回",
	toggle: "切换",
	open: "打开",
	confirm: "确认",
	submit: "提交",
	dismiss: "忽略",
	scroll: "滚动",
	navigate: "导航",
	search: "搜索",
	filter: "筛选",
	reload: "重新加载",
	refresh: "刷新",
	copy: "复制",
	paste: "粘贴",
	delete: "删除",
	remove: "移除",
	add: "添加",
	send: "发送",
	stop: "停止",
	start: "开始",
	resume: "恢复",
	pause: "暂停",
	clear: "清除",
	reset: "重置",
	apply: "应用",
	discard: "放弃",
	quit: "退出",
	exit: "退出",
	change: "更改",
	move: "移动",
	pick: "选择",
	view: "查看",
	show: "显示",
	hide: "隐藏",
	skip: "跳过",
	undo: "撤销",
	redo: "重做",
};

/** 长词优先，避免 `cancel` 抢在 `cancel it first` 前面。 */
const ORDERED_ACTIONS = Object.entries(ACTIONS).sort((a, b) => b[0].length - a[0].length);

function collectSources(dir: string, out: string[] = []): string[] {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "test") continue;
			collectSources(full, out);
		} else if (entry.name.endsWith(".ts")) {
			out.push(full);
		}
	}
	return out;
}

/**
 * 把 `${…} to <action>` 里的动作词换成中文。
 *
 * 只匹配模板插值之后紧跟 ` to ` 的形式；`${x} to ${y}` 这类结构不动。
 */
function translateHint(text: string): { text: string; count: number } {
	let count = 0;
	let output = text;
	for (const [english, chinese] of ORDERED_ACTIONS) {
		// `} to close` —— 前面必须是插值结束的 `}`，后面是词边界
		const pattern = new RegExp(`(\\}\\s+to\\s+)${english.replace(/ /g, "\\s+")}(?=[\\s\`"'\\)\\]\\}|,;·]|$)`, "g");
		output = output.replace(pattern, (_match, prefix: string) => {
			count++;
			return `${prefix}${chinese}`;
		});
	}
	return { text: output, count };
}

function main(): void {
	const dryRun = process.argv.includes("--dry-run");
	let total = 0;
	let filesChanged = 0;
	const perFile: [string, number][] = [];

	for (const directory of ["packages/tui/src", "packages/coding-agent/src"]) {
		const absolute = path.join(ROOT, directory);
		if (!fs.existsSync(absolute)) continue;
		for (const file of collectSources(absolute)) {
			const relative = path.relative(ROOT, file).split(path.sep).join("/");
			// 只处理界面文件：`tools/read.ts` 这类给模型看的工具输出里，
			// `Use :1 to read…` 是提示词的一部分，不能改。
			if (!isIncludedFile(relative)) continue;
			const source = fs.readFileSync(file, "utf8");
			const { text, count } = translateHint(source);
			if (count === 0 || text === source) continue;
			total += count;
			filesChanged++;
			perFile.push([relative, count]);
			if (!dryRun) fs.writeFileSync(file, text, "utf8");
		}
	}

	perFile.sort((a, b) => b[1] - a[1]);
	process.stdout.write(`${dryRun ? "[dry-run] " : ""}提示片段替换 ${total} 处，涉及 ${filesChanged} 个文件\n`);
	for (const [file, count] of perFile.slice(0, 12)) {
		process.stdout.write(`  ${String(count).padStart(4)}  ${file}\n`);
	}
}

if (import.meta.main) main();
