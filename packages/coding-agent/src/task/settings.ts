/**
 * Settings declared by this domain (see `config/registry.ts`). Declaration order is the
 * settings-panel order; `config/all-settings.ts` registers every domain.
 */
import { type OAuthAccountPools, validateAgentAccountPools } from "../config/account-pools";
import {
	type AgentCompactionThresholdOverride,
	validateAgentCompactionThresholdOverrides,
} from "../config/compaction-threshold";
import { effect, register } from "../config/registry";
import { type ServiceTierInheritSettingValue, validateAgentServiceTierOverrides } from "../config/service-tier";
import { THINKING_EFFORTS } from "@oh-my-pi/pi-catalog/effort";
import { isRecord, logger, setWorktreesDir } from "@oh-my-pi/pi-utils";
import { setFeedModelBadgeEnabled } from "@oh-my-pi/pi-tui/render/render-utils";
import { getThinkingLevelMetadata } from "@oh-my-pi/pi-tui/thinking";

const EMPTY_AGENT_SERVICE_TIER_OVERRIDES: Record<string, ServiceTierInheritSettingValue> = {};
const EMPTY_AGENT_COMPACTION_THRESHOLD_OVERRIDES: Record<string, AgentCompactionThresholdOverride> = {};
const EMPTY_AGENT_ACCOUNT_POOLS: Record<string, OAuthAccountPools> = {};
const EMPTY_AGENT_SOFT_REQUEST_BUDGET: Record<string, number | null> = {};

const DEFAULT_AGENT_MODEL_OVERRIDES: Record<string, string | string[]> = {};

// Delegation. Task and isolation settings declare `protocolDefault`: protocol hosts get neutral
// defaults instead of the local user's interactive preferences.
export const cfgTaskIsolationEnabled = register({
	id: "task.isolation.enabled",
	protocolDefault: ["rpc", "acp"],
	type: "boolean",
	default: false,
	ui: {
		tab: "tasks",
		group: "隔离",
		label: "允许隔离子代理",
		description: "Allow per-task isolation with `isolated: true`; tasks without it run in the shared checkout",
	},
});

export const cfgIsolationBackend = register({
	id: "isolation.backend",
	protocolDefault: ["rpc", "acp"],
	type: "enum",
	values: ["auto", "apfs", "btrfs", "zfs", "reflink", "overlayfs", "projfs", "block-clone", "rcopy"] as const,
	default: "auto",
	ui: {
		tab: "tasks",
		group: "隔离",
		label: "隔离后端",
		description: "Backend used for subagent isolation and worktree cloning",
		options: [
			{ value: "auto", label: "自动", description: "让 PAL 选择最佳可用后端" },
			{ value: "apfs", label: "APFS", description: "macOS clonefile reflink (APFS)" },
			{ value: "btrfs", label: "btrfs", description: "btrfs subvolume snapshot" },
			{ value: "zfs", label: "ZFS", description: "ZFS snapshot + clone" },
			{ value: "reflink", label: "Reflink", description: "Linux FICLONE 逐文件 reflink" },
			{
				value: "overlayfs",
				label: "Overlayfs",
				description: "Linux 内核 overlay（或 fuse-overlayfs 回退）",
			},
			{ value: "projfs", label: "ProjFS", description: "Windows Projected File System" },
			{
				value: "block-clone",
				label: "阻止克隆",
				description: "Windows FSCTL_DUPLICATE_EXTENTS_TO_FILE (NTFS/ReFS)",
			},
			{
				value: "rcopy",
				label: "递归复制",
				description: "可用时使用 git worktree，否则递归复制",
			},
		],
	},
});

export const cfgWorktreeClone = register({
	id: "worktree.clone",
	protocolDefault: ["rpc", "acp"],
	type: "boolean",
	default: true,
	ui: {
		tab: "tasks",
		group: "隔离",
		label: "将检出克隆到工作树",
		description:
			"New worktrees from `github pr_checkout` and `git worktree add` in bash start as a copy-on-write clone of the current checkout so ignored build artifacts (node_modules, target) carry over; falls back to a plain checkout when the filesystem cannot clone",
	},
});

