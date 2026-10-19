/**
 * Settings declared by this domain (see `config/registry.ts`). Declaration order is the
 * settings-panel order; `config/all-settings.ts` registers every domain.
 */
import { register } from "../config/registry";

// Eval (per-backend toggles; add more as new backends ship, e.g. eval.ts)
export const cfgEvalPy = register({
	id: "eval.py",
	type: "boolean",
	default: true,
	env: "PI_PY",
	ui: {
		tab: "shell",
		group: "Eval 与运行时",
		label: "Python Eval 后端",
		description: "允许 eval 工具把 Python 单元派发到 IPython 内核",
	},
});

export const cfgEvalJs = register({
	id: "eval.js",
	type: "boolean",
	default: true,
	env: "PI_JS",
	ui: {
		tab: "shell",
		group: "Eval 与运行时",
		label: "JavaScript Eval 后端",
		description: "允许 eval 工具把 JavaScript 单元派发到进程内运行时",
	},
});

export const cfgEvalAutoProvision = register({
	id: "eval.autoProvision",
	type: "boolean",
	default: true,
	ui: {
		tab: "shell",
		group: "Eval 与运行时",
		label: "Eval 环境准备",
		description: "首次安装时自动创建托管的 JavaScript eval 包环境",
	},
});

export const cfgEvalToolsEnabled = register({
	id: "eval.tools.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "shell",
		group: "Eval 与运行时",
		label: "Eval 定义的工具",
		description:
			"允许 eval 单元定义工具（Python 的 @tool，JS 的 tool(fn)），供 task、agent() 与 workpool() 子代理调用",
	},
});

export const cfgEvalWorkpoolFreshAgents = register({
	id: "eval.workpool.freshAgents",
	type: "boolean",
	default: false,
	ui: {
		tab: "shell",
		group: "Eval 与运行时",
		label: "新工作池代理",
		description: "为每个 workpool 条目派生新的子代理，而不是复用工作器或批量处理排队条目",
	},
});

export const cfgEvalAutoBackgroundEnabled = register({
	id: "eval.autoBackground.enabled",
	protocolDefault: ["rpc"],
	type: "boolean",
	default: false,
	ui: {
		tab: "shell",
		group: "Eval 与运行时",
		label: "Eval 自动后台",
		description: "自动将长时间运行的 eval 单元转入后台，稍后投递结果",
	},
});

export const cfgEvalAutoBackgroundThresholdMs = register({
	id: "eval.autoBackground.thresholdMs",
	protocolDefault: ["rpc"],
	type: "number",
	default: 60_000,
});

// Runtime knobs (consumed by eval backends and the /python slash command)
export const cfgPythonKernelMode = register({
	id: "python.kernelMode",
	type: "enum",
	values: ["session", "per-call"] as const,
	default: "session",
	ui: {
		tab: "shell",
		group: "Eval 与运行时",
		label: "Python 内核模式",
		description: "在多次 eval 调用之间保持 IPython 内核存活，或每次都重新启动",
	},
});

export const cfgPythonInterpreter = register({
	id: "python.interpreter",
	type: "string",
	default: "",
	ui: {
		tab: "shell",
		group: "Eval 与运行时",
		label: "Python 解释器",
		description:
			"可选的精确 Python 可执行文件路径。设置后将跳过自动 Python 运行时发现。",
	},
});
