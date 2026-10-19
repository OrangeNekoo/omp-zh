import { combine, register } from "../config/registry";
import { cfgAutolearnEnabled } from "../autolearn/settings";
import { cfgBashEnabled } from "../exec/settings";
import { cfgCompactionExperimentalContextManagement } from "../session/context-settings";
import { cfgEvalJs, cfgEvalPy } from "../eval/settings";
import { cfgIdaAvailable } from "../ida/install";
import { cfgLspEnabled } from "../lsp/settings";
import { cfgTaskMaxRecursionDepth } from "../task/settings";

const EMPTY_STRING_ARRAY: string[] = [];

export const cfgToolsArtifactSpillThreshold = register({
	id: "tools.artifactSpillThreshold",
	type: "number",
	default: 50,
	ui: {
		tab: "tools",
		group: "输出限制",
		label: "产物溢出阈值（KB）",
		description: "超过此大小的工具输出会保存为产物文件；尾部保留在行内",
		options: [
			{ value: "1", label: "1 KB", description: "约 250 令牌" },
			{ value: "2.5", label: "2.5 KB", description: "约 625 令牌" },
			{ value: "5", label: "5 KB", description: "约 1.25K 令牌" },
			{ value: "10", label: "10 KB", description: "约 2.5K 令牌" },
			{ value: "20", label: "20 KB", description: "约 5K 令牌" },
			{ value: "30", label: "30 KB", description: "约 7.5K 令牌" },
			{ value: "50", label: "50 KB", description: "默认；约 12.5K 令牌" },
			{ value: "75", label: "75 KB", description: "约 19K 令牌" },
			{ value: "100", label: "100 KB", description: "约 25K 令牌" },
			{ value: "200", label: "200 KB", description: "约 50K 令牌" },
			{ value: "500", label: "500 KB", description: "约 125K 令牌" },
			{ value: "1000", label: "1 MB", description: "约 250K 令牌" },
		],
	},
});

export const cfgToolsArtifactTailBytes = register({
	id: "tools.artifactTailBytes",
	type: "number",
	default: 20,
	ui: {
		tab: "tools",
		group: "输出限制",
		label: "产物尾部大小（KB）",
		description: "输出溢出到产物文件时保留在行内的尾部内容量",
		options: [
			{ value: "1", label: "1 KB", description: "约 250 令牌" },
			{ value: "2.5", label: "2.5 KB", description: "约 625 令牌" },
			{ value: "5", label: "5 KB", description: "约 1.25K 令牌" },
			{ value: "10", label: "10 KB", description: "约 2.5K 令牌" },
			{ value: "20", label: "20 KB", description: "默认；约 5K 令牌" },
			{ value: "50", label: "50 KB", description: "约 12.5K 令牌" },
			{ value: "100", label: "100 KB", description: "约 25K 令牌" },
			{ value: "200", label: "200 KB", description: "约 50K 令牌" },
		],
	},
});

export const cfgToolsArtifactHeadBytes = register({
	id: "tools.artifactHeadBytes",
	type: "number",
	default: 20,
	ui: {
		tab: "tools",
		group: "输出限制",
		label: "产物头部大小（KB）",
		description:
			"输出溢出到产物文件时，与尾部一起保留在行内的头部内容量（中间省略）。0 表示禁用 — 仅保留尾部。",
		options: [
			{ value: "0", label: "0 KB", description: "已禁用；仅截断尾部" },
			{ value: "1", label: "1 KB", description: "约 250 令牌" },
			{ value: "2.5", label: "2.5 KB", description: "约 625 令牌" },
			{ value: "5", label: "5 KB", description: "约 1.25K 令牌" },
			{ value: "10", label: "10 KB", description: "约 2.5K 令牌" },
			{ value: "20", label: "20 KB", description: "默认；约 5K 令牌" },
			{ value: "50", label: "50 KB", description: "约 12.5K 令牌" },
			{ value: "100", label: "100 KB", description: "约 25K 令牌" },
			{ value: "200", label: "200 KB", description: "约 50K 令牌" },
		],
	},
});

