# OpenDashboard 调研结果与架构设计交接

- 文档状态：可交接基线
- 日期：2026-08-17
- 产品语言：简体中文
- 基线：`origin/main@9a2268901569cd407d5a16fc8f79a936285ec185`
- 工作分支：`songconmaisaix31-design/plugin-first-architecture`
- 架构实现基线：`d92b1d84ce47887c4be2876ab386d89802259c05`
- 工作树：隔离架构 worktree（本机路径不纳入仓库事实）

## 1. 交接结论

OpenDashboard 应定位为“面向单机开发者的本地服务观测、故障诊断与受控恢复控制台”，而不是万能电脑管理器、远程运维平台或任意命令执行器。

本轮已经完成最小可信的插件优先基线：

1. 把公开 README 中的长期愿景与当前实现分开。
2. 建立共享契约和静态可信插件运行时。
3. 把原有确定性 Fixture 演示迁移为第一个 Tier 1 插件。
4. 保持中文故障闭环和证据导出行为不变。
5. 清理活跃分支中的竞赛媒体和一次性调度材料，并建立可恢复索引。
6. 用测试、生产构建、CodeGraph 和真实 Chrome 流程验证集成结果。

当前没有实现真实本机探针、真实进程控制、SQLite、动态第三方插件、插件市场、Sidecar 或 WASM。下一阶段只能从只读、显式启用、仅 loopback 的本机健康适配器开始。

## 2. 当前状态一览

| 能力 | 状态 | 证据或入口 |
|---|---|---|
| 中文故障响应闭环 | 已实现，确定性 Fixture | `apps/web/**` |
| Demo 与 Plugin 共享契约 | 已实现 | `packages/contracts/**` |
| 静态 Tier 0/1 插件运行时 | 已实现 | `packages/plugin-runtime/**` |
| Fixture Demo 插件 | 已实现，无真实 I/O | `plugins/fixture-demo/**` |
| 依赖排序、回滚、反向释放 | 已实现并测试 | `packages/plugin-runtime/test/runtime.test.ts` |
| 本机只读数据桥 | 已设计，未实现 | ADR 0002、PF3 计划 |
| 事件聚合与持久证据账本 | 已规划，未实现 | PF4 计划 |
| 真实进程或 Windows 服务操作 | 未实现 | 需独立威胁评审与授权契约 |
| 动态插件加载、市场、Sidecar、WASM | 延期 | Tier 2 设计门尚未满足 |

注意：提交名中的 PF7 仅表示本轮已接受的 PF1/PF2 基线被组合进 Web 入口，不代表 PF3–PF6 已实现。

## 3. 产品问题与设计原则

### 3.1 真正要解决的问题

目标用户是在一台 Windows 开发机上同时运行多个 API、AI Agent、模型服务和工具进程的独立开发者。当前问题不是“缺少另一个监控大屏”，而是故障处理信息分散：

- 健康状态、日志、追踪和资源信息分布在不同工具中。
- 操作前缺少统一的证据与审批边界。
- 操作后缺少独立复核和可导出的脱敏记录。
- 自动化工具容易扩大权限，却没有清楚说明依据、授权和实际副作用。

### 3.2 产品闭环

```text
Discover -> Observe -> Correlate -> Diagnose -> Act -> Verify -> Remember
```

第一阶段优先证明“证据—决策—验证”闭环，而不是追求扫描整台电脑或自动修复所有服务。

### 3.3 插件优先的含义

插件优先表示可选能力必须通过版本化契约、显式依赖和可释放生命周期进入系统。它不表示任意代码可以安全加载，也不表示 Manifest 是操作系统权限控制。

- Tier 0：核心契约和运行时，只随核心发布。
- Tier 1：仓库内审核、静态导入、完全可信的 TypeScript 插件。
- Tier 2：未来的独立进程或 WASM 插件；当前只保留设计位置，禁止执行。

## 4. 调研方法

本轮只使用公开项目的主仓库、官方文档和许可证作为结构参考。评估维度包括：

