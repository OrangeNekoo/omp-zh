# omp-zh · oh-my-pi 简体中文汉化版

[oh-my-pi](https://github.com/can1357/oh-my-pi)（命令 `omp`）的简体中文界面分支。汉化只作用于**终端界面**——菜单、设置面板、对话框、状态提示、斜杠命令说明等给人看的内容；面向模型的系统提示词、工具描述与实现逻辑保持原样。

命令名改为 **`omp-zh`**，配置目录与上游完全共用（`~/.omp`），因此可以和原版 `omp` 并存、共享同一份登录状态、会话历史与设置。

> 上游版本：`18.12.6` · 本项目跟随上游滚动更新
>
> 本项目**不是** oh-my-pi 的一部分，问题请提交到[本仓库 Issues](https://github.com/OrangeNekoo/omp-zh/issues)，勿向上游作者反馈。详见文末[声明](#声明)。

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
  patch-report-keys.ts 让 `/session` 等面板的解析比较跟随译文
  patch-gitignore.ts   在上游 .gitignore 上补本 fork 的忽略项
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

## 更新已安装的 omp-zh

上游每天都在发版，本仓库把汉化作为可重放的补丁维护。更新方式取决于你当初的安装方式。

### 源码 / `bun link` 安装

```sh
cd omp-zh
git pull --ff-only                 # 拉取本仓库最新的「上游 + 汉化」提交
bun install                        # 依赖可能随上游变动
bun i18n/fetch-native.ts --force   # 原生模块版本跟着上游走，强制刷新
bun packages/coding-agent/src/cli.ts --version   # 确认输出 omp-zh/<新版本>
```

`bun link` 指向源码目录，因此 `git pull` 之后命令立即生效，无需重新 link。

> 仓库自身已包含重放后的汉化源码，**不需要**在本地再跑
> `i18n/translate.ts`。只有在你修改了词典、想自行重放时才需要执行那套脚本。

### 独立二进制安装

```sh
cd omp-zh
git pull --ff-only
bun install
bun i18n/fetch-native.ts --force
bun run --cwd=packages/coding-agent build
cp packages/coding-agent/dist/omp ~/.local/bin/omp-zh   # 或你放二进制的目录
chmod +x ~/.local/bin/omp-zh
omp-zh --version
```

### 全局 npm 安装

本仓库没有发布到 npm，`omp-zh update` 也不适用（它指向上游的发布渠道）。
全局安装请按上面的「源码」或「二进制」方式重新构建并覆盖旧命令。

### 只想要上游、不想要汉化

本仓库与上游共用配置目录 `~/.omp`，因此可以直接改回原版命令：

```sh
bun install -g @oh-my-pi/pi-coding-agent   # 或按上游 README 的方式安装
omp --version
```

`~/.omp` 下的登录状态、会话、设置与插件无需迁移。

---

## 使用

```sh
omp-zh                          # 进入交互式终端界面
omp-zh "列出 src 下所有 ts 文件"
omp-zh -p "解释这个仓库的架构"     # 一次性输出，不进 TUI
omp-zh --help                   # 查看全部参数
omp-zh --version                # omp-zh/18.12.6
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

   结果写入两处（均已 gitignore）：

   - `i18n/extracted.json` — 全部界面文案快照
   - `i18n/pending.json` — **待译清单**，键为英文原文、值为空字符串。
     直接填入中文译文，再合并进 `dictionary.json` 即可

   终端同时打印覆盖率：

   ```
   翻译状态：已汉化 1392 条，未译 245 条（其中值得人工翻译的 85 条）
   ```

   统计会排除专有名词、参数名、数值标签与快捷键，剩下的才是真正的工作量。

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
- `TRANSLATABLE_PROPERTIES`：允许翻译的对象属性名（`label`、`description`、`title`、`head`、`k`……）
- `TRANSLATABLE_CALLS`：允许翻译的 UI 构建函数（含 `showStatus`、`showError`、`output` 等）
- `PROTOCOL_CONSTANTS`：**永不汉化**的常量名。这些常量的字面值会越过界面进入协议——
  例如 `APPROVE_OPTION` 会被塞进 ACP elicitation 的 `enum: [...]` 发给客户端，客户端回传的值必须与之一致。
  界面上想显示中文要改就整条链路一起改，不能只改常量
- `PROSE_ONLY_PROPERTIES`：既可能装显示文案、也可能装协议枚举的属性（`action`、`word`、`escape`……）。
  只有「多词短语或以大写字母开头」的值才会翻译，`action: "copy"` 这类枚举保持原样
- `displayTextArgumentIndex`：`theme.fg("dim", "…")`、`chalk.dim("…")`、`console.log("…")` 里文案所在的实参下标
- `TRANSLATABLE_CALL_LABEL_INDEX`：标签不在第一实参的调用（`pickerAction(id, label)`、
  `actionHint(keys, label)` 等）。第一实参是协议 id / 键位，不能走默认下标
- `WHOLE_FILE_LITERALS`：整文件按字面量处理的文件（如 `mcp/oauth-reauth.ts`——错误消息散落在
  `new Error(…)` 里，没有统一的可译调用位，只能整文件按词典精确匹配）
- `translate.ts` 的 `VariableDeclarator` 规则：名字以 `_TITLE`/`_MESSAGE`/`_HINT`/`_WAIT`/`_STATUS`/
  `_PROMPT`/`_PLACEHOLDER`/`_OPTION` 等结尾的单值常量整体翻译
- `translate.ts` 的 `CallExpression` walk：`TRANSLATABLE_CALLS` 的标签实参沿逻辑/条件/数组分支
  下钻（`showStatus(cond ? "A" : "B")`、`#showReport(标题, […].join("\n"))` 都能命中）。
  `extract.ts` 的同一 walk 必须同步改——两侧不对齐会让文案在待译清单里隐形

规则采用「文件范围 + 语法位置」双重约束。要扩大覆盖，新增属性名或文件规则即可，不需要改动翻译逻辑。

**「标签被译、比较仍是英文」是一类真实故障**，重写器抓不到，请在改词典或加规则时留意：
`showHookSelector` / `showPlanReview` 这类选择器回传的就是 label 本身，如果标签写成中文、
分支还拿英文比较，那个分支会静默失效——面板看起来正常，点了没反应。修法有二：
1. 让标签与比较共用同一个常量（上游 `APPROVE_OPTION` 就是这种模式）；
2. 把比较改写成 `reportKeyEq(expr, "英文", "中文")`（`patch-report-keys.ts` 的机制，可重放）。
上游测试会直接喂英文 label，所以比较处要能同时认两种语言。

### 翻译约定

- 术语统一：`Provider` → 服务商，`Model` → 模型，`Session` → 会话，`Tool` → 工具，`Subagent` → 子代理。
- `turn`（对话轮）名词一律用**回合**，量词继续用「轮」（`每轮`、`下一轮`）；不要引入第三种译法「轮次」。
- 界面空间有限：按钮、标签尽量短（2–4 字），描述性文字可以完整。
- 保留专有名词：`Bash`、`GitHub`、`LSP`、`MCP`、`OAuth`、`Hindsight`、`Mnemopi` 等不译。
- 不翻译含占位符的命令用法串（如 `<name> [--scope project|user]`）。
- 带快捷键后缀的文案保留后缀：`"Add a note  n"` → `"添加备注  n"`。
- **带插值的整句**：模板字符串里的 `${…}` 在词典键中写作 `\u0000` 占位符。例如
  `` `Switch model for this session (same as ${key})` `` 对应键
  `"Switch model for this session (same as \u0000)"`。译文里占位符的数量必须与原文一致，
  否则该条会被跳过（避免把插值错位）。

---

## 自动同步上游

上游每天都有提交。若把汉化结果当一次性改动，上游一动就会冲突。本仓库把汉化拆成「词典 + 确定性重写器」，同步时在**上游最新源码上重放**，冲突面收敛到词典条目本身。

工作流：`.github/workflows/zh-sync.yml`，每天 UTC 03:17 或手动触发。

流程：

1. 拉取 `can1357/oh-my-pi` 的目标分支（默认 `main`）；`checkout` 固定 `ref: main`，
   `bun-version` 固定为已验证的版本，避免 bun 大版本变更打断同步
2. 若 `main` 已包含该提交则跳过
3. 备份本 fork 自有的文件：清单**动态计算**——取「相对上游提交多出来的路径」
   （排除 `packages/**`、`scripts/link-omp.sh`、`.gitignore`，这三处由重写器负责重放）。
   用硬编码路径会让日后新增的 fork 文件在同步中被静默删除
4. 工作区切换到上游提交，并清除旧翻译结果
5. 还原上述自有文件，并**逐个校验存在性**（还原漏一步就会把删除动作提交上去）
6. 依次执行五个重写器：
   - `bun i18n/translate.ts` — 词典翻译
   - `bun i18n/translate-hints.ts` — `${键位} to 动作` 拼接提示
   - `bun i18n/apply-cli-name.ts` — 重新套用 `omp-zh` 改名
   - `bun i18n/patch-report-keys.ts` — 面板解析比较跟随译文
   - `bun i18n/patch-gitignore.ts` — 补回本 fork 的忽略项
7. 依次通过闸门：
   - 提取器命中数 ≥ 1000（当前实际约 1637；规则半失效时也能拦住，且该步开 `pipefail`）
   - 分组名校验 `bun i18n/check-groups.ts`
   - `omp-zh --version` 必须输出 `omp-zh/*`
   - 两个翻译器二次运行必须为 0 替换（幂等）
   - `packages/utils`、`packages/tui`、`packages/coding-agent` 类型检查
8. 用 `git commit-tree` 造「fork main + 上游」的双父提交，推送回 `main`
   （这样 main 的历史包含上游提交，下一次的「是否已包含」判断才成立，推送也始终是快进）

任何一步失败都不会推送，避免把损坏的构建推到主分支。

### 自动化边界

**能可靠自动完成：**

- 上游对**已有文案**的修改：词典按原文精确匹配，命中即翻译
- 上游新增**未收录**的文案：保持英文，不报错、不中断同步
- 上游代码结构调整：重写器基于 AST 与语法位置，不依赖行号
- 带插值的文案：插值两侧的英文按 `\u0000` 占位符整句匹配，`${…}` 本身原样保留
- `package.json#bin` 被上游重写：`apply-cli-name.ts` 每次重新套用
- `/session` 等「先产出报告再解析」的面板：`patch-report-keys.ts` 让解析方的英文比较跟随译文
- 分组名一致性：词典同时覆盖 `TAB_GROUPS` 与各 `settings.ts` 的 `group` 值，避免设置面板分组错乱

**无法自动完成：**

- **新文案的翻译本身**。脚本不调用机器翻译：未收录的文案保持英文，等待人工补词典。这是有意为之——机翻容易产出术语不一致、语气生硬的界面。
- **上游结构性重构**。若上游把 `label: "…"` 改成别的 API，规则需同步更新。此时 CI 会在「提取器仍能命中」这步失败并停止推送，不会静默漏译。
- **上游测试断言**。上游测试大量断言英文文案，汉化后这些断言会失败（18.12.6 同步实测基线：`packages/tui/test` 98 个、`packages/coding-agent/test` 225 个；新译文案会再增加少量同类断言失败，均属此列）。它们是断言问题而非功能问题，因此 CI 不跑全量测试；重放时应做的是「与同步前基线比对，确认没有新增的**功能性**失败」，而不是追平绝对数。

结论：**同步与重放可以完全自动化，翻译新词条仍需人工**。当前词典收录约 4600 条，覆盖主要界面；剩余未译条目多为专有名词、模型名与长技术描述，按需补充即可。

---

## 已验证的状态

- `omp-zh --version` → `omp-zh/18.12.6`
- `omp-zh --help` 正常输出，参数说明与 `EXAMPLES` 注释已汉化（含本轮上游新增的 `--plan-yolo`、`--restore`、`--system-prompt-template` 等）
- `packages/utils`、`packages/tui`、`packages/coding-agent` 三个包 `check:types` 通过
- 设置面板分组名校验通过：56 个引用全部命中 59 个定义（3 个定义当前无设置使用）
- 设置项的名称、说明与选项（含 `options` 子菜单的 label/description）已汉化
- 设置项下方的长段说明文字已汉化（`session`、`tools`、`modes`、`task`、`context` 等主要模块）
- 首次使用引导的场景（登录、模型、字形、输入框、主题）已汉化
- 欢迎界面 34 条提示语已汉化
- 设置面板底部与各对话框的操作提示行已汉化
- 状态栏、工具卡片标题/状态词、`/session` 信息面板、任务面板与快捷键表已汉化
- 斜杠命令的名称与描述已汉化（提取器可见条目 0 未译）
- 词典收录 4634 条；提取器统计的界面文案已汉化 1392 条（未译 245 条中 85 条值得人工，基本为专有名词与模型名）
- 翻译器、提示片段翻译器与报告键补丁均幂等：连续执行两次，第二次替换数为 0
- `/session` 信息面板与分支摘要选择器（`showHookSelector`）的回传值比较改为中英文双认（`reportKeyEq`），
  上游测试喂英文值时同样能命中
- 全量测试与同步前基线**逐条比对**：`packages/utils` 0 失败；`packages/coding-agent` 9 失败
  （基线 225，净修复 200+，剩余全部为断言英文文案）；`packages/tui` 新增失败均为上游测试
  断言本轮新译的文案（属上文已记录的类别），另修复 2 个基线失败

### 本轮修复的漏翻与故障（18.12.6）

- **extract.ts 与 translate.ts 规则对齐**：此前 `showStatus(cond ? "A" : "B")` 的三元分支、
  带插值的整句模板（`\u0000` 占位符键）、`helpText` 数组、`pickerAction(id, label)` /
  `actionHint(keys, label)` 的第二实参标签、`showReport`/`showHookConfirm`/`showHookSelector`
  的正文实参，提取器都看不见——这些位置的文案从未进入待译清单，形成系统性隐形漏翻
  （约 700 条）。现已全部对齐，两侧规则同源。
- **上游重构导致的漏翻**：`/mcp` OAuth 流程从控制器挪进 `mcp/oauth-reauth.ts` 后整体脱离
  覆盖范围，其用户可见错误消息已通过整文件词典模式重新覆盖；abort 原因与错误分类输入
  （`invalid_grant` 等）刻意保持英文（跨模块契约）。
- **拼接残缺修复**：`${key} to 添加 a server`、`to 取消, 5 minute timeout` 这类「hints 先译
  动作词、整句没跟上」的半翻译，已用英文形态整句键拦截。
- **误译修复**：移除歧义词典键 `in \u0000 → \u0000 后`（曾把 `in ${sha}` 错位成 `${sha} 后`）；
  撤销 `status line segment` 词条（该 label 会流入 `logger.warn`，按「日志不汉化」约定保持英文）；
  修正「Ask 条隐藏：」等占位符错位译文。

---

## 许可证

本仓库是 [can1357/oh-my-pi](https://github.com/can1357/oh-my-pi) 的衍生作品，遵循上游的 MIT 许可证，见 [LICENSE](LICENSE)。上游版权归 Stencil Labs, Inc. 所有。

---

## 声明

**本项目不是 [oh-my-pi](https://github.com/can1357/oh-my-pi) 的一部分**，也不是其官方中文版。它是第三方维护的简体中文界面分支，所有汉化、打包与发布均由本仓库独立完成，与omp作者无关。

上游团队不负责本仓库的代码、构建产物或安装脚本，也**不会**处理与本项目相关的问题。遇到任何问题——汉化错误、漏译、构建失败、命令行为异常——请**不要向上游作者反馈**，而应提交到本仓库的 [Issues](https://github.com/OrangeNekoo/omp-zh/issues)。

如果你在使用中发现了属于上游本身的缺陷（与汉化无关），请先在本仓库确认不是汉化引入的，再自行决定是否按上游的贡献流程反馈。
