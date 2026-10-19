/**
 * Settings declared by this domain (see `config/registry.ts`). Declaration order is the
 * settings-panel order; `config/all-settings.ts` registers every domain.
 */
import { register } from "../config/registry";
import { DEFAULT_SHARE_URL } from "@oh-my-pi/pi-wire";

export const cfgShareServerUrl = register({
	id: "share.serverUrl",
	type: "string",
	default: DEFAULT_SHARE_URL,
	ui: {
		tab: "interaction",
		group: "协作",
		label: "共享服务器",
		description:
			"Share viewer/upload base used by /share (encrypted blob upload + viewer; links are <base>/<id>#<key>)",
	},
});

export const cfgShareStore = register({
	id: "share.store",
	type: "enum",
	values: ["blob", "gist"] as const,
	default: "blob",
	ui: {
		tab: "interaction",
		group: "协作",
		label: "共享存储",
		description: "Where /share uploads the encrypted session blob",
		options: [
			{
				value: "blob",
				label: "加密数据块",
				description: "Upload to the share server (no GitHub account needed; avoids gist API rate limits)",
			},
			{
				value: "gist",
				label: "GitHub Gist",
				description: "Push to a secret gist (needs authenticated gh), falling back to the share server",
			},
		],
	},
});

export const cfgShareRedactSecrets = register({
	id: "share.redactSecrets",
	type: "boolean",
	default: true,
	ui: {
		tab: "interaction",
		group: "协作",
		label: "共享密钥脱敏",
		description: "Run the secret obfuscator over /share snapshots before upload (uses the secrets.* config)",
	},
});
