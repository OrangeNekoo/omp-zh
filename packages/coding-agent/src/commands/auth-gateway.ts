/**
 * `omp auth-gateway` — run a forward proxy that injects auth from the broker.
 */

import { Args, Command, Flags, renderCommandHelp } from "@oh-my-pi/pi-utils/cli";
import {
	AUTH_GATEWAY_ACTIONS,
	type AuthGatewayAction,
	type AuthGatewayCommandArgs,
	runAuthGatewayCommand,
} from "../cli/auth-gateway-cli";
import { authGatewayHelp as commandHelp } from "../cli/command-help";
import { initTheme } from "@oh-my-pi/pi-tui/theme";

export default class AuthGateway extends Command {
	static description = commandHelp.description;
	static args = {
		action: Args.string({
			description: "子命令",
			required: false,
			options: [...AUTH_GATEWAY_ACTIONS],
		}),
	};

	static flags = {
		json: Flags.boolean({ description: "输出 JSON（token/status/check）" }),
		bind: Flags.string({ description: "`serve` 的绑定地址（host:port）", char: "b" }),
		regenerate: Flags.boolean({ description: "重新生成网关 bearer 令牌（token）" }),
		"no-auth": Flags.boolean({
			description:
				"禁用入站 bearer 令牌认证（serve）。绑定到回环地址时有用 — 允许任意调用方。",
		}),
		"trust-proxy-headers": Flags.boolean({
			description: "信任反向代理转发来的对端 IP 头（serve）；默认关闭。",
		}),
		clients: Flags.string({
			description:
				"作用域客户端令牌的 JSON 文件（serve），每个令牌仅限其模型与 broker 账户；服务期间会重新读取",
		}),
		strict: Flags.boolean({
			description:
				"对 `check`：额外用每个凭据探测其服务商的对话补全端点。较慢，每个凭据会消耗少量配额。",
		}),
	};

	static examples = [
		"# Boot the gateway against the configured broker\n  omp auth-gateway serve",
		'# Serve the same routes as JSON lines on stdin/stdout with your own credentials\n  echo \'{"id":1,"path":"/v1/chat/completions","body":{"model":"@smol","messages":[{"role":"user","content":"hi"}]}}\' | omp auth-gateway stdio',
		"# Boot on a non-default port\n  omp auth-gateway serve --bind=127.0.0.1:4000",
		"# Trust client IP headers from a trusted reverse proxy\n  omp auth-gateway serve --trust-proxy-headers",
		"# Print the gateway bearer token (creates one on first run)\n  omp auth-gateway token",
		"# Rotate the gateway bearer token\n  omp auth-gateway token --regenerate",
		"# Run on loopback without any bearer (anyone on this host can call)\n  omp auth-gateway serve --no-auth",
		"# Also admit scoped client tokens listed in a file\n  omp auth-gateway serve --clients=/etc/omp/gateway-clients.json",
		"# Show local gateway + broker config status\n  omp auth-gateway status",
		"# Probe each broker credential to see which one is producing 401s\n  omp auth-gateway check",
		"# Same, machine-readable for scripts\n  omp auth-gateway check --json",
		"# Strict check — also exercises each credential with a real chat-completion ping\n  omp auth-gateway check --strict",
	];

	async run(): Promise<void> {
		const { args, flags } = await this.parse(AuthGateway);
		if (!args.action) {
			renderCommandHelp("omp", "auth-gateway", AuthGateway);
			return;
		}
		const cmd: AuthGatewayCommandArgs = {
			action: args.action as AuthGatewayAction,
			flags: {
				json: flags.json,
				bind: flags.bind,
				regenerate: flags.regenerate,
				noAuth: flags["no-auth"],
				trustProxyHeaders: flags["trust-proxy-headers"],
				strict: flags.strict,
				clients: flags.clients,
			},
		};
		await initTheme();
		await runAuthGatewayCommand(cmd);
	}
}
