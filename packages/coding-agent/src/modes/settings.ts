import { combine, effect, register, type Setting } from "../config/registry";
import type { Settings } from "../config/settings";
import { formatKeyHint, formatKeyHints } from "@oh-my-pi/pi-tui/app-keybindings";
import { cfgReadToolResultPreview } from "../tools/settings";
import { MAGIC_KEYWORDS, type MagicKeywordId } from "./magic-keywords";
import { TREE_FILTER_MODES } from "@oh-my-pi/pi-tui/overlays/tree-selector";
import {
	CONTEXT_LINE_MODE_VALUES,
	CUSTOM_STATUS_LINE_DEFAULTS,
	STATUS_LINE_PRESET_VALUES,
	STATUS_LINE_SEGMENT_IDS,
	STATUS_LINE_SEPARATOR_VALUES,
} from "@oh-my-pi/pi-tui/status-line/schema";
import { setChatTranscriptDisplayPreferences } from "@oh-my-pi/pi-tui/chat/display-preferences";
import { setEditorGapComposerShape } from "@oh-my-pi/pi-tui/prompt/editor-top-gap";
import { setEmojiAutocompleteEnabled } from "@oh-my-pi/pi-tui/prompt/prompt-action-autocomplete";
import { WORD_COMPLETION_METHODS } from "@oh-my-pi/pi-tui/prompt/word-completion";
import { applyHyperlinkSetting } from "@oh-my-pi/pi-tui/render/hyperlink";
import { setInlineImageMaxColumns, setInlineImageMaxRows } from "@oh-my-pi/pi-tui/render/render-utils";
import { setShimmerMode } from "@oh-my-pi/pi-tui/theme/shimmer";
import { setAutoThemeMapping, setColorBlindMode, setSymbolPreset } from "@oh-my-pi/pi-tui/theme/theme";

const EMPTY_UNKNOWN_RECORD: Record<string, unknown> = {};

// ────────────────────────────────────────────────────────────────────────
// General settings (no UI)
// ────────────────────────────────────────────────────────────────────────
export const cfgSetupVersion = register({ id: "setupVersion", type: "number", default: 0 });

export const cfgAutoResume = register({
	id: "autoResume",
	type: "boolean",
	default: false,
	ui: {
		tab: "interaction",
		group: "启动与更新",
		label: "自动恢复",
		description:
			"自动恢复当前目录中最近的会话。若其模型无法恢复且模型回退已关闭，交互式启动会给出警告并开启不带保存历史的新会话",
	},
});

export const cfgGitEnabled = register({
	id: "git.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "interaction",
		group: "Git",
		label: "启用 Git 集成",
		description: "在 TUI 中显示 git 分支、状态与 PR 信息，并监视仓库元数据。",
	},
});

// ────────────────────────────────────────────────────────────────────────
// Appearance
// ────────────────────────────────────────────────────────────────────────

// Theme
export const cfgThemeDark = register({
	id: "theme.dark",
	type: "string",
	default: "titanium",
	ui: {
		tab: "appearance",
		group: "主题",
		label: "深色主题",
		description: "终端为深色背景时使用的主题",
		options: "runtime",
	},
});
effect(cfgThemeDark, name => setAutoThemeMapping("dark", name));

export const cfgThemeLight = register({
	id: "theme.light",
	type: "string",
	default: "light",
	ui: {
		tab: "appearance",
		group: "主题",
		label: "浅色主题",
		description: "终端为浅色背景时使用的主题",
		options: "runtime",
	},
});
effect(cfgThemeLight, name => setAutoThemeMapping("light", name));

export const cfgSymbolPreset = register({
	id: "symbolPreset",
	type: "enum",
	values: ["unicode", "nerd", "ascii"] as const,
	default: "unicode",
	ui: {
		tab: "appearance",
		group: "主题",
		label: "符号预设",
		description: "图标与符号使用的字形集（Unicode、Nerd Font 或 ASCII）",
		options: [
			{ value: "unicode", label: "Unicode", description: "标准符号（默认）" },
			{
				value: "nerd",
				label: "Nerd 字体",
				description: "需要 Nerd 字体，或支持 Glyph 协议的终端（图标随带内数据下发）",
			},
			{ value: "ascii", label: "ASCII", description: "最大兼容性" },
		],
	},
});
effect(cfgSymbolPreset, setSymbolPreset);

export const cfgColorBlindMode = register({
	id: "colorBlindMode",
	type: "boolean",
	default: false,
	ui: {
		tab: "appearance",
		group: "主题",
		label: "色盲模式",
		description: "差异新增使用蓝色而非绿色",
	},
});
effect(cfgColorBlindMode, setColorBlindMode);

// Composer
export const cfgComposerShape = register({
	id: "composer.shape",
	type: "string",
	default: "band",
	ui: {
		tab: "appearance",
		group: "输入框",
		label: "输入框形状",
		description: "输入编辑器与状态栏的视觉布局",
		options: "runtime",
	},
});
effect(cfgComposerShape, setEditorGapComposerShape);

