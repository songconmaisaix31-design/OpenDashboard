# H6 Runtime Evidence Checklist

## Candidate record

- Original H6 integration gate: `8bcc8d59e352def535c26504683975959ff7f18d`.
- Coordinator cherry-picked candidate: `6d04ee38f39d81801c87190f31eff0a1915862c6`.
- Evidence date: 2026-08-19, as recorded in the H6 handoff.
- Scope: current-worktree evidence only; it does not prove `main`, deployment,
  remote GitHub Actions execution, network isolation, official data, or scores.

| ID | Required evidence | Status at candidate | What it proves and does not prove |
| --- | --- | --- | --- |
| R01 | Candidate SHA and source inventory | Passed | Identifies H6 composition at `6d04ee3`; it is not a `main` publication. |
| R02 | Windows and shell launcher commands | Passed | `npm run h2:fixture`, `npm run h2:local`, and wrappers are recorded in the H6 handoff. |
| R03 | Fixture-only start without Python or LLM key | Passed | The smoke covered Fixture without analytics; no-LLM golden determinism is separately exercised in Local mode. |
| R04 | Fixture C03 journey | Passed with report-format limitation | Mounted Fixture C03 UI was manually reviewed; do not claim a Fixture HTML download while the known mismatch is open. |
| R05 | Fixture C04 detail and export journey | Passed for detail | C04 and corrected `29.333333333333332 kWh` were reviewed; do not upgrade this to official-data evidence. |
| R06 | Generated `submission.csv` and validator | Passed in Local deterministic smoke | Two rows and the exact 16 columns passed the Python validator. |
| R07 | Generated report evidence | Passed for Local C03 HTML; Fixture pending recheck | Local C03 HTML passed. Fixture HTML-labeled cards can return JSON, so that assertion remains open. |
| R08 | Loopback health, proxy, and failures | Passed | Smoke covered redirecting unhealthy sidecar, occupied ports, Local cleanup, and preview proxy; no broad isolation claim follows. |
| R09 | Official CSV import and quality record | Not delivered | Official data is absent. |
| R10 | Versioned validation report and metrics | Not delivered | No matching policy/metrics artifact exists. |
| R11 | Desktop and narrow-width visual evidence | Manual pass; assets not delivered | Human Chrome review at desktop and 390x844 found no document-width overflow; no automated screenshot suite or committed images exists. |
| R12 | TypeScript, Web, launcher, Python, and diff checks | Passed in H6 record | 65 generic, 33 focused H2, 7 launcher/composition, and 24 Python tests passed; Python emitted one upstream Starlette `httpx` warning. |
| R13 | Third-party notice and asset review | Notice passed; assets not delivered | `THIRD_PARTY_NOTICES.md` inventories shipped dependencies; screenshots/datasets/reports are absent and need review before distribution. |
| R14 | Release/archive manifest and hashes | Not delivered | There is no release or deployment archive proof. |

## Smoke coverage

`npm run h2:smoke` recorded six launcher scenarios: Fixture without analytics,
occupied Web port, redirecting unhealthy sidecar, occupied analytics port,
Local golden/export/cleanup, and production-preview proxy. This is executable
candidate evidence; it is neither a production deployment nor a remote CI run.

## Final-candidate hold

The current Fixture provider/report-card mismatch is H6-discovered and must be
rechecked after its owner assembles a fix. Until then, retain the Local C03 HTML
report evidence but do not claim Fixture HTML export parity.
