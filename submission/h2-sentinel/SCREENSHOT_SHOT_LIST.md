# H2 Sentinel Screenshot Shot List

All shots below are **not yet captured** at the frozen gate. This is a capture plan, not an asset inventory or evidence of a rendered application. H6 must replace a status only with a real, redacted capture and its candidate/run context.

| ID | Intended frame | Required visible proof | Status now | Evidence path after capture |
| --- | --- | --- | --- | --- |
| S01 | Overview in Fixture mode | Product title, `FIXTURE` label, selected run/status | Not captured | `submission/h2-sentinel/assets/S01-overview-fixture.png` |
| S02 | Data-quality view | Dataset/provenance, quality status, warnings or blockers | Not captured | `submission/h2-sentinel/assets/S02-data-quality.png` |
| S03 | Event Center | C03 and C04 cards with timing and severity | Not captured | `submission/h2-sentinel/assets/S03-event-center.png` |
| S04 | C03 detail | BESS/PCC context, timing, evidence list, provenance | Not captured | `submission/h2-sentinel/assets/S04-c03-evidence.png` |
| S05 | C03 impact and safety | Metric/unit/assumptions, safety, human-confirmation label | Not captured | `submission/h2-sentinel/assets/S05-c03-impact-safety.png` |
| S06 | C04 detail | PCC boundary evidence and visible constraint/reference | Not captured | `submission/h2-sentinel/assets/S06-c04-boundary.png` |
| S07 | Assistant view | Question, cited structured answer, no control claim | Not captured | `submission/h2-sentinel/assets/S07-assistant.png` |
| S08 | Report/export result | Provenance, safety disclaimer, report descriptor or CSV header | Not captured | `submission/h2-sentinel/assets/S08-export.png` |
| S09 | Local analysis mode, if verified | `LIVE_ANALYSIS`, imported manifest, redacted run result | Not captured | `submission/h2-sentinel/assets/S09-live-analysis.png` |
| S10 | Narrow-width review | No overlap or clipped essential content | Not captured | `submission/h2-sentinel/assets/S10-narrow-width.png` |

## Capture rules

1. Capture the real application after the relevant H6 smoke test.
2. Keep `FIXTURE` or `LIVE_ANALYSIS` visible; a Fixture capture must never be captioned as official-data analysis.
3. Redact names, paths, data rows, credentials, tokens, and private artifacts.
4. Pair every capture with commit SHA, command, viewport, mode, and a short statement of what it proves. It proves only the recorded UI state.
5. Do not add S09 unless its authorized live-analysis evidence exists.