export const cfgToolsOutputMaxColumns = register({
	id: "tools.outputMaxColumns",
	type: "number",
	default: 768,
	ui: {
		tab: "tools",
		group: "输出限制",
		label: "输出列上限",
		description:
			"流式工具输出（bash、python、js eval）与 `read` 的每行字节上限。超过此宽度的行会被省略号截断；直到下一个换行符的剩余字节会被丢弃。0 表示禁用。",
		options: [
			{ value: "0", label: "关闭", description: "不设每行上限" },
			{ value: "256", label: "256", description: "紧凑" },
			{ value: "512", label: "512" },
			{ value: "768", label: "768", description: "默认" },
			{ value: "1024", label: "1024" },
			{ value: "2048", label: "2048" },
			{ value: "4096", label: "4096", description: "宽松" },
		],
	},
});

export const cfgToolsArtifactTailLines = register({
	id: "tools.artifactTailLines",
	type: "number",
	default: 500,
	ui: {
		tab: "tools",
		group: "输出限制",
		label: "产物尾部行数",
		description: "输出溢出到产物文件时保留在行内的尾部内容最大行数",
		options: [
			{ value: "50", label: "50 行", description: "约 250 令牌" },
			{ value: "100", label: "100 行", description: "约 500 令牌" },
			{ value: "250", label: "250 行", description: "约 1.25K 令牌" },
			{ value: "500", label: "500 行", description: "默认；约 2.5K 令牌" },
			{ value: "1000", label: "1000 行", description: "约 5K 令牌" },
			{ value: "2000", label: "2000 行", description: "约 10K 令牌" },
			{ value: "5000", label: "5000 行", description: "约 25K 令牌" },
		],
	},
});

export const cfgToolsArtifactMaxBytes = register({
	id: "tools.artifactMaxBytes",
	type: "number",
	default: 16,
	ui: {
		tab: "tools",
		group: "输出限制",
		label: "产物文件上限（MB）",
		description:
			"流式工具输出（bash、python、js eval）保存的产物文件最大大小。更大的输出会保留开头（最多 3 MB）与最近的剩余部分，中间插入截断提示。0 = 不限制。",
		options: [
			{ value: "0", label: "无限制", description: "保存完整输出" },
			{ value: "4", label: "4 MB" },
			{ value: "16", label: "16 MB", description: "默认" },
			{ value: "64", label: "64 MB" },
			{ value: "256", label: "256 MB" },
			{ value: "1024", label: "1 GB" },
		],
	},
});

export const cfgReadLineNumbers = register({
	id: "readLineNumbers",
	type: "boolean",
	default: false,
	ui: {
		tab: "files",
		group: "读取",
		label: "行号",
		description: "默认在 read 工具输出前加行号",
	},
});

export const cfgReadDefaultLimit = register({
	id: "read.defaultLimit",
	type: "number",
	default: 300,
	ui: {
		tab: "files",
		group: "读取",
		label: "默认读取上限",
		description: "代理调用 read 未指定限制时默认返回的行数",
		options: [
			{ value: "200", label: "200 行" },
			{ value: "300", label: "300 行" },
			{ value: "500", label: "500 行" },
			{ value: "1000", label: "1000 行" },
			{ value: "5000", label: "5000 行" },
		],
	},
});

export const cfgReadRenderMarkdown = register({
	id: "read.renderMarkdown",
	type: "boolean",
	default: false,
	ui: {
		tab: "files",
		group: "读取",
		label: "Markdown 预览",
		description: "将 Markdown 读取结果渲染为格式化的终端 Markdown 预览，而非原始源码",
	},
});

export const cfgReadSummarizeEnabled = register({
	id: "read.summarize.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "files",
		group: "读取摘要",
		label: "读取摘要",
		description: "当 read 未指定显式选择器时返回结构化代码摘要",
	},
});

