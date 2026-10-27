/** Local model the `tiny-models` CLI downloads when none is named. */
export const DEFAULT_TINY_TITLE_LOCAL_MODEL_KEY = "lfm2.5-230m";

export interface TinyTitleLocalModelSpec {
	key: string;
	/** ONNX export loaded by transformers.js on every platform. */
	repo: string;
	dtype: "q4";
	/** Pre-quantized MLX export loaded by mlx-lm when `PI_TINY_DEVICE=mlx`. */
	mlxRepo: string;
	label: string;
	description: string;
	contextNote: string;
	/** Model family emits hidden reasoning unless the chat template disables it. */
	reasoning?: boolean;
	/** Reason the ONNX backend refuses this model before loading the runtime; the MLX backend ignores it. */
	onnxUnsupportedReason?: string;
}

export const TINY_TITLE_LOCAL_MODELS = [
	{
		key: "lfm2.5-230m",
		repo: "LiquidAI/LFM2.5-230M-ONNX",
		dtype: "q4",
		mlxRepo: "LiquidAI/LFM2.5-230M-MLX-4bit",
		label: "LFM2.5 230M",
		description: "推荐的本地模型；最快的 LFM2.5 选项，缓存约 214 MB。",
		contextNote: "Best balance among the current compact title models.",
	},
	{
		key: "lfm2.5-350m",
		repo: "onnx-community/LFM2.5-350M-ONNX",
		dtype: "q4",
		mlxRepo: "LiquidAI/LFM2.5-350M-MLX-4bit",
		label: "LFM2.5 350M",
		description: "较大的 LFM2.5 选项，缓存约 292 MB；倾向生成简洁标题。",
		contextNote: "Use when compact labels are preferred over descriptive titles.",
	},
	{
		key: "falcon-h1-90m",
		repo: "onnx-community/Falcon-H1-Tiny-90M-Instruct-ONNX",
		dtype: "q4",
		mlxRepo: "mlx-community/Falcon-H1-Tiny-90M-Instruct-4bit",
		label: "Falcon H1 Tiny 90M",
		description: "最小的选项，缓存约 147 MB；在复杂提示词上保真度较低。",
		contextNote: "Use on constrained machines where download size matters most.",
	},
] as const satisfies readonly TinyTitleLocalModelSpec[];

export type TinyTitleLocalModelKey = (typeof TINY_TITLE_LOCAL_MODELS)[number]["key"];

export function isTinyTitleLocalModelKey(value: string): value is TinyTitleLocalModelKey {
	return TINY_TITLE_LOCAL_MODELS.some(model => model.key === value);
}

export function getTinyTitleModelSpec(key: TinyTitleLocalModelKey): (typeof TINY_TITLE_LOCAL_MODELS)[number] {
	const spec = TINY_TITLE_LOCAL_MODELS.find(model => model.key === key);
	if (!spec) throw new Error(`Unknown tiny title model: ${key}`);
	return spec;
}

/** Recommended local model for memory tasks when none is named. */
export const DEFAULT_MEMORY_LOCAL_MODEL_KEY = "lfm2-1.2b";

/**
 * Local models for Mnemopi memory tasks (fact extraction + consolidation).
 * These are larger (1B-1.7B) than the title models: structured extraction and
 * faithful summarization need more capacity than 3-6 word titles. All q4.
 * Ranking/recipe rationale lives in docs/local-models.md.
 */
