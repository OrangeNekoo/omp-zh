/**
 * Settings declared by this domain (see `config/registry.ts`). Declaration order is the
 * settings-panel order; `config/all-settings.ts` registers every domain.
 */
import { ADVISOR_SEVERITIES } from "@oh-my-pi/pi-tui/chat/messages";
import { ADVISOR_REVIEW_MODES, ADVISOR_SYNC_BACKLOG_MODES } from "@oh-my-pi/pi-tui/overlays/advisor-config";
import { register } from "../config/registry";
import { ADVISOR_DEFAULT_BUDGET_PER_UPDATE } from "./emission-guard";

// Advisor is interactive-session assistance: protocol hosts opt in explicitly instead of inheriting the
// user's local preference, and get the default tuning rather than the user's local tuning.
export const cfgAdvisorEnabled = register({
	id: "advisor.enabled",
	protocolDefault: ["rpc", "acp"],
	type: "boolean",
	default: false,
	ui: {
		tab: "model",
		group: "顾问",
		label: "启用顾问",
		description:
			"挂载第二个模型（分配给 'advisor' 角色），被动审查每个回合并注入备注。",
	},
});

export const cfgAdvisorSyncBacklog = register({
	id: "advisor.syncBacklog",
	protocolDefault: ["rpc", "acp"],
	type: "enum",
	values: ADVISOR_SYNC_BACKLOG_MODES,
	default: "off",
	ui: {
		tab: "model",
		group: "顾问",
		label: "顾问同步积压",
		description:
			"暂停主代理，直到顾问积压降至阈值以下。数值会将等待上限设为 30 秒；strict 会等待所有计划审查完成，不设墙钟上限。Off 禁用追赶延迟。中止、失败与销毁都会解除等待。",
		condition: "advisorEnabled",
	},
});

export const cfgAdvisorImmuneTurns = register({
	id: "advisor.immuneTurns",
	protocolDefault: ["rpc", "acp"],
	type: "number",
	default: 3,
	ui: {
		tab: "model",
		group: "顾问",
		label: "顾问免疫回合",
		description:
			"在顾问的关注点或阻塞项中断之后，接下来这么多个主回合内把新的关注点作为非中断的旁注处理。阻塞项不受冷却限制。",
		options: [
			{ value: "0", label: "0 步", description: "无冷却。" },
			{ value: "1", label: "1 步" },
			{ value: "2", label: "2 步" },
			{ value: "3", label: "3 步", description: "默认。" },
			{ value: "4", label: "4 步" },
			{ value: "5", label: "5 步" },
		],
		condition: "advisorEnabled",
	},
});

export const cfgAdvisorContinueSeverity = register({
	id: "advisor.continueSeverity",
	protocolDefault: ["rpc", "acp"],
	type: "enum",
	values: ADVISOR_SEVERITIES,
	default: "concern",
	ui: {
		tab: "model",
		group: "顾问",
		label: "顾问继续严重度",
		description:
			"在代理以最终回答结束后，能唤醒它的顾问备注最低严重度。较低严重度的备注会作为卡片留在会话记录末尾，并随你的下一条消息传达给代理。",
		options: [
			{ value: "nit", label: "细节", description: "每条备注都继续运行。" },
			{ value: "concern", label: "关注点", description: "关注点和阻塞项继续运行。默认。" },
			{ value: "blocker", label: "阻塞项", description: "仅阻塞项继续运行。" },
		],
		condition: "advisorEnabled",
	},
});

export const cfgAdvisorReviewMode = register({
	id: "advisor.reviewMode",
	protocolDefault: ["rpc", "acp"],
	type: "enum",
	values: ADVISOR_REVIEW_MODES,
	default: "turn",
	ui: {
		tab: "model",
		group: "顾问",
		label: "顾问审查模式",
		description:
			"没有 WATCHDOG.yml 名单时的默认顾问节奏。turn 审查每个主回合；agent-end 仅在最终让出时审查。",
		options: [
			{ value: "turn", label: "每一轮", description: "审查每次主要更新（即一轮工具调用）" },
			{ value: "agent-end", label: "代理结束", description: "仅在最终让出时审查（每次运行一次）。" },
		],
		condition: "advisorEnabled",
	},
});

export const cfgAdvisorReviewInterval = register({
	id: "advisor.reviewInterval",
	protocolDefault: ["rpc", "acp"],
	type: "number",
	default: 1,
	ui: {
		tab: "model",
		group: "顾问",
		label: "顾问审查间隔",
		description:
			"没有 WATCHDOG.yml 名单时的默认顾问节奏：每第 N 次符合条件的主动更新进行一次审查。1 = 每次更新。被跳过的更新会随下一次计划审查一并发送。",
		options: [
			{ value: "1", label: "每次符合条件的更新", description: "默认。" },
			{ value: "2", label: "每 2 次" },
			{ value: "3", label: "每 3 次" },
			{ value: "5", label: "每 5 次" },
			{ value: "10", label: "每 10 次" },
		],
		condition: "advisorEnabled",
	},
});

export const cfgAdvisorMaxNotesPerUpdate = register({
	id: "advisor.maxNotesPerUpdate",
	protocolDefault: ["rpc", "acp"],
	type: "number",
	default: ADVISOR_DEFAULT_BUDGET_PER_UPDATE,
	ui: {
		tab: "model",
		group: "顾问",
		label: "顾问每次更新最大备注数",
		description:
			"每次顾问提示词更新最多接受的非阻塞建议备注数（1–32；界面提供 1–5 的快捷选项）。阻塞项不受限制。",
		options: [
			{ value: "1", label: "1 条备注", description: "防刷屏（严格）。" },
			{ value: "2", label: "2 条备注" },
			{ value: "3", label: "3 条备注" },
			{ value: "4", label: "4 条备注", description: "前沿推理模型。默认。" },
			{ value: "5", label: "5 条备注" },
		],
		condition: "advisorEnabled",
	},
});

export const cfgAdvisorEvictStaleResults = register({
	id: "advisor.evictStaleResults",
	protocolDefault: ["rpc", "acp"],
	type: "boolean",
	default: true,
	ui: {
		tab: "model",
		group: "顾问",
		label: "顾问驱逐过期结果",
		description:
			"每次审查前，把顾问在旧审查中的 read/grep/glob 输出替换为简短占位符。最新一次审查保留。",
		condition: "advisorEnabled",
	},
});
