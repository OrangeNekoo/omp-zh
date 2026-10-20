/**
 * Semantic search from the shell: `omp find "<query>" [path]`.
 */

import { Args, Command, Flags } from "@oh-my-pi/pi-utils/cli";
import { findHelp as commandHelp } from "../cli/command-help";
import { runFindCommand } from "../cli/find-cli";

export default class Find extends Command {
	static description = commandHelp.description;
	static args = {
		query: Args.string({ description: "用自然语言描述要找什么", required: false }),
		path: Args.string({ description: "要搜索的目录或 omp:// 文档范围", required: false }),
	};

	static flags = {
		keyword: Flags.string({
			char: "k",
			description: "额外的关键词（可重复，或逗号分隔）",
			multiple: true,
		}),
		hidden: Flags.boolean({ description: "包含点文件与点目录" }),
		json: Flags.boolean({ description: "以 JSON 输出完整结果" }),
		quiet: Flags.boolean({ char: "q", description: "抑制 stderr 上的进度" }),
	};

	async run(): Promise<void> {
		const { args, flags } = await this.parse(Find);
		await runFindCommand({
			query: args.query ?? "",
			path: args.path ?? ".",
			keywords: (flags.keyword ?? []).flatMap(value => value.split(",")),
			hidden: flags.hidden ?? false,
			json: flags.json ?? false,
			quiet: flags.quiet ?? false,
		});
	}
}
