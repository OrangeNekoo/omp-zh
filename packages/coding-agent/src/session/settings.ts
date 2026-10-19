import { combine, effect, register, type SettingValueOf } from "../config/registry";
import {
	SERVICE_TIER_ANTHROPIC_OPTIONS,
	SERVICE_TIER_ANTHROPIC_VALUES,
	SERVICE_TIER_GOOGLE_OPTIONS,
	SERVICE_TIER_GOOGLE_VALUES,
	SERVICE_TIER_INHERIT_OPTIONS,
	SERVICE_TIER_INHERIT_SETTING_VALUES,
	SERVICE_TIER_OPENAI_OPTIONS,
	SERVICE_TIER_OPENAI_VALUES,
} from "../config/service-tier";
import {
	TINY_MODEL_DEVICE_DEFAULT,
	TINY_MODEL_DEVICE_SETTING_OPTIONS,
	TINY_MODEL_DEVICE_SETTING_VALUES,
} from "../tiny/device";
import {
	TINY_MODEL_DTYPE_DEFAULT,
	TINY_MODEL_DTYPE_SETTING_OPTIONS,
	TINY_MODEL_DTYPE_SETTING_VALUES,
} from "../tiny/dtype";
import { DEFAULT_WEB_SEARCH_TIMEOUT_SECONDS, MAX_WEB_SEARCH_TIMEOUT_SECONDS } from "../web/search/types";
import { DEFAULT_USAGE_RESERVE_PCT } from "@oh-my-pi/pi-ai/auth-storage";
import { configureProviderStoreResponses } from "@oh-my-pi/pi-ai/providers/openai-responses";
import { configureProviderMaxInFlightRequests } from "@oh-my-pi/pi-ai/stream";
import { THINKING_EFFORTS } from "@oh-my-pi/pi-catalog/effort";
import { formatKeyHint } from "@oh-my-pi/pi-tui/app-keybindings";
import { AUTO_THINKING, getConfiguredThinkingLevelMetadata, getThinkingLevelMetadata } from "@oh-my-pi/pi-tui/thinking";

const EMPTY_NUMBER_RECORD: Record<string, number> = {};
const EMPTY_STRING_ARRAYS_RECORD: Record<string, string[]> = {};
const DEFAULT_TOOL_CALL_LOOP_EXEMPT_TOOLS: string[] = ["wait"];

// Power assertions: macOS IOKit, Linux login1/ScreenSaver, Windows execution state.
export const cfgPowerSleepPrevention = register({
	id: "power.sleepPrevention",
	type: "enum",
	values: ["off", "idle", "display", "system"] as const,
	default: "idle",
	ui: {
		tab: "interaction",
		group: "电源",
		label: "休眠阻止",
		description:
			"在有活动会话时阻止系统休眠。每一级都是累积的 — 会包含所有更低级别的标志。",
		options: [
			{
				value: "off",
				label: "关闭",
				description: "不阻止任何休眠",
			},
			{
				value: "idle",
				label: "阻止空闲休眠",
				description: "会话打开期间保持系统唤醒（macOS `caffeinate -i`）",
			},
			{
				value: "display",
				label: "阻止显示器休眠",
				description: "同时阻止显示器空闲休眠（macOS `caffeinate -i -d`）",
			},
			{
				value: "system",
				label: "阻止系统休眠",
				description:
					"同时在接通电源时阻止所有系统休眠并声明用户活跃（macOS `caffeinate -i -d -s -u`）",
			},
		],
	},
});

export const cfgPrewalkEnabled = register({
	id: "prewalk.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "model",
		group: "预走",
		label: "启用预走",
		description:
			"先使用当前模型，在计划提示的待办列表存在后的首次编辑/写入时切换到快速/廉价模型（默认 'smol' 角色）— 强模型负责规划、提交待办并开始实现，然后移交。可用 --prewalk / --no-prewalk 按会话覆盖。",
	},
});

export const cfgPrewalkAuto = register({
	id: "prewalk.auto",
	type: "enum",
	values: ["off", "suggest", "on"] as const,
	default: "off",
	ui: {
		tab: "model",
		group: "预走",
		label: "自动预走",
		description:
			"让通过 'judge' 角色解析的原生判定器判断每个新的顶层用户任务是否把硬推理前置。需要原生判定器；没有它则不做任何分类。与「启用预走」相互独立。",
		options: [
			{ value: "off", label: "关闭", description: "从不为预走分类提示词" },
			{
				value: "suggest",
				label: "建议",
				description: "对每个任务分类并报告决策，但不启用预走",
			},
			{
				value: "on",
				label: "开启",
				description:
					"对于确定要前置推理的任务，启用从当前模型到自动目标的移交；下一个任务会重新从规划模型开始",
			},
		],
	},
});

export const cfgPrewalkAutoTarget = register({
	id: "prewalk.autoTarget",
	type: "string",
	default: "@smol",
	ui: {
		tab: "model",
		group: "预走",
		label: "自动预走目标",
		description: "自动预走在首次编辑/写入时移交到的模型或角色（默认 '@smol'）。",
	},
});

function isLimitRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveLimit(limit: unknown): limit is number {
	return typeof limit === "number" && Number.isFinite(limit) && limit > 0;
}

/** Per-provider request limits floored to whole numbers ≥ 1; non-positive or non-numeric entries are dropped. */
export function normalizeProviderMaxInFlightRequests(value: unknown): Record<string, number> {
	const normalized: Record<string, number> = {};
	if (!isLimitRecord(value)) return normalized;
	for (const provider in value) {
		const limit = value[provider];
		if (isPositiveLimit(limit)) normalized[provider] = Math.max(1, Math.floor(limit));
	}
	return normalized;
}

/**
 * Per-provider request limits floored to whole numbers ≥ 1.
 *
 * @throws Error naming every provider whose limit is not a positive number.
 */
export function validateProviderMaxInFlightRequests(value: unknown): Record<string, number> {
	if (isLimitRecord(value)) {
		const invalidProviders: string[] = [];
		for (const provider in value) if (!isPositiveLimit(value[provider])) invalidProviders.push(provider);
		if (invalidProviders.length > 0) {
			throw new Error(`Provider request limits must be positive numbers: ${invalidProviders.join(", ")}`);
		}
	}
	return normalizeProviderMaxInFlightRequests(value);
}

export const cfgProvidersMaxInFlightRequests = register({
	id: "providers.maxInFlightRequests",
	type: "record",
	default: EMPTY_NUMBER_RECORD,
	validate: validateProviderMaxInFlightRequests,
	normalize: validateProviderMaxInFlightRequests,
	ui: {
		tab: "providers",
		group: "服务",
		label: "最大并发请求数",
		description:
			'每个服务商 ID（例如 "openai" 或 "anthropic"）的最大并发 LLM 请求数，在同一配置根目录下的本地 OMP 进程间共享。未列出的服务商不限制。',
	},
});
effect(cfgProvidersMaxInFlightRequests, limits =>
	configureProviderMaxInFlightRequests(normalizeProviderMaxInFlightRequests(limits)),
);

