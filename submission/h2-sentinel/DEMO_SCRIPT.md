# H2 Sentinel Demo Script

## Precondition

Record this only after H6 verifies the actual entry command, Fixture path, screenshots, and exports. Until then it is a rehearsal script, not runtime evidence. Keep the provenance label visible and say “Fixture” whenever sanitized synthetic data is shown.

## Primary script — 3 to 5 minutes

| Time | Screen action | Spoken script |
| --- | --- | --- |
| 0:00–0:20 | Open H2 Sentinel overview in Fixture mode. | “H2 Sentinel is a local-first diagnosis layer for weak-grid green-hydrogen EMS operations. It helps an engineer review evidence; it does not control equipment.” |
| 0:20–0:45 | Point to visible `FIXTURE` label and quality summary. | “This uses sanitized synthetic Fixture data, not an official dataset or a live plant. Provenance stays visible so a demonstration cannot be mistaken for a new analysis run.” |
| 0:45–1:15 | Open Event Center and select C03. | “C03 is a BESS charge/discharge direction anomaly. The event separates start, end, first-detection time, severity, confidence, control object, and affected equipment.” |
| 1:15–1:55 | Open C03 evidence/chart panel. | “The diagnosis is evidence first: time-aligned measurements, a reference or constraint, and a machine-readable conclusion appear before explanation. The chart supports review; it is not an autonomous command.” |
| 1:55–2:20 | Open C03 impact and safety panels. | “Impact shows its metric, unit, assumptions, and evidence. Safety checks make uncertainty visible. The recommendation is advisory and requires human confirmation.” |
| 2:20–2:55 | Select C04 and boundary evidence. | “C04 covers PCC import/export boundary tracking. The same traceable event structure lets an operator compare constraint evidence rather than rely on generated prose.” |
| 2:55–3:25 | Open one assistant answer. | “The assistant answers from structured evidence with citations. A deterministic fallback remains available, so the golden path does not depend on an API key or external network.” |
| 3:25–3:55 | Open report/export only after H6 verifies it. | “The target export is a readable diagnosis report and exact structured columns. We will claim these only after generated artifacts and header validation are recorded.” |
| 3:55–4:15 | Return to provenance and safety summary. | “H2 Sentinel makes a suspected coordination anomaly reviewable: models detect, rules verify, AI explains, and people decide.” |

Do not substitute unverified live-analysis results for this Fixture script. If the build cannot show a requested screen or export, use the fallback instead of improvising a claim.

## 30-second fallback

“H2 Sentinel / 氢哨 is a local-first diagnosis concept for weak-grid green-hydrogen EMS anomalies. Its rule is evidence before explanation: an event carries timing, equipment, evidence, impact, safety checks, and visible provenance. This recording uses sanitized synthetic Fixture data for C03 and C04, not official results. It does not control equipment; every operational recommendation is advisory and requires human confirmation. The final runtime, exports, and official-data metrics remain subject to integration evidence.”

## Recording gates

- Use [SCREENSHOT_SHOT_LIST.md](SCREENSHOT_SHOT_LIST.md) as capture order.
- Verify the H6 launcher and Fixture mode before recording.
- Capture the real application only, never a design mockup or composite.
- Do not display secrets, absolute local paths, private datasets, or unredacted logs.
