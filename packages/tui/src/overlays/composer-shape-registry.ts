import { type ComposerStyle, registerComposerStyle } from "../index";
import type { SubmenuOption } from "./settings-defs";

/** Composer shape id; extensions may register additional values at runtime. */
export type ComposerShape = string;

/** Built-in composer choices and their shared settings/setup copy. */
export const BUILTIN_COMPOSER_SHAPES = [
	{
		value: "band",
		label: "状态带（默认）",
		description: "齐平的柔和状态带位于弧形提示符上方，无外框",
	},
	{
		value: "box",
		label: "圆角框",
		description: "状态栏嵌入顶部边框，紧凑的两行提示符",
	},
	{
		value: "claude",
		label: "Claude Code",
		description: "上下各有一条通栏水平线，状态栏在底部",
	},
	{
		value: "pi",
		label: "Pi",
		description: "带外框的水平分隔线，状态栏在底部",
	},
	{
		value: "borderless",
		label: "无边框",
		description: "简洁的提示符字形，状态栏在底部，无边框",
	},
	{
		value: "rule",
		label: "顶部规则坞",
		description: "单条顶部横线，状态栏停靠在其上及其下方",
	},
	{
		value: "field",
		label: "压缩字段",
		description: "填充的单行输入区，两端带强调色端帽",
	},
	{
		value: "rail",
		label: "强调色边栏",
		description: "填充的单行输入区，由单条强调色边栏固定",
	},
] as const;

/** Built-in composer ids used by tests and non-runtime consumers. */
export const COMPOSER_SHAPE_VALUES = BUILTIN_COMPOSER_SHAPES.map(shape => shape.value);

/** Visual composer style and selector copy registered by an extension. */
export interface ComposerShapeDefinition {
	label: string;
	description?: string;
	style: ComposerStyle;
}

const extensionComposerShapes = new Map<string, SubmenuOption>();

/** Install one extension composer shape into rendering and selector registries. */
export function installExtensionComposerShape(definition: ComposerShapeDefinition): () => void {
	const unregisterStyle = registerComposerStyle(definition.style);
	const id = definition.style.id;
	const option: SubmenuOption = {
		value: id,
		label: definition.label,
		description: definition.description,
	};
	extensionComposerShapes.set(id, option);
	return () => {
		if (extensionComposerShapes.get(id) === option) extensionComposerShapes.delete(id);
		unregisterStyle();
	};
}

/** Available built-in and extension composer choices in selector order. */
export function getComposerShapeOptions(): readonly SubmenuOption[] {
	return [...BUILTIN_COMPOSER_SHAPES, ...extensionComposerShapes.values()];
}
