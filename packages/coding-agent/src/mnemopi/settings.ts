/**
 * Settings declared by this domain (see `config/registry.ts`). Declaration order is the
 * settings-panel order; `config/all-settings.ts` registers every domain.
 */
import { register, type ScopeLike } from "../config/registry";
import { cfgMemoryBackend } from "../memory-backend/settings";

// Mnemopi local SQLite memory backend.
export const cfgMnemopiDbPath = register({
	id: "mnemopi.dbPath",
	type: "string",
	default: undefined,
	ui: {
		tab: "memory",
		group: "Mnemopi",
		label: "Mnemopi 数据库路径",
		description: "Optional SQLite DB path. Defaults to the agent memories directory.",
		condition: "mnemopiActive",
	},
});

export const cfgMnemopiBank = register({
	id: "mnemopi.bank",
	type: "string",
	default: undefined,
	ui: {
		tab: "memory",
		group: "Mnemopi",
		label: "Mnemopi 库",
		description: "Optional shared bank base name. Per-project modes derive project-local banks from it.",
		condition: "mnemopiActive",
	},
});

export const cfgMnemopiScoping = register({
	id: "mnemopi.scoping",
	type: "enum",
	values: ["global", "per-project", "per-project-tagged"] as const,
	default: "per-project",
	ui: {
		tab: "memory",
		group: "Mnemopi",
		label: "Mnemopi 范围",
		description:
			"global = one shared bank; per-project = isolated bank per cwd; per-project-tagged = project-local writes plus global recall visibility",
		options: [
			{
				value: "global",
				label: "全局",
				description: "所有项目共用一个 Mnemopi 库",
			},
			{
				value: "per-project",
				label: "按项目",
				description: "基于 cwd 基名的项目本地 Mnemopi 库",
			},
			{
				value: "per-project-tagged",
				label: "按项目（标记）",
				description: "Write to a project-local bank but merge project + shared recall results",
			},
		],
		condition: "mnemopiActive",
	},
});

/**
 * Whether `retain`/`learn` can take `scope: "global"`: only Mnemopi with a bank every project
 * recalls (`global` or `per-project-tagged` scoping). Tools hide the option everywhere else.
 */
export function isGlobalMemoryScopeAvailable(scope: ScopeLike): boolean {
	return cfgMemoryBackend.get(scope) === "mnemopi" && cfgMnemopiScoping.get(scope) !== "per-project";
}

export const cfgMnemopiEmbeddingVariant = register({
	id: "mnemopi.embeddingVariant",
	type: "enum",
	values: ["en", "multilingual"] as const,
	default: "en",
	ui: {
		tab: "memory",
		group: "Mnemopi",
		label: "嵌入变体",
		description:
			"Local embedding model family. en = stronger English model; multilingual = cross-language model. Changing this rebuilds existing memory embeddings on next start.",
		options: [
			{
				value: "en",
				label: "英语 (bge-base-en-v1.5)",
				description: "BAAI/bge-base-en-v1.5 (768d), English-only",
			},
			{
				value: "multilingual",
				label: "多语言 (multilingual-e5-large)",
				description: "intfloat/multilingual-e5-large (1024d), cross-language recall",
			},
		],
		condition: "mnemopiActive",
	},
});

export const cfgMnemopiAutoRecall = register({
	id: "mnemopi.autoRecall",
	type: "boolean",
	default: true,
	ui: {
		tab: "memory",
		group: "Mnemopi",
		label: "Mnemopi 自动回忆",
		description: "Recall local memories into the first turn of each session",
		condition: "mnemopiActive",
	},
});

export const cfgMnemopiAutoRetain = register({
	id: "mnemopi.autoRetain",
	type: "boolean",
	default: true,
	ui: {
		tab: "memory",
		group: "Mnemopi",
		label: "Mnemopi 自动保留",
		description: "将已完成的对话轮次保留到本地 Mnemopi 记忆",
		condition: "mnemopiActive",
	},
});

export const cfgMnemopiPolyphonicRecall = register({
	id: "mnemopi.polyphonicRecall",
	type: "boolean",
	default: false,
	ui: {
		tab: "memory",
		group: "Mnemopi",
		label: "Mnemopi 多声部回忆",
		description:
			"Fuse recall with graph, fact, vector and temporal voices so linked memories surface without a keyword match",
		condition: "mnemopiActive",
	},
});

export const cfgMnemopiEnhancedRecall = register({
	id: "mnemopi.enhancedRecall",
	type: "boolean",
	default: false,
	ui: {
		tab: "memory",
		group: "Mnemopi",
		label: "Mnemopi 增强回忆",
		description:
			"Cache recall results for repeated and similar queries with identical options; any memory write clears it",
		condition: "mnemopiActive",
	},
});

