/**
 * Settings declared by this domain (see `config/registry.ts`). Declaration order is the
 * settings-panel order; `config/all-settings.ts` registers every domain.
 */
import { combine, register, type SettingValueOf } from "../config/registry";

/** One bash-interceptor rule: commands matching `pattern` are redirected to `tool`. */
export interface BashInterceptorRule {
	pattern: string;
	flags?: string;
	tool: string;
	message: string;
	allowSubcommands?: string[];
}

const EMPTY_STRING_ARRAY: string[] = [];
export const DEFAULT_BASH_INTERCEPTOR_RULES: BashInterceptorRule[] = [
	{
		pattern: "^\\s*(cat|head|tail|less|more)\\s+",
		tool: "read",
		message: "请使用 `read` 工具代替 cat/head/tail。它提供更好的上下文并处理二进制文件。",
	},
	{
		pattern: "^\\s*(grep|rg|ripgrep|ag|ack)\\s+",
		tool: "grep",
		message: "请使用 `grep` 工具代替 grep/rg。它遵循 .gitignore 并提供结构化输出。",
	},
	{
		pattern: "^\\s*(find|fd|locate)\\s+.*(-name|-iname|-type|--type|-glob)",
		tool: "glob",
		message: "请使用 `glob` 工具代替 find/fd。它遵循 .gitignore，且对 glob 模式更快。",
	},
	{
		pattern: "^\\s*sed\\s+(-i|--in-place)",
		tool: "edit",
		message: "请使用 `edit` 工具代替 sed -i。它提供差异预览与模糊匹配。",
	},
	{
		pattern: "^\\s*perl\\s+.*-[pn]?i",
		tool: "edit",
		message: "请使用 `edit` 工具代替 perl -i。它提供差异预览与模糊匹配。",
	},
	{
		pattern: "^\\s*awk\\s+.*-i\\s+inplace",
		tool: "edit",
		message: "请使用 `edit` 工具代替 awk -i inplace。它提供差异预览与模糊匹配。",
	},
	{
		// `>` must sit outside quoted regions (so `echo "a -> b"` passes) and be
		// followed by a plausible filename — including `$VAR` targets; `>|`
		// (clobber) counts as a redirect; `>&2`/`2>&1` style fd duplication is
		// not matched. Allowed device sinks are consumed while looking for later
		// real file redirects because the write tool cannot replace shell
		// output/discard targets.
		pattern:
			"^\\s*(echo|printf|cat\\s*<<)\\s+(?:(?:[^\"'>]|\"[^\"]*\"|'[^']*')|(?<!\\|)>{1,2}\\|?\\s*(?:\"/dev/(?:null|tty|stdout|stderr)\"|'/dev/(?:null|tty|stdout|stderr)'|/dev/(?:null|tty|stdout|stderr))(?:[\\s;&|]|$))*(?<!\\|)>{1,2}\\|?\\s*(?!(?:\"/dev/(?:null|tty|stdout|stderr)\"|'/dev/(?:null|tty|stdout|stderr)'|/dev/(?:null|tty|stdout|stderr))(?:[\\s;&|]|$))[$\\w./~\"'-]",
		tool: "write",
		message: "请使用 `write` 工具代替 echo/cat 重定向。它处理编码并提供确认。",
	},
	{
		pattern: "^\\s*nohup\\s+|(?<!&)\\&\\s*$",
		tool: "bash",
		message:
			"请使用带 `name` 的 `bash` 代替 nohup 或后台 shell 语法，使服务保持可观测与受管。",
	},
	{
		pattern:
			"^\\s*(?:(?:bun|npm|pnpm|yarn)\\s+(?:run\\s+)?(?:dev|start)(?:\\s|$)|(?:vite|next\\s+dev|nuxt\\s+dev|nodemon|lldb|gdb|tail\\s+-f)(?:\\s|$)|docker\\s+compose\\s+up(?!.*(?:\\s-d(?:\\s|$)|--detach))(?:\\s|$))",
		tool: "bash",
		message: "对服务、监视器和调试器使用带 `name` 的 `bash`；通过 `read proc://<name>` 查看。",
	},
	{
		pattern:
			"^\\s*(?:(?:bun|npm|pnpm|yarn)\\s+(?:run\\s+)?\\S+|cargo\\s+watch|watchexec|pytest|vitest|jest|tsc)(?:.|\\n)*(?:--watch|-w)(?:\\s|$)",
		tool: "bash",
		message: "监视模式请使用带 `name` 的 `bash`，以便其输出、输入与生命周期都处于受管状态。",
	},
];

export const cfgShellPath = register({ id: "shellPath", type: "string", default: undefined });

/** Pi shell command prefix forwarded to legacy extensions; OMP's native shell does not apply it. */
export const cfgLegacyShellCommandPrefix = register({ id: "shellCommandPrefix", type: "string", default: undefined });

export const cfgBashEnabled = register({
	id: "bash.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "shell",
		group: "Bash",
		label: "Bash",
		description: "启用 bash 工具以执行 shell 命令",
	},
});

export const cfgBashAllowCompoundCommands = register({
	id: "bash.allowCompoundCommands",
	type: "boolean",
	default: false,
	ui: {
		tab: "shell",
		group: "Bash",
		label: "允许复合命令",
		description:
			"按命令逐条评估字面量 && 链；未匹配的命令使用正常的 bash 批准策略与模式",
	},
});