export const cfgComposerTokenRate = register({
	id: "composer.tokenRate",
	type: "boolean",
	default: false,
	ui: {
		tab: "appearance",
		group: "输入框",
		label: "生成速率",
		description:
			"显示实时生成速度（tok/s）：在工作行的会话标题旁，或原生输入框栏中紧跟思考等级之后，最后一次读数会保留到下一回合。由流式增量估算，并在每条消息完成时用服务商计费的输出数校正。",
	},
});

// Status line
export const cfgStatusLinePreset = register({
	id: "statusLine.preset",
	type: "enum",
	values: STATUS_LINE_PRESET_VALUES,
	default: "default",
	ui: {
		tab: "appearance",
		group: "状态栏",
		label: "状态栏预设",
		description: "预构建的状态栏配置",
		options: [
			{ value: "default", label: "默认", description: "模型、路径、git、上下文、令牌、成本" },
			{ value: "minimal", label: "极简", description: "仅路径与 git" },
			{ value: "compact", label: "压缩", description: "模型、git、成本、上下文" },
			{ value: "full", label: "完整", description: "所有段（含时间）" },
			{ value: "nerd", label: "Nerd", description: "Nerd 字体图标的最大信息量" },
			{ value: "ascii", label: "ASCII", description: "无特殊字符" },
			{ value: "custom", label: "自定义", description: "用户自定义段" },
		],
	},
});

export const cfgStatusLineSeparator = register({
	id: "statusLine.separator",
	type: "enum",
	values: STATUS_LINE_SEPARATOR_VALUES,
	default: "powerline-thin",
	ui: {
		tab: "appearance",
		group: "状态栏",
		label: "状态栏分隔符",
		description: "各段之间分隔符的样式",
		options: [
			{ value: "powerline", label: "Powerline", description: "实心箭头（Nerd 字体）" },
			{ value: "powerline-thin", label: "细箭头", description: "细箭头（Nerd 字体）" },
			{ value: "slash", label: "斜杠", description: "正斜杠" },
			{ value: "pipe", label: "竖线", description: "竖线" },
			{ value: "block", label: "阻止", description: "实心方块" },
			{ value: "none", label: "无", description: "仅空格" },
			{ value: "ascii", label: "ASCII", description: "大于号" },
		],
	},
});

export const cfgStatusLineContextLine = register({
	id: "statusLine.contextLine",
	type: "enum",
	values: CONTEXT_LINE_MODE_VALUES,
	default: "embedded",
	ui: {
		tab: "appearance",
		group: "状态栏",
		label: "上下文响应行",
		description: "左右段之间的线条如何反映上下文用量（仅限方框输入框）",
		options: [
			{ value: "off", label: "关闭", description: "实心强调色线条，无上下文反馈" },
			{
				value: "percentage",
				label: "百分比",
				description: "已用部分用强调色，剩余部分弱化",
			},
			{
				value: "annotated",
				label: "已标注",
				description: "百分比，并在推测与自动压缩边界处显示刻度",
			},
			{
				value: "embedded",
				label: "已嵌入",
				description: "带注释的行，上下文百分比与窗口嵌入仪表中",
			},
		],
	},
});

export const cfgStatusLineSessionAccent = register({
	id: "statusLine.sessionAccent",
	type: "boolean",
	default: true,
	ui: {
		tab: "appearance",
		group: "状态栏",
		label: "会话强调色",
		description: "编辑框边框与状态栏间隙使用会话名称颜色",
	},
});

export const cfgStatusLineTransparent = register({
	id: "statusLine.transparent",
	type: "boolean",
	default: false,
	ui: {
		tab: "appearance",
		group: "状态栏",
		label: "透明状态栏",
		description:
			"状态栏使用终端默认背景色，而非主题的 `statusLineBg`。Powerline 端帽会被去掉，因为它们需要对比填充才能与周围的终端背景衔接。",
	},
});

export const cfgStatusLineCompactThinkingLevel = register({
	id: "statusLine.compactThinkingLevel",
	type: "boolean",
	default: true,
	ui: {
		tab: "appearance",
		group: "状态栏",
		label: "压缩思考等级",
		description:
			"将思考等级以模型名上的单个图标显示，而非单独的 ` · <level>` 后缀；在 Tern 的输入框中，作为模型标签的图标而非独立标签（点击图标可循环切换）。",
	},
});

export const cfgStatusLineShowHookStatus = register({
	id: "statusLine.showHookStatus",
	type: "boolean",
	default: true,
	ui: {
		tab: "appearance",
		group: "状态栏",
		label: "显示 Hook 状态",
		description: "在状态栏下方显示 Hook 状态消息",
	},
});

export const cfgStatusLineLeftSegments = register({
	id: "statusLine.leftSegments",
	type: "array",
	default: CUSTOM_STATUS_LINE_DEFAULTS.left,
	items: { values: STATUS_LINE_SEGMENT_IDS, label: "状态栏片段" },
});

export const cfgStatusLineRightSegments = register({
	id: "statusLine.rightSegments",
	type: "array",
	default: CUSTOM_STATUS_LINE_DEFAULTS.right,
	items: { values: STATUS_LINE_SEGMENT_IDS, label: "状态栏片段" },
});

