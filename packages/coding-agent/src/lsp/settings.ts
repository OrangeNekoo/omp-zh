/**
 * Settings declared by this domain (see `config/registry.ts`). Declaration order is the
 * settings-panel order; `config/all-settings.ts` registers every domain.
 */
import { register } from "../config/registry";

// LSP
export const cfgLspEnabled = register({
	id: "lsp.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "files",
		group: "LSP",
		label: "LSP",
		description: "启用 lsp 工具以提供代码智能（定义、引用、诊断、重命名）",
	},
});

export const cfgLspLazy = register({
	id: "lsp.lazy",
	type: "boolean",
	default: true,
	ui: {
		tab: "files",
		group: "LSP",
		label: "延迟启动 LSP",
		description:
			"在首次使用时启动语言服务器（lsp 工具或编辑匹配的文件类型），而不是在会话启动时",
	},
});

export const cfgLspShared = register({
	id: "lsp.shared",
	type: "boolean",
	default: true,
	ui: {
		tab: "files",
		group: "LSP",
		label: "共享语言服务器",
		description:
			"通过按项目的守护进程代理启动语言服务器。每个连接获得自己的服务器。当项目中还有其他 omp 实例运行时，已释放的服务器保持热备，下一个连接复用它而非冷启动（不可用时回退到私有服务器）",
	},
});

export const cfgLspFormatOnWrite = register({
	id: "lsp.formatOnWrite",
	type: "boolean",
	default: false,
	ui: {
		tab: "files",
		group: "LSP",
		label: "写入时格式化",
		description: "写入后使用 LSP 自动格式化代码文件",
	},
});

export const cfgLspDiagnosticsOnWrite = register({
	id: "lsp.diagnosticsOnWrite",
	type: "boolean",
	default: true,
	ui: {
		tab: "files",
		group: "LSP",
		label: "写入时诊断",
		description: "写入代码文件后返回 LSP 诊断",
	},
});

export const cfgLspDiagnosticsOnEdit = register({
	id: "lsp.diagnosticsOnEdit",
	type: "boolean",
	default: false,
	ui: {
		tab: "files",
		group: "LSP",
		label: "编辑时诊断",
		description: "编辑代码文件后返回 LSP 诊断",
	},
});

export const cfgLspDiagnosticsDeduplicate = register({
	id: "lsp.diagnosticsDeduplicate",
	type: "boolean",
	default: true,
	ui: {
		tab: "files",
		group: "LSP",
		label: "去重诊断",
		description: "抑制某文件已显示过的编辑后 LSP 诊断；仅呈现新增或变化的诊断",
	},
});

export const cfgLspRequestTimeout = register({
	id: "lsp.requestTimeout",
	type: "number",
	default: 10,
	ui: {
		tab: "files",
		group: "LSP",
		label: "请求超时",
		description:
			"当代理未设置超时时，等待语言服务器诊断、悬停及其他响应的秒数；编辑后的延迟诊断至少等待这么久。冷启动较慢的服务器可调高此值。lsp 工具的 timeout 参数仍可按调用升高或降低",
		options: [
			{ value: "10", label: "10 秒", description: "默认" },
			{ value: "20", label: "20 秒" },
			{ value: "30", label: "30 秒" },
			{ value: "60", label: "1 分钟" },
			{ value: "120", label: "2 分钟" },
			{ value: "300", label: "5 分钟" },
		],
	},
});
