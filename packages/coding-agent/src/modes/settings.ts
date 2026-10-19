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
		description: "Automatically resume the most recent session in the current directory",
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
		description: "Show git branch, status, and PR information in the TUI and watch repository metadata.",
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
		description: "Theme used when the terminal has a dark background",
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
		description: "Theme used when the terminal has a light background",
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
		description: "Glyph set for icons and symbols (Unicode, Nerd Font, or ASCII)",
		options: [
			{ value: "unicode", label: "Unicode", description: "标准符号（默认）" },
			{
				value: "nerd",
				label: "Nerd 字体",
				description: "Requires a Nerd Font, or a Glyph Protocol terminal (icons ship in-band)",
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
		description: "Use blue instead of green for diff additions",
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
		description: "Visual layout of the input editor and status line",
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
			"Show a live generation tok/s readout: on the working row next to the session title, or in the native composer bar right after the thinking level, where the last reading stays between turns. Estimated from streamed deltas and corrected by the provider's billed output count as each message completes.",
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
		description: "Style of separators between segments",
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
		description: "How the line between the left and right segments reflects context usage (box composer only)",
		options: [
			{ value: "off", label: "关闭", description: "Solid accent line, no context feedback" },
			{
				value: "percentage",
				label: "百分比",
				description: "Used portion in accent color, remainder dimmed",
			},
			{
				value: "annotated",
				label: "已标注",
				description: "Percentage plus ticks at the speculative and auto-compaction boundaries",
			},
			{
				value: "embedded",
				label: "已嵌入",
				description: "Annotated line with the context percentage and window embedded in the gauge",
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
		description: "Use the session name color for the editor border and status line gap",
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
			"Use the terminal's default background for the status line instead of the theme's `statusLineBg`. Powerline end caps are dropped because they need a contrasting fill to bridge into the surrounding terminal.",
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
			"Show the thinking level as a single icon on the model name instead of a separate ` · <level>` suffix; in Tern's composer, as the model chip's icon instead of a separate chip (click the icon to cycle it).",
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
	items: { values: STATUS_LINE_SEGMENT_IDS, label: "状态栏段" },
});

export const cfgStatusLineRightSegments = register({
	id: "statusLine.rightSegments",
	type: "array",
	default: CUSTOM_STATUS_LINE_DEFAULTS.right,
	items: { values: STATUS_LINE_SEGMENT_IDS, label: "状态栏段" },
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
		description: "Resize large images to 2000x2000 max for better model compatibility",
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
		"Maximum width in terminal columns for inline images (default 100). Set to 0 for unlimited (bounded only by terminal width).",
});
effect(cfgTuiMaxInlineImageColumns, setInlineImageMaxColumns);

export const cfgTuiMaxInlineImageRows = register({
	id: "tui.maxInlineImageRows",
	type: "number",
	default: 20,
	description:
		"Maximum height in terminal rows for inline images (default 20). Set to 0 to use only the viewport-based limit (60% of terminal height).",
});
effect(cfgTuiMaxInlineImageRows, setInlineImageMaxRows);

export const cfgTuiMaxInlineImages = register({
	id: "tui.maxInlineImages",
	type: "number",
	default: 8,
	description:
		"Maximum number of inline images kept as live terminal graphics (default 8). Older images fall back to a text placeholder via a full redraw once the limit is exceeded. Set to 0 to keep every image (no limit).",
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
		description: "How a settled terminal resize refreshes transcript rows retained in terminal scrollback",
		options: [
			{
				value: "append",
				label: "追加",
				description: "Replay the transcript at the new width below retained history",
			},
			{
				value: "rebuild",
				label: "重建",
				description: "Erase all terminal scrollback, then replay one current-width transcript",
			},
			{
				value: "preserve",
				label: "保留",
				description: "Repaint only the viewport and keep history wrapped at its old width",
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
			"Send transcript rows pushed off screen by a growing HUD or dialog straight to scrollback; when it shrinks, blank rows sit between the transcript and the input until new output fills them",
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
			"Emit OSC 9;4 indeterminate progress while the agent or context maintenance is running (always on in Tern)",
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
			"Report whether the agent is working, waiting on you, done, or failed over OSC 7501, for terminal tab indicators and agent inboxes",
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
			"Render Markdown H1 headings at 2x scale using Kitty's OSC 66 text-sizing protocol. Only takes effect on Kitty terminals; ignored everywhere else. Off by default.",
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
			"Invite the agent to draw diagrams and charts as SVG, rendered inline as images on terminals that show graphics",
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
			"Draw a chart under numeric tables in the agent's answers, in your theme's colors, on terminals that show graphics",
		options: [
			{
				value: "smart",
				label: "智能",
				description:
					"The judge model refines each chart: kind, columns, row names and grouping, scales, which way is better, and its title",
			},
			{
				value: "always",
				label: "总是",
				description: "Chart every table that reads as numeric, using the built-in best guess",
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
		description: "Invite the agent to react to your message with an emoji badge on its bubble",
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
			return `Celebrate unscheduled Codex weekly usage resets and newly banked saved resets with a top-third fireworks overlay that remains until ${formatKeyHint("escape")}`;
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
			"Show the agent run state in the terminal title's separator — an animated spinner while working (a static ':' under WSL), '>' when it's your turn, '!' when the agent is waiting on you",
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
			"Glyph set for the working-state spinner in the terminal title — braille sweep, filling moon, single-dot cycle, or ASCII-safe line",
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
			"Wrap paths and URLs in OSC 8 hyperlinks for terminal-native click-to-open (auto: detect support; off: never; always: unconditional)",
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
			return `Capture mouse clicks in the main session so live subagent cards and HUD rows focus on click, with a hover highlight on the target. Native text selection becomes ${shift}+drag and wheel scroll becomes ${shift}+wheel while on`;
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
		description: "Remove the 1-character horizontal padding from the left and right of the terminal output",
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
			{ value: "classic", label: "经典", description: "Soft cosine wave sweeping across the text" },
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
			"Pinned live-agent jump list above the editor (off hides it; collapsed shows a few rows with an expander; full lists all)",
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
		description: "Show each pinned subagent's current (or most recent) tool call beneath its row",
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
		description: "Reveal assistant text and streamed tool input smoothly while chunks arrive",
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
		description: "Hide model-initiated tool calls and results from the transcript",
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
		description: "Show the total prompt-to-yield time (including tool calls) on assistant message usage rows",
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
		description: "Show a divider after an assistant turn whose request lost (missed) the prompt cache",
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
			"Collapse pre-compaction history behind the summary divider on the live transcript; disable to keep the full transcript inline with dividers at each compaction point",
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
		description: "Show terminal cursor for IME support",
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
		description: "Move the prompt's bottom border to a separate row so macOS IME preedit cannot displace it",
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
		description: "How to process queued messages while agent is working",
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
		description: "How to drain follow-up messages after a turn completes",
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
		description: "When steering messages interrupt tool execution",
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
			return `Modal prompt editing. ${formatKeyHint("escape")} leaves Insert mode; Normal mode has hjkl, 0, $, ^, w, b, e, gg, G, counts, x/D/C, dd/yy, p and u; operators take motions or text objects (diw, ca(, dap); v/V start a Visual selection that y copies and d deletes`;
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
		description: "How the current Vim mode appears in the status line",
		condition: "vimModeEnabled",
		options: [
			{ value: "text", label: "文本", description: "Full mode name — NORMAL, INSERT, VISUAL, V-LINE, REPLACE" },
			{ value: "icon", label: "图标", description: "Single compact glyph per mode" },
			{ value: "none", label: "隐藏", description: "Do not show the mode in the status line" },
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
		description: "What happens between /loop iterations before re-submitting the prompt",
		options: [
			{
				value: "prompt",
				label: "提示词",
				description: "Re-submit the prompt as a follow-up message (current behavior)",
			},
			{
				value: "compact",
				label: "压缩",
				description: "压缩会话上下文，然后重新提交提示词",
			},
			{ value: "reset", label: "重置", description: "Start a new session, then re-submit the prompt" },
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
			"Max wait for a `/loop --while` / `--until` condition command before treating it as broken and stopping the loop. Set to 0 to wait indefinitely",
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
			return `Keep drafts cleared with ${formatKeyHint("ctrl+c")} in local ${formatKeyHints(["up", "down"])} history until exit; disabling affects future clears`;
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
			return `What pressing ${formatKeyHint("escape")} twice with an empty editor does: open the transcript rewind selector, open the session tree, or nothing`;
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
			"Submitting exactly `exit`, `quit`, or `q` (any case) before the first message quits instead of prompting the model",
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
			"Submitting exactly a command name without the leading `/` (e.g. `model`, `compact`) runs that slash command; once the session has messages, press Enter twice to confirm",
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
		description: "Mark misspelled prompt words with the active macOS dictionaries",
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
			return `Show predicted word completions as inline hints: ${formatKeyHint("tab")} accepts with a space, ${formatKeyHint("right")} without`;
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
				description: "Small on-device language model blended with N-gram (downloads weights on first use)",
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
			return `After a completed turn, ask the active model to predict your next message and show it as ghost text in the empty composer; ${formatKeyHint("tab")} or ${formatKeyHint("right")} inserts it without sending. Extra usage: every completed turn sends one more billed request over the whole conversation (counted in /stats)`;
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
		description: "Suggest emojis from `:name:` shortcodes and expand text emoticons like `:D` or `:-)`",
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
			"When a paste reaches this many lines, offer a menu to wrap it in a code block, wrap it in XML tags, or save it to a file. 0 disables the menu (large pastes still collapse to a [Paste] marker).",
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
		description: "Skip welcome screen and startup status messages",
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
			"Show the full animated setup splash on normal interactive startup without rerunning setup. Quiet Startup still suppresses it.",
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
		description: "Show newly added onboarding steps once per setup version",
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
		description: "Update channel used by omp update and the startup update check",
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
			{ value: "notify", label: "通知", description: "Check on startup and notify when updates are available" },
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
		description: "Choose whether update notes start as a summary, full details, or stay hidden",
		options: [
			{
				value: "summary",
				label: "摘要",
				description: "Show release and change counts with a /changelog hint",
			},
			{
				value: "expanded",
				label: "已展开",
				description: "Show the recent release notes in full",
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
		description: `Enable hidden notices for standalone ${MAGIC_KEYWORDS.map(keyword => keyword.word).join(", ")} keywords`,
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
			"Auto-select the recommended ask option after this many seconds (0 disables). Also bounds cfg:// approval prompts; an unanswered approval denies the write instead of auto-selecting",
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
		description: "Notify when the ask tool is waiting for input",
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
		description: "Generate a brief LLM recap of where things stand after the terminal has been idle",
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
		description: "Seconds to wait while idle before showing the recap",
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
