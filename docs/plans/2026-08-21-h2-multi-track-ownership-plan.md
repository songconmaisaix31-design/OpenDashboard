# H2 Sentinel 多轨并行执行计划（目录所有权制）

> 本文件是**分工与边界**的唯一事实源，取代 `2026-08-21-h2-multi-agent-development-plan.md`
> （该文档描述的五轨已于 `d9ef9cd` 全部执行完毕，不再是待办）。
> 口径事实以 `2026-08-21-h2-solo-execution-brief.md` 第 2、3 节为准，本文件不重复。
>
> 协调方（本 agent）：只做规划、闸口审查、Wave 0 串行改动、最终集成。不代写各轨业务代码。
> 执行方：每轨一个独立会话 + 独立 worktree + 独立分支，**只准改自己名下路径**。
> 禁止跨轨指挥：A 轨会话不得被要求修改 B 轨文件，需要对方改动时提 issue 给协调方。

---

## 0. 基线

- 主干：`competition/h2-sentinel` @ `a0ec948`（已验证 typecheck 干净 / `h2:test` 67 通过 / pytest 34 通过）。
- 所有轨道从 `a0ec948` 的**后继** Wave 0 提交切出，不从 `a0ec948` 直接切（见第 1 节）。
- 官方资料包 `$PACK`（只读、严禁入库，单文件最大 226 MiB）：
  `C:\Users\DW\Desktop\T03_设备故障排查与智能运维助手\T03_设备故障排查与智能运维助手\企业资料包04_雷动`

### 当前真实短板（不是功能缺失，是检测精度）

69 官方字段、C01–C07 检测器、7 类影响公式、中文口径、放开的导入上限**均已落地**。
验证集实测 `validation/reports/evaluate-local.json`：

```
overall  tp=53  fp=366  fn=17   precision=0.1265  recall=0.7571  f1=0.2168
预测 419 条 / 真值 70 条        过报集中在 C01(175) C06(120) C04(77)
分码 F1  C02=1.00  C07=0.87  C05=0.69  C04=0.16  C03=0.13  C06=0.12  C01=0.08
```

已抢救的调参实验 `1cf780c`（分支 `songconmaisaix31-design/h2-track-tune`）实测 **F1 0.6359**
（precision 0.4960 / recall 0.8857 / 125 条预测），但**打破 4 个 pytest**，且 C04 600 kW、
C06 390–410 kW 两处阈值疑似验证集过拟合。该分支是 A 轨的输入素材，不是可直接合并的成果。

---

## 1. Wave 0 — 协调方串行前置（阻塞，不并行）

这四件事**必须由协调方在主干上串行做完**，原因只有一个：它们每一件都横跨两条以上轨道的文件，
放进任何一轨都会立刻制造跨轨改动。做完即冻结，各轨从 Wave 0 末尾提交切分支。

| 编号 | 内容 | 为什么不能下发给某一轨 |
|---|---|---|
| W0-1 | 修 `validation/evaluate.mjs` 的 `--limit-days`：现在只截断预测（`chunks.slice(0, limitDays)`），真值仍读全量 `05_validation_event_labels.csv`，导致 3 天快跑报出 `f1=0.0682 / fn=67` 的假信号。改为真值按同一日期窗过滤。 | 这是 A 轨唯一的快速反馈回路，但文件归 D 轨。任何一方单独改都是跨轨。 |
| W0-2 | 解开 golden fixture 与检测阈值的死锁：`tiny-valid-timeseries.csv` 只有 22 行、C04 越限幅度仅 `720-500=220 kW`，一旦 A 轨抬高 C04 阈值，golden 立刻不触发，连带打断 `test_api` / `test_assistant_reports` / `test_contract_validation` / `test_detection_pipeline`（`1cf780c` 已实证）。把 fixture 的越限与振荡幅度放大到任何合理阈值都必然触发的量级，重算 `golden-c03.json` / `golden-c04.json`。 | 该 fixture 被 Python / TS / mjs 共 20 个文件消费，横跨 A、C、D 三轨。 |
| W0-3 | 清掉硬编码合规风险：`impact/calculators.py` 按数据集指纹返回常量 `112.4` 的分支、`csv_loader.py` 按指纹钉住 `datasetId`/`generatedAt`、`tools/smoke_golden.py` 硬断言 `112.4` 与 `29.333333333333332`。改为纯计算。需求书对测试集明文要求「不得人工标注或硬编码答案」。 | 涉及 A 轨的 impact、协调方冻结的 ingestion/tools、以及 W0-2 的 golden 数值，三者必须一次改完。 |
| W0-4 | 拆 `tests/test_impact_safety.py` 为 `test_impact.py`（→ A 轨）与 `test_safety.py`（→ B 轨）。 | 该文件同时覆盖 impact（A）与 safety（B），不拆就是天然共享文件。 |
| W0-5 | 在冻结的 `service.py` 里把默认检测器改为经 A 轨名下的 `detection.default_row_detector()` 工厂解析，不再直接 `RuleRowDetector()`。 | A 轨要换默认检测器就得改 `service.py`，而它是四轨交叉点。留一个工厂钩子，A 轨此后永不需要碰编排层。 |
| W0-6 | 建 4 个 worktree + 分支，装齐 `node_modules` 与 `.venv`。 | 环境准备。 |

