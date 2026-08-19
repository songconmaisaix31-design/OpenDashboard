# H2 Sentinel QA Defect Log

## Open defects

### H2-QA-001

| Field | Value |
| --- | --- |
| Severity | blocker |
| Expected contract | The PRD C04 minute-level formula sums `max(pcc_power_kw - pcc_export_limit_kw, 0) / 60` over the declared event interval. |
| Observed behavior | `golden-c04.json` declares `86.5 kWh`, but the eight inclusive CSV samples from `10:32` through `10:39` are each `720 - 500 = 220 kW`, which totals `29.333333333333336 kWh`. |
| Reproduction command | `node tests/h2-sentinel/run-contract-qa.mjs` |
| Relevant commit SHA | Frozen H0 gate `f9dd7df83a81da57fdaa2b03cd67470c8c7a22c4` |
| Owned implementation track | H0 Contracts |
| Golden-path blocker | yes |
| Evidence artifact | `packages/h2-contracts/fixtures/tiny-valid-timeseries.csv`, `packages/h2-contracts/fixtures/golden-c04.json`, and the failing `C03` harness row |
| Status | open; requires coordinator-approved contract correction |

The analytics API, H2 plugin adapter, local sidecar, report exporter, and H2
Web composition are not present in this immutable baseline. Their acceptance
rows are explicit `SKIP` entries in `ACCEPTANCE_MATRIX.md`; absence of those
assembly components is not reported as a failure of the contract gate.

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
