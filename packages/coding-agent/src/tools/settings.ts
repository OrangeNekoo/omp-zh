import { combine, register } from "../config/registry";
import { cfgAutolearnEnabled } from "../autolearn/settings";
import { cfgBashEnabled } from "../exec/settings";
import { cfgCompactionExperimentalContextManagement } from "../session/context-settings";
import { cfgEvalJs, cfgEvalPy } from "../eval/settings";
import { cfgIdaAvailable } from "../ida/install";
import { cfgLspEnabled } from "../lsp/settings";
import { cfgTaskMaxRecursionDepth } from "../task/settings";

const EMPTY_STRING_ARRAY: string[] = [];

export const cfgToolsArtifactSpillThreshold = register({
	id: "tools.artifactSpillThreshold",
	type: "number",
	default: 50,
	ui: {
		tab: "tools",
		group: "输出限制",
		label: "产物溢出阈值（KB）",
		description: "Tool output above this size is saved as an artifact; tail is kept inline",
		options: [
			{ value: "1", label: "1 KB", description: "~250 tokens" },
			{ value: "2.5", label: "2.5 KB", description: "~625 tokens" },
			{ value: "5", label: "5 KB", description: "~1.25K tokens" },
			{ value: "10", label: "10 KB", description: "~2.5K tokens" },
			{ value: "20", label: "20 KB", description: "~5K tokens" },
			{ value: "30", label: "30 KB", description: "~7.5K tokens" },
			{ value: "50", label: "50 KB", description: "Default; ~12.5K tokens" },
			{ value: "75", label: "75 KB", description: "~19K tokens" },
			{ value: "100", label: "100 KB", description: "~25K tokens" },
			{ value: "200", label: "200 KB", description: "~50K tokens" },
			{ value: "500", label: "500 KB", description: "~125K tokens" },
			{ value: "1000", label: "1 MB", description: "~250K tokens" },
		],
	},
});

export const cfgToolsArtifactTailBytes = register({
	id: "tools.artifactTailBytes",
	type: "number",
	default: 20,
	ui: {
		tab: "tools",
		group: "输出限制",
		label: "产物尾部大小（KB）",
		description: "Amount of tail content kept inline when output spills to artifact",
		options: [
			{ value: "1", label: "1 KB", description: "~250 tokens" },
			{ value: "2.5", label: "2.5 KB", description: "~625 tokens" },
			{ value: "5", label: "5 KB", description: "~1.25K tokens" },
			{ value: "10", label: "10 KB", description: "~2.5K tokens" },
			{ value: "20", label: "20 KB", description: "Default; ~5K tokens" },
			{ value: "50", label: "50 KB", description: "~12.5K tokens" },
			{ value: "100", label: "100 KB", description: "~25K tokens" },
			{ value: "200", label: "200 KB", description: "~50K tokens" },
		],
	},
});

export const cfgToolsArtifactHeadBytes = register({
	id: "tools.artifactHeadBytes",
	type: "number",
	default: 20,
	ui: {
		tab: "tools",
		group: "输出限制",
		label: "产物头部大小（KB）",
		description:
			"Amount of head content kept inline alongside the tail when output spills to artifact (middle elision). 0 disables — keep tail only.",
		options: [
			{ value: "0", label: "0 KB", description: "Disabled; tail-only truncation" },
			{ value: "1", label: "1 KB", description: "~250 tokens" },
			{ value: "2.5", label: "2.5 KB", description: "~625 tokens" },
			{ value: "5", label: "5 KB", description: "~1.25K tokens" },
			{ value: "10", label: "10 KB", description: "~2.5K tokens" },
			{ value: "20", label: "20 KB", description: "Default; ~5K tokens" },
			{ value: "50", label: "50 KB", description: "~12.5K tokens" },
			{ value: "100", label: "100 KB", description: "~25K tokens" },
			{ value: "200", label: "200 KB", description: "~50K tokens" },
		],
	},
});

export const cfgToolsOutputMaxColumns = register({
	id: "tools.outputMaxColumns",
	type: "number",
	default: 768,
	ui: {
		tab: "tools",
		group: "输出限制",
		label: "输出列上限",
		description:
			"Per-line byte cap for streaming tool outputs (bash, python, js eval) and `read`. Lines wider than this are ellipsis-truncated; remaining bytes up to the next newline are dropped. 0 disables.",
		options: [
			{ value: "0", label: "关闭", description: "No per-line cap" },
			{ value: "256", label: "256", description: "Tight" },
			{ value: "512", label: "512" },
			{ value: "768", label: "768", description: "默认" },
			{ value: "1024", label: "1024" },
			{ value: "2048", label: "2048" },
			{ value: "4096", label: "4096", description: "Loose" },
		],
	},
});

