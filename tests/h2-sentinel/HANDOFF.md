# H2 Sentinel QA Handoff

## Ownership and base

- Branch: `songconmaisaix31-design/h2-qa`
- Worktree: `C:\Users\DW\orca\workspaces\OpenDashboard\h2-qa`
- Immutable base SHA: `f9dd7df83a81da57fdaa2b03cd67470c8c7a22c4`
- Current head before this final handoff archive: `93e6238400e86e4402c084fc56ae15f9f36d149f`
- Owned write paths: `tests/h2-sentinel/**` only.
- Verified before editing: the branch was at the immutable gate and `git status
  --short` was empty.

## Pushed archive commits

| SHA | Purpose | Checks |
| --- | --- | --- |
| `041f83803a9ffa3a30c8c1b744d973f7442692aa` | Contract acceptance harness, assembly scripts, matrix, and defect protocol | Node syntax checks passed; submission conformance passed; API and Web scripts explicitly skipped without assembled URLs; contract harness found H2-QA-001; `git diff --check` passed. |
| `93e6238400e86e4402c084fc56ae15f9f36d149f` | Correct QA expectation to canonical C04 impact | Read-only verified corrected integration gate `4f2a8a3156a96a7670f4ee9830ff1c560faf1c94`; syntax and diff checks passed; archived-H0 tests intentionally reject the old `86.5` value. |

## Delivered behavior

- `run-contract-qa.mjs` is a dependency-free Node contract gate. It checks the
  sanitized fixture fingerprint, C03 command/BESS evidence, C04 impact
  calculation, Fixture provenance, human-confirmation boundary, and the
  report/submission/redaction contract surface.
- `ACCEPTANCE_MATRIX.md` separates runnable H0 rows from analytics, plugin,
  offline journey, loopback, report, provenance, redaction, and responsive UI
  suites that require later assembly.
- `DEFECT_LOG.md` contains H2-QA-001 with exact reproduction and contract-track
  ownership. The coordinator resolved it in corrected integration contract gate
  `4f2a8a3156a96a7670f4ee9830ff1c560faf1c94`; this worker does not merge it.

## Public interfaces consumed

- Canonical H2 JSON Schemas, C03/C04 fixtures, CSV fixture, report descriptor,
  API envelope, and exact submission-column contract.
- H2 PRD, branch overview, and H4 task acceptance requirements.

## Public interfaces produced

None. This QA lane produces executable probes and evidence only.

## Verification commands and exact results

Run from repository root:

```bash
node --check tests/h2-sentinel/run-contract-qa.mjs
node --check tests/h2-sentinel/api/run-api-safety.mjs
node --check tests/h2-sentinel/golden-path/run-offline-golden-path.mjs
node --test "tests/h2-sentinel/contract/*.test.mjs"
node tests/h2-sentinel/api/run-api-safety.mjs
node tests/h2-sentinel/golden-path/run-offline-golden-path.mjs
node tests/h2-sentinel/run-contract-qa.mjs
git diff --check
```

- Syntax checks: passed.
- Submission conformance: 2 passed, 0 failed.
- API safety probe: `SKIP A01/A04/A07` because `H2_ANALYTICS_URL` is unset on
  H0.
- Offline Web entry probe: `SKIP A03/A06/A08` because `H2_WEB_URL` is unset on
  H0.
- Archived-H0 contract harness: `PASS=4 SKIP=8 FAIL=1`; the one failure was
  H2-QA-001. The harness now expects corrected C04 impact
  `29.333333333333332 kWh` and must pass after QA consumes the corrected gate.
- `git diff --check`: passed before archive commit.

Read-only correction verification:

```bash
git show 4f2a8a3156a96a7670f4ee9830ff1c560faf1c94:packages/h2-contracts/fixtures/golden-c04.json
```

The corrected integration object contains both C04 derived evidence and impact
value `29.333333333333332`. No integration or main branch was modified,
checked out, merged, or cherry-picked by this QA lane.

The existing TypeScript contract-owner test command could not run because this
restricted QA worktree lacks the already-locked `tsx` dependency. Installing it
would write outside this lane's allowlist, so no root dependency mutation was
performed.

## Generated artifacts

- `ACCEPTANCE_MATRIX.md`
- `DEFECT_LOG.md`
- dependency-free Node scripts under `api/`, `golden-path/`, and the QA root

## Known limitations

- H0 contains no H2 analytics API, H2 EMS adapter, H2 Web feature, report
  exporter, or local sidecar; all eight corresponding acceptance rows are
  explicit `SKIP`.
- H2-QA-001 is resolved by corrected integration contract gate
  `4f2a8a3156a96a7670f4ee9830ff1c560faf1c94`. This branch intentionally stays
  on archived H0 and therefore still demonstrates the pre-correction failure.

## Contract change request CCR-H4-001

- Requesting branch: `songconmaisaix31-design/h2-qa`
- Requesting commit: `041f83803a9ffa3a30c8c1b744d973f7442692aa`
- Existing schema/type: C04 canonical golden fixture impact and evidence.
- Problem demonstrated by: `node tests/h2-sentinel/run-contract-qa.mjs`.
- Smallest proposed change: make C04's declared impact agree with its frozen
  minute CSV and PRD formula, or correct the CSV/interval with matching schema
  tests and an updated contract gate. Completed by corrected gate
  `4f2a8a3156a96a7670f4ee9830ff1c560faf1c94`.
- Backward compatibility: fixture output value changes; downstream expectations
  must be updated deliberately.
- Golden fixture impact: C04 report and submission evidence are blocked.
- Other tracks affected: H0 Contracts, H1 Analytics, H2 Plugin, H3 Web, H5
  Submission, and H6 Integration.
- Blocker severity: resolved by corrected contract gate; QA consumption pending.

## Integration changes required outside this track

H6 should invoke the commands in `README.md` after assembly and provide only
loopback `H2_ANALYTICS_URL`, optional `H2_API_FAILURE_URL`, and `H2_WEB_URL` to
the respective public probes. Browser-level route selectors and screenshot
checks must be added after the Web track publishes its route contract.

## Open-source reuse decisions

No dependency or external code was added; all QA programs use Node built-ins.

## Golden-path risk

Do not claim a passing C04 golden journey on archived H0. Re-run the QA harness
against corrected integration gate `4f2a8a3156a96a7670f4ee9830ff1c560faf1c94`
before accepting the correction.

## Recommended cherry-pick order

1. `041f83803a9ffa3a30c8c1b744d973f7442692aa`
2. `93e6238400e86e4402c084fc56ae15f9f36d149f`
3. This final handoff archive commit

The exact pushed worker `HEAD` for this self-describing handoff archive is
reported in the orchestration completion payload after commit and push; this
file intentionally does not self-reference an as-yet-uncreated Git object.
