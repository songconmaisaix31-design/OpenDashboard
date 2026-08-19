# H2 Contracts Handoff

## Branch and Base

- Worker branch: `songconmaisaix31-design/h2-contracts`
- Immutable base SHA: `ba4c2054f67bc7387ec579479c584c2292d917ad`
- Owned write path: `packages/h2-contracts/**`
- Denylist observed: no files outside `packages/h2-contracts/**` were staged or committed.

## Archive Commits

- `41aafab71f20b05ff063cc17da2ecaeda043b98f` -
  `feat(h2-contracts): freeze canonical contract surface`
- Handoff commit: this file is the follow-up documentation commit. Its exact
  SHA is reported in the Orca `worker_done` payload because a Git commit cannot
  truthfully contain its own final object ID without rewriting history.

## Changed Paths

- `packages/h2-contracts/src/**`
- `packages/h2-contracts/schema/**`
- `packages/h2-contracts/fixtures/**`
- `packages/h2-contracts/test/**`
- `packages/h2-contracts/README.md`
- `packages/h2-contracts/package.json`
- `packages/h2-contracts/HANDOFF.md`

## Contract Surface

- Dataset manifest, field dictionary, row count, time range, fingerprint, and
  provenance.
- Data-quality report with pass/warning/blocked status, typed check codes, and
  blocking reasons.
- C01-C07 anomaly code vocabulary, required subtype vocabulary, severity
  vocabulary, control-object/equipment references, event timing, evidence,
  impact, safety, recommendations, review state, and human-confirmation flag.
- Provenance modes: `FIXTURE`, `LIVE_ANALYSIS`, `DERIVED`, `MODEL`, `RULE`,
  and `LLM_RENDERED`.
- Ten official assistant question IDs and structured answer/citation shape.
- Report descriptor contracts for HTML, JSON, CSV, validation, and quality
  artifacts.
- Exact submission row columns and source-order serializer.
- `H2SentinelDataSource` as the Web-facing port.
- API success, warning, and redacted-error envelopes.

## Schema Invariants

- `submission.csv` column order is frozen by `H2_SUBMISSION_COLUMNS`.
- Event start, end, and first-detection timestamps are distinct fields.
- Event confidence is normalized to `0..1`.
- Operational recommendations are advisory and require human confirmation.
- Fixture data is always explicitly marked `FIXTURE`.
- Golden C03/C04 fixtures are sanitized synthetic data, not official data.
- Redacted API errors carry stable codes and messages but no stack traces,
  secrets, or absolute local paths.

## Commands and Results

- `npm ci` - passed; installed dependencies from the existing root lockfile.
- `npm run typecheck` - passed after `npm ci`.
- `npm run test` - passed; 42 tests passed including existing repository tests
  and H2 contract tests.
- `node --import tsx --test "packages/h2-contracts/test/*.test.ts"` - passed;
  10 H2 contract tests passed.
- `git diff --check` - passed after adding this handoff file and before the
  handoff archive commit.
- Note: one pre-install `npm run typecheck` attempt failed because `tsc` was
  unavailable before `npm ci`; rerunning after lockfile install passed.

## Limitations

- No official competition dataset, labels, model output, or large artifact is
  included.
- No analytics, plugin adapter, Web UI, root manifest, launcher, CI, or
  submission-package file was changed.
- The JSON Schema tests use a small local validator covering the schema
  constructs used here. Downstream integration may use a full JSON Schema
  validator without changing the contract files.
- Root package exports or path aliases are not added because root manifests are
  outside this track's write allowlist.

## Requested Coordinator Decisions

- Accept or reject the contract gate commits on the competition integration
  branch.
- Record the accepted H2 contract gate SHA after cherry-picking.
- Decide whether integration should add a package export/path alias for
  `@opendashboard/h2-contracts` or keep downstream imports relative during the
  competition branch assembly.
