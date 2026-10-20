/**
 * Show provider usage limits for every authenticated account.
 */

import { Args, Command, Flags } from "@oh-my-pi/pi-utils/cli";
import { usageHelp as commandHelp } from "../cli/command-help";
import { runUsageCommand } from "../cli/usage-cli";

export default class Usage extends Command {
	static description = commandHelp.description;
	static args = {
		action: Args.string({
			description: "可选：要执行的子命令",
			required: false,
			options: ["invalidate", "clients", "accounts", "reset"],
		}),
		target: Args.string({
			description: "用 `reset` 消费已保存的重置：<provider>/<credential id>，格式同 `omp usage reset` 列出",
			required: false,
		}),
	};

	static flags = {
		json: Flags.boolean({ char: "j", description: "以 JSON 输出用量报告", default: false }),
		provider: Flags.string({ char: "p", description: "只显示该服务商 id 的用量（如 anthropic）" }),
		redact: Flags.boolean({
			char: "r",
			description: "隐去账户邮箱/id（保留最短唯一前缀），便于分享截图",
			default: false,
		}),
		history: Flags.boolean({
			description: "显示已记录的用量限额历史（每小时快照），而非实时快照",
			default: false,
		}),
		days: Flags.integer({ char: "d", description: "History window in days (with --history or clients)", default: 7 }),
		extension: Flags.string({
			char: "e",
			description: "获取用量前加载扩展文件（可重复）",
			multiple: true,
		}),
		"no-extensions": Flags.boolean({
			description: "禁用扩展自动发现（显式 -e 路径仍可用）",
		}),
	};

	static examples = [
		"# Detailed per-account usage breakdown across all providers\n  omp usage",
		"# Only Anthropic accounts\n  omp usage --provider anthropic",
		"# Redact account identifiers for screenshots\n  omp usage --redact",
		"# Machine-readable output\n  omp usage --json",
		"# Usage-limit trend over the last 30 days\n  omp usage --history --days 30",
		"# Per-client token burn (which machine/app spent what) over the last 30 days\n  omp usage clients --days 30",
		"# OAuth identity keys for task.agentAccountPools (no tokens)\n  omp usage accounts",
		"# Saved Codex and Claude rate-limit resets per account, with each account's credential id\n  omp usage reset",
		"# Spend one saved reset on a listed account\n  omp usage reset codex/3",
		"# Invalidate cached usage reports for all providers\n  omp usage invalidate",
		"# Invalidate cached usage reports for a specific provider\n  omp usage invalidate --provider anthropic",
	];

	async run(): Promise<void> {
		const { args, flags } = await this.parse(Usage);
		await runUsageCommand({
			action: args.action,
			json: flags.json,
			provider: flags.provider,
			target: args.target,
			redact: flags.redact,
			history: flags.history,
			days: flags.days,
			extensions: flags.extension,
			noExtensions: flags["no-extensions"],
		});
	}
}
