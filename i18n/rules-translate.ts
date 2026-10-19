/**
 * 规则化翻译：处理数量、时长这类模式化文案。
 *
 * 这些文案不是固定字符串（`3 items`、`5 minutes`），逐条写进词典既冗余
 * 又无法覆盖上游新增的数值。规则只作用于「整条文案恰好是该模式」的情形，
 * 不做子串替换，避免误伤。
 */

interface UnitTranslation {
	readonly singular: string;
	readonly plural?: string;
}

const TIME_UNITS: Readonly<Record<string, UnitTranslation>> = {
	second: { singular: "秒" },
	minute: { singular: "分钟" },
	hour: { singular: "小时" },
	day: { singular: "天" },
	week: { singular: "周" },
	month: { singular: "个月" },
	year: { singular: "年" },
};

const COUNT_UNITS: Readonly<Record<string, UnitTranslation>> = {
	item: { singular: "项" },
	line: { singular: "行" },
	step: { singular: "步" },
	task: { singular: "任务" },
	note: { singular: "条备注" },
	request: { singular: "次请求" },
	token: { singular: "个令牌" },
	agent: { singular: "个代理", plural: "个代理" },
	file: { singular: "个文件", plural: "个文件" },
	message: { singular: "条消息", plural: "条消息" },
	session: { singular: "个会话", plural: "个会话" },
};

const DURATION_RE = /^(\d+)\s+(second|minute|hour|day|week|month|year)s?$/;
const COUNT_RE =
	/^(\d+)\s+(item|line|step|task|note|request|token|agent|file|message|session|operation|reminder|retry|retries)s?$/i;
/** 上下文窗口标签：`100K tokens`、`1M tokens`。 */
const TOKEN_LABEL_RE = /^(\d+(?:\.\d+)?[KM]?)\s+tokens?$/i;
/** 近似令牌数：`~1.25K tokens`、`~250 tokens`。 */
const APPROX_TOKEN_RE = /^~(\d+(?:\.\d+)?[KM]?)\s+tokens?$/i;
/** 存储/大小标签：`1 KB`、`16 MB`、`1 GB`。单位本身是国际通用写法，保持原样。 */
const SIZE_LABEL_RE = /^(\d+(?:\.\d+)?)\s*(KB|MB|GB)$/i;

/** 复数单位补充词表。 */
const EXTRA_COUNT_UNITS: Readonly<Record<string, string>> = {
	operation: "项操作",
	reminder: "次提醒",
	retry: "次重试",
	retries: "次重试",
};

/**
 * 尝试用规则翻译一条文案。
 *
 * @returns 译文；不属于任何已知模式时返回 `undefined`。
 */
export function translateByRule(source: string): string | undefined {
	const duration = DURATION_RE.exec(source);
	if (duration) {
		const amount = duration[1];
		const unit = TIME_UNITS[duration[2]];
		if (unit) return `${amount} ${unit.singular}`;
	}

	const count = COUNT_RE.exec(source);
	if (count) {
		const amount = count[1];
		const unit = COUNT_UNITS[count[2].toLowerCase()];
		if (unit) return `${amount} ${unit.plural ?? unit.singular}`;
		const extra = EXTRA_COUNT_UNITS[count[2].toLowerCase()];
		if (extra) return `${amount} ${extra}`;
	}

	// 上下文窗口标签保留数字与单位，只把 tokens 换成中文
	const tokenLabel = TOKEN_LABEL_RE.exec(source);
	if (tokenLabel) return `${tokenLabel[1]} 令牌`;

	// 近似令牌数：`~2.5K tokens` → `约 2.5K 令牌`
	const approx = APPROX_TOKEN_RE.exec(source);
	if (approx) return `约 ${approx[1]} 令牌`;

	// 大小标签：数字 + 国际通用单位，无需翻译，保持原样
	if (SIZE_LABEL_RE.test(source)) return source;

	return undefined;
}
