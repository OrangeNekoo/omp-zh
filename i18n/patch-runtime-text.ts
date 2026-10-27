#!/usr/bin/env bun
/**
 * 汉化**运行时拼接**的界面文案（词典表达不了的那些）。
 *
 * 词典按英文原文精确匹配，只能覆盖静态字符串。有些文案是代码里按单复数
 * 规则拼出来的，同一个英文串在运行时会产生多种形态，静态条目无法表达：
 *
 *   1. 启动时的「已更新」横幅（`utils/changelog.ts`）：
 *        Updated to v18.13.1 · 174 changes across 2 releases
 *        2 breaking changes · 9 added · 38 changed · 125 fixed · Use /changelog for details.
 *      分类名与数量都是运行时算出的，`changes`/`releases` 还随数量变单复数。
 *   2. MCP 启动状态里的服务器计数（`mcp/startup-events.ts`）：
 *        Connected to MCP 2 servers: …
 *      `1 server` / `2 servers` 由三元表达式切换，中文没有单复数。
 *
 * 这里直接改写这几处函数体：插值保持原样，散文与量词换成中文。
 *
 * 与其它重写器一样，本脚本作用于**当前上游源码**，每次同步重放；幂等——
 * 已改写过的函数体不再匹配英文原文。
 *
 * 用法：
 *   bun i18n/patch-runtime-text.ts            # 应用
 *   bun i18n/patch-runtime-text.ts --dry-run  # 只报告
 */
import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.join(import.meta.dir, "..");
const TARGET = "packages/coding-agent/src/utils/changelog.ts";

/**
 * 分类标签函数：上游按分类决定单复数（`breaking change(s)`），中文只要一个词。
 */
const CATEGORY_LABEL_REPLACEMENT = `function categoryLabel(category: string, _count: number): string {
	// 分类名来自 CHANGELOG.md 的 \`###\` 标题；未列出的自定义分类原样保留。
	return CHANGELOG_CATEGORY_LABELS[category] ?? category;
}
`;

/** 启动横幅的函数体：英文散文换成中文，插值保持原样。 */
const SUMMARY_REPLACEMENT = `/** Format the compact, deterministic startup update notice. */
export function formatStartupChangelogSummary(selection: StartupChangelogSelection): string {
	const latestVersion = selection.latestVersion;
	if (!latestVersion || selection.selectedEntries === 0) {
		return "omp 已更新。使用 /changelog 查看最近的改动。";
	}

	const releaseCount = selection.selectedEntries;
	const changeCount = selection.changeCount;
	const firstLine =
		releaseCount === 1
			? \`已更新到 v\${latestVersion} · \${changeCount} 项改动，共 1 个版本\`
			: \`已更新到 v\${latestVersion} · \${changeCount} 项改动，跨 \${releaseCount} 个版本\`;

	const orderedCategories = [
		...CHANGELOG_CATEGORY_ORDER.filter(category => selection.categoryCounts[category]),
		...Object.keys(selection.categoryCounts)
			.filter(category => !(CHANGELOG_CATEGORY_ORDER as readonly string[]).includes(category))
			.sort(),
	];
	const breakdown = orderedCategories
		.map(
			category =>
				\`\${selection.categoryCounts[category]} 项\${categoryLabel(category, selection.categoryCounts[category])}\`,
		)
		.join(" · ");
	const omittedReleases = selection.totalUnseenEntries - selection.selectedEntries;
	const detailHint =
		omittedReleases > 0
			? \`另有 \${omittedReleases} 个更早版本 · 使用 /changelog full 查看完整历史。\`
			: "使用 /changelog 查看详情。";

	return breakdown ? \`\${firstLine}\\n\${breakdown} · \${detailHint}\` : \`\${firstLine}\\n\${detailHint}\`;
}
`;

/** 分类名映射表，插在分类顺序数组之后。 */
const CATEGORY_TABLE = `/** 分类标题的显示名（中文）。未列出的分类原样显示。 */
const CHANGELOG_CATEGORY_LABELS: Readonly<Record<string, string>> = {
	"Breaking Changes": "破坏性变更",
	Added: "新增",
	Changed: "变更",
	Deprecated: "弃用",
	Removed: "移除",
	Fixed: "修复",
	Security: "安全",
	Other: "其他",
};
`;

const ORIGINAL_CATEGORY_LABEL = /function categoryLabel\(category: string, count: number\): string \{[\s\S]*?\n\}\n/;
const ORIGINAL_SUMMARY = /\/\*\* Format the compact, deterministic startup update notice\. \*\/\nexport function formatStartupChangelogSummary\(selection: StartupChangelogSelection\): string \{[\s\S]*?\n\}\n/;

