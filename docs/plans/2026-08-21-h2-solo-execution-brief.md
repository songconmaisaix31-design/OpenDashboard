# H2 Sentinel Solo 执行任务书（唯一事实源）

> 本文件取代 `2026-08-21-h2-multi-agent-development-plan.md` 的分轨设计。
> 改为**单 agent 顺序执行**。原多轨文档里有 3 处官方口径错误，已在第 2 节修正，**以本文件为准**。
>
> 官方资料包（外部、只读、严禁入库）：
> `C:\Users\DW\Desktop\T03_设备故障排查与智能运维助手\T03_设备故障排查与智能运维助手\企业资料包04_雷动`
> 下称 `$PACK`，时序与标签在 `$PACK\数据与材料\`。

---

## 1. 基线（已核实，勿重复调研）

分支 `competition/h2-sentinel`，HEAD `e435705`。

已对齐官方的部分（**不要动**）：

- `SUBMISSION_COLUMNS` 16 列与 `17_submission_template.csv` 完全一致。
- `ANOMALY_SUBTYPES_BY_CODE` 的 11 个 code/subtype 组合与官方 350 条标签完全一致。
- `PRIMARY_IMPACT_METRIC_BY_CODE` 的 7 个指标字段名与需求书完全一致。
- 六个必需页面均已真实实现（overview / events / diagnosis / analysis / assistant / reports）。

未对齐的部分（**本次工作范围**）：

| 项 | 官方要求 | 当前实现 |
|---|---|---|
| 时序字段 | 69 个官方名 | `contracts.py` 硬编码 10 个自造内部名 |
| 导入上限 | 测试集 172,800 行 / 74.3 MiB | `MAX_CSV_ROWS=100_000`、`MAX_CSV_BYTES=5 MiB` |
| 检测器 | C01–C07 | 仅 C03、C04 |
| 影响量化 | 7 类 | 仅 2 类，其余抛 `ImpactUnavailable` |
| severity | 中文「高/中」 | 全部硬编码 `"high"` |
| 证据链 | 台账/约束/曲线/报警/操作/检修/正常工况 | 七张表一张都没读 |
| 运维助手 | Q01–Q10 中文 | H2Q01–H2Q10 英文罐头 |

数据实测规模：训练集 226.0 MiB / 525,600 行 / 69 列；测试集 74.3 MiB / 172,800 行 / 69 列。
`00_变量中文描述与数据字典.csv` 共 163 行覆盖全部文件，其中 timeseries 段 69 行，
已核对与三个时序 CSV 表头**完全一致，无差集**。

---

## 2. 官方口径修正（对 350 条标签全量统计得出，直接查表，不要建模）

原多轨文档这 3 点是错的：

### 2.1 severity 完全由 code 决定

统计 `04_train_event_labels.csv` + `05_validation_event_labels.csv` 全 350 条，无一例外：

```
C01 -> 中     C02 -> 高     C03 -> 高     C04 -> 高
C05 -> 高     C06 -> 中     C07 -> 高
```

写常量表。**不要**做严重度推断模型。当前代码硬编码的英文 `"high"` 必须改成中文枚举。

### 2.2 `affected_equipment` 用标签 token，不是 equipment_master 的 ID

原文档说用 `08_equipment_master.csv` 的 `equipment_id`（`BESS01`/`PCC01`/`ELZ01`）——**错**。
官方标签实际 token 是 `BESS`、`PCC`、`PV`、`ELZ`、`ELZ1`、`ELZ2`、`ELZ3`，逗号分隔无空格。
五类是恒定值，只有 C01/C02 随涉事机组变化：

```
C03 -> BESS,PCC                 （恒定）
C04 -> PCC,BESS,ELZ,PV          （恒定）
C05 -> PCC,BESS,ELZ             （恒定）
C06 -> ELZ1,ELZ2,ELZ3           （恒定）
C07 -> BESS,PCC,PV,ELZ          （恒定）
C02 -> 单台，取值 ELZ1|ELZ2|ELZ3（按实际降额机组）
C01 -> <涉事槽1>,<涉事槽2>,BESS,PCC（两台振荡槽，顺序按涉事程度）
```

`equipment_master.csv` 只用于页面设备语义展示，**不得进 submission**。

### 2.3 `primary_control_object` / `root_cause` / `recommended_action` 每个 code 唯一

全 350 条里，这三列按 code 分组后各自只有 1 种取值。全部查表，原样输出官方中文。

`primary_control_object` 官方值：

```
C01 EMS电解槽群控与功率分配模块
C02 EMS设备状态与容量同步模块
C03 EMS储能功率控制与接口映射模块
C04 EMS并网点功率边界控制模块
C05 EMS周期电量配额与日内能量计划模块
C06 EMS电解槽群控分配模块
C07 EMS储能SOC计划与调节备用管理模块
```

`root_cause` / `recommended_action` 从 `04_train_event_labels.csv` 每个 code 取首行原文即可。

### 2.4 知识库不要做 RAG

`15_knowledge_base.md` 只有 195 字符、5 句符号约定。当约束常量用，不要建检索层。

---

## 3. 影响指标公式（官方字典原文，直接落地，不要自创口径）

| code | 指标字段 | 官方公式 |
|---|---|---|
| C01 | `bess_extra_regulation_energy_kwh` | `Σ|异常储能功率-参考基线储能功率|×1/60` |
| C02 | `unserved_elz_energy_kwh` | `Σmax(0,电解槽指令-实际功率)×1/60` |
| C03 | `abnormal_grid_exchange_energy_kwh` | `Σ|异常PCC功率-参考PCC功率|×1/60` |
| C04 | `pcc_power_limit_violation_energy_kwh` | `Σ(上网越限量+下网越限量)×1/60` |
| C05 | `grid_energy_quota_deviation_kwh` | `max(上网配额超出量,下网配额超出量)` |
| C06 | `extra_energy_consumption_kwh` | `异常分配耗电量-参考高效分配耗电量` |
| C07 | `bess_regulation_reserve_shortfall_kwh` | `max(0,调节备用目标-实际可用备用能量)` |

C04/C05 有现成派生列可直接求和：`pcc_export_power_violation_kw`、`pcc_import_power_violation_kw`、
`grid_export_energy_quota_excess_kwh`、`grid_import_energy_quota_excess_kwh`。
C06 用 `10_electrolyzer_efficiency_curves.csv`（12 行、4 档负荷率）插值。
C07 用 `bess_regulation_reserve_target_kwh` 与 `bess_available_charge/discharge_energy_kwh` 比较。

参考量级（训练集首例，用于 sanity check，非评分依据）：
C01≈247.456、C02≈1220.771、C03≈227.307、C04≈3641.348、C05≈7484.721、C06≈66.96、C07≈339.474。

---

## 4. 执行顺序（阻塞项先行，逐步提交）

### S1 放开导入上限，改流式解析（最高优先，当前官方测试集直接被拒收）

`ingestion/csv_loader.py` 现在 `import_csv(filename, text: str)` 接收已解码全文，
再 `text.encode()` 复制一份做体积检查，再 `list(reader)` 全量物化——74 MiB 输入会有三份峰值。

改为逐行流式：按行迭代 + 增量校验，内存占用与文件大小解耦。
`MAX_CSV_BYTES` 提到 >= 250 MiB、`MAX_CSV_ROWS` 提到 >= 600,000，保留全部安全校验
（NUL 拒收、表头去重、文件名白名单、时区必填）。
`api/app.py:81` 的 `Content-Length` 上限同步放开。

**完成标准**：`03_test_timeseries.csv`（172,800 行）与 `01_train_timeseries.csv`（525,600 行）均导入成功，无 missing_fields。

### S2 69 字段动态化

删除 `contracts.py` 的 10 字段硬编码 `FIELD_DEFINITIONS`，改为从字典 CSV 编译出的
`fields.json` 动态构建（中文名、单位、符号方向、枚举、公式、关联异常码）。
内部自造名 (`bess_power_kw` / `bess_dispatch_command_kw` / `pcc_power_kw` /
`pcc_export_limit_kw` / `pcc_import_limit_kw` / `bess_soc_percent` /
`auxiliary_load_kw` / `total_electrolyzer_power_kw`) 全部废弃，替换为官方名
(`bess_power_actual_kw` / `bess_power_cmd_kw` / `pcc_power_actual_kw` /
`grid_export_power_limit_kw` / `grid_import_power_limit_kw` / `bess_soc_pct` /
`aux_load_kw` / `ems_total_elz_target_kw`)。

注意内部名在 6 处重复出现，一处不改就会漏：Python 契约、`packages/h2-contracts/src/fixtures.ts`、
golden JSON、fixture CSV 表头、`plugins/h2-ems` fixture series、`model/chart-options.ts`。

### S3 官方口径查表

按第 2 节把 severity / control_object / affected_equipment / root_cause /
recommended_action 全部改成官方中文查表输出。

### S4 删除指纹硬编码分支（合规风险，必须清）

`impact/calculators.py` 对 C03 有一条按数据集指纹返回常量 `112.4` 的分支；
`csv_loader.py` 也按指纹钉住 `datasetId` 与 `generatedAt`。
需求书对测试集明确要求「不得人工标注或硬编码答案」，这段容易被评委误读。改为纯计算。

**S1–S4 完成即里程碑**：官方测试集可跑通全链路并导出格式合法的 submission.csv，
即使检测仍只有 2 类。**先到这一步再往下做。**

### S5 检测器补全 C01/C02/C05/C06/C07

规则优先，`events/aggregator.py` 的 `POLICIES` 覆盖 7 类。
`detection/lightgbm_adapter.py` 已有但未接线，作为可选路径，模型产物不入库。

C05/C07 官方 `detection_expectation` 要求**提前预警**，其余为「事件开始后 10 分钟内发现」——
聚合窗口的 `confirmation_row` 要按这个区分。

不得仅凭 `system_alarm_count` 判定异常（需求书 T03 明文禁止）。
`13_train_validation_normal_context.csv`（77 条合理工况）用于压误报。

### S6 影响量化补全

按第 3 节公式实现 5 类，删除 `ImpactUnavailable` 兜底。

### S7 证据链接入

`diagnosis/builder.py` 现在只读时序行 + 硬编码 `EVENT_METADATA`。接入
`08_equipment_master` / `09_control_constraints` / `10_efficiency_curves` /
`11_alarm_log`(2460) / `12_operation_log`(77) / `14_maintenance_history`(5) /
`13_normal_context`(77)。证据至少含时间、变量、实际值、参考值或限值（T06）。
`safety/evaluator.py` 补全 7 类规则，不再返回 `unknown`。

### S8 中文运维助手

`assistant/service.py` 改用 `16_assistant_questions.csv` 的官方 Q01–Q10 中文原文，
保留「事实/计算/建议」分类与 `refusedControlClaim`。前端 `AssistantPage` 问题 ID 同步。

### S9 PCC 合规日报

`reports/renderer.py` 的 `period_summary` 补：功率边界区间、越限时长与电量、
符号约定、数据集指纹、约束、未决事件。

### S10 验证集评估

事件级 Precision/Recall/F1 + 分类准确率，跑 `02_validation_timeseries.csv` 对
`05_validation_event_labels.csv`（70 事件）。

---

## 5. 硬性约束

- **禁止**把 `$PACK` 的数据文件入库（单文件最大 226 MiB）。只读，路径用环境变量。
- **禁止**构造「电解槽健康度」字段（需求书明文禁止，官方不提供该属性）。
- **禁止** force-push、`git reset --hard`、`git clean`、历史改写。
- 符号约定不得改：PCC 正值上网/负值下网；储能正值放电/负值充电。
- 安全边界不得越：仅建议、需人工确认、不闭环下发；不得突破 SOC 20–90%、
  PCC 功率与电量约束、单台电解槽 300–1000 kW、爬坡 120 kW/min。
- 代码/注释/提交信息用英文；UI 与报告用中文。
- 每个 S 步骤完成且自测通过即 commit，前缀 `h2(backend)` / `h2(frontend)` / `h2(qa)`。
  只 add 自己改的路径，**绝不 `git add -A`**（仓库有未提交的 `.gitignore` 改动与规划文档）。

## 6. 验证命令

```
cd services/h2-analytics && .venv/Scripts/python.exe -m pytest    # 现有 32 条须保持全绿
npm run typecheck
npm run h2:test
npm run h2:check
```

不得声称未实际运行过的检查已通过。

