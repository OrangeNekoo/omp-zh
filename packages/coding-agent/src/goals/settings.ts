import { register } from "../config/registry";

export const cfgGoalEnabled = register({
	id: "goal.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tasks",
		group: "模式",
		label: "目标模式",
		description: "Enable per-session goal mode and the hidden goal tool",
	},
});

export const cfgGoalStatusInFooter = register({
	id: "goal.statusInFooter",
	type: "boolean",
	default: true,
	ui: {
		tab: "tasks",
		group: "模式",
		label: "页脚中的目标状态",
		description: "Show token budget alongside the goal indicator in the status line",
	},
});

const GOAL_CONTINUATION_MODES_DEFAULT: string[] = ["interactive"];

export const cfgGoalContinuationModes = register({
	id: "goal.continuationModes",
	type: "array",
	default: GOAL_CONTINUATION_MODES_DEFAULT,
	ui: {
		tab: "tasks",
		group: "模式",
		label: "目标延续模式",
		description: 'Run modes where active goals may auto-continue between turns ("interactive", "rpc")',
	},
});