export const cfgStatusLineSegmentOptions = register({
	id: "statusLine.segmentOptions",
	type: "record",
	default: EMPTY_UNKNOWN_RECORD,
});

// Images and terminal
export const cfgTerminalShowImages = register({
	id: "terminal.showImages",
	type: "boolean",
	default: true,
	ui: {
		tab: "appearance",
		group: "图像",
		label: "显示内联图像",
		description: "在终端中内联渲染图像",
		condition: "hasImageProtocol",
	},
});

export const cfgImagesAutoResize = register({
	id: "images.autoResize",
	type: "boolean",
	default: true,
	ui: {
		tab: "appearance",
		group: "图像",
		label: "自动调整图像大小",
		description: "将大图像缩小到最大 2000x2000，以获得更好的模型兼容性",
	},
});

export const cfgImagesBlockImages = register({
	id: "images.blockImages",
	type: "boolean",
	default: false,
	ui: {
		tab: "appearance",
		group: "图像",
		label: "阻止图像",
		description: "阻止将图像发送给 LLM 服务商",
	},
});

export const cfgTuiMaxInlineImageColumns = register({
	id: "tui.maxInlineImageColumns",
	type: "number",
	default: 100,
	description:
		"内联图像的最大宽度（终端列，默认 100）。设为 0 表示不限制（仅受终端宽度约束）。",
});
effect(cfgTuiMaxInlineImageColumns, setInlineImageMaxColumns);

export const cfgTuiMaxInlineImageRows = register({
	id: "tui.maxInlineImageRows",
	type: "number",
	default: 20,
	description:
		"内联图像的最大高度（终端行，默认 20）。设为 0 则只使用基于视口的限制（终端高度的 60%）。",
});
effect(cfgTuiMaxInlineImageRows, setInlineImageMaxRows);

export const cfgTuiMaxInlineImages = register({
	id: "tui.maxInlineImages",
	type: "number",
	default: 8,
	description:
		"保留为实时终端图形的内联图像最大数量（默认 8）。超过限制后，较旧的图像会在一次完整重绘后回退为文本占位符。设为 0 则保留所有图像（不限制）。",
});

export const cfgTuiResizeScrollback = register({
	id: "tui.resizeScrollback",
	type: "enum",
	values: ["append", "rebuild", "preserve"] as const,
	default: "rebuild",
	ui: {
		tab: "appearance",
		group: "显示",
		label: "调整回滚缓冲区",
		description: "终端尺寸调整稳定后，如何刷新保留在终端回滚区中的记录行",
		options: [
			{
				value: "append",
				label: "追加",
				description: "在保留的历史下方以新宽度重放会话记录",
			},
			{
				value: "rebuild",
				label: "重建",
				description: "清除所有终端回滚内容，然后按当前宽度重放一份会话记录",
			},
			{
				value: "preserve",
				label: "保留",
				description: "仅重绘视口，历史内容保持按旧宽度换行",
			},
		],
	},
});

export const cfgTuiCompleteScrollback = register({
	id: "tui.completeScrollback",
	type: "boolean",
	default: false,
	ui: {
		tab: "appearance",
		group: "显示",
		label: "完整回滚",
		description:
			"把因 HUD 或对话框变高而被挤出屏幕的记录行直接送入回滚区；当它变矮时，记录与输入框之间会留出空行，直到新输出填补",
	},
});

export const cfgTerminalShowProgress = register({
	id: "terminal.showProgress",
	type: "boolean",
	default: false,
	ui: {
		tab: "appearance",
		group: "显示",
		label: "原生终端进度",
		description:
			"当代理或上下文维护运行时发送 OSC 9;4 不确定进度（Tern 中始终开启）",
	},
});

export const cfgTerminalProgramStatus = register({
	id: "terminal.programStatus",
	type: "boolean",
	default: true,
	ui: {
		tab: "appearance",
		group: "显示",
		label: "程序状态 (OSC 7501)",
		description:
			"通过 OSC 7501 报告代理是工作中、等待你、已完成还是已失败，供终端标签页指示器和代理收件箱使用",
	},
});

export const cfgTuiTextSizing = register({
	id: "tui.textSizing",
	type: "boolean",
	default: false,
	ui: {
		tab: "appearance",
		group: "显示",
		label: "大标题（Kitty）",
		description:
			"使用 Kitty 的 OSC 66 文本尺寸协议以 2 倍尺寸渲染 Markdown H1 标题。仅在 Kitty 终端生效，其它终端忽略。默认关闭。",
	},
});

export const cfgTuiRenderMermaid = register({
	id: "tui.renderMermaid",
	type: "boolean",
	default: true,
	ui: {
		tab: "appearance",
		group: "显示",
		label: "渲染 Mermaid 图表",
		description: "将 Mermaid 围栏代码块渲染为 ASCII 图表",
	},
});

export const cfgTuiRenderSvg = register({
	id: "tui.renderSvg",
	type: "boolean",
	default: true,
	ui: {
		tab: "appearance",
		group: "显示",
		label: "渲染 SVG 图形",
		description:
			"邀请代理以 SVG 绘制图表，在支持图形显示的终端上内联渲染为图像",
	},
});