export const cfgToolsArtifactTailLines = register({
	id: "tools.artifactTailLines",
	type: "number",
	default: 500,
	ui: {
		tab: "tools",
		group: "输出限制",
		label: "产物尾部行数",
		description: "Maximum lines of tail content kept inline when output spills to artifact",
		options: [
			{ value: "50", label: "50 行", description: "~250 tokens" },
			{ value: "100", label: "100 行", description: "~500 tokens" },
			{ value: "250", label: "250 行", description: "~1.25K tokens" },
			{ value: "500", label: "500 行", description: "Default; ~2.5K tokens" },
			{ value: "1000", label: "1000 行", description: "~5K tokens" },
			{ value: "2000", label: "2000 行", description: "~10K tokens" },
			{ value: "5000", label: "5000 行", description: "~25K tokens" },
		],
	},
});

export const cfgToolsArtifactMaxBytes = register({
	id: "tools.artifactMaxBytes",
	type: "number",
	default: 16,
	ui: {
		tab: "tools",
		group: "输出限制",
		label: "产物文件上限（MB）",
		description:
			"Maximum size of the artifact file saved for streaming tool output (bash, python, js eval). Larger output keeps its beginning (up to 3 MB) and its most recent remainder, with a truncation notice between them. 0 = unlimited.",
		options: [
			{ value: "0", label: "无限制", description: "Save the complete output" },
			{ value: "4", label: "4 MB" },
			{ value: "16", label: "16 MB", description: "默认" },
			{ value: "64", label: "64 MB" },
			{ value: "256", label: "256 MB" },
			{ value: "1024", label: "1 GB" },
		],
	},
});

export const cfgReadLineNumbers = register({
	id: "readLineNumbers",
	type: "boolean",
	default: false,
	ui: {
		tab: "files",
		group: "读取",
		label: "行号",
		description: "Prepend line numbers to read tool output by default",
	},
});

export const cfgReadDefaultLimit = register({
	id: "read.defaultLimit",
	type: "number",
	default: 300,
	ui: {
		tab: "files",
		group: "读取",
		label: "默认读取上限",
		description: "Default number of lines returned when agent calls read without a limit",
		options: [
			{ value: "200", label: "200 行" },
			{ value: "300", label: "300 行" },
			{ value: "500", label: "500 行" },
			{ value: "1000", label: "1000 行" },
			{ value: "5000", label: "5000 行" },
		],
	},
});

export const cfgReadRenderMarkdown = register({
	id: "read.renderMarkdown",
	type: "boolean",
	default: false,
	ui: {
		tab: "files",
		group: "读取",
		label: "Markdown 预览",
		description: "Render Markdown read results as formatted terminal Markdown previews instead of raw source",
	},
});

export const cfgReadSummarizeEnabled = register({
	id: "read.summarize.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "files",
		group: "读取摘要",
		label: "读取摘要",
		description: "Return structural code summaries when read is called without an explicit selector",
	},
});

export const cfgReadSummarizeProse = register({
	id: "read.summarize.prose",
	type: "boolean",
	default: false,
	ui: {
		tab: "files",
		group: "读取摘要",
		label: "正文摘要",
		description: "Return structural summaries for Markdown and plain text reads",
	},
});

export const cfgReadSummarizeMinBodyLines = register({
	id: "read.summarize.minBodyLines",
	type: "number",
	default: 4,
	ui: {
		tab: "files",
		group: "读取摘要",
		label: "读取摘要正文行数",
		description: "Minimum multiline body or literal length before read summaries collapse it",
	},
});

export const cfgReadSummarizeMinCommentLines = register({
	id: "read.summarize.minCommentLines",
	type: "number",
	default: 6,
	ui: {
		tab: "files",
		group: "读取摘要",
		label: "读取摘要注释行数",
		description: "Minimum multiline block comment length before read summaries collapse it",
	},
});