**Wave 0 完成标准**：`pytest` 全绿、`npm run h2:check` 全绿、`node validation/evaluate.mjs --limit-days 3`
的真值数量随窗口缩小而下降、仓库内 `grep -r "112\.4"` 只剩注释或报告快照。

### Wave 0 执行结果（已完成，2026-08-21）

主干 `competition/h2-sentinel` 上四个提交，四轨从 `09ed2a3` 切出：

| 提交 | 内容 |
|---|---|
| `d9ef9cd` 合入 | 基线并入主干（按用户决策：先合再切） |
| `857dadb` | W0-2 + W0-3，另修两个被掩盖的历史缺陷（见下） |
| `24bb7a4` | W0-4 拆测试文件 + W0-5 检测器工厂缝 |
| `09ed2a3` | W0-3 收尾：C03 的 `112.4` 改为可复算的 `17.333333333333332` |

W0-1 在基线合入时已随 `d9ef9cd` 落地，实测 `--limit-days 3` 真值降到 3（原为全量 70）。

**Wave 0 期间发现的两个既有缺陷**（不在原计划内，但必须记录，因为它们说明了「测试通过」不等于「功能可用」）：

1. `run-contract-qa.mjs` 仍读迁移前的字段名（`bess_dispatch_command_kw` 等），`Number(undefined)`
   得到 `NaN`，断言永假。而该套件是 assembled 套件的前置闸门 —— 所以 assembled 五项检查
   **从未真正执行过**。一个会 gate 别人的失败套件，会把下游全部藏起来。
2. 助手问题 ID 跨层分叉：官方口径与 Python 侧是 `Q01`–`Q10`，而 TS 契约 / schema / 前端 /
   fixture 用的是本地加前缀的 `H2Q01`–`H2Q10`；Live 适配器原样转发，因此 Local 模式下
   **每一次 `assistant:ask` 都失败**（`assistant.invalid_question`）。它被双重掩盖：上面第 1 条
   挡住了 assembled 套件，而 `test_contract_validation.py` 的 `_relax_official_values()`
   在校验前把 schema 的 `questionId` 枚举改写成官方值。已统一到官方 ID 并删掉该项放宽。

C03 的 `112.4` 同样不是笔误而是**编造值**：`impact-c03-v1` 的口径是「窗内 PCC 中位数为基线、
积分绝对偏差」，contracts fixture 的 C03 窗口（10:20–10:41，22 采样）中位数 590 kW、
偏差和 1040 kW·min，故为 `1040/60 = 17.333333333333332 kWh`。`112.4` 只来自 `857dadb`
删掉的指纹分支。它能长期存活的原因是覆盖缺口：`golden-fixtures.test.ts` 只对 C04 做了
CSV 反算、没有 C03 的对应项，而 `assertGoldenEvidenceMatchesCsv` 对非 `measurement`
证据直接 early-return，承载影响值的 `derived_metric` 证据从不参与比对。现已补上 C03 反算测试。

