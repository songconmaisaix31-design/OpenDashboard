# H2 Sentinel Validation Lane

This directory is Track D's official-data verification base. It contains:

- `evaluate.mjs` — official-set evaluation (D1/D2): loads an official
  timeseries and its event labels, feeds the validated data through the public
  H2 analytics runtime, and computes event-level Precision / Recall / F1 by
  `anomaly_code` and overall, plus detection/classification accuracy.
- `overfit-sentinel.mjs` — overfit sentinel (D2): runs the same evaluation on
  the validation set and on the last 90 days of the train series
  (`2025-10-03` onward), then marks the report red when the F1 gap exceeds
  0.15.
- `check-submission.mjs` — submission format checker (D3): validates the
  16-column header, UTF-8 encoding, official `severity` and
  `primary_control_object` vocabulary, official comma-separated
  `affected_equipment` tokens, booleans, and empty/mojibake cells.
- `lib/` — shared pure helpers (CSV, official field mapping and normalization,
  event-level matching metrics, launcher/API client, submission serialization).

Official competition data stays outside the repository (read-only). Generated
reports under `reports/` are reproducible evidence.

## Run the evaluator

```bash
# deterministic fixture smoke (golden C03/C04 through the local analytics runtime)
node validation/evaluate.mjs --mode fixture

# official validation set (D1, full 90 days, 70 events)
node validation/evaluate.mjs --mode local --official-data "<official data dir>"

# train-last-90 overfit window (D2, days >= 2025-10-03, 63 events)
node validation/evaluate.mjs --mode local --set train-last-90 --official-data "<dir>"

# bounded run for quick smoke
node validation/evaluate.mjs --mode local --official-data "<dir>" --limit-days 2
```

## Run the overfit sentinel

```bash
# runs both windows and writes validation/reports/overfit-sentinel.json
node validation/overfit-sentinel.mjs --official-data "<dir>"

# reuse the latest reports without re-running the evaluations
node validation/overfit-sentinel.mjs --combine-only --official-data "<dir>"
```

The sentinel verdict is RED when
`|validation F1 - train-last-90 F1| > 0.15` (D2), otherwise GREEN.

## Run the submission checker

```bash
node validation/check-submission.mjs path/to/submission.csv
```

## Matching contract (D1)

A predicted event matches a ground-truth event when both share the same
`anomaly_code` and their intervals overlap after extending the ground-truth
window by a `graceMinutes` lead/lag tolerance (default 10 minutes, matching the
organizer expectation that events are found within 10 minutes of onset). Matching
is greedy and deterministic: ground-truth events are consumed in chronological
order and each prediction is used at most once. Predictions are merged across the
per-day chunk boundary when the same code continues within a 2-minute gap.

Classification accuracy (reported as `metrics.classification`) uses a
code-agnostic temporal matcher and counts how many detected events carry the
correct `anomaly_code`, separating detection quality from classification
quality.

## Submission format (D3)

- 16 columns in the exact `17_submission_template.csv` order;
- valid UTF-8 without mojibake or NUL bytes;
- `severity` is Chinese 高/中 (fixed per code: C01/C06 中, others 高);
- `affected_equipment` is a comma-separated, space-free token list from
  `BESS, PCC, PV, ELZ, ELZ1, ELZ2, ELZ3` (per official label files; C01/C02
  vary per event and are validated as sets);
- `requires_human_confirmation` is `true`/`false`.

Preprocessing applied before the runtime sees official data (documented in every
report): the official timeseries is chunked by UTC day; fields are renamed to the
canonical backend vocabulary per `packages/h2-vocabulary/data/deprecated-field-map.json`;
`total_electrolyzer_power_kw` is derived as
`elz1+elz2+elz3 power_actual_kw`; naive `YYYY-MM-DD HH:MM:SS` timestamps are
normalized to ISO-8601 UTC. The sanitized tiny fixture (which predates the
69-field schema) is padded at import time: derived columns computable from
present base columns use the official formulas, everything else is zero.