export const cfgWorktreeCleanSource = register({
	id: "worktree.cleanSource",
	protocolDefault: ["rpc", "acp"],
	type: "boolean",
	default: false,
	ui: {
		tab: "tasks",
		group: "隔离",
		label: "在 /wt 时清理源检出",
		description:
			"When creating a worktree with `/wt`, reset tracked changes and remove untracked files from the original checkout after carrying them over",
	},
});

export const cfgWorktreeOnStart = register({
	id: "worktree.onStart",
	protocolDefault: ["rpc", "acp"],
	type: "enum",
	values: ["off", "ask", "create"] as const,
	default: "off",
	ui: {
		tab: "tasks",
		group: "隔离",
		label: "启动时工作树",
		description: "Whether fresh interactive sessions start in a new linked worktree",
		options: [
			{ value: "off", label: "关闭", description: "Start in the current checkout" },
			{ value: "ask", label: "询问", description: "会话开始时询问" },
			{ value: "create", label: "创建", description: "Always start in a new worktree on a `wt/*` branch" },
		],
	},
});

export const cfgWorktreeOnExit = register({
	id: "worktree.onExit",
	protocolDefault: ["rpc", "acp"],
	type: "enum",
	values: ["keep", "ask", "remove"] as const,
	default: "keep",
	ui: {
		tab: "tasks",
		group: "隔离",
		label: "退出时工作树",
		description: "What to do on exit with worktrees created since omp started (on start or with `/wt`)",
		options: [
			{ value: "keep", label: "保留", description: "保留工作树" },
			{ value: "ask", label: "询问", description: "退出时询问" },
			{
				value: "remove",
				label: "移除",
				description:
					"Remove clean worktrees; ask when they have uncommitted changes or new commits. Gitignored files (e.g. `.env`) are deleted too",
			},
		],
	},
});

export const cfgTaskIsolationApply = register({
	id: "task.isolation.apply",
	protocolDefault: ["rpc", "acp"],
	type: "boolean",
	default: true,
	ui: {
		tab: "tasks",
		group: "隔离",
		label: "应用隔离更改",
		description:
			"Automatically apply successful isolated task changes to the parent checkout; disable to retain patch or branch artifacts",
	},
});

export const cfgTaskIsolationMerge = register({
	id: "task.isolation.merge",
	protocolDefault: ["rpc", "acp"],
	type: "enum",
	values: ["patch", "branch"] as const,
	default: "patch",
	ui: {
		tab: "tasks",
		group: "隔离",
		label: "隔离合并策略",
		description: "How isolated task changes are integrated (patch apply or branch merge)",
		options: [
			{ value: "patch", label: "补丁", description: "合并差异并使用 git apply" },
			{ value: "branch", label: "分支", description: "Commit per task, merge with --no-ff" },
		],
	},
});

export const cfgTaskIsolationCommits = register({
	id: "task.isolation.commits",
	protocolDefault: ["rpc", "acp"],
	type: "enum",
	values: ["generic", "ai"] as const,
	default: "generic",
	ui: {
		tab: "tasks",
		group: "隔离",
		label: "隔离提交风格",
		description: "Commit message style for nested repo changes (generic or AI-generated)",
		options: [
			{ value: "generic", label: "通用", description: "静态提交消息" },
			{ value: "ai", label: "AI", description: "根据差异生成 AI 提交消息" },
		],
	},
});

export const cfgWorktreeBase = register({
	id: "worktree.base",
	type: "string",
	default: undefined,
	ui: {
		tab: "tasks",
		group: "隔离",
		label: "工作树基础目录",
		description:
			"Base directory for agent-managed worktrees — task-isolation copies, `github` PR checkouts, and `omp worktree` cleanup all live here. Unset uses ~/.omp/wt. Must be an absolute or ~-relative path; relative paths are ignored. The OMP_WORKTREE_DIR env var overrides this.",
	},
});
effect(cfgWorktreeBase, value => {
	const dir = value?.trim() ? value : undefined;
	// Always applied, so an unset/empty value clears a previous override. setWorktreesDir expands `~`,
	// rejects relative paths, and returns the applied absolute path (undefined when cleared/rejected).
	if (!setWorktreesDir(dir) && dir) {
		logger.warn("Settings: worktree.base must be an absolute or ~-relative path; ignoring", { value: dir });
	}
});

