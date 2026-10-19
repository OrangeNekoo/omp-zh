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
		description: "Enable the lsp tool for code intelligence (definitions, references, diagnostics, rename)",
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
			"Start language servers on first use (lsp tool or editing a matching file type) instead of at session startup",
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
			"Start language servers through the per-project daemon broker. Each connection gets its own server. While another omp instance in the project is running, a released server stays warm and the next connection reuses it instead of cold-starting (falls back to private servers when unavailable)",
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
		description: "Suppress post-edit LSP diagnostics already shown for a file; only surface new or changed ones",
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
			"Seconds to wait for a language server's diagnostics, hover and other answers when the agent sets no timeout; late post-edit diagnostics wait at least this long. Raise it for servers that are slow on a cold start. The lsp tool's timeout argument can still raise or lower it per call",
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