export const cfgReadSummarizeProse = register({
	id: "read.summarize.prose",
	type: "boolean",
	default: false,
	ui: {
		tab: "files",
		group: "读取摘要",
		label: "正文摘要",
		description: "对 Markdown 与纯文本读取返回结构化摘要",
	},
});

export const cfgReadSummarizeMinBodyLines = register({
	id: "read.summarize.minBodyLines",
	type: "number",
	default: 4,
	ui: {
		tab: "files",
		group: "读取摘要",
		label: "读取摘要正文行数",
		description: "read 摘要折叠多行主体或字面量前的最小长度",
	},
});

export const cfgReadSummarizeMinCommentLines = register({
	id: "read.summarize.minCommentLines",
	type: "number",
	default: 6,
	ui: {
		tab: "files",
		group: "读取摘要",
		label: "读取摘要注释行数",
		description: "read 摘要折叠多行块注释前的最小长度",
	},
});

export const cfgReadSummarizeMinTotalLines = register({
	id: "read.summarize.minTotalLines",
	type: "number",
	default: 100,
	ui: {
		tab: "files",
		group: "读取摘要",
		label: "读取摘要最小文件长度",
		description: "总行数少于此值的文件将逐字读取，而非做结构化摘要",
	},
});

export const cfgReadSummarizeUnfoldUntil = register({
	id: "read.summarize.unfoldUntil",
	type: "number",
	default: 50,
	ui: {
		tab: "files",
		group: "读取摘要",
		label: "读取摘要展开目标",
		description:
			"BFS 展开可省略片段，直到摘要至少达到这么多可见行。0 表示只保留最外层的省略。",
	},
});

export const cfgReadSummarizeUnfoldLimit = register({
	id: "read.summarize.unfoldLimit",
	type: "number",
	default: 100,
	ui: {
		tab: "files",
		group: "读取摘要",
		label: "读取摘要展开上限",
		description:
			"BFS 展开过程中摘要大小的硬上限。若某次展开会使显示行数超过此值，则跳过该次展开（该片段保持折叠），并继续展开其余片段。",
	},
});

export const cfgReadToolResultPreview = register({
	id: "read.toolResultPreview",
	type: "boolean",
	default: false,
	ui: {
		tab: "files",
		group: "读取",
		label: "内联读取预览",
		description: "在会话记录中内联渲染 read 工具结果，而非摘要行",
	},
});

// ────────────────────────────────────────────────────────────────────────
// Tools
// ────────────────────────────────────────────────────────────────────────

// Tool approval policies
export const cfgToolsApproval = register({
	id: "tools.approval",
	type: "record",
	default: {},
	ui: {
		tab: "interaction",
		group: "批准",
		label: "工具批准策略",
		description:
			"按工具的批准策略。设为 'allow' 自动批准，'prompt' 要求确认，'deny' 阻止。覆盖设置在所有批准模式下都会生效。",
	},
});

// Default tool approval mode (interaction tab, but governs the tool wrapper).
//   "always-ask" — auto-approves read-tier tools only; prompts for write/exec.
//   "write"      — auto-approves read and write-tier tools; prompts for exec.
//   "yolo"       — auto-approves every tier.
export const cfgToolsApprovalMode = register({
	id: "tools.approvalMode",
	type: "enum",
	values: ["always-ask", "write", "yolo"] as const,
	default: "yolo",
	ui: {
		tab: "interaction",
		group: "批准",
		label: "工具批准",
		description:
			"工具调用的默认批准行为。'Always ask' 只自动批准只读工具。'Write' 自动批准读取与工作区写入工具。'Yolo' 自动批准所有层级；用户策略仍可要求确认或阻止。",
		options: [
			{
				value: "always-ask",
				label: "总是询问",
				description: "自动批准只读工具；对写入与执行类工具要求确认。",
			},
			{
				value: "write",
				label: "写入",
				description:
					"自动批准只读与写入工具；对 bash、eval、browser、task 等执行类工具要求确认。",
			},
			{
				value: "yolo",
				label: "Yolo",
				description:
					"自动批准读取、写入与执行类工具。用户策略仍可要求确认或阻止调用。",
			},
		],
	},
});