**M0 判据实测**：pytest 42 passed；`h2:check` 全绿（typecheck / h2:test 68 / h2:qa 5+5 /
h2:launcher:test 9 / h2:build）；`--limit-days 3` 真值 = 3；`112.4` 在代码路径中归零。
四个 worktree 各自跑通本轨自测命令（A/B pytest、C typecheck + h2:test、D h2:qa）。
视觉验收仍为 `MANUAL_REQUIRED`（未引入浏览器自动化依赖）。

### 各轨 worktree 与分支（W0-6 已完成）

| 轨 | 分支 | worktree 路径 |
|---|---|---|
| A | `h2/track-a-detect` | `C:\Users\DW\orca\workspaces\OpenDashboard\h2-track-a-detect` |
| B | `h2/track-b-evidence` | `C:\Users\DW\orca\workspaces\OpenDashboard\h2-track-b-evidence` |
| C | `h2/track-c-web` | `C:\Users\DW\orca\workspaces\OpenDashboard\h2-track-c-web` |
| D | `h2/track-d-qa` | `C:\Users\DW\orca\workspaces\OpenDashboard\h2-track-d-qa` |

四者均已 `npm ci`（31 包）与 `uv sync --extra dev --frozen`，开箱可跑自测。

**`$PACK` 路径更正**：官方 CSV **不在**资料包根目录，而在其 `数据与材料` 子目录下。
根目录只有说明文档（`00_需求书.docx`、`02_应用交付与验收要求.md`、SHA256 清单等）。A / D 轨
读数据时须用：

```
$PACK/数据与材料/01_train_timeseries.csv          525600 行
$PACK/数据与材料/02_validation_timeseries.csv     129600 行
$PACK/数据与材料/03_test_timeseries.csv           172800 行
$PACK/数据与材料/04_train_event_labels.csv           280 事件
$PACK/数据与材料/05_validation_event_labels.csv       70 事件
$PACK/数据与材料/06_train_row_labels.csv          525600 行
$PACK/数据与材料/13_train_validation_normal_context.csv  77 条
```

行数已实测，与需求书一致（上表为去表头后的数据行数）。

---

## 2. 目录所有权表（冲突面为零）

四轨并行。**一个路径只有一个主人**，表外路径默认冻结。

| 轨 | 名称 | 分支 | 模型 | 独占可写路径 |
|---|---|---|---|---|
| A | 检测与影响 | `h2/track-a-detect` | 强（推理密度最高） | `services/h2-analytics/src/h2_analytics/detection/**`<br>`services/h2-analytics/src/h2_analytics/impact/**`<br>`services/h2-analytics/src/h2_analytics/events/**`<br>`services/h2-analytics/tests/test_detection_pipeline.py`<br>`services/h2-analytics/tests/test_impact.py`<br>`services/h2-analytics/training/**`（新建） |
| B | 证据与叙事 | `h2/track-b-evidence` | 中 | `services/h2-analytics/src/h2_analytics/diagnosis/**`<br>`services/h2-analytics/src/h2_analytics/safety/**`<br>`services/h2-analytics/src/h2_analytics/assistant/**`<br>`services/h2-analytics/src/h2_analytics/reports/**`<br>`services/h2-analytics/src/h2_analytics/evidence.py`<br>`services/h2-analytics/tests/test_assistant_reports.py`<br>`services/h2-analytics/tests/test_safety.py` |
| C | 前端与契约 | `h2/track-c-web` | 基础 | `apps/web/src/features/h2-sentinel/**`<br>`packages/h2-contracts/src/**`<br>`packages/h2-contracts/test/**`<br>`plugins/h2-ems/**` |
| D | 校验与交付 | `h2/track-d-qa` | 基础 | `validation/**`<br>`tests/h2-sentinel/**`<br>`scripts/h2-sentinel/**`<br>`submission/h2-sentinel/**`<br>`docs/competition/**`（交付对照表） |

`docs/plans/**` 归协调方，不归 D 轨：本文件是分工事实源，若 D 轨可改，就等于 D 轨能单方面
改写别轨的边界。D 轨的 D5 只写 `submission/h2-sentinel/**` 与 `docs/competition/**`。
`services/h2-analytics/HANDOFF.md` 同理归协调方（它描述四轨合并后的整体状态）。
`tools/coordination/**` 亦归协调方（闸口脚本，见下）。