export const cfgImagesDescribeForTextModels = register({
	id: "images.describeForTextModels",
	type: "boolean",
	default: true,
	ui: {
		tab: "model",
		group: "视觉",
		label: "为文本模型描述图像",
		description:
			"当图像被附加到不支持视觉的模型时，将其保存到 local:// 并注入来自具备视觉能力模型的描述，而不是直接丢弃",
	},
});

// ────────────────────────────────────────────────────────────────────────
// Model
// ────────────────────────────────────────────────────────────────────────

// Reasoning and prompts
export const cfgDefaultThinkingLevel = register({
	id: "defaultThinkingLevel",
	type: "enum",
	values: [...THINKING_EFFORTS, AUTO_THINKING],
	default: "high",
	ui: {
		tab: "model",
		group: "思考",
		label: "思考等级",
		description: "支持思考的模型的推理深度",
		options: [getConfiguredThinkingLevelMetadata(AUTO_THINKING), ...THINKING_EFFORTS.map(getThinkingLevelMetadata)],
	},
});

export const cfgHideThinkingBlock = register({
	id: "hideThinkingBlock",
	type: "boolean",
	default: false,
	ui: {
		tab: "model",
		group: "思考",
		label: "隐藏思考块",
		description: "在助手回复中隐藏思考块",
	},
});

export const cfgExpandThinkingBlocks = register({
	id: "expandThinkingBlocks",
	type: "boolean",
	default: false,
	ui: {
		tab: "model",
		group: "思考",
		label: "展开思考块",
		description: "回合结束时保持已完成的思考块展开，而非折叠",
		condition: "nativeRendering",
	},
});

export const cfgProseOnlyThinking = register({
	id: "proseOnlyThinking",
	type: "boolean",
	default: true,
	ui: {
		tab: "model",
		group: "思考",
		label: "仅正文思考",
		description: "从思考摘要中省略代码块，并用省略号代替",
	},
});

export const cfgOmitThinking = register({
	id: "omitThinking",
	type: "boolean",
	default: false,
	ui: {
		tab: "model",
		group: "思考",
		label: "省略思考摘要",
		description: "要求上游服务商在响应中完全省略思考摘要（在支持的情况下）",
	},
});

export const cfgExternalThinking = register({
	id: "externalThinking",
	type: "boolean",
	default: false,
	ui: {
		tab: "model",
		group: "思考",
		label: "外部思考",
		description: "私有草稿本；不向用户显示。会禁用受支持的 GPT、Claude 和 Gemini 推理",
		warning: "风险自负：服务商已将此类请求形态标记为滥用，最高可导致账户级处罚",
	},
});

export const cfgModelLoopGuardEnabled = register({
	id: "model.loopGuard.enabled",
	type: "boolean",
	default: true,
	// Kill switch shared with pi-ai's stream-level guard (`utils/thinking-loop.ts`); only `1` disables.
	env: { name: "PI_NO_THINKING_LOOP_GUARD", parse: raw => (raw === "1" ? false : undefined) },
	ui: {
		tab: "model",
		group: "思考",
		label: "循环守卫",
		description: "为模型推理与正文启用自动流循环检测",
	},
});

export const cfgModelLoopGuardCheckAssistantContent = register({
	id: "model.loopGuard.checkAssistantContent",
	type: "boolean",
	default: true,
	ui: {
		tab: "model",
		group: "思考",
		label: "循环守卫扫描正文",
		description: "除思考日志外，对助手的正文消息也应用循环守卫",
	},
});

export const cfgModelLoopGuardToolCallReminder = register({
	id: "model.loopGuard.toolCallReminder",
	type: "boolean",
	default: true,
	ui: {
		tab: "model",
		group: "思考",
		label: "循环守卫工具调用提醒",
		description:
			"当 Gemini 推理流连续输出大量规划标题而没有调用工具时，中断它并注入提醒要求发起工具调用（需要循环守卫）",
	},
});

export const cfgModelToolCallLoopGuardEnabled = register({
	id: "model.toolCallLoopGuard.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "model",
		group: "思考",
		label: "工具调用循环守卫",
		description: "跨回合检测连续相同的工具调用，并注入纠正引导",
	},
});

export const cfgModelToolCallLoopGuardThreshold = register({
	id: "model.toolCallLoopGuard.threshold",
	type: "number",
	default: 5,
	ui: {
		tab: "model",
		group: "思考",
		label: "工具调用循环阈值",
		description: "注入纠正引导前所需的连续相同工具调用次数",
	},
});

export const cfgModelToolCallLoopGuardExemptTools = register({
	id: "model.toolCallLoopGuard.exemptTools",
	type: "array",
	default: DEFAULT_TOOL_CALL_LOOP_EXEMPT_TOOLS,
	ui: {
		tab: "model",
		group: "思考",
		label: "工具调用循环豁免工具",
		description: "可连续重复而不触发跨回合循环守卫的工具名称",
	},
});

export const cfgInlineToolDescriptors = register({
	id: "inlineToolDescriptors",
	type: "enum",
	values: ["auto", "on", "off"] as const,
	default: "auto",
	ui: {
		tab: "model",
		group: "提示词",
		label: "内联工具描述",
		description:
			"在系统提示词中渲染完整工具描述，并从服务商工具 schema 中剥离顶层/嵌套描述，使描述文本只发送一次。auto 对 Gemini 模型启用，其余禁用",
		options: [
			{
				value: "auto",
				label: "自动",
				description: "对 Gemini 模型内联描述；其余情况保留在工具 schema 中",
			},
			{ value: "on", label: "开启", description: "始终在系统提示词中内联描述" },
			{ value: "off", label: "关闭", description: "仅在服务商工具 schema 中保留描述" },
		],
	},
});

export const cfgIncludeModelInPrompt = register({
	id: "includeModelInPrompt",
	type: "boolean",
	default: true,
	ui: {
		tab: "model",
		group: "提示词",
		label: "在提示词中包含模型",
		description: "在系统提示词中显示当前模型标识，让代理知道自己是哪个模型",
	},
});

export const cfgIncludeWorkspaceTree = register({
	id: "includeWorkspaceTree",
	type: "boolean",
	default: false,
	ui: {
		tab: "model",
		group: "提示词",
		label: "包含工作区树",
		description:
			"在系统提示词中渲染工作区目录树。警告：当文件被修改时，这可能会破坏跨会话的提示词缓存。",
	},
});

