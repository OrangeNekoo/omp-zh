/**
 * Automatic session-title settings: which generator names a session, how its
 * card icon shows, and whether a todo replan refreshes it.
 */
import { register } from "../config/registry";

/** The `title.icons` styles. */
export const TITLE_ICONS = ["nf+emoji", "emoji", "boring"] as const;
/** How a session title shows its card icon: see {@link cfgTitleIcons}. */
export type TitleIcons = (typeof TITLE_ICONS)[number];

export const cfgTitleIcons = register({
	id: "title.icons",
	type: "enum",
	values: TITLE_ICONS,
	default: "nf+emoji",
	ui: {
		tab: "appearance",
		group: "显示",
		label: "标题图标",
		description: "新生成或 /rename 会话标题前的图标与短代码",
		options: [
			{
				value: "nf+emoji",
				label: "Nerd 字体 + Emoji",
				description: "当 Nerd 字体符号预设能渲染时使用 Nerd 字形，否则用 Emoji（默认）",
			},
			{ value: "emoji", label: "Emoji", description: "始终显示 Emoji" },
			{ value: "boring", label: "朴素", description: "纯标题：无图标或代码" },
		],
	},
});

export const cfgTitleGenerator = register({
	id: "title.generator",
	type: "enum",
	values: ["fork", "tiny"] as const,
	default: "fork",
	ui: {
		tab: "tasks",
		group: "模式",
		label: "标题生成器",
		description: "从用户消息中为未命名会话取名的依据",
		options: [
			{
				value: "fork",
				label: "复刻",
				description:
					"在会话模型上旁路跑一轮回复：可读取其提示词缓存，并加上卡片图标（默认）",
			},
			{ value: "tiny", label: "微型", description: "仅使用标题模型角色；纯标题，无卡片" },
		],
	},
});

export const cfgTitleRefreshOnReplan = register({
	id: "title.refreshOnReplan",
	type: "boolean",
	default: true,
	ui: {
		tab: "tasks",
		group: "模式",
		label: "重新规划时刷新标题",
		description: "待办初始化重新规划后刷新生成的会话标题，除非标题由用户设置",
	},
});
