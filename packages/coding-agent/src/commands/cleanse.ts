import { postmortem } from "@oh-my-pi/pi-utils";
import { Args, Command, Flags } from "@oh-my-pi/pi-utils/cli";
import { runCleanseCommand } from "../cleanse";
import { cleanseHelp as commandHelp } from "../cli/command-help";
import { CliUsageError } from "../cli/usage-error";

export default class Cleanse extends Command {
	static description = commandHelp.description;
	static args = {
		request: Args.string({
			description: '要检测并修复的问题（如 "ts errors"）；由发现代理推导出命令',
			required: false,
		}),
	};
	static flags = {
		agents: Flags.integer({
			char: "n",
			description: "文件互不相交的子代理数量上限",
			default: 32,
		}),
		model: Flags.string({
			char: "m",
			description: "子代理模型选择器",
			default: "@smol",
		}),
		tests: Flags.boolean({
			char: "t",
			description: "同时运行项目已配置的测试套件",
			default: false,
		}),
		all: Flags.boolean({
			char: "a",
			description: "不经交互选择器，运行所有已发现的检查器",
			default: false,
		}),
	};

	static examples = [
		"omp cleanse",
		"omp cleanse --all",
		'omp cleanse "ts errors"',
		"omp cleanse -n 8",
		"omp cleanse -m opus",
		"omp cleanse -t",
		"omp cleanse --agents 12 --model anthropic/claude-opus-4-6",
	];

	async run(): Promise<void> {
		const { args, flags } = await this.parse(Cleanse);
		if (flags.agents <= 0) throw new CliUsageError("--agents must be a positive integer");
		const result = await runCleanseCommand({
			maxAgents: flags.agents,
			model: flags.model,
			includeTests: flags.tests,
			request: args.request,
			all: flags.all,
		});
		await postmortem.quit(result.exitCode);
	}
}
