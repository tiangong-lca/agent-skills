---
docType: guide
scope: repo
status: active
authoritative: false
owner: skills
language: zh-CN
whenToUse:
  - when installing TianGong LCA skills with Chinese-language guidance
  - when checking wrapper execution expectations
whenToUpdate:
  - when skill installation guidance changes
  - when the unified CLI wrapper contract changes
checkPaths:
  - .claude-plugin/marketplace.json
  - README.md
  - README.zh-CN.md
  - scripts/lib/cli-launcher.mjs
  - scripts/inspect-local-cli.mjs
  - scripts/validate-skills.mjs
  - "*/SKILL.md"
  - "*/scripts/**"
lastReviewedAt: 2026-11-12
lastReviewedCommit: 0c085debe0f92f1f887eb805c22771a63e730d5b
lastReviewedNote: "Reviewed the Study first-use reference and bilingual entry prompts; qualified CLI selection, native package availability and human login remain explicit."
---

# 天工 LCA Skills

仓库地址: https://github.com/tiangong-lca/agent-skills

请使用 https://github.com/vercel-labs/skills 提供的 `skills` CLI 来安装、更新和管理这些 skills。

## 安装 CLI

```bash
npm i skills@latest -g
```

## 安装

- 仅列出可用技能（不安装）:
  ```bash
  npx skills add https://github.com/tiangong-lca/agent-skills --list
  ```
- 安装全部技能（默认项目级）:
  ```bash
  npx skills add https://github.com/tiangong-lca/agent-skills
  ```
- 安装指定技能:
  ```bash
  npx skills add https://github.com/tiangong-lca/agent-skills --skill flow-hybrid-search --skill process-hybrid-search
  ```

## 目标 agent 与作用域

- 指定 agent:
  ```bash
  npx skills add https://github.com/tiangong-lca/agent-skills -a codex -a claude-code
  ```
- 全局安装（用户级）:
  ```bash
  npx skills add https://github.com/tiangong-lca/agent-skills -g
  ```
- 作用域说明:
  - 项目级安装到 `./<agent>/skills/`.
  - 全局安装到 `skills` CLI 在当前平台解析出的 agent 用户目录。可通过 `npx skills list` 查看 macOS / Linux / Windows 上的实际路径。

## 安装方式

- 交互式安装可选:
  - Symlink (recommended)
  - Copy

## 更新与确认

- 列出已安装技能:
  ```bash
  npx skills list
  ```
- 检查更新:
  ```bash
  npx skills check
  ```
- 更新全部技能:
  ```bash
  npx skills update
  ```

## 外部运行时 skills

本仓库只维护 checked-in 的 TianGong LCA workflow skills。变化较快的 Tiangong KB research skills 应在使用项目中运行时解析，不在本仓库镜像。

source-evidence 数据集开发如果需要 SCI 论文证据，使用 `tiangong-ai/skills` 的最新外部 skill：

```bash
npx skills use https://github.com/tiangong-ai/skills --skill tiangong-kb-sci-search --full-depth
```

如确实需要本地项目级安装：

```bash
npx skills add https://github.com/tiangong-ai/skills --skill tiangong-kb-sci-search --agent '*' --yes --full-depth
npx skills update --project --yes
```

消费项目应在任务 artifact 中记录解析到的 upstream ref 和命令。除非所有权边界被明确调整，不要把 `tiangong-kb-*` skill 目录复制到本仓库。

## TianGong Foundry

外部数据包导入、源证据数据开发和继续已有 Foundry 任务，统一使用 `$foundry-tidas-import` 作为日常入口。它通过随包 bootstrap 选择合格运行时，将任务输出放在独立可写工作区。

```bash
npx skills add https://github.com/tiangong-lca/agent-skills --skill foundry-tidas-import
```

`lca-foundry-workflows` marketplace 包首先列出此入口。`foundry-tidas-authoring` 仅在当前语义工作项需要时加载，是内部角色；日常入口也能直接使用运行时提供的工作项说明，无须依赖另一个已安装技能目录。

