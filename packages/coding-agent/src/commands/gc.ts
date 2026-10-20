/**
 * Run on-disk storage maintenance.
 */

import { Command, Flags } from "@oh-my-pi/pi-utils/cli";
import { gcHelp as commandHelp } from "../cli/command-help";
import { collectGcErrors, type GcCommandArgs, runGcCommand } from "../cli/gc-cli";

export default class Gc extends Command {
	static description = commandHelp.description;
	static flags = {
		apply: Flags.boolean({ description: "应用更改（默认仅试运行）" }),
		json: Flags.boolean({ description: "输出 JSON" }),
		"agent-dir": Flags.string({ description: "要维护的代理目录" }),
		blobs: Flags.boolean({ description: "清扫未被引用的数据块" }),
		archive: Flags.boolean({ description: "归档冷会话" }),
		wal: Flags.boolean({ description: "检查点历史/模型数据库的 WAL 文件" }),
		stale: Flags.boolean({
			description: "清理悬空的会话标记/面包屑，以及旧调试报告与协作副本",
		}),
		compress: Flags.boolean({
			description: "就地使用文件系统压缩存储空闲会话（APFS、NTFS）",
		}),
		"cold-archive-after-days": Flags.integer({ description: "归档前会话的最小存在时长" }),
		"retain-newest-global": Flags.integer({ description: "始终保留这么多个最新会话处于活跃状态" }),
		"retain-newest-per-cwd": Flags.integer({ description: "每个目录始终保留这么多个最新会话处于活跃状态" }),
		"stale-retain-newest": Flags.integer({
			description: "始终保留这么多个最新的调试报告与协作副本",
		}),
		"stale-retain-days": Flags.integer({ description: "清理前调试报告/协作副本的最小保留时长" }),
		"compress-after-days": Flags.integer({ description: "压缩会话前的最小空闲天数" }),
	};

	async run(): Promise<void> {
		const { flags } = await this.parse(Gc);
		const cmd: GcCommandArgs = {
			flags: {
				apply: flags.apply,
				json: flags.json,
				agentDir: flags["agent-dir"],
				blobs: flags.blobs,
				archive: flags.archive,
				wal: flags.wal,
				stale: flags.stale,
				compress: flags.compress,
				coldArchiveAfterDays: flags["cold-archive-after-days"],
				retainNewestGlobal: flags["retain-newest-global"],
				retainNewestPerCwd: flags["retain-newest-per-cwd"],
				staleRetainNewest: flags["stale-retain-newest"],
				staleRetainDays: flags["stale-retain-days"],
				compressAfterDays: flags["compress-after-days"],
			},
		};
		const result = await runGcCommand(cmd);
		const errors = collectGcErrors(result);
		if (errors.length > 0) {
			process.stderr.write(
				`GC completed with ${errors.length} error${errors.length === 1 ? "" : "s"}:\n${errors.map(error => `- ${error}`).join("\n")}\n`,
			);
			process.exitCode = 1;
		}
	}
}