### 所有权闸口（机械校验，不靠自觉）

上表原先只是文字约定，违规要等到集成才暴露——那是最贵的发现时机。现在有脚本：

```bash
node tools/coordination/check-track-ownership.mjs                      # 四轨全查
node tools/coordination/check-track-ownership.mjs --branch h2/track-a-detect
```

它对每条轨分支列出相对 Wave 0 基线（`09ed2a3`）的改动文件，逐个比对该轨的独占路径，
越界即非零退出；同时拒绝任何情况下都不得入库的路径（`$PACK` 官方 CSV、模型产物、
`.env`、凭据文件）。已做反向验证：把基线换成 `857dadb` 后能正确报出协调方那批越界改动，
且对仓库现有 286 个已跟踪文件零误报——一个从未拒绝过任何东西的闸口等于没有闸口。

### 全员冻结区（任何轨不得改，需改动先提 issue 给协调方）

```
services/h2-analytics/src/h2_analytics/service.py      ← 编排层，四轨都会想改，故谁都不许改
services/h2-analytics/src/h2_analytics/contracts.py    settings.py    models.py
services/h2-analytics/src/h2_analytics/api/**           ingestion/**   quality/**
services/h2-analytics/src/h2_analytics/vocabulary.py    tools/**
services/h2-analytics/tests/conftest.py                 tests/fixtures/**
services/h2-analytics/tests/test_api.py  test_contract_validation.py  test_ingestion_quality.py
packages/h2-contracts/fixtures/**    packages/h2-contracts/schema/**
packages/h2-vocabulary/**            package.json   pyproject.toml   .gitignore
```

冻结区在 Wave 0 结束时定版。`service.py` 之所以进冻结区，是因为它同时调用 A 轨的
detector/impact 与 B 轨的 diagnosis/safety/assistant/reports——它是唯一天然的四轨交叉点，
只有把它冻住，A 与 B 才能真正互不相干。

---

## 3. 轨内任务拆解（每项完成即 commit）

### 轨 A — 检测与影响（主攻 F1，路线：混合 ML 打候选 + 规则出证据）

唯一硬指标：验证集事件级 F1 从 0.2168 提到 **≥ 0.60**，且 precision ≥ 0.45。

| 步 | 任务 | 完成标准 |
|---|---|---|
| A1 | 读 `1cf780c` 的 diff 作为素材，但**逐条重新论证阈值**。C03 的「指令/实际符号与 PCC 符号交叉校验」逻辑合理，保留；C04 的 600 kW、C06 的 390–410 kW 必须换成由 `06_train_row_labels.csv` 统计分布推导的阈值，并在代码注释里写出推导依据（分位数、样本量）。 | 每个阈值旁有一行注释给出训练集依据；不得出现无来源的整数常量 |
| A2 | 训练候选打分器：`training/` 下写脚本，特征取官方 69 字段的窗口统计，标签取 `06_train_row_labels.csv` 的 code。产物写 `services/h2-analytics/models/`（`.gitignore` 已排除，**不得入库**），脚本本身入库以满足 T13 可复现。 | `python -m h2_analytics.training.fit` 可从 `$PACK` 重跑出模型；日志记录样本量与各类占比 |
| A3 | 接线 `LightGbmRowDetector`：经 W0-5 的 `default_row_detector()` 工厂，模型存在则 ML 打候选、规则层做证据与二次确认；模型缺失则纯规则回退。**回退路径必须可用**，因为评委环境不保证有模型产物。 | 有模型 / 无模型两条路径都能跑通全链路；`detector_version` 能区分两者 |
| A4 | 压误报：用 `13_train_validation_normal_context.csv`（77 条合理工况）做负样本门。C01/C06/C04 三码过报量降到各 ≤ 30。 | 分码预测数与真值数（各 10）同量级 |
| A5 | `events/aggregator.py` 的 `POLICIES` 按官方 `detection_expectation` 区分：C05/C07 要求提前预警，其余为「事件开始后 10 分钟内发现」，`confirmation_row` 按此设定。 | 7 类各自的 confirmation 语义在注释中对应官方要求 |
| A6 | 影响量化按 solo brief 第 3 节公式核对 7 类，去掉 W0-3 之后残留的任何兜底常量。 | 7 类都产出 `estimated_impact_value`，量级与训练集首例参考值同阶 |

