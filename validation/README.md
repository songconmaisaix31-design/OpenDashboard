# H2 Sentinel Validation Lane

This directory is Track Q's official-data verification base. It contains:

- `evaluate.mjs` — official validation-set evaluation (Q1): loads
  `02_validation_timeseries.csv` and `05_validation_event_labels.csv`, feeds the
  validated data through the public H2 analytics runtime, and computes event-level
  Precision / Recall / F1 by `anomaly_code` and overall.
- `check-submission.mjs` — submission format checker (Q2): validates the 16-column
  header, UTF-8 encoding, official `severity` and `primary_control_object`
  vocabulary, `id:名称` equipment identifiers, booleans, and empty/mojibake cells.
- `lib/` — shared pure helpers (CSV, official field mapping and normalization,
  event-level matching metrics, launcher/API client, submission serialization).

Official competition data stays outside the repository (read-only). Generated
reports under `reports/` are reproducible evidence.

## Run the evaluator

```bash
# deterministic fixture smoke (golden C03/C04 through the local analytics runtime)
node validation/evaluate.mjs --mode fixture

# official validation set (full 90 days)
node validation/evaluate.mjs --mode local --official-data "<official data dir>"

# bounded run for quick smoke
node validation/evaluate.mjs --mode local --official-data "<dir>" --limit-days 2
```

## Run the submission checker

```bash
node validation/check-submission.mjs path/to/submission.csv
```

## Matching contract (Q1)

A predicted event matches a ground-truth event when both share the same
`anomaly_code` and their intervals overlap after extending the ground-truth
window by a `graceMinutes` lead/lag tolerance (default 10 minutes, matching the
organizer expectation that events are found within 10 minutes of onset). Matching
is greedy and deterministic: ground-truth events are consumed in chronological
order and each prediction is used at most once. Predictions are merged across the
per-day chunk boundary when the same code continues within a 2-minute gap.

Preprocessing applied before the runtime sees official data (documented in every
report): the official timeseries is chunked by UTC day; fields are renamed to the
canonical backend vocabulary per `packages/h2-vocabulary/data/deprecated-field-map.json`;
`total_electrolyzer_power_kw` is derived as
`elz1+elz2+elz3 power_actual_kw`; naive `YYYY-MM-DD HH:MM:SS` timestamps are
normalized to ISO-8601 UTC.