export const cfgTaskEager = register({
	id: "task.eager",
	protocolDefault: ["rpc", "acp"],
	type: "enum",
	values: ["default", "preferred", "always"] as const,
	default: "default",
	ui: {
		tab: "tasks",
		group: "子代理",
		label: "优先任务委派",
		description: "向子代理委派工作的强度",
		options: [
			{
				value: "default",
				label: "默认",
				description: "Uses the selected model's policy; some models require an explicit delegation request",
			},
			{ value: "preferred", label: "首选", description: "在系统提示词中加入委派指引" },
			{ value: "always", label: "总是", description: "提示词指引加首轮委派提醒" },
		],
	},
});

export const cfgTaskBatch = register({
	id: "task.batch",
	protocolDefault: ["rpc", "acp"],
	type: "boolean",
	default: true,
	ui: {
		tab: "tasks",
		group: "子代理",
		label: "批量任务调用",
		description:
			"Switch the task tool to its batch shape: one call carries { context, tasks[] } — one subagent per item, with an optional per-item agent (defaulting to the session spawn-policy agent), per-item isolation, and a required shared context prepended to every assignment. With async.enabled=true, each spawn runs as an independent background agent with the normal idle/parked lifecycle; otherwise the call blocks for merged results. Disable to restore the flat single-spawn schema.",
	},
});

export const cfgTaskStructured = register({
	id: "task.structured",
	type: "boolean",
	default: false,
	ui: {
		tab: "tasks",
		group: "子代理",
		label: "结构化任务结果",
		description:
			"Expose outputSchema/schemaMode on the task tool and return subagent results through the yield tool, validated against caller or agent output schemas. Off: task subagents have no yield tool and return their final message as plain text, except agents whose definition sets structured: true. Eval agent()/workpool spawns always keep structured results.",
	},
});

export const cfgTaskSpeculativeLaunch = register({
	id: "task.speculativeLaunch",
	type: "boolean",
	default: true,
	ui: {
		tab: "tasks",
		group: "子代理",
		label: "推测性任务启动",
		description:
			"Start each batch subagent as soon as its tasks[] item finishes streaming instead of waiting for the whole task call. Launched agents are aborted if the finished call fails validation, is blocked, or its arguments change. Requires auto-allowed task approval and no extension tool lifecycle handlers.",
	},
});

export const cfgTaskEnableEffort = register({
	id: "task.enableEffort",
	type: "boolean",
	default: false,
	ui: {
		tab: "tasks",
		group: "子代理",
		label: "每任务努力",
		description:
			"Expose the optional effort parameter on task spawns, allowing callers to override each subagent's thinking level",
	},
});

export const cfgTaskMaxConcurrency = register({
	id: "task.maxConcurrency",
	protocolDefault: ["rpc", "acp"],
	type: "number",
	default: 32,
	ui: {
		tab: "tasks",
		group: "子代理",
		label: "最大并发任务数",
		description: "同时运行的子代理最大数量",
		options: [
			{ value: "0", label: "无限制" },
			{ value: "1", label: "1 任务" },
			{ value: "2", label: "2 任务" },
			{ value: "4", label: "4 任务" },
			{ value: "8", label: "8 任务" },
			{ value: "16", label: "16 任务" },
			{ value: "32", label: "32 任务" },
			{ value: "64", label: "64 任务" },
		],
	},
});

export const cfgTaskEnableLsp = register({
	id: "task.enableLsp",
	type: "boolean",
	default: false,
	ui: {
		tab: "tasks",
		group: "子代理",
		label: "子代理中的 LSP",
		description:
			"Allow subagents spawned via the task tool to use the lsp tool. Off by default to keep subagents cheap; enable when LSP-aware delegation is worth the extra tokens.",
	},
});

