# OpenDashboard 本地电脑控制台规划

- 状态：规划基线，不授权实现或真实主机控制
- 日期：2026-08-16
- 基线：公开 `main` 的 `9a2268901569cd407d5a16fc8f79a936285ec185`
- 规划 worktree：`local-console-planning`

## 结论

OpenDashboard 的可信定位是：

> 面向单机开发者的本地电脑控制台，统一呈现本机开发服务、故障证据与受控操作，让用户在一个界面完成发现、理解、审批、验证和留痕。

“本地电脑控制台”描述的是产品目标，不是当前完成度。当前实现能证明中文交互、确定性事件流程、审批边界、来源标注和证据导出；它不能证明真实本机发现、真实 API 观测、插件运行或进程控制。

## 当前进度基线

### 已实现并有证据

- React 19、严格 TypeScript 和 Vite 构成的中文 Web 演示。
- `incident_open -> evidence_collected -> approval_pending -> action_confirmed -> recovered` 确定性流程。
- Fixture 来源、限制、审批、模拟操作、验证、按序审计记录和脱敏报告。
- 类型检查、17 个测试和生产构建记录。
- 桌面与移动端视觉检查、90 秒中文视频和公开源码 Release。

### 仅规划或 Mock

- 本机运行时、资源、进程、端口、Agent 和工作区观测。
- API 追踪、Cordis/LocalOps/AUM/Radar/Hardware/Orca/AgentTeams 适配。
- 插件 SDK、插件加载、市场和可视化自动化。
- 真实重启、文件修改、Shell、自动修复和远程操作。

当前竞赛交付已经完成；相对于“真实本地电脑控制台”，项目仍处于合同、Fixture 和交互闭环已验证，真实只读主机能力尚未接入的阶段。不能用一个总体百分比掩盖这两条进度线。

## 用户与核心任务

主要用户是在一台开发机上运行多个 API、AI Agent 或本地服务的独立开发者。首版只解决一个问题：

> 当本机开发服务异常时，用户能在一个地方看见状态、理解有限证据、做出明确决策、验证结果并留下可复核记录。

首版不服务远程运维团队、企业设备管理、云控制面或无人值守自治修复。

## 产品原则

1. **只读优先**：先证明观测准确、来源清晰，再讨论真实动作。
2. **显式纳管**：默认不扫描所有端口；用户显式注册或授权的目标才进入控制台。
3. **最小权限**：浏览器不能直接访问宿主机；本机能力只能通过类型化、有限的 loopback 边界暴露。
4. **来源逐项可见**：`fixture`、`local`、`planned` 必须跟随每个对象，不能只显示一个全局模式标签。
5. **证据限制可见**：无证据时输出 `unknown` 或 `unsupported`，不能猜测根因或健康状态。
6. **操作默认拒绝**：审批只代表允许，不能代表动作已执行或服务已恢复。
7. **不扩大产品权限**：任何模块都不能引入任意 Shell、外部网络、凭据读取或未知进程控制。

## 下一阶段的最小产品

首个真实版本只承诺三件事：

- 读取一组粗粒度、非身份化的本机运行时和资源状态。
- 用确定性规则组织事件并解释已经归一化、已经脱敏的有限证据。
- 展示受控操作决策、审批与审计，但继续使用模拟执行。

真实 loopback 健康探测可在上述主路径稳定后作为单独适配器加入。真实重启必须后置到新的安全 Gate，并满足目标所有权、动作 allowlist、审批绑定、幂等、超时、失败对账和恢复验证。

## 执行结构

```text
LC0 Contract and Safety Gate
  |-- LC1 Local Host Snapshot
  |-- LC2 Incident Lifecycle
  |-- LC3 API Diagnostics
  |-- LC4 Action Decision
  |-- LC5 Plugin Metadata Compatibility (optional)
  `-- LC6 Chinese Console Experience
            -> LC7 CodeGraph Integration and QA