export const cfgReadSummarizeMinTotalLines = register({
	id: "read.summarize.minTotalLines",
	type: "number",
	default: 100,
	ui: {
		tab: "files",
		group: "读取摘要",
		label: "读取摘要最小文件长度",
		description: "Files with fewer total lines are read verbatim instead of structurally summarized",
	},
});

export const cfgReadSummarizeUnfoldUntil = register({
	id: "read.summarize.unfoldUntil",
	type: "number",
	default: 50,
	ui: {
		tab: "files",
		group: "读取摘要",
		label: "读取摘要展开目标",
		description:
			"BFS-unfold elidable spans until the summary is at least this many visible lines. 0 keeps only the outermost elisions.",
	},
});

export const cfgReadSummarizeUnfoldLimit = register({
	id: "read.summarize.unfoldLimit",
	type: "number",
	default: 100,
	ui: {
		tab: "files",
		group: "读取摘要",
		label: "读取摘要展开上限",
		description:
			"Hard ceiling on summary size while BFS-unfolding. An unfold whose revealed lines would exceed this is skipped (that span stays folded) and unfolding continues with the remaining spans.",
	},
});

export const cfgReadToolResultPreview = register({
	id: "read.toolResultPreview",
	type: "boolean",
	default: false,
	ui: {
		tab: "files",
		group: "读取",
		label: "内联读取预览",
		description: "Render read tool results inline in the transcript instead of summary rows",
	},
});

// ────────────────────────────────────────────────────────────────────────
// Tools
// ────────────────────────────────────────────────────────────────────────

// Tool approval policies
export const cfgToolsApproval = register({
	id: "tools.approval",
	type: "record",
	default: {},
	ui: {
		tab: "interaction",
		group: "批准",
		label: "Tool Approval Policies",
		description:
			"Per-tool approval policies. Set to 'allow' to auto-approve, 'prompt' to require confirmation, or 'deny' to block. Overrides are honored in every approval mode.",
	},
});

// Default tool approval mode (interaction tab, but governs the tool wrapper).
//   "always-ask" — auto-approves read-tier tools only; prompts for write/exec.
//   "write"      — auto-approves read and write-tier tools; prompts for exec.
//   "yolo"       — auto-approves every tier.
export const cfgToolsApprovalMode = register({
	id: "tools.approvalMode",
	type: "enum",
	values: ["always-ask", "write", "yolo"] as const,
	default: "yolo",
	ui: {
		tab: "interaction",
		group: "批准",
		label: "Tool Approval",
		description:
			"Default approval behavior for tool calls. 'Always ask' auto-approves read-only tools only. 'Write' auto-approves read and workspace-write tools. 'Yolo' auto-approves all tiers; user policy may still prompt or block.",
		options: [
			{
				value: "always-ask",
				label: "总是询问",
				description: "Auto-approve read-only tools; require confirmation for write and exec tools.",
			},
			{
				value: "write",
				label: "写入",
				description:
					"Auto-approve read-only and write tools; require confirmation for exec tools such as bash, eval, browser, and task.",
			},
			{
				value: "yolo",
				label: "Yolo",
				description:
					"Auto-approve read, write, and exec tools. User policy can still require confirmation or block calls.",
			},
		],
	},
});

// Todo tool
// Todo settings deliberately have no `protocolDefault`: protocol embedders need project-level opt-outs
// for reminder/prelude prompt injection.
export const cfgTodoEnabled = register({
	id: "todo.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "待办",
		description: "Enable the todo tool for task tracking",
	},
});

export const cfgTodoReminders = register({
	id: "todo.reminders",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "待办",
		label: "Todo Reminders",
		description: "Remind the agent to complete todos before stopping",
	},
});

export const cfgTodoRemindersMax = register({
	id: "todo.remindersMax",
	type: "number",
	default: 3,
	ui: {
		tab: "tools",
		group: "待办",
		label: "Todo Reminder Limit",
		description: "Maximum number of todo reminders before giving up",
		options: [
			{ value: "1", label: "1 reminder" },
			{ value: "2", label: "2 reminders" },
			{ value: "3", label: "3 reminders" },
			{ value: "5", label: "5 reminders" },
		],
	},
});