function main(): void {
	const dryRun = process.argv.includes("--dry-run");
	const file = path.join(ROOT, TARGET);
	const source = fs.readFileSync(file, "utf8");

	if (source.includes("CHANGELOG_CATEGORY_LABELS")) {
		process.stdout.write(`${dryRun ? "[dry-run] " : ""}启动提示已是中文，无需改动。\n`);
		localizeMcpServerCount(dryRun);
		localizeTableHeaders(dryRun);
		return;
	}

	let output = source;
	let changes = 0;

	if (!ORIGINAL_CATEGORY_LABEL.test(output)) {
		throw new Error(`未找到 categoryLabel 的英文实现，上游结构已变：${TARGET}`);
	}
	output = output.replace(ORIGINAL_CATEGORY_LABEL, CATEGORY_LABEL_REPLACEMENT);
	changes++;

	if (!ORIGINAL_SUMMARY.test(output)) {
		throw new Error(`未找到 formatStartupChangelogSummary 的英文实现，上游结构已变：${TARGET}`);
	}
	output = output.replace(ORIGINAL_SUMMARY, SUMMARY_REPLACEMENT);
	changes++;

	// 映射表插在分类顺序数组之后，供 categoryLabel 使用。
	const orderAnchor = "const CHANGELOG_CATEGORY_ORDER = [";
	const orderEnd = output.indexOf("] as const;", output.indexOf(orderAnchor));
	if (orderEnd < 0) throw new Error(`未找到 CHANGELOG_CATEGORY_ORDER，上游结构已变：${TARGET}`);
	const insertAt = output.indexOf("\n", orderEnd) + 1;
	output = output.slice(0, insertAt) + `\n${CATEGORY_TABLE}` + output.slice(insertAt);

	if (!dryRun) fs.writeFileSync(file, output, "utf8");
	process.stdout.write(`${dryRun ? "[dry-run] " : ""}启动提示汉化：${changes} 处（${TARGET}）\n`);

	localizeMcpServerCount(dryRun);
	localizeTableHeaders(dryRun);
}

/**
 * MCP 启动状态里的服务器计数：`1 server` / `2 servers`。
 *
 * 中文没有单复数，`Connected to MCP 2 servers: …` 的空格位置已经由词典
 * 条目吸收，但计数词本身仍会拼出英文。这里把三元判断换成中文量词。
 */
const MCP_TARGET = "packages/coding-agent/src/mcp/startup-events.ts";
const MCP_SERVER_COUNT_RE =
	/function formatServerCount\(count: number\): string \{\n\treturn count === 1 \? "server" : "servers";\n\}\n/;
const MCP_SERVER_COUNT_REPLACEMENT = `function formatServerCount(_count: number): string {
	// 中文没有单复数，量词固定。
	return "个服务器";
}
`;

function localizeMcpServerCount(dryRun: boolean): void {
	const file = path.join(ROOT, MCP_TARGET);
	const source = fs.readFileSync(file, "utf8");
	if (source.includes('return "个服务器";')) {
		process.stdout.write(`${dryRun ? "[dry-run] " : ""}MCP 状态文案已是中文，无需改动。\n`);
		return;
	}
	if (!MCP_SERVER_COUNT_RE.test(source)) {
		throw new Error(`未找到 formatServerCount 的英文实现，上游结构已变：${MCP_TARGET}`);
	}
	const output = source.replace(MCP_SERVER_COUNT_RE, MCP_SERVER_COUNT_REPLACEMENT);
	if (!dryRun) fs.writeFileSync(file, output, "utf8");
	process.stdout.write(`${dryRun ? "[dry-run] " : ""}MCP 状态文案汉化：1 处（${MCP_TARGET}）\n`);
}

/** 快捷键参考面板的表头。 */
const HOTKEYS_TARGET = "packages/tui/src/hotkeys-markdown.ts";

/**
 * `| Key | Action |` 是 Markdown 表格源码，词典按整串匹配无能为力；
 * `head: "Key"` / `head: "Action"` 又是全局精确键，别处同名的是协议字段
 * （`cleanse/parsers.ts` 的 `"Action"`）与 LSP token 类型，不能全局译。
 * 因此按文件限定改写这三处。
 */
const HOTKEYS_REWRITES: readonly (readonly [RegExp, string])[] = [
	[/"\| Key \| Action \|"/, '"| 键 | 操作 |"'],
	[/\{ id: "keys", head: "Key" \}/, '{ id: "keys", head: "键" }'],
	[/\{ id: "action", head: "Action", grow: 1 \}/, '{ id: "action", head: "操作", grow: 1 }'],
];

/** git 面板的快捷键表格：`head: "Keys"` / `head: "Action"`。 */
const GIT_HELP_TARGET = "packages/tui/src/apps/git/help.ts";
const GIT_HELP_REWRITES: readonly (readonly [RegExp, string])[] = [
	[/\{ id: "keys", head: "Keys" \}/, '{ id: "keys", head: "键" }'],
	[/\{ id: "does", head: "Action", grow: 1 \}/, '{ id: "does", head: "操作", grow: 1 }'],
];

/** 逐文件应用表头改写；全部命中时静默，说明已汉化。 */
function localizeTableHeaders(dryRun: boolean): void {
	const targets: readonly (readonly [string, readonly (readonly [RegExp, string])[]])[] = [
		[HOTKEYS_TARGET, HOTKEYS_REWRITES],
		[GIT_HELP_TARGET, GIT_HELP_REWRITES],
	];
	for (const [target, rewrites] of targets) {
		const file = path.join(ROOT, target);
		const source = fs.readFileSync(file, "utf8");
		let output = source;
		let changes = 0;
		for (const [pattern, replacement] of rewrites) {
			if (!pattern.test(output)) continue;
			output = output.replace(pattern, replacement);
			changes++;
		}
		if (changes === 0) {
			process.stdout.write(`${dryRun ? "[dry-run] " : ""}表头已是中文，无需改动（${target}）。\n`);
			continue;
		}
		if (!dryRun) fs.writeFileSync(file, output, "utf8");
		process.stdout.write(`${dryRun ? "[dry-run] " : ""}表头汉化：${changes} 处（${target}）\n`);
	}
}

if (import.meta.main) main();
