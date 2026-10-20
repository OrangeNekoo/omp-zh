#!/usr/bin/env bun
/**
 * 在上游 `.gitignore` 末尾补上本 fork 的忽略项。
 *
 * 同步流程会整体切到上游源码，`.gitignore` 属于上游文件，因此这份补丁
 * 必须像汉化一样可重放——否则每次同步后 `i18n/` 的生成物都会变成未跟踪
 * 文件，提交时容易被误带进去。
 *
 * 幂等：已存在的条目不会重复追加。
 */
import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.join(import.meta.dir, "..");
const GITIGNORE = path.join(ROOT, ".gitignore");

/** 本 fork 的忽略项。 */
const ENTRIES: readonly string[] = [
	"# i18n 生成物（由 bun i18n/extract.ts / translate.ts 本地生成）",
	"i18n/extracted.json",
	"i18n/pending.json",
	"i18n/report.json",
	"# 本地 omp 配置（每台机器不同）",
	"/.omp/config.yml",
];

function main(): void {
	const original = fs.existsSync(GITIGNORE) ? fs.readFileSync(GITIGNORE, "utf8") : "";
	const missing = ENTRIES.filter(entry => !original.split("\n").includes(entry));
	if (missing.length === 0) {
		process.stdout.write(".gitignore 已包含本 fork 的忽略项。\n");
		return;
	}
	const separator = original.endsWith("\n") || original.length === 0 ? "" : "\n";
	const updated = `${original}${separator}\n${missing.join("\n")}\n`;
	fs.writeFileSync(GITIGNORE, updated, "utf8");
	process.stdout.write(`已补充 ${missing.length} 条 .gitignore 规则。\n`);
}

if (import.meta.main) main();
