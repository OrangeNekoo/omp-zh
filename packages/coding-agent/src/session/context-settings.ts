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
			"作为额外根目录添加到每个会话的工作区目录（多根工作区）。可通过 /add-dir 与 /remove-dir 实时管理。路径相对于 cwd 解析；建议使用绝对路径。代理会被告知这些根目录存在，并可对其执行 read/grep/glob。",
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
			'在 AGENTS.md 之外加载的额外指令文件名。使用名称的 JSON 列表而非路径，例如 ["AGENTS.local.md"]；[] 表示禁用额外指令。需开始新会话才能加载。',
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
			"上下文溢出时提升到模型的 contextPromotionTarget 而非压缩。重试回退切换由「重试模型回退」控制",
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
			"在支持的情况下使用更大的上下文窗口；可能产生溢价计费。关闭则保留默认或标准定价的窗口",
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
		description: "上下文过大时自动压缩",
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
		description: "跨上下文窗口保留持久笔记与可搜索的原始历史。",
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
			"在下一个服务商请求之前的、安全的回合中工具循环边界检查阈值；子代理总是检查，因为它们的整个任务就是一个回合",
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
			"自动上下文维护的首选回退顺序；不可用或失败的方法会推进到下一个选项",
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
		description: "上下文维护的百分比阈值；设为「默认」则使用传统的基于预留量的行为",
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
		description: "上下文维护的固定令牌上限；设置后会覆盖百分比",
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
		description: "将生成的交接文档保存为 Markdown 文件，供自动交接流程使用",
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
		description: "对兼容的远程压缩模型使用 Responses 流式压缩",
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
			"当上下文接近压缩阈值时在后台推测性总结，越过阈值时把准备好的结果拼接进来",
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
		description: "令牌数超过阈值时在空闲期间压缩上下文",
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
		description: "超过此令牌数时触发空闲压缩",
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
			"空闲多少秒后开始压缩；当提示词缓存为 1 小时时，压缩改为在缓存即将过期前执行",
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
		description: "再次读取同一文件时清理较旧的读取结果（缓存感知，每回合运行）",
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
			"被标记为上下文无用的工具结果（无匹配、等待超时）在消费后清理（缓存感知）",
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
			"实验性：把选定的系统提示词文本渲染为高密度 PNG 图像并附加到首条用户消息（仅视觉模型）。可节省令牌；但图像化的文本会失去提示词缓存。",
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
			"实验性：把大型工具结果（包括最新的一个）渲染为高密度 PNG 图像而非文本（仅视觉模型）。可在累积的搜索与命令输出上节省令牌；read 结果保持文本，除非已知该模型能够精确地基于图像进行编辑。",
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
			"控制工具如何暴露给模型。Auto 使用服务商原生工具调用，除非所选模型被标记为不支持，此时回退到 GLM 自有方言。Native 强制使用服务商原生工具；其余值强制使用指定的自有方言。",
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
			"snapcompact 打印文本所使用的画框形状（压缩归档与内联成像）。Auto 会选择针对当前模型调优的形状。",
		options: [
			{
				value: "auto",
				label: "自动",
				description: "选择针对当前模型调优的形状，回退到其服务商系列。",
			},
			{
				value: "8x8r-bw",
				label: "8x8 重复，黑色",
				description:
					"unscii 方块单元，黑色墨水，每行打印两次，副本位于浅色高亮带上。",
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
				description:
					"8x22 单元上的 8x13 字形 — 额外行距避免行间拥挤。OpenAI/Google 的默认值。",
			},
			{
				value: "11on16-bw",
				label: "8x13，11px 字距（跟踪），黑色",
				description:
					"11x16 单元上的 8x13 字形 — 额外字距避免字符粘连。Anthropic 的默认值。",
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
		description: "离开分支时用于总结的提示词",
	},
});

export const cfgBranchSummaryReserveTokens = register({
	id: "branchSummary.reserveTokens",
	type: "number",
	default: 16384,
});
