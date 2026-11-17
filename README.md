<div align="center">

# OpenDashboard

An experimental local AI console: a deterministic Chinese fixture flow for observation, diagnosis and human-approved recovery — with every simulated step labelled as simulated.

一个实验阶段的本地 AI 控制台：用确定性中文 Fixture 流程演示观测、诊断与人工批准的恢复步骤，并把每个模拟环节都标成模拟。

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-22.12%2B-green.svg)](package.json)
[![Status](https://img.shields.io/badge/status-lab%20%2F%20maintenance-yellow.svg)](STATUS.md)
[![CI](https://github.com/songconmaisaix31-design/OpenDashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/songconmaisaix31-design/OpenDashboard/actions/workflows/ci.yml)

</div>

> **How to read this page / 怎么读这页**
> English first, then the same Chinese content right after — not a summary, not a separate half. Tables keep both languages in one cell.
> 每段英文在前、同一内容的中文紧跟在后；不是摘要，也没有单独的“中文版”。表格把两种语言放进同一格。

---

## At a glance · 一眼看懂

| | |
|---|---|
| **Problem<br/>问题** | A recovery demo drifts into a claim of recovery. Nobody notices until someone asks what actually touched the machine.<br/>一个“恢复”演示会慢慢变成“已经恢复”的说法。等到有人问“到底动了机器哪里”时，才发现没人能答。 |
| **Fix<br/>做法** | A deterministic Fixture provider behind shared TypeScript contracts and a static trusted plugin registry, where provenance (`Fixture` / `Mock` / `Planned` / `Live`) is machine-readable and always visible.<br/>共享 TypeScript 契约 + 静态可信插件注册表之下的确定性 Fixture provider；来源标签（`Fixture` / `Mock` / `Planned` / `Live`）机器可读且始终可见。 |
| **Cost<br/>代价** | Node 22.12+ and npm 11; no database, no daemon, no environment variables. `npm ci` then `npm run dev`.<br/>Node 22.12+ 与 npm 11；没有数据库、没有常驻进程、不需要环境变量。`npm ci` 之后 `npm run dev`。 |
| **Not<br/>不是** | Not a production control plane, not a remote-ops platform, not an agent platform, and not a universal PC manager. There is no `Live` provider.<br/>不是生产控制中枢，不是远程运维平台，不是 Agent 平台，也不是万能电脑管理器。仓库里没有 `Live` provider。 |

## What actually exists · 现在实际有什么

This table is the whole claim. Everything outside it is either archived history or an unimplemented idea.

这张表就是全部主张。表外的东西，要么是归档历史，要么是还没实现的设想。

| Area · 范围 | Current fact · 当前事实 |
|---|---|
| Fixture flow<br/>Fixture 流程 | A runnable Chinese deterministic demo covering anomaly discovery, evidence display, human approval, result verification and a redacted report. Data, timestamps and state transitions all come from a fixed fixture.<br/>可运行的中文确定性演示：异常发现、证据展示、人工批准、结果验证、脱敏报告。数据、时间与状态转换全部来自固定 fixture。 |
| Simulated action<br/>模拟操作 | "Recovery" only mutates in-memory demo state. It does not scan the host, call a shell, restart a process or touch a Windows service.<br/>“恢复”只改变内存中的演示状态，不扫描主机、不调用 Shell、不重启进程、不修改 Windows 服务。 |
| Plugin experiment<br/>插件实验 | Shared TypeScript contracts, a compile-time trusted plugin registry with lifecycle rollback and release, and a single Fixture provider as the data source. The manifest is audit metadata, not a security sandbox.<br/>共享 TypeScript 契约、编译期可信插件注册表（含生命周期回滚与释放），以及作为唯一数据源的 Fixture provider。Manifest 是审计元数据，不是安全沙箱。 |
| Not implemented<br/>未实现 | Host probe, persistence, real process/service control, dynamic third-party plugins, plugin marketplace, WASM, remote hosts, multi-machine control.<br/>主机探针、持久化、真实进程/服务控制、动态第三方插件、插件市场、WASM、远程主机、多机控制。 |

## The problem · 问题在哪

A demo that says "recovered" is one paragraph away from a reader believing it recovered something. The fix here is structural: provenance is a type, not a footnote, and `Fixture` cannot be silently swapped for `Live`.

一个写着“已恢复”的演示，距离读者相信它真的恢复了什么，只差一段话。这里的治理是结构性的：来源是一个类型，不是脚注，`Fixture` 不能被悄悄换成 `Live`。

```text
apps/web/src/
├── pages/          Chinese console UI and the guided demo
├── components/     evidence grid, decision panel, audit trail, provider strip
├── contracts/      the contract surface the UI is allowed to read
└── demo/           deterministic fixture wiring

plugins/fixture-demo/    the only data source; no real I/O
packages/contracts/      demo + plugin contracts
packages/plugin-runtime/ static registration, dependency order, rollback, release
```

`npm run check` fails if the types stop lining up, which is the mechanism that keeps the labels honest.

一旦类型对不上，`npm run check` 就会失败——让标签保持诚实的机制就是这个。

## Capabilities · 能力清单

| Kind · 类型 | Points at · 指向 | Verify · 验证 |
|---|---|---|
| Console UI<br/>控制台界面 | `apps/web/src/pages/` — guided demo page, presentation model, Chinese copy<br/>`apps/web/src/pages/`：引导式演示页、展示模型、中文文案 | `npm run dev` |
| Provenance<br/>来源标注 | `apps/web/src/components/DemoProviderStrip.tsx` — always-visible source strip<br/>`apps/web/src/components/DemoProviderStrip.tsx`：始终可见的来源条 | `npm run typecheck` |
| Contracts<br/>契约 | `packages/contracts/src/` — demo and plugin contracts<br/>`packages/contracts/src/`：演示与插件契约 | `npm run test` |
| Plugin runtime<br/>插件运行时 | `packages/plugin-runtime/src/runtime.ts` — static registry, dependency order, rollback, release<br/>`packages/plugin-runtime/src/runtime.ts`：静态注册、依赖排序、回滚、释放 | `npm run test` |
| Fixture provider<br/>Fixture 提供者 | `plugins/fixture-demo/src/` — golden path and demo transitions, no I/O<br/>`plugins/fixture-demo/src/`：golden path 与演示状态转换，无 I/O | `npm run test` |

The repository contains 8 test files and 34 source files under the paths above; that is a file count from the tree, not a coverage claim.

上面这些路径下共有 8 个测试文件和 34 个源文件；这是从目录数出来的文件数，不是覆盖率声明。

## Quickstart · 快速开始

### Requirements · 环境要求

Node.js 22.12+ and npm 11. `package-lock.json` is the dependency source of truth, and the repository does not use pnpm.

Node.js 22.12+ 与 npm 11。依赖的事实源是 `package-lock.json`，仓库不使用 pnpm。

### 1. Install · 安装

```bash
npm ci
```

### 2. Run · 运行

```bash
npm run dev
```

### 3. Verify · 验证

```bash
npm run check         # strict typecheck, then the Node test suite, then the Vite production build
```

`check` runs strict TypeScript checking, the Node test suite and a Vite production build in that order, and stops at the first failure.

`check` 依次执行严格 TypeScript 检查、Node 测试与 Vite 生产构建，遇到第一个失败就停。

## Documentation · 文档

| Doc · 文档 | Read it when · 什么场景读 |
|---|---|
| [STATUS.md](STATUS.md) | You need the maintenance gate, the verification record and the production limits.<br/>需要维护门禁、验证记录与生产边界时。 |
| [docs/architecture/PLUGIN_FIRST_ARCHITECTURE.md](docs/architecture/PLUGIN_FIRST_ARCHITECTURE.md) | You want to know why the registry is static before any loader exists.<br/>想知道为什么在 loader 之前先做静态注册表时。 |
| [docs/architecture/decisions/0001-static-runtime-before-loader.md](docs/architecture/decisions/0001-static-runtime-before-loader.md) | You are questioning the ordering decision itself.<br/>要质疑这个顺序决策本身时。 |
| [docs/architecture/decisions/0002-local-data-plane.md](docs/architecture/decisions/0002-local-data-plane.md) | You are touching where demo data is allowed to come from.<br/>要动演示数据允许来自哪里时。 |
| [docs/verification/PLUGIN_BASELINE.md](docs/verification/PLUGIN_BASELINE.md) | You need the baseline that was actually exercised for the plugin layer.<br/>需要插件层真实跑过的基线时。 |
| [docs/research/OPEN_SOURCE_REUSE_MATRIX.md](docs/research/OPEN_SOURCE_REUSE_MATRIX.md) | You are adding an upstream dependency or comparing licences.<br/>要新增上游依赖或比较许可证时。 |
| [docs/history/competition-demo-2026-08-16.md](docs/history/competition-demo-2026-08-16.md) | You want the competition-era demo record, not current behaviour.<br/>想看比赛时期的演示记录而不是当前行为时。 |
| [docs/history/local-residual-audit-2026-09-01.md](docs/history/local-residual-audit-2026-09-01.md) | You are tracing what was cleaned up and what was left alone.<br/>要追查清理了什么、又刻意没动什么时。 |
| [docs/handoff/RESEARCH_AND_ARCHITECTURE_HANDOFF_ZH.md](docs/handoff/RESEARCH_AND_ARCHITECTURE_HANDOFF_ZH.md) | You are taking over the research and architecture thread.<br/>要接手研究与架构这条线时。 |
| [docs/LOCAL_COMPUTER_CONSOLE_PLAN.md](docs/LOCAL_COMPUTER_CONSOLE_PLAN.md) | You need the plan behind the console, clearly marked as a plan.<br/>需要控制台背后的计划，且明确它只是计划时。 |
| [tasks/local-console/README.md](tasks/local-console/README.md) | You are picking up one of the task slices.<br/>要接手其中某个任务切片时。 |
| [docs/tooling/codegraph.md](docs/tooling/codegraph.md) | You are regenerating the code graph.<br/>要重新生成代码图时。 |

History documents are for traceability. They do not describe current behaviour or current test results; the recoverable Chinese competition demo lives on the immutable tag `competition-demo-2026-08-16`.

历史文档用于追溯，不代表当前实现或当前测试结果；可恢复的中文竞赛演示保留在不可变标签 `competition-demo-2026-08-16` 上。

## Repository layout · 仓库结构

```text
apps/web/                    Chinese Fixture UI and the composition entry point
packages/contracts/          shared demo and plugin contracts
packages/plugin-runtime/     static registration, dependency order, rollback, release
plugins/fixture-demo/        deterministic fixture provider, no real I/O
docs/architecture/           current architecture decisions
docs/history/                historical snapshots, old plans, leftover classification
docs/research/               open-source reuse and licence assessment
docs/verification/           boundaries of what was actually verified
planning/                    independent planning set (planning only, not behaviour)
tasks/                       task slices for the local console
reports/                     planning reports produced alongside the tasks
```

## Status · 状态

`LAB / MAINTENANCE`. GOAI entry; it did not advance to the semifinal. H2 competition work lives on separate branches, tags and an independent repository; this `main` does not merge later H2 implementation, and unpublished local H2 fixes are not current capabilities here.

`LAB / MAINTENANCE`（实验 / 有限维护）。GOAI 参赛版本未进入复赛；H2 后续竞赛工作保留在独立分支、标签和独立仓库中；本仓库 `main` 不合入 H2 后续实现，本地未推送的 H2 修复也不算作当前能力。

Verification recorded in [STATUS.md](STATUS.md) for 2026-09-01: `npm ci` installed 28 packages from the lockfile, `npm run check` passed strict type checking plus 32/32 tests plus the production build, and a loopback smoke request returned HTTP 200. Those were branch-local results on that date; this page did not re-run them and they are not production evidence.

[STATUS.md](STATUS.md) 记录了 2026-09-01 的验证：`npm ci` 按锁文件安装 28 个包，`npm run check` 通过严格类型检查、32/32 测试与生产构建，回环冒烟请求返回 HTTP 200。那是当天的分支内结果，本页没有重跑，也不构成生产证据。

Known limits, stated rather than hidden:

边界写出来而不是藏起来：

- The approval step, audit trail and recovery result are not OS authorization, isolation, or production recovery evidence.<br/>演示中的批准、审计轨迹与恢复结果不是操作系统授权、隔离或生产恢复的证据。
- No independent threat review, fault injection or production operations validation has been done; do not use this for real recovery.<br/>未经过独立威胁评审、故障注入与生产运维验证，不得用于真实恢复操作。
- Plugins are fully trusted in-process code. There is no sandbox and no dynamic loading.<br/>进程内插件是完全可信代码，没有沙箱，也没有动态加载。
- The clone used for this rewrite is shallow (depth 1), so no argument here rests on commit history.<br/>本次改写使用的克隆是浅克隆（depth 1），因此本页没有任何结论依赖提交历史。

The single candidate milestone is PF3: an explicit opt-in, read-only, loopback-only local health adapter for user-declared targets, with no process control, shell, elevation, LAN scan or remote host. Until that is separately authorized, the project stays in limited maintenance.

唯一的候选里程碑是 PF3：在显式启用、只读、仅回环、仅针对用户明确目标的前提下实现本机健康适配器，不含进程控制、Shell、提权、LAN 扫描或远程主机。在另行授权之前，项目维持有限维护。

## License · 许可

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

Apache-2.0。见 [LICENSE](LICENSE) 与 [NOTICE](NOTICE)。
