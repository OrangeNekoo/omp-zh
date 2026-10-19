/**
 * Settings declared by this domain (see `config/registry.ts`). Declaration order is the
 * settings-panel order; `config/all-settings.ts` registers every domain.
 */
import { combine, register, type SettingValueOf } from "../config/registry";

// TTSR
export const cfgTtsrEnabled = register({
	id: "ttsr.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "context",
		group: "规则 (TTSR)",
		label: "TTSR",
		description: "当输出匹配规则模式时在流中途中断代理（时间旅行流规则）",
	},
});

export const cfgTtsrJudge = register({
	id: "ttsr.judge",
	type: "enum",
	values: ["auto", "on", "off"] as const,
	default: "auto",
	ui: {
		tab: "context",
		group: "规则 (TTSR)",
		label: "判定规则",
		description:
			"对已完成的回复、推理与工具调用，向 judge 模型角色询问每条 `question` 规则；回答为是时以警告形式注入该规则",
		options: [
			{
				value: "auto",
				label: "自动",
				description: "仅当 judge 角色解析为原生 TypeSafe jev 模型时判定",
			},
			{ value: "on", label: "开启", description: "始终判定，无论 judge 角色解析为哪个模型" },
			{ value: "off", label: "关闭", description: "从不判定；question 规则保持不生效" },
		],
	},
});

export const cfgTtsrContextMode = register({
	id: "ttsr.contextMode",
	type: "enum",
	values: ["discard", "keep"] as const,
	default: "discard",
	ui: {
		tab: "context",
		group: "规则 (TTSR)",
		label: "TTSR 上下文模式",
		description: "TTSR 触发时如何处理部分输出",
	},
});

export const cfgTtsrInterruptMode = register({
	id: "ttsr.interruptMode",
	type: "enum",
	values: ["never", "prose-only", "tool-only", "always"] as const,
	default: "always",
	ui: {
		tab: "context",
		group: "规则 (TTSR)",
		label: "TTSR 中断模式",
		description: "何时在流中途中断，何时在完成后注入警告",
		options: [
			{ value: "always", label: "always", description: "在正文与工具流上中断" },
			{ value: "prose-only", label: "prose-only", description: "仅在回复/思考匹配时中断" },
			{ value: "tool-only", label: "tool-only", description: "仅在工具调用参数匹配时中断" },
			{ value: "never", label: "never", description: "从不中断；完成后注入警告" },
		],
	},
});

export const cfgTtsrRepeatMode = register({
	id: "ttsr.repeatMode",
	type: "enum",
	values: ["once", "after-gap"] as const,
	default: "once",
	ui: {
		tab: "context",
		group: "规则 (TTSR)",
		label: "TTSR 重复模式",
		description: "规则如何重复：每会话一次，或在消息间隔后",
	},
});

export const cfgTtsrRepeatGap = register({
	id: "ttsr.repeatGap",
	type: "number",
	default: 10,
	ui: {
		tab: "context",
		group: "规则 (TTSR)",
		label: "TTSR 重复间隔",
		description: "规则可再次触发前的消息数",
		options: [
			{ value: "5", label: "5 条消息" },
			{ value: "10", label: "10 条消息" },
			{ value: "15", label: "15 条消息" },
			{ value: "20", label: "20 条消息" },
			{ value: "30", label: "30 条消息" },
		],
	},
});

export const cfgTtsrBuiltinRules = register({
	id: "ttsr.builtinRules",
	type: "boolean",
	default: true,
	ui: {
		tab: "context",
		group: "规则 (TTSR)",
		label: "内置规则",
		description: "加载代理随附的默认规则（可用 ttsr.disabledRules 逐条覆盖）",
	},
});

export const cfgTtsrDisabledRules = register({
	id: "ttsr.disabledRules",
	type: "array",
	default: [] as string[],
	ui: {
		tab: "context",
		group: "规则 (TTSR)",
		label: "已禁用的规则",
		description: "要完全忽略的规则名称（对内置默认规则与你自己的规则同时生效）",
	},
});

/** Time-traveling stream rules configuration (`ttsr.*`). */
export const cfgTtsr = combine({
	enabled: cfgTtsrEnabled,
	judge: cfgTtsrJudge,
	contextMode: cfgTtsrContextMode,
	interruptMode: cfgTtsrInterruptMode,
	repeatMode: cfgTtsrRepeatMode,
	repeatGap: cfgTtsrRepeatGap,
	builtinRules: cfgTtsrBuiltinRules,
	disabledRules: cfgTtsrDisabledRules,
});

/** Time-traveling stream rules configuration ({@link cfgTtsr}). */
export type TtsrSettings = SettingValueOf<typeof cfgTtsr>;