export const cfgTuiAutoGraph = register({
	id: "tui.autoGraph",
	type: "enum",
	values: ["smart", "always", "off"] as const,
	default: "always",
	ui: {
		tab: "appearance",
		group: "显示",
		label: "自动图表",
		description:
			"在支持图形显示的终端上，用你的主题配色在代理回答的数值表格下方绘制图表",
		options: [
			{
				value: "smart",
				label: "智能",
				description:
					"判定模型会细化每个图表：类型、列、行名与分组、刻度、哪个方向更好，以及标题",
			},
			{
				value: "always",
				label: "总是",
				description: "对所有读起来像数值的表格绘图，使用内置的最佳猜测",
			},
			{ value: "off", label: "关闭", description: "保留表格形式" },
		],
	},
});

export const cfgTuiReactions = register({
	id: "tui.reactions",
	type: "boolean",
	default: true,
	ui: {
		tab: "appearance",
		group: "显示",
		label: "代理反应",
		description: "邀请代理用一个 Emoji 徽章在其气泡上回应你的消息",
	},
});

export const cfgTuiCodexResetFireworks = register({
	id: "tui.codexResetFireworks",
	type: "boolean",
	default: false,
	ui: {
		tab: "appearance",
		group: "显示",
		label: "Codex 重置烟花",
		get description() {
			return `当 Codex 每周用量意外重置或有新的已存重置入账时，在屏幕上部三分之一处显示烟花浮层，直到 ${formatKeyHint("escape")}`;
		},
	},
});

export const cfgTuiTitleState = register({
	id: "tui.titleState",
	type: "boolean",
	default: true,
	ui: {
		tab: "appearance",
		group: "显示",
		label: "终端标题运行状态",
		description:
			"在终端标题分隔符中显示代理运行状态 — 工作中为动画加载符（WSL 下为静态 ':'），轮到你时为 '>'，代理等待你时为 '!'",
	},
});

export const cfgTuiTitleSpinner = register({
	id: "tui.titleSpinner",
	type: "enum",
	values: ["braille", "pulse", "dots", "line"] as const,
	default: "braille",
	ui: {
		tab: "appearance",
		group: "显示",
		label: "终端标题加载动画",
		description:
			"终端标题中工作状态加载动画的字形集 — 盲文扫描、填充月亮、单点循环或 ASCII 安全线条",
		options: [
			{ value: "braille", label: "盲文", description: "经典盲文扫描（默认）" },
			{ value: "pulse", label: "脉冲", description: "月亮填充 ○◑● 然后清空" },
			{ value: "dots", label: "圆点", description: "单盲文点循环" },
			{ value: "line", label: "行", description: "ASCII 符号，用于不支持盲文的字体" },
		],
	},
});

export const cfgTuiHyperlinks = register({
	id: "tui.hyperlinks",
	type: "enum",
	values: ["off", "auto", "always"] as const,
	default: "auto",
	ui: {
		tab: "appearance",
		group: "显示",
		label: "终端超链接",
		description:
			"将路径与 URL 包裹在 OSC 8 超链接中，以支持终端原生点击打开（auto：检测支持；off：从不；always：无条件）",
	},
});
// Also re-applied when a project-scoped reload (`/move`, cross-project resume, rollback) changes the
// effective value, so pi-tui renderers gating on the shared flag track it the same instant path links do.
effect(cfgTuiHyperlinks, applyHyperlinkSetting);

export const cfgTuiMouse = register({
	id: "tui.mouse",
	type: "boolean",
	default: false,
	ui: {
		tab: "appearance",
		group: "显示",
		label: "鼠标点击聚焦",
		get description() {
			const shift = formatKeyHint("shift");
			return `在主会话中捕获鼠标点击，让运行中的子代理卡片与 HUD 行可点击聚焦，并高亮悬停目标。启用后原生文本选择变为 ${shift}+拖动，滚轮滚动变为 ${shift}+滚轮`;
		},
	},
});

export const cfgTuiTight = register({
	id: "tui.tight",
	type: "boolean",
	default: false,
	ui: {
		tab: "appearance",
		group: "显示",
		label: "紧凑布局",
		description: "移除终端输出左右两侧 1 个字符的水平内边距",
	},
});

export const cfgDisplayShimmer = register({
	id: "display.shimmer",
	type: "enum",
	values: ["classic", "kitt", "disabled"] as const,
	default: "classic",
	ui: {
		tab: "appearance",
		group: "显示",
		label: "微光",
		description: "工作/加载消息的动画样式",
		options: [
			{ value: "classic", label: "经典", description: "柔和的余弦波扫过文本" },
			{ value: "kitt", label: "KITT 扫描", description: "霹雳游侠 1982 红灯左右弹跳" },
			{ value: "disabled", label: "已禁用", description: "无动画；静态柔和文本" },
		],
	},
});
effect(cfgDisplayShimmer, setShimmerMode);