export const cfgSkillful = register({
	id: "skillful",
	type: "boolean",
	default: true,
	ui: {
		tab: "model",
		group: "提示词",
		label: "在提示词中列出技能",
		description:
			"在系统提示词中列出可用技能；关闭可节省上下文，并可用 /skillful 按会话切换",
	},
});

/** Personality preset. */
export type Personality = SettingValueOf<typeof cfgPersonality>;

export const cfgPersonality = register({
	id: "personality",
	type: "enum",
	values: ["default", "friendly", "pragmatic", "none"] as const,
	default: "default",
	ui: {
		tab: "model",
		group: "提示词",
		label: "人格",
		description: "渲染到系统提示词人格块中的沟通风格",
		options: [
			{
				value: "default",
				label: "默认",
				description: "简洁、以证据为先的工程师；回复密集且面向行动",
			},
			{
				value: "friendly",
				label: "友好",
				description: "温暖、鼓励型的协作者，注重推进节奏与士气",
			},
			{
				value: "pragmatic",
				label: "务实",
				description: "直接、高效的工程师，注重清晰与严谨",
			},
			{ value: "none", label: "无", description: "完全省略人格块" },
		],
	},
});

// Sampling
export const cfgTemperature = register({
	id: "temperature",
	type: "number",
	default: -1,
	ui: {
		tab: "model",
		group: "采样",
		label: "温度",
		description: "采样温度（0 = 确定性，1 = 创造性，-1 = 服务商默认）",
		options: [
			{ value: "-1", label: "默认", description: "使用服务商默认值" },
			{ value: "0", label: "0", description: "确定性" },
			{ value: "0.2", label: "0.2", description: "专注" },
			{ value: "0.5", label: "0.5", description: "均衡" },
			{ value: "0.7", label: "0.7", description: "创造性" },
			{ value: "1", label: "1", description: "最大多样性" },
		],
	},
});

export const cfgTopP = register({
	id: "topP",
	type: "number",
	default: -1,
	ui: {
		tab: "model",
		group: "采样",
		label: "Top P",
		description: "核采样截断（0-1，-1 = 服务商默认）",
		options: [
			{ value: "-1", label: "默认", description: "使用服务商默认值" },
			{ value: "0.1", label: "0.1", description: "非常专注" },
			{ value: "0.3", label: "0.3", description: "专注" },
			{ value: "0.5", label: "0.5", description: "均衡" },
			{ value: "0.9", label: "0.9", description: "宽泛" },
			{ value: "1", label: "1", description: "不做核采样过滤" },
		],
	},
});

export const cfgTopK = register({
	id: "topK",
	type: "number",
	default: -1,
	ui: {
		tab: "model",
		group: "采样",
		label: "Top K",
		description: "从 top-K 令牌中采样（-1 = 服务商默认）",
		options: [
			{ value: "-1", label: "默认", description: "使用服务商默认值" },
			{ value: "1", label: "1", description: "贪心取最高概率令牌" },
			{ value: "20", label: "20", description: "专注" },
			{ value: "40", label: "40", description: "均衡" },
			{ value: "100", label: "100", description: "宽泛" },
		],
	},
});

export const cfgMinP = register({
	id: "minP",
	type: "number",
	default: -1,
	ui: {
		tab: "model",
		group: "采样",
		label: "Min P",
		description: "最小概率阈值（0-1，-1 = 服务商默认）",
		options: [
			{ value: "-1", label: "默认", description: "使用服务商默认值" },
			{ value: "0.01", label: "0.01", description: "非常宽松" },
			{ value: "0.05", label: "0.05", description: "均衡" },
			{ value: "0.1", label: "0.1", description: "严格" },
		],
	},
});

export const cfgPresencePenalty = register({
	id: "presencePenalty",
	type: "number",
	default: -1,
	ui: {
		tab: "model",
		group: "采样",
		label: "存在惩罚",
		description: "引入已存在令牌的惩罚（-1 = 服务商默认）",
		options: [
			{ value: "-1", label: "默认", description: "使用服务商默认值" },
			{ value: "0", label: "0", description: "无惩罚" },
			{ value: "0.5", label: "0.5", description: "轻度新颖" },
			{ value: "1", label: "1", description: "鼓励新颖" },
			{ value: "2", label: "2", description: "强烈新颖" },
		],
	},
});

export const cfgRepetitionPenalty = register({
	id: "repetitionPenalty",
	type: "number",
	default: -1,
	ui: {
		tab: "model",
		group: "采样",
		label: "重复惩罚",
		description: "重复令牌的惩罚（-1 = 服务商默认）",
		options: [
			{ value: "-1", label: "默认", description: "使用服务商默认值" },
			{ value: "0.8", label: "0.8", description: "允许重复" },
			{ value: "1", label: "1", description: "无惩罚" },
			{ value: "1.1", label: "1.1", description: "轻度惩罚" },
			{ value: "1.2", label: "1.2", description: "均衡" },
			{ value: "1.5", label: "1.5", description: "强烈惩罚" },
		],
	},
});

const providerDefaultWhenNegative = (value: number): number | undefined => (value >= 0 ? value : undefined);

/** Agent sampling options; a negative sampling setting means "provider default" (`undefined`). */
export const cfgSampling = combine(
	{
		temperature: cfgTemperature,
		topP: cfgTopP,
		topK: cfgTopK,
		minP: cfgMinP,
		presencePenalty: cfgPresencePenalty,
		repetitionPenalty: cfgRepetitionPenalty,
		hideThinkingSummary: cfgOmitThinking,
	},
	values => ({
		temperature: providerDefaultWhenNegative(values.temperature),
		topP: providerDefaultWhenNegative(values.topP),
		topK: providerDefaultWhenNegative(values.topK),
		minP: providerDefaultWhenNegative(values.minP),
		presencePenalty: providerDefaultWhenNegative(values.presencePenalty),
		repetitionPenalty: providerDefaultWhenNegative(values.repetitionPenalty),
		hideThinkingSummary: values.hideThinkingSummary,
	}),
);

export const cfgTextVerbosity = register({
	id: "textVerbosity",
	type: "enum",
	values: ["low", "medium", "high"] as const,
	default: "medium",
	ui: {
		tab: "model",
		group: "采样",
		label: "文本详细程度",
		description: "OpenAI Responses 与 Codex 响应的详细程度（low、medium 或 high）",
		options: [
			{ value: "low", label: "低", description: "偏好简洁回复" },
			{ value: "medium", label: "中", description: "平衡简洁与细节（默认）" },
			{ value: "high", label: "高", description: "偏好详细回复" },
		],
	},
});

export const cfgTierOpenai = register({
	id: "tier.openai",
	type: "enum",
	values: SERVICE_TIER_OPENAI_VALUES,
	default: "none",
	ui: {
		tab: "model",
		group: "采样",
		label: "服务层级 — OpenAI",
		description:
			"OpenAI / OpenAI-Codex 请求以及经 OpenRouter 路由的 OpenAI 系列模型的处理层级（none = 省略）。以 `service_tier` 发送。",
		options: SERVICE_TIER_OPENAI_OPTIONS,
	},
});