// Todo tool
// Todo settings deliberately have no `protocolDefault`: protocol embedders need project-level opt-outs
// for reminder/prelude prompt injection.
export const cfgTodoEnabled = register({
	id: "todo.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "待办",
		description: "启用 todo 工具以跟踪任务",
	},
});

export const cfgTodoReminders = register({
	id: "todo.reminders",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "待办",
		label: "待办提醒",
		description: "提醒代理在停止前完成待办",
	},
});

export const cfgTodoRemindersMax = register({
	id: "todo.remindersMax",
	type: "number",
	default: 3,
	ui: {
		tab: "tools",
		group: "待办",
		label: "待办提醒次数上限",
		description: "放弃前的最大待办提醒次数",
		options: [
			{ value: "1", label: "1 次提醒" },
			{ value: "2", label: "2 次提醒" },
			{ value: "3", label: "3 次提醒" },
			{ value: "5", label: "5 次提醒" },
		],
	},
});

export const cfgTodoEager = register({
	id: "todo.eager",
	type: "enum",
	values: ["default", "preferred", "always"] as const,
	default: "default",
	ui: {
		tab: "tools",
		group: "待办",
		label: "自动创建待办",
		description: "首条消息后推动自动创建待办列表的强度",
		options: [
			{ value: "default", label: "默认", description: "由模型决定；不自动生成待办列表" },
			{
				value: "preferred",
				label: "首选",
				description: "在首条消息上建议待办列表（提醒，非强制）",
			},
			{ value: "always", label: "总是", description: "在首条消息上强制生成完整的待办列表" },
		],
	},
});

export const cfgTasksTodoClearDelay = register({
	id: "tasks.todoClearDelay",
	type: "number",
	default: 60,
	ui: {
		tab: "tools",
		group: "待办",
		label: "待办自动清除延迟",
		description: "已完成或放弃的待办从待办组件中移除前的延迟",
		options: [
			{ value: "0", label: "即时" },
			{ value: "60", label: "1 分钟", description: "默认" },
			{ value: "300", label: "5 分钟" },
			{ value: "900", label: "15 分钟" },
			{ value: "1800", label: "30 分钟" },
			{ value: "3600", label: "1 小时" },
			{ value: "-1", label: "从不" },
		],
	},
});

// Grep, glob, and AST tools
export const cfgGlobEnabled = register({
	id: "glob.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "Glob",
		description: "启用 glob 工具以进行基于 glob 的文件查找",
	},
});

export const cfgGrepEnabled = register({
	id: "grep.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "Grep",
		description: "启用 grep 工具以进行正则内容搜索",
	},
});

export const cfgGrepContextBefore = register({
	id: "grep.contextBefore",
	type: "number",
	default: 1,
	ui: {
		tab: "tools",
		group: "Grep 与浏览器",
		label: "Grep 前置上下文",
		description: "每个 grep 匹配项之前附带的上下文行数",
		options: [
			{ value: "0", label: "0 行" },
			{ value: "1", label: "1 行" },
			{ value: "2", label: "2 行" },
			{ value: "3", label: "3 行" },
			{ value: "5", label: "5 行" },
		],
	},
});

export const cfgGrepContextAfter = register({
	id: "grep.contextAfter",
	type: "number",
	default: 3,
	ui: {
		tab: "tools",
		group: "Grep 与浏览器",
		label: "Grep 后置上下文",
		description: "每个 grep 匹配项之后附带的上下文行数",
		options: [
			{ value: "0", label: "0 行" },
			{ value: "1", label: "1 行" },
			{ value: "2", label: "2 行" },
			{ value: "3", label: "3 行" },
			{ value: "5", label: "5 行" },
			{ value: "10", label: "10 行" },
		],
	},
});

