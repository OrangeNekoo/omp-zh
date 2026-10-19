/**
 * Settings declared by this domain (see `config/registry.ts`). Declaration order is the
 * settings-panel order; `config/all-settings.ts` registers every domain.
 */
import { register } from "../config/registry";
import {
	DEFAULT_TTS_SPEED,
	DEFAULT_TTS_VOICE,
	TTS_LOCAL_VOICE_OPTIONS,
	TTS_LOCAL_VOICE_VALUES,
	TTS_SPEED_OPTIONS,
} from "./models";

export const cfgTtsLocalVoice = register({
	id: "tts.localVoice",
	type: "enum",
	values: TTS_LOCAL_VOICE_VALUES,
	default: DEFAULT_TTS_VOICE,
	ui: {
		tab: "providers",
		group: "服务",
		label: "本地 TTS 音色",
		description: "Kokoro voice used by the local TTS backend (American/British, female/male)",
		options: TTS_LOCAL_VOICE_OPTIONS,
	},
});

export const cfgTtsLocalSpeed = register({
	id: "tts.localSpeed",
	type: "number",
	default: DEFAULT_TTS_SPEED,
	ui: {
		tab: "providers",
		group: "服务",
		label: "本地 TTS 速度",
		description: "Speaking rate of the local TTS backend (tts tool, omp say). 1 = normal; clamped to 0.5–2.5",
		options: TTS_SPEED_OPTIONS,
	},
});

export const cfgSpeechEnabled = register({
	id: "speech.enabled",
	type: "boolean",
	default: false,
	ui: {
		tab: "providers",
		group: "服务",
		label: "语音朗读",
		description: "Speak the assistant's output aloud through the speakers as it streams",
	},
});

export const cfgSpeechMode = register({
	id: "speech.mode",
	type: "enum",
	values: ["all", "assistant", "yield"] as const,
	default: "assistant",
	ui: {
		tab: "providers",
		group: "服务",
		label: "语音朗读模式",
		description:
			"What to speak: all = assistant messages + thinking; assistant = messages only; yield = only the final message at turn end",
		options: [
			{ value: "all", label: "全部（消息 + 思考）" },
			{ value: "assistant", label: "助手消息" },
			{ value: "yield", label: "仅最终消息" },
		],
	},
});

export const cfgSpeechEnhanced = register({
	id: "speech.enhanced",
	type: "boolean",
	default: false,
	ui: {
		tab: "providers",
		group: "服务",
		label: "增强语音改写",
		description:
			"Rewrite assistant output into natural spoken prose with the tiny/smol model before synthesis (describes code, drops links and markdown). Falls back to mechanical cleanup on failure",
	},
});

export const cfgSpeechVoice = register({
	id: "speech.voice",
	type: "enum",
	values: TTS_LOCAL_VOICE_VALUES,
	default: DEFAULT_TTS_VOICE,
	ui: {
		tab: "providers",
		group: "服务",
		label: "语音朗读音色",
		description: "Kokoro voice used when speaking the assistant's output aloud",
		options: TTS_LOCAL_VOICE_OPTIONS,
	},
});

export const cfgSpeechSpeed = register({
	id: "speech.speed",
	type: "number",
	default: DEFAULT_TTS_SPEED,
	ui: {
		tab: "providers",
		group: "服务",
		label: "语音朗读速度",
		description: "Speaking rate when reading the assistant's output aloud. 1 = normal; clamped to 0.5–2.5",
		options: TTS_SPEED_OPTIONS,
	},
});