export const cfgTierAnthropic = register({
	id: "tier.anthropic",
	type: "enum",
	values: SERVICE_TIER_ANTHROPIC_VALUES,
	default: "none",
	ui: {
		tab: "model",
		group: "采样",
		label: "服务层级 — Anthropic",
		description:
			'Claude 请求的处理层级。`priority` 在受支持的 Anthropic 直连模型上实现快速模式（`speed: "fast"`）；在 Bedrock/Vertex 的 Claude 以及经 OpenRouter 路由时被忽略。',
		options: SERVICE_TIER_ANTHROPIC_OPTIONS,
	},
});

export const cfgTierGoogle = register({
	id: "tier.google",
	type: "enum",
	values: SERVICE_TIER_GOOGLE_VALUES,
	default: "none",
	ui: {
		tab: "model",
		group: "采样",
		label: "服务层级 — Google",
		description:
			"Gemini（Google AI Studio + Vertex）请求以及经 OpenRouter 路由的 Google 系列模型的处理层级（none = 省略）。以顶层 `serviceTier` 字段发送。",
		options: SERVICE_TIER_GOOGLE_OPTIONS,
	},
});

export const cfgTierSubagent = register({
	id: "tier.subagent",
	type: "enum",
	values: SERVICE_TIER_INHERIT_SETTING_VALUES,
	default: "inherit",
	ui: {
		tab: "model",
		group: "采样",
		label: "服务层级 — 子代理",
		description:
			"派生的任务/eval 子代理的服务层级。Inherit = 跟随主代理实时的按系列层级（跟随 /fast）；选择一个值则应用到子代理模型所属的系列。",
		options: SERVICE_TIER_INHERIT_OPTIONS,
	},
});

export const cfgTierAdvisor = register({
	id: "tier.advisor",
	protocolDefault: ["rpc", "acp"],
	type: "enum",
	values: SERVICE_TIER_INHERIT_SETTING_VALUES,
	default: "none",
	ui: {
		tab: "model",
		group: "采样",
		label: "服务层级 — 顾问",
		description:
			"顾问模型的服务层级。None = 标准处理；Inherit = 跟随主代理实时的按系列层级；选择一个值则应用到顾问模型所属的系列。",
		options: SERVICE_TIER_INHERIT_OPTIONS,
		condition: "advisorEnabled",
	},
});

// Retries
export const cfgRetryEnabled = register({ id: "retry.enabled", type: "boolean", default: true });

export const cfgRetryMaxRetries = register({
	id: "retry.maxRetries",
	type: "number",
	default: 10,
	ui: {
		tab: "model",
		group: "重试与备用",
		label: "重试次数",
		description: "API 错误的最大重试次数",
		options: [
			{ value: "1", label: "1 次重试" },
			{ value: "2", label: "2 次重试" },
			{ value: "3", label: "3 次重试" },
			{ value: "5", label: "5 次重试" },
			{ value: "10", label: "10 次重试" },
		],
	},
});

export const cfgRetryBaseDelayMs = register({ id: "retry.baseDelayMs", type: "number", default: 500 });

export const cfgRetryMaxDelayMs = register({
	id: "retry.maxDelayMs",
	type: "number",
	default: 5 * 60 * 1000,
	ui: {
		tab: "model",
		group: "重试与备用",
		label: "最大重试延迟",
		description:
			"重试之间的最长等待时间（毫秒）。当服务商要求等待更久、且没有凭据或模型回退成功时，请求会快速失败而不是休眠（例如 Anthropic 的 3 小时速率限制窗口）。0 表示不设上限 — 让会话按服务商声明的配额重置自动恢复。",
	},
});

export const cfgRetryWaitForUsageReset = register({
	id: "retry.waitForUsageReset",
	type: "boolean",
	default: false,
	ui: {
		tab: "model",
		group: "重试与备用",
		label: "等待用量重置",
		get description() {
			return `When a provider reports usage-limit exhaustion with a reset time (5-hour or weekly quota windows on any provider), sleep until the reset instead of failing fast past retry.maxDelayMs. Waits are abortable (${formatKeyHint("escape")}) but also hold subagents, so leave off for unattended runs.`;
		},
	},
});

export const cfgRetryModelFallback = register({
	id: "retry.modelFallback",
	type: "boolean",
	default: true,
	ui: {
		tab: "model",
		group: "重试与备用",
		label: "重试模型回退",
		description:
			"允许重试恢复在服务商报错后切换到 retry.fallbackChains 中的模型。与「自动提升上下文」相互独立。",
	},
});

export const cfgRetryFallbackOn = register({
	id: "retry.fallbackOn",
	type: "enum",
	values: ["any", "usage-limit", "except-usage-limit"] as const,
	default: "any",
	ui: {
		tab: "model",
		group: "重试与备用",
		label: "回退触发条件",
		description: "哪些失败的请求可以切换到已配置的回退模型",
		options: [
			{ value: "any", label: "任何错误", description: "任何服务商错误都可能切换模型" },
			{
				value: "usage-limit",
				label: "仅用量限制",
				description: "仅在使用量限制时切换；其他错误在同一模型上重试后再上报",
			},
			{
				value: "except-usage-limit",
				label: "除用量限制外的全部",
				description: "等待或在界面提示用量限制；其他错误则切换模型",
			},
		],
	},
});

export const cfgRetryUsageAwareFallback = register({
	id: "retry.usageAwareFallback",
	type: "boolean",
	default: false,
	ui: {
		tab: "model",
		group: "重试与备用",
		label: "感知用量的回退",
		description:
			"使用可靠的编码套餐配额报告，在触及硬性用量上限前优先选择同一服务商的账户，其次选择已配置的回退模型。普通配置的 API 密钥不在此列。",
	},
});

export const cfgRetryUsageReservePct = register({
	id: "retry.usageReservePct",
	type: "number",
	default: DEFAULT_USAGE_RESERVE_PCT,
	ui: {
		tab: "model",
		group: "重试与备用",
		label: "保留边际",
		description:
			"剩余百分比低于此值时，将编码套餐模型视为接近上限。用量未知或未映射时保留主模型。",
		condition: "usageAwareFallbackEnabled",
		options: [
			{ value: "5", label: "5%", description: "仅在几乎耗尽时执行" },
			{ value: "10", label: "10%", description: "均衡安全边际" },
			{ value: "15", label: "15%", description: "保守" },
			{ value: "20", label: "20%", description: "提前保护" },
			{ value: "25", label: "25%", description: "非常保守" },
		],
	},
});

