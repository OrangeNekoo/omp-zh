import type { CommandMetadata } from "@oh-my-pi/pi-utils/cli";

export const acpHelp = {
	description: "以 ACP（Agent Client Protocol）服务器形式通过 stdio 运行 omp",
} satisfies CommandMetadata;

export const agentsHelp = { description: "管理内置任务代理" } satisfies CommandMetadata;

export const anonymizeHelp = {
	description:
		"写出会话及其子代理的可分享副本：回合内容脱敏、保留元数据、路径与字面量替换为一致的模拟令牌",
} satisfies CommandMetadata;

export const authHelp = {
	description: "以 JSON 导出或导入已存储的服务商凭据（API 密钥与 OAuth 登录）",
} satisfies CommandMetadata;

export const authBrokerHelp = {
	description: "管理 omp 认证代理（凭据保险库）",
} satisfies CommandMetadata;

export const authGatewayHelp = {
	description:
		"运行认证网关：由已配置的凭据代理支撑的 HTTP 正向代理，或用你自己的凭据在 stdio 上输出 JSON 行",
} satisfies CommandMetadata;

export const benchHelp = {
	description:
		"评测模型：TTFT/预填充 vs 解码吞吐（p50/p95），覆盖聊天、预填充、生成与提示词缓存负载，或单用户 vs 并行负载（--detailed）",
} satisfies CommandMetadata;

export const browserRelayHelp = {
	description: "运行本地 CDP 中继，让浏览器前奏驱动你自己的 Chrome 标签页",
} satisfies CommandMetadata;

export const cleanseHelp = {
	description: "用加权并行子代理检测并修复项目诊断问题",
} satisfies CommandMetadata;

export const collabHelp = {
	description:
		"列出活动的本地协作主机元数据（不含 URL）；用 collab link <instanceId|pid> 获取控制链接（--view 为只读）",
} satisfies CommandMetadata;

export const clipHelp = {
	description: "把 /record 录像作为公开片段上传到 live.omp.sh 并打印其 URL",
} satisfies CommandMetadata;

export const commitHelp = { description: "生成提交消息并更新变更日志" } satisfies CommandMetadata;

export const completionsHelp = {
	description: "输出 shell 补全脚本（bash、zsh 或 fish）",
} satisfies CommandMetadata;

export const completeHelp = { hidden: true } satisfies CommandMetadata;

export const compressHelp = {
	description: "把文本文件重写为密集的提示词语体，并报告丢弃了什么",
} satisfies CommandMetadata;

export const configHelp = { description: "管理配置设置" } satisfies CommandMetadata;

export const dryBalanceHelp = {
	description: "跨随机会话 ID 试运行 OAuth 账户均衡",
} satisfies CommandMetadata;

export const galleryHelp = {
	description: "在确定性的可视化画廊中预览工具、输入框与状态栏渲染器",
} satisfies CommandMetadata;

export const gcHelp = { description: "运行存储垃圾回收" } satisfies CommandMetadata;
export const ifBenchHelp = {
	description:
		"评测指令遵循与工作记忆：一条缓存的线程，用字形数组动作与移动的猫叫声指令",
} satisfies CommandMetadata;
export const gitHelp = {
	description: "交互式全屏 Git 界面：分栏差异查看器、暂存侧边栏与提交编辑器",
} satisfies CommandMetadata;

export const findHelp = {
	description: "语义搜索：描述一个行为，得到实现它的文件与行范围",
} satisfies CommandMetadata;

export const grepHelp = { description: "测试 grep 工具" } satisfies CommandMetadata;

export const grievancesHelp = {
	description: "查看、清理或推送已上报的工具问题（自动 QA 申诉）",
} satisfies CommandMetadata;

export const loginHelp = {
	description: "登录模型服务商（/login 的终端版本）",
} satisfies CommandMetadata;

export const imagesHelp = {
	description: "检查、诊断、探测并清理图像发布后端",
} satisfies CommandMetadata;

export const installHelp = {
	description: "安装或链接扩展包（`plugin install`/`plugin link` 的别名）",
} satisfies CommandMetadata;

export const joinHelp = { description: "加入共享协作会话（同 /join）" } satisfies CommandMetadata;

export const modelsHelp = { description: "列出、搜索并刷新可用模型" } satisfies CommandMetadata;

export const pluginHelp = { description: "管理插件（安装、卸载、列出等）" } satisfies CommandMetadata;

export const playHelp = {
	description: "在终端中回放 /record 会话录像（空格暂停，q 退出）",
} satisfies CommandMetadata;

export const predictHelp = {
	description: "输入提示词，实时对比每个单词补全引擎的幽灵文本",
} satisfies CommandMetadata;

export const psHelp = {
	description: "列出并控制由守护进程监管的后台进程（日志、停止、终止、重启）",
} satisfies CommandMetadata;

export const readHelp = {
	description: "显示 read 工具对某个路径、URL 或内部 URI 会返回什么",
} satisfies CommandMetadata;
export const renderHelp = {
	description: "通过生产环境的会话记录管线绘制一个会话的完整线程（含重绘耗时）",
} satisfies CommandMetadata;

export const sayHelp = {
	description: "用本地 TTS 引擎合成文本并通过扬声器播放",
} satisfies CommandMetadata;

export const searchHelp = { description: "测试网络搜索服务商" } satisfies CommandMetadata;

export const sessionHelp = {
	description: "把会话交给另一台机器：打包、解包，或将本地副本标记为已移走",
} satisfies CommandMetadata;

export const shareHelp = {
	description: "通过加密链接共享已保存的会话（同 /share）",
} satisfies CommandMetadata;

export const setupHelp = {
	description: "运行引导设置，或安装可选功能的依赖",
} satisfies CommandMetadata;

export const shellHelp = { description: "交互式 Shell 控制台" } satisfies CommandMetadata;

export const skillHelp = {
	description: "在 Skillshare 注册表 (skills.omp.sh) 上安装、搜索、发布与管理技能",
} satisfies CommandMetadata;

export const sshHelp = { description: "管理 SSH 主机配置" } satisfies CommandMetadata;

export const statsHelp = { description: "查看用量统计" } satisfies CommandMetadata;

export const streamHelp = {
	description: "把本地 omp 会话画面与聊天广播到你的公开直播频道",
} satisfies CommandMetadata;

export const tinyModelsHelp = {
	description: "下载本地微型模型（会话标题、记忆、单词补全）",
} satisfies CommandMetadata;

export const tokenHelp = { description: "获取某个服务商的 API 密钥或 OAuth 令牌" } satisfies CommandMetadata;

export const toksHelp = {
	description: "用每个内置离线分词器（OpenAI、Claude、Qwen……）统计文件或文本的令牌数",
} satisfies CommandMetadata;

export const ttsrHelp = {
	description: "检查并测试时间旅行流规则 (TTSR)",
} satisfies CommandMetadata;

export const updateHelp = { description: "检查并安装更新" } satisfies CommandMetadata;

export const usageHelp = {
	description: "显示每个已认证账户的服务商用量限制",
} satisfies CommandMetadata;

export const worktreeHelp = {
	description: "添加、列出或清理 git 工作树（启用时优先克隆）",
} satisfies CommandMetadata;