export const cfgTodoEager = register({
	id: "todo.eager",
	type: "enum",
	values: ["default", "preferred", "always"] as const,
	default: "default",
	ui: {
		tab: "tools",
		group: "待办",
		label: "自动创建待办",
		description: "How strongly to push automatic todo-list creation after the first message",
		options: [
			{ value: "default", label: "默认", description: "Model decides; no automatic todo list" },
			{
				value: "preferred",
				label: "首选",
				description: "Suggests a todo list on the first message (reminder, not forced)",
			},
			{ value: "always", label: "总是", description: "Forces a comprehensive todo list on the first message" },
		],
	},
});

export const cfgTasksTodoClearDelay = register({
	id: "tasks.todoClearDelay",
	type: "number",
	default: 60,
	ui: {
		tab: "tools",
		group: "待办",
		label: "Todo Auto-Clear Delay",
		description: "Delay before completed or abandoned todos are removed from the todo widget",
		options: [
			{ value: "0", label: "即时" },
			{ value: "60", label: "1 分钟", description: "默认" },
			{ value: "300", label: "5 分钟" },
			{ value: "900", label: "15 分钟" },
			{ value: "1800", label: "30 分钟" },
			{ value: "3600", label: "1 小时" },
			{ value: "-1", label: "从不" },
		],
	},
});

// Grep, glob, and AST tools
export const cfgGlobEnabled = register({
	id: "glob.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "Glob",
		description: "Enable the glob tool for glob-based file lookup",
	},
});

export const cfgGrepEnabled = register({
	id: "grep.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "Grep",
		description: "Enable the grep tool for regex content search",
	},
});

export const cfgGrepContextBefore = register({
	id: "grep.contextBefore",
	type: "number",
	default: 1,
	ui: {
		tab: "tools",
		group: "Grep 与浏览器",
		label: "Grep 前置上下文",
		description: "Lines of context before each grep match",
		options: [
			{ value: "0", label: "0 行" },
			{ value: "1", label: "1 行" },
			{ value: "2", label: "2 行" },
			{ value: "3", label: "3 行" },
			{ value: "5", label: "5 行" },
		],
	},
});

export const cfgGrepContextAfter = register({
	id: "grep.contextAfter",
	type: "number",
	default: 3,
	ui: {
		tab: "tools",
		group: "Grep 与浏览器",
		label: "Grep 后置上下文",
		description: "Lines of context after each grep match",
		options: [
			{ value: "0", label: "0 行" },
			{ value: "1", label: "1 行" },
			{ value: "2", label: "2 行" },
			{ value: "3", label: "3 行" },
			{ value: "5", label: "5 行" },
			{ value: "10", label: "10 行" },
		],
	},
});

export const cfgAstGrepEnabled = register({
	id: "astGrep.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "AST 搜索",
		description: "Enable the ast_grep tool for structural AST search",
	},
});

export const cfgAstEditEnabled = register({
	id: "astEdit.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "AST 编辑",
		description: "Enable the ast_edit tool for structural AST rewrites",
	},
});

export const cfgFindEnabled = register({
	id: "find.enabled",
	type: "enum",
	values: ["auto", "on", "off"] as const,
	default: "auto",
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "查找（语义 grep）",
		description:
			"Enable the find tool: natural-language search for files and line ranges, judged by the judge model role. Auto enables it only when the judge role resolves to a native TypeSafe jev model",
		options: [
			{
				value: "auto",
				label: "自动",
				description: "Enable when the judge role resolves to a native TypeSafe jev model",
			},
			{ value: "on", label: "开启", description: "Always enable, whichever model the judge role resolves to" },
			{ value: "off", label: "关闭", description: "Disable the find tool" },
		],
	},
});

// Optional tools

export const cfgDebugEnabled = register({
	id: "debug.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "调试",
		description: "Enable the debug tool for DAP-based debugging",
	},
});

export const cfgLaunchEnabled = register({
	id: "launch.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "服务",
		description: "Enable named bash services and proc:// supervision for shared long-running project processes",
	},
});

export const cfgSpeechgenEnabled = register({
	id: "speechgen.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "Speech Generation",
		description: "Enable the tts tool for on-device (Kokoro) or xAI Grok Voice speech-file synthesis",
	},
});

export const cfgGenerateImageEnabled = register({
	id: "generate_image.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "生成图像",
		description:
			"Enable the generate_image tool (text-to-image generation and editing). Exposed as an xd:// device when tools.xdev is on.",
	},
});

export const cfgComputerEnabled = register({
	id: "computer.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "计算机",
		description: "Enable the scriptable host-desktop eval prelude (screenshots, input, accessibility)",
	},
});

