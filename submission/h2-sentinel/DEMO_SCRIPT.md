# H2 Sentinel Demo Script

## Status legend

Every narrated step carries one of three statuses so the audience never confuses
implemented behavior with plans:

| Status | Meaning |
| --- | --- |
| 已实现 (implemented) | Behavior exists in the current assembled snapshot and was verified there. |
| 规划/待办 (planned/pending) | The feature is scoped and may have a contract or UI seam, but the official-data run or final verification is not yet delivered. |
| 未声称 (not claimed) | Official scoring, deployment, remote CI execution, and screenshot assets are never claimed. |

## Demo mainline

The requested product flow is official-data **导入 (import) → 诊断 (diagnosis) →
导出 (export)**. The verified candidate currently demonstrates that flow on two
sanitized inputs; the official-data run itself remains pending. Record each step
in this order and state the status marker for every step.

1. **导入 (import)** — 已实现 on sanitized inputs. The Local path accepts CSV
   text through the same-origin `/api/v1/h2-sentinel` proxy, applies the official
   field caliber (69-field vocabulary), runs data-quality checks, and returns a
   run manifest. The sanitized C03/C04 flow was verified by the assembled QA.
   **待办**: importing the official 828,000-row, 69-field dataset is not
   performed or claimed in this candidate.
2. **诊断 (diagnosis)** — 已实现 for C03/C04 on Fixture and Local sanitized
   inputs: event detection, event aggregation, evidence chain, impact
   quantification, safety checks, and advisory recommendations. **待办**:
   C01, C02, C05, C06, and C07 detection and impact verification on official
   data.
3. **导出 (export)** — 已实现 on the verified paths: single-event diagnosis
   (HTML), period summary (HTML), quality report (HTML), analysis/validation
   (JSON), and the exact 16-column `submission.csv`. **待办**: exporting a
   submission produced from the official test dataset.

## Recording boundary

Use the current coordinator-verified assembled snapshot and begin with
`npm run h2:fixture`. The generic Fixture Demo remains at `/`; record H2 only
from `/h2-sentinel/?mode=fixture`. Keep `FIXTURE` visible. The demonstrated
data is sanitized synthetic evidence, not official data, live plant evidence, a
validation result, or an organizer score.

## Primary script — 3 to 5 minutes

| Time | Screen action | Spoken script |
| --- | --- | --- |
| 0:00–0:20 | Open the explicit Fixture route; state the status. | “H2 Sentinel is a local-first diagnosis and decision-support application for weak-grid green-hydrogen EMS anomalies. It supervises, diagnoses, quantifies impact, and advises; it does not control equipment. This route is the 已实现 Fixture path.” |
| 0:20–0:40 | Point to `FIXTURE` and provenance. | “This route uses sanitized synthetic Fixture data. The label is deliberate: this is not an official dataset, a plant run, or a score.” |
| 0:40–1:15 | Open Event Center and select C03. | “C03 is the BESS charge/discharge direction anomaly. Its evidence keeps start, end, first-detection time, equipment, severity, confidence, and the review boundary separate. This diagnosis path is 已实现 for C03/C04.” |
| 1:15–1:50 | Open C03 evidence and analysis. | “The diagnosis is evidence before explanation: time-aligned measurements and a reference or constraint appear before the recommendation. The chart supports human review, not an autonomous command.” |
| 1:50–2:15 | Open C03 impact and safety. | “Impact retains a metric, unit, and assumptions. Safety makes uncertainty visible. Any recommendation remains advisory and requires human confirmation.” |
| 2:15–2:45 | Select C04. | “C04 tracks a PCC import/export boundary. The corrected Fixture impact is 29.333333333333332 kilowatt-hours from eight one-minute violation rows; it is Fixture evidence, not an official performance metric.” |
| 2:45–3:15 | Open the assistant answer. | “The deterministic answer is tied to structured evidence. The verified Local golden path does not need an LLM key, so the core review loop is not dependent on an external model service.” |
| 3:15–3:50 | Switch to the verified Local run only when its launcher is ready. | “In explicit Local mode, the loopback sidecar produced a deterministic C03 HTML report and a two-row submission CSV validated against the exact 16-column contract. This is local deterministic evidence, not an official-data result.” |
| 3:50–4:10 | Return to the official-data mainline and close. | “The official-data mainline is 导入 → 诊断 → 导出. Importing the official 828,000-row dataset, running the full seven-class diagnosis on it, and exporting a scored submission is 待办 and not claimed today. What is 已实现 is a reproducible local flow on sanitized inputs that ends with human confirmation.” |

Fixture single-event diagnosis, period summary, and quality cards now produce
deterministic safe HTML with matching filenames and media types. Demonstrate
only those three as Fixture HTML reports; analysis and validation artifacts are
JSON, and submission output is CSV. Fixture output remains synthetic evidence,
not an official-data result or score.

## 30-second fallback

“H2 Sentinel / 氢哨 turns a suspected H2 EMS coordination anomaly into a human
review: timing, evidence, impact, safety, provenance, and an advisory next step.
The requested mainline is official-data 导入 → 诊断 → 导出; today this candidate
verifies that flow on sanitized Fixture and local deterministic inputs for C03
and C04. This view is sanitized synthetic Fixture data, not official plant data
or a score. The application does not control equipment; every recommendation
requires human confirmation. Official-data scoring, deployment, and remote CI
results are 待办 and are not claimed.”

## Failure fallback

- If H2 does not start, show the generic `/` Fixture Demo and state that it is a separate preserved entry; do not substitute it for H2 evidence.
- If Local mode fails, return to the explicit Fixture route and state that only the recorded Local smoke supports the report/CSV claim.
- If the selected report kind is JSON or CSV, narrate its actual format; only the three documented Fixture report kinds are HTML.
- If asked about official-data results, a score, deployment, or remote CI, state the exact status (待办/未声称) and point back to the verified sanitized evidence.
- Do not display secrets, absolute local paths, private datasets, unredacted logs, or generated artifacts outside the approved evidence scope.