export const cfgAstGrepEnabled = register({
	id: "astGrep.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "AST 搜索",
		description: "启用 ast_grep 工具以进行结构化 AST 搜索",
	},
});

export const cfgAstEditEnabled = register({
	id: "astEdit.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "AST 编辑",
		description: "启用 ast_edit 工具以进行结构化 AST 重写",
	},
});

export const cfgFindEnabled = register({
	id: "find.enabled",
	type: "enum",
	values: ["auto", "on", "off"] as const,
	default: "auto",
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "查找（语义 grep）",
		description:
			"启用 find 工具：用自然语言搜索文件与行范围，由 judge 模型角色判定。auto 仅在 judge 角色解析为原生 TypeSafe jev 模型时启用",
		options: [
			{
				value: "auto",
				label: "自动",
				description: "当 judge 角色解析为原生 TypeSafe jev 模型时启用",
			},
			{ value: "on", label: "开启", description: "始终启用，无论 judge 角色解析为哪个模型" },
			{ value: "off", label: "关闭", description: "禁用 find 工具" },
		],
	},
});

// Optional tools

export const cfgDebugEnabled = register({
	id: "debug.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "调试",
		description: "启用 debug 工具以进行基于 DAP 的调试",
	},
});

export const cfgLaunchEnabled = register({
	id: "launch.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "服务",
		description: "启用命名 bash 服务与 proc:// 监管，用于共享的长期项目进程",
	},
});

export const cfgSpeechgenEnabled = register({
	id: "speechgen.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "语音生成",
		description: "启用 tts 工具，以进行设备端（Kokoro）或 xAI Grok Voice 语音文件合成",
	},
});

export const cfgGenerateImageEnabled = register({
	id: "generate_image.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "生成图像",
		description:
			"启用 generate_image 工具（文生图与图像编辑）。当 tools.xdev 开启时以 xd:// 设备形式暴露。",
	},
});

export const cfgComputerEnabled = register({
	id: "computer.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "计算机",
		description: "启用可脚本化的宿主机桌面 eval 前奏（截图、输入、辅助功能）",
	},
});

export const cfgRatchetEnabled = register({
	id: "ratchet.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "棘轮",
		description: "启用 ratchet eval/爬山前奏；/ratchet 可为当前会话开启",
	},
});

export const cfgArchiveEnabled = register({
	id: "archive.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "归档",
		description:
			"启用只读归档 eval 前奏：提示词历史、最近项目、过往会话与回顾",
	},
});

export const cfgComputerDisplay = register({
	id: "computer.display",
	type: "string",
	default: "active",
	ui: {
		tab: "tools",
		group: "计算机",
		label: "计算机显示器",
		description: "活动窗口所在显示器（active）、所有显示器（all），或原生显示器 ID",
	},
});

export const cfgComputerMaxWidth = register({
	id: "computer.maxWidth",
	type: "number",
	default: 3840,
	ui: {
		tab: "tools",
		group: "计算机",
		label: "计算机截图宽度",
		description: "截图最大宽度（像素）",
	},
});

export const cfgComputerMaxHeight = register({
	id: "computer.maxHeight",
	type: "number",
	default: 2400,
	ui: {
		tab: "tools",
		group: "计算机",
		label: "计算机截图高度",
		description: "截图最大高度（像素）",
	},
});