1. 插件身份、依赖和生命周期是否清楚。
2. 是否提供真正的故障隔离或权限隔离。
3. 是否适合 Windows 本地单机产品。
4. 依赖体积和运维成本是否超过当前价值。
5. 许可证是否允许直接依赖或源码复用。
6. 能否只复用小型模式，而不引入完整平台。

没有把第三方仓库复制进 OpenDashboard。当前 `LICENSE` 和 `NOTICE` 记录的是本项目许可，不代表可以忽略未来引入代码的文件级许可证审查。

## 5. 开源调研结论

### 5.1 插件运行时与扩展模型

| 项目 | 可复用模式 | 决策 |
|---|---|---|
| Cordis / Koishi | 可逆 Context、依赖顺序、Disposable 生命周期 | 复用理念；当前 Cordis 4 RC 面过大，不引入依赖 |
| Open Design | `apps/daemon`、`packages/contracts`、`packages/plugin-runtime` 的目录与信任边界 | 作为最接近的结构参考；不复制完整产品和协议 |
| VS Code | 声明式 Manifest、激活条件、Disposable、Extension Host 边界 | 复用契约和生命周期概念；不复制扩展主机或市场 |
| HashiCorp go-plugin | 握手、版本协商、命名能力、健康与终止 | 留给未来 Tier 2；不引入 Go/gRPC，进程分离也不是沙箱 |
| Extism | Manifest、宿主函数、WASM 执行边界 | 仅作为未来候选；WASM/WASI 仍需显式权限和资源策略 |

结论：PF1 使用独立编写的闭合 TypeScript 运行时，没有增加运行时依赖。只有当第三方插件生态成为真实需求时，才重新评估 Cordis、Extism 或 Sidecar broker。

### 5.2 本机观测与数据面

| 项目 | 可复用模式 | 决策 |
|---|---|---|
| Uptime Kuma | 小型 probe adapter、心跳与 Incident 分离、重试/去抖 | 复用模式，不嵌入完整服务器或 Socket.IO 目录 |
| systeminformation | Windows 只读系统快照 | 下一阶段唯一近期开源依赖候选，必须包在窄适配器后 |
| OpenTelemetry JS | 语义约定与关联模型 | 可作为输出适配器，不作为 Incident/证据事实来源 |
| OpenTelemetry Collector | receiver/processor/exporter 与 start/shutdown 测试结构 | 复用结构思想，不引入 Go Collector |
| Beszel | 无 PTY/无输入、显式 Agent 身份 | 复用安全问题清单，不增加远程 Agent 或自动更新器 |

结论：下一阶段应只有一个非提权 TypeScript 本地数据面，显式绑定 `127.0.0.1`，先只读，先支持用户明确注册的目标。

### 5.3 不采用的重型方案

| 项目或方案 | 不采用原因 |
|---|---|
| PM2 | AGPL-3.0，且真实 supervisor 权限过大；只参考期望状态与对账思想 |
| Glances | LGPL-3.0、Python Sidecar 和命令动作超过本地 P0 范围 |
| Langfuse / HyperDX | Postgres、Redis、ClickHouse 等栈对单机 P0 过重 |
| OPA / Cedar | 当前封闭动作集合不需要策略语言；先使用 deny-by-default 的类型化决策 |
| 自动端口/PID 扫描后直接控制 | 观测不能证明所有权，PID、名称和端口都不足以授权动作 |
| YAML 插件配置即执行 | 在没有安全加载器时增加解析器只会扩大信任边界 |

完整来源、固定提交和许可证说明见 `docs/research/OPEN_SOURCE_REUSE_MATRIX.md`。

## 6. 当前架构

### 6.1 已实现的数据流

```text
apps/web/src/main.tsx
        |
        v
createPluginRuntime([fixtureDemoPlugin])
        |
        +--> validate manifest and dependency graph
        +--> activate reviewed plugins in dependency order
        +--> register typed services
        |
        v
FIXTURE_DEMO_DATA_SOURCE
        |
        v
DemoDataSource -> Chinese React UI
```

