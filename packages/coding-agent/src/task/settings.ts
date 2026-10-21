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
		description: "允许通过 `isolated: true` 按任务隔离；未设置的任务在共享检出中运行",
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
		description: "子代理隔离与工作树克隆使用的后端",
		options: [
			{ value: "auto", label: "自动", description: "让 PAL 选择最佳可用后端" },
			{ value: "apfs", label: "APFS", description: "macOS clonefile 重链接（APFS）" },
			{ value: "btrfs", label: "btrfs", description: "btrfs 子卷快照" },
			{ value: "zfs", label: "ZFS", description: "ZFS 快照 + 克隆" },
			{ value: "reflink", label: "Reflink", description: "Linux FICLONE 逐文件 reflink" },
			{
				value: "overlayfs",
				label: "Overlayfs",
				description: "Linux 内核 overlay（或 fuse-overlayfs 回退）",
			},
			{ value: "projfs", label: "ProjFS", description: "Windows 投影文件系统" },
			{
				value: "block-clone",
				label: "阻止克隆",
				description: "Windows FSCTL_DUPLICATE_EXTENTS_TO_FILE（NTFS/ReFS）",
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
			"由 `github pr_checkout` 与 bash 中的 `git worktree add` 创建的新工作树会以当前检出的写时复制克隆开始，使被忽略的构建产物（node_modules、target）得以保留；当文件系统无法克隆时回退为普通检出",
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
			"使用 `/wt` 创建工作树时，在把更改带过去之后，重置原始检出中的已跟踪更改并移除未跟踪文件",
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
		description: "全新的交互式会话是否在新建的链接工作树中启动",
		options: [
			{ value: "off", label: "关闭", description: "在当前检出中启动" },
			{ value: "ask", label: "询问", description: "会话开始时询问" },
			{ value: "create", label: "创建", description: "始终在 `wt/*` 分支上的新工作树中启动" },
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
		description: "退出时如何处理自 omp 启动以来创建的工作树（启动时或通过 `/wt`）",
		options: [
			{ value: "keep", label: "保留", description: "保留工作树" },
			{ value: "ask", label: "询问", description: "退出时询问" },
			{
				value: "remove",
				label: "移除",
				description:
					"移除干净的工作树；存在未提交更改或新提交时会询问。被 gitignore 的文件（例如 `.env`）也会一并删除",
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
			"自动把成功的隔离任务更改应用到父检出；关闭则保留补丁或分支产物",
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
		description: "隔离任务更改的集成方式（应用补丁或合并分支）",
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
		description: "嵌套仓库更改的提交消息风格（通用或 AI 生成）",
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
			"代理托管工作树的基础目录 — 任务隔离副本、`github` PR 检出以及 `omp worktree` 清理都存放于此。未设置时使用 ~/.omp/wt。必须是绝对路径或 ~ 相对路径；相对路径会被忽略。环境变量 OMP_WORKTREE_DIR 会覆盖此项。",
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
				description: "使用所选模型的策略；某些模型需要显式委派请求",
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
			"将 task 工具切换为批量形态：一次调用携带 { context, tasks[] } — 每个条目一个子代理，可为每个条目指定代理（默认使用会话派生策略代理）、按条目隔离，并有一个必需的共享上下文前置到每个分派。当 async.enabled=true 时，每次派生都作为独立后台代理运行，遵循正常的空闲/停放生命周期；否则该调用会阻塞以等待合并结果。关闭可恢复为扁平的单一派生 schema。",
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
			"在 task 工具上暴露 outputSchema/schemaMode，并通过 yield 工具返回子代理结果，按调用方或代理的输出 schema 校验。关闭时：任务子代理没有 yield 工具，其最终消息以纯文本返回，除非代理定义设置了 structured: true。Eval agent()/workpool 派生的结果始终保留结构化结果。",
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
			"每个批次子代理在其 tasks[] 条目流式结束后立即启动，而不必等待整个 task 调用完成。若已完成的调用未通过校验、被阻止或其参数发生变化，已启动的代理会被中止。需要 task 批准已设为自动允许，且没有扩展工具生命周期处理器。",
	},
});

export const cfgTaskEnableEffort = register({
	id: "task.enableEffort",
	type: "boolean",
	default: false,
	ui: {
		tab: "tasks",
		group: "子代理",
		label: "每任务强度",
		description:
			"在任务派生时暴露可选的 effort 参数，允许调用方覆盖每个子代理的思考等级",
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
			{ value: "1", label: "1 个任务" },
			{ value: "2", label: "2 个任务" },
			{ value: "4", label: "4 个任务" },
			{ value: "8", label: "8 个任务" },
			{ value: "16", label: "16 个任务" },
			{ value: "32", label: "32 个任务" },
			{ value: "64", label: "64 个任务" },
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
			"允许通过 task 工具派生的子代理使用 lsp 工具。默认关闭以保持子代理低成本；当能感知 LSP 的委派值得额外令牌时再启用。",
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
		description: "子代理可以派生自己的子代理的层数",
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
			"每个子代理的硬性墙钟时限（毫秒）。0 表示禁用。作为纵深防御，应对绕过推理层看门狗的服务商侧流挂起；会以 \"timed out\" 原因触发正常的子代理中止。",
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
			"通过类似 /btw 的缓存侧请求，要求工作中的子代理估计任务完成度：在之后 2、5、10、30 分钟时，随后每小时一次。估计值显示在等待视图与任务视图中该子代理旁边。只有交互式会话主代理派生的子代理会被询问；print、RPC、ACP 与 SDK 运行从不探测。",
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
			"空闲子代理在内存中保持活跃多久后停放到磁盘（毫秒）。被停放的代理在收到消息或恢复时会自动复活。0 表示空闲代理一直保持活跃直到退出。",
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
			"每个子代理的软请求预算（每次运行的助手请求数）。超出时会注入收尾引导通知（见 task.softRequestBudgetNotice）；达到 1.5 倍预算时运行被强制停止，代理必须交回阶段性结论。0 表示禁用该守卫。内置的 scout/sonic 代理有更低的内置预算上限，低于该上限的值仍会对其生效。task.agentSoftRequestBudget 中针对某代理的条目会替换该代理的预算。",
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
			"当子代理超出软请求预算时注入一条引导通知，要求它在 1.5 倍强制让出停止前收尾。",
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
		label: "每次生成的最大强度",
		description:
			"task 工具按派生传递的 effort 提示所允许的最大推理强度。较低的值可防止调用方把子代理提升到超过此上限；默认值保留模型的完整范围。",
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
			"为内置的通用 `task` 子代理启用预走：它先使用解析出的模型规划并开始实现，在首次编辑/写入时移交给 'smol' 角色。按代理的覆盖设置（task.agentPrewalk，在 /agents 中心配置）和用户代理的 `prewalk` frontmatter 不受此开关影响。",
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
		description: "在任务组件状态行显示每个子代理实际使用的模型 ID",
	},
});
effect(cfgTaskShowResolvedModelBadge, setFeedModelBadgeEnabled);
