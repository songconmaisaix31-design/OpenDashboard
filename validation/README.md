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