Fixture 数据仍然是唯一数据源。运行时只改变组合方式，不改变故障状态机、固定 ID、时间戳、审批、幂等、脱敏或恢复结果。

### 6.2 模块边界

| 路径 | 责任 | 禁止越界 |
|---|---|---|
| `packages/contracts/**` | Demo 与 Plugin 的唯一共享契约 | 不依赖 UI、provider 或系统 API |
| `packages/plugin-runtime/**` | Manifest 校验、依赖图、服务注册、生命周期和快照 | 不做网络、文件、进程、动态导入或 provider 逻辑 |
| `plugins/fixture-demo/**` | 确定性 Fixture provider 与状态转换 | 不做真实 I/O，不弱化 Fixture 标识 |
| `apps/web/**` | 中文 UI、交互映射和最终组合 | 不读取 provider 私有字段，不直接构造 provider |
| `docs/architecture/**` | 当前决策和安全门 | 不能替代实现证据 |
| `docs/research/**` | 开源结构和许可证评估 | 不能被表述为已集成依赖 |
| `docs/history/**` | 历史发布恢复索引 | 不能被表述为当前运行验证 |

### 6.3 Manifest 契约

`PluginManifestV1` 当前固定包含：

- `schemaVersion`、`apiVersion`
- `id`、`version`、`displayName`
- `tier`、`activation`
- `requires`
- `capabilities`
- `provenance`

当前运行时只接受静态提供的 Tier 0/1、`startup` 插件。`on-demand` 虽保留在类型中，但会被运行时拒绝；Tier 2 也会被拒绝。

Capability 是封闭的审计词汇，不是沙箱。当前集合为：

```text
target:read
observation:publish
incident:write
evidence:write
action:fixture
```

Fixture 插件只声明它实际通过 `DemoDataSource` 提供的能力，不再声明未实现的 Observation 发布能力。

### 6.4 服务边界

- `ServiceToken<T>` 在类型层保持不变性，在运行时要求同一 token 对象身份。
- 插件只能在 activation 期间注册服务。
- 服务 ID 不允许重复 provider。
- 插件只能解析自己的服务，或解析 `requires` 中明确声明的 provider 服务。
- 定义数组顺序不能绕过依赖声明。

### 6.5 生命周期

```text
registered -> activating -> active
                    |         |
                    v         v
                  failed -> disposed
```

- 所有 `start`/`stop` 请求进入同一顺序队列。
- 依赖先激活，consumer 先释放。
- activation 失败时，已经激活的插件按反序回滚。
- 单个 disposer 失败不会阻止其余 disposer 执行。
- 失败的清理句柄会保留以便重试；清理完成前禁止重新启动。
- 插件 callback 不允许重入运行时生命周期；同步重入会被拒绝。

接手者不得把“同步重入已拒绝”扩写成“任意异步插件代码都已沙箱化”。Tier 1 仍是完全可信代码，插件作者也不得从异步 callback 调用运行时生命周期。

## 7. 下一阶段目标架构

ADR 0002 已接受以下方向，但尚未实现：

```text
Chinese Web UI
      |
      | same-origin HTTP/SSE
      v
Non-elevated loopback data plane (127.0.0.1 only)
      |
      +--> Explicit TargetRegistry
      +--> Bounded read-only probes
      +--> Normalized Observation
      +--> Pure IncidentReducer
      +--> Evidence/read model

Real action executor: absent
Tier 2 broker/WASM: absent
```

### 7.1 PF3：只读本机适配器

写入范围应限制在 `plugins/local-host-readonly/**` 及其测试/fixture。必须满足：

- 用户显式启用并注册目标。
- 只允许 loopback 目标。
- 限制重定向、超时、并发和响应字节数。
- 校验 Host 与 Origin；loopback 不等于认证。
- 不读取凭据，不接受任意 URL，不扫描 LAN。
- 不启动、不停止、不杀死任何进程。
- 失败产生类型化 observation/evidence，不能直接触发动作。

在 Threat Model、Target、Probe 和 Observation 契约冻结前，不应编码 PF3。