## Epoch 2 official same-origin runner

`official-csv-e2e.mjs` is the coordinator-only official-data gate. It accepts
an external, read-only CSV path and never copies the raw CSV into this
repository. Before it starts the local launcher or loads the full CSV text, it
requires the literal expected commit to equal `HEAD`, records that tested code
SHA, and checks that the operator path is a regular file with the exact raw byte
count. Only then does it stream the raw file to check all frozen identity values:

| Representation | Bytes | SHA-256 | Rows | Fields |
| --- | ---: | --- | ---: | ---: |
| Raw official CSV | `77,865,257` | `88f3a5c15fb5c42d265475f2998fe9f6c271dcef16f43daee7626f6704504cd9` | `172,800` | `69` |
| Normalized official CSV | `78,038,054` | `4407495ad75299f2f8f06112f6d3209eb93b2773ff3f0c797c47874159853169` | `172,800` | `69` |

Run it only from the assembled, verified commit on a host with at least 8 GiB
physical RAM and a 4 GiB Node heap:

```powershell
node --max-old-space-size=4096 --import tsx validation/official-csv-e2e.mjs `
  --official-csv "<operator-approved-read-only-csv-path>" `
  --expected-commit "<40-lowercase-hex-assembled-head>" `
  --run-id "run_f2bc8c0433f8" `
  --task-id "task_x" `
  --dispatch-id "ctx_x"
```

`--dispatch-id` is optional. Run, task, and dispatch IDs accept only lowercase
letters, digits, `_`, and `-`; traversal, whitespace, and separators are
rejected. The runner creates, but never overwrites,
`validation/reports/epoch-2/<safe-run-id>/attempt-<n>/`. Each attempt contains
the exported submission artifact and a sanitized `official-csv-e2e.json`; the
report records public run/task/optional-dispatch IDs and `testedCodeSha`, stable
error codes, fixed identities, hashes/counts/durations, repository-relative
artifact references, and Node resource counters only. It does not contain the
operator path, URL, port, PID, arguments, environment, request/response body,
stdout, stderr, or stack trace.

After the raw and normalized identity gates, the runner starts the existing
local launcher once and constructs the existing Live data source only from the
launcher's parsed loopback origin with `timeoutMs: 30000`. The launcher ready
URL may include the H2 route and query; those components are deliberately not
passed to the adapter. An invalid/non-loopback ready URL fails closed with a
stable launcher-ready code and is never written to the report. The required order is
`importCsv -> runAnalysis -> exportSubmission -> checker`; every request stays
on that same Web origin. The launcher is stopped exactly once in `finally` on
both success and failure, without retry. Import is bound to `LIVE_ANALYSIS`,
the frozen normalized row/field counts and fingerprint, and non-blocked
quality. Analysis is bound to completion, the imported dataset/fingerprint, and
non-blocked quality. Export is bound to a ready `submission_csv` CSV descriptor,
the analysis run, text/csv media type, and matching content hash. The checker
must be valid, have 16 columns, and return the analysis event count. A checker
or cleanup failure returns exit code 1.

After checker success, the runner invokes the existing read-only
`hydrateH2Workspace` seam with the imported dataset. Its top-level
`seriesHydration` result is independent from the main chain: a passed result
records only duration, run ID, selected-variable count (1–32), and point count;
it never records variables or point values. It rejects a missing series,
non-null series error, mismatched run dataset/fingerprint, duplicate or
out-of-bound variables, and a point count that differs from normalized rows.
If hydration fails, the main import/analyze/export/checker status remains
passed, but `seriesHydration` records only a stable error code. The final Epoch
2 release gate remains `HOLD` until that separate measurement is independently
delivered and accepted.

The test suite uses only injected synthetic data and faked dependencies. It
does not read or execute the official CSV:

```powershell
node --import tsx --test validation/official-csv-e2e.test.mjs
```
