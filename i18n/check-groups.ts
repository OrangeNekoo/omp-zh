#!/usr/bin/env bun
/**
 * 校验设置面板的分组名是否同源翻译。
 *
 * `TAB_GROUPS` 里的分组名必须与各 `settings.ts` 中 `ui.group` 的值**完全
 * 一致**——设置面板靠 `order.indexOf(def.group)` 排序，任何一边漏翻都会让
 * 那一组掉到末尾、顺序错乱。
 *
 * 单独成文件而不是内联在 CI 里：内联的 TypeScript 会被 YAML 的缩进规则
 * 破坏，且无法本地运行验证。
 *
 * 用法：
 *   bun i18n/check-groups.ts      # 不一致时退出码 1
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { TAB_GROUPS } from "../packages/tui/src/overlays/settings-defs";

const ROOT = path.join(import.meta.dir, "..");

/** 收集所有 `settings.ts`。 */
function collectSettingsFiles(dir: string, out: string[] = []): string[] {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === "node_modules" || entry.name === "test") continue;
			collectSettingsFiles(full, out);
		} else if (entry.name === "settings.ts") {
			out.push(full);
		}
	}
	return out;
}

function main(): void {
	const sourceDir = path.join(ROOT, "packages/coding-agent/src");
	const used = new Set<string>();
	for (const file of collectSettingsFiles(sourceDir)) {
		const source = fs.readFileSync(file, "utf8");
		for (const match of source.matchAll(/group:\s*"([^"]+)"/g)) {
			used.add(match[1]);
		}
	}

	const defined = new Set(Object.values(TAB_GROUPS).flat());
	const missing = [...used].filter(group => !defined.has(group));
	const unused = [...defined].filter(group => !used.has(group));

	if (missing.length > 0) {
		process.stderr.write(`分组名未对齐，设置面板会分组错乱：${JSON.stringify(missing)}\n`);
		process.exit(1);
	}

	process.stdout.write(
		`分组名一致：${used.size} 个引用全部命中 ${defined.size} 个定义` +
			`（${unused.length} 个定义当前无设置使用）。\n`,
	);
}

if (import.meta.main) main();
