# omp-zh · oh-my-pi 简体中文汉化版

[oh-my-pi](https://github.com/can1357/oh-my-pi)（命令 `omp`）的简体中文界面分支。汉化只作用于**终端界面**——菜单、设置面板、对话框、状态提示、斜杠命令说明等给人看的内容；面向模型的系统提示词、工具描述与实现逻辑保持原样。

命令名改为 **`omp-zh`**，配置目录与上游完全共用（`~/.omp`），因此可以和原版 `omp` 并存、共享同一份登录状态、会话历史与设置。

> 上游版本：`18.12.2` · 本项目跟随上游滚动更新

---

## 汉化了什么

| 汉化 | 不汉化 |
| --- | --- |
| 设置面板的标签页、分组、开关名称、说明与选项 | 系统提示词（`packages/coding-agent/src/prompts/**`） |
| 斜杠命令的名称与说明文字 | 工具的 `description` 与提示词 |
| 弹窗、选择器、审批对话框的按钮与标题 | 代码里的标识符、枚举值、协议字段 |
| 状态栏、工具卡片的标题与状态文字 | 配置键名、环境变量名、路径 |
| 输入框占位符、空状态、错误提示 | 模型名称、服务商名称 |
| 首次使用引导（选择模型、字形、主题、登录） | 日志与内部诊断信息 |
| 欢迎界面的提示语（tips） | 工具返回给模型的输出文本 |
| 设置面板底部与各对话框的操作提示行 | 代码注释 |
| CLI `--help` 的命令与参数说明 | |

汉化以**数据驱动**方式实现，而不是把英文硬改成中文：

```
i18n/
  dictionary.json      英文 → 简体中文词典（人工维护，可逐条审查）
  rules.ts             哪些文件、哪些语法位置允许汉化
  rules-translate.ts   数量/时长等模式化文案的规则翻译
  extract.ts           扫描源码，产出待翻译清单
  translate.ts         按词典重写 AST 字符串节点（幂等、带语法校验）
  apply-cli-name.ts    把 omp 改名成 omp-zh 的补丁
  check-groups.ts      校验设置面板分组名是否同源翻译（CI 闸门）
  fetch-native.ts      从 npm 拉取当前平台的预编译原生模块
  translate-hints.ts   翻译 `${键位} to 动作` 这类拼接式提示
  tips-zh.json         欢迎界面提示语（tips.txt）的对照词典
  extracted.json       待翻译清单快照（本地生成，已 gitignore）
  report.json          最近一次替换的明细（本地生成，已 gitignore）
```

`translate.ts` 不是文本替换：它用 Babel 解析 TypeScript，只重写被规则命中的**字符串字面量节点**，因此不会破坏注释、模板字符串或代码结构。写盘前还会重新解析一遍，语法不合法就中止。

### 命令名与配置目录的分离

改名通过两个常量实现：

```ts
// packages/utils/src/dirs.ts
export const APP_NAME = "omp";    // 内部标识：配置目录、日志、XDG、User-Agent
export const CLI_NAME = "omp-zh"; // 用户输入的命令名、帮助文本、--version
```

`APP_NAME` 保持 `omp`，所以配置目录仍是 `~/.omp`，日志仍是 `omp.<日期>.<pid>.log`，XDG 根目录仍是 `$XDG_*/omp`，推理请求的 `User-Agent` 仍是 `omp/<版本>`。只有帮助文本和 `--version` 输出换成 `omp-zh`。

---

## 安装

### 前置条件

- [Bun](https://bun.sh) ≥ 1.3.14
- 如果从源码构建 Rust 原生模块，需要 Rust 工具链；**使用 npm 平台包则不需要**

### 方式一：源码运行（最快验证）

```sh
git clone https://github.com/OrangeNekoo/omp-zh.git
cd omp-zh
bun install
bun i18n/fetch-native.ts                  # 拉取当前平台的预编译原生模块
bun packages/coding-agent/src/cli.ts --version
```

**关于原生模块。** 本仓库的 `packages/natives` 是 workspace 包，`bun install`
不会安装 npm 上的平台二进制——那些平台包只在发布产物里生成。因此从源码
运行时需要额外执行 `bun i18n/fetch-native.ts`：它按 `packages/natives`
的版本从 npm 拉取对应平台的 `.node`，放到加载器查找的
`packages/natives/native/` 下。不需要 Rust 工具链。

若你修改了 `crates/**` 需要本地编译，改用
`bun --cwd=packages/natives run build`（需要 Rust 工具链）。

验证原生模块是否就绪：

```sh
bun i18n/fetch-native.ts --check
```

### 方式二：安装全局 `omp-zh` 命令

```sh
cd omp-zh
bun install
bun i18n/fetch-native.ts
bun --cwd=packages/coding-agent link
```

`bun link` 会按 `packages/coding-agent/package.json` 的 `bin` 字段把 `omp-zh`
链接到 bun 的全局 bin 目录（通常是 `~/.bun/bin`）。

如果 `omp-zh` 提示 command not found，说明该目录不在 `PATH` 里：

```sh
export PATH="$HOME/.bun/bin:$PATH"   # 写入 ~/.zshrc 或 ~/.bashrc 可持久生效
```

也可以使用仓库自带的开发包装脚本，它会规避 `bunfig.toml` 的 `preload` 污染：

```sh
sh scripts/link-omp.sh   # 把 ~/.bun/bin/omp-zh 链接到开发启动脚本
```

> 注意：`bun link` 的链接指向源码，因此同样需要先执行
> `bun i18n/fetch-native.ts`；源码目录被移动或删除后命令会失效，这是
> `bun link` 的固有行为。

### 方式三：编译成独立二进制

```sh
cd omp-zh
bun install
bun i18n/fetch-native.ts                    # 编译时会把 .node 内嵌进二进制
bun run --cwd=packages/coding-agent build
# 产物：packages/coding-agent/dist/omp
```

把 `dist/omp` 重命名或软链为 `omp-zh` 后放进 `PATH`。二进制已内嵌当前平台的 `.node`，运行时不依赖 `node_modules`，也不需要源码目录。

跨平台编译用 `CROSS_TARGET` 选择目标（需要先为对应平台准备 `.node` 文件）：

```sh
CROSS_TARGET=darwin-arm64 bun run --cwd=packages/coding-agent build
CROSS_TARGET=linux-x64    bun run --cwd=packages/coding-agent build
CROSS_TARGET=win32-x64    bun run --cwd=packages/coding-agent build
```

### 方式四：本地构建原生模块（可选）

只有在修改了 `crates/**` 或 `packages/natives` 时才需要：

```sh
bun setup    # 依次：安装依赖 → 构建原生模块 → 链接命令
```

需要 Rust 工具链。没有 Rust 时跳过这一步，前三方式均可正常使用。

### 各平台说明

| 平台 | 说明 |
| --- | --- |
| macOS（Apple Silicon / Intel） | 上述任一方式；编译产物会自动做 ad-hoc 签名 |
| Linux（glibc） | 同上 |
| Linux（Alpine / musl） | 预编译的 musl 二进制动态链接 `libstdc++`/`libgcc`，先执行 `apk add libstdc++ libgcc` |
| Windows | 在 PowerShell 中执行；原生模块走 `win32-x64`/`win32-arm64` 平台包 |

---

## 使用

```sh
omp-zh                          # 进入交互式终端界面
omp-zh "列出 src 下所有 ts 文件"
omp-zh -p "解释这个仓库的架构"     # 一次性输出，不进 TUI
omp-zh --help                   # 查看全部参数
omp-zh --version                # omp-zh/18.12.2
```

### 与上游共存

- **命令**：原版是 `omp`，汉化版是 `omp-zh`，互不覆盖。
- **配置**：两者都读写 `~/.omp`。登录状态、会话、设置、插件全部共享。
- **识别**：进程名、日志名、XDG 目录、`User-Agent` 都保持上游原值，其它工具、IDE 插件与推理网关仍能正确识别这套安装。

需要两套环境完全隔离时，给汉化版单独指定配置目录：

```sh
PI_CONFIG_DIR=.omp-zh omp-zh
```

---

## 参与翻译

### 添加或修正词条

1. 运行提取器，查看还没翻译的界面文案：

   ```sh
   bun i18n/extract.ts
   ```

   结果写入 `i18n/extracted.json`（已 gitignore，属本地快照），并打印命中位置分布。

2. 在 `i18n/dictionary.json` 里补上「英文原文 → 简体中文」：

   ```json
   {
   	"Advisor Review Interval": "顾问审查间隔"
   }
   ```

   键必须与源码中的字符串**完全一致**（区分大小写、保留标点）。词典里多余的条目不会报错，重放时被忽略。

3. 应用翻译：

   ```sh
   bun i18n/translate.ts
   ```

   脚本打印替换数量与涉及文件，并把明细写进 `i18n/report.json`（已 gitignore）。

4. 校验：

   ```sh
   bun packages/coding-agent/src/cli.ts --version
   (cd packages/coding-agent && bun run check:types)
   ```

### 调整汉化范围

改 `i18n/rules.ts`：

- `INCLUDE_FILES` / `EXCLUDE_FILES`：允许/禁止汉化的文件
- `TRANSLATABLE_PROPERTIES`：允许翻译的对象属性名（`label`、`description`、`title`……）
- `TRANSLATABLE_CALLS`：允许翻译的 UI 构建函数
- `WHOLE_FILE_LITERALS`：整文件按字面量处理的文件

规则采用「文件范围 + 语法位置」双重约束。要扩大覆盖，新增属性名或文件规则即可，不需要改动翻译逻辑。

### 翻译约定

- 术语统一：`Provider` → 服务商，`Model` → 模型，`Session` → 会话，`Tool` → 工具，`Subagent` → 子代理。
- 界面空间有限：按钮、标签尽量短（2–4 字），描述性文字可以完整。
- 保留专有名词：`Bash`、`GitHub`、`LSP`、`MCP`、`OAuth`、`Hindsight`、`Mnemopi` 等不译。
- 不翻译含占位符的命令用法串（如 `<name> [--scope project|user]`）。
- 带快捷键后缀的文案保留后缀：`"Add a note  n"` → `"添加备注  n"`。

---

## 自动同步上游

上游每天都有提交。若把汉化结果当一次性改动，上游一动就会冲突。本仓库把汉化拆成「词典 + 确定性重写器」，同步时在**上游最新源码上重放**，冲突面收敛到词典条目本身。

工作流：`.github/workflows/zh-sync.yml`，每天 UTC 03:17 或手动触发。

流程：

1. 拉取 `can1357/oh-my-pi` 的目标分支（默认 `main`）
2. 若 `main` 已包含该提交则跳过
3. 备份本 fork 自有的文件：`i18n/`、`README.md`、本工作流、`assets/`
4. 工作区切换到上游提交，并清除旧翻译结果
5. 还原上述自有文件，执行 `bun i18n/translate.ts`
6. 执行 `bun i18n/apply-cli-name.ts` 重新套用 `omp-zh` 改名
7. 依次通过四道闸门：
   - 提取器命中数 ≥ 50（否则说明汉化规则已失效）
   - 分组名校验 `bun i18n/check-groups.ts`
   - `omp-zh --version` 必须输出 `omp-zh/*`
   - `packages/utils`、`packages/tui`、`packages/coding-agent` 类型检查
8. 提交并推送回 `main`

任何一步失败都不会推送，避免把损坏的构建推到主分支。

### 自动化边界

**能可靠自动完成：**

- 上游对**已有文案**的修改：词典按原文精确匹配，命中即翻译
- 上游新增**未收录**的文案：保持英文，不报错、不中断同步
- 上游代码结构调整：重写器基于 AST 与语法位置，不依赖行号
- `package.json#bin` 被上游重写：`apply-cli-name.ts` 每次重新套用
- 分组名一致性：词典同时覆盖 `TAB_GROUPS` 与各 `settings.ts` 的 `group` 值，避免设置面板分组错乱

**无法自动完成：**

- **新文案的翻译本身**。脚本不调用机器翻译：未收录的文案保持英文，等待人工补词典。这是有意为之——机翻容易产出术语不一致、语气生硬的界面。
- **上游结构性重构**。若上游把 `label: "…"` 改成别的 API，规则需同步更新。此时 CI 会在「提取器仍能命中」这步失败并停止推送，不会静默漏译。
- **上游测试断言**。上游测试大量断言英文文案，汉化后这些断言会失败（约 46 个，集中在 `packages/tui/test`）。它们是断言问题而非功能问题，因此 CI 不跑全量测试。

结论：**同步与重放可以完全自动化，翻译新词条仍需人工**。当前词典收录约 1230 条，覆盖主要界面；剩余未译条目多为长技术描述，按需补充即可。

---

## 已验证的状态

- `omp-zh --version` → `omp-zh/18.12.2`
- `omp-zh --help` 正常输出
- `packages/utils`、`packages/tui`、`packages/coding-agent` 三个包 `check:types` 通过
- `oxlint` 0 warning / 0 error
- 设置面板 10 个标签页、59 个分组全部汉化，且 `TAB_GROUPS` 与各 `settings.ts` 的 `group` 值 100% 对齐
- 设置项的名称、说明与选项（含 `options` 子菜单的 label/description）已汉化
- 首次使用引导的 5 个场景（登录、模型、字形、输入框、主题）已汉化
- 欢迎界面 34 条提示语已汉化
- 设置面板底部与各对话框的操作提示行已汉化
- 斜杠命令描述汉化 82/86
- 翻译器与提示片段翻译器均幂等：连续执行两次，第二次替换数为 0

---

## 许可证

本仓库是 [can1357/oh-my-pi](https://github.com/can1357/oh-my-pi) 的衍生作品，遵循上游的 MIT 许可证，见 [LICENSE](LICENSE)。上游版权归 Stencil Labs, Inc. 所有。
