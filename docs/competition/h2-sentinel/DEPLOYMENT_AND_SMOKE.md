# H2 Sentinel 离线部署冒烟与端口说明（Track D，D4）

> 唯一事实源为协调方的 `docs/plans/` 任务书；本文件只记录 D 轨实测结果与排查指引。
> 所有路径为仓库内相对路径，官方数据包（`$PACK`）只读、不入库。

## 1. 一键启动

```bash
npm ci                 # 干净环境复现（D4 前置步骤，安装根依赖与锁文件）
node scripts/h2-sentinel/launch.mjs --mode local
# 或使用仓库根的一键脚本：start-h2-sentinel.bat / .sh
```

launcher 负责：校验环境 → 启动 loopback analytics 进程（uv 托管）→ 启动 Vite
Web → 轮询 `/health` 与页面就绪 → 打印 READY → 优雅停机。

## 2. 端口说明

| 端口 | 角色 | 说明 |
| --- | --- | --- |
| `5173` | Web（默认） | Vite dev server，仅绑定 `127.0.0.1`；`--web-port` 可改，`--strictPort` 冲突即失败 |
| `8765` | Analytics（默认） | FastAPI 服务，仅绑定 `127.0.0.1`；`--analytics-port` 可改 |
| 任意空闲端口 | 自动分配 | 测试脚本（`validation/evaluate.mjs`、`offline-deploy-smoke.mjs`）用 `freeLoopbackPort()` 动态分配，互不冲突 |

端口占用时报错示例（launcher 实测行为）：

```
[H2 Sentinel] Web port 5173 is already in use on 127.0.0.1. Choose another web port.
[H2 Sentinel] Analytics port 8765 is already in use on 127.0.0.1. Choose another analytics port.
```

## 3. Historical offline smoke and Epoch 4 technical evidence

The 2026-08-22 offline-smoke entry that reported 566 predicted events and an
`affected_equipment` format blocker is historical. It is not a current
Epoch 4 blocker, a current official-run result, or a deployment verdict.

The sanitized attempt-6 technical record is bound to executable SHA
`58090bc1747d621bc87d698259319a70c34e75f2` and records:

- raw input: 77,865,257 bytes, 172,800 rows, 69 fields, SHA-256
  `88f3a5c15fb5c42d265475f2998fe9f6c271dcef16f43daee7626f6704504cd9`;
- normalized input: 78,038,054 bytes, SHA-256
  `4407495ad75299f2f8f06112f6d3209eb93b2773ff3f0c797c47874159853169`;
- 104 events, a 104-by-16 submission, 21 series with 172,800 points each,
  and a passed cleanup status;
- report SHA-256
  `8796dd1f9e9baca3dad0711c6fb74ccca40485874527a5ef0e2323a9111bf27f` and
  attempt-6 `submission.csv` SHA-256
  `af8814d3e428ef1470a43e0a07d4d6dcdc79585846841a15778fff8c91d60326`.

That evidence is technical only. It does not establish organizer submission,
receipt, acceptance, official score, deployment code-SHA binding, or visual
verification. This document intentionally contains no command that reruns the
official CSV.

## 4. 故障排查

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `Vite is unavailable. Run npm ci before starting H2 Sentinel.` | 根目录 `node_modules` 缺失 | `npm ci` |
| `uv is required for local mode; install uv and sync the locked dev environment.` | 未安装 uv 或 `services/h2-analytics` 未 sync | 安装 uv（0.6+）；launcher 自动 `uv run --locked --extra dev` |
| `Analytics health check timed out` | 服务未在时限内返回规范健康包；端口被占用/环境损坏 | 检查端口占用；确认 `/health` 返回规范 envelope；调大 `--health-timeout-ms` |
| `Web readiness timed out` | Vite 未在时限内就绪 | 确认 `npm ci` 完成；`--web-runtime preview` 需先 `npm run h2:build` |
| 端口被占用 | 残留进程 | `taskkill /PID <pid> /T /F`（Windows）或换端口；launcher 停机时已做进程树清理 |
| `datasets:import` 409 `quality.blocked` | 列不齐 69 官方字段 / 时间戳未规范化 / 重复时间戳 / 越限数值 | 先跑 `validation/evaluate.mjs` 的规范化路径（`normalizeOfficialCsv`）；检查表头与 `fields.json` 无差集 |
| 提交文件格式校验失败 | Inspect the current validator result and its exact artifact hash | Do not overwrite historical attempt evidence; route any code defect to its owner |

## 5. Historical cross-track defect record

The earlier 566-row `affected_equipment` export finding is retained as a
point-in-time diagnostic record only. It must not be presented as an active
Epoch 4 blocker. The current attempt-6 record instead describes a 104-by-16
submission and a passed cleanup status. Track D does not re-evaluate or modify
the frozen implementation that produced either record.

## 6. Current non-official verification boundaries

```bash
npm ci
npm run h2:check
npm run h2:smoke
powershell.exe -NoProfile -ExecutionPolicy Bypass -File submission/h2-sentinel/scripts/validate-submission.ps1
```

Observed deployment transport evidence is limited to deployment
`dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf`, hostname
`h2-sentinel-hxrbu0wan-dwwww.vercel.app`, and custom domain `204421.xyz`.
Root, fixture with and without a trailing slash, local, and invalid-mode routes
returned HTTP 200 SPA shells; static assets contained H2, invalid-mode, and
Chinese markers. Those checks are neither visual nor interactive proof and do
not bind the deployment to the tested executable SHA.