export const cfgDisplayPinnedAgents = register({
	id: "display.pinnedAgents",
	type: "enum",
	values: ["off", "collapsed", "full"] as const,
	default: "collapsed",
	ui: {
		tab: "appearance",
		group: "显示",
		label: "固定代理",
		description:
			"编辑器上方固定的活动代理跳转列表（off 隐藏；collapsed 显示几行并可展开；full 全部列出）",
		options: [
			{ value: "off", label: "关闭", description: "隐藏固定的跳转列表" },
			{ value: "collapsed", label: "已折叠", description: "显示几行并提供展开器" },
			{ value: "full", label: "完整", description: "始终列出所有活动代理" },
		],
	},
});

export const cfgDisplaySubagentLivePreview = register({
	id: "display.subagentLivePreview",
	type: "boolean",
	default: false,
	ui: {
		tab: "appearance",
		group: "显示",
		label: "子代理实时预览",
		description: "在每个固定子代理的行下方显示其当前（或最近一次）工具调用",
	},
});

export const cfgDisplaySmoothStreaming = register({
	id: "display.smoothStreaming",
	type: "boolean",
	default: true,
	ui: {
		tab: "appearance",
		group: "显示",
		label: "平滑流式输出",
		description: "在数据块到达时平滑地逐字显示助手文本与流式工具输入",
	},
});

export const cfgDisplayHideToolActivity = register({
	id: "display.hideToolActivity",
	type: "boolean",
	default: false,
	ui: {
		tab: "appearance",
		group: "显示",
		label: "隐藏工具活动",
		description: "在会话记录中隐藏模型发起的工具调用与结果",
	},
});

export const cfgDisplayShowTokenUsage = register({
	id: "display.showTokenUsage",
	type: "boolean",
	default: false,
	ui: {
		tab: "appearance",
		group: "显示",
		label: "显示令牌用量",
		description: "在助手消息上显示每轮令牌用量",
	},
});

export const cfgDisplayShowTurnTime = register({
	id: "display.showTurnTime",
	type: "boolean",
	default: false,
	ui: {
		tab: "appearance",
		group: "显示",
		label: "显示回合时间",
		description: "在助手消息的用量行显示从提示到让出的总耗时（含工具调用）",
	},
});

export const cfgDisplayCacheMissMarker = register({
	id: "display.cacheMissMarker",
	type: "boolean",
	default: false,
	ui: {
		tab: "appearance",
		group: "显示",
		label: "缓存未命中标记",
		description: "在提示词缓存未命中（丢失）的助手回合之后显示一条分隔线",
	},
});
effect(
	combine({
		hideToolActivity: cfgDisplayHideToolActivity,
		readToolResultPreview: cfgReadToolResultPreview,
		showImages: cfgTerminalShowImages,
		cacheMissMarker: cfgDisplayCacheMissMarker,
		showTokenUsage: cfgDisplayShowTokenUsage,
		showTurnTime: cfgDisplayShowTurnTime,
	}),
	setChatTranscriptDisplayPreferences,
);

export const cfgDisplayCollapseCompacted = register({
	id: "display.collapseCompacted",
	type: "boolean",
	default: true,
	ui: {
		tab: "appearance",
		group: "显示",
		label: "折叠已压缩历史",
		description:
			"在实时会话记录中把压缩前的历史折叠到摘要分隔线之后；关闭则在每个压缩点用分隔线保留完整记录",
	},
});

export const cfgShowHardwareCursor = register({
	id: "showHardwareCursor",
	type: "boolean",
	default: true, // will be computed based on platform if undefined
	ui: {
		tab: "appearance",
		group: "显示",
		label: "显示硬件光标",
		description: "显示终端光标以支持输入法",
	},
});

export const cfgTuiImeSafeCursor = register({
	id: "tui.imeSafeCursor",
	type: "boolean",
	default: false,
	ui: {
		tab: "appearance",
		group: "显示",
		label: "输入法安全布局",
		description: "把提示词的下边框移到单独一行，避免 macOS 输入法的预编辑内容将其顶开",
	},
});

// ────────────────────────────────────────────────────────────────────────
// Interaction
// ────────────────────────────────────────────────────────────────────────

// Conversation flow
export const cfgSteeringMode = register({
	id: "steeringMode",
	type: "enum",
	values: ["all", "one-at-a-time"] as const,
	default: "one-at-a-time",
	ui: {
		tab: "interaction",
		group: "输入",
		label: "引导模式",
		description: "代理工作时如何处理排队消息",
	},
});

export const cfgFollowUpMode = register({
	id: "followUpMode",
	type: "enum",
	values: ["all", "one-at-a-time"] as const,
	default: "one-at-a-time",
	ui: {
		tab: "interaction",
		group: "输入",
		label: "跟进模式",
		description: "回合完成后如何排空跟进消息",
	},
});

export const cfgInterruptMode = register({
	id: "interruptMode",
	type: "enum",
	values: ["immediate", "wait"] as const,
	default: "immediate",
	ui: {
		tab: "interaction",
		group: "输入",
		label: "中断模式",
		description: "当引导消息中断工具执行时的处理方式",
	},
});

