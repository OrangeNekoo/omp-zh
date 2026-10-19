import {
	type AgentCompactionThresholdOverride,
	validateModelCompactionThresholds,
} from "../config/compaction-threshold";
import { combine, register, type SettingValueOf } from "../config/registry";
import { COMPACTION_METHOD_CHOICES, DEFAULT_COMPACTION_METHOD_ORDER } from "./compaction-methods";
import { SHAPE_VARIANT_NAMES } from "@oh-my-pi/snapcompact";

const EMPTY_STRING_ARRAY: string[] = [];
const EMPTY_MODEL_COMPACTION_THRESHOLDS: Record<string, AgentCompactionThresholdOverride> = {};

export const cfgWorkspaceAdditionalDirectories = register({
	id: "workspace.additionalDirectories",
	type: "array",
	default: EMPTY_STRING_ARRAY,
	ui: {
		tab: "context",
		group: "常规",
		label: "附加工作区目录",
		description:
			"Extra workspace directories added to every session as additional roots (multi-root workspace). Managed live via /add-dir and /remove-dir. Paths resolve relative to cwd; absolute paths recommended. The agent is told these roots exist and can read/grep/glob them.",
	},
});

/** Built-in context filenames. Listing them in `contextFiles.extra` would load a second copy or bypass one-per-depth shadowing. */
const BUILTIN_CONTEXT_FILE_NAMES: Record<string, true> = {
	"agents.md": true,
	"claude.md": true,
	"gemini.md": true,
	"copilot-instructions.md": true,
};

/** Why `entry` is not a valid `contextFiles.extra` name; undefined for a plain, non-built-in file name. */
function contextFileNameError(entry: unknown): string | undefined {
	if (typeof entry !== "string") return `contextFiles.extra entries must be strings (${String(entry)})`;
	const name = entry.trim();
	if (name === "") return "contextFiles.extra entries must not be empty";
	if (BUILTIN_CONTEXT_FILE_NAMES[name.toLowerCase()] === true) {
		return `contextFiles.extra cannot list a built-in context file (${name})`;
	}
	if (name === "." || name === ".." || name.includes("/") || name.includes("\\") || name.includes("\0")) {
		return `contextFiles.extra entries must be file names, not paths (${name})`;
	}
	return undefined;
}

/** Extra instruction filenames discovered in addition to AGENTS.md / CLAUDE.md / GEMINI.md. */
export const cfgContextFilesExtra = register({
	id: "contextFiles.extra",
	type: "array",
	default: EMPTY_STRING_ARRAY,
	ui: {
		tab: "context",
		group: "常规",
		label: "额外上下文文件",
		editor: "json",
		description:
			'Extra instruction filenames loaded beside AGENTS.md. Use a JSON list of names, not paths, e.g. ["AGENTS.local.md"]; [] disables extras. Start a new session to load them.',
		condition: "contextFilesExtraNotProject",
	},
	validate: raw => {
		if (raw === undefined) return;
		if (!Array.isArray(raw)) throw new Error("contextFiles.extra must be a list of file names");
		for (const entry of raw) {
			const error = contextFileNameError(entry);
			if (error !== undefined) throw new Error(error);
		}
	},
});

// ────────────────────────────────────────────────────────────────────────
// Context
// ────────────────────────────────────────────────────────────────────────

// Context promotion
export const cfgContextPromotionEnabled = register({
	id: "contextPromotion.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "context",
		group: "常规",
		label: "自动提升上下文",
		description:
			"Promote to the model's contextPromotionTarget on context overflow instead of compacting. Retry fallback switches are controlled by Retry Model Fallback",
	},
});

// Opt in to advertised maximum context windows and premium long-context
// tiers. Off preserves default windows and caps premium models before
// requests cross into their higher pricing tier.
export const cfgExtendedContext = register({
	id: "extendedContext",
	type: "boolean",
	default: false,
	ui: {
		tab: "context",
		group: "常规",
		label: "扩展上下文",
		description:
			"Use larger context windows where supported; may incur premium pricing. Off keeps default or standard-pricing windows",
	},
});

// Compaction
export const cfgCompactionEnabled = register({
	id: "compaction.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "context",
		group: "压缩",
		label: "自动压缩",
		description: "Automatically compact context when it gets too large",
	},
});

