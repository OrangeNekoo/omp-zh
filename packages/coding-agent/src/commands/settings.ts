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
			"/share 使用的共享查看器/上传基础地址（加密 blob 上传 + 查看器；链接为 <base>/<id>#<key>）",
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
		description: "/share 上传加密会话 blob 的位置",
		options: [
			{
				value: "blob",
				label: "加密数据块",
				description: "上传到共享服务器（无需 GitHub 账户；可避开 gist API 速率限制）",
			},
			{
				value: "gist",
				label: "GitHub Gist",
				description: "推送到私有 gist（需要已认证的 gh），失败则回退到共享服务器",
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
		description: "上传前对 /share 快照运行密钥混淆器（使用 secrets.* 配置）",
	},
});
