# H2 Sentinel Claims Ledger

Use this ledger for public copy, demo narration, and judge answers. “Evidence path” names an existing source or a future required path; a future path is not a claim that an artifact exists.

| ID | Permitted wording | Classification | Current evidence | Evidence path | Release rule |
| --- | --- | --- | --- | --- | --- |
| C01 | “Frozen H2 contracts define C01-C07, provenance, and exact submission-column order.” | Implemented contract fact | Source/schema package | `packages/h2-contracts/src/**`, `schema/**` | Permitted with “define”; do not say exporter ran. |
| C02 | “Sanitized synthetic C03/C04 fixtures are available for contract-level demonstration.” | Fixture evidence | Fixture files and handoff | `packages/h2-contracts/fixtures/golden-c03.json`, `golden-c04.json` | Must say sanitized synthetic / Fixture. |
| C03 | “Fixture provenance is distinct from live analysis.” | Implemented contract fact | Contract invariant | `packages/h2-contracts/README.md` | Permitted; no UI implication. |
| C04 | “Recommendations are advisory and require human confirmation.” | Implemented contract fact | Contract invariant | `packages/h2-contracts/README.md` | Permitted; never describe direct control. |
| C05 | “H2 Sentinel is a local-first diagnosis and decision-support product.” | Product requirement | PRD positioning | `docs/competition/h2-sentinel/PRD.md` | Say “designed/intended” until assembled. |
| C06 | “The product provides six H2 pages, a browser workflow, and exports.” | Assembly pending | PRD requirement only | H6 runtime evidence | Prohibited until runtime/screens/exports verify it. |
| C07 | “The local loopback analytics sidecar runs securely.” | Assembly pending | Architecture requirement only | H6 launcher/binding/smoke evidence | Prohibited until actual binding and failures are verified. |
| C08 | “Official CSV data was imported and analyzed.” | Official-data unavailable | No authorized data/run artifact | H6 run manifest and quality report | Prohibited. |
| C09 | “Validation precision, recall, F1, delay, or per-class results are X.” | Metric unavailable | No validation report | Versioned validation report | Prohibited; validation is not an organizer score. |
| C10 | “H2 Sentinel achieved an official score, rank, or approval.” | Metric/approval unavailable | No organizer artifact | Organizer-issued record | Prohibited. |
| C11 | “The app is deployed or online.” | Deployment unavailable | No deployment artifact | Release/deployment record | Prohibited. |
| C12 | “Optional LLM rendering is part of the product.” | Roadmap / optional mode | PRD only | `docs/competition/h2-sentinel/PRD.md` | Say optional only; P0 needs no key. |
| C13 | “Evidently or PyRCA is used.” | Roadmap / unadopted dependency | Decision gates only | `docs/competition/h2-sentinel/PRD.md` | Prohibited unless adopted, licensed, locked, verified. |

## Forbidden transformations

- Fixture data must not become real plant data, official data, or validation result.
- Contract defines/supports must not become application runs/exports.
- Do not remove “planned” or “intended” from H6-pending UI, sidecar, report, CSV, and launcher statements.
- A validation metric must not become an organizer score.
- A recommendation must retain the human-confirmation qualification.

## Update protocol

When H6 produces evidence, add its commit SHA, command, date, mode, provenance, and redacted location to only the matching row. Do not upgrade adjacent claims by association.