```

LC0 先冻结唯一合同和不可变 40 位 base SHA。LC1-LC6 必须从同一 SHA 建立独立 Orca worktree，只读取 LC0，不读取其他任务的分支或成果。LC7 是唯一允许组合这些提交的任务。

## 独立任务板块

### LC0 — 合同与安全 Gate

- 范围：冻结本地控制台 PRD、技术边界、API Contract、来源模型、最小 view-model 和六个模块接口。
- 允许路径：`docs/local-console/**`、`apps/web/src/contracts/local-console/**`、`reports/local-console/LC0.md`。
- 约束：不实现功能，不接触本机状态，不添加依赖，不修改当前 Fixture 合同。
- 成果：一个通过类型/合同检查的公共 Gate、风险清单和不可变 commit SHA。

### LC1 — 本机边界与运行时快照

- 范围：粗粒度、只读、非身份化的本机运行时与资源快照；显式区分 `known`、`stale`、`unknown`、`unsupported`。
- 允许路径：`apps/local-host/**`、`reports/local-console/LC1.md`。
- 约束：禁止 Shell/PowerShell、环境变量、文件内容、完整进程/窗口/会话枚举、主机名、IP、硬件唯一 ID、持久化、出站网络和任何修改操作。
- 成果：隐私字段矩阵、Fixture、只读模块、独立测试、commit SHA。

### LC2 — 事件与证据生命周期

- 范围：纯函数式事件分组、去重、严重度和恢复生命周期。
- 允许路径：`apps/web/src/local-console/incidents/**`、`apps/web/tests/local-console/incidents/**`、`reports/local-console/LC2.md`。
- 约束：禁止采集器、Provider、网络、UI、存储、通知、审批和执行。
- 成果：乱序、重复、缺失证据等确定性 Fixture，稳定生命周期结果，独立测试和 commit SHA。

### LC3 — API 故障诊断

- 范围：对预归一化、预脱敏的 5xx Fixture 生成证据受限的诊断结果。
- 允许路径：`apps/web/src/local-console/api-diagnostics/**`、`apps/web/tests/local-console/api-diagnostics/**`、`reports/local-console/LC3.md`。
- 约束：禁止代理、请求拦截、重放、真实网络、原始 header/body/log/stack、无证据根因断言和修复操作。
- 成果：相关、冲突、无结论和错误 Fixture，稳定结果码，独立测试和 commit SHA。

### LC4 — 操作与审批决策

- 范围：默认拒绝的决策、审批绑定、过期、幂等和审计；输出只表示是否授权。
- 允许路径：`apps/web/src/local-console/action-policy/**`、`apps/web/tests/local-console/action-policy/**`、`reports/local-console/LC4.md`。
- 约束：禁止执行器、进程/文件修改、Shell、网络、真实授权 token、凭据读取、自动重试和“授权等于成功”的文案。
- 成果：批准、拒绝、过期、重放和竞态 Fixture，独立测试和 commit SHA。

### LC5 — 插件元数据兼容

- 范围：仅验证静态 manifest、SDK 版本和 capability 兼容性。
- 允许路径：`apps/web/src/local-console/plugin-contract/**`、`apps/web/tests/local-console/plugin-contract/**`、`reports/local-console/LC5.md`。
- 约束：禁止插件加载、动态 import、安装、市场、Registry、权限授予、网络和代码执行。
- 成果：兼容/不兼容 manifest Fixture、完整性检查、稳定错误和 commit SHA。
- 优先级：可选；不能阻塞首版主路径。

### LC6 — 中文控制台界面

- 范围：用冻结 view-model 先完成中文静态保真，再接 Fixture。
- 允许路径：`apps/web/src/local-console/ui/**`、`apps/web/tests/local-console/ui/**`、`apps/web/public/local-console/**`、`artifacts/design/local-console/**`、`reports/local-console/LC6.md`。
- 约束：禁止修改领域状态机、直接访问本机或网络、修改应用入口、添加依赖；静态截图通过前不得接真实数据。
- 成果：冻结 tokens/assets、桌面与移动截图矩阵、文件 hash、视觉验收和 commit SHA。

### LC7 — CodeGraph 集成与 QA

- 范围：按 LC1、LC2、LC3、LC4、LC5、LC6 顺序组合已验收提交，建立适配层和应用入口，完成发布检查。
- 允许路径：`apps/web/src/local-console/integration/**`、最小入口/配置接线、`docs/local-console/**`、`reports/local-console/LC7.md`。
- 约束：不重新设计模块，不在集成阶段增加功能；LC1-LC6 不能互相直接 import；LC5 可延期，LC4 保持模拟决策。
- 成果：集成 SHA、CodeGraph 影响记录、实际运行的检查、桌面/移动视觉证据和剩余风险。

## Timetable

这是下一次获得明确实现授权后的建议节奏，不代表当前已经开工：

| 时间 | 工作 |
|---|---|
| 第 0.5 天 | LC0 冻结合同、安全边界和 base SHA |
| 第 1-3 天 | LC1-LC6 在独立 worktree 并行；LC5 可直接延期 |
| 第 4 天 | LC7 逐提交集成、CodeGraph 影响检查、类型与测试修复 |
| 第 5 天 | 中文桌面/移动 QA、演示脚本与证据收敛 |

任何真实动作或插件执行不得为了赶时间进入这五天。

## CodeGraph 集成协议

Gate 建立基线：

```powershell
codegraph status . --json
codegraph init .
codegraph sync .
```

每个任务交付前检查自己的公开符号和受影响测试：

```powershell
codegraph sync .
codegraph node <public-symbol> --path .
codegraph impact <public-symbol> --path . --depth 3 --json
git diff --name-only <GATE_SHA>...HEAD | codegraph affected --stdin --path . --depth 5 --json
```

如果影响路径进入另一个 LC 模块目录，独立性检查失败。LC7 每接入一个提交都重新 `sync`，确认模块只被自身测试和 `local-console/integration/**` 消费。最后必须运行完整 `npm run check`、视觉检查和权限边界检查。

`planning/codegraph/local-console-graph.ts` 只能验证计划 DAG 可查询；它不能被应用导入，也不能作为运行集成证据。CodeGraph 不替代类型检查、测试、构建、浏览器 QA 或安全审阅。

## 完成定义

本规划阶段完成，意味着：

- README 清楚区分当前 Fixture 演示和本地电脑控制台目标。
- LC0-LC7 的范围、路径、权限边界、记录和成果明确。
- LC1-LC6 可从同一 Gate SHA 独立工作，不互相读写。
- CodeGraph 集成方法可执行且不扩大文件权限。
- 没有运行时代码、真实本机控制或外部状态变化。

本地电脑控制台 MVP 完成，则还需要未来实际实现并验证 LC0、LC1、LC2、LC3、LC6 和 LC7；LC4 只能保持模拟决策，LC5 可以延期。
