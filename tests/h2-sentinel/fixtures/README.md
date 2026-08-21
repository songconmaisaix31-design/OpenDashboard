# QA Fixture Policy

This QA lane currently adds no data fixture. Contract-only checks consume the
canonical `packages/h2-contracts/fixtures/` assets, which are explicitly
synthetic, sanitized, small, deterministic, and Fixture-provenanced.

Any future fixture added here must be synthetic or explicitly redistributable,
minimal for its test, deterministic, and labeled with provenance. Official
competition data, user uploads, secrets, model binaries, and absolute paths are
prohibited.

## Fixtures added by Track Q

- `official-timeseries-columns.json` — frozen snapshot of the official 69-column
  timeseries header, derived from `02_validation_timeseries.csv` (which shares the
  header with `01_train_timeseries.csv` and `03_test_timeseries.csv`). It is a
  field-name contract only; no official rows are stored.
- `validation-event-labels.sample.csv` — sanitized sample of the official
  `05_validation_event_labels.csv` format (official header + three representative
  rows with rewritten identifiers). Official data itself stays read-only outside
  the repository; `packages/h2-vocabulary/data/*.json` remains the source of
  truth for the vocabulary contracts these fixtures exercise.