export const cfgTuiVimMode = register({
	id: "tui.vimMode",
	type: "boolean",
	default: false,
	ui: {
		tab: "interaction",
		group: "输入",
		label: "Vim 编辑模式",
		get description() {
			return `模态提示词编辑。${formatKeyHint("escape")} 退出插入模式；普通模式支持 hjkl、0、$、^、w、b、e、gg、G、计数、x/D/C、dd/yy、p 与 u；操作符可搭配动作或文本对象（diw、ca(、dap）；v/V 进入可视选择，y 复制、d 删除`;
		},
	},
});

export const cfgTuiVimModeDisplay = register({
	id: "tui.vimModeDisplay",
	type: "enum",
	values: ["text", "icon", "none"] as const,
	default: "text",
	ui: {
		tab: "interaction",
		group: "输入",
		label: "Vim 模式指示器",
		description: "当前 Vim 模式在状态栏中的显示方式",
		condition: "vimModeEnabled",
		options: [
			{ value: "text", label: "文本", description: "完整模式名称 — NORMAL、INSERT、VISUAL、V-LINE、REPLACE" },
			{ value: "icon", label: "图标", description: "每种模式使用单个紧凑字形" },
			{ value: "none", label: "隐藏", description: "不在状态栏显示该模式" },
		],
	},
});

export const cfgLoopMode = register({
	id: "loop.mode",
	type: "enum",
	values: ["prompt", "compact", "reset"] as const,
	default: "prompt",
	ui: {
		tab: "interaction",
		group: "输入",
		label: "循环模式",
		description: "在重新提交提示词前，/loop 迭代之间发生的事情",
		options: [
			{
				value: "prompt",
				label: "提示词",
				description: "将提示词作为跟进消息重新提交（当前行为）",
			},
			{
				value: "compact",
				label: "压缩",
				description: "压缩会话上下文，然后重新提交提示词",
			},
			{ value: "reset", label: "重置", description: "开始新会话，然后重新提交提示词" },
		],
	},
});

export const cfgLoopConditionTimeoutMs = register({
	id: "loop.conditionTimeoutMs",
	type: "number",
	default: 30_000,
	ui: {
		tab: "interaction",
		group: "输入",
		label: "循环条件超时（毫秒）",
		description:
			"`/loop --while` / `--until` 条件命令的最长等待时间，超过则视为失效并停止循环。设为 0 表示无限等待",
		options: [
			{ value: "0", label: "无限制" },
			{ value: "10000", label: "10 秒" },
			{ value: "30000", label: "30 秒" },
			{ value: "120000", label: "2 分钟" },
		],
	},
});

// Input and startup
export const cfgComposerRecallClearedDrafts = register({
	id: "composer.recallClearedDrafts",
	type: "boolean",
	default: true,
	ui: {
		tab: "interaction",
		group: "输入",
		label: "恢复已清除的草稿",
		get description() {
			return `在本地 ${formatKeyHint("ctrl+c")} 历史中用 ${formatKeyHints(["up", "down"])} 清除的草稿会保留到退出；禁用后只影响后续清除`;
		},
	},
});

export const cfgDoubleEscapeAction = register({
	id: "doubleEscapeAction",
	type: "enum",
	values: ["rewind", "tree", "none"] as const,
	default: "rewind",
	ui: {
		tab: "interaction",
		group: "输入",
		label: "双击 Escape 操作",
		get description() {
			return `在空编辑器中连按两次 ${formatKeyHint("escape")} 的行为：打开会话回退选择器、打开会话树，或不做任何事`;
		},
	},
});

export const cfgBareExitOnEmptySession = register({
	id: "input.bareExitOnEmptySession",
	type: "boolean",
	default: true,
	ui: {
		tab: "interaction",
		group: "输入",
		label: "空会话时直接退出",
		description:
			"在首条消息前仅输入 `exit`、`quit` 或 `q`（不区分大小写）即可退出，而不是发消息给模型",
	},
});

export const cfgBareSlashCommands = register({
	id: "input.bareSlashCommands",
	type: "boolean",
	default: false,
	ui: {
		tab: "interaction",
		group: "输入",
		label: "裸斜杠命令",
		description:
			"仅输入不带前导 `/` 的命令名（例如 `model`、`compact`）会执行对应的斜杠命令；会话已有消息后，需按两次回车确认",
	},
});

export const cfgTreeFilterMode = register({
	id: "treeFilterMode",
	type: "enum",
	values: TREE_FILTER_MODES,
	default: "default",
	ui: {
		tab: "interaction",
		group: "输入",
		label: "会话树筛选",
		description: "打开会话树时的默认筛选模式",
	},
});

export const cfgAutocompleteMaxVisible = register({
	id: "autocompleteMaxVisible",
	type: "number",
	default: 10,
	ui: {
		tab: "interaction",
		group: "输入",
		label: "自动补全项",
		description: "自动补全下拉框最大可见项数 (3-20)",
		options: [
			{ value: "3", label: "3 项" },
			{ value: "5", label: "5 项" },
			{ value: "7", label: "7 项" },
			{ value: "10", label: "10 项" },
			{ value: "15", label: "15 项" },
			{ value: "20", label: "20 项" },
		],
	},
});

