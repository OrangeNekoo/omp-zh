/**
 * Log in to a model provider from the terminal.
 */

import { CLI_NAME } from "@oh-my-pi/pi-utils";
import { Args, Command } from "@oh-my-pi/pi-utils/cli";
import { loginHelp as commandHelp } from "../cli/command-help";
import { runLoginCommand } from "../cli/login-cli";

export default class Login extends Command {
	static description = commandHelp.description;
	static args = {
		provider: Args.string({
			description: "OAuth 服务商 id（如 anthropic、openai-codex）；省略则交互选择",
			required: false,
		}),
	};

	static examples = [
		`# Pick a provider interactively\n  ${CLI_NAME} login`,
		`# Log in to a specific provider\n  ${CLI_NAME} login anthropic`,
	];

	async run(): Promise<void> {
		const { args } = await this.parse(Login);
		await runLoginCommand(args.provider);
	}
}