export const cfgCompactionExperimentalContextManagement = register({
	id: "compaction.experimentalContextManagement",
	type: "boolean",
	default: false,
	ui: {
		tab: "context",
		group: "压缩",
		label: "基于笔记的上下文窗口（实验性）",
		description: "Keep persistent notes and searchable raw history across context windows.",
	},
});

export const cfgCompactionMidTurnEnabled = register({
	id: "compaction.midTurnEnabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "context",
		group: "压缩",
		label: "回合中压缩",
		description:
			"Check thresholds at safe mid-turn tool-loop boundaries before the next provider request; subagents always check, since their whole assignment is one turn",
	},
});

export const cfgCompactionMethodOrder = register({
	id: "compaction.methodOrder",
	type: "array",
	default: [...DEFAULT_COMPACTION_METHOD_ORDER],
	ui: {
		tab: "context",
		group: "压缩",
		label: "压缩方法顺序",
		description:
			"Preferred fallback order for automatic context maintenance; unavailable or failed methods advance to the next choice",
		options: COMPACTION_METHOD_CHOICES,
		ordered: true,
	},
});

export const cfgCompactionThresholdPercent = register({
	id: "compaction.thresholdPercent",
	type: "number",
	default: -1,
	ui: {
		tab: "context",
		group: "压缩",
		label: "压缩阈值",
		description: "Percent threshold for context maintenance; set to Default to use legacy reserve-based behavior",
		options: [
			{ value: "default", label: "默认", description: "传统的基于预留量的阈值" },
			{ value: "10", label: "10%", description: "极早维护" },
			{ value: "20", label: "20%", description: "很早维护" },
			{ value: "30", label: "30%", description: "较早维护" },
			{ value: "40", label: "40%", description: "略早维护" },
			{ value: "50", label: "50%", description: "中点" },
			{ value: "60", label: "60%", description: "中等上下文占用" },
			{ value: "70", label: "70%", description: "均衡" },
			{ value: "75", label: "75%", description: "略激进" },
			{ value: "80", label: "80%", description: "典型阈值" },
			{ value: "85", label: "85%", description: "激进的上下文占用" },
			{ value: "90", label: "90%", description: "非常激进" },
			{ value: "95", label: "95%", description: "接近上下文上限" },
		],
	},
});

export const cfgCompactionThresholdTokens = register({
	id: "compaction.thresholdTokens",
	type: "number",
	default: -1,
	ui: {
		tab: "context",
		group: "压缩",
		label: "压缩令牌上限",
		description: "Fixed token limit for context maintenance; overrides percentage if set",
		options: [
			{ value: "default", label: "默认", description: "使用基于百分比的阈值" },
			{ value: "25000", label: "25K 令牌", description: "200K 窗口的 1/8" },
			{ value: "50000", label: "50K 令牌", description: "200K 窗口的 1/4" },
			{ value: "100000", label: "100K 令牌", description: "200K 窗口的 1/2" },
			{ value: "150000", label: "150K 令牌", description: "200K 窗口的 3/4" },
			{ value: "200000", label: "200K 令牌", description: "完整标准上下文窗口" },
			{ value: "300000", label: "300K 令牌", description: "大上下文窗口" },
			{ value: "500000", label: "500K 令牌", description: "超大上下文窗口" },
		],
	},
});

/**
 * Per-model compaction limits for the models they match: `provider/model-id`
 * exactly, else the longest `…*` prefix. A token entry is the base the
 * threshold policy scales in place of the window (see
 * `applyModelCompactionThreshold`); a percentage entry replaces both
 * `compaction.threshold*` fields. Edited from the /models hub; a per-agent
 * `task.agentCompactionThresholdOverrides` entry still wins. A token base past a
 * model's standard window opts that model into its extended window
 * (`ModelRegistry.contextWindowTiers`).
 */
export const cfgCompactionModelThresholds = register({
	id: "compaction.modelThresholds",
	type: "record",
	default: EMPTY_MODEL_COMPACTION_THRESHOLDS,
	validate: validateModelCompactionThresholds,
});

/**
 * Whether `compaction.modelThresholds` applies. Subagent spawn turns it off for an
 * agent whose `task.agentCompactionThresholdOverrides` entry applies, so that entry
 * outranks every model entry, including ones added while the agent runs.
 */
export const cfgCompactionModelThresholdsEnabled = register({
	id: "compaction.modelThresholdsEnabled",
	type: "boolean",
	default: true,
});

