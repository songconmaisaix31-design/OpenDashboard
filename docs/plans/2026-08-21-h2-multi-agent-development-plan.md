# H2 Sentinel 多 Agent 并行开发规划

> 目标：在**不改动官方数据口径**的前提下，把 H2 Sentinel 从「C03/C04 Fixture 演示」补齐为
> 满足《弱并网绿电制氢 EMS 功率协调异常诊断与运行辅助 Web 应用》T01–T14 的可评测作品。
>
> 本文档是**分配与边界**的单一事实源。执行 agent 只读本文档 + 官方资料包 + 自己名下的目录。
>
> - 规划/分配/审查/联调：deepseek pro（本文档作者）
> - 执行：opencode 子 agent，模型 deepseek flash
> - 一人一轨一屏：每个轨道一个 opencode 会话，绑死自己的分支
> - 轨道隔离：按**目录所有权**分工，改的文件集合互不相交
> - commit 即存档：每个功能点完成即 commit + push

---

## 0. 基线（所有人从同一 SHA 出发）

1. 执行前由规划方确认 `origin/main` 当前 SHA（`git fetch && git rev-parse origin/main`），记为 `BASE`。
2. 每个轨道从 `BASE` 切出自己的分支，**禁止互相合并到对方分支**，只向自己的分支 commit/push。
3. 官方资料包路径（外部、只读、不入库）：
   `C:\Users\DW\Desktop\T03_设备故障排查与智能运维助手\T03_设备故障排查与智能运维助手\企业资料包04_雷动`
   本规划以环境变量 `H2_PACK` 指代它，`数据与材料/` 在其下。

---

## 1. 目录所有权表（零冲突面）

| 轨道 | 分支 | 独占目录（可写） | 只读目录 | 禁止写入 |
|---|---|---|---|---|
| V 词表/基座 | `h2/track-vocab` | `packages/h2-vocabulary/**`（新建） | `$H2_PACK/**` | 其余全部 |
| B 后端 | `h2/track-backend` | `services/h2-analytics/**` | `packages/h2-vocabulary/**`、`$H2_PACK/**` | 前端/契约/脚本/文档 |
| F 前端+契约 | `h2/track-frontend` | `apps/web/src/features/h2-sentinel/**`、`packages/h2-contracts/**`、`plugins/h2-ems/**` | `packages/h2-vocabulary/**` | 后端/脚本/文档 |
| Q 校验/联调基座 | `h2/track-qa` | `tests/h2-sentinel/**`、`scripts/h2-sentinel/**`、`validation/**`（新建） | `packages/h2-vocabulary/**`、`$H2_PACK/**` | 业务源码 |
| D 文档 | `h2/track-docs` | `submission/h2-sentinel/**`、`docs/**`（H2 相关页） | 全部 | 代码 |

> 冲突面为 0 的关键：**唯一共享物是只读的 `packages/h2-vocabulary/**`**，Phase 0 冻结后任何轨道不得改它。
> 若确需改，必须：升 `data/version.json` 版本号 → 通知规划方 → pro 重新过闸 → 各轨道自行升级读取。

---

## 2. Phase 0 — 词表基座（阻塞，单 agent，先做）

**轨道 V**，模型 flash，分支 `h2/track-vocab`。

**任务**：把官方资料包里的**口径**编译为唯一的机器可读词表，冻结为 v1。

从 `$H2_PACK/数据与材料/` 读取（只读）：
- `00_变量中文描述与数据字典.csv` → `data/fields.json`（69 个官方变量：英文名=规范名、中文名、分类、类型、单位、正负号、枚举、公式、关联异常码）
- `04_train_event_labels.csv` + `05_validation_event_labels.csv` → `data/anomaly-taxonomy.json`（C01–C07 的 `primary_control_object`、`primary_impact_metric`、`affected_equipment` 取值、subtype、严重度取值「高/中」）
- `08_equipment_master.csv` → `data/equipment.json`
- `09_control_constraints.csv` → `data/constraints.json`
- `10_electrolyzer_efficiency_curves.csv` → `data/efficiency-curves.json`
- `16_assistant_questions.csv` → `data/assistant-questions.json`（Q01–Q10，中文）
- `15_knowledge_base.md` → `data/knowledge-base.md`（原样入库存档）