export const cfgMnemopiProactiveLinking = register({
	id: "mnemopi.proactiveLinking",
	type: "boolean",
	default: false,
	ui: {
		tab: "memory",
		group: "Mnemopi",
		label: "Mnemopi 主动链接",
		description:
			"Ingest new memories into the episodic graph as they are stored, linking them to related entities and memories",
		condition: "mnemopiActive",
	},
});

export const cfgMnemopiNoEmbeddings = register({
	id: "mnemopi.noEmbeddings",
	type: "boolean",
	default: false,
	ui: {
		tab: "memory",
		group: "Mnemopi",
		label: "Mnemopi 禁用嵌入",
		description: "强制使用确定性的纯 FTS 召回而非向量嵌入",
		condition: "mnemopiActive",
	},
});

export const cfgMnemopiEmbeddingModel = register({
	id: "mnemopi.embeddingModel",
	type: "string",
	default: undefined,
	// Without the env term a variant default would silently shadow a user's configured env model.
	env: { name: "MNEMOPI_EMBEDDING_MODEL", fallback: "blank" },
	ui: {
		tab: "memory",
		group: "Mnemopi",
		label: "Mnemopi 嵌入模型",
		description:
			"Advanced: explicit embedding model id that overrides the variant. Leave empty to use mnemopi.embeddingVariant.",
		condition: "mnemopiActive",
	},
});

export const cfgMnemopiEmbeddingApiUrl = register({
	id: "mnemopi.embeddingApiUrl",
	type: "string",
	default: undefined,
	ui: {
		tab: "memory",
		group: "Mnemopi",
		label: "Mnemopi 嵌入 API 地址",
		description: "传给 Mnemopi 的可选 OpenAI 兼容嵌入端点",
		condition: "mnemopiActive",
	},
});

export const cfgMnemopiEmbeddingApiKey = register({
	id: "mnemopi.embeddingApiKey",
	type: "string",
	credential: true,
	default: undefined,
	ui: {
		tab: "memory",
		group: "Mnemopi",
		label: "Mnemopi 嵌入 API 密钥",
		description: "传给 Mnemopi 的可选嵌入 API 密钥",
		condition: "mnemopiActive",
	},
});

export const cfgMnemopiLlmMode = register({
	id: "mnemopi.llmMode",
	type: "enum",
	values: ["none", "smol", "remote"] as const,
	default: "smol",
	ui: {
		tab: "memory",
		group: "Mnemopi",
		label: "Mnemopi LLM 模式",
		description:
			"Use no LLM, the online tiny model (the TINY role from /models, else @smol), or a remote OpenAI-compatible endpoint",
		condition: "mnemopiActive",
		options: [
			{ value: "none", label: "无", description: "禁用 Mnemopi 的 LLM 提取" },
			{
				value: "smol",
				label: "在线（微型）",
				description: "Use the online tiny model (the TINY role from /models, else @smol)",
			},
			{ value: "remote", label: "远程", description: "Use the Mnemopi remote LLM settings below" },
		],
	},
});

export const cfgMnemopiLlmBaseUrl = register({
	id: "mnemopi.llmBaseUrl",
	type: "string",
	default: undefined,
	ui: {
		tab: "memory",
		group: "Mnemopi",
		label: "Mnemopi LLM 基础 URL",
		description: "Mnemopi 远程模式的可选 OpenAI 兼容 LLM 端点",
		condition: "mnemopiActive",
	},
});

export const cfgMnemopiLlmApiKey = register({
	id: "mnemopi.llmApiKey",
	type: "string",
	credential: true,
	default: undefined,
	ui: {
		tab: "memory",
		group: "Mnemopi",
		label: "Mnemopi LLM API 密钥",
		description: "Mnemopi 远程模式的可选 LLM API 密钥",
		condition: "mnemopiActive",
	},
});

export const cfgMnemopiLlmModel = register({
	id: "mnemopi.llmModel",
	type: "string",
	default: undefined,
	ui: {
		tab: "memory",
		group: "Mnemopi",
		label: "Mnemopi LLM 模型",
		description: "Mnemopi 远程模式的可选 LLM 模型名",
		condition: "mnemopiActive",
	},
});

export const cfgMnemopiRetainEveryNTurns = register({ id: "mnemopi.retainEveryNTurns", type: "number", default: 4 });

export const cfgMnemopiRecallLimit = register({ id: "mnemopi.recallLimit", type: "number", default: 8 });

export const cfgMnemopiRecallContextTurns = register({ id: "mnemopi.recallContextTurns", type: "number", default: 3 });

export const cfgMnemopiRecallMaxQueryChars = register({
	id: "mnemopi.recallMaxQueryChars",
	type: "number",
	default: 4000,
});

export const cfgMnemopiInjectionTokenLimit = register({
	id: "mnemopi.injectionTokenLimit",
	type: "number",
	default: 5000,
});

export const cfgMnemopiDebug = register({ id: "mnemopi.debug", type: "boolean", default: false });