export const cfgComputerBackgroundFallback = register({
	id: "computer.backgroundFallback",
	type: "enum",
	values: ["takeover", "refuse"] as const,
	default: "takeover",
	ui: {
		tab: "tools",
		group: "计算机",
		label: "计算机后台回退",
		description:
			"当窗口输入的背景路由不可用时如何处理：在接管模式下重跑并把焦点交还你的应用（macOS；其他平台为普通接管），或拒绝 — 拒绝同时会阻止代理抢占前台或自行打开 macOS 菜单",
		options: [
			{
				value: "takeover",
				label: "接管",
				description:
					"仅为该次调用短暂把目标窗口前置，然后交还焦点给你的应用（macOS 上即使你一直在输入）",
			},
			{
				value: "refuse",
				label: "拒绝",
				description:
					"使调用失败；不会有任何接管，代理自身的接管、raise、激活式打开、桌面输入与 macOS 菜单（上下文菜单、弹出菜单与菜单按钮；它们打开时会占用你的键盘）也一并被拒绝",
			},
		],
	},
});

export const cfgImagesQuestionTimeoutMs = register({
	id: "images.questionTimeoutMs",
	type: "number",
	default: 300_000,
	ui: {
		tab: "tools",
		group: "执行",
		label: "图像问答超时",
		description:
			"read 的 ?q= 图像问答背后视觉模型调用的每次请求超时（毫秒）。服务商卡住时会以超时错误快速失败，而不是阻塞到手动中止。设为 0 可禁用超时。",
		options: [
			{ value: "0", label: "已禁用" },
			{ value: "60000", label: "1 分钟" },
			{ value: "120000", label: "2 分钟" },
			{ value: "180000", label: "3 分钟" },
			{ value: "300000", label: "5 分钟" },
		],
	},
});

export const cfgCheckpointEnabled = register({
	id: "checkpoint.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "检查点/回退",
		description: "启用 checkpoint 与 rewind 工具以进行上下文检查点",
	},
});

// Fetching and browser
export const cfgFetchEnabled = register({
	id: "fetch.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "读取 URL",
		description: "允许 read 工具抓取并处理 URL",
	},
});

export const cfgVaultEnabled = register({
	id: "vault.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "Obsidian 库",
		description:
			"启用 vault:// 内部 URL，通过 Obsidian CLI 读取与编辑 Obsidian 库内容。禁用时，vault:// 解析会被拒绝，且 vault:// 条目会从系统提示词中省略。",
	},
});

export const cfgGithubEnabled = register({
	id: "github.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "GitHub CLI",
		description:
			"启用 github 工具（基于 op 的分发，覆盖仓库、issue、pull request、diff、搜索、检出、推送与 Actions 监视工作流）",
	},
});

export const cfgGithubCacheEnabled = register({
	id: "github.cache.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "GitHub",
		label: "GitHub 查看缓存",
		description: "将渲染后的 issue/PR 查看输出缓存到 ~/.omp/cache/github-cache.db，使重复读取无需重新抓取",
	},
});

export const cfgGithubCacheSoftTtlSec = register({
	id: "github.cache.softTtlSec",
	type: "number",
	default: 300,
	ui: {
		tab: "tools",
		group: "GitHub",
		label: "GitHub 缓存软 TTL",
		description: "在此时间窗内，直接返回缓存的 issue/PR 查看行（秒；默认 5 分钟）",
	},
});

export const cfgGithubCacheHardTtlSec = register({
	id: "github.cache.hardTtlSec",
	type: "number",
	default: 604800,
	ui: {
		tab: "tools",
		group: "GitHub",
		label: "GitHub 缓存硬 TTL",
		description:
			"超过软 TTL 后返回缓存行并在后台刷新；超过硬 TTL 后丢弃（秒；默认 7 天）",
	},
});

export const cfgWebSearchEnabled = register({
	id: "web_search.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "网络搜索",
		description: "启用 web_search 工具以获取实时网页结果",
	},
});

export const cfgSecurityEnabled = register({
	id: "security.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "安全",
		description:
			"启用 OMP 原生安全扫描的规划、执行，以及只读的 security:// 资源命名空间",
	},
});

export const cfgAskEnabled = register({
	id: "ask.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "询问",
		description: "启用 ask 工具以进行交互式用户提问",
	},
});