**关键决策（写入 README 并作为字段规范）**：
- **官方字段名为唯一规范名**（`bess_power_actual_kw`、`bess_power_cmd_kw`、`pcc_power_actual_kw`、`grid_export_power_limit_kw`、`grid_import_power_limit_kw`、`bess_soc_pct`、`aux_load_kw`、`ems_total_elz_target_kw` …）。
- 现有内部名一律**废弃**：`bess_power_kw`、`bess_dispatch_command_kw`、`pcc_power_kw`、`pcc_export_limit_kw`、`pcc_import_limit_kw`、`bess_soc_percent`、`auxiliary_load_kw`、`total_electrolyzer_power_kw`。
- 在 `data/deprecated-field-map.json` 里给出「废弃内部名 → 官方规范名」映射表（供 B/F 迁移用）。
- 严重度用中文枚举 `["高","中"]`；`primary_control_object` 用官方中文描述（如「EMS储能功率控制与接口映射模块」）；`affected_equipment` 用 `08_equipment_master.csv` 的 `equipment_id`/`equipment_name`。
- 不构造「电解槽健康度」字段。

**产出**：`packages/h2-vocabulary/data/*.json`、`data/version.json`（`{"schemaVersion":1}`）、`README.md`（含字段命名规范与废弃映射说明）。

**完成标准**：`version.json` 存在；`fields.json` 含 69 字段；`anomaly-taxonomy.json` 覆盖 C01–C07 及 subtype；JSON 可由 `python -m json.tool` 与 `node -e "require(...)"` 解析。

**闸口（pro 审查）**：规划方检查字段映射表与 taxonomy 取值口径，通过后才放行 Phase 1。此闸口是全场最关键的决策点。

---

## 3. Phase 1 — 三轨并行（V 过闸后启动）

### 3.1 轨道 B（后端，Python）`h2/track-backend`

只写 `services/h2-analytics/**`。读 `packages/h2-vocabulary/**` 时用 loader（`vocabulary.py`，按仓库根解析 + `H2_VOCABULARY_DIR` 环境变量覆盖）。

| 步骤 | 内容 | 完成标准（各自 commit + push） |
|---|---|---|
| B1 | 官方字段接入：`contracts.py`/`models.py`/`ingestion/csv_loader.py` 改为按 `fields.json` 动态构建 69 字段；`FIELD_DEFINITIONS` 硬编码删除。**同时放宽导入上限**：`MAX_CSV_ROWS` 与 `MAX_CSV_BYTES` 需容纳官方 172,800 行×69 列（当前 100k/5MiB 会拒收官方测试集），改为流式或提高到 >= 525,600 行、>= 120 MiB 的配置，并保持安全校验。 | 导入官方 `01_train_timeseries.csv` 无 missing_fields；quality 报告正常 |
| B2 | 官方取值口径：severity 中文「高/中」、`primary_control_object` 官方中文、`affected_equipment` 对齐 `equipment.json`；`submission.py` 输出改用官方口径。 | `submission.csv` 的 severity/object/equipment 与官方标签一致 |
| B3 | 检测补全：`detection/` 新增 C01/C02/C05/C06/C07 检测器（规则优先；LightGBM 适配器作为可选，模型产物不入库或不依赖）；`events/aggregator.py` 的 `POLICIES` 覆盖 7 类。 | 训练集/验证集上能产出 7 类事件，与 `04/05_event_labels` 可比 |
| B4 | 影响量化补全：`impact/calculators.py` 按官方字典公式实现 C01/C02/C05/C06/C07（现有 7 个指标字段已声明，补齐计算，删除 `ImpactUnavailable` 兜底路径）。 | 7 类事件均产出 `primary_impact_metric` + `estimated_impact_value` |
| B5 | 证据接入：新增读取 `equipment_master`/`control_constraints`/`efficiency_curves`/`alarm_log`/`operation_log`/`maintenance_history`/`normal_context`，接入 `diagnosis/builder.py` 证据链；`safety/evaluator.py` 补全 7 类安全规则（不再返回 `unknown`）。 | 单事件诊断含时间/变量/实际值/参考值/限值证据 |
| B6 | 中文运维助手：`assistant/service.py` 改为基于 `assistant-questions.json` + `knowledge-base.md` 的中文回答，保留「事实/计算/建议」分类与 `refusedControlClaim`。 | Q01–Q10 中文回答，带引用 |
| B7 | 报告：`reports/renderer.py` 增加 PCC 合规日报（含功率边界区间、越限时长/电量、符号约定、数据集指纹、约束、未决事件）。 | period_summary 报告含上述内容 |