export const cfgSpellingTypoDetection = register({
	id: "spelling.typoDetection",
	type: "boolean",
	default: true,
	ui: {
		tab: "interaction",
		group: "输入",
		label: "拼写检测 (macOS)",
		description: "用当前启用的 macOS 词典标记提示词中的拼写错误",
		condition: "macOS",
	},
});

export const cfgSpellingAutocomplete = register({
	id: "spelling.autocomplete",
	type: "enum",
	values: WORD_COMPLETION_METHODS,
	default: "auto",
	ui: {
		tab: "interaction",
		group: "输入",
		label: "单词自动补全",
		get description() {
			return `以内联提示显示预测的词补全：${formatKeyHint("tab")} 接受并加空格，${formatKeyHint("right")} 接受不加空格`;
		},
		options: [
			{ value: "off", label: "关闭", description: "无单词补全" },
			{
				value: "auto",
				label: "自动",
				description: "N-gram（无需下载）",
			},
			{ value: "ngram", label: "N-gram", description: "从提示词历史学习你的词汇" },
			{
				value: "smollm",
				label: "SmolLM",
				description: "小型的设备端语言模型，与 N-gram 混合（首次使用时下载权重）",
			},
			...(process.platform === "darwin"
				? [{ value: "apple" as const, label: "Apple", description: "macOS 词典补全" }]
				: []),
		],
	},
});

export const cfgComposerPredictions = register({
	id: "composer.predictions",
	type: "boolean",
	default: false,
	ui: {
		tab: "interaction",
		group: "输入",
		label: "输入框预测",
		get description() {
			return `每轮完成后，让当前模型预测你的下一条消息，并以幽灵文本显示在空输入框中；${formatKeyHint("tab")} 或 ${formatKeyHint("right")} 可插入而不发送。额外消耗：每个完成的回合都会额外发送一次覆盖整段对话的计费请求（计入 /stats）`;
		},
	},
});

export const cfgSpellingAutocorrect = register({
	id: "spelling.autocorrect",
	type: "boolean",
	default: false,
	ui: {
		tab: "interaction",
		group: "输入",
		label: "自动更正 (macOS)",
		description: "在单词完成后应用高置信度的 macOS 拼写更正",
		condition: "macOS",
	},
});

export const cfgEmojiAutocomplete = register({
	id: "emojiAutocomplete",
	type: "boolean",
	default: true,
	ui: {
		tab: "interaction",
		group: "输入",
		label: "Emoji 自动补全",
		description: "从 `:name:` 短代码提示 Emoji，并展开 `:D`、`:-)` 这类文本表情",
	},
});
effect(cfgEmojiAutocomplete, setEmojiAutocompleteEnabled);

export const cfgPasteLargeMenuThreshold = register({
	id: "paste.largeMenuThreshold",
	type: "number",
	default: 100,
	ui: {
		tab: "interaction",
		group: "输入",
		label: "大段粘贴菜单",
		description:
			"当粘贴内容达到这么多行时，提供菜单将其包裹为代码块、包裹为 XML 标签，或保存到文件。0 表示禁用该菜单（大段粘贴仍会折叠为 [Paste] 标记）。",
		options: [
			{ value: "0", label: "关闭" },
			{ value: "100", label: "100 行" },
			{ value: "250", label: "250 行" },
			{ value: "500", label: "500 行" },
			{ value: "1000", label: "1000 行" },
		],
	},
});

export const cfgStartupQuiet = register({
	id: "startup.quiet",
	type: "boolean",
	default: false,
	ui: {
		tab: "interaction",
		group: "启动与更新",
		label: "静默启动",
		description: "跳过欢迎界面与启动状态消息",
	},
});

export const cfgStartupShowSplash = register({
	id: "startup.showSplash",
	type: "boolean",
	default: false,
	ui: {
		tab: "interaction",
		group: "启动与更新",
		label: "显示启动画面",
		description:
			"在正常交互式启动时显示完整的动画启动画面，但不重跑设置流程。静默启动仍会抑制它。",
	},
});

export const cfgStartupSetupWizard = register({
	id: "startup.setupWizard",
	type: "boolean",
	default: true,
	ui: {
		tab: "interaction",
		group: "启动与更新",
		label: "设置向导",
		description: "每个设置版本显示一次新增的引导步骤",
	},
});

export const cfgStartupCheckUpdate = register({
	id: "startup.checkUpdate",
	type: "boolean",
	default: true,
	ui: {
		tab: "interaction",
		group: "启动与更新",
		label: "检查更新",
		description: "启动时检查 omp 更新",
	},
});

export const cfgUpdateChannel = register({
	id: "update.channel",
	type: "enum",
	values: ["stable", "canary"] as const,
	default: "stable",
	ui: {
		tab: "interaction",
		group: "启动与更新",
		label: "更新通道",
		description: "omp update 与启动时更新检查使用的更新通道",
		options: [
			{ value: "stable", label: "稳定" },
			{ value: "canary", label: "金丝雀" },
		],
	},
});

