import { Args, Command, Flags } from "@oh-my-pi/pi-utils/cli";
import { runBenchCommand } from "../cli/bench-cli";
import { benchHelp as commandHelp } from "../cli/command-help";
import { SERVICE_TIER_OPENAI_VALUES } from "../config/service-tier";

export default class Bench extends Command {
	static description = commandHelp.description;
	static args = {
		models: Args.string({
			description: "模型选择器（provider/model 或模糊 id，如 opus）",
			required: true,
			multiple: true,
		}),
	};

	static flags = {
		runs: Flags.integer({
			description:
				"Requests per model (default: 10 chat, 5 prefill/generation, 9 mix); with --detailed, per phase (default: 4)",
		}),
		"max-tokens": Flags.integer({
			description: "每次请求的最大输出令牌数（默认：chat 512、prefill 64、generation 2048、cache 64）",
		}),
		prompt: Flags.string({ description: "自定义提示词文本（仅 chat 与 generation 配置档）" }),
		profile: Flags.string({
			description:
				"基准负载（默认 chat）：chat（均衡，测量 TTFT 与 tok/s）、prefill（大体积绕过缓存的输入，测量输入处理）、generation（强制长输出，测量持续解码）、mix（轮换三者）",
			options: ["chat", "prefill", "generation", "mix"],
		}),
		"prefill-bytes": Flags.integer({
			description: "prefill 压力测试的合成输入大小（默认：32768，受上下文窗口限制）",
		}),
		detailed: Flags.boolean({
			description:
				"对每个模型依次运行单用户（1 并发）、并行（--par 并发，含汇总 tok/s 与扩展比）与 prefill 阶段",
		}),
		"service-tier": Flags.string({
			description: "按模型系列应用服务层级（默认：已配置的 `tier.*` 设置；`none` 表示省略）",
			options: SERVICE_TIER_OPENAI_VALUES,
		}),
		json: Flags.boolean({ description: "输出 JSON" }),
		par: Flags.integer({
			description: "Execute runs with N parallel queries/requests (default: 4); --detailed's parallel phase width",
		}),
		cache: Flags.boolean({
			description: "运行独立的冷/热提示词缓存配对（openai-codex-responses 不支持）",
		}),
		"cache-prefix-file": Flags.string({ description: "Stable prompt prefix file for --cache" }),
		"cache-prefix-bytes": Flags.integer({ description: "Stable prefix byte budget for --cache (default: 8192)" }),
		"cache-pairs": Flags.integer({ description: "Cold/warm pairs per model for --cache (default: 1)" }),
		"cache-concurrency": Flags.integer({
			description: "Concurrent cache pairs for --cache; each pair remains sequential (default: 1)",
		}),
	};

	static examples = [
		"# Compare TTFT and tok/s of two models\n  omp bench anthropic/claude-opus-4-5 openai/gpt-5.2",
		"# Fuzzy selectors work\n  omp bench opus sonnet",
		"# Average over 3 runs each\n  omp bench opus gpt-5.2 --runs 3",
		"# Rotate chat, prefill, and generation challenges in one run\n  omp bench opus sonnet --profile mix",
		"# Isolate prompt-ingestion speed with a 64 KiB cache-busted input\n  omp bench opus sonnet --profile prefill --prefill-bytes 65536",
		"# Isolate sustained decode throughput\n  omp bench opus sonnet --profile generation",
		"# Compare single-user vs 8 concurrent users, plus prefill speed\n  omp bench apple --detailed --par 8",
		"# Force priority serving tier\n  omp bench openai-codex/gpt-5.5:low --runs 10 --service-tier priority",
		"# Measure one cold/warm prompt-cache pair\n  omp bench openai/gpt-5.6 --cache --json",
	];

	async run(): Promise<void> {
		const { args, flags } = await this.parse(Bench);
		await runBenchCommand({
			models: args.models ?? [],
			flags: {
				runs: flags.runs,
				maxTokens: flags["max-tokens"],
				prompt: flags.prompt,
				profile: flags.profile,
				prefillBytes: flags["prefill-bytes"],
				detailed: flags.detailed,
				serviceTier: flags["service-tier"],
				json: flags.json,
				par: flags.par,
				cache: flags.cache,
				cachePrefixFile: flags["cache-prefix-file"],
				cachePrefixBytes: flags["cache-prefix-bytes"],
				cachePairs: flags["cache-pairs"],
				cacheConcurrency: flags["cache-concurrency"],
			},
		});
	}
}
