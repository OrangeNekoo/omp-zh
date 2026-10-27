/**
 * Draw a session's entire thread through the production transcript pipeline.
 */

import { postmortem } from "@oh-my-pi/pi-utils";
import { Args, Command, Flags } from "@oh-my-pi/pi-utils/cli";
import { renderHelp as commandHelp } from "../cli/command-help";
import { runRenderCommand } from "../cli/render-cli";
import { CliUsageError } from "../cli/usage-error";

export default class Render extends Command {
	static description = commandHelp.description;
	static args = {
		session: Args.string({ description: "会话文件路径或 id 前缀（默认：当前目录最新的会话）" }),
	};
	static flags = {
		width: Flags.integer({ char: "w", description: "渲染宽度（列，默认：终端宽度）" }),
		height: Flags.integer({ description: "视口高度（行，默认：终端高度）" }),
		timing: Flags.boolean({ char: "t", description: "将各阶段耗时与输出字节数打印到 stderr" }),
		repaint: Flags.integer({
			description: "额外基准测试 N 次整屏清滚动重绘（/tree 导航帧）",
		}),
		plain: Flags.boolean({ description: "从输出中去除 ANSI 样式", default: false }),
		quiet: Flags.boolean({ char: "q", description: "抑制会话记录输出（基准运行）", default: false }),
	};

	static examples = [
		"omp render",
		"omp render 01a0285c --plain",
		"omp render ~/.omp/agent/sessions/--work-pi--/big.jsonl -q -t --repaint 5",
		"omp render -w 200 > thread.ansi",
	];

	async run(): Promise<void> {
		const { args, flags } = await this.parse(Render);
		if (flags.repaint !== undefined && flags.repaint <= 0) {
			throw new CliUsageError("--repaint must be a positive integer");
		}
		const exitCode = await runRenderCommand({
			session: args.session,
			width: flags.width,
			height: flags.height,
			timing: flags.timing,
			repaint: flags.repaint,
			plain: flags.plain,
			quiet: flags.quiet,
		});
		await postmortem.quit(exitCode);
	}
}