### 7.2 PF4：Incident 与 Evidence

只实现纯 reducer、确定性 replay、脱敏边界和 storage port。不要在该阶段选择 SQLite，也不要引入 UI 或动作执行。

### 7.3 PF5：Action Decision

只定义 deny-by-default 决策、审批绑定、幂等和 reconciliation 状态。未知、过期或所有权不足的输入必须拒绝。该阶段仍不执行真实操作。

### 7.4 PF6：中文本机控制台

从冻结的 view-model 与 Fixture/Mock 数据构建中文 UI，先做静态视觉和截图验收，再连接真实只读 adapter。不得在 UI 内推断 provider 状态或引入运行时配置。

### 7.5 后续集成门

只集成经过独立验证的提交。Root 配置和 lockfile 变更必须有直接证据。CodeGraph 仅用于影响检查，不能替代类型、测试、构建和浏览器验证。

## 8. 安全与信任边界

以下规则是架构约束，不是建议：

1. 不读取、打印、复制或持久化 `.env`、token、私钥、密码或凭据存储。
2. 不提供任意 Shell、`eval`、PID 强杀、自动提权或远程主机控制。
3. 不允许用户输入控制动态 import、文件路径、包安装或子进程启动。
4. Tier 0/1 Manifest 不能形成 OS 权限隔离；它们仍是可信进程内代码。
5. 证据必须区分 `Fixture`、`Mocked`、`Planned` 和 `Live`。
6. 未来真实动作不能仅依据 PID、端口或进程名授权。
7. 真实 Windows 操作前必须定义进程/服务所有权、人工批准、幂等、超时、失败对账和操作后独立验证。
8. Tier 2 前必须补齐 artifact identity、版本协商、签名或 hash pin、资源限制、健康检查、终止和类型化 RPC。

## 9. 仓库清理与恢复

PF0 从活跃分支移除了大体积竞赛视频、生成截图、T0–T4 prompt/report、submission copy 和一次性 Skill 描述。删除只改变活跃树，不会缩小已有 Git 历史。

恢复来源：

- GitHub Release / tag：`competition-demo-2026-08-16`
- tag commit：`33165902fc997c6000b4e159d9e5473b4eaf7e15`
- 恢复台账：`docs/history/competition-demo-2026-08-16.md`

恢复示例：

```bash
git show competition-demo-2026-08-16:path/to/file
```

不要删除 T5–T10 或 `local-console-planning` worktree；它们包含未发布的独立提交，应先选择性迁移或建立稳定归档 ref。

## 10. 提交与阶段映射

| 阶段 | 提交 | 内容 |
|---|---|---|
| PF0 | `39051b6` | 产品真相、许可证、调研、ADR、任务计划、清理与恢复 Gate |
| PF1 | `a25eb2b` | 共享契约和静态插件运行时 |
| PF2 | `56ceea3` | Fixture provider 迁移和聚焦测试 |
| PF7 baseline integration | `d92b1d8` | 兼容 re-export、Web 组合、root 验证范围与证据 |

公开 `origin/main` 仍停留在 `9a2268901569cd407d5a16fc8f79a936285ec185`。本分支尚未因为这份交接文档而自动推送、开 PR 或合并；接手时必须先确认远端状态。

## 11. 验证基线

当前已记录并通过：

```text
npm ci --offline        PASS
npm run typecheck      PASS
npm run test           PASS (32/32)
npm run build          PASS
npm run check          PASS
git diff --check       PASS
```

CodeGraph：

```text
files: 40
nodes: 327
edges: 1143
pending: 0
worktree mismatch: none
```

真实 Chrome 已完成以下中文流程：

1. 运行只读排查。
2. 申请模拟重启。
3. 批准模拟重启。
4. 验证恢复结果。
5. 打开脱敏证据报告。

桌面和 375×812 移动端均显示 `healthy/recovered`、脱敏报告、未验证声明和五个审计事件；移动端没有横向溢出。页面没有应用来源错误，观察到的错误来自浏览器扩展。

