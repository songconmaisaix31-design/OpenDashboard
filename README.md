# OpenDashboard

> 一个处于实验阶段的本地 AI 控制台，用于演示单机服务的观测、故障诊断与受控恢复流程。

OpenDashboard 源自最初的“氢哨（H2 Sentinel）”故障诊断演示底盘，后来用于探索本地服务诊断与静态插件边界。它目前是 `LAB / MAINTENANCE` 项目，不是生产级企业控制中枢，也不是万能电脑管理器、远程运维平台或 Agent 平台。

GOAI 参赛版本未进入复赛。H2 后续竞赛工作保留在独立分支、标签和独立仓库演进线上；本仓库 `main` 不合入 H2 后续实现，也不把本地未推送的 H2 修复当作当前能力。

## 现在实际有什么

| 类别 | 当前事实 |
|---|---|
| Fixture 行为 | 可运行的中文确定性演示，覆盖异常发现、证据展示、人工批准、结果验证和脱敏报告。数据、时间和状态转换都来自固定 Fixture。 |
| 模拟操作 | “恢复”只改变内存中的演示状态，不会扫描主机、调用 Shell、重启进程或修改 Windows 服务。 |
| 插件实验 | 共享 TypeScript 契约、静态可信插件注册表、生命周期回滚/释放，以及作为唯一数据源的 Fixture 插件。Manifest 是审计元数据，不是安全沙箱。 |
| 未实现想法 | 真实主机探针、持久化、真实进程/服务控制、动态第三方插件、插件市场、WASM、远程主机和多机器控制均未实现。 |

界面中的来源必须保持可见且机器可读：`Fixture`、`Mock`、`Planned` 与 `Live` 不能互相替代。当前仓库没有 `Live` provider。

## 快速开始

要求 Node.js 22.12+ 和 npm 11；`package-lock.json` 是依赖事实源。

```bash
npm ci
npm run dev
```

完整验证：

```bash
npm run check
```

`check` 依次执行严格 TypeScript 检查、Node 测试和 Vite 生产构建。仓库不使用 pnpm。

## 当前源码结构

```text
apps/web/                   中文 Fixture 界面与组合入口
packages/contracts/        Demo 与 Plugin 的共享契约
packages/plugin-runtime/   静态注册、依赖排序、回滚与释放
plugins/fixture-demo/      确定性 Fixture provider，无真实 I/O
docs/architecture/         当前架构决策
docs/history/              历史快照、旧计划和本地残留分类
docs/research/             开源复用与许可证评估
docs/verification/         已执行验证的边界说明
```

## 安全与生产边界

- 不读取或记录 `.env`、令牌、私钥或凭据存储。
- 不提供任意 Shell、PID 强杀、自动提权、远程主机或多机器控制。
- 不加载用户提供的代码；进程内静态插件仍是完全可信代码。
- 演示批准、审计轨迹和恢复结果不是操作系统授权、隔离或生产恢复证据。
- 未经过独立威胁评审、故障注入和生产运维验证，不得用于真实恢复操作。

## 维护方向

唯一候选里程碑是 PF3：在安全契约先行的前提下，实现显式启用、只读、仅 loopback、仅针对用户明确目标的本机健康适配器。它不包含进程控制、Shell、提权、LAN 扫描或远程主机；未获单独授权时，本项目维持有限维护。

## 历史与证据

- [项目状态](STATUS.md)
- [插件优先架构](docs/architecture/PLUGIN_FIRST_ARCHITECTURE.md)
- [插件基线验证](docs/verification/PLUGIN_BASELINE.md)
- [竞赛演示恢复索引](docs/history/competition-demo-2026-08-16.md)
- [2026-09-01 本地残留审计](docs/history/local-residual-audit-2026-09-01.md)
- [研究与架构交接](docs/handoff/RESEARCH_AND_ARCHITECTURE_HANDOFF_ZH.md)

历史文档用于追溯，不代表当前实现或当前测试结果。可恢复的中文竞赛演示保留在不可变标签 `competition-demo-2026-08-16`。
