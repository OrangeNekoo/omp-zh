/**
 * Settings declared by this domain (see `config/registry.ts`). Declaration order is the
 * settings-panel order; `config/all-settings.ts` registers every domain.
 */
import { register } from "../config/registry";

// ────────────────────────────────────────────────────────────────────────
// Tasks
// ────────────────────────────────────────────────────────────────────────

// Plan mode
export const cfgPlanEnabled = register({
	id: "plan.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tasks",
		group: "模式",
		label: "计划模式",
		description: "Enable plan mode for read-only exploration and planning before execution",
	},
});

export const cfgPlanDefaultOnStartup = register({
	id: "plan.defaultOnStartup",
	type: "boolean",
	default: false,
	ui: {
		tab: "tasks",
		group: "模式",
		label: "启动时进入计划模式",
		description: "Automatically enter plan mode at the start of every new session",
		condition: "planModeEnabled",
	},
});

export const cfgPlanAutosave = register({
	id: "plan.autosave",
	type: "boolean",
	default: false,
	ui: {
		tab: "tasks",
		group: "模式",
		label: "自动保存计划",
		description: "Automatically save approved plans to disk when plan mode completes",
		condition: "planModeEnabled",
	},
});

export const cfgPlanAutosaveDir = register({
	id: "plan.autosaveDir",
	type: "string",
	default: undefined,
	ui: {
		tab: "tasks",
		group: "模式",
		label: "自动保存目录",
		description:
			"Directory for autosaved plans. Supports ~, absolute, and cwd-relative paths. Empty uses <project>/.omp/plans/.",
		condition: "planAutosaveEnabled",
	},
});