export const cfgTaskMaxRecursionDepth = register({
	id: "task.maxRecursionDepth",
	protocolDefault: ["rpc", "acp"],
	type: "number",
	default: 2,
	ui: {
		tab: "tasks",
		group: "子代理",
		label: "最大任务递归深度",
		description: "How many levels deep subagents can spawn their own subagents",
		options: [
			{ value: "-1", label: "无限制" },
			{ value: "0", label: "无" },
			{ value: "1", label: "单次" },
			{ value: "2", label: "两次" },
			{ value: "3", label: "三次" },
		],
	},
});

export const cfgTaskMaxRuntimeMs = register({
	id: "task.maxRuntimeMs",
	type: "number",
	default: 0,
	ui: {
		tab: "tasks",
		group: "子代理",
		label: "子代理最长运行时间",
		description:
			"Hard wall-clock limit per subagent (ms). 0 disables it. Defense-in-depth against provider-side stream hangs that escape the inference-layer watchdog; triggers a normal subagent abort with a 'timed out' reason.",
		options: [
			{ value: "0", label: "无限制", description: "默认" },
			{ value: "300000", label: "5 分钟" },
			{ value: "900000", label: "15 分钟" },
			{ value: "1800000", label: "30 分钟" },
			{ value: "3600000", label: "1 小时" },
		],
	},
});

export const cfgTaskCompletionProbe = register({
	id: "task.completionProbe",
	type: "boolean",
	default: true,
	ui: {
		tab: "tasks",
		group: "子代理",
		label: "子代理完成探测",
		description:
			"Ask a working subagent, through a cached side request like /btw, to estimate how complete its task is: after 2, 5, 10 and 30 more minutes, then hourly. The estimate shows next to the subagent in wait and task views. Only subagents spawned by the main agent of an interactive session are asked; print, RPC, ACP and SDK runs never probe.",
	},
});

export const cfgTaskAgentIdleTtlMs = register({
	id: "task.agentIdleTtlMs",
	type: "number",
	default: 420_000,
	ui: {
		tab: "tasks",
		group: "子代理",
		label: "代理空闲 TTL",
		description:
			"How long an idle subagent stays live in memory before being parked to disk (ms). Parked agents are revived automatically when messaged or resumed. 0 keeps idle agents live until exit.",
	},
});

export const cfgTaskSoftRequestBudget = register({
	id: "task.softRequestBudget",
	type: "number",
	default: 200,
	ui: {
		tab: "tasks",
		group: "子代理",
		label: "软子代理请求预算",
		description:
			"Soft per-subagent request budget (assistant requests per run). Crossing it injects a wrap-up steering notice (see task.softRequestBudgetNotice); at 1.5x the budget the run is force-stopped and the agent must hand back its partial findings. 0 disables the guard. Bundled scout/sonic agents cap out at a lower built-in budget, so a value below that cap still applies to them. A task.agentSoftRequestBudget entry replaces this budget for the agent it names.",
		options: [
			{ value: "0", label: "已禁用" },
			{ value: "90", label: "90 次请求" },
			{ value: "150", label: "150 次请求" },
			{ value: "200", label: "200 次请求", description: "默认" },
		],
	},
});

/**
 * Validates `task.agentSoftRequestBudget`: exact agent name → request budget,
 * a non-negative integer (0 disables that agent's guard). A `null` entry clears
 * one inherited from a lower-priority settings layer.
 */
function validateAgentSoftRequestBudget(value: unknown): void {
	if (value === undefined || value === null) return;
	if (!isRecord(value)) {
		const received = Array.isArray(value) ? "an array" : `a ${typeof value}`;
		throw new Error(
			`Invalid task.agentSoftRequestBudget: expected a map of agent name to request budget, got ${received}.`,
		);
	}
	for (const [agentName, budget] of Object.entries(value)) {
		if (budget === null || (typeof budget === "number" && Number.isSafeInteger(budget) && budget >= 0)) continue;
		throw new Error(
			`Invalid task.agentSoftRequestBudget.${agentName}: expected a non-negative integer request count (0 disables the guard), got ${Bun.inspect(budget)}.`,
		);
	}
}