export const cfgCompactionHandoffSaveToDisk = register({
	id: "compaction.handoffSaveToDisk",
	type: "boolean",
	default: false,
	ui: {
		tab: "context",
		group: "压缩",
		label: "保存交接文档",
		description: "Save generated handoff documents to markdown files for the auto-handoff flow",
	},
});

export const cfgCompactionRemoteStreamingV2Enabled = register({
	id: "compaction.remoteStreamingV2Enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "context",
		group: "压缩",
		label: "远程压缩 V2",
		description: "Use Responses streaming compaction for compatible remote compaction models",
	},
});

export const cfgCompactionAsyncEnabled = register({
	id: "compaction.asyncEnabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "context",
		group: "压缩",
		label: "异步压缩",
		description:
			"Speculatively summarize in the background as context nears the compaction threshold, then splice the ready result in when the threshold is crossed",
	},
});

// No default: an unset reserve tells the compaction layer the user never
// chose one, so small-window recovery may swap in the proportional reserve
// (see resolveBudgetReserveTokens). A materialized 16384 here would make
// every session look explicitly configured.
export const cfgCompactionReserveTokens = register({
	id: "compaction.reserveTokens",
	type: "number",
	default: undefined,
});

export const cfgCompactionKeepRecentTokens = register({
	id: "compaction.keepRecentTokens",
	type: "number",
	default: 20000,
});

export const cfgCompactionAutoContinue = register({ id: "compaction.autoContinue", type: "boolean", default: true });

export const cfgCompactionRemoteEndpoint = register({
	id: "compaction.remoteEndpoint",
	type: "string",
	default: undefined,
});

export const cfgCompactionV2RetainedMessageBudget = register({
	id: "compaction.v2RetainedMessageBudget",
	type: "number",
	default: 64000,
});

// Idle compaction
export const cfgCompactionIdleEnabled = register({
	id: "compaction.idleEnabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "context",
		group: "压缩",
		label: "空闲压缩",
		description: "Compact context while idle when token count exceeds threshold",
	},
});

export const cfgCompactionIdleThresholdTokens = register({
	id: "compaction.idleThresholdTokens",
	type: "number",
	default: 200000,
	ui: {
		tab: "context",
		group: "压缩",
		label: "空闲压缩阈值",
		description: "Token count above which idle compaction triggers",
		options: [
			{ value: "100000", label: "100K 令牌" },
			{ value: "200000", label: "200K 令牌" },
			{ value: "300000", label: "300K 令牌" },
			{ value: "400000", label: "400K 令牌" },
			{ value: "500000", label: "500K 令牌" },
			{ value: "600000", label: "600K 令牌" },
			{ value: "700000", label: "700K 令牌" },
			{ value: "800000", label: "800K 令牌" },
			{ value: "900000", label: "900K 令牌" },
		],
	},
});

export const cfgCompactionIdleTimeoutSeconds = register({
	id: "compaction.idleTimeoutSeconds",
	type: "number",
	default: 300,
	ui: {
		tab: "context",
		group: "压缩",
		label: "空闲压缩延迟",
		description:
			"Seconds to wait while idle before compacting; with a 1-hour prompt cache, compaction instead runs just before the cache expires",
		options: [
			{ value: "60", label: "1 分钟" },
			{ value: "120", label: "2 分钟" },
			{ value: "300", label: "5 分钟" },
			{ value: "600", label: "10 分钟" },
			{ value: "1800", label: "30 分钟" },
			{ value: "3600", label: "1 小时" },
		],
	},
});

export const cfgCompactionSupersedeReads = register({
	id: "compaction.supersedeReads",
	type: "boolean",
	default: true,
	ui: {
		tab: "context",
		group: "压缩",
		label: "取代过期的读取",
		description: "Prune older read results when the same file is read again (cache-aware, runs every turn)",
	},
});

export const cfgCompactionDropUseless = register({
	id: "compaction.dropUseless",
	type: "boolean",
	default: true,
	ui: {
		tab: "context",
		group: "压缩",
		label: "省略无变化的结果",
		description:
			"Prune tool results flagged contextually useless (no matches, timed-out waits) once consumed (cache-aware)",
	},
});