export const cfgRetryUsageReservePolicy = register({
	id: "retry.usageReservePolicy",
	type: "enum",
	values: ["confirm", "auto", "fail-closed"] as const,
	default: "confirm",
	ui: {
		tab: "model",
		group: "重试与备用",
		label: "保留策略",
		description: "当所有同服务商的编码套餐账户都处于保留边际内时的处理方式。",
		condition: "usageAwareFallbackEnabled",
		options: [
			{
				value: "confirm",
				label: "交互式确认",
				description: "交互式会话在确认前保持使用主模型；后台代理自动回退",
			},
			{
				value: "auto",
				label: "自动回退",
				description: "始终选择下一个符合条件的已配置回退",
			},
			{
				value: "fail-closed",
				label: "默认拒绝",
				description: "不消耗保留配额，也不选择回退",
			},
		],
	},
});

export const cfgRetryFallbackChains = register({
	id: "retry.fallbackChains",
	type: "record",
	default: EMPTY_STRING_ARRAYS_RECORD,
	ui: {
		tab: "model",
		group: "重试与备用",
		label: "重试回退链",
		description:
			'JSON object mapping model roles, model selectors ("provider/model-id"), or provider wildcards ("provider/*") to ordered fallback selectors, e.g. {"default":["openai/gpt-4o-mini"],"google-antigravity/*":["google/*","google-vertex/*"]}. Model-oriented keys apply whenever that model/provider is active, regardless of role; a "provider/*" entry keeps the failing model\'s id and swaps the provider. An id-prefixed wildcard ("openrouter/google/*") re-prefixes the failing model\'s bare id (google-antigravity/gemini-x -> openrouter/google/gemini-x) and, used as a key, matches only that provider\'s ids under the prefix. A fallback entry may carry an explicit thinking suffix ("provider/model:low", ":high", ":max", ":off"); a bare entry inherits the failing turn\'s effort, and "provider/*" entries always inherit.',
	},
});

export const cfgRetryFallbackRevertPolicy = register({
	id: "retry.fallbackRevertPolicy",
	type: "enum",
	values: ["cooldown-expiry", "never"] as const,
	default: "cooldown-expiry",
	ui: {
		tab: "model",
		group: "重试与备用",
		label: "回退还原策略",
		description: "回退后何时返回主模型",
		options: [
			{
				value: "cooldown-expiry",
				label: "冷却到期",
				description: "在主模型的抑制窗口结束后返回主模型",
			},
			{ value: "never", label: "从不", description: "保持使用回退模型，直到手动更改" },
		],
	},
});

/** Retry/backoff and usage-aware fallback policy (`retry.*` except fallback chains/revert policy). */
export const cfgRetry = combine({
	enabled: cfgRetryEnabled,
	maxRetries: cfgRetryMaxRetries,
	baseDelayMs: cfgRetryBaseDelayMs,
	maxDelayMs: cfgRetryMaxDelayMs,
	waitForUsageReset: cfgRetryWaitForUsageReset,
	modelFallback: cfgRetryModelFallback,
	fallbackOn: cfgRetryFallbackOn,
	usageAwareFallback: cfgRetryUsageAwareFallback,
	usageReservePct: cfgRetryUsageReservePct,
	usageReservePolicy: cfgRetryUsageReservePolicy,
});

/** Retry/backoff policy ({@link cfgRetry}). */
export type RetrySettings = SettingValueOf<typeof cfgRetry>;

export const cfgProvidersAnthropicServerSideFallback = register({
	id: "providers.anthropic.serverSideFallback",
	type: "boolean",
	default: false,
	ui: {
		tab: "model",
		group: "重试与备用",
		label: "Anthropic 服务端回退 (Fable 5)",
		description:
			"当 Claude Fable 5 / Mythos 5 请求被 Anthropic 安全分类器拦截时，在服务端改用 Claude Opus 5 重试（Anthropic `server-side-fallback-2026-06-01` beta）。需主动开启 — 保持关闭则所有请求沿用回退前的行为。",
	},
});

/**
 * Anthropic subscription slow mode (`off` | `auto`). Deliberately has no
 * `/settings` UI: `/slow on|off` on an Anthropic model is the only switch.
 * `auto` switches to low priority automatically when a Claude subscription
 * hits its 5-hour limit and Anthropic offers it. Wrap-up allowance tracking
 * runs either way; this only gates the low-priority lane.
 */
export const cfgProvidersAnthropicSlowMode = register({
	id: "providers.anthropic.slowMode",
	type: "enum",
	values: ["off", "auto"] as const,
	default: "off" as const,
});

// Provider selection
export const cfgProvidersOllamaCloudMaxConcurrency = register({
	id: "providers.ollama-cloud.maxConcurrency",
	type: "number",
	default: 3,
	ui: {
		tab: "providers",
		group: "服务",
		label: "Ollama Cloud 最大并发",
		description: "每个进程的最大并发 Ollama Cloud 子代理运行数；0 表示禁用该服务商专属限制",
	},
});

export const cfgProvidersWebSearchTimeoutSeconds = register({
	id: "providers.webSearchTimeoutSeconds",
	type: "number",
	default: DEFAULT_WEB_SEARCH_TIMEOUT_SECONDS,
	ui: {
		tab: "providers",
		group: "服务",
		label: "网络搜索超时",
		description: `Hard timeout for each provider's search transport before web_search advances to the next fallback, in seconds (maximum ${MAX_WEB_SEARCH_TIMEOUT_SECONDS})`,
		options: [
			{ value: "30", label: "30 秒" },
			{ value: "60", label: "1 分钟" },
			{ value: "120", label: "2 分钟" },
			{ value: "180", label: "3 分钟" },
			{ value: "300", label: "5 分钟" },
		],
	},
});

export const cfgProvidersAntigravityEndpoint = register({
	id: "providers.antigravityEndpoint",
	type: "enum",
	values: ["auto", "production", "sandbox"] as const,
	default: "auto",
	ui: {
		tab: "providers",
		group: "服务",
		label: "Antigravity 端点模式",
		description: "google-antigravity 服务商的端点路由策略（chat、search、image、discovery）",
		options: [
			{
				value: "auto",
				label: "自动",
				description: "先试生产端点，遇到 5xx/429 时切换到沙箱",
			},
			{
				value: "production",
				label: "仅生产环境",
				description: "仅强制使用生产端点",
			},
			{
				value: "sandbox",
				label: "仅沙箱",
				description: "仅强制使用沙箱端点",
			},
		],
	},
});

