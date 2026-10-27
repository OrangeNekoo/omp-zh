import { register } from "../config/registry";

export const cfgGoalEnabled = register({
	id: "goal.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tasks",
		group: "模式",
		label: "目标模式",
		description: "启用按会话的目标模式与隐藏的 goal 工具",
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
		description: "在状态栏目标指示器旁显示令牌预算",
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
		description: '允许活跃目标在回合之间自动继续的运行模式（"interactive"、"rpc"）',
	},
});
