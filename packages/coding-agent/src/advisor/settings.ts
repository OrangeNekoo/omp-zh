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
			"Pair a second model (assigned to the 'advisor' role) that passively reviews each turn and injects notes.",
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
			"Pause main agent until advisor backlog falls below threshold. Numeric values cap wait at 30 seconds; strict waits for all scheduled reviews without a wall-clock cap. Off disables catch-up delays. Abort, failure, and disposal release waits.",
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
			"After an advisor concern or blocker interrupts, route further concerns as non-interrupting asides for this many primary turns. Blockers are exempt from the cooldown.",
		options: [
			{ value: "0", label: "0 步", description: "无冷却。" },
			{ value: "1", label: "1 步" },
			{ value: "2", label: "2 步" },
			{ value: "3", label: "3 步", description: "Default." },
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
			"Minimum severity of an advisor note that wakes the agent after it finished with a final answer. Lower-severity notes stay as a card at the end of the transcript and reach the agent with your next message.",
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
			"Default advisor cadence when no WATCHDOG.yml roster is present. turn reviews every primary turn; agent-end reviews only final yields.",
		options: [
			{ value: "turn", label: "每一轮", description: "审查每次主要更新（工具调用轮次）。" },
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
			"Default advisor cadence when no WATCHDOG.yml roster is present: review every Nth eligible primary update. 1 = every update. Skipped updates are sent with the next scheduled review.",
		options: [
			{ value: "1", label: "每次符合条件的更新", description: "Default." },
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
			"Maximum non-blocker advice notes accepted per advisor prompt update (1–32; UI offers 1–5 quick picks). Blockers are exempt.",
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
			"Before each review, replace the advisor's read/grep/glob output from older reviews with a short placeholder. The latest review is kept.",
		condition: "advisorEnabled",
	},
});
