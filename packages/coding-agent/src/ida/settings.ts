/**
 * Settings declared by this domain (see `config/registry.ts`). Declaration order is the
 * settings-panel order; `config/all-settings.ts` registers every domain.
 */
import { register } from "../config/registry";

/** Whether `read` opens executables in IDA Pro and the `ida` tool is enabled. */
export const cfgIdaEnabled = register({
	id: "ida.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "IDA Pro",
		description:
			"用 `read` 打开的可执行文件在 IDA Pro (idalib) 中读取，并启用 `ida` 工具；未找到 IDA 安装时不生效",
	},
});

/** Python interpreter that can import ida_domain and idapro; blank auto-detects. */
export const cfgIdaPython = register({
	id: "ida.python",
	type: "string",
	default: "",
	ui: {
		tab: "tools",
		group: "IDA Pro",
		label: "IDA Python",
		description: "可导入 ida_domain 与 idapro 的 Python 解释器；留空则自动检测",
	},
});

/** IDA install directory containing libidalib; blank auto-detects. */
export const cfgIdaInstallDir = register({
	id: "ida.installDir",
	type: "string",
	default: "",
	ui: {
		tab: "tools",
		group: "IDA Pro",
		label: "IDA 安装目录",
		description:
			"包含 libidalib 的目录，导出为 IDADIR；留空则自动检测（$IDADIR、ida-config.json、标准安装路径）",
	},
});

/** Most IDA host daemons open at once per project; opening another evicts the least recently used idle one. */
export const cfgIdaMaxOpen = register({
	id: "ida.maxOpen",
	type: "number",
	default: 4,
	ui: {
		tab: "tools",
		group: "IDA Pro",
		label: "IDA 最大打开数据库数",
		description:
			"每个项目同时打开的 IDA 数据库（omp ps 中的 omp.ida.* 守护进程）上限；打开另一个时会保存并关闭最近最少使用的空闲数据库",
		options: [
			{ value: "2", label: "2" },
			{ value: "4", label: "4" },
			{ value: "8", label: "8" },
			{ value: "16", label: "16" },
		],
	},
});

/** Idle seconds after which an IDA database is saved and closed; 0 keeps it open. */
export const cfgIdaIdleCloseSec = register({
	id: "ida.idleCloseSec",
	type: "number",
	default: 900,
	ui: {
		tab: "tools",
		group: "IDA Pro",
		label: "IDA 空闲关闭超时",
		description:
			"保存并关闭空闲超过这么多秒的 IDA 数据库（0 = 从不）；重新打开时 exec 命名空间会重置",
		options: [
			{ value: "0", label: "从不" },
			{ value: "300", label: "5 分钟" },
			{ value: "900", label: "15 分钟" },
			{ value: "1800", label: "30 分钟" },
			{ value: "3600", label: "1 小时" },
		],
	},
});