export const cfgMarketplaceAutoUpdate = register({
	id: "marketplace.autoUpdate",
	type: "enum",
	values: ["off", "notify", "auto"] as const,
	default: "notify",
	ui: {
		tab: "interaction",
		group: "启动与更新",
		label: "插件市场自动更新",
		description: "启动时检查插件更新",
		options: [
			{ value: "off", label: "关闭", description: "不检查插件更新" },
			{ value: "notify", label: "通知", description: "启动时检查并在有更新时通知" },
			{ value: "auto", label: "自动", description: "启动时检查并自动安装更新" },
		],
	},
});

export const cfgStartupChangelogMode = register({
	id: "startup.changelogMode",
	type: "enum",
	values: ["summary", "expanded", "hidden"] as const,
	default: "summary",
	ui: {
		tab: "interaction",
		group: "启动与更新",
		label: "启动更新日志",
		description: "选择更新说明以摘要、完整详情还是隐藏的方式呈现",
		options: [
			{
				value: "summary",
				label: "摘要",
				description: "显示版本发布与变更数量，并附带 /changelog 提示",
			},
			{
				value: "expanded",
				label: "已展开",
				description: "完整显示最近的版本说明",
			},
			{
				value: "hidden",
				label: "隐藏",
				description: "启动时不显示发行说明",
			},
		],
	},
});

export const cfgMagicKeywordsEnabled = register({
	id: "magicKeywords.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "interaction",
		group: "魔法关键词",
		label: "魔法关键词",
		description: `为独立的 ${MAGIC_KEYWORDS.map(keyword => keyword.word).join(", ")} 关键字启用隐藏通知`,
	},
});

/** One `magicKeywords.<id>` toggle per registered keyword, keyed by keyword id. */
export const cfgMagicKeyword = Object.fromEntries(
	MAGIC_KEYWORDS.map(keyword => [
		keyword.id,
		register({
			id: `magicKeywords.${keyword.id}`,
			type: "boolean",
			default: true,
			ui: { tab: "interaction", group: "魔法关键词", label: keyword.label, description: keyword.description },
		}),
	]),
) as Record<MagicKeywordId, Setting<boolean>>;

// Notifications
export const cfgCompletionNotify = register({
	id: "completion.notify",
	type: "enum",
	values: ["on", "off"] as const,
	default: "on",
	ui: {
		tab: "interaction",
		group: "通知",
		label: "完成通知",
		description: "代理完成一轮时通知",
	},
});

export const cfgErrorNotify = register({
	id: "error.notify",
	type: "enum",
	values: ["on", "off"] as const,
	default: "off",
	ui: {
		tab: "interaction",
		group: "通知",
		label: "错误通知",
		description: "代理因错误停止时通知",
	},
});

export const cfgAskTimeout = register({
	id: "ask.timeout",
	type: "number",
	default: 0,
	ui: {
		tab: "interaction",
		group: "通知",
		label: "询问超时",
		description:
			"经过这么多秒后自动选择推荐的 ask 选项（0 表示禁用）。同时也限制 cfg:// 批准提示；未答复的批准会拒绝写入，而不是自动选择",
		options: [
			{ value: "0", label: "已禁用" },
			{ value: "15", label: "15 秒" },
			{ value: "30", label: "30 秒" },
			{ value: "60", label: "60 秒" },
			{ value: "120", label: "120 秒" },
		],
	},
});

/**
 * `ask.timeout` in the milliseconds dialogs consume, or `undefined` for no
 * deadline. Shared by the ask tool and the `cfg://` approval prompt so the
 * setting means the same thing everywhere it is honored.
 */
export function askTimeoutMs(settings: Settings): number | undefined {
	const timeoutSeconds = cfgAskTimeout.get(settings);
	return timeoutSeconds === 0 ? undefined : timeoutSeconds * 1000;
}

export const cfgAskNotify = register({
	id: "ask.notify",
	type: "enum",
	values: ["on", "off"] as const,
	default: "on",
	ui: {
		tab: "interaction",
		group: "通知",
		label: "询问通知",
		description: "当 ask 工具等待输入时通知",
	},
});

export const cfgRecapEnabled = register({
	id: "recap.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "interaction",
		group: "通知",
		label: "空闲回顾",
		description: "终端空闲后生成一段简短的 LLM 现状回顾",
	},
});

export const cfgRecapIdleSeconds = register({
	id: "recap.idleSeconds",
	type: "number",
	default: 240,
	ui: {
		tab: "interaction",
		group: "通知",
		label: "空闲回顾延迟",
		description: "空闲多少秒后显示回顾",
		options: [
			{ value: "60", label: "1 分钟" },
			{ value: "120", label: "2 分钟" },
			{ value: "240", label: "4 分钟" },
			{ value: "300", label: "5 分钟" },
			{ value: "600", label: "10 分钟" },
		],
	},
});

/** Idle recap policy (`recap.*`). */
export const cfgRecap = combine({ enabled: cfgRecapEnabled, idleSeconds: cfgRecapIdleSeconds });
