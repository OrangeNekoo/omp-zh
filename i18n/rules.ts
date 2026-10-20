/**
 * 汉化范围规则。
 *
 * 只汉化「给人看的界面文案」，绝不汉化：
 * - 系统提示词 / 工具提示词（prompts/**、tools/** 的 description 与 prompt）
 * - 任何作为协议、标识符、枚举值、路径、键名使用的字符串
 *
 * 判定方式是「文件范围 + 语法位置」双重约束：只有落在允许目录、且位于
 * 允许的语法位置上的字符串，才会进入词典匹配。
 */

/** 允许汉化的文件（相对仓库根目录）。 */
export const INCLUDE_FILES: readonly RegExp[] = [
	// ── TUI 渲染层（全部是界面组件） ─────────────────────────────
	/^packages\/tui\/src\/overlays\/.*\.ts$/,
	/^packages\/tui\/src\/status-line\/.*\.ts$/,
	/^packages\/tui\/src\/chrome\/.*\.ts$/,
	/^packages\/tui\/src\/prompt\/(?!data\/).*\.ts$/,
	/^packages\/tui\/src\/chat\/(?!.*prompt).*\.ts$/,
	/^packages\/tui\/src\/components\/.*\.ts$/,
	/^packages\/tui\/src\/apps\/.*\.ts$/,
	/^packages\/tui\/src\/tools\/.*\.ts$/,
	/^packages\/tui\/src\/hotkeys-markdown\.ts$/,
	/^packages\/tui\/src\/keybindings\.ts$/,
	/^packages\/tui\/src\/app-keybindings\.ts$/,
	/^packages\/tui\/src\/key-hint-format\.ts$/,
	// 思考等级选择器：`description` 是面板里显示的说明
	/^packages\/tui\/src\/thinking\.ts$/,
	// 首次使用引导（场景标题、选项、说明）
	/^packages\/tui\/src\/setup\/.*\.ts$/,

	// ── 交互模式（状态提示、对话框、控制器） ────────────────────
	/^packages\/coding-agent\/src\/modes\/.*\.ts$/,

	// ── 斜杠命令的界面描述（不含执行逻辑里的提示词） ────────────
	/^packages\/coding-agent\/src\/slash-commands\/builtin-.*\.ts$/,
	// 非 builtin- 前缀的内置命令（/seance）同样只有界面元数据
	/^packages\/coding-agent\/src\/slash-commands\/seance\.ts$/,
	/^packages\/coding-agent\/src\/slash-commands\/types\.ts$/,

	// ── 设置面板的 UI 元数据（label/description/group） ─────────
	/^packages\/coding-agent\/src\/(?:.*\/)?settings\.ts$/,
	// 设置分组散落在非 settings 命名的模块里（如 context-settings、ttsr-settings）
	/^packages\/coding-agent\/src\/.*-settings\.ts$/,
	/^packages\/coding-agent\/src\/config\/settings-ui\.ts$/,
	// 设置项的枚举选项与显示映射
	/^packages\/coding-agent\/src\/config\/service-tier\.ts$/,
	// 设置面板里出现的第三方服务配置字段（图像上传目的地等）
	/^packages\/coding-agent\/src\/blob-broker\/destinations\.ts$/,
	// 设置里的模型/语音等选项清单
	/^packages\/coding-agent\/src\/tiny\/(?:models|dtype|device)\.ts$/,
	/^packages\/coding-agent\/src\/tts\/models\.ts$/,
	/^packages\/coding-agent\/src\/stt\/models\.ts$/,
	/^packages\/coding-agent\/src\/utils\/title-settings\.ts$/,

	// ── 设置面板结构 ────────────────────────────────────────────
	/^packages\/tui\/src\/overlays\/settings-defs\.ts$/,

	// ── CLI 界面帮助（命令描述，不是模型提示词） ────────────────
	/^packages\/coding-agent\/src\/cli\/command-help\.ts$/,
	/^packages\/coding-agent\/src\/cli\/help-extra\.ts$/,
	/^packages\/coding-agent\/src\/cli-commands\.ts$/,
	// `--help` 里的参数说明与用法错误
	/^packages\/coding-agent\/src\/cli\/launch-help\.ts$/,
	/^packages\/coding-agent\/src\/cli\/args\.ts$/,
	/^packages\/coding-agent\/src\/cli\/flag-tables\.ts$/,
	// 子命令的 description 与示例
	/^packages\/coding-agent\/src\/commands\/.*\.ts$/,
];

/** 永不汉化的路径（优先级高于 INCLUDE_FILES）。 */
export const EXCLUDE_FILES: readonly RegExp[] = [
	/packages\/coding-agent\/src\/prompts\//,
	// 工具实现面向模型：提示词与工具描述一律不译。例外是 `tools/settings.ts`
	// 这类文件——它们的 `ui:` 块只是设置面板的显示元数据。
	/^packages\/coding-agent\/src\/tools\/(?!.*settings\.ts$).*\.ts$/,
	// `session/**` 多数文件面向模型（提示词拼装、上下文管理），一律不译；
	// 例外是与设置面板同源的 `settings.ts` 系列（只含 ui 元数据）。
	/^packages\/coding-agent\/src\/session\/(?!.*settings\.ts$).*\.ts$/,
	/packages\/coding-agent\/src\/system-prompt\.ts$/,
	/packages\/coding-agent\/src\/slash-commands\/helpers\//,
	/packages\/coding-agent\/src\/modes\/rpc\/wire\//,
	/\.test\.ts$/,
	/\.spec\.ts$/,
];

