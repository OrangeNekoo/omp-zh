/**
 * Settings declared by this domain (see `config/registry.ts`). Declaration order is the
 * settings-panel order; `config/all-settings.ts` registers every domain.
 */
import { combine, register } from "../config/registry";
import { BUILTIN_BLOB_DESTINATIONS, type BlobDestinationId, type BlobDestinationMetadata } from "./destinations";

const DEFAULT_IMAGES_URLS_BACKENDS: BlobDestinationId[] = ["provider-files", "tailscale", "cloudflared", "litterbox"];
const EMPTY_IMAGES_URLS_OPTIONS: Partial<Record<BlobDestinationId, Record<string, unknown>>> = {};
const EMPTY_IMAGES_URLS_CREDENTIALS: Partial<Record<BlobDestinationId, Record<string, string>>> = {};

const BUILTIN_BLOB_DESTINATION_METADATA: readonly BlobDestinationMetadata<BlobDestinationId>[] =
	Object.values(BUILTIN_BLOB_DESTINATIONS);

const BLOB_BACKEND_CHOICES = BUILTIN_BLOB_DESTINATION_METADATA.filter(
	destination =>
		destination.id === "provider-files" ||
		(destination.directImage && destination.status !== "incompatible" && destination.status !== "defunct"),
).map(destination => ({
	value: destination.id,
	label: destination.label,
	description: destination.reason ?? destination.family,
}));

export const cfgImagesUrlsEnabled = register({
	id: "images.urls.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "model",
		group: "视觉",
		label: "以 URL 提供图像",
		description:
			"通过已配置的后端链发布外发图像，并向支持 URL 抓取的服务商发送短链接而非内联 base64。当所有后端或服务商抓取失败时自动回退到内联。",
	},
});

export const cfgImagesUrlsBackends = register({
	id: "images.urls.backends",
	type: "array",
	default: DEFAULT_IMAGES_URLS_BACKENDS,
	ui: {
		tab: "model",
		group: "视觉",
		label: "图像 URL 后端",
		description: "为服务商访问发布图像时按顺序尝试的目标",
		options: BLOB_BACKEND_CHOICES,
		ordered: true,
	},
});

export const cfgImagesUrlsOptions = register({
	id: "images.urls.options",
	type: "record",
	default: EMPTY_IMAGES_URLS_OPTIONS,
});

export const cfgImagesUrlsCredentials = register({
	id: "images.urls.credentials",
	type: "record",
	default: EMPTY_IMAGES_URLS_CREDENTIALS,
	credential: true,
});

export const cfgImagesUrlsCommand = register({
	id: "images.urls.command",
	type: "string",
	default: undefined,
	ui: {
		tab: "model",
		group: "视觉",
		label: "图像上传命令",
		description:
			"命令后端的 argv 模板；{file} 是图像路径，{mime}/{ext} 可选。使用 stdout 上打印的最后一个 URL（例如 pasta -b -f {file}）",
	},
});

export const cfgImagesUrlsPublicBaseUrl = register({
	id: "images.urls.publicBaseUrl",
	type: "string",
	default: undefined,
	ui: {
		tab: "model",
		group: "视觉",
		label: "图像 URL 公共前缀",
		description: "面向 blob 服务器的外部可访问基础 URL（ssh 必需，direct 可选）",
	},
});

export const cfgImagesUrlsTtlHours = register({
	id: "images.urls.ttlHours",
	type: "number",
	default: 72,
	ui: {
		tab: "model",
		group: "视觉",
		label: "图像 URL 有效期（小时）",
		description:
			"本地托管图像 URL 的服务窗口，从对话最后一次发送它们时开始计算；恢复对话会在同一链接上重新启动该窗口。0 表示代理运行期间链接始终有效",
	},
});

export const cfgImagesUrlsBindHost = register({
	id: "images.urls.bindHost",
	type: "string",
	default: "127.0.0.1",
	ui: {
		tab: "model",
		group: "视觉",
		label: "图像 URL 绑定主机",
		description: "blob 服务器绑定的主机；隧道用回环地址，直接服务用 0.0.0.0",
	},
});

export const cfgImagesUrlsSshTarget = register({
	id: "images.urls.sshTarget",
	type: "string",
	default: undefined,
	ui: {
		tab: "model",
		group: "视觉",
		label: "图像 URL SSH 目标",
		description: "ssh 反向转发的 user@host 目标",
	},
});

export const cfgImagesUrlsSshRemotePort = register({
	id: "images.urls.sshRemotePort",
	type: "number",
	default: 8787,
	ui: {
		tab: "model",
		group: "视觉",
		label: "图像 URL SSH 远程端口",
		description: "ssh 反向转发的远程监听端口（由你的 Web 服务器代理）",
	},
});

/** Every `images.urls.*` setting; the live image URL service rebuilds when any changes. */
export const cfgImagesUrls = combine({
	enabled: cfgImagesUrlsEnabled,
	backends: cfgImagesUrlsBackends,
	options: cfgImagesUrlsOptions,
	credentials: cfgImagesUrlsCredentials,
	command: cfgImagesUrlsCommand,
	publicBaseUrl: cfgImagesUrlsPublicBaseUrl,
	ttlHours: cfgImagesUrlsTtlHours,
	bindHost: cfgImagesUrlsBindHost,
	sshTarget: cfgImagesUrlsSshTarget,
	sshRemotePort: cfgImagesUrlsSshRemotePort,
});