// Tool execution
export const cfgToolsIntentTracing = register({
	id: "tools.intentTracing",
	type: "boolean",
	default: true,
	env: "PI_INTENT_TRACING",
	ui: {
		tab: "tools",
		group: "执行",
		label: "意图追踪",
		description: "要求代理在执行每个工具调用前说明其意图",
	},
});

export const cfgToolsAbortOnFabricatedResult = register({
	id: "tools.abortOnFabricatedResult",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "执行",
		label: "编造工具结果时中止",
		description:
			"使用带内工具调用时，模型在回合中途开始臆造工具结果就立即停止。禁用则让模型继续生成完，再丢弃编造的续写内容。",
	},
});

export const cfgToolsSpeculativeExecutionEnabled = register({
	id: "tools.speculativeExecution.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "tools",
		group: "执行",
		label: "实验性推测执行",
		description:
			"启用可安全丢弃的第一部分：通过直接 read 调用与嵌套 eval 完成经过校验的本地读取。网络请求、服务商补全与实时文件系统写入不在此基线内。",
	},
});

export const cfgToolsSpeculativeExecutionMaxInFlight = register({
	id: "tools.speculativeExecution.maxInFlight",
	type: "number",
	default: 2,
	ui: {
		tab: "tools",
		group: "执行",
		label: "推测执行并发数",
		description: "在正常分发前允许运行的、经过校验的本地读取最大数量。",
		options: [
			{ value: "1", label: "1 项操作" },
			{ value: "2", label: "2 项操作" },
			{ value: "3", label: "3 项操作" },
			{ value: "4", label: "4 项操作" },
		],
	},
});

export const cfgToolsMaxTimeout = register({
	id: "tools.maxTimeout",
	type: "number",
	default: 0,
	ui: {
		tab: "tools",
		group: "执行",
		label: "最大工具超时",
		description: "代理可为任意工具设置的最大超时秒数（0 = 不限制）",
		options: [
			{ value: "0", label: "不限制" },
			{ value: "30", label: "30 秒" },
			{ value: "60", label: "60 秒" },
			{ value: "120", label: "120 秒" },
			{ value: "300", label: "5 分钟" },
			{ value: "600", label: "10 分钟" },
		],
	},
});

// Async jobs. RPC hosts start from the neutral background-job defaults (`protocolDefault`), as do the
// bash/eval auto-background settings.
export const cfgAsyncEnabled = register({
	id: "async.enabled",
	protocolDefault: ["rpc"],
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "执行",
		label: "异步执行",
		description: "启用异步 bash 命令与后台任务执行",
	},
});

export const cfgAsyncMaxJobs = register({
	id: "async.maxJobs",
	protocolDefault: ["rpc"],
	type: "number",
	default: 100,
});

export const cfgToolsXdev = register({
	id: "tools.xdev",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "发现与 MCP",
		label: "xd:// 工具",
		description:
			"把少用的（可发现）工具挂载到 xd:// 设备 URL 下，通过 read/write 驱动，而不必在每次请求中都发送它们的 schema。若会话的显式工具列表授予 read 但未授予 write，则设备通过仅设备的写入通道挂载（除设备外只有 local:// 暂存可写）。禁用以在最顶层暴露每个已启用的工具。",
	},
});

export const cfgToolsXdevDocs = register({
	id: "tools.xdevDocs",
	type: "enum",
	values: ["inline", "builtins", "catalog"] as const,
	default: "catalog",
	ui: {
		tab: "tools",
		group: "发现与 MCP",
		label: "xd:// 提示词文档",
		description:
			"选择哪些挂载设备的文档与 schema 内联到系统提示词。Built-ins 让核心工具内联，而 MCP 与扩展工具按需加载。",
		options: [
			{ value: "inline", label: "所有设备", description: "为每个挂载设备内联文档与 schema。" },
			{
				value: "builtins",
				label: "仅内置",
				description: "内联内置文档；按需获取 MCP 与扩展文档。",
			},
			{ value: "catalog", label: "仅目录", description: "列出每个设备；按需获取全部文档。" },
		],
	},
});

