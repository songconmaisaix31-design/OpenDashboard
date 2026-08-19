# H2 Sentinel QA Defect Log

## Resolved contract defects pending QA consumption

### H2-QA-001

| Field | Value |
| --- | --- |
| Severity | blocker (resolved by corrected contract gate) |
| Expected contract | The PRD C04 minute-level formula sums `max(pcc_power_kw - pcc_export_limit_kw, 0) / 60` over the declared event interval. |
| Observed behavior | Archived H0 declared `86.5 kWh`, but the eight inclusive CSV samples from `10:32` through `10:39` are each `720 - 500 = 220 kW`, which totals the canonical `29.333333333333332 kWh`. |
| Reproduction command | `node tests/h2-sentinel/run-contract-qa.mjs` |
| Relevant commit SHA | Frozen H0 gate `f9dd7df83a81da57fdaa2b03cd67470c8c7a22c4` |
| Owned implementation track | H0 Contracts |
| Golden-path blocker | yes |
| Evidence artifact | `packages/h2-contracts/fixtures/tiny-valid-timeseries.csv`, `packages/h2-contracts/fixtures/golden-c04.json`, and the failing `C04` harness row |
| Status | resolved by integration contract gate `4f2a8a3156a96a7670f4ee9830ff1c560faf1c94`; this QA branch remains on archived H0 and has not merged or cherry-picked the correction. |

## Open assembled regression

### H2-QA-002

| Field | Value |
| --- | --- |
| Severity | blocker |
| Scope | A05 Fixture C03 report export |
| Expected contract | `single_event_diagnosis` for C03 is an HTML artifact with `mediaType: text/html`, descriptor format `html`, a SHA-256 content hash, and a safe filename. |
| Actual | The public Fixture adapter returned `application/json` and descriptor format `json` for the requested C03 report. |
| Reproduction | `npm run h2:qa` |
| Relevant commit SHA | QA baseline `6d04ee38f39d81801c87190f31eff0a1915862c6` |
| Owned implementation track | H2 Plugin (fixture report artifact); H3 Web labels are affected presentation. |
| Golden-path blocker | yes |
| Evidence | Redacted JSON summary emitted by `tests/h2-sentinel/assembled/run-assembled-qa.mjs`; no generated artifact is retained. |
| Status | fixed by `92f7b78027b9492a5a5fe8ced2e851ed4199aeaa`; `npm run h2:qa` rerun passed Fixture C03 `text/html`, `.html` filename, and descriptor SHA-256 verification. |

The local analytics API, launcher, and Web entry are assembled in this baseline.
Their results are recorded in `ACCEPTANCE_MATRIX.md`; no assembly row is left as
a stale `SKIP`.

## Defect entry template

| Field | Required value |
| --- | --- |
| ID | Stable identifier, for example `H2-QA-001` |
| Severity | blocker, high, medium, or low |
| Scope | Matrix row and affected assembly component |
| Reproduction | Exact command and sanitized input |
| Expected | Contract or acceptance-matrix behavior |
| Actual | Observed behavior and redacted output |
| Evidence | Commit SHA, artifact path, and screenshot/log path if applicable |
| Status | open, fixed, or accepted |
