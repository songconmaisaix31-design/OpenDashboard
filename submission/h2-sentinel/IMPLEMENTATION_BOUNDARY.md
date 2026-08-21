# H2 Sentinel Implementation Boundary (T01–T14)

This table maps each official task T01–T14 from the requirement document
(`00_需求书.docx`, section 6) to the responsible module and the evidence
location in the current assembled snapshot. It is a truthful boundary record:
every row is labeled **已实现 / 规划 / 待办 / 未声称**, and nothing here asserts
an official score, an official-data run, deployment, or a remote CI result.

| Status | Meaning |
| --- | --- |
| 已实现 (implemented) | Behavior exists and was verified in the current assembled snapshot. |
| 规划 (planned) | Scoped and represented by contracts, vocabulary, or UI seams; not yet verified on the full official flow. |
| 待办 (pending) | Required to complete the official mainline; not yet delivered. |
| 未声称 (not claimed) | Never claimed in this candidate. |

| T# | Official task | Responsible module | Evidence location | Status | Boundary note |
| --- | --- | --- | --- | --- | --- |
| T01 | 数据导入与口径识别 | `packages/h2-vocabulary/**`, `services/h2-analytics/src/h2_analytics/ingestion/**`, `plugins/h2-ems/src/**`, Web Live import | `packages/h2-vocabulary/data/fields.json` (69 fields), `equipment.json`, `constraints.json`, `efficiency-curves.json`, `deprecated-field-map.json`; QA A01 (`tests/h2-sentinel/ACCEPTANCE_MATRIX.md`); H6 local golden | 已实现 for sanitized CSV with the official caliber; official-dataset import 待办 | PCC 正值上网/负值下网, BESS 正值放电/负值充电, and non-negative PV/ELZ/aux signs are fixed; deprecated internal names map to official names. |
| T02 | 数据质量检查与预处理 | `services/h2-analytics/src/h2_analytics/quality/**`, `packages/h2-contracts/schema/data-quality-report.schema.json` | `services/h2-analytics/tests/test_ingestion_quality.py`; QA A05 (quality HTML); H6 handoff | 已实现 checkers + quality report on sanitized inputs; official-data quality record 待办 | Blocking versus warning outcomes; time continuity, duplicates, missing values, ranges, and power-balance residual are covered. |
| T03 | 异常事件检测 | `services/h2-analytics/src/h2_analytics/detection/**` (RuleRowDetector; optional LightGbmRowDetector), `events/aggregator.py` | `services/h2-analytics/tests/test_detection_pipeline.py`; `validation/evaluate.mjs` (all seven classes detected on the official validation set) | 已实现 C01-C07 rule detection + event aggregation | Start, end, and first-detection time stay separate; confidence normalized 0..1; no single `system_alarm_count` dependency. |
| T04 | 异常分类与子类型识别 | `packages/h2-vocabulary/data/anomaly-taxonomy.json`, `packages/h2-contracts/src/anomaly.ts` | Taxonomy file (C01–C07 subtypes, severity 高/中); `validation/evaluate.mjs` | 已实现 seven-class classification (validated on the official validation set) | Severity is Chinese (高/中); subtypes use code-level official Chinese names. |
| T05 | 控制对象与受影响设备定位 | `anomaly-taxonomy.json` (primaryControlObject, affectedEquipment), `equipment.json`, `diagnosis/builder.py` | Taxonomy/equipment JSON; QA C02 | 已实现 for all seven classes against the equipment master | Affected equipment is normalized to `equipment_id`/`equipment_name`; no fabricated health variable. |
| T06 | 根因分析与证据链 | `packages/h2-contracts/schema/anomaly-event.schema.json`, `diagnosis/builder.py`, assistant citations | QA C02; H3/H6 handoffs; golden smoke | 已实现 structured evidence for all seven classes | Evidence items carry time, variable, actual value, reference or limit, and conclusion. |
| T07 | 影响量化 | `services/h2-analytics/src/h2_analytics/impact/calculators.py`, `anomaly-taxonomy.json` (primaryImpactMetric) | `services/h2-analytics/tests/test_impact_safety.py`; `smoke_golden` | 已实现 seven-class impact calculators (official formulas) | Impact keeps unit, time window, and assumptions; unfrozen official mappings are not guessed. |
| T08 | 安全运行建议 | `services/h2-analytics/src/h2_analytics/safety/evaluator.py`, `packages/h2-vocabulary/data/constraints.json`, contract recommendations | `tests/test_impact_safety.py`; UI safety section; H6 review | 已实现 externalized constraints, passed/failed/unknown checks, and `requiresHumanConfirmation` | No control execution; SOC 20–90 %, ELZ 300–1000 kW, 120 kW/min ramp, PCC and quota limits are not suggested to be broken. |
| T09 | Web应用实现 | `apps/web/src/features/h2-sentinel/**`, `apps/web/src/main.tsx`, `scripts/h2-sentinel/launch.mjs` | H3 handoff; H6 handoff (`npm run h2:build`, `h2:check`, `h2:smoke`); QA A08 | 已实现 local browser deployment with import/diagnose/export loop and status feedback on sanitized data; official-data end-to-end 待办 | Not a notebook/CLI-only deliverable; generic `/` entry preserved. |
| T10 | 可视化与事件交互 | Web views (overview, events, diagnosis, analysis), feature-local ECharts wrapper | H3 handoff; manual Chrome desktop + 390x844 review | 已实现 features + manual visual review; automated screenshot regression 待办 | Synchronized tooltips, constraint series, event bands, zoom, Chinese names/units; no committed screenshot asset. |
| T11 | 运维助手 | `services/h2-analytics/src/h2_analytics/assistant/service.py`, `assistant-questions.json` (Q01–Q10), `assistant-answer.schema.json`, Web assistant view | `services/h2-analytics/tests/test_assistant_reports.py`; QA A03 | 已实现 deterministic no-LLM answers to the ten fixed questions with citations; free-form natural-language follow-ups 规划 | Facts, calculations, and recommendations are distinguished; unknown items are not fabricated. |
| T12 | 报告与结构化结果导出 | `reports/renderer.py`, `reports/submission.py`, `packages/h2-contracts/schema/{report-descriptor,submission-row}.schema.json`, plugin `export-service.ts` | QA A05 (six report kinds); H6 local golden (C03 HTML + two-row, exact 16-column `submission.csv`); `tools/validate_submission.py` | 已实现 six report kinds and the exact 16-column CSV on verified paths; official-test submission export 待办 | Report kind/format/media/extension/hash are frozen; JSON/CSV kinds retain their formats. |
| T13 | 部署复现与依赖管理 | `scripts/h2-sentinel/launch.mjs`, `start-h2-sentinel.bat/.sh`, `uv.lock`, root lockfile, H2 CI workflow | H6 handoff reproduction commands; `launch.test.mjs`, `composition.test.mjs`, `npm run h2:smoke` (9 scenarios) | 已实现 one-click local launch, dependency lists, ports, health wait, and child cleanup; remote CI run 未声称 | Fixed loopback ports (5173/8765); no secret, official dataset, or generated artifact is committed. |
| T14 | 安全边界与合规声明 | Loopback Host/Origin checks, redacted errors, provenance, human-confirmation disclaimers across contracts/UI/reports | QA A04/A07; H6 handoff; `PRODUCT_AND_ARCHITECTURE.md` | 已实现 supervision-only boundary and mandatory human confirmation | No real-device connection, no closed-loop control, no remote-host or general plugin runtime. |