约束：不得仅凭 `system_alarm_count` 判异常（T03 明文禁止）。不得构造「电解槽健康度」（需求书明文禁止）。

### 轨 B — 证据与叙事（主攻 T06/T08/T11/T12 的可审查性）

| 步 | 任务 | 完成标准 |
|---|---|---|
| B1 | `diagnosis/builder.py` 接入七张官方表：`08_equipment_master`、`09_control_constraints`、`10_efficiency_curves`、`11_alarm_log`(2460)、`12_operation_log`(77)、`14_maintenance_history`(5)、`13_normal_context`(77)。 | 单事件诊断证据含**时间、变量、实际值、参考值或限值**四要素（T06） |
| B2 | 报警只作证据、不作判据：`11_alarm_log` 的记录进证据链但不参与 is_anomaly 判定，代码注释写明。 | 有注释与测试断言 |
| B3 | `safety/evaluator.py` 补全 7 类规则，不再返回 `unknown`；每条建议标注人工确认、调整对象、优先顺序、前置条件。 | 7 类都产出分步建议；不越 SOC 20–90%、PCC 功率与电量约束、单槽 300–1000 kW、爬坡 120 kW/min |
| B4 | `assistant/service.py` 用 `16_assistant_questions.csv` 的官方 Q01–Q10 中文原文，回答区分「事实/计算/建议」，保留 `refusedControlClaim`，无法确认时明说、不编造测点。 | Q01–Q10 中文可答且带引用 |
| B5 | `reports/renderer.py` 的 PCC 合规日报补：功率边界区间、越限时长与电量、符号约定、数据集指纹、约束、未决事件。 | period_summary 含上述六项 |

约束：知识库 `15_knowledge_base.md` 仅 195 字符 5 句符号约定，当常量用，**不要建 RAG 检索层**。

### 轨 C — 前端与契约（主攻 T09/T10 六页面与中文口径）

| 步 | 任务 | 完成标准 |
|---|---|---|
| C1 | 六个必需页面按 `packages/h2-vocabulary` 的 `fields.json` 渲染 69 个官方变量的**中文名与单位**，全站不得出现互相矛盾的中文名。 | 页面显示官方中文名与单位 |
| C2 | 符号约定强制显示：PCC 标「正值上网、负值下网」，储能标「正值放电、负值充电」。 | 两处文案在图表与详情页均可见 |
| C3 | 图表时间轴一致、可筛选缩放；PCC 功率边界线、SOC 目标轨迹、电量配额三类专用视图；事件可定位到原始证据行。 | 事件详情能跳到证据时间点 |
| C4 | 窄屏 390×844 无横向溢出；保持 composition-only（前端不 `fetch`、不算公式）。 | `npm run build` 与 h2 特性测试通过 |
| C5 | 安全边界文案：任何建议标「需人工确认」，明示应用不闭环下发（T14）。 | 诊断与报告页可见 |

### 轨 D — 校验与交付（主攻 T12/T13 与防过拟合裁判）

D 轨是**唯一有权宣布 F1 数字的轨**，A 轨自测数字不作准。

| 步 | 任务 | 完成标准 |
|---|---|---|
| D1 | 固化评估口径：事件级 Precision/Recall/F1 + 分类准确率，跑 `02_validation_timeseries.csv` 对 `05_validation_event_labels.csv`（70 事件）。输出写 `validation/reports/`。 | 报告可复现，含分码明细 |
| D2 | **过拟合哨兵**：额外用训练集后 90 天（`01_train_timeseries.csv` 的 2025-10-03 起）对 `04_train_event_labels.csv` 跑同一评估。若验证集 F1 与该窗 F1 差距 > 0.15，报告标红并通知协调方。 | 两个窗口的 F1 同时报出 |
| D3 | submission 格式校验：16 列字段名与 `17_submission_template.csv` 一致、UTF-8、severity 为中文「高/中」、`affected_equipment` 为逗号无空格 token、`requires_human_confirmation` 布尔。 | `validation/check-submission.mjs` 通过 |
| D4 | 一键启动与离线部署复现：干净环境 `npm ci` → 启动 → 导入 `03_test_timeseries.csv`（172,800 行）→ 导出 submission.csv。写端口说明与故障排查。 | 冒烟脚本全绿 |
| D5 | 据实更新 `submission/h2-sentinel/**` 与 `docs/**`：实现/规划/待办三分边界表，**不夸大**。 | 无过度声明 |

