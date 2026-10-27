#!/usr/bin/env bun
/**
 * 翻译「键位 + 动作」这类拼接式提示。
 *
 * AST 重写器只能看到完整的字符串字面量，而 TUI 里大量提示是模板字符串
 * 拼出来的，英文在插值**外面**：
 *
 *   `${editorKey("tui.select.cancel")} to close`
 *   `${upDown} models · ${enter} pick · ${cancel} cancel`
 *
 * 这类片段的英文部分是一个稳定的小词表（close、cancel、expand…）。
 * 本脚本定位模板字符串的**字面片段**，只改写片段里恰好是
 * `(to )?<动作短语>` 的那一段，其余原样保留。
 *
 * ## 为什么必须整短语查表
 *
 * 早先的实现按前缀匹配词表，`to cancel it first.` 会因为句号不在前瞻
 * 集合里而退化成 `to 取消 it first.`，`to edit search` 会变成
 * `to 编辑 search`——面板上出现中英混排。现在抓的是整段英文再整段查表，
 * 查不到就原样保留。
 *
 * ## 为什么只改「提示条」而不碰整句
 *
 * `A bash command is already running. Press ${key} to cancel it first.`
 * 里的插值前面是英文散文，属于整句文案，由 `i18n/dictionary.json` 的
 * `\u0000` 占位符条目负责；提示规则一旦插手就会留下半句英文。
 * 判据：插值前的片段为空、或只以 `·` `/` `|` 分隔符结尾，才算提示条。
 *
 * 幂等：动作短语一旦变成中文，查表不再命中。
 *
 * 用法：
 *   bun i18n/translate-hints.ts            # 应用
 *   bun i18n/translate-hints.ts --dry-run  # 只报告
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { parse } from "@babel/parser";
import { isIncludedFile } from "./rules";

const ROOT = path.join(import.meta.dir, "..");

/** 动作短语 → 中文。短语必须**整段**命中，不做前缀替换。 */
const ACTIONS: Readonly<Record<string, string>> = {
	// ── 多词短语 ────────────────────────────────────────────────
	"expand all": "全部展开",
	"collapse all": "全部折叠",
	"go back": "返回",
	"follow up": "追问",
	"cancel it first": "先中断",
	"jump sections": "跳转分节",
	"jump tabs": "跳转标签页",
	"switch tabs": "切换标签页",
	"exit search": "退出搜索",
	"return first": "返回第一项",
	"clear the search": "清除搜索",
	"edit search": "编辑搜索",
	"edit provider": "编辑服务商",
	"copy again": "再次复制",
	"show all": "显示全部",
	"view all": "查看全部",
	"add a host": "添加主机",
	"add a server": "添加服务器",
	"sign in": "登录",
	"test the connection": "测试连接",
	"see all configured hosts": "查看全部已配置主机",
	"see all configured servers": "查看全部已配置服务器",
	"see available servers": "查看可用服务器",
	"see existing servers": "查看已有服务器",
	"paste inline": "粘贴为内联",
	"stop profiling": "停止性能分析",
	"skip or continue": "跳过或继续",
	"apply role model": "应用角色模型",
	"use for this session": "用于本会话",
	"use for Task subagents": "用于 Task 子代理",
	"type to search": "输入以搜索",
	"type to filter": "输入以筛选",
	// ── 单词短语 ────────────────────────────────────────────────
	branch: "分支",
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
	choose: "选择",
	assign: "赋值",
	view: "查看",
	show: "显示",
	hide: "隐藏",
	skip: "跳过",
	undo: "撤销",
	redo: "重做",
	settings: "到设置",
	accept: "接受",
	back: "返回",
	kind: "类型",
	rows: "行",
	models: "模型",
	providers: "服务商",
	roles: "角色",
};

/**
 * 片段分隔符：把一行提示切成若干「键位 + 动作」小块。
 *
 * 不含 `/`：斜杠既可能是命令名（`/settings`）、也可能是两个键位的分隔
 * （`${a}/${b} to change`）。把它当分隔符会把 `/settings` 掐成 `settings`
 * 并对号入座，译出 `/到设置` 这种不存在的命令。
 */
const SEGMENT_SPLIT = /([·|])/;

/** 提示块：`(to )?<动作短语>`，可带前后空白与尾随标点。 */
const HINT_SEGMENT = /^(\s*)((?:to\s+)?)([A-Za-z][A-Za-z']*(?: [A-Za-z']+)*)([\s.,;:!?)\]）]*)$/;

/**
 * 插值前的片段是否停在提示条边界上。
 *
 * 空片段、纯空白、或以 `·` `/` `|` 结尾都算；以单词结尾的是散文句子，
 * 整句交给词典，提示规则不得插手。
 *
 * `/` 允许作边界（`${a}/${b} to change`），但**不能**作片段分隔符：
 * 斜杠命令名就在这种位置（`${key} or /settings`），一旦切开，`settings`
 * 会被当动作词译成 `/到设置` 这种不存在的命令。
 */
const HINT_BOUNDARY = /(?:^|[·/|])\s*$/;

