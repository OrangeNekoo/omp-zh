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
		label: "Title Icons",
		description: "Icon and short code that head new generated or /rename session titles",
		options: [
			{
				value: "nf+emoji",
				label: "Nerd Font + Emoji",
				description: "Nerd Font glyph where the Nerd Font symbol preset renders it, else the emoji (default)",
			},
			{ value: "emoji", label: "Emoji", description: "始终显示 Emoji" },
			{ value: "boring", label: "朴素", description: "Plain title: no icon or code" },
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
		label: "Title Generator",
		description: "What names an untitled session from the user's messages",
		options: [
			{
				value: "fork",
				label: "复刻",
				description:
					"A side turn of the reply on the session's model: reads its prompt cache, adds the card icon (default)",
			},
			{ value: "tiny", label: "微型", description: "The title model role only; plain titles without a card" },
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
		description: "Refresh generated session titles after todo init replans unless the title was set by the user",
	},
});