export const cfgBashAutoBackgroundEnabled = register({
	id: "bash.autoBackground.enabled",
	protocolDefault: ["rpc"],
	type: "boolean",
	default: true,
	ui: {
		tab: "shell",
		group: "Bash",
		label: "Bash 自动后台",
		description: "自动将长时间运行的 bash 命令转入后台，稍后投递结果",
	},
});

export const cfgBashGitGuard = register({
	id: "bash.gitGuard",
	type: "boolean",
	default: false,
	ui: {
		tab: "shell",
		group: "Bash",
		label: "Git 守卫",
		description:
			"在 bash 工具中拒绝会丢弃或移动共享工作的 git 命令：stash、reset --hard 或重置到其他提交，以及在合并/rebase 冲突之外的 checkout/switch/restore",
	},
});

export const cfgBashPatterns = register({
	id: "bash.patterns",
	type: "array",
	default: [],
	ui: {
		tab: "shell",
		group: "Bash",
		label: "Bash 批准模式",
		description:
			"有序的 bash 命令批准规则。每项包含 match 与 approval 字段；仅支持 '*' 通配符。",
	},
});

// Bash interceptor
export const cfgBashInterceptorEnabled = register({
	id: "bashInterceptor.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "shell",
		group: "Bash",
		label: "Bash 拦截器",
		description: "阻止已有专用工具的 shell 命令",
	},
});

export const cfgBashInterceptorPatterns = register({
	id: "bashInterceptor.patterns",
	type: "array",
	default: DEFAULT_BASH_INTERCEPTOR_RULES,
});

export const cfgBashDirenv = register({
	id: "bash.direnv",
	type: "enum",
	values: ["auto", "off"] as const,
	default: "auto",
	ui: {
		tab: "shell",
		group: "Bash",
		label: "direnv 自动加载",
		description:
			"自动把仓库的 direnv/devenv `.envrc` 加载到 bash 会话，使 devenv 工具与环境变量无需手动 `direnv exec` 即可使用。遵循 direnv 的允许列表：未执行过 `direnv allow` 的 `.envrc` 绝不会被执行",
	},
});

export const cfgBashDirenvLoadTimeoutMs = register({
	id: "bash.direnvLoadTimeoutMs",
	type: "number",
	default: 30_000,
	ui: {
		tab: "shell",
		group: "Bash",
		label: "direnv 加载超时（毫秒）",
		description:
			"首次 `direnv export` 的最长等待时间（冷启动的 devenv shell 可能很慢）；超时后会话将在没有 direnv 环境的情况下运行",
	},
});

// Shell output minimizer
export const cfgShellMinimizerEnabled = register({
	id: "shellMinimizer.enabled",
	type: "boolean",
	default: true,
	ui: {
		tab: "shell",
		group: "Bash",
		label: "Shell 精简器",
		description: "在把冗长的 shell 输出（git、npm、cargo 等）返回给代理前先压缩",
	},
});

export const cfgShellMinimizerSettingsPath = register({
	id: "shellMinimizer.settingsPath",
	type: "string",
	default: undefined,
});

export const cfgShellMinimizerOnly = register({
	id: "shellMinimizer.only",
	type: "array",
	default: EMPTY_STRING_ARRAY,
});

export const cfgShellMinimizerExcept = register({
	id: "shellMinimizer.except",
	type: "array",
	default: EMPTY_STRING_ARRAY,
});

export const cfgShellMinimizerMaxCaptureBytes = register({
	id: "shellMinimizer.maxCaptureBytes",
	type: "number",
	default: 4 * 1024 * 1024,
});

export const cfgShellMinimizerSourceOutlineLevel = register({
	id: "shellMinimizer.sourceOutlineLevel",
	type: "enum",
	values: ["default", "aggressive"] as const,
	default: "default",
	ui: {
		tab: "shell",
		group: "Bash",
		label: "Shell 精简器源码大纲",
		description: "对源文件的 cat/read 使用的源码大纲模式：default 或 aggressive",
	},
});

export const cfgShellMinimizerLegacyFilters = register({
	id: "shellMinimizer.legacyFilters",
	type: "boolean",
	default: undefined,
});

/** Shell output minimizer configuration (`shellMinimizer.*`). */
export const cfgShellMinimizer = combine({
	enabled: cfgShellMinimizerEnabled,
	settingsPath: cfgShellMinimizerSettingsPath,
	only: cfgShellMinimizerOnly,
	except: cfgShellMinimizerExcept,
	maxCaptureBytes: cfgShellMinimizerMaxCaptureBytes,
	sourceOutlineLevel: cfgShellMinimizerSourceOutlineLevel,
	legacyFilters: cfgShellMinimizerLegacyFilters,
});

/** Shell output minimizer configuration ({@link cfgShellMinimizer}). */
export type ShellMinimizerSettings = SettingValueOf<typeof cfgShellMinimizer>;

export const cfgBashAutoBackgroundThresholdMs = register({
	id: "bash.autoBackground.thresholdMs",
	protocolDefault: ["rpc"],
	type: "number",
	default: 60_000,
});