完整入口随包提供 [Foundry 0.1.15](https://github.com/tiangong-lca/foundry/releases/tag/foundry-runtime-v0.1.15)（release source `0ab6b54513acccfe3253ea583b4f6b2e678c0485`）的最终发行锁，其中自带 CLI 0.1.24、Node 24.19.0 和 TIDAS 0.3.3。公开运行时已通过 macOS arm64、Linux x64/arm64 和 Windows x64 验证。此版本支持绑定任务简介、即时人类提问、持久保存原话、按范围采用语义决定及如实呈现部分完成回顾。共享 wrapper 与 hybrid-search 包使用环境统一配置的已安装 CLI；Foundry 入口自己的 bootstrap 脚本/lock 与活动 wrapper 相互独立，两个 owner 的 CLI 版本不得互相套用。安装或复制入口时，保持随包脚本与相邻 lock 完整。安装、登录不授予数据写入权限；继续执行任务当前的授权与恢复动作。

### 专项工作流

原有技能保留各自用途：

- `$external-dataset-curated-import`：BAFU、USLCI 等结构化 LCA 数据包导入，走 CLI 转换、规范内容校验、证据审查和独立授权的 create/save/review。
- `$source-evidence-dataset-development`：从 PDF、Word、URL、API、报告、数据库引用或科学文献进行 evidence-driven 数据新增或更新。
- `$dataset-rls-maintenance`：在当前用户 RLS 可见范围内，对历史错误导入数据做清理、删除/退役、引用修复和 redo 计划；只编排 CLI maintenance plan 与 readback verification，不实现私有数据库访问。

## 统一使用已配置的 CLI 入口

对已经安装并独立验证的正式 CLI，只需在消费环境配置一次安装目录、CLI 既有公开运行时身份文件及其独立核准的 SHA-256：

```sh
export TIANGONG_LCA_CLI_INSTALLATION=/absolute/path/to/installed/cli
export TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_FILE=/absolute/path/to/approved-cli-expectation.json
export TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_SHA256='<approved-64-character-sha256>'
node scripts/run-cli.mjs --runtime-info
node scripts/run-cli.mjs auth status --json
node lifecycleinventory-review/scripts/run-review.mjs --profile process --input /absolute/path/process.json --json
```

PowerShell 使用同名 `$env:TIANGONG_LCA_...` 变量。跨终端或进程调用时，由消费应用的启动配置持久提供这些值；不要求本地数据工作区，也不自动读取 `.env` 或搜索 PATH。各 Skill 的 `scripts/run-cli.mjs` 与普通 wrapper 复用同一选择。`--runtime-info` 只读显示实际身份和选择来源，不写额外报告，其观察结果不能自行批准资格。

使用该身份文件已核准的 Node 可执行文件启动 wrapper。正式调用不需要 Git、源码、pnpm，不安装或构建。公开身份检查由 CLI 负责，Skills 不绑定内部 schema 或构建布局；配置或资格漂移时停止，不静默回退。安装来源和传递依赖的完整资格仍由安装/环境所有者负责，不能用公开 `cli-package` 身份观察替代。

未配置时停止执行并提示完成 CLI 配置。Skill 依赖 CLI 的公开能力，不绑定具体包版本；版本选择与发行锁由安装环境负责。Skill 不会安装默认版本或 latest。已移除的 `--published-cli` 和 `TIANGONG_LCA_CLI_MODE=published` 会明确报错。`--help` 可离线查看配置指引；CLI 原生命令帮助需要先配置入口。`--cli-dir` 仍是源码候选开发路径。显式 `--cli-installation <absolute-dir>` 必须同时提供对应的 `--cli-runtime-expectation-file` 和 `--cli-runtime-expectation-sha256`。已有任务继续使用原 owner 返回的固定入口和 UNKNOWN 恢复动作，不能被这个独立调用默认覆盖。

## 远程认证

远程 skill 统一使用 CLI 管理的 Supabase OAuth session。官方 Production 不需要 public 环境变量、Dashboard 或额外索取 client ID；公开 URL/key/client/callback profile 由 CLI 唯一维护，Skills 不复制。先运行：

```bash
node scripts/run-cli.mjs auth status --json
```

若结果是 `login-required`，停止 agent workflow，把可信终端交给人类运行 `tiangong-lca auth login`。skill/agent 不得索取用户名、密码、authorization code、access token、refresh token 或旧编码 API key。账号敏感读取和 commit 前运行 `tiangong-lca auth doctor-auth --json`。

只有自定义环境才需要完整匹配的 `TIANGONG_LCA_API_BASE_URL`、`TIANGONG_LCA_SUPABASE_PUBLISHABLE_KEY`、已注册的 `TIANGONG_LCA_OAUTH_CLIENT_ID` 及精确 callback；不完整配置不能混补 Production。每个 account/project/client 使用独立私有 `TIANGONG_LCA_SESSION_FILE`。批准的 headless 自动化必须显式配置目标 URL/key 和 `TIANGONG_LCA_AUTH_MODE=access-token`，再由 orchestrator 注入短期 `TIANGONG_LCA_ACCESS_TOKEN`；仅 token 不会默认指向 Production，也不得进入 argv、prompt、日志或产物。CLI 不再存在 legacy API-key 模式。

三个 hybrid-search 技能目录可以独立安装：各自携带经过字节一致性校验的启动器和显式查询说明，不需要 Skills/CLI/Data Foundry checkout；认证仍完全由 CLI 负责。

## 校验

- 仓库校验固定使用 Node `24.19.0` 与 pnpm `11.24.0`；先从 `pnpm-lock.yaml` 安装校验包：
  ```bash
  pnpm install --frozen-lockfile
  ```
- 本地校验 CLI-backed wrapper 与迁移文档守卫:
  ```bash
  pnpm validate
  ```
- 验证已审查的 CLI 0.2.0 本地候选时，提供完整的三项配置:
  ```bash
  TIANGONG_LCA_CLI_DIR=/path/to/tiangong-lca-cli \
  TIANGONG_LCA_CLI_CANDIDATE_FILE=/path/to/reviewed-candidate.json \
  TIANGONG_LCA_CLI_CANDIDATE_SHA256='<approved-sha256>' \
  pnpm validate
  ```
- 只校验本次变更的 skill:
  ```bash
  pnpm validate lifecycleinventory-review process-hybrid-search
  ```
- CI 会在 `.github/workflows/validate-skills.yml` 中 checkout CLI 0.2.0 commit `955642482771a270fd49a199d1d7c86fcccc9ce2`，用 frozen pnpm lockfile 安装两个仓库并构建 CLI，根据已审查的固定源码和构建结果认证测试候选，然后运行同一套校验；Foundry 入口的 bootstrap 按它自己已认证的 0.1.15 发行锁与自带 CLI 0.1.24 测试。
- 其他本地候选版本必须使用下述已评阅清单与独立摘要。验收还需要真实资格失败测试、独立安装包与嵌套 wrapper 传播测试，以及原调用方验证；生成清单或仅通过 fixture 测试不能完成验收。

## 执行说明

本仓库中的 skills 已经收敛到统一的 `tiangong-lca` CLI。

当前约定：

- 普通 Skill 使用统一配置的已安装 CLI；缺少配置时停止，不下载包、不搜索 PATH 或 sibling 目录
- 源码开发执行通过 `--cli-dir` / `TIANGONG_LCA_CLI_DIR` 显式启用
- 直接调用和嵌套 wrapper 传播同一安装入口；已移除的 published 选择会明确报错
- 匹配发行版的本地 checkout 仍只需要 `--cli-dir`，且必须是带精确 Node/pnpm engines、v9 `pnpm-lock.yaml` 和已发布 TIDAS source manifest（spec 0.2.3）的 `@tiangong-lca/cli@0.1.24`
- 其他本地包版本必须提供下述已评阅 candidate 文件与外部给定摘要；显式本地选择失败不会静默回退已发布包
- 本地 pre-push hook 先验证匹配发行版或候选证据；wrapper 在源码 mtime 要求时仍先执行 `pnpm install --frozen-lockfile` 再 `pnpm run build`，并在 dispatch 前复核候选身份
- launcher 只用 argv 数组并固定 `shell: false`，因此带空格路径保持为单个参数，并原样保留子进程 exit/stdout/stderr
- Process 审查通过 `dataset process list`/`get` 发现数据并读取精确的规范内容，再运行 `dataset process validate --input process.json`；语义审查由 Agent 完成
- 对新迁移和后续重构的 skill，wrapper 入口优先直接使用原生 Node `.mjs`，不再新增 shell 兼容壳
- skill wrapper 不应再打包业务 Python、MCP transport、私有 env parsing 或 shell shim
- 远程 skill 必须使用 CLI OAuth status/login/doctor handoff，不得新增 API-key flag 或 bearer 示例
- 若能力缺失，先在 `tiangong-lca-cli` 中新增原生 `tiangong-lca <noun> <verb>` 命令，再让 skill 调用它

### 已评阅的本地 CLI 候选

按获准 assignment 的 commit 与字面包版本，在可写隔离目录准备 canonical `tiangong-lca/cli` checkout，保留 Node `24.19.0` / pnpm `11.24.0` 下已验证的 frozen-install 与 build 证据。checkout 必须干净，且已经包含 `dist/src/main.js`、`node_modules/.modules.yaml` 和 `node_modules/.pnpm/lock.yaml`。

仓库检查工具用调用方提供的预期值观测此 checkout。将新清单写到 CLI checkout 外：

```bash
node scripts/inspect-local-cli.mjs \
  --cli-dir /path/to/prepared-cli \
  --expected-commit "$APPROVED_CLI_COMMIT" \
  --expected-version "$APPROVED_CLI_VERSION" \
  --out /path/to/new-cli-inventory.json
```

工具检查 canonical source/package repository 身份、完整干净 tracked source 内容、实际 18 个固定 TIDAS schema、package/lock/manifest，以及完整 `dist` 和 `node_modules` 内容树。输出清单与打印摘要都只是观测。调用方应按获准 assignment 和已验证 install/build 证据评阅，再独立绑定清单精确文件字节的 SHA-256。工具不能自行确认输出合格，也不授予执行或数据写入权限。

在同一次 wrapper 调用中传递完整三项选择：

```bash
node process-hybrid-search/scripts/run-process-hybrid-search.mjs \
  --cli-dir /path/to/prepared-cli \
  --cli-candidate-file /path/to/reviewed-cli-inventory.json \
  --cli-candidate-sha256 "$REVIEWED_CANDIDATE_SHA256" \
  --help
```

两个 candidate flag 同时支持 `--flag=value`。仓库校验与嵌套 wrapper 通过 `TIANGONG_LCA_CLI_DIR`、`TIANGONG_LCA_CLI_CANDIDATE_FILE`、`TIANGONG_LCA_CLI_CANDIDATE_SHA256` 在同次调用中传播同一目录、文件与摘要：

```bash
TIANGONG_LCA_CLI_DIR=/path/to/prepared-cli \
TIANGONG_LCA_CLI_CANDIDATE_FILE=/path/to/reviewed-cli-inventory.json \
TIANGONG_LCA_CLI_CANDIDATE_SHA256="$REVIEWED_CANDIDATE_SHA256" \
pnpm validate
```

资格产物缺失或漂移时，预检直接拒绝，不会自动 install/build 修补。预检通过后，原 mtime 准备路径仍在需要时运行 frozen-install/build；实际 CLI 命令启动前复核全部记录身份，任何漂移都停止 dispatch。没有公开 no-install 开关，内部跳过准备也不能绕过资格。

失败时保留原 FAILED/UNKNOWN 任务和恢复证据。在新可写隔离 checkout 准备依赖与构建，生成新观测、评阅并绑定新摘要。不得伪造包版本、修改旧资格迎合已改变文件，或静默换用已发布 CLI 重试。此选择不替换 Foundry 0.1.15 的 bootstrap/lock，不更新已安装 skills/runtime，也不改变 task/attempt 所有权及数据单写权限。

## Foundry 语义工作

`foundry-tidas-authoring` 是面向具体 Foundry 工作项的内部按需角色。它读取已提供的完整上下文，将有证据的决定或 patch 文件交回调用流程；不安装运行时、不管理认证、不直接应用行数据或操作数据库。

## LCA 研究

首次使用且尚未安装环境的 Agent，请从[启动指南](lca-study/references/getting-started.md)开始。指南发布到 `main` 后，可直接复制这句 prompt：

```text
请阅读 https://raw.githubusercontent.com/tiangong-lca/agent-skills/main/lca-study/references/getting-started.md，按说明完成安装和配置，然后引导我开始一项 LCA 研究。
```

指南覆盖 Skill 安装、合格 CLI 配置、本地引擎检查、必要时的人类登录，以及第一个研究问题；缺少发行物时明确说明，不把源码可用当作安装已就绪。

`lca-study` 引导目标定义、资料收集与提取、显式前景／背景 Model 构建、计算和报告，可独立复制安装，并复用上述配置好的已安装 CLI。本地报告由 Skill 组织可编辑 JSON，调用 `report render`，由 CLI 生成内嵌模型、支持语言切换和浏览器打印 PDF 的自包含 HTML。本地研究无需创建线上 Study，也无需配置签名导出。

可选的线上 Study、情景比较、评审定稿和指定接收者分享使用所选服务已开放的命令，以及独立配置的导出信任锚。这些路径保留原始变更恢复身份、一次授权及 UNKNOWN 原键恢复边界。P2 报告仍是未审阅历史副本；签名或 actor 批准不代表当前访问权或独立科学认证。数据编制与发布仍属于各自工作流。

活动 wrapper 使用 CLI 0.2.0 的 `dataset <type> <action>` 与 `review` 接口，不保留旧命令别名。Study 的 setup、prepare 和计算扩展需要核对所选运行时实际提供的能力。

保留的旧版源码认证规则只是 launcher 的运行时选择机制，不表示新版 Skill 仍能使用旧命令；活动能力以当前 CLI 接口为准。