/** 模板字符串字面片段（只取改写需要的最小结构）。 */
interface TemplateQuasi {
	readonly start: number;
	readonly end: number;
	readonly value: { readonly raw: string; readonly cooked: string | undefined };
}

interface TemplateLiteralNode {
	readonly type: "TemplateLiteral";
	readonly quasis: readonly TemplateQuasi[];
}

function isTemplateQuasi(value: unknown): value is TemplateQuasi {
	if (!value || typeof value !== "object") return false;
	const candidate = value as { start?: unknown; end?: unknown; value?: unknown };
	return (
		typeof candidate.start === "number" &&
		typeof candidate.end === "number" &&
		!!candidate.value &&
		typeof candidate.value === "object" &&
		typeof (candidate.value as { raw?: unknown }).raw === "string"
	);
}

function isTemplateLiteral(value: unknown): value is TemplateLiteralNode {
	if (!value || typeof value !== "object") return false;
	const candidate = value as { type?: unknown; quasis?: unknown };
	return (
		candidate.type === "TemplateLiteral" &&
		Array.isArray(candidate.quasis) &&
		candidate.quasis.every(isTemplateQuasi)
	);
}

/** 遍历属性时跳过的字段：位置信息与注释不承载代码结构。 */
const SKIP_KEYS: ReadonlySet<string> = new Set([
	"loc",
	"start",
	"end",
	"range",
	"extra",
	"tokens",
	"comments",
	"leadingComments",
	"trailingComments",
	"innerComments",
]);

/** 递归收集 AST 里所有模板字符串。 */
function collectTemplates(node: unknown, out: TemplateLiteralNode[] = []): TemplateLiteralNode[] {
	if (!node || typeof node !== "object") return out;
	if (Array.isArray(node)) {
		for (const item of node) collectTemplates(item, out);
		return out;
	}
	if (isTemplateLiteral(node)) out.push(node);
	for (const key of Object.keys(node)) {
		if (SKIP_KEYS.has(key)) continue;
		collectTemplates((node as Record<string, unknown>)[key], out);
	}
	return out;
}

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
 * 改写一个模板字面片段里的动作短语。
 *
 * @param text 片段内容
 * @param isHintContext 该片段是否处在提示条上下文里（紧跟在键位插值之后）
 * @returns 改写后的片段与命中次数
 */
export function translateFragment(text: string, isHintContext: boolean): { text: string; count: number } {
	if (!isHintContext) return { text, count: 0 };
	const parts = text.split(SEGMENT_SPLIT);
	let count = 0;
	for (let index = 0; index < parts.length; index += 2) {
		const segment = parts[index];
		const match = HINT_SEGMENT.exec(segment);
		if (!match) continue;
		const [, lead, to, phrase, tail] = match;
		// 句首大写（`Type to search`）也要命中词表。
		const key = phrase.toLowerCase();
		const chinese = Object.hasOwn(ACTIONS, key) ? ACTIONS[key] : undefined;
		if (chinese === undefined) continue;
		count++;
		// 中文提示里不留英文 `to`：`Esc to close` → `Esc 关闭`。
		parts[index] = `${lead}${chinese}${tail}`;
	}
	return { text: parts.join(""), count };
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
			let ast: unknown;
			try {
				ast = parse(source, { sourceType: "module", plugins: ["typescript", "jsx"] });
			} catch {
				continue;
			}

			interface Edit {
				readonly start: number;
				readonly end: number;
				readonly text: string;
			}
			const edits: Edit[] = [];
			let fileCount = 0;

			for (const template of collectTemplates(ast)) {
				const quasis = template.quasis;
				for (const [index, quasi] of quasis.entries()) {
					const raw = quasi.value.raw;
					const cooked = quasi.value.cooked ?? raw;
					if (raw === "") continue;
					// 片段内容含转义序列时 raw ≠ cooked，按 raw 重写会破坏转义，跳过。
					if (raw !== cooked) continue;
					if (index === 0) continue;
					const previous = quasis[index - 1].value.cooked ?? "";
					if (!HINT_BOUNDARY.test(previous)) continue;
					const result = translateFragment(cooked, true);
					if (result.count === 0 || result.text === cooked) continue;
					fileCount += result.count;
					edits.push({ start: quasi.start, end: quasi.end, text: result.text });
				}
			}

			if (edits.length === 0) continue;
			let output = source;
			for (const edit of [...edits].sort((a, b) => b.start - a.start)) {
				output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
			}
			total += fileCount;
			filesChanged++;
			perFile.push([relative, fileCount]);
			if (!dryRun) fs.writeFileSync(file, output, "utf8");
		}
	}

	perFile.sort((a, b) => b[1] - a[1]);
	process.stdout.write(`${dryRun ? "[dry-run] " : ""}提示片段替换 ${total} 处，涉及 ${filesChanged} 个文件\n`);
	for (const [file, count] of perFile.slice(0, 12)) {
		process.stdout.write(`  ${String(count).padStart(4)}  ${file}\n`);
	}
}

if (import.meta.main) main();