/** Every `compaction.*` setting as one memoized snapshot (the configured compaction policy). */
export const cfgCompaction = combine({
	enabled: cfgCompactionEnabled,
	experimentalContextManagement: cfgCompactionExperimentalContextManagement,
	methodOrder: cfgCompactionMethodOrder,
	thresholdPercent: cfgCompactionThresholdPercent,
	thresholdTokens: cfgCompactionThresholdTokens,
	reserveTokens: cfgCompactionReserveTokens,
	keepRecentTokens: cfgCompactionKeepRecentTokens,
	midTurnEnabled: cfgCompactionMidTurnEnabled,
	asyncEnabled: cfgCompactionAsyncEnabled,
	handoffSaveToDisk: cfgCompactionHandoffSaveToDisk,
	autoContinue: cfgCompactionAutoContinue,
	remoteEndpoint: cfgCompactionRemoteEndpoint,
	remoteStreamingV2Enabled: cfgCompactionRemoteStreamingV2Enabled,
	v2RetainedMessageBudget: cfgCompactionV2RetainedMessageBudget,
	idleEnabled: cfgCompactionIdleEnabled,
	idleThresholdTokens: cfgCompactionIdleThresholdTokens,
	idleTimeoutSeconds: cfgCompactionIdleTimeoutSeconds,
	supersedeReads: cfgCompactionSupersedeReads,
	dropUseless: cfgCompactionDropUseless,
});

/**
 * Configured compaction policy ({@link cfgCompaction}). `baseWindowTokens` is
 * never configured directly: a `compaction.modelThresholds` token entry sets it
 * for its model (see `applyModelCompactionThreshold`).
 */
export type CompactionSettings = SettingValueOf<typeof cfgCompaction> & { baseWindowTokens?: number };

// Experimental: snapcompact inline imaging (transient, per-request; never persisted)
export const cfgSnapcompactSystemPrompt = register({
	id: "snapcompact.systemPrompt",
	type: "enum",
	values: ["none", "agents-md", "all"] as const,
	default: "none",
	ui: {
		tab: "context",
		group: "实验性",
		label: "Snapcompact 系统提示词",
		description:
			"Experimental: render selected system prompt text as dense PNG image(s) and attach to the first user message (vision models only). Saves tokens; loses prompt caching for imaged text.",
		options: [
			{ value: "none", label: "无", description: "将系统提示词保留为文本。" },
			{
				value: "agents-md",
				label: "AGENTS.md",
				description: "仅在能节省令牌时，把已加载的上下文文件说明转为图像。",
			},
			{
				value: "all",
				label: "全部",
				description: "当能节省令牌时，把完整系统提示词转为图像。",
			},
		],
	},
});

export const cfgSnapcompactToolResults = register({
	id: "snapcompact.toolResults",
	type: "boolean",
	default: false,
	ui: {
		tab: "context",
		group: "实验性",
		label: "Snapcompact 工具结果",
		description:
			"Experimental: render large tool results, the newest one included, as dense PNG image(s) instead of text (vision models only). Saves tokens on accumulated search and command output; read results stay text unless the model is known to edit exactly from images.",
	},
});

export const cfgToolsFormat = register({
	id: "tools.format",
	type: "enum",
	values: [
		"auto",
		"native",
		"glm",
		"hermes",
		"kimi",
		"xml",
		"anthropic",
		"deepseek",
		"harmony",
		"qwen3",
		"gemini",
		"gemma",
		"minimax",
	] as const,
	default: "auto",
	ui: {
		tab: "context",
		group: "实验性",
		label: "工具调用模式",
		description:
			"Controls how tools are exposed to the model. Auto uses provider-native tool calls unless the selected model is marked as not supporting them, then falls back to the GLM owned dialect. Native forces provider-native tools; the other values force the named owned dialect.",
		options: [
			{
				value: "auto",
				label: "自动",
				description: "除非已知模型不支持，否则使用原生工具调用。",
			},
			{ value: "native", label: "原生", description: "使用服务商原生工具调用。" },
			{ value: "glm", label: "GLM", description: "使用 GLM 风格的带内工具调用。" },
			{ value: "hermes", label: "Hermes", description: "使用 Hermes 风格的带内工具调用。" },
			{ value: "kimi", label: "Kimi", description: "使用 Kimi 风格的带内工具调用。" },
			{ value: "xml", label: "XML", description: "使用通用 XML 带内工具调用。" },
			{ value: "anthropic", label: "Anthropic", description: "使用 Anthropic 风格的带内工具调用。" },
			{ value: "deepseek", label: "DeepSeek", description: "使用 DeepSeek 风格的带内工具调用。" },
			{ value: "harmony", label: "Harmony", description: "使用 Harmony 风格的带内工具调用。" },
			{ value: "qwen3", label: "Qwen3", description: "使用 Qwen3 自有方言。" },
			{ value: "gemini", label: "Gemini", description: "使用 Gemini 自有方言。" },
			{ value: "gemma", label: "Gemma", description: "使用 Gemma 自有方言。" },
			{ value: "minimax", label: "MiniMax", description: "使用 MiniMax 自有方言。" },
		],
	},
});

