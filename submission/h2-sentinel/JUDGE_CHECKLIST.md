# H2 Sentinel Judge Checklist

## Review framing

- Product: local-first, evidence-first H2 EMS anomaly diagnosis and decision support.
- Positioning: supervision (监督), diagnosis (诊断), impact quantification (影响量化), advisory recommendations (建议) above the EMS.
- Safety: no equipment control; recommendations remain advisory and require human confirmation.
- Primary verified cases: sanitized synthetic Fixture C03 BESS direction anomaly and C04 PCC boundary tracking.
- Candidate: current coordinator-verified assembled snapshot, not a `main` publication or deployment.

## Status legend

| Status | Meaning |
| --- | --- |
| 已实现 (implemented) | Present and verified in the current assembled snapshot. |
| 规划 (planned) | Scoped and represented in contracts or UI seams, not yet verified on the full official flow. |
| 待办 (pending) | Required to complete the official mainline; not yet delivered. |
| 未声称 (not claimed) | Never claimed: official scores, deployment, remote CI execution, screenshot assets. |

## Verified versus pending at a glance

| Official-task area | Status now |
| --- | --- |
| Import and caliber (T01) | 已实现 on sanitized CSV with the 69-field vocabulary; official-dataset import 待办. |
| Data quality and preprocessing (T02) | 已实现 checkers and quality report on sanitized inputs; official-data quality record 待办. |
| Event detection and aggregation (T03) | 已实现 for C03/C04 (rule detector + aggregation); other classes 规划/待办. |
| Classification and subtypes (T04) | 已实现 vocabulary and C03/C04 classification; full seven-class verification 待办. |
| Control object and equipment (T05) | 已实现 for C03/C04 against the equipment master; other classes 规划. |
| Root cause and evidence chain (T06) | 已实现 structured evidence for C03/C04; full-class coverage 待办. |
| Impact quantification (T07) | 已实现 calculators; C03/C04 verified values; other classes declared but unverified 待办. |
| Safe operating recommendations (T08) | 已实现 with externalized constraints and human confirmation. |
| Web application (T09) | 已实现 six Chinese views, local deployment, import/diagnose/export loop on sanitized data. |
| Visualization and event interaction (T10) | 已实现 features; manual visual review only; automated screenshot regression 待办. |
| Operations assistant (T11) | 已实现 deterministic answers to the ten fixed questions with citations; free-form natural-language follow-ups 规划. |
| Reports and structured export (T12) | 已实现 six report kinds and the exact 16-column `submission.csv`; official-data submission export 待办. |
| Deployment reproduction and dependencies (T13) | 已实现 launchers, lockfiles, ports, health wait, cleanup; remote CI run 未声称. |
| Safety boundary and compliance (T14) | 已实现 no closed-loop control and mandatory human confirmation. |

## What can be inspected now

| Item | Evidence status | Judge boundary |
| --- | --- | --- |
| Generic product entry | Current H6 evidence | `/` preserves the generic Fixture Demo. |
| H2 entry | Current H6 evidence | Only `/h2-sentinel/?mode=fixture` and `/h2-sentinel/?mode=local` mount H2. |
| Official field caliber | Source-level fact | `packages/h2-vocabulary/**` holds 69 fields, 7 anomaly classes, equipment, constraints, efficiency curves, questions, and the deprecated-name map. |
| Safety/provenance | Current H6 evidence | Human confirmation and `FIXTURE` visibility were manually reviewed. |
| C03/C04 workflow | Current H6 evidence | Fixture overview/C03/C04 were manually checked at desktop and 390x844. |
| Local deterministic path | Current H6 evidence | Local smoke produced C03 HTML output and a 16-column, two-row validated CSV. |
| Reproducibility | Current assembled evidence | 92 repository tests, 60 focused H2 tests, 32 Python pytest cases, nine launcher tests, five assembled QA groups, and nine smoke scenarios are recorded for the assembled snapshot. |
| Visual proof | Manual only | No committed screenshots and no automated screenshot regression. |
| Fixture report cards | Current plugin evidence | `92f7b78` makes single-event, period, and quality cards deterministic safe HTML; JSON/CSV kinds retain their formats. |
| Official-data run | 待办 | No authorized official dataset or full-flow run is included. |
| Evaluation metrics | 未声称 | No official-data validation report, score, rank, or approval. |
| Deployment and remote CI | 未声称 | No deployment proof or remote GitHub Actions run; the workflow file alone is insufficient. |
| Legal inventory | Current source evidence | Notices cover package dependencies; later assets/datasets need a separate review. |

## Plain answers

1. **Is this controlling equipment?** No. It is decision support above the EMS and requires human confirmation.
2. **Are C03/C04 official-data results?** No. They are sanitized synthetic Fixture inputs; the official-data run is 待办.
3. **What ran locally?** The assembled snapshot recorded Fixture and Local launcher checks, five assembled QA groups, nine smoke scenarios, deterministic Local C03 HTML output, and a validated two-row/16-column CSV.
4. **Where are metrics and score?** 未声称. A future validation result must remain separate from an organizer score.
5. **What is 已实现 versus 待办?** The verified mainline is 导入 → 诊断 → 导出 on sanitized inputs for C03/C04 plus the assistant, safety, reports, and export. The official-dataset run, full seven-class verification, free-form assistant follow-ups, and automated screenshot regression are 待办.
6. **Are screenshots and CI results included?** No. Chrome review was manual with no committed capture; the GitHub workflow is committed but no remote run is claimed.