export const cfgRatchetEnabled = register({
	id: "ratchet.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "棘轮",
		description: "Enable the ratchet eval/hillclimb prelude; /ratchet turns it on for the current session",
	},
});

export const cfgArchiveEnabled = register({
	id: "archive.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "归档",
		description:
			"Enable the read-only archive eval prelude: prompt history, recent projects, past sessions and recaps",
	},
});

export const cfgComputerDisplay = register({
	id: "computer.display",
	type: "string",
	default: "active",
	ui: {
		tab: "tools",
		group: "计算机",
		label: "计算机显示器",
		description: "Active window's display (active), all displays (all), or a native display id",
	},
});

export const cfgComputerMaxWidth = register({
	id: "computer.maxWidth",
	type: "number",
	default: 3840,
	ui: {
		tab: "tools",
		group: "计算机",
		label: "计算机截图宽度",
		description: "Maximum screenshot width in pixels",
	},
});

export const cfgComputerMaxHeight = register({
	id: "computer.maxHeight",
	type: "number",
	default: 2400,
	ui: {
		tab: "tools",
		group: "计算机",
		label: "计算机截图高度",
		description: "Maximum screenshot height in pixels",
	},
});

export const cfgComputerBackgroundFallback = register({
	id: "computer.backgroundFallback",
	type: "enum",
	values: ["takeover", "refuse"] as const,
	default: "takeover",
	ui: {
		tab: "tools",
		group: "计算机",
		label: "计算机后台回退",
		description:
			"What window input does when its background route is unavailable: rerun it in takeover and return focus to your app (macOS; elsewhere plain takeover), or refuse, which also keeps the agent from taking the foreground or opening macOS menus itself",
		options: [
			{
				value: "takeover",
				label: "Takeover",
				description:
					"Briefly bring the target forward for that one call, then return focus to your app (on macOS even if you kept typing)",
			},
			{
				value: "refuse",
				label: "拒绝",
				description:
					"Fail the call; nothing takes over, and the agent's own takeover, raise, activating open, desktop input and macOS menus (context menus, popup and menu buttons; they take your keyboard while open) are refused too",
			},
		],
	},
});

export const cfgImagesQuestionTimeoutMs = register({
	id: "images.questionTimeoutMs",
	type: "number",
	default: 300_000,
	ui: {
		tab: "tools",
		group: "执行",
		label: "图像问答超时",
		description:
			"Per-request timeout for the vision-model call behind read's ?q= image questions, in milliseconds. A stalled provider fails fast with a timeout error instead of blocking until manual abort. Set to 0 to disable the timeout.",
		options: [
			{ value: "0", label: "已禁用" },
			{ value: "60000", label: "1 分钟" },
			{ value: "120000", label: "2 分钟" },
			{ value: "180000", label: "3 分钟" },
			{ value: "300000", label: "5 分钟" },
		],
	},
});

export const cfgCheckpointEnabled = register({
	id: "checkpoint.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "检查点/回退",
		description: "Enable the checkpoint and rewind tools for context checkpointing",
	},
});

// Fetching and browser
export const cfgFetchEnabled = register({
	id: "fetch.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "读取 URL",
		description: "Allow the read tool to fetch and process URLs",
	},
});

export const cfgVaultEnabled = register({
	id: "vault.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "Obsidian 库",
		description:
			"Enable the vault:// internal URL for reading and editing Obsidian vault content via the Obsidian CLI. When disabled, vault:// resolution is refused and the vault:// entry is omitted from the system prompt.",
	},
});

export const cfgGithubEnabled = register({
	id: "github.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "GitHub CLI",
		description:
			"Enable the github tool (op-based dispatch for repository, issue, pull request, diff, search, checkout, push, and Actions watch workflows)",
	},
});

export const cfgGithubCacheEnabled = register({
	id: "github.cache.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "GitHub",
		label: "GitHub 查看缓存",
		description: "Cache rendered issue/PR view output in ~/.omp/cache/github-cache.db so repeated reads are free",
	},
});

export const cfgGithubCacheSoftTtlSec = register({
	id: "github.cache.softTtlSec",
	type: "number",
	default: 300,
	ui: {
		tab: "tools",
		group: "GitHub",
		label: "GitHub 缓存软 TTL",
		description: "Within this window, cached issue/PR view rows are returned directly (seconds; default 5 minutes)",
	},
});