export const TINY_MEMORY_LOCAL_MODELS = [
	{
		key: "qwen3-1.7b",
		repo: "onnx-community/Qwen3-1.7B-ONNX",
		dtype: "q4",
		mlxRepo: "mlx-community/Qwen3-1.7B-4bit",
		label: "Qwen3 1.7B",
		description:
			"仅 MLX (providers.tinyModelDevice=mlx)：onnxruntime-node 无法运行此 ONNX 导出的 RotaryEmbedding 缓存更新。",
		contextNote: "Blocked on the ONNX backend to avoid the unsupported RotaryEmbedding runtime path.",
		reasoning: true,
		onnxUnsupportedReason:
			"onnxruntime-node does not support Qwen3 RotaryEmbedding cache updates in onnx-community/Qwen3-1.7B-ONNX",
	},
	{
		key: "llama3.2:3b",
		repo: "onnx-community/Llama-3.2-3B-Instruct-ONNX",
		dtype: "q4",
		mlxRepo: "mlx-community/Llama-3.2-3B-Instruct-4bit",
		label: "Llama 3.2 3B",
		description:
			"用于本地记忆/分类器任务的较大 Llama 3.2 选项；以更高的磁盘/内存/延迟为代价换取更高潜在质量。",
		contextNote: "Use when larger model capacity is preferred over faster load times.",
	},
	{
		key: "gemma-3-1b",
		repo: "onnx-community/gemma-3-1b-it-ONNX",
		dtype: "q4",
		mlxRepo: "mlx-community/gemma-3-1b-it-4bit",
		label: "Gemma 3 1B",
		description: "最好的整合/去重；占用更轻，但提取时会混入闲聊内容。",
		contextNote: "Use when consolidation quality and size matter most.",
	},
	{
		key: "qwen2.5-1.5b",
		repo: "onnx-community/Qwen2.5-1.5B-Instruct",
		dtype: "q4",
		mlxRepo: "mlx-community/Qwen2.5-1.5B-Instruct-4bit",
		label: "Qwen2.5 1.5B",
		description: "最好的提取粒度（原子事实）；整合较弱。",
		contextNote: "Use when fine-grained, deduplicatable facts matter more than summaries.",
	},
	{
		key: "lfm2-1.2b",
		repo: "onnx-community/LFM2-1.2B-ONNX",
		dtype: "q4",
		mlxRepo: "mlx-community/LFM2-1.2B-4bit",
		label: "LFM2 1.2B",
		description: "加载最快；综合表现扎实，提取标签略有噪声。",
		contextNote: "Use when local startup cost is the priority.",
	},
] as const satisfies readonly TinyTitleLocalModelSpec[];

export type TinyMemoryLocalModelKey = (typeof TINY_MEMORY_LOCAL_MODELS)[number]["key"];

export function isTinyMemoryLocalModelKey(value: string): value is TinyMemoryLocalModelKey {
	return TINY_MEMORY_LOCAL_MODELS.some(model => model.key === value);
}

export function getTinyMemoryModelSpec(key: TinyMemoryLocalModelKey): (typeof TINY_MEMORY_LOCAL_MODELS)[number] {
	const spec = TINY_MEMORY_LOCAL_MODELS.find(model => model.key === key);
	if (!spec) throw new Error(`Unknown tiny memory model: ${key}`);
	return spec;
}

/** Return whether a memory local model may emit reasoning tokens before answers. */
export function isTinyMemoryReasoningModelKey(key: TinyMemoryLocalModelKey): boolean {
	const spec = getTinyMemoryModelSpec(key);
	return "reasoning" in spec && spec.reasoning === true;
}

/** Any local model key (title or memory), used by the shared inference worker. */
export type TinyLocalModelKey = TinyTitleLocalModelKey | TinyMemoryLocalModelKey;

/** Resolve a local model spec by key across both the title and memory registries. */
export function getTinyLocalModelSpec(key: string): TinyTitleLocalModelSpec | undefined {
	return (
		TINY_TITLE_LOCAL_MODELS.find(model => model.key === key) ??
		TINY_MEMORY_LOCAL_MODELS.find(model => model.key === key)
	);
}

export function isTinyLocalModelKey(value: string): value is TinyLocalModelKey {
	return getTinyLocalModelSpec(value) !== undefined;
}

/** Combined local model registry (title + memory) for the shared tiny-models CLI. */
export const TINY_LOCAL_MODELS = [
	...TINY_TITLE_LOCAL_MODELS,
	...TINY_MEMORY_LOCAL_MODELS,
] as const satisfies readonly TinyTitleLocalModelSpec[];
