/**
 * Settings declared by this domain (see `config/registry.ts`). Declaration order is the
 * settings-panel order; `config/all-settings.ts` registers every domain.
 */
import { register } from "../config/registry";

// Auto-Learn (experimental): post-stop nudge to capture lessons to memory
// and mint/enhance isolated managed skills under ~/.omp/agent/managed-skills.
// Master flag is default-off → inert (read live at every stop); sub-flags gate behaviour.
export const cfgAutolearnEnabled = register({
	id: "autolearn.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "memory",
		group: "自动学习",
		label: "自动学习（实验性）",
		description:
			"代理停止后，提示它把经验写入记忆并创建/增强隔离的托管技能",
	},
});

export const cfgAutolearnAutoContinue = register({
	id: "autolearn.autoContinue",
	type: "boolean",
	default: false,
	ui: {
		tab: "memory",
		group: "自动学习",
		label: "停止时自动运行捕获",
		description:
			"开启时，在停止时自动运行一次隐私捕获回合（会消耗额外令牌）。关闭时，只保留常驻的自动学习指引。",
		condition: "autolearnActive",
	},
});

// Config-file-only knob (numbers without `options` are hidden from the UI).
export const cfgAutolearnMinToolCalls = register({ id: "autolearn.minToolCalls", type: "number", default: 5 });