export const cfgProvidersFireworksTier = register({
	id: "providers.fireworksTier",
	type: "enum",
	values: ["standard", "priority"] as const,
	default: "standard",
	ui: {
		tab: "providers",
		group: "Fireworks",
		label: "Fireworks 层级",
		description:
			'Fireworks 请求的服务路径。Priority 会发送 `service_tier: "priority"`，在高峰流量下以更高价格换取更高可靠性；Standard 则省略。Fast（`-fast`）模型会忽略此项 — Fast 是独立的服务路径。',
		options: [
			{ value: "standard", label: "标准", description: "默认服务路径（不发送 service_tier）" },
			{
				value: "priority",
				label: "优先级",
				description: "优先服务路径：更高可靠性，按令牌溢价计费",
			},
		],
	},
});

export const cfgProvidersTinyModelDevice = register({
	id: "providers.tinyModelDevice",
	type: "enum",
	values: TINY_MODEL_DEVICE_SETTING_VALUES,
	default: TINY_MODEL_DEVICE_DEFAULT,
	env: {
		name: "PI_TINY_DEVICE",
		parse: raw => TINY_MODEL_DEVICE_SETTING_VALUES.find(value => value === raw.trim().toLowerCase()),
	},
	ui: {
		tab: "providers",
		group: "微型模型",
		label: "微型模型设备",
		description:
			"本地微型模型（标题 + 记忆）的推理后端：ONNX 执行提供程序，或 `mlx` 以在 Apple 芯片上下载 MLX 权重并通过 mlx-lm 运行。默认使用纯 CPU 的 ONNX。环境变量 PI_TINY_DEVICE 会覆盖此项。",
		options: TINY_MODEL_DEVICE_SETTING_OPTIONS,
	},
});

export const cfgProvidersTinyModelDtype = register({
	id: "providers.tinyModelDtype",
	type: "enum",
	values: TINY_MODEL_DTYPE_SETTING_VALUES,
	default: TINY_MODEL_DTYPE_DEFAULT,
	env: {
		name: "PI_TINY_DTYPE",
		parse: raw => TINY_MODEL_DTYPE_SETTING_VALUES.find(value => value === raw.trim().toLowerCase()),
	},
	ui: {
		tab: "providers",
		group: "微型模型",
		label: "微型模型精度",
		description:
			"本地微型模型的 ONNX 量化/精度。默认使用各模型自带的 dtype（q4）；精度越低越快，越高越忠实。MLX 后端会忽略此项（其仓库已预量化为 4 位）。环境变量 PI_TINY_DTYPE 会覆盖此项。",
		options: TINY_MODEL_DTYPE_SETTING_OPTIONS,
	},
});

export const cfgProvidersAutoThinkingMaxEffort = register({
	id: "providers.autoThinkingMaxEffort",
	type: "enum",
	values: ["xhigh", "max"] as const,
	default: "xhigh",
	ui: {
		tab: "model",
		group: "思考",
		label: "自动思考上限",
		description:
			"`auto` 分类器可解析的最高强度。`xhigh` 让分类器始终比最高档低一级，因此只有显式 `ultrathink` 才会到达 `max`；`max` 则允许分类器判定为异常的回合在支持该档的模型上使用最高档。",
		condition: "autoThinkingActive",
		options: [
			{ value: "xhigh", label: "xhigh", description: "分类器最高到 xhigh（默认）" },
			{ value: "max", label: "max", description: "分类器可在模型支持时解析为 max" },
		],
	},
});

export const cfgFeaturesUnexpectedStopDetection = register({
	id: "features.unexpectedStopDetection",
	type: "enum",
	values: ["none", "mechanical", "smart"] as const,
	default: "mechanical",
	ui: {
		tab: "interaction",
		group: "代理",
		label: "意外停止",
		description:
			"当助手没有可见消息就停止时自动恢复。Smart 还会用小型模型对纯文本停止进行分类。",
		options: [
			{ value: "none", label: "无", description: "已禁用" },
			{
				value: "mechanical",
				label: "机械式",
				description: "在没有可见助手消息时重试停止；工具调用不计入（默认）",
			},
			{
				value: "smart",
				label: "智能",
				description: "机械判定 + 小型模型分类纯文本停止",
			},
		],
	},
});

export const cfgProvidersKimiApiFormat = register({
	id: "providers.kimiApiFormat",
	type: "enum",
	values: ["auto", "openai", "anthropic"] as const,
	default: "auto",
	ui: {
		tab: "providers",
		group: "协议",
		label: "Kimi API 格式",
		description: "Kimi Code 服务商的 API 格式（auto 跟随实时模型元数据）",
		options: [
			{ value: "auto", label: "自动", description: "使用模型在服务端声明的协议" },
			{ value: "openai", label: "OpenAI", description: "api.kimi.com" },
			{ value: "anthropic", label: "Anthropic", description: "api.moonshot.ai" },
		],
	},
});

export const cfgProvidersOpenaiWebsockets = register({
	id: "providers.openaiWebsockets",
	type: "enum",
	values: ["auto", "off", "on"] as const,
	default: "auto",
	ui: {
		tab: "providers",
		group: "协议",
		label: "OpenAI WebSockets",
		description: "OpenAI Codex 模型的 WebSocket 策略（auto 使用模型默认值，on 强制启用，off 禁用）",
		options: [
			{ value: "auto", label: "自动", description: "使用模型/服务商默认的 WebSocket 行为" },
			{ value: "off", label: "关闭", description: "为 OpenAI Codex 模型禁用 WebSocket" },
			{ value: "on", label: "开启", description: "为 OpenAI Codex 模型强制使用 WebSocket" },
		],
	},
});

export const cfgProvidersOpenaiLiveSteering = register({
	id: "providers.openaiLiveSteering",
	type: "boolean",
	default: true,
	ui: {
		tab: "providers",
		group: "协议",
		label: "OpenAI 实时引导",
		description:
			"在 GPT-6 响应流式输出期间输入的消息，通过 Codex WebSocket 直接投递到该响应中，而不必等到下一个工具边界",
	},
});

export const cfgProvidersMuseCodeStoreResponses = register({
	id: "providers.muse-code.storeResponses",
	type: "boolean",
	default: false,
	env: "PI_MUSE_STORE_RESPONSES",
	ui: {
		tab: "providers",
		group: "协议",
		label: "Muse Code 已存储响应",
		description:
			"将 Muse Code 结果存储在 Meta 的服务器上，使连接中断的回合得以恢复而非重跑。存储的运行会把提示词和输出保留在 Meta 一侧。",
	},
});
// Process-wide too, so side requests that call `completeSimple`/`streamSimple`
// directly (titles, commit messages, memories) follow the setting.
effect(cfgProvidersMuseCodeStoreResponses, enabled => configureProviderStoreResponses({ "muse-code": enabled }));

