# H2 Sentinel Implementation Boundary (T01–T14)

This record maps the visible T01-T14 requirement labels to current evidence. It does not invent requirements from missing document sections and does not turn technical evidence into organizer outcomes.

| T# | Area | Evidence status | Boundary |
| --- | --- | --- | --- |
| T01 | Import and caliber | Technical E2E recorded | Attempt-6 processed 172,800 rows and 69 fields on `58090bc`; raw input is not included here. |
| T02 | Data quality and preprocessing | Technical E2E recorded | Normalization identity and cleanup are recorded; no separate organizer quality approval is claimed. |
| T03 | Event detection | Technical E2E recorded | Attempt-6 recorded 104 events; no current accuracy metric is asserted. |
| T04 | Classification and subtypes | Contract/implementation evidence | C01-C07 taxonomy exists; historical performance numbers are unbound. |
| T05 | Control object and affected equipment | Contract/implementation evidence | Submission representation is subject to the exact 16-column artifact; this package does not carry forward earlier issue statements. |
| T06 | Root cause and evidence chain | Implemented boundary | Structured evidence precedes advisory explanation and preserves provenance. |
| T07 | Impact quantification | Implemented boundary | Impact retains a metric, unit, interval, and assumptions; no organizer performance claim follows. |
| T08 | Safe operating recommendations | Implemented boundary | Recommendations are advisory and require human confirmation. |
| T09 | Web application | Deployment HTTP-shell recorded | Root and H2 mode URLs returned SPA shells; this is not an interactive pass. |
| T10 | Visualization and interaction | UNKNOWN-HOLD | Desktop/mobile visual and interactive checks were not authorized. |
| T11 | Operations assistant | Bounded implementation evidence | The product preserves evidence and human-review constraints; no autonomous action is claimed. |
| T12 | Reports and structured export | Technical E2E recorded | Attempt-6 records 104 rows by 16 columns; report SHA identifies the artifact. |
| T13 | Deployment and dependency reproducibility | Partial recorded evidence | Exact-SHA CI is green and deployment shell checks exist; later-SHA CI and visual verification are separate. |
| T14 | Safety and compliance | Implemented boundary | No closed-loop control, remote-host control, or arbitrary shell surface is claimed. |

## Representation and evaluation holds

Internal/API severity is English enum data. External submission taxonomy is Chinese `高`/`中`; a current export must preserve the external representation. Numbers 0.2168 and 0.9517 are historical/unbound because their reports lack an immutable `testedCodeSha` binding. They must not be used as current F1, precision, recall, or accuracy.

The supplied requirement document references Section 8 D01-D13 and Section 13 scoring, but those sections are absent from its body. This package does not fabricate missing deliverables, scoring weights, or acceptance criteria.

## Organizer decision holds

The reviewed rule requires one team-leader submission before the 2026-08-21 online-work deadline. As of 2026-08-23, registration, form submission, receipt, acceptance, approval, score, and rank are `UNKNOWN-HOLD`.
