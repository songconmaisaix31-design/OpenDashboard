# OpenDashboard

> 面向单机开发者的本地服务观测、故障诊断与受控恢复控制台。

OpenDashboard 的长期方向是“插件即能力”：本机目标、观测数据、诊断证据和受控动作都通过明确契约接入，核心只负责生命周期、权限边界、审计与组合。产品默认本地运行，首先服务在 Windows 开发机上同时运行多个 API、AI Agent 和工具进程的独立开发者。

## 当前状态

公开仓库目前包含一套可运行的中文 Fixture 演示，完整展示：异常发现、证据采集、人工审批、模拟恢复、恢复验证和脱敏报告。它不会扫描本机、不会控制真实进程，也没有第三方插件加载器。

本分支已经建立第一版插件优先架构基线：共享契约、静态可信插件注册表、可释放生命周期和 Fixture 插件迁移。Tier 2 Sidecar、真实本机探针、SQLite、自动化编辑器和插件市场仍属于后续阶段。

| 能力 | 当前状态 |
|---|---|
| 中文故障闭环演示 | 已实现，确定性 Fixture |
| 插件 Manifest 与静态注册表 | 已实现，静态 Tier 0/1 边界 |
| Fixture Demo 插件 | 已实现，无真实 I/O |
| 本机只读数据桥 | 已规划，未实现 |
| 真实进程/服务操作 | 未实现，需独立安全评审 |
| 动态第三方插件、市场、WASM | 未实现 |

## 产品闭环

```text
Discover -> Observe -> Correlate -> Diagnose -> Act -> Verify -> Remember
```

第一阶段不会自动扫描并接管所有进程。用户先显式注册目标，系统通过只读适配器形成观测和证据；任何未来真实动作都必须绑定目标所有权、幂等键、人工审批和动作后的独立复核。

## 插件分层目标

- Tier 0：核心契约、注册表、事件、审计和证据边界。只能随核心发布。
- Tier 1：仓库内审核过的只读或低风险 TypeScript 插件。第一版仅静态导入。
- Tier 2：未来的独立进程或 WASM 插件。必须有版本协商、资源限制、健康检查和显式权限；当前不执行。

Manifest 中的 capability 只是声明和审计输入，不是操作系统沙箱。进程内插件仍被视为完全可信代码。

## 快速开始

要求 Node.js 22.12+ 和 npm 11。

```bash
npm ci
npm run dev
```

验证当前源码：

```bash
npm run check
```

当前真实脚本只有 `dev`、`build`、`typecheck`、`test` 和 `check`。仓库不使用 pnpm，也没有 `dev:minimal`、`dev:windows-dev` 或 `dev:ai-dev`。

## 当前源码结构

```text
apps/web/                   中文界面与最终组成
packages/contracts/        Demo 与 Plugin 的共享契约
packages/plugin-runtime/   静态注册、依赖排序、回滚与释放
plugins/fixture-demo/      确定性 Fixture provider
docs/architecture/         当前架构决策
docs/research/             开源复用与许可证评估
docs/history/              历史发布恢复索引
```

## 安全边界

- 不读取或记录 `.env`、令牌、私钥或凭据存储。
- 不提供任意 Shell、PID 强杀、自动提权或远程主机控制。
- 未来本机服务只绑定 loopback，并校验 Host 与 Origin。
- 证据默认脱敏；Fixture、Mock、Planned 与 Live 必须机器可读且界面可见。
- 未通过单独威胁评审前，不加载未知代码，不执行第三方插件。

## 竞赛演示归档

2026-08-16 中文竞赛版本由 GitHub Release [`competition-demo-2026-08-16`](https://github.com/songconmaisaix31-design/OpenDashboard/releases/tag/competition-demo-2026-08-16) 保留。活跃分支会移除大体积视频、生成截图和已完成的 T0-T4 调度材料；这不会改写该 release tag。

## 路线

1. 冻结插件契约与静态运行时，让现有 Fixture 成为第一个真实插件边界。
2. 增加显式启用、只读、仅 loopback 的本机健康适配器。
3. 引入持久证据账本和事件/故障聚合。
4. 经过所有权与授权评审后，再实现 allowlisted Windows 服务操作。
5. 只有出现可信第三方生态需求后，才实现 Tier 2 Sidecar/WASM 和分发机制。

详细资料：

- [插件优先架构](docs/architecture/PLUGIN_FIRST_ARCHITECTURE.md)
- [最新实施规划](docs/plans/PLUGIN_FIRST_TASKS.md)
- [调研与架构设计交接](docs/handoff/RESEARCH_AND_ARCHITECTURE_HANDOFF_ZH.md)
- [开源复用与许可证评估](docs/research/OPEN_SOURCE_REUSE_MATRIX.md)
- [仓库清理与恢复方案](docs/architecture/REPOSITORY_CLEANUP_PLAN.md)
