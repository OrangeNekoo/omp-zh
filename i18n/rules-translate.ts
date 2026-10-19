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
const COUNT_RE = /^(\d+)\s+(item|line|step|task|note|request|token|agent|file|message|session)s?$/i;
/** 上下文窗口标签：`100K tokens`、`1M tokens`。 */
const TOKEN_LABEL_RE = /^(\d+(?:\.\d+)?[KM]?)\s+tokens?$/i;

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
	}

	// 上下文窗口标签保留数字与单位，只把 tokens 换成中文
	const tokenLabel = TOKEN_LABEL_RE.exec(source);
	if (tokenLabel) return `${tokenLabel[1]} 令牌`;

	return undefined;
}
