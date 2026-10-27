import { Args, Command, Flags } from "@oh-my-pi/pi-utils/cli";
import { ifBenchHelp as commandHelp } from "../cli/command-help";
import { runIfBenchCommand } from "../if-bench";

export default class IfBench extends Command {
	static description = commandHelp.description;
	static args = {
		models: Args.string({
			description: "模型选择器（provider/model 或模糊 id，如 opus）",
			required: true,
			multiple: true,
		}),
	};

	static flags = {
		turns: Flags.integer({ description: "每个模型的最大轮数；第 N 轮发出 N 个动作（默认：24）" }),
		length: Flags.integer({ description: "字符数组长度，偶数，8–26（默认：24）" }),
		"max-tokens": Flags.integer({ description: "每轮最大输出令牌数（默认：32768）" }),
		"nya-max": Flags.integer({ description: "nya{1,N} 中允许的最长喵声（默认：8）" }),
		par: Flags.integer({ description: "并发基准测试的模型数（默认：4）" }),
		json: Flags.boolean({ description: "输出 JSON" }),
	};

	static examples = [
		"# Compare three models on the incremental array machine\n  omp if-bench opus sonnet gpt-5.2",
		"# Go deeper, one model at a time\n  omp if-bench opus --turns 40 --par 1",
		"# Shorter array, tighter cat sound\n  omp if-bench sonnet --length 12 --nya-max 2",
		"# Machine-readable per-turn transcript\n  omp if-bench opus --json",
	];

	async run(): Promise<void> {
		const { args, flags } = await this.parse(IfBench);
		await runIfBenchCommand({
			models: args.models ?? [],
			flags: {
				turns: flags.turns,
				length: flags.length,
				maxTokens: flags["max-tokens"],
				nyaMax: flags["nya-max"],
				par: flags.par,
				json: flags.json,
			},
		});
	}
}
