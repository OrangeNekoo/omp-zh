/**
 * Settings declared by this domain (see `config/registry.ts`). Declaration order is the
 * settings-panel order; `config/all-settings.ts` registers every domain.
 */
import { register } from "../config/registry";
import { DEFAULT_RELAY_URL } from "./protocol";

// Collab
export const cfgCollabRelayUrl = register({
	id: "collab.relayUrl",
	type: "string",
	default: DEFAULT_RELAY_URL,
	ui: {
		tab: "interaction",
		group: "协作",
		label: "中继地址",
		description: "/collab 使用的中继 (wss://host[:port])",
	},
});

export const cfgCollabWebUrl = register({
	id: "collab.webUrl",
	type: "string",
	default: "",
	ui: {
		tab: "interaction",
		group: "协作",
		label: "Web UI 地址",
		description:
			"Browser UI used by /collab links; empty derives from collab.relayUrl; explicit http:// is localhost-only",
	},
});

export const cfgCollabDisplayName = register({
	id: "collab.displayName",
	type: "string",
	default: "",
	ui: {
		tab: "interaction",
		group: "协作",
		label: "显示名称",
		description: "Name shown to other collab participants (default: OS username)",
	},
});

export const cfgCollabAutoStart = register({
	id: "collab.autoStart",
	type: "enum",
	values: ["off", "view", "control"] as const,
	default: "off",
	ui: {
		tab: "interaction",
		group: "协作",
		label: "自动启动",
		description:
			"Host every interactive session via collab.relayUrl as it starts and publish it to the local registry (omp collab list); rooms rotate on session switch",
		options: [
			{ value: "off", label: "关闭", description: "仅在运行 /collab 时共享" },
			{
				value: "view",
				label: "查看",
				description: "Auto-host; the registry hands out view-only links (omp collab link --view)",
			},
			{
				value: "control",
				label: "控制",
				description: "Auto-host; the registry hands out control links that can prompt the session",
			},
		],
	},
});