`npm audit` 当前有一个 dev-only `tsx` 嵌套 `esbuild` 的 low advisory；moderate/high/critical 均为 0。不要用宽泛的 `npm audit fix` 破坏锁文件；升级必须重新证明 Windows clean install 可复现。

## 12. 接手步骤

### 12.1 建立事实基线

```bash
git status --short --branch
git log -5 --oneline --decorate
git rev-parse HEAD
git rev-parse origin/main
```

提交历史应包含架构实现基线 `d92b1d8...`；交接或审阅文档可能使 HEAD 更新。如果该提交不在当前历史中，先审查分支和差异，不要重置或覆盖用户改动。

### 12.2 安装与验证

```bash
npm ci
npm run check
git diff --check
codegraph sync .
codegraph status . --json
```

如果组合入口或 UI 改变，必须再用真实 Chrome 跑完整中文流程和移动端宽度。

### 12.3 开始 PF3 前

1. 从已验证 Gate 创建独立 worktree。
2. 冻结 Target、Probe、Observation 和错误契约。
3. 写 loopback/SSRF/Host/Origin 威胁评审。
4. 只授权 `plugins/local-host-readonly/**` 与对应测试。
5. 使用确定性 fixture 覆盖成功、超时、拒绝、重定向、超限和目标失效。
6. 在没有真实动作的前提下完成只读演示。

## 13. 禁止误报的声明

以下说法目前都不真实，不能出现在 README、演示、提交说明或 PR 中：

- “OpenDashboard 已自动扫描本机所有端口和 Agent。”
- “系统已经可以重启或修复真实进程。”
- “Cordis、OpenTelemetry Collector、PM2 或 systeminformation 已集成。”
- “Manifest 已经对进程内插件形成沙箱。”
- “Tier 2、WASM、Sidecar、插件市场已经可用。”
- “SQLite 审计账本已经持久化。”
- “PF7 提交证明 PF3–PF6 已完成。”

当前可公开声明的是：已经有可运行的中文 Fixture 闭环、共享契约、静态可信插件生命周期、Fixture 插件迁移和经过验证的组合入口。

## 14. 事实来源优先级

发生冲突时按以下顺序判断：

1. 当前源码与锁文件。
2. `API_CONTRACT.md`、`PRD.md` 和 `Tech-Spec.md`。
3. ADR 与 `docs/architecture/**`。
4. `docs/verification/PLUGIN_BASELINE.md` 的实际命令证据。
5. `docs/research/**` 的外部参考。
6. `docs/history/**` 的历史恢复信息。

README 是产品入口，不应单独作为实现证明。CodeGraph 是影响分析工具，也不应单独作为运行证明。

## 15. 相关文档

- `README.md`
- `PRD.md`
- `Tech-Spec.md`
- `API_CONTRACT.md`
- `docs/architecture/PLUGIN_FIRST_ARCHITECTURE.md`
- `docs/architecture/REPOSITORY_CLEANUP_PLAN.md`
- `docs/architecture/decisions/0001-static-runtime-before-loader.md`
- `docs/architecture/decisions/0002-local-data-plane.md`
- `docs/research/OPEN_SOURCE_REUSE_MATRIX.md`
- `docs/plans/PLUGIN_FIRST_TASKS.md`
- `docs/verification/PLUGIN_BASELINE.md`
- `docs/history/competition-demo-2026-08-16.md`

## 16. 交接完成标准

接手者应能回答以下问题后再继续开发：

- 当前哪些数据是 Fixture，哪些能力尚未实现？
- 为什么当前只允许静态 Tier 0/1 插件？
- 为什么 capability 不是沙箱？
- 为什么下一阶段必须只读、显式启用并限制 loopback？
- 哪些路径属于契约、运行时、provider 和 UI？
- 清理失败后为什么必须阻止 restart？
- 历史竞赛材料从哪里恢复？
- 修改组合入口后需要运行哪些验证？

如果这些答案仍然依赖口头记忆，而不是上述源码和文档，交接尚未完成。