**完成标准**：`services/h2-analytics` 下 `pytest` 全绿；用官方训练/验证数据跑通「导入→质量→7 类检测→事件聚合→诊断→影响→建议→submission.csv」。

### 3.2 轨道 F（前端 + TS 契约）`h2/track-frontend`

只写 `apps/web/src/features/h2-sentinel/**`、`packages/h2-contracts/**`、`plugins/h2-ems/**`。读 `packages/h2-vocabulary/**`。

| 步骤 | 内容 | 完成标准 |
|---|---|---|
| F1 | `packages/h2-contracts/src/vocabulary.ts` 读取词表 JSON；TS 类型与 `src/fixtures.ts`、schema 迁移到官方字段名；`plugins/h2-ems` Fixture 数据改官方字段名（保持 golden path 测试不变）。 | `typecheck` 通过；无废弃内部名残留 |
| F2 | 总览/分析/事件/诊断页按 `fields.json` 显示 69 个官方变量的中文名与单位；severity/对象/设备用 taxonomy 中文口径渲染。 | 页面展示官方中文名与单位 |
| F3 | 运维助手页问题列表改 Q01–Q10 中文；诊断详情/报告页中文口径对齐。 | 助手页中文问题可点击 |
| F4 | 图表时间轴/边界线/SOC 轨迹/电量配额展示；窄屏（390×844）无溢出；保持 composition-only（不 `fetch`、不算公式）。 | `npm run build` + h2 特性测试通过 |

**完成标准**：`npm run typecheck`、h2 特性测试、`npm run build` 全绿；Fixture 与 Live 共用同一官方 schema。

### 3.3 轨道 Q（校验/联调基座）`h2/track-qa`

只写 `tests/h2-sentinel/**`、`scripts/h2-sentinel/**`、`validation/**`。

| 步骤 | 内容 | 完成标准 |
|---|---|---|
| Q1 | `validation/` 官方验证集评估脚本：加载 `02_validation_timeseries.csv` + `05_validation_event_labels.csv`，算事件级 Precision/Recall/F1 与分类准确率（T04）。 | 脚本可复现输出 F1 |
| Q2 | submission 格式校验：字段名、UTF-8 编码、severity/object/equipment 口径、`requires_human_confirmation` 布尔。 | 校验脚本通过，可被评分脚本读取 |
| Q3 | 一键启动与 e2e：`launch.mjs` 官方测试集冒烟；干净环境 `npm ci` → 启动 → 导入 → 导出。 | 一键启动成功导出 submission.csv |
| Q4 | 补充合同/QA 用例，覆盖官方字段与 7 类事件。 | `npm run h2:check` 全绿 |

**完成标准**：`npm run h2:check` + `h2:qa` + `h2:launcher:test` + `h2:smoke` 全绿。

### 3.4 轨道 D（文档，可全程并行）`h2/track-docs`

