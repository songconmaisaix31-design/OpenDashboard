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

## 3. D4 离线部署冒烟（官方测试集全量）

```bash
node scripts/h2-sentinel/offline-deploy-smoke.mjs --official-data "<官方数据目录>"
```

实测流程（`validation/reports/offline-deploy-smoke.json`，2026-08-22）：

| 步骤 | 结果 |
| --- | --- |
| 规范化（69 官方列通过、时间戳转 ISO UTC） | 通过，172,800 行 |
| 导入 `03_test_timeseries.csv`（单次请求） | 通过，rowCount=172,800，约 5.2s |
| 分析（`datasets:analyze`） | 通过，566 个预测事件，约 4.3s |
| 导出 submission.csv（566 行，16 列，UTF-8） | 通过 |
| D3 格式校验（`validation/check-submission.mjs`） | **blocked**：566 行全部因 `affected_equipment` 为 `ELZ01:碱性电解槽1;...` 的 equipment-master 格式，非官方逗号 token 格式（见第 5 节跨轨缺陷） |

导出产物（gitignored）：`scripts/h2-sentinel/artifacts/submission-testset.csv`。
证据报告：`validation/reports/offline-deploy-smoke.json`。

## 4. 故障排查

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `Vite is unavailable. Run npm ci before starting H2 Sentinel.` | 根目录 `node_modules` 缺失 | `npm ci` |
| `uv is required for local mode; install uv and sync the locked dev environment.` | 未安装 uv 或 `services/h2-analytics` 未 sync | 安装 uv（0.6+）；launcher 自动 `uv run --locked --extra dev` |
| `Analytics health check timed out` | 服务未在时限内返回规范健康包；端口被占用/环境损坏 | 检查端口占用；确认 `/health` 返回规范 envelope；调大 `--health-timeout-ms` |
| `Web readiness timed out` | Vite 未在时限内就绪 | 确认 `npm ci` 完成；`--web-runtime preview` 需先 `npm run h2:build` |
| 端口被占用 | 残留进程 | `taskkill /PID <pid> /T /F`（Windows）或换端口；launcher 停机时已做进程树清理 |
| `datasets:import` 409 `quality.blocked` | 列不齐 69 官方字段 / 时间戳未规范化 / 重复时间戳 / 越限数值 | 先跑 `validation/evaluate.mjs` 的规范化路径（`normalizeOfficialCsv`）；检查表头与 `fields.json` 无差集 |
| 提交文件格式校验失败 | 见第 5 节跨轨缺陷 | 由协调方修复后端导出，D 轨重新出报告 |

## 5. 跨轨缺陷记录（提交格式阻塞）

- **现象**：后端 `submissions:export` 导出的 `affected_equipment` 为
  `ELZ01:碱性电解槽1;PCC01:并网点;...`（equipment-master 的 `id:名称`，分号连接）。
- **官方口径**：`docs/plans/2026-08-21-h2-solo-execution-brief.md` §2.2 —— 官方标签
  （04/05，350 条）的 token 是 `BESS,PCC,PV,ELZ,ELZ1,ELZ2,ELZ3`，**逗号分隔无空格**；
  `equipment_master.csv` 不得进 submission。
- **责任文件**（冻结区/他轨）：`services/h2-analytics/src/h2_analytics/reports/submission.py`
  （`;`.join `id:displayName`）、`diagnosis/builder.py`（affectedEquipment 取自 taxonomy 的 equipmentId）。
- **请求**：协调方将导出改为官方逗号 token（C01/C02 的涉事机组按事件填充），D 轨复核后
  `offline-deploy-smoke` 的 verdict 方可转绿。

## 6. 复现命令汇总

```bash
npm ci
npm run h2:check                                    # D 轨门禁
node validation/evaluate.mjs --mode local --official-data "<dir>"            # D1 验证集 F1
node validation/overfit-sentinel.mjs --official-data "<dir>"                 # D2 过拟合哨兵
node validation/check-submission.mjs <submission.csv>                        # D3 格式校验
node scripts/h2-sentinel/offline-deploy-smoke.mjs --official-data "<dir>"    # D4 部署冒烟
```