export const cfgTaskAgentSoftRequestBudget = register({
	id: "task.agentSoftRequestBudget",
	type: "record",
	default: EMPTY_AGENT_SOFT_REQUEST_BUDGET,
	validate: validateAgentSoftRequestBudget,
});

export const cfgTaskSoftRequestBudgetNotice = register({
	id: "task.softRequestBudgetNotice",
	type: "boolean",
	default: true,
	ui: {
		tab: "tasks",
		group: "子代理",
		label: "软请求预算提示",
		description:
			"Inject one steering notice when a subagent crosses its soft request budget, asking it to wrap up before the 1.5x forced-yield stop.",
	},
});

export const cfgTaskMaxEffort = register({
	id: "task.maxEffort",
	type: "enum",
	values: THINKING_EFFORTS,
	default: "max",
	ui: {
		tab: "tasks",
		group: "子代理",
		label: "每次生成的最大努力",
		description:
			"Maximum reasoning effort allowed for the task tool's per-spawn effort hint. Lower values prevent callers from escalating subagents above this ceiling; the default preserves the model's full range.",
		options: THINKING_EFFORTS.map(getThinkingLevelMetadata),
	},
});

export const cfgTaskDisabledAgents = register({
	id: "task.disabledAgents",
	protocolDefault: ["rpc", "acp"],
	type: "array",
	default: [] as string[],
});

export const cfgTaskAgentModelOverrides = register({
	id: "task.agentModelOverrides",
	protocolDefault: ["rpc", "acp"],
	type: "record",
	default: DEFAULT_AGENT_MODEL_OVERRIDES,
});

export const cfgTaskAgentServiceTierOverrides = register({
	id: "task.agentServiceTierOverrides",
	protocolDefault: ["rpc", "acp"],
	type: "record",
	default: EMPTY_AGENT_SERVICE_TIER_OVERRIDES,
	validate: validateAgentServiceTierOverrides,
});

export const cfgTaskAgentCompactionThresholdOverrides = register({
	id: "task.agentCompactionThresholdOverrides",
	protocolDefault: ["rpc", "acp"],
	type: "record",
	default: EMPTY_AGENT_COMPACTION_THRESHOLD_OVERRIDES,
	validate: validateAgentCompactionThresholdOverrides,
});

export const cfgTaskAgentAccountPools = register({
	id: "task.agentAccountPools",
	protocolDefault: ["rpc", "acp"],
	type: "record",
	default: EMPTY_AGENT_ACCOUNT_POOLS,
	validate: validateAgentAccountPools,
});

export const cfgTaskAgentPrewalk = register({
	id: "task.agentPrewalk",
	protocolDefault: ["rpc", "acp"],
	type: "record",
	default: {} as Record<string, string>,
});

export const cfgTaskAgentAdvisor = register({
	id: "task.agentAdvisor",
	protocolDefault: ["rpc", "acp"],
	type: "record",
	default: {} as Record<string, string>,
});

export const cfgTaskPrewalk = register({
	id: "task.prewalk",
	type: "boolean",
	default: false,
	ui: {
		tab: "tasks",
		group: "子代理",
		label: "通用任务预走",
		description:
			"Arm prewalk for the bundled generic `task` subagent: it starts on its resolved model, plans and begins the implementation, then hands off to the 'smol' role at its first edit/write. Per-agent overrides (task.agentPrewalk, configured from the /agents hub) and user agent `prewalk` frontmatter apply regardless of this toggle.",
	},
});

export const cfgTaskShowResolvedModelBadge = register({
	id: "task.showResolvedModelBadge",
	type: "boolean",
	default: false,
	ui: {
		tab: "appearance",
		group: "显示",
		label: "显示已解析模型徽标",
		description: "Display the actual model ID used by each subagent in the task widget status line",
	},
});
effect(cfgTaskShowResolvedModelBadge, setFeedModelBadgeEnabled);
