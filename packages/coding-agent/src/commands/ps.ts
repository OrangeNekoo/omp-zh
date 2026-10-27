/**
 * Inspect and control daemon-broker supervised processes from outside the harness.
 */

import { Args, Command, Flags } from "@oh-my-pi/pi-utils/cli";
import { psHelp as commandHelp } from "../cli/command-help";
import { type PsAction, type PsCommandArgs, runPsCommand } from "../cli/ps-cli";

const ACTIONS: PsAction[] = ["list", "info", "logs", "stop", "kill", "restart"];

export default class Ps extends Command {
	static description = commandHelp.description;

	static args = {
		action: Args.string({
			description: "list（默认）、info、logs、stop、kill 或 restart",
			required: false,
			options: ACTIONS,
		}),
		name: Args.string({
			description: "进程名（除 list 外的操作均必填）",
			required: false,
		}),
	};

	static flags = {
		all: Flags.boolean({ char: "a", description: "同时列出其他项目与已退出的全局服务（list）" }),
		json: Flags.boolean({ char: "j", description: "输出机器可读的 JSON" }),
		plain: Flags.boolean({ description: "使用静态列表而非交互式监视器（list）" }),
		dir: Flags.string({ description: "指定另一个项目目录而非当前目录" }),
		global: Flags.string({ description: "指定机器全局服务作用域（如 browser-relay）" }),
		follow: Flags.boolean({ char: "f", description: "持续流式输出新日志（logs）" }),
		head: Flags.boolean({ description: "从头读取而非读取尾部（logs）" }),
		lines: Flags.integer({ char: "n", description: "日志行数，最多 1000（logs）" }),
		grep: Flags.string({ description: "应用于日志行的正则筛选（logs）" }),
		timeout: Flags.integer({ description: "强制终止前的宽限期（秒，stop）" }),
	};

	static examples = [
		"omp ps",
		"omp ps --all",
		"omp ps logs web --follow",
		"omp ps stop web",
		"omp ps kill web",
		"omp ps info relay --global browser-relay",
	];

	async run(): Promise<void> {
		const { args, flags } = await this.parse(Ps);
		const cmd: PsCommandArgs = {
			action: (args.action ?? "list") as PsAction,
			name: args.name,
			flags: {
				all: flags.all ?? false,
				json: flags.json ?? false,
				plain: flags.plain ?? false,
				dir: flags.dir,
				global: flags.global,
				follow: flags.follow ?? false,
				head: flags.head ?? false,
				lines: flags.lines,
				grep: flags.grep,
				timeout: flags.timeout,
			},
		};
		await runPsCommand(cmd);
	}
}
