# H2 Sentinel Implementation Boundary (T01–T14)

This table maps each official task T01–T14 from the requirement document
(`00_需求书.docx`, section 6) to the responsible module and the evidence
location in the current assembled snapshot. It is a truthful boundary record:
every row is labeled **已实现 / 规划 / 待办 / 未声称**, and nothing here asserts
an official score, deployment, or a remote CI result.

| Status | Meaning |
| --- | --- |
| 已实现 (implemented) | Behavior exists and was verified in the current assembled snapshot. |
| 规划 (planned) | Scoped and represented by contracts, vocabulary, or UI seams; not yet verified on the full official flow. |
| 待办 (pending) | Required to complete the official mainline; not yet delivered. |
| 未声称 (not claimed) | Never claimed in this candidate. |

## Verified evaluation snapshot (Track D, 2026-08-22)

Official validation-set run on branch `h2/track-d-qa` (baseline `09ed2a3`),
reproducible with `node validation/evaluate.mjs --mode local --official-data <dir>`:

- **Validation set** (`02_validation_timeseries.csv` vs `05_validation_event_labels.csv`,
  70 events): event-level **F1 = 0.2168** (precision 0.1265, recall 0.7571,
  tp=53 fp=366 fn=17); detection-only recall 0.9714; classification accuracy
  (code-correct among temporally detected events) 0.3088; event accuracy 0.3000.
  Report: `validation/reports/evaluate-validation.json`.
- **Overfit sentinel** (last 90 days of `01_train_timeseries.csv` from
  2025-10-03 vs `04_train_event_labels.csv`, 63 events): F1 = 0.2489.
  Gap |0.2168 − 0.2489| = 0.0321 ≤ 0.15 → **GREEN, no overfit signal**.
  Report: `validation/reports/overfit-sentinel.json`.
- Fixture golden smoke (C03/C04, padded to the 69-field schema at import
  time): F1 = 1.0. Report: `validation/reports/evaluate-fixture.json`.

These are **validation-set results under Track D's frozen event-level matching
contract, not the organizer score**.

| T# | Official task | Responsible module | Evidence location | Status | Boundary note |
| --- | --- | --- | --- | --- | --- |
| T01 | 数据导入与口径识别 | `packages/h2-vocabulary/**`, `services/h2-analytics/src/h2_analytics/ingestion/**`, `plugins/h2-ems/src/**`, Web Live import | `packages/h2-vocabulary/data/fields.json` (69 fields), `equipment.json`, `constraints.json`, `efficiency-curves.json`, `deprecated-field-map.json`; D4 smoke (`validation/reports/offline-deploy-smoke.json`) imported the full 172,800-row test set | 已实现 for official 69-field CSV (172,800 rows in one import); no missing fields | PCC 正值上网/负值下网, BESS 正值放电/负值充电, non-negative PV/ELZ/aux signs fixed; deprecated internal names map to official names. |
| T02 | 数据质量检查与预处理 | `services/h2-analytics/src/h2_analytics/quality/**`, `packages/h2-contracts/schema/data-quality-report.schema.json` | `services/h2-analytics/tests/test_ingestion_quality.py`; D4 smoke quality gate passed for the test set | 已实现 checkers + quality report; official-set quality record 待办 | Blocking versus warning outcomes; duplicates, missing values, ranges, and power-balance residual are covered. |
| T03 | 异常事件检测 | `services/h2-analytics/src/h2_analytics/detection/**` (RuleRowDetector; optional LightGbmRowDetector), `events/aggregator.py` | `services/h2-analytics/tests/test_detection_pipeline.py`; `validation/evaluate.mjs` (all seven classes on the official validation set, detector `deterministic-c01-c07-v2`) | 已实现 C01-C07 rule detection + aggregation; **detection quality still limited** (validation F1 0.2168; C01/C04/C06 over-reporting: 175/77/120 predictions vs 10 ground truth each) | Start, end, first-detection stay separate; confidence 0..1; no single `system_alarm_count` dependency. |
| T04 | 异常分类与子类型识别 | `packages/h2-vocabulary/data/anomaly-taxonomy.json`, `packages/h2-contracts/src/anomaly.ts` | Taxonomy (C01–C07, severity 高/中); `validation/evaluate.mjs` classification metrics | 已实现 seven-class classification; classification accuracy 0.3088 on the validation set (detection-first matcher) | Severity Chinese 高/中 (C01/C06 中, others 高); official subtypes. |
| T05 | 控制对象与受影响设备定位 | `anomaly-taxonomy.json` (primaryControlObject, affectedEquipment), `equipment.json`, `diagnosis/builder.py` | Taxonomy/equipment JSON; `validation/check-submission.mjs` official-token check | 已实现 for all seven classes; **submission export format 待办** | Official labels use comma-separated tokens `BESS,PCC,PV,ELZ,ELZ1..3` (no spaces); the backend export still emits `equipment_id:名称;` (cross-track defect, see `docs/competition/h2-sentinel/DEPLOYMENT_AND_SMOKE.md` §5). No fabricated health variable. |
| T06 | 根因分析与证据链 | `packages/h2-contracts/schema/anomaly-event.schema.json`, `diagnosis/builder.py`, assistant citations | QA C02; golden smoke | 已实现 structured evidence for all seven classes | Evidence items carry time, variable, actual value, reference or limit, and conclusion. |
| T07 | 影响量化 | `services/h2-analytics/src/h2_analytics/impact/calculators.py`, `anomaly-taxonomy.json` (primaryImpactMetric) | `services/h2-analytics/tests/test_impact.py`; `smoke_golden` | 已实现 seven-class impact calculators (official formulas) | Impact keeps unit, time window, and assumptions; no hard-coded answer remains. |
| T08 | 安全运行建议 | `services/h2-analytics/src/h2_analytics/safety/evaluator.py`, `packages/h2-vocabulary/data/constraints.json`, contract recommendations | `tests/test_safety.py`; UI safety section | 已实现 externalized constraints, passed/failed checks, `requiresHumanConfirmation` | No control execution; SOC 20–90 %, ELZ 300–1000 kW, 120 kW/min ramp, PCC and quota limits not suggested to be broken. |
| T09 | Web应用实现 | `apps/web/src/features/h2-sentinel/**`, `apps/web/src/main.tsx`, `scripts/h2-sentinel/launch.mjs` | H3/H6 handoffs; D4 smoke (launcher READY, import/analyze/export loop) | 已实现 local browser deployment with import/diagnose/export loop; official-data end-to-end verified by D4 smoke | Not notebook/CLI-only; generic `/` entry preserved. |
| T10 | 可视化与事件交互 | Web views (overview, events, diagnosis, analysis), feature-local ECharts wrapper | H3 handoff; manual Chrome desktop + 390x844 review | 已实现 features + manual visual review; automated screenshot regression 待办 | Synchronized tooltips, constraint series, event bands, zoom, Chinese names/units; no committed screenshot asset. |
| T11 | 运维助手 | `services/h2-analytics/src/h2_analytics/assistant/service.py`, `assistant-questions.json` (Q01–Q10), Web assistant view | `services/h2-analytics/tests/test_assistant_reports.py` | 已实现 deterministic no-LLM answers to the ten fixed questions with citations; free-form natural-language follow-ups 规划 | Facts, calculations, and recommendations distinguished; unknown items are not fabricated. |
| T12 | 报告与结构化结果导出 | `reports/renderer.py`, `reports/submission.py`, `packages/h2-contracts/schema/{report-descriptor,submission-row}.schema.json`, plugin `export-service.ts` | QA A05; D4 smoke exported a 566-row, 16-column CSV from the official test set | 已实现 six report kinds and the exact 16-column CSV on verified paths; **exported `affected_equipment` format 待办** (cross-track defect) | D3 checker (`validation/check-submission.mjs`) enforces the official comma-token format; it flags every row of the current backend export until `reports/submission.py` is fixed. |
| T13 | 部署复现与依赖管理 | `scripts/h2-sentinel/launch.mjs`, `start-h2-sentinel.bat/.sh`, `uv.lock`, root lockfile | `npm ci` → launcher → import/analyze/export reproduced by D4 smoke; `launch.test.mjs`, `composition.test.mjs`, `npm run h2:smoke` | 已实现 one-click local launch and the official test-set pipeline; D4 verdict currently **blocked only by the export format defect**; remote CI run 未声称 | Fixed loopback ports (5173/8765); ports and troubleshooting in `docs/competition/h2-sentinel/DEPLOYMENT_AND_SMOKE.md`. |
| T14 | 安全边界与合规声明 | Loopback Host/Origin checks, redacted errors, provenance, human-confirmation disclaimers across contracts/UI/reports | QA A04/A07; `PRODUCT_AND_ARCHITECTURE.md` | 已实现 supervision-only boundary and mandatory human confirmation | No real-device connection, no closed-loop control, no remote-host or general plugin runtime. |