export const cfgSnapcompactShape = register({
	id: "snapcompact.shape",
	type: "enum",
	values: ["auto", ...SHAPE_VARIANT_NAMES] as const,
	default: "auto",
	ui: {
		tab: "context",
		group: "实验性",
		label: "Snapcompact 形状",
		description:
			"Frame shape snapcompact prints text with (compaction archive and inline imaging). Auto picks a shape tuned for the current model.",
		options: [
			{
				value: "auto",
				label: "自动",
				description: "选择针对当前模型调优的形状，回退到其服务商系列。",
			},
			{
				value: "8x8r-bw",
				label: "8x8 重复，黑色",
				description: "unscii 方块单元，黑色墨水，每行打印两次，副本位于浅色高亮带上。",
			},
			{
				value: "8x8r-sent",
				label: "8x8 重复，句子色相",
				description: "重复网格，在句子边界循环六种色相墨水。",
			},
			{
				value: "8x8u-bw",
				label: "8x8，黑色",
				description: "普通 unscii 方块单元，单次打印行，黑色墨水。",
			},
			{
				value: "8x8u-sent",
				label: "8x8，句子色相",
				description: "普通 unscii 方块单元，句子色相墨水。",
			},
			{
				value: "6x6u-bw",
				label: "6x6 密集，黑色",
				description: "unscii 压缩至 6x6 — 最密集的可读单元、最少画框 — 黑色墨水。",
			},
			{
				value: "6x6u-sent",
				label: "6x6 密集，句子色相",
				description: "最密集单元，句子色相墨水。",
			},
			{
				value: "5x8-bw",
				label: "5x8 传统，黑色",
				description: "2576px 画框上的原始 X.org 5x8 字形，黑色墨水。",
			},
			{
				value: "5x8-sent",
				label: "5x8 传统，句子色相",
				description: "原始 snapcompact 形状（形状表之前的会话渲染为此）。",
			},
			{
				value: "6x12-dim",
				label: "6x12，弱化停用词",
				description: "X.org 6x12 字形，黑色墨水，虚词弱化为灰色。",
			},
			{
				value: "8x13-bw",
				label: "8x13，黑色",
				description: "X.org 8x13 字形，黑色墨水。",
			},
			{
				value: "8on16-bw",
				label: "8x13，16px 间距，黑色",
				description: "8x16 单元上的 8x13 字形（额外行距），黑色墨水。",
			},
			{
				value: "8on22-bw",
				label: "8x13，22px 间距（行距），黑色",
				description: "8x22 单元上的 8x13 字形 — 额外行距避免行间拥挤。OpenAI/Google 的默认值。",
			},
			{
				value: "11on16-bw",
				label: "8x13，11px 字距（跟踪），黑色",
				description: "11x16 单元上的 8x13 字形 — 额外字距避免字符粘连。Anthropic 的默认值。",
			},
			{
				value: "silver16-bw",
				label: "Silver 16，中日韩",
				description: "16px 网格上的内嵌 Silver TrueType 字体，适用于中日韩及其他非拉丁文字。",
			},
			{
				value: "doc-8on16-bw",
				label: "Doc 8on16，黑色",
				description: "16px 间距上的双栏自动换行报纸式布局，8x13 字形，黑色墨水。",
			},
			{
				value: "doc-8on16-sent",
				label: "Doc 8on16，句子色相",
				description: "双栏文档布局，句子色相墨水。",
			},
			{
				value: "doc-8on16-sent-dim",
				label: "Doc 8on16，句子色相 + 弱化停用词",
				description: "双栏文档布局，句子色相墨水，虚词弱化为灰色。",
			},
		],
	},
});

// Branch summaries
export const cfgBranchSummaryEnabled = register({
	id: "branchSummary.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "context",
		group: "常规",
		label: "分支摘要",
		description: "Prompt to summarize when leaving a branch",
	},
});

export const cfgBranchSummaryReserveTokens = register({
	id: "branchSummary.reserveTokens",
	type: "number",
	default: 16384,
});
