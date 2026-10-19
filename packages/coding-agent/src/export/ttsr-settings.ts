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
		description: "Interrupt the agent mid-stream when output matches rule patterns (Time-Traveling Stream Rules)",
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
			"Ask the judge model role each `question` rule about completed replies, reasoning, and tool calls; a yes injects the rule as a warning",
		options: [
			{
				value: "auto",
				label: "自动",
				description: "Judge only when the judge role resolves to a native TypeSafe jev model",
			},
			{ value: "on", label: "开启", description: "Always judge, whichever model the judge role resolves to" },
			{ value: "off", label: "关闭", description: "Never judge; question rules stay inactive" },
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
		description: "What to do with partial output when TTSR triggers",
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
		description: "When to interrupt mid-stream vs inject warning after completion",
		options: [
			{ value: "always", label: "always", description: "Interrupt on prose and tool streams" },
			{ value: "prose-only", label: "prose-only", description: "Interrupt only on reply/thinking matches" },
			{ value: "tool-only", label: "tool-only", description: "Interrupt only on tool-call argument matches" },
			{ value: "never", label: "never", description: "Never interrupt; inject warning after completion" },
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
		description: "How rules can repeat: once per session or after a message gap",
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
		description: "Messages before a rule can trigger again",
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
		description: "Load the default rules shipped with the agent (override individually with ttsr.disabledRules)",
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
		description: "Rule names to ignore entirely (applies to bundled defaults and your own rules)",
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