---

## 4. 提交与验证纪律

每轨在自己的 worktree 里：

```bash
git checkout -b h2/track-<x>-<name> <WAVE0_SHA>
# ... 一个功能点做完并自测通过 ...
git add <只加自己名下路径>          # 绝不 git add -A
git commit -m "h2(track-<x>): <功能点>"
git push -u origin h2/track-<x>-<name>
```

- 提交信息前缀：`h2(track-a)` / `h2(track-b)` / `h2(track-c)` / `h2(track-d)`。
- 代码与注释、提交信息用英文；UI 与报告用中文。
- 禁止 force-push、`git reset --hard`、`git clean`、历史改写。
- 禁止把 `$PACK` 数据文件、模型产物、`.env`、凭据入库。
- 各轨自测命令：
  - A / B：`cd services/h2-analytics && .venv/Scripts/python.exe -m pytest`
  - C：`npm run typecheck && npm run h2:test`
  - D：`npm run h2:check`
- **不得声称未实际运行过的检查已通过。**

### 跨轨需求的唯一合法通道

发现需要改冻结区或别轨文件时：**停手**，在自己轨的 commit message 或 `docs/plans/` 之外
不留改动，把需求报给协调方。协调方判定后，要么自己在主干串行改（进入下一个 Wave 0 式窗口），
要么指派给该文件的主人。任何轨不得「顺手」改一下对方的文件。

---

## 5. 集成（协调方，单会话）

合入顺序按依赖倒序，冲突面最小者最后：

```
A（检测/影响） → B（证据/叙事） → C（前端/契约） → D（校验/交付）
```

A 先合是因为它决定 detector_version 与影响数值，B 的证据链、D 的评估报告都以它为输入。
D 最后合，这样它的评估报告与边界表反映的是最终合并态。

集成后全量验证：

```bash
cd services/h2-analytics && .venv/Scripts/python.exe -m pytest
npm run typecheck && npm run test && npm run build
npm run check && npm run h2:check
node validation/evaluate.mjs                    # 事件级 F1，含 D2 过拟合哨兵
```

终审对照需求书逐项过：T01–T14、六个必需页面、离线部署、一键启动、中文变量展示、
结构化导出（16 列 submission.csv）、诊断报告导出。逐项标注「已实现 / 部分 / 未做」，
不夸大。最后确认：无「健康度」构造、无硬编码答案、无 `$PACK` 数据入库、
安全边界声明完整（仅建议、需人工确认、不闭环下发）。

---

## 6. 里程碑

| 里程碑 | 内容 | 判据 |
|---|---|---|
| M0 ✅ | Wave 0 完成，四轨开工 | pytest + h2:check 全绿；`--limit-days` 真值随窗过滤；无 `112.4` 硬编码 —— 已于 `09ed2a3` 达成，实测见第 1 节 |
| M1 | A4 完成 | 验证集 F1 ≥ 0.60 且 precision ≥ 0.45，由 D 轨复核 |
| M2 | B3 + B5 完成 | 7 类安全建议无 `unknown`；PCC 合规日报六项齐 |
| M3 | C4 + D4 完成 | 六页面中文口径 + 390×844 无溢出；官方测试集一键跑通导出 |
| M4 | 集成终审 | 全量验证绿 + T01–T14 逐项据实对照表 |

M1 是全场风险最高的一步：F1 从 0.2168 到 0.60 靠的不是加规则，而是压 C01/C06/C04 的过报，
且不能靠验证集调参换取分数——D2 哨兵就是为此设的。
