import { Args, type CommandMetadata, Flags } from "@oh-my-pi/pi-utils/cli";
import { CLI_NAME } from "@oh-my-pi/pi-utils/dirs";
import { formatKeyHint } from "@oh-my-pi/pi-tui/key-hint-format";
import { CLI_THINKING_LEVELS } from "@oh-my-pi/pi-tui/thinking";
import { SERVICE_TIER_OPENAI_VALUES } from "../config/service-tier";

export const launchHelp = {
	description: "AI 编程助手",
	hidden: true,
	args: {
		messages: Args.string({
			description: "要发送的消息（用 @ 前缀引用文件）",
			required: false,
			multiple: true,
		}),
	},
	flags: {
		model: Flags.string({
			description: '要使用的模型（模糊匹配："opus"、"gpt-5.2" 或 "openai/gpt-5.2"）',
		}),
		smol: Flags.string({ description: "用于轻量任务的快速模型（或 PI_SMOL_MODEL 环境变量）" }),
		slow: Flags.string({ description: "用于深度分析的慢速/推理模型（或 PI_SLOW_MODEL 环境变量）" }),
		plan: Flags.string({ description: "用于架构规划的计划模型（或 PI_PLAN_MODEL 环境变量）" }),
		goal: Flags.string({
			description:
				"以目标模式全新启动（仅交互模式；绕过 autoResume；不能同时使用位置提示词、启动计划模式或显式继续）",
		}),
		prewalk: Flags.boolean({
			description:
				"计划待办清单生成后的首次编辑/写入时，从当前模型切换到快速/廉价模型（默认关闭；见 prewalk.enabled）",
		}),
		"no-prewalk": Flags.boolean({
			description: "禁用 prewalk（含 prewalk.auto），即使已设置 prewalk.enabled",
		}),
		"prewalk-into": Flags.string({ description: 'prewalk 的目标模型（默认 "smol" 角色）' }),
		"plan-yolo": Flags.boolean({
			description:
				"启动时强制进入只读计划模式，在模型第一次 resolve 调用时自动批准计划，然后切换到 --plan-yolo-into 实施",
		}),
		"plan-yolo-into": Flags.string({ description: 'plan-yolo 执行的目标模型（默认 "smol" 角色）' }),
		provider: Flags.string({ description: "要使用的服务商（旧版参数；建议改用 --model）" }),
		"api-key": Flags.string({ description: "API 密钥（默认取自环境变量）" }),
		"system-prompt": Flags.string({ description: "系统提示词（默认：编程助手提示词）" }),
		"system-prompt-template": Flags.string({
			description: "Handlebars 系统提示词模板（与 --system-prompt 互斥）",
		}),
		"append-system-prompt": Flags.string({ description: "向系统提示词追加文本或文件内容" }),
		"allow-home": Flags.boolean({ description: "允许在 ~ 下启动，而不自动切换到临时目录" }),
		profile: Flags.string({ description: "使用隔离配置档管理认证、会话、设置与缓存" }),
		alias: Flags.string({ description: "为所选配置档创建 shell 快捷方式并退出" }),
		cwd: Flags.string({ description: "启动目录（覆盖启动时的工作目录）" }),
		mode: Flags.string({
			description: "输出模式：text（默认）、json、rpc 或 rpc-ui",
			options: ["text", "json", "rpc", "acp", "rpc-ui"],
		}),
		config: Flags.string({
			description: "为本次运行加载额外的 config.yml 风格配置层（可重复）",
			multiple: true,
		}),
		"add-dir": Flags.string({
			description: "在工作目录之外添加一个工作区目录（可重复）",
			multiple: true,
		}),
		print: Flags.boolean({ char: "p", description: "非交互模式：处理提示词后退出" }),
		continue: Flags.boolean({ char: "c", description: "继续上一个会话" }),
		resume: Flags.string({ char: "r", description: "继续会话（按 ID 前缀、路径，省略时打开选择器）" }),
		restore: Flags.string({
			description:
				"像 --resume 一样恢复会话，然后继续上一个进程未完成的工作（被打断的回合及其运行中的子代理）",
		}),
		"from-claude": Flags.boolean({ description: "将 Claude Code 会话导入 OMP" }),
		"from-codex": Flags.boolean({ description: "将 Codex 会话导入 OMP" }),
		"session-dir": Flags.string({ description: "会话存储与查找的目录" }),
		"no-session": Flags.boolean({ description: "不保存会话（临时）" }),
		models: Flags.string({ description: `用于 ${formatKeyHint("ctrl+p")} 循环切换的逗号分隔模型模式` }),
		"no-tools": Flags.boolean({ description: "禁用所有内置工具" }),
		"no-lsp": Flags.boolean({ description: "禁用 LSP 工具、格式化与诊断" }),
		"no-pty": Flags.boolean({ description: "禁用基于 PTY 的交互式 bash 执行" }),
		tools: Flags.string({ description: "要启用的工具的逗号分隔列表（默认：全部）" }),
		thinking: Flags.string({
			description: `已设置思考等级：${CLI_THINKING_LEVELS.join(", ")}`,
			options: [...CLI_THINKING_LEVELS],
		}),
		"service-tier": Flags.string({
			description: "本会话的 OpenAI 服务层级（none 表示省略 service_tier）",
			options: [...SERVICE_TIER_OPENAI_VALUES],
		}),
		"hide-thinking": Flags.boolean({
			description: "在 TUI 输出中隐藏思考块（仅显示层面，不禁用模型思考）",
		}),
		advisor: Flags.boolean({
			description: "启用顾问运行时（被动审查每轮并注入备注）",
		}),
		"external-thinking": Flags.boolean({
			description:
				"在禁用受支持的 GPT、Claude 与 Gemini 推理时使用私有暂存区（风险自负：服务商已将此类请求视为滥用）",
		}),
		hook: Flags.string({ description: "加载 hook/扩展文件（可多次使用）", multiple: true }),
		extension: Flags.string({
			char: "e",
			description: "加载扩展文件（可多次使用）",
			multiple: true,
		}),
		"no-extensions": Flags.boolean({
			description: "禁用扩展自动发现（显式 -e 路径仍可用）",
		}),
		"no-skills": Flags.boolean({ description: "禁用技能发现与加载" }),
		skills: Flags.string({ description: "用于筛选技能的逗号分隔 glob 模式（如 git-*,docker）" }),
		"no-rules": Flags.boolean({ description: "禁用规则发现与加载" }),
		export: Flags.string({ description: "将会话文件导出为 HTML 后退出" }),
		"no-title": Flags.boolean({ description: "禁用标题自动生成" }),
		"no-ui": Flags.boolean({
			description: "配合 --mode rpc 或 rpc-ui：无界面运行扩展（rpc-ui 的工具界面仍启用）",
		}),
		"print-thoughts": Flags.boolean({ description: "在 print 模式的文本输出中包含思考块" }),
		"max-time": Flags.string({ description: "在此持续时间后停止会话（如 600、10m、1h）" }),
		"auto-approve": Flags.boolean({
			aliases: ["yolo"],
			description: "自动批准所有工具调用（跳过批准提示）",
		}),
		"approval-mode": Flags.string({
			options: ["always-ask", "always-ask-cached", "write", "yolo"],
			description: "覆盖本次会话的 tools.approvalMode（always-ask|always-ask-cached|write|yolo）",
		}),
	},
	examples: [
		`# 交互模式
  ${CLI_NAME}`,
		`# 带初始提示词的交互模式
  ${CLI_NAME} "List all .ts files in src/"`,
		`# 立即开始处理一个目标
  ${CLI_NAME} --goal "Investigate the importer"`,
		`# 在初始消息中包含文件
  ${CLI_NAME} @prompt.md @image.png "What color is the sky?"`,
		`# 非交互模式（处理后退出）
  ${CLI_NAME} -p "List all .ts files in src/"`,
		`# 继续上一个会话
  ${CLI_NAME} --continue "What did we discuss?"`,
		`# 崩溃后恢复会话（含子代理）
  ${CLI_NAME} --restore ~/.omp/agent/sessions/--path--/session.jsonl`,
		`# 为工作配置档创建 shell 快捷方式
  ${CLI_NAME} --profile work --alias omp-work`,
		`# 使用其他模型（模糊匹配）
  ${CLI_NAME} --model opus "Help me refactor this code"`,
		`# 限制模型循环的范围
  ${CLI_NAME} --models claude-sonnet,claude-haiku,gpt-4o`,
		`# 将会话文件导出为 HTML
  ${CLI_NAME} --export ~/.omp/agent/sessions/--path--/session.jsonl`,
	],
} satisfies CommandMetadata;