export const cfgProvidersCacheRetention = register({
	id: "providers.cacheRetention",
	type: "enum",
	values: ["auto", "short", "long", "none"] as const,
	default: "auto",
	ui: {
		tab: "providers",
		group: "协议",
		label: "提示词缓存保留",
		description:
			"转发给支持该能力的服务商（Anthropic、Bedrock、OpenRouter、OpenAI）的提示词缓存保留策略",
		options: [
			{
				value: "auto",
				label: "自动",
				description:
					"服务商默认 — Anthropic OAuth 订阅者会话默认 1 小时，API 密钥使用 5 分钟；PI_CACHE_RETENTION 仍然生效",
			},
			{
				value: "short",
				label: "短（5 分钟）",
				description: "最便宜的缓存写入；配合缓存预热可在空闲时保持短条目存活",
			},
			{
				value: "long",
				label: "长（1 小时）",
				description: "服务商支持时使用 1 小时 TTL；写入更贵，仅在活跃运行期间预热",
			},
			{ value: "none", label: "关闭", description: "禁用提示词缓存与缓存亲和路由" },
		],
	},
});

export const cfgProvidersCacheWarming = register({
	id: "providers.cacheWarming",
	type: "enum",
	values: ["off", "streaming", "idle"] as const,
	default: "idle",
	ui: {
		tab: "providers",
		group: "协议",
		label: "缓存预热",
		description:
			"在提示词缓存条目即将过期前，以单令牌输出预算重新发送最后一次请求",
		options: [
			{ value: "off", label: "关闭", description: "禁用缓存预热" },
			{
				value: "streaming",
				label: "流式",
				description: "在长时间工具执行期间保护昂贵的公共前缀；代理稳定后停止",
			},
			{
				value: "idle",
				label: "空闲",
				description:
					"同时在各次运行之间刷新 5 分钟条目，只要预期节省仍高于成本下限",
			},
		],
	},
});

export const cfgProvidersStreamFirstEventTimeoutSeconds = register({
	id: "providers.streamFirstEventTimeoutSeconds",
	type: "number",
	default: -1,
	ui: {
		tab: "providers",
		group: "超时",
		label: "流首事件超时",
		description:
			"等待首个模型流事件的秒数；-1 使用服务商/环境默认值，0 禁用看门狗",
		options: [
			{ value: "-1", label: "自动", description: "使用服务商默认值与 PI_* 超时环境变量" },
			{ value: "0", label: "关闭", description: "禁用首事件超时" },
			{ value: "300", label: "5 分钟" },
			{ value: "600", label: "10 分钟" },
			{ value: "1800", label: "30 分钟" },
		],
	},
});

export const cfgProvidersStreamIdleTimeoutSeconds = register({
	id: "providers.streamIdleTimeoutSeconds",
	type: "number",
	default: -1,
	ui: {
		tab: "providers",
		group: "超时",
		label: "流空闲超时",
		description:
			"模型流在事件之间可保持静默的秒数；-1 使用服务商/环境默认值，0 禁用看门狗",
		options: [
			{ value: "-1", label: "自动", description: "使用服务商默认值与 PI_* 超时环境变量" },
			{ value: "0", label: "关闭", description: "禁用空闲超时" },
			{ value: "300", label: "5 分钟" },
			{ value: "600", label: "10 分钟" },
			{ value: "1800", label: "30 分钟" },
		],
	},
});

export const cfgProvidersOpenrouterVariant = register({
	id: "providers.openrouterVariant",
	type: "enum",
	values: ["default", "nitro", "floor", "online", "exacto"] as const,
	default: "default",
	ui: {
		tab: "providers",
		group: "协议",
		label: "OpenRouter 路由",
		description:
			"追加到 OpenRouter 模型 ID 的默认路由变体后缀（若选择器已指定变体则覆盖此项）",
		options: [
			{ value: "default", label: "默认", description: "不加后缀；使用 OpenRouter 的默认路由" },
			{ value: "nitro", label: ":nitro", description: "优先吞吐量 / 最低延迟" },
			{ value: "floor", label: ":floor", description: "优先选择最便宜的可用服务商" },
			{ value: "online", label: ":online", description: "启用 OpenRouter 的网络搜索插件" },
			{
				value: "exacto",
				label: ":exacto",
				description: "精选的高质量服务商（仅为部分模型定义）",
			},
		],
	},
});

export const cfgProvidersFetch = register({
	id: "providers.fetch",
	type: "enum",
	values: ["auto", "native", "trafilatura", "lynx", "parallel", "firecrawl", "jina"] as const,
	default: "auto",
	ui: {
		tab: "providers",
		group: "服务",
		label: "抓取服务商",
		description: "fetch/read URL 工具的读取器后端优先级",
		options: [
			{
				value: "auto",
				label: "自动",
				description: "优先级：native > trafilatura > lynx > parallel > firecrawl > jina",
			},
			{ value: "native", label: "原生", description: "进程内 HTML→Markdown 转换器（始终可用）" },
			{ value: "trafilatura", label: "Trafilatura", description: "通过 uv/pip 自动安装" },
			{ value: "lynx", label: "Lynx", description: "需要 lynx 系统包" },
			{ value: "parallel", label: "并行", description: "需要 PARALLEL_API_KEY" },
			{ value: "firecrawl", label: "Firecrawl", description: "需要 FIRECRAWL_API_KEY" },
			{ value: "jina", label: "Jina", description: "使用 r.jina.ai 读取器（JINA_API_KEY 可选）" },
		],
	},
});

// Codex saved rate-limit resets (auto-redeem)
export const cfgCodexResetsAutoRedeem = register({
	id: "codexResets.autoRedeem",
	type: "enum",
	values: ["unset", "yes", "no"] as const,
	default: "unset" as const,
	ui: {
		tab: "providers",
		group: "服务",
		label: "Codex 自动兑换存档重置",
		description:
			"自动消耗已保存的 Codex 速率限制重置：当某个回合卡住且没有其他账户可以接手时，恢复被耗尽的 5 小时或每周窗口阻塞的账户，并回收即将过期的额度。unset 会在首次消耗前询问（无提示界面时，只消耗 5 分钟内过期的重置），yes 不经询问直接消耗，no 则禁用这两项检查。",
		options: [
			{
				value: "unset",
				label: "未设置",
				description:
					"检查是否符合条件，然后在消耗第一次已保存的重置前询问。无提示界面时，只消耗 5 分钟内过期的重置。",
			},
			{ value: "yes", label: "是", description: "不经询问直接消耗符合条件的已保存重置。" },
			{ value: "no", label: "否", description: "不运行已保存重置的自动兑换检查。" },
		],
	},
});

export const cfgCodexResetsMinBlockedMinutes = register({
	id: "codexResets.minBlockedMinutes",
	type: "number",
	default: 60,
	ui: {
		tab: "providers",
		group: "服务",
		label: "Codex 自动兑换最小块",
		description:
			"仅当自然解除 — 已耗尽的 5 小时/每周窗口中最晚的一次重置 — 至少在这么多分钟之后时才自动兑换（不要为省下短暂等待而消耗稀缺额度）。调高它（例如 360）可忽略仅 5 小时的阻塞。",
	},
});

