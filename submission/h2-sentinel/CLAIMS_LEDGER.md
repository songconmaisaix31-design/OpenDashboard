# H2 Sentinel Claims Ledger

Use this ledger for public copy, demo narration, and judge answers. Current
evidence is limited to coordinator gate `6d04ee38f39d81801c87190f31eff0a1915862c6`
and the H6 checks recorded on 2026-08-19.

| ID | Permitted wording | Classification | Current evidence | Release rule |
| --- | --- | --- | --- | --- |
| C01 | “H2 contracts define C01-C07, provenance, and the exact submission-column order.” | Implemented contract fact | `packages/h2-contracts/**` | Say “define”; do not infer an export run. |
| C02 | “Sanitized synthetic C03/C04 Fixture data is available.” | Fixture evidence | Contract fixtures and assembled Fixture mode | Always say Fixture/synthetic; never official data or a score. |
| C03 | “The generic Fixture Demo remains at `/`; H2 opens only with explicit `fixture` or `local` mode.” | Current H6 evidence | `apps/web/src/main.tsx`, H6 handoff | Do not say the generic entry was replaced. |
| C04 | “Local H2 browser requests use a same-origin proxy to a validated loopback analytics target.” | Current H6 evidence | H6 source and smoke | Do not expand this into a network-isolation or deployment claim. |
| C05 | “The Local golden path produced deterministic no-LLM C03 HTML output and a two-row, 16-column validated submission CSV.” | Local deterministic evidence | H6 smoke and Python validation | Scope the statement to the Local golden path. |
| C06 | “The historical H6 gate recorded 65 generic/33 focused H2 tests; the post-assembly final rerun recorded 66 repository/34 focused H2 tests.” | Historical and final evidence | H6 handoff plus final coordinator rerun | Retain the upstream Starlette warning qualification for the historical Python suite. |
| C07 | “A human Chrome review checked desktop and 390x844 Fixture screens without document-width overflow.” | Manual Chrome evidence | H6 handoff | Do not call this automated screenshot regression or claim image assets exist. |
| C08 | “The post-assembly final bundle is about 887 kB minified (293 kB gzip), and Vite still emitted its standard greater-than-500-kB warning.” | Final coordinator evidence | Final `npm run check` build | Do not imply the bundle-warning issue is resolved. |
| C09 | “Recommendations are advisory and require human confirmation.” | Implemented behavior and contract fact | H2 UI/contract/H6 review | Never describe direct equipment control. |
| C10 | “Fixture single-event diagnosis, period summary, and quality reports export deterministic safe HTML with matching media type and filename.” | Current plugin evidence | Source `92f7b78`, coordinator integration `abe454b`, focused plugin test coverage | Scope to the three HTML report kinds; JSON and CSV retain their own formats. |
| C11 | “Official CSV data was imported and analyzed.” | Unverified | No authorized official dataset/run | Prohibited. |
| C12 | “Validation precision, recall, F1, delay, per-class results, score, rank, or approval are X.” | Unverified | No versioned validation or organizer artifact | Prohibited; a validation report would not equal an organizer score. |
| C13 | “The app is deployed, online, or present on `main`.” | Unverified | No deployment or main publication evidence | Prohibited. |
| C14 | “GitHub Actions verified this candidate remotely.” | Unverified | Workflow file is committed only | Prohibited until a specific remote run is available. |
| C15 | “Optional LLM rendering is required for the golden path.” | False | Local smoke is deterministic and no-LLM | Prohibited. |

## Forbidden transformations

- Fixture data must not become live plant data, official data, a score, or a validation result.
- Local deterministic smoke must not become an official-data or deployment claim.
- Manual Chrome review must not become screenshot automation or a submitted screenshot.
- A committed workflow must not become a remote CI result.
- Fixture HTML format parity must not become an official-data, score, deployment, or broad report-format claim.
- Every recommendation retains the human-confirmation qualification.
