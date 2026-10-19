import type { CommandMetadata } from "@oh-my-pi/pi-utils/cli";

export const acpHelp = {
	description: "Run omp as an ACP (Agent Client Protocol) server over stdio",
} satisfies CommandMetadata;

export const agentsHelp = { description: "管理内置任务代理" } satisfies CommandMetadata;

export const anonymizeHelp = {
	description:
		"Write a shareable copy of a session and its subagents: turn contents redacted, metadata kept, paths and literals replaced by consistent mock tokens",
} satisfies CommandMetadata;

export const authHelp = {
	description: "Export or import stored provider credentials (API keys and OAuth logins) as JSON",
} satisfies CommandMetadata;

export const authBrokerHelp = {
	description: "管理 omp 认证代理（凭据保险库）",
} satisfies CommandMetadata;

export const authGatewayHelp = {
	description:
		"Run an auth-gateway: an HTTP forward proxy backed by the configured broker, or JSON lines on stdio with your own credentials",
} satisfies CommandMetadata;

export const benchHelp = {
	description:
		"Benchmark models: TTFT/prefill vs decode throughput with p50/p95, across chat, prefill, generation, and prompt-cache workloads, or single-user vs parallel load (--detailed)",
} satisfies CommandMetadata;

export const browserRelayHelp = {
	description: "Run the local CDP relay that lets the browser prelude drive your own Chrome tabs",
} satisfies CommandMetadata;

export const cleanseHelp = {
	description: "用加权并行子代理检测并修复项目诊断问题",
} satisfies CommandMetadata;

export const collabHelp = {
	description:
		"List active local Collab host metadata without URLs; use collab link <instanceId|pid> to retrieve a control link (--view for view-only)",
} satisfies CommandMetadata;

export const clipHelp = {
	description: "Upload a /record recording to live.omp.sh as a public clip and print its URL",
} satisfies CommandMetadata;

export const commitHelp = { description: "生成提交消息并更新变更日志" } satisfies CommandMetadata;

export const completionsHelp = {
	description: "Print a shell completion script (bash, zsh, or fish)",
} satisfies CommandMetadata;

export const completeHelp = { hidden: true } satisfies CommandMetadata;

export const compressHelp = {
	description: "Rewrite a text file into the dense prompt register, reporting what it drops",
} satisfies CommandMetadata;

export const configHelp = { description: "管理配置设置" } satisfies CommandMetadata;

export const dryBalanceHelp = {
	description: "跨随机会话 ID 试运行 OAuth 账户均衡",
} satisfies CommandMetadata;

export const galleryHelp = {
	description: "Preview tool, composer, and status-line renderers in a deterministic visual gallery",
} satisfies CommandMetadata;

export const gcHelp = { description: "运行存储垃圾回收" } satisfies CommandMetadata;
export const ifBenchHelp = {
	description:
		"Benchmark instruction following and working memory: one cached thread of glyph array actions with a moving cat-sound directive",
} satisfies CommandMetadata;
export const gitHelp = {
	description: "Interactive fullscreen git UI: split diff viewer, staging sidebar, and commit composer",
} satisfies CommandMetadata;

export const findHelp = {
	description: "Semantic search: describe a behavior, get the files and line ranges that implement it",
} satisfies CommandMetadata;

export const grepHelp = { description: "Test grep tool" } satisfies CommandMetadata;

export const grievancesHelp = {
	description: "View, clean, or push reported tool issues (auto-QA grievances)",
} satisfies CommandMetadata;

export const loginHelp = {
	description: "Log in to a model provider (terminal counterpart of /login)",
} satisfies CommandMetadata;

export const imagesHelp = {
	description: "检查、诊断、探测并清理图像发布后端",
} satisfies CommandMetadata;

export const installHelp = {
	description: "Install or link an extension package (alias of `plugin install`/`plugin link`)",
} satisfies CommandMetadata;

export const joinHelp = { description: "加入共享协作会话（同 /join）" } satisfies CommandMetadata;

export const modelsHelp = { description: "列出、搜索并刷新可用模型" } satisfies CommandMetadata;

export const pluginHelp = { description: "管理插件（安装、卸载、列出等）" } satisfies CommandMetadata;

export const playHelp = {
	description: "Replay a /record session recording in the terminal (space pauses, q quits)",
} satisfies CommandMetadata;

export const predictHelp = {
	description: "Type a prompt and compare every word-completion engine's ghost text live",
} satisfies CommandMetadata;

export const psHelp = {
	description: "List and control daemon-supervised background processes (logs, stop, kill, restart)",
} satisfies CommandMetadata;

export const readHelp = {
	description: "Show what the read tool will return for a path, URL, or internal URI",
} satisfies CommandMetadata;
export const renderHelp = {
	description: "Draw a session's entire thread through the production transcript pipeline (with repaint timing)",
} satisfies CommandMetadata;

export const sayHelp = {
	description: "Synthesize text with the local TTS engine and play it through the speakers",
} satisfies CommandMetadata;

export const searchHelp = { description: "Test web search providers" } satisfies CommandMetadata;

export const sessionHelp = {
	description: "Hand a session to another machine: pack it, unpack it, or mark the local copy moved",
} satisfies CommandMetadata;

export const shareHelp = {
	description: "Share a saved session via an encrypted link (same as /share)",
} satisfies CommandMetadata;

export const setupHelp = {
	description: "Run onboarding setup or install dependencies for optional features",
} satisfies CommandMetadata;

export const shellHelp = { description: "交互式 Shell 控制台" } satisfies CommandMetadata;

export const skillHelp = {
	description: "Install, search, publish, and manage skills on the Skillshare registry (skills.omp.sh)",
} satisfies CommandMetadata;

export const sshHelp = { description: "管理 SSH 主机配置" } satisfies CommandMetadata;

export const statsHelp = { description: "View usage statistics" } satisfies CommandMetadata;

export const streamHelp = {
	description: "Broadcast local omp session screens and chat to your public live channel",
} satisfies CommandMetadata;

export const tinyModelsHelp = {
	description: "Download tiny local models (session titles, memory, word completion)",
} satisfies CommandMetadata;

export const tokenHelp = { description: "Get the API key or OAuth token for a provider" } satisfies CommandMetadata;

export const toksHelp = {
	description: "Count a file or text with every embedded offline tokenizer (OpenAI, Claude, Qwen, …)",
} satisfies CommandMetadata;

export const ttsrHelp = {
	description: "检查并测试时间旅行流规则 (TTSR)",
} satisfies CommandMetadata;

export const updateHelp = { description: "检查并安装更新" } satisfies CommandMetadata;

export const usageHelp = {
	description: "显示每个已认证账户的服务商用量限制",
} satisfies CommandMetadata;

export const worktreeHelp = {
	description: "Add, list, or clear git worktrees (clone-first when enabled)",
} satisfies CommandMetadata;