export const cfgCodexResetsKeepCredits = register({
	id: "codexResets.keepCredits",
	type: "number",
	default: 0,
	ui: {
		tab: "providers",
		group: "服务",
		label: "Codex 自动兑换保留量",
		description:
			"低于此次数时绝不自动消耗已保存的重置（0 = 最后一次额度可被自动消耗）。即将过期的额度不受此限 — 保留的额度一旦过期什么也留不住。",
	},
});

export const cfgCodexResetsSalvageHorizonHours = register({
	id: "codexResets.salvageHorizonHours",
	type: "number",
	default: 12,
	ui: {
		tab: "providers",
		group: "服务",
		label: "Codex 重置回收时间窗",
		description:
			"启用自动兑换后，当任一聊天窗口有实际用量时，在过期前的这么多小时内消耗已保存的 Codex 重置。0 禁用提前回收；5 分钟内过期的额度仍会尝试消耗，与用量无关。",
	},
});

/** Codex saved-reset auto-redeem policy (`codexResets.*`). */
export const cfgCodexResets = combine({
	autoRedeem: cfgCodexResetsAutoRedeem,
	minBlockedMinutes: cfgCodexResetsMinBlockedMinutes,
	keepCredits: cfgCodexResetsKeepCredits,
	salvageHorizonHours: cfgCodexResetsSalvageHorizonHours,
});

/** Whether automatic reset redemption asks first, spends, or remains disabled. */
export type ResetAutoRedeemMode = SettingValueOf<typeof cfgCodexResetsAutoRedeem>;

// Claude Cedar/Juniper rate-limit resets (independent auto-redeem consent)
export const cfgClaudeResetsAutoRedeem = register({
	id: "claudeResets.autoRedeem",
	type: "enum",
	values: ["unset", "yes", "no"] as const,
	default: "unset" as const,
	ui: {
		tab: "providers",
		group: "服务",
		label: "Claude 自动兑换重置次数",
		description:
			"自动消耗符合条件的 Claude Cedar 或 Juniper 重置。Cedar 仅用于覆盖的限制；Juniper 只能恢复单独的 5 小时阻塞。unset 会在首次消耗前询问（无提示界面时，只消耗 5 分钟内过期的重置），yes 不经询问直接消耗，no 则禁用阻塞恢复与到期回收。",
		options: [
			{
				value: "unset",
				label: "未设置",
				description:
					"检查实时资格，然后在消耗第一次 Claude 重置前询问。无提示界面时，只消耗 5 分钟内过期的重置。",
			},
			{ value: "yes", label: "是", description: "不经询问直接消耗符合条件的 Claude 重置。" },
			{ value: "no", label: "否", description: "不运行 Claude 重置自动兑换检查。" },
		],
	},
});

export const cfgClaudeResetsMinBlockedMinutes = register({
	id: "claudeResets.minBlockedMinutes",
	type: "number",
	default: 60,
	ui: {
		tab: "providers",
		group: "服务",
		label: "Claude 自动兑换最小块",
		description:
			"仅当自然解除 — 已耗尽的覆盖窗口中最晚的一次重置 — 至少在这么多分钟之后时才自动兑换。仅有 5 小时的重置绝不会用于每周或模型范围的阻塞。",
	},
});

export const cfgClaudeResetsKeepCredits = register({
	id: "claudeResets.keepCredits",
	type: "number",
	default: 0,
	ui: {
		tab: "providers",
		group: "服务",
		label: "Claude 自动兑换保留量",
		description:
			"至少保留这么多次 Claude 重置额度不消耗（0 表示允许自动用掉最后一次符合条件的中置）。该保留量适用于提前回收，但不适用于 5 分钟内过期的符合条件重置。",
	},
});

export const cfgClaudeResetsSalvageHorizonHours = register({
	id: "claudeResets.salvageHorizonHours",
	type: "number",
	default: 12,
	ui: {
		tab: "providers",
		group: "服务",
		label: "Claude 重置回收时间窗",
		description:
			"启用自动兑换后，当其覆盖的窗口有实际用量时，在过期前的这么多小时内使用服务端选定的 Cedar 重置。0 禁用提前回收；5 分钟内过期的符合条件 Cedar 或 Juniper 重置仍会尝试，与用量或保留量无关。服务商限制要求仍然适用。",
	},
});

/** Claude reset auto-redeem policy (`claudeResets.*`), independent of {@link cfgCodexResets}. */
export const cfgClaudeResets = combine({
	autoRedeem: cfgClaudeResetsAutoRedeem,
	minBlockedMinutes: cfgClaudeResetsMinBlockedMinutes,
	keepCredits: cfgClaudeResetsKeepCredits,
	salvageHorizonHours: cfgClaudeResetsSalvageHorizonHours,
});

export const cfgProviderAppendOnlyContext = register({
	id: "provider.appendOnlyContext",
	type: "enum",
	values: ["auto", "on", "off"] as const,
	default: "auto",
	ui: {
		tab: "providers",
		group: "协议",
		label: "仅追加上下文",
		description:
			"缓存系统提示词 + 工具规格，并维护仅追加的消息日志，让服务商的前缀缓存（DeepSeek、Xiaomi/SGLang、Anthropic）以最高命中率生效。auto 会为已知支持前缀缓存的服务商启用。",
		options: [
			{ value: "auto", label: "自动", description: "为已知前缀缓存服务商启用（推荐）" },
			{ value: "on", label: "开启", description: "始终启用仅追加上下文" },
			{ value: "off", label: "关闭", description: "禁用仅追加上下文" },
		],
	},
});

export const cfgThinkingBudgetsMinimal = register({ id: "thinkingBudgets.minimal", type: "number", default: 1024 });

export const cfgThinkingBudgetsLow = register({ id: "thinkingBudgets.low", type: "number", default: 2048 });

export const cfgThinkingBudgetsMedium = register({ id: "thinkingBudgets.medium", type: "number", default: 8192 });

export const cfgThinkingBudgetsHigh = register({ id: "thinkingBudgets.high", type: "number", default: 16384 });

export const cfgThinkingBudgetsXhigh = register({ id: "thinkingBudgets.xhigh", type: "number", default: 32768 });

export const cfgThinkingBudgetsMax = register({ id: "thinkingBudgets.max", type: "number", default: 32768 });

/** Token budget per thinking level (`thinkingBudgets.*`) on transports that accept reasoning token budgets. */
export const cfgThinkingBudgets = combine({
	minimal: cfgThinkingBudgetsMinimal,
	low: cfgThinkingBudgetsLow,
	medium: cfgThinkingBudgetsMedium,
	high: cfgThinkingBudgetsHigh,
	xhigh: cfgThinkingBudgetsXhigh,
	max: cfgThinkingBudgetsMax,
});