export const cfgGithubCacheHardTtlSec = register({
	id: "github.cache.hardTtlSec",
	type: "number",
	default: 604800,
	ui: {
		tab: "tools",
		group: "GitHub",
		label: "GitHub 缓存硬 TTL",
		description:
			"Past the soft TTL the cached row is returned and refreshed in the background; past the hard TTL it is dropped (seconds; default 7 days)",
	},
});

export const cfgWebSearchEnabled = register({
	id: "web_search.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "网络搜索",
		description: "Enable the web_search tool for live web results",
	},
});

export const cfgSecurityEnabled = register({
	id: "security.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "Security",
		description:
			"Enable OMP-native security scan planning, execution, and the read-only security:// resource namespace",
	},
});

export const cfgAskEnabled = register({
	id: "ask.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "可用工具",
		label: "询问",
		description: "Enable the ask tool for interactive user questions",
	},
});

// Tool execution
export const cfgToolsIntentTracing = register({
	id: "tools.intentTracing",
	type: "boolean",
	default: true,
	env: "PI_INTENT_TRACING",
	ui: {
		tab: "tools",
		group: "执行",
		label: "意图追踪",
		description: "Ask the agent to describe the intent of each tool call before executing it",
	},
});

export const cfgToolsAbortOnFabricatedResult = register({
	id: "tools.abortOnFabricatedResult",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "执行",
		label: "编造工具结果时中止",
		description:
			"With in-band tool calls, stop the model immediately when it starts hallucinating a tool result mid-turn. Disable to let the model finish generating and discard the fabricated continuation instead.",
	},
});

export const cfgToolsSpeculativeExecutionEnabled = register({
	id: "tools.speculativeExecution.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "tools",
		group: "执行",
		label: "实验性推测执行",
		description:
			"Enable the discard-safe first slice: validated local reads through direct read calls and nested eval. Network requests, provider completions, and live filesystem writes are not part of this baseline.",
	},
});

export const cfgToolsSpeculativeExecutionMaxInFlight = register({
	id: "tools.speculativeExecution.maxInFlight",
	type: "number",
	default: 2,
	ui: {
		tab: "tools",
		group: "执行",
		label: "Speculative Execution Concurrency",
		description: "Maximum number of validated local reads allowed to run before normal dispatch.",
		options: [
			{ value: "1", label: "1 operation" },
			{ value: "2", label: "2 operations" },
			{ value: "3", label: "3 operations" },
			{ value: "4", label: "4 operations" },
		],
	},
});

export const cfgToolsMaxTimeout = register({
	id: "tools.maxTimeout",
	type: "number",
	default: 0,
	ui: {
		tab: "tools",
		group: "执行",
		label: "最大工具超时",
		description: "Maximum timeout in seconds the agent can set for any tool (0 = no limit)",
		options: [
			{ value: "0", label: "No limit" },
			{ value: "30", label: "30 秒" },
			{ value: "60", label: "60 秒" },
			{ value: "120", label: "120 秒" },
			{ value: "300", label: "5 分钟" },
			{ value: "600", label: "10 分钟" },
		],
	},
});

// Async jobs. RPC hosts start from the neutral background-job defaults (`protocolDefault`), as do the
// bash/eval auto-background settings.
export const cfgAsyncEnabled = register({
	id: "async.enabled",
	protocolDefault: ["rpc"],
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "执行",
		label: "异步执行",
		description: "Enable async bash commands and background task execution",
	},
});

export const cfgAsyncMaxJobs = register({
	id: "async.maxJobs",
	protocolDefault: ["rpc"],
	type: "number",
	default: 100,
});

export const cfgToolsXdev = register({
	id: "tools.xdev",
	type: "boolean",
	default: true,
	ui: {
		tab: "tools",
		group: "发现与 MCP",
		label: "xd:// Tools",
		description:
			"Mount rarely-used (discoverable) tools under xd:// device URLs driven via read/write instead of shipping their schemas on every request. Sessions whose explicit tool list grants read but omits write mount devices through a device-only write transport (only local:// scratch stays writable besides devices). Disable to expose every enabled tool top-level.",
	},
});