只写 `submission/h2-sentinel/**`、`docs/**`。任务：据实更新产品/架构叙事、演示脚本、评委清单，**不夸大已实现能力**；补充「实现/规划/待办」边界表。完成标准：`validate-submission.ps1` 通过。

---

## 4. Phase 2 — 联调与终审（deepseek pro，单会话）

分支 `h2/integrate`。按序合入 `track-vocab → track-backend → track-frontend → track-qa → track-docs`，逐次解决跨轨只读词表的读取口径差异。

1. 全量验证：`npm run typecheck`、`npm run test`、`npm run build`、`npm run check`、`npm run h2:check`。
2. 官方测试集端到端：导入 `03_test_timeseries.csv` → 检出 → 诊断 → 导出 `submission.csv`（16 列、官方口径）。
3. 校验：`validation/` F1 报告、`git diff --check`、无废弃内部字段名残留、无「健康度」构造、安全边界声明（仅建议、需人工确认、不闭环）。
4. 文档据实复核，确认无过度声明。

---

## 5. 提交纪律（commit 即存档）

- 每个轨道在每个 `B#/F#/Q#/V` 步骤完成且自测通过后：`git add <自己目录> && git commit -m "h2(<track>): <步骤>" && git push -u origin <branch>`。
- 提交信息前缀：`h2(vocab)`、`h2(backend)`、`h2(frontend)`、`h2(qa)`、`h2(docs)`、`h2(integrate)`。
- 禁止：force-push、历史改写、`git reset --hard`、`git clean`、把 `$H2_PACK` 大文件或 `.env`/凭据入库。
- 每个轨道只 `add` 自己名下的路径，**绝不 `git add -A`**。

---

## 6. 风险与对策

| 风险 | 对策 |
|---|---|
| 词表 JSON 形状被下游误解 | Phase 0 冻结 + version 戳；B/F 固定读取 v1；变更须升版本 + pro 重新过闸 |
| 官方字段改名是跨 B/F 的破坏性变更 | 单一 `deprecated-field-map.json` 映射；B、F 各自迁移自己目录，联调时用 Q 的校验脚本兜底 |
| 官方数据集规模 > 当前导入上限（100k 行 / 5 MiB） | B1 必改上限/流式；Q3 用官方测试集冒烟验证 |
| severity/object/equipment 口径与评分脚本不一致 | B2 对齐官方标签；Q2 提前校验，反馈 B |
| 只读词表路径跨语言解析脆弱 | `vocabulary.py`（仓库根解析 + env 覆盖）+ `vocabulary.ts`（TS `resolveJsonModule`）各写各的访问器 |

---

## 7. 验收对照（对资料包）

| 资料包要求 | 承担轨道 |
|---|---|
| T01 数据导入与口径识别 | V（口径）+ B1（解析） |
| T02 数据质量检查与预处理 | B1 |
| T03 异常事件检测 | B3 |
| T04 异常分类与子类型 + 严重度 | B2/B3 + Q1 |
| T05 控制对象与受影响设备定位 | V（taxonomy）+ B2 |
| T06 根因分析与证据链 | B5 |
| T07 影响量化 | B4 |
| T08 安全运行建议 | B7 + 既有 safety 边界 |
| T09 Web 应用实现 | 已有 + F |
| T10 可视化与事件交互 | F |
| T11 运维助手 | B6 + F3 |
| T12 报告与结构化导出 | B7 + Q2 |
| T13 部署复现与依赖管理 | Q3 |
| T14 安全边界与合规声明 | 既有 + D 据实复核 |
| 最低六页面 / 离线部署 / 一键启动 / 中文变量 / 导出 | F / Q3 / F2 / B7 |

---

## 8. 执行入口（约定）

每个轨道一个 opencode 会话，先 `git checkout -b <分支> BASE`，再以本文件对应小节为唯一任务书开工。
- 模型：deepseek flash（执行轨道）
- 模型：deepseek pro（Phase 0 闸口审查、Phase 2 联调终审）
