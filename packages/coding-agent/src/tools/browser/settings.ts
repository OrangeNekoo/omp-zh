/**
 * Settings declared by this domain (see `config/registry.ts`). Declaration order is the
 * settings-panel order; `config/all-settings.ts` registers every domain.
 */
import { register } from "../../config/registry";

export const cfgBrowserEnabled = register({
	id: "browser.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "浏览器",
		description: "启用浏览器 eval 前奏以进行脚本化 Chromium 自动化（Puppeteer）",
	},
});

export const cfgBrowserCdpUrl = register({
	id: "browser.cdpUrl",
	type: "string",
	default: undefined,
	ui: {
		tab: "tools",
		group: "Grep 与浏览器",
		label: "浏览器 CDP 地址",
		description:
			"默认附加的 HTTP CDP 发现端点（例如 http://127.0.0.1:9222），替代启动新浏览器。工具调用中显式的 app.cdp_url 或 app.path 优先。",
	},
});

export const cfgBrowserRelay = register({
	id: "browser.relay",
	type: "boolean",
	default: false,
	ui: {
		tab: "tools",
		group: "Grep 与浏览器",
		label: "浏览器中继",
		description:
			"通过 omp 浏览器中继驱动你自己的 Chrome 标签页。先安装一次扩展（`omp browser-relay install`）；浏览器前奏需要时中继服务器会自动启动。此项优先于 Browser CDP URL；可用 PI_BROWSER_RELAY=0 或 PI_BROWSER_RELAY=1 覆盖。",
	},
});

export const cfgBrowserRelayUrl = register({
	id: "browser.relayUrl",
	type: "string",
	default: undefined,
	ui: {
		tab: "tools",
		group: "Grep 与浏览器",
		label: "浏览器中继地址",
		description: "omp 浏览器中继端点（默认 http://127.0.0.1:9224）。",
	},
});

export const cfgBrowserHeadless = register({
	id: "browser.headless",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "Grep 与浏览器",
		label: "无头浏览器",
		description: "以无头模式启动浏览器（关闭则显示浏览器界面）",
	},
});

export const cfgBrowserCmux = register({
	id: "browser.cmux",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "Grep 与浏览器",
		label: "cmux 浏览器",
		description:
			"当 cmux socket 可用时，使用 cmux WKWebView 界面进行浏览器自动化。可用 PI_BROWSER_CMUX=0 或 PI_BROWSER_CMUX=1 覆盖。",
	},
});

export const cfgBrowserTern = register({
	id: "browser.tern",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "Grep 与浏览器",
		label: "Tern 浏览器",
		description:
			"在 Tern 窗格中，以画中画形式在 omp 窗格上打开浏览器标签页（原生网页视图），而非无头 Chromium；当没有 Tern 窗口可承载时回退到 Chromium。显式的 app 选项、中继与 Browser CDP URL 优先；app.tern:false 可让某次打开不参与。可用 PI_BROWSER_TERN=0 或 PI_BROWSER_TERN=1 覆盖。",
	},
});

export const cfgBrowserFreezeOnTurnEnd = register({
	id: "browser.freezeOnTurnEnd",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "Grep 与浏览器",
		label: "回合结束时冻结浏览器标签页",
		description:
			"回合结束时冻结 OMP 拥有的无头浏览器标签页，使动画页面在空闲时不再消耗 CPU/GPU。标签页会在下次使用时自动解冻；在 open 时传 persist:true 可让某个标签页不参与冻结。",
	},
});

export const cfgBrowserIdleCloseSec = register({
	id: "browser.idleCloseSec",
	type: "number",
	default: 1800,
	ui: {
		tab: "tools",
		group: "Grep 与浏览器",
		label: "浏览器空闲关闭超时",
		description:
			"关闭 OMP 拥有的无头浏览器标签页与 Tern 浏览器画中画，当它们空闲超过这么多秒时（0 = 从不；会话销毁仍会回收）。绝不触碰中继/CDP/派生浏览器或其他会话的标签页。",
		options: [
			{ value: "0", label: "从不" },
			{ value: "900", label: "15 分钟" },
			{ value: "1800", label: "30 分钟" },
			{ value: "3600", label: "1 小时" },
		],
	},
});

export const cfgBrowserScreenshotDir = register({
	id: "browser.screenshotDir",
	type: "string",
	default: undefined,
	ui: {
		tab: "tools",
		group: "Grep 与浏览器",
		label: "截图目录",
		description:
			"保存截图的目录。未设置时截图写入临时文件。支持 ~。示例：~/Downloads、~/Desktop、/sdcard/Download（Android）",
	},
});