export const cfgToolsXdevDocs = register({
	id: "tools.xdevDocs",
	type: "enum",
	values: ["inline", "builtins", "catalog"] as const,
	default: "catalog",
	ui: {
		tab: "tools",
		group: "发现与 MCP",
		label: "xd:// Prompt Docs",
		description:
			"Choose which mounted-device docs and schemas are inlined in the system prompt. Built-ins keeps core tools inline while MCP and extension tools stay on-demand.",
		options: [
			{ value: "inline", label: "所有设备", description: "Inline docs and schemas for every mounted device." },
			{
				value: "builtins",
				label: "仅内置",
				description: "Inline built-in docs; fetch MCP and extension docs on demand.",
			},
			{ value: "catalog", label: "仅目录", description: "List every device; fetch all docs on demand." },
		],
	},
});

export const cfgToolsXdevInlineDevices = register({
	id: "tools.xdevInlineDevices",
	type: "array",
	default: EMPTY_STRING_ARRAY,
	ui: {
		tab: "tools",
		group: "发现与 MCP",
		label: "xd:// Inline Devices",
		description:
			"When xd:// Prompt Docs is Built-ins Only, inline dynamic devices whose names match these glob patterns (for example mcp__context_mode_*). Catalog Only ignores this setting.",
	},
});

export const cfgDevAutoqa = register({
	id: "dev.autoqa",
	type: "boolean",
	default: true,
	env: "PI_AUTO_QA",
	ui: {
		tab: "tools",
		group: "开发者",
		label: "自动 QA",
		description:
			"Automated tool issue reporting (xd://report_issue). On by default; the first report asks for consent, and denying it disables reporting until re-enabled explicitly",
	},
});

export const cfgDevAutoqaPushEndpoint = register({
	id: "dev.autoqaPush.endpoint",
	type: "string",
	default: "https://qa.omp.sh/v1/grievances" as const,
	ui: {
		tab: "tools",
		group: "开发者",
		label: "自动 QA 推送端点",
		description: "Full URL receiving Auto QA JSON reports (default https://qa.omp.sh/v1/grievances)",
	},
});

export const cfgDevAutoqaPushToken = register({
	id: "dev.autoqaPush.token",
	type: "string",
	default: undefined,
	credential: true,
});

/**
 * User decision on sharing automatic `report_tool_issue` grievances.
 *
 *   - `"unset"`  — never asked; the first `report_tool_issue` invocation
 *                  pops a consent dialog and persists the answer here.
 *   - `"granted"` — record and (when push is configured) ship grievances.
 *   - `"denied"`  — silently no-op every `report_tool_issue` call.
 *
 * Owned by `packages/coding-agent/src/tools/report-tool-issue.ts` via the
 * process-global consent handler registered by `InteractiveMode`.
 *
 * @default "unset"
 */
export const cfgDevAutoqaConsent = register({
	id: "dev.autoqaConsent",
	type: "enum",
	values: ["unset", "granted", "denied"] as const,
	default: "unset" as const,
});

/** Settings read by `resolveBuiltinToolPlan` (`tools/index.ts`); a live session reconciles its built-ins when any changes. */
export const cfgBuiltinToolGates = combine({
	ask: cfgAskEnabled,
	astEdit: cfgAstEditEnabled,
	astGrep: cfgAstGrepEnabled,
	async: cfgAsyncEnabled,
	autolearn: cfgAutolearnEnabled,
	bash: cfgBashEnabled,
	checkpoint: cfgCheckpointEnabled,
	contextManagement: cfgCompactionExperimentalContextManagement,
	debug: cfgDebugEnabled,
	evalJs: cfgEvalJs,
	evalPy: cfgEvalPy,
	find: cfgFindEnabled,
	github: cfgGithubEnabled,
	glob: cfgGlobEnabled,
	grep: cfgGrepEnabled,
	ida: cfgIdaAvailable,
	launch: cfgLaunchEnabled,
	lsp: cfgLspEnabled,
	security: cfgSecurityEnabled,
	taskMaxRecursionDepth: cfgTaskMaxRecursionDepth,
	todo: cfgTodoEnabled,
	webSearch: cfgWebSearchEnabled,
});

/** Settings that add or remove the built-in tools they gate (`AgentSession.reconcileBuiltinTools`). */
export const cfgSessionToolGates = combine({
	builtins: cfgBuiltinToolGates,
	generateImage: cfgGenerateImageEnabled,
	speechgen: cfgSpeechgenEnabled,
	xdev: cfgToolsXdev,
});
