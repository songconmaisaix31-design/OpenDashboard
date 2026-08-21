# H2 官方词表基座（packages/h2-vocabulary）

本包把官方资料包 `企业资料包04_雷动` 的口径编译为唯一机器可读词表，作为后续
Analytics、Plugin、Web、QA、Submission 等轨道的只读共享契约。数据不包含大
CSV，只包含小文件（字典、事件标签统计、台账、约束、效率曲线、问答、知识库）。

## 文件清单

| 文件 | 内容 | 条目数 |
| --- | --- | --- |
| `data/version.json` | 包版本与来源 | 1 |
| `data/fields.json` | 时序变量字段字典（官方规范名） | 69 |
| `data/anomaly-taxonomy.json` | C01–C07 异常分类学 | 7 |
| `data/equipment.json` | 设备台账（08 全量字段） | 8 |
| `data/constraints.json` | 控制约束（09 全量字段） | 12 |
| `data/efficiency-curves.json` | 电解槽效率曲线（10 全量字段） | 12 |
| `data/assistant-questions.json` | Q01–Q10 固定问题 | 10 |
| `data/knowledge-base.md` | 知识库（原样复制） | 1 |
| `data/deprecated-field-map.json` | 废弃旧名 → 规范名映射 | 8 |

## 约定（下游轨道必须遵守）

- **官方字段名为唯一规范名**。`fields.json[].name` 与官方
  `00_变量中文描述与数据字典.csv` 逐行对应，禁止沿用
  `bess_power_kw`、`pcc_power_kw`、`bess_soc_percent` 等旧内部名。
- **严重度用中文**：`anomaly-taxonomy.json` 中 `severity` 取「高」或「中」
  （依据事件标签统计：C01/C06=中，其余=高），不使用英文枚举。
- **`primaryControlObject` 用官方中文**，例如「EMS储能功率控制与接口映射模块」。
- **`affectedEquipment` 用设备台账的 `equipment_id` / `equipment_name`**，
  事件标签中的短码（PCC/BESS/PV/ELZ1/ELZ2/ELZ3/ELZ）按如下规则归一化到台账：
  `PV→PV01`、`BESS→BESS01`、`PCC→PCC01`、`ELZ1→ELZ01`、`ELZ2→ELZ02`、
  `ELZ3→ELZ03`、`ELZ→ELZ01/02/03`。
- **不构造「电解槽健康度」字段**。官方包没有该变量，任何轨道不得虚构。
- `isDerived` 为布尔值（`是→true`，`否→false`）；`relatedAnomaly` 为数组，
  空值对应空数组。
- 子类型（`subtypes`）的 `nameZh` 沿用代码级官方中文名（官方包未提供
  子类型级独立中文名）。

## 废弃旧名 → 规范名速查表

| 废弃内部名 | 官方规范名 | 备注 |
| --- | --- | --- |
| `bess_power_kw` | `bess_power_actual_kw` | 储能实际功率 |
| `bess_dispatch_command_kw` | `bess_power_cmd_kw` | 储能功率指令 |
| `pcc_power_kw` | `pcc_power_actual_kw` | PCC实际有功功率 |
| `pcc_export_limit_kw` | `grid_export_power_limit_kw` | 上网功率上限 |
| `pcc_import_limit_kw` | `grid_import_power_limit_kw` | 下网功率上限 |
| `bess_soc_percent` | `bess_soc_pct` | 储能实际SOC |
| `auxiliary_load_kw` | `aux_load_kw` | 制氢辅助负荷功率 |
| `total_electrolyzer_power_kw` | 无（官方未单列） | 推导：`elz1_power_actual_kw + elz2_power_actual_kw + elz3_power_actual_kw` |

## 再生成

`tools/generate_vocabulary.py` 从官方资料包重新编译全部输出。输入文件为只读，
本包不复制大 CSV。