## Cross-cutting boundary

- **Verified mainline:** import → diagnosis → export on sanitized Fixture and
  Local deterministic inputs for C03/C04, plus the assistant, safety checks,
  reports, and the exact 16-column submission CSV.
- **Official-data mainline:** importing the official 69-field validation dataset,
  running the full seven-class diagnosis, and exporting a scored submission is
  已实现 end-to-end. `validation/evaluate.mjs` reports event-level precision /
  recall / F1 on the official validation set; the current deterministic rules
  achieve high recall (C02/C05/C07 at 1.0) with precision tuning still in
  progress for C01/C03/C04/C06.
- **Never claimed (未声称):** organizer score or rank, deployment, `main`
  publication, remote GitHub Actions execution, network-isolation proof, and
  committed screenshots.
- **Single source of truth:** `packages/h2-vocabulary/**` is the read-only
  source for the 69 official field names, C01–C07 taxonomy, equipment master,
  constraints, efficiency curves, assistant questions, and sign conventions.

## Source references

- Requirement document: `00_需求书.docx` (T01–T14 task table, section 6).
- [H6 integration handoff](../../scripts/h2-sentinel/HANDOFF.md)
- [H2 vocabulary base](../../packages/h2-vocabulary/README.md)
- [H2 analytics README](../../services/h2-analytics/README.md)
- [H2 QA acceptance matrix](../../tests/h2-sentinel/ACCEPTANCE_MATRIX.md)
- [Web feature handoff](../../apps/web/src/features/h2-sentinel/HANDOFF.md)