## Cross-cutting boundary

- **Verified mainline:** import → diagnosis → export works end-to-end on the
  official test set (172,800 rows imported in one request, 566 predicted
  events, 566-row submission CSV) and on the sanitized Fixture.
- **Evaluation caliber (Track D authority):** event-level Precision/Recall/F1
  with a 10-minute grace window, greedy same-code matching, plus a
  detection-first classification accuracy. Only `validation/evaluate.mjs`
  numbers count; they are validation-set results, not the organizer score.
- **Known blockers (cross-track):**
  1. Backend submission export emits `equipment_id:名称;` instead of the
     official comma-separated tokens (`reports/submission.py`,
     `diagnosis/builder.py`) — the D3 checker and the D4 smoke stay red on it.
  2. Detection precision: C01/C04/C06 over-reporting keeps validation F1 at
     0.2168; raising it is Track A work, not a Track D claim.
- **Never claimed (未声称):** organizer score or rank, deployment, `main`
  publication, remote GitHub Actions execution, network-isolation proof,
  committed screenshots, and any F1 other than the numbers above.
- **Single source of truth:** `packages/h2-vocabulary/**` is the read-only
  source for the 69 official field names, C01–C07 taxonomy, equipment master,
  constraints, efficiency curves, assistant questions, and sign conventions.
  Official `affected_equipment` tokens come from the official label files.

## Source references

- Requirement document: `00_需求书.docx` (T01–T14 task table, section 6).
- Track D reports: `validation/reports/*.json` (evaluate-validation,
  evaluate-train-last-90, overfit-sentinel, offline-deploy-smoke, evaluate-fixture).
- [Deployment and smoke notes](../../docs/competition/h2-sentinel/DEPLOYMENT_AND_SMOKE.md)
- [H6 integration handoff](../../scripts/h2-sentinel/HANDOFF.md)
- [H2 vocabulary base](../../packages/h2-vocabulary/README.md)
- [H2 analytics README](../../services/h2-analytics/README.md)
- [H2 QA acceptance matrix](../../tests/h2-sentinel/ACCEPTANCE_MATRIX.md)
- [Web feature handoff](../../apps/web/src/features/h2-sentinel/HANDOFF.md)