/** 允许作为界面文案的对象的属性名。 */
export const TRANSLATABLE_PROPERTIES: ReadonlySet<string> = new Set([
	"label",
	"labels",
	"description",
	// ACP 客户端看到的命令描述（`available_commands_update`）
	"acpDescription",
	"title",
	"subtitle",
	"placeholder",
	"emptyText",
	"noMatchText",
	"hint",
	"hints",
	"help",
	"helpText",
	"header",
	"footer",
	"note",
	"caption",
	"lead",
	"summary",
	"message",
	"messageText",
	"confirmLabel",
	"cancelLabel",
	"actionLabel",
	"buttonLabel",
	"searchPlaceholder",
	"group",
	"tagline",
	"notice",
	"warning",
	"errorText",
	"emptyMessage",
	// 卡片 / 表格 / 键值行：`head` 是标题，`k` 是键值行的键，`text` 是徽标
	// 与按钮上的文字，`action` 是操作按钮的标签，`word` 是运行状态词。
	"head",
	"k",
	"v",
	"action",
	"word",
	"detail",
	"empty",
	"escape",
	"confirm",
	// `--help` 的示例数组：每个元素是「注释 + 命令」的模板字符串
	"examples",
]);

/**
 * 允许汉化的 UI 构建函数：只在第一个字符串实参上匹配词典。
 * 这些函数专门用于构造给人看的文本/按钮/提示。
 */
export const TRANSLATABLE_CALLS: ReadonlySet<string> = new Set([
	"span",
	"text",
	"md",
	"art",
	"actionButton",
	"actionHint",
	"pickerAction",
	"pickerItem",
	"nodeLabel",
	"sectionHeader",
	"heading",
	"notice",
	"banner",
	"tooltip",
	// 交互模式的状态栏 / 警告 / 错误 / 对话框标题，以及斜杠命令的输出。
	// 这些都是直接显示给用户的文本，不进入模型上下文。
	"showStatus",
	"showWarning",
	"showError",
	"showSuccess",
	"showInfo",
	"showReport",
	"showMarkdownPanel",
	"showHookConfirm",
	"showHookEditor",
	"showHookSelector",
	"output",
	"usage",
	"noteText",
	"errorView",
	"formatEmptyMessage",
	"formatErrorMessage",
	"toolHead",
]);

/** `new Text("…")` 这类组件的第一个字符串参数。 */
export const TRANSLATABLE_CONSTRUCTORS: ReadonlySet<string> = new Set(["Text", "Markdown", "TruncatedText"]);

/**
 * 属性值只有在「看起来像给人看的句子」时才翻译。
 *
 * `head`/`k`/`action`/`word`/`empty`/`escape` 这些属性既承载显示文案
 * （`head: "Background jobs"`、`word: "Running"`），也承载协议枚举
 * （`action: "copy"`、`empty: "submit"`、`escape: "cancel"`）。枚举值
 * 一旦被翻译，事件路由就会失效，因此这里要求值至少满足其一：
 * 含空格（多词短语），或以大写字母开头的单词（`Done`、`Apply`）。
 */
export const PROSE_ONLY_PROPERTIES: Readonly<Record<string, true>> = {
	head: true,
	k: true,
	v: true,
	action: true,
	word: true,
	detail: true,
	empty: true,
	escape: true,
	confirm: true,
	text: true,
};

/** 属性值是否具备「句子」形态（多词，或以大写字母开头）。 */
export function looksLikeProseValue(value: string): boolean {
	const text = value.trim();
	if (!/[A-Za-z]{2}/.test(text)) return false;
	return /\s/.test(text) || /^[A-Z][a-z]/.test(text);
}

/**
 * 颜色/样式包装函数里承载展示文案的参数下标。
 *
 * `theme.fg("muted", "No matches")` 与 `chalk.dim("dry run: …")` 的文案是
 * 第二个/第一个实参；`console.log("…")` 同理。这些位置不在属性规则里，
 * 但同样是终端上直接显示的文字。
 */
export function displayTextArgumentIndex(objectName: string | null, calleeName: string): number | undefined {
	if (objectName === "theme" || objectName === "uiTheme") {
		// `theme.fg("dim", "…")` 的文案在第二个实参；`theme.bold("…")` 在第一个。
		if (calleeName === "fg") return 1;
		if (calleeName === "bold") return 0;
		return undefined;
	}
	if (objectName === "chalk") return 0;
	if (objectName === "console") {
		return calleeName === "log" || calleeName === "error" || calleeName === "warn" || calleeName === "info"
			? 0
			: undefined;
	}
	return undefined;
}

/** 不在上述位置、但需要逐文件显式允许整句字面量的规则。 */
export const WHOLE_FILE_LITERALS: readonly RegExp[] = [
	// 提示语是纯界面文案集合
	/^packages\/tui\/src\/prompt\/composer-hints\.ts$/,
	/^packages\/tui\/src\/overlays\/settings-defs\.ts$/,
	/^packages\/coding-agent\/src\/cli\/command-help\.ts$/,
];

/** 判断文件是否在汉化范围内。 */
export function isIncludedFile(relativePath: string): boolean {
	if (EXCLUDE_FILES.some(re => re.test(relativePath))) return false;
	return INCLUDE_FILES.some(re => re.test(relativePath));
}

/** 判断文件是否允许整句字面量替换。 */
export function allowsWholeFileLiterals(relativePath: string): boolean {
	return WHOLE_FILE_LITERALS.some(re => re.test(relativePath));
}