export const cfgToolsXdevInlineDevices = register({
	id: "tools.xdevInlineDevices",
	type: "array",
	default: EMPTY_STRING_ARRAY,
	ui: {
		tab: "tools",
		group: "发现与 MCP",
		label: "xd:// 内联设备",
		description:
			"当 xd:// Prompt Docs 为 Built-ins Only 时，将名称匹配这些 glob 模式的动态设备内联（例如 mcp__context_mode_*）。Catalog Only 会忽略此设置。",
	},
});

export const cfgDevAutoqa = register({
	id: "dev.autoqa",
	type: "boolean",
	default: true,
	env: "PI_AUTO_QA",
	ui: {
		tab: "tools",
		group: "开发者",
		label: "自动 QA",
		description:
			"自动上报工具问题 (xd://report_issue)。默认开启；首次上报会请求同意，拒绝后将在显式重新启用前关闭上报",
	},
});

export const cfgDevAutoqaPushEndpoint = register({
	id: "dev.autoqaPush.endpoint",
	type: "string",
	default: "https://qa.omp.sh/v1/grievances" as const,
	ui: {
		tab: "tools",
		group: "开发者",
		label: "自动 QA 推送端点",
		description: "接收 Auto QA JSON 报告的完整 URL（默认 https://qa.omp.sh/v1/grievances）",
	},
});

export const cfgDevAutoqaPushToken = register({
	id: "dev.autoqaPush.token",
	type: "string",
	default: undefined,
	credential: true,
});

/**
 * User decision on sharing automatic `report_tool_issue` grievances.
 *
 *   - `"unset"`  — never asked; the first `report_tool_issue` invocation
 *                  pops a consent dialog and persists the answer here.
 *   - `"granted"` — record and (when push is configured) ship grievances.
 *   - `"denied"`  — silently no-op every `report_tool_issue` call.
 *
 * Owned by `packages/coding-agent/src/tools/report-tool-issue.ts` via the
 * process-global consent handler registered by `InteractiveMode`.
 *
 * @default "unset"
 */
export const cfgDevAutoqaConsent = register({
	id: "dev.autoqaConsent",
	type: "enum",
	values: ["unset", "granted", "denied"] as const,
	default: "unset" as const,
});

/** Settings read by `resolveBuiltinToolPlan` (`tools/index.ts`); a live session reconciles its built-ins when any changes. */
export const cfgBuiltinToolGates = combine({
	ask: cfgAskEnabled,
	astEdit: cfgAstEditEnabled,
	astGrep: cfgAstGrepEnabled,
	async: cfgAsyncEnabled,
	autolearn: cfgAutolearnEnabled,
	bash: cfgBashEnabled,
	checkpoint: cfgCheckpointEnabled,
	contextManagement: cfgCompactionExperimentalContextManagement,
	debug: cfgDebugEnabled,
	evalJs: cfgEvalJs,
	evalPy: cfgEvalPy,
	find: cfgFindEnabled,
	github: cfgGithubEnabled,
	glob: cfgGlobEnabled,
	grep: cfgGrepEnabled,
	ida: cfgIdaAvailable,
	launch: cfgLaunchEnabled,
	lsp: cfgLspEnabled,
	security: cfgSecurityEnabled,
	taskMaxRecursionDepth: cfgTaskMaxRecursionDepth,
	todo: cfgTodoEnabled,
	webSearch: cfgWebSearchEnabled,
});

/** Settings that add or remove the built-in tools they gate (`AgentSession.reconcileBuiltinTools`). */
export const cfgSessionToolGates = combine({
	builtins: cfgBuiltinToolGates,
	generateImage: cfgGenerateImageEnabled,
	speechgen: cfgSpeechgenEnabled,
	xdev: cfgToolsXdev,
});
