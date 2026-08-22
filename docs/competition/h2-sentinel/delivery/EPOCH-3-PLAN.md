# H2 Sentinel Epoch 3 Delivery Plan

## 1. Authority, history, and new base

Epoch 3 is the explicitly authorized contract-boundary epoch for the analytics
severity mismatch discovered after the Epoch 2 dispatch. Its immutable
`planParentSha` is:

```text
166198e8ff37842b064bc0adcfd55ba222b56258
```

Epoch 2 remains `HOLD`. Its sanitized diagnostic evidence showed that import and
analyze each returned HTTP `200`, but the strict canonical consumer
rejected all `104` analysis events because the internal API returned the
official Chinese severity labels instead of the canonical English contract
values. Transport success was not contract success, and no Epoch 2 result is
promoted by this plan.

Commit `1ff32c6d6ce88d26ff6e3602ee149c4b3eed7482` is a retained historical
experiment only. It may be read as implementation context, but it is not an
accepted worker commit, integration input, test result, official-run result, or
release evidence. It must not be cherry-picked, rebased into, or otherwise
presented as proof for Epoch 3. The Epoch 3 worker must produce a fresh commit
from the new frozen base and pass every gate in this document.

This plan must be committed and published normally on
`songconmaisaix31-design/h2-delivery-plan-e3`. After publication, the
coordinator independently observes that branch with `git ls-remote` and records
the observed plan HEAD as the new `parallelTaskBaseSha`. This document does not
self-reference that future value. No worker or integration worktree may be
created before the independent observation succeeds.

## 2. Specify -> Plan -> Task -> Execute -> Verify

### Specify

The product defect is a boundary error, not a taxonomy change:

- every internal analytics object and API response must use only `low`,
  `medium`, `high`, or `critical`;
- `eventCountsBySeverity` must contain all four canonical keys, including zero
  values, and its counts must equal the returned events;
- the external official submission must continue to use the Chinese severity
  required by the C01-C07 taxonomy: C01 and C06 are `中`; C02, C03, C04, C05,
  and C07 are `高`;
- an unknown anomaly code, unknown official severity, or missing mapping must
  fail closed; there is no default or best-effort translation;
- tests must validate internal analysis and event objects against the unchanged
  canonical schemas and must not relax, copy-edit, or bypass an internal
  severity enum or count shape;
- the external CSV boundary is validated by the existing official submission
  checker, not by mutating an internal schema.

The user-visible result is a truthful same-origin official flow whose analysis
events can reach the Web application without contract rejection, while the
submitted artifact still uses the organizer-required Chinese taxonomy. This
repair changes no control behavior and preserves the read-only, loopback-only,
human-confirmation boundary.

### Plan

Epoch 3 has exactly one serial worker. There are no parallel tracks, speculative
workers, or overlapping owners.

| Item | Fixed value |
| --- | --- |
| Worker branch | `songconmaisaix31-design/h2-e3-severity-contract` |
| Worker worktree | `h2-e3-severity-contract` |
| Exact worker write allowlist | The nine files enumerated in Section 2.1 |
| Integration branch | `songconmaisaix31-design/h2-delivery-integrate-e3` |
| Integration worktree | `h2-delivery-integrate-e3` |
| Dispatch model | One worker, then one integration gate, then one official run |

The worker branch is created from the independently observed
`parallelTaskBaseSha`. The coordinator waits for the worker's local tests,
normal push, and independent remote-SHA verification before creating the unique
integration worktree. The integration branch is also created from the same
`parallelTaskBaseSha` and incorporates only the accepted new worker SHA. No
other Epoch 2 or Epoch 3 commit is an integration input.

`parallelTaskBaseSha` is retained as the release-lineage field name for
compatibility with the existing delivery records. It does not authorize
parallel work in Epoch 3.

### Task

The worker performs one bounded contract-boundary repair:

1. Add failing-first tests inside `services/h2-analytics/tests/**` that expose
   the base defect without reading official data.
2. Make internal event severity and analysis severity counts canonical.
3. Translate severity to the official Chinese value only when serializing the
   external official submission.
4. Make every mapping closed and deterministic for all C01-C07 codes and all
   four canonical keys.
5. Remove internal-schema test relaxation and validate the untouched package
   schemas directly.
6. Update service-local handoff documentation if needed, without writing
   outside the nine-file allowlist.
7. Produce one focused commit with an English imperative message, push it
   normally, and independently verify its remote SHA.

The nine files are sufficient for the existing service contract, vocabulary
adapter, diagnosis builder, submission renderer, golden smoke, focused tests,
and service-local handoff. This is not permission to refactor unrelated
analytics code.

### Execute

#### 2.1 Frozen and authorized identities

The following parent identities are authoritative:

| Object | Required parent identity | Epoch 3 rule |
| --- | --- | --- |
| `packages/h2-contracts/**` tree | `11608e5ff5c0e69c3dd4a18588e5a13027151e82` | Frozen; must remain byte-identical. |
| `packages/h2-vocabulary/**` tree | `84d3d39a864e25e69e607a0314f3b27aa10c0fe8` | Frozen; official taxonomy remains authoritative. |
| `services/h2-analytics/src/h2_analytics/contracts.py` blob | `3d33f410379339f417f4bc7451483e484124acc6` | Starting blob only; its severity definition may change in this epoch. |

Epoch 3 explicitly authorizes changing the old frozen analytics
`contracts.py` blob within the worker allowlist. It does not authorize changing
the package contract tree or vocabulary tree. Within `contracts.py`, the
submission column tuple remains unchanged; only the internal severity boundary
may be aligned with the canonical package contract.

The following identities are also frozen. Because this plan is the only change
between `planParentSha` and the published plan HEAD, the coordinator must observe
these exact values again at `parallelTaskBaseSha` before dispatch and at the
worker and integration heads:

| Frozen object | Required identity |
| --- | --- |
| H2 Web feature tree | `171574316c26f1c2074b8f85ef9573c9d1675212` |
| H2 adapter tree | `23cb45f0c47a7b405c7d0604a7faf75ba0c14be9` |
| Official runner blob | `26ad9a2b6df49659118212e36e370c5e4f391915` |
| Official runner test blob | `ab578825564b58f741b12c07cb20dde881fe9bda` |
| Official checker blob | `5c1233536e1ad3b88392db2fd5a60f1a5eb57d07` |
| Submission PowerShell validator blob | `eddb832c117a2cd3e23825cde43287958957ae34` |
| Analytics route manifest blob | `fe10f9bb50f82f086e6d7af4f26209bb702585c0` |
| Analytics API tree | `f21dda31bfe9963ac4deead10124cf4e973ce7ca` |
| Analytics project manifest blob | `858a1b91d116c54e2ca2e127c9b75d1ff00a1b9f` |
| Analytics lockfile blob | `fa425ae9a36e2733179e9c9d243da37262dab619` |
| Root package manifest blob | `265c8819a9b14e2c5b43235dcadb74da9a866306` |
| Root lockfile blob | `7bbc42733e0d0cd9ce47f89127b750608aa0cd57` |

The exact worker write allowlist is closed to these nine files:

1. `services/h2-analytics/HANDOFF.md`
2. `services/h2-analytics/src/h2_analytics/contracts.py`
3. `services/h2-analytics/src/h2_analytics/diagnosis/builder.py`
4. `services/h2-analytics/src/h2_analytics/reports/submission.py`
5. `services/h2-analytics/src/h2_analytics/tools/smoke_golden.py`
6. `services/h2-analytics/src/h2_analytics/vocabulary.py`
7. `services/h2-analytics/tests/test_api.py`
8. `services/h2-analytics/tests/test_contract_validation.py`
9. `services/h2-analytics/tests/test_detection_pipeline.py`

The historical experiment touched the same file set, but that coincidence does
not make its patch, tests, or results evidence. The worker owns only the paths,
not the historical implementation.

In addition to the closed nine-file list, the nested denylist is recorded
explicitly: the worker must not edit
`services/h2-analytics/ROUTES.json`,
`services/h2-analytics/src/h2_analytics/api/**`,
`services/h2-analytics/pyproject.toml`, or
`services/h2-analytics/uv.lock`. No route, method, namespace, request envelope,
response envelope, timeout, UI field, adapter behavior, validator rule,
submission column, or dependency may change.

#### 2.2 Internal/API boundary

All analysis events returned by the service and API use the canonical English
severity enum. The mapping from the frozen official vocabulary is explicit and
closed:

| Official taxonomy value | Internal/API value |
| --- | --- |
| `低` | `low` |
| `中` | `medium` |
| `高` | `high` |
| `危急` | `critical` |

The analysis response contains exactly these keys in
`eventCountsBySeverity`: `low`, `medium`, `high`, and `critical`. Every value is
a non-negative integer, absent categories are represented by zero, no Chinese or
unknown key is present, each event contributes to exactly one key, and the sum
equals the event array length.

An unknown vocabulary value, unknown anomaly code, missing code entry, or
non-canonical internal value is a hard error. The implementation must not use a
fallback value, silently omit the event, retain the Chinese value internally,
or coerce an unknown value into `medium` or `high`.

#### 2.3 External official-submission boundary

The official submission renderer performs the inverse boundary operation by
anomaly code at serialization time. It writes `中` for C01/C06 and `高` for
C02/C03/C04/C05/C07. It does not copy an internal severity string into the
external CSV and does not infer the external value from user input.

The external artifact retains the frozen 16-column order and every existing
official checker rule. Tests validate this artifact with the existing checker
and explicit all-code mapping assertions. They must not mutate an internal JSON
schema to accept an external value.

#### 2.4 Failing-first red gate

Before changing product code, the worker adds only the focused test assertions
needed to prove the defect and runs the targeted command. The red result is
accepted only when it fails because the base returns Chinese internal event
severity and incomplete/non-canonical severity-count keys. A dependency,
environment, path, fixture, import, or unrelated assertion failure is not red
evidence.

The failing-first assertions cover:

- direct validation of analysis runs and events against the unmodified package
  schemas;
- exact four-key severity counts, zero-key retention, and count/event equality;
- API events using canonical English values;
- all seven code-to-internal and code-to-external mappings;
- external official submission values checked without internal-schema
  relaxation;
- unknown code and unknown taxonomy severity failing closed.

The worker records only the test names, command, base SHA, and expected contract
failure summary. It does not record raw payloads or runtime connection details.

#### 2.5 Green implementation gate

Green requires all red assertions to pass after the minimal implementation, the
full locked Python suite to pass, and the deterministic golden smoke to prove
both boundaries. Green additionally requires:

- internal schemas are loaded and validated without enum/count rewriting;
- the API returns canonical event severity and complete four-key counts;
- the golden external CSV uses the official Chinese mapping and passes the
  unchanged checker;
- the 16 submission columns are unchanged;
- unknown mappings fail closed;
- no route, dependency, contract package, vocabulary package, UI, adapter,
  validator, or runner file changed.

### Verify

#### 2.6 Plan publication, worker commands, and gates

The plan owner first proves that this branch adds only this plan, then commits
and publishes it without rewriting history:

```powershell
git diff --check
git status --short
git add -- docs/competition/h2-sentinel/delivery/EPOCH-3-PLAN.md
git commit -m "docs(h2): plan epoch 3 severity contract"
git diff --check 166198e8ff37842b064bc0adcfd55ba222b56258 HEAD
git diff --name-only 166198e8ff37842b064bc0adcfd55ba222b56258 HEAD
git push -u origin HEAD:refs/heads/songconmaisaix31-design/h2-delivery-plan-e3
git ls-remote --heads origin `
  refs/heads/songconmaisaix31-design/h2-delivery-plan-e3
```

Before the commit, `git status --short` must show only this untracked plan.
After the English plan commit, the name-only check is performed against `HEAD`.
In both cases the only path may be
`docs/competition/h2-sentinel/delivery/EPOCH-3-PLAN.md`. The push and
`git ls-remote` are separate commands, and the observed remote SHA becomes
`parallelTaskBaseSha` only when it equals the local plan HEAD.

The coordinator creates the worker only after recording the remote plan HEAD:

```powershell
git worktree add ../h2-e3-severity-contract `
  -b songconmaisaix31-design/h2-e3-severity-contract `
  <parallelTaskBaseSha>
```

The worker verifies its base before editing:

```powershell
git rev-parse HEAD
git rev-parse HEAD:packages/h2-contracts
git rev-parse HEAD:packages/h2-vocabulary
git rev-parse HEAD:services/h2-analytics/src/h2_analytics/contracts.py
git status --short
```

After adding the failing-first tests and before product changes, the worker runs
the targeted red gate from `services/h2-analytics`:

```powershell
uv lock --check
uv sync --locked --extra dev
uv run --locked --extra dev pytest `
  tests/test_contract_validation.py `
  tests/test_api.py `
  tests/test_detection_pipeline.py
```

After implementation, the worker runs the same targeted command for green and
then runs the full service gates:

```powershell
uv lock --check
uv sync --locked --extra dev
uv run --locked --extra dev pytest tests
uv run --locked --extra dev python -m h2_analytics.tools.smoke_golden
```

From the repository root, the worker then runs:

```powershell
git diff --check <parallelTaskBaseSha> HEAD
git diff --name-only <parallelTaskBaseSha> HEAD
git rev-parse HEAD:packages/h2-contracts
git rev-parse HEAD:packages/h2-vocabulary
git diff --exit-code <parallelTaskBaseSha> HEAD -- `
  apps/web/src/features/h2-sentinel `
  plugins/h2-ems `
  validation `
  submission/h2-sentinel/scripts/validate-submission.ps1 `
  services/h2-analytics/ROUTES.json `
  services/h2-analytics/src/h2_analytics/api `
  services/h2-analytics/pyproject.toml `
  services/h2-analytics/uv.lock
```

`git diff --name-only` must contain only the nine exact allowlisted files. The
worker commit is rejected if any tenth file appears, if the contract or
vocabulary tree differs from the frozen identity, if a nested-denylist path
changed, or if the diff includes an unrelated cleanup.

The worker uses a single English commit, a normal push, and a separate remote
observation:

```powershell
git push -u origin HEAD:refs/heads/songconmaisaix31-design/h2-e3-severity-contract
git ls-remote --heads origin `
  refs/heads/songconmaisaix31-design/h2-e3-severity-contract
```

The independently observed remote SHA must equal the accepted local worker SHA.
A local commit, push exit code, or experiment commit is not a remote-SHA gate.

#### 2.7 Unique integration gate

Only after the worker remote-SHA gate passes does the coordinator create the
integration worktree from `parallelTaskBaseSha`:

```powershell
git worktree add ../h2-delivery-integrate-e3 `
  -b songconmaisaix31-design/h2-delivery-integrate-e3 `
  <parallelTaskBaseSha>
Push-Location ../h2-delivery-integrate-e3
git cherry-pick --no-commit <accepted-worker-sha>
git diff --cached --check
git diff --cached --name-only
git write-tree
git rev-parse '<accepted-worker-sha>^{tree}'
git commit -m "chore(h2): integrate epoch 3 severity contract"
git rev-parse HEAD
git rev-parse HEAD^
git rev-parse 'HEAD^{tree}'
git rev-parse '<accepted-worker-sha>^{tree}'
Pop-Location
```

The staged tree written before commit and the final integration tree must equal
the accepted worker tree. The integration HEAD is a unique integration commit
whose sole parent is `parallelTaskBaseSha`, and it must differ from the worker
SHA. A cherry-pick conflict, conflict resolution, coordinator edit, second
worker patch, experiment patch, or unrelated plan/release change invalidates
the assembly and requires a new audited worker handoff.

The coordinator runs the complete assembled gates from the integration
worktree:

```powershell
Push-Location ../h2-delivery-integrate-e3
npm ci
npm run check
npm run h2:check
npm run h2:smoke
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File submission/h2-sentinel/scripts/validate-submission.ps1
pwsh -NoProfile `
  -File submission/h2-sentinel/scripts/validate-submission.ps1

Push-Location services/h2-analytics
uv lock --check
uv sync --locked --extra dev
uv run --locked --extra dev pytest tests
uv run --locked --extra dev python -m h2_analytics.tools.smoke_golden
Pop-Location

git diff --check <parallelTaskBaseSha> HEAD
git rev-parse HEAD:packages/h2-contracts
git rev-parse HEAD:packages/h2-vocabulary
Pop-Location
```

The package contract tree must still equal
`11608e5ff5c0e69c3dd4a18588e5a13027151e82`; the vocabulary tree must still
equal `84d3d39a864e25e69e607a0314f3b27aa10c0fe8`. The coordinator repeats the
worker's frozen-path `git diff --exit-code` check and records the final
`contracts.py` blob as the new authorized analytics boundary identity.

The integration branch is published normally and observed independently:

```powershell
Push-Location ../h2-delivery-integrate-e3
git push -u origin HEAD:refs/heads/songconmaisaix31-design/h2-delivery-integrate-e3
Pop-Location
git ls-remote --heads origin `
  refs/heads/songconmaisaix31-design/h2-delivery-integrate-e3
```

The official runner remains forbidden until the observed integration remote SHA
equals the verified integration HEAD.

#### 2.8 Official runner gate

The existing runner and checker are frozen inputs. The coordinator runs them
only from the published, remote-verified integration head. The raw official CSV
remains external and read-only. It is supplied only at runtime and is never
committed, copied into a fixture, or recorded in evidence.

The run host must have at least 8 GiB of physical RAM, and the runner must use
the declared 4 GiB Node heap. A failed resource preflight is a new sanitized
failed attempt, not permission to change the runner or omit a stage.

The runner must verify these exact identities before starting the application:

| Representation | Bytes | SHA-256 | Rows | Fields |
| --- | ---: | --- | ---: | ---: |
| Raw official CSV | `77,865,257` | `88f3a5c15fb5c42d265475f2998fe9f6c271dcef16f43daee7626f6704504cd9` | `172,800` | `69` |
| Normalized official CSV | `78,038,054` | `4407495ad75299f2f8f06112f6d3209eb93b2773ff3f0c797c47874159853169` | `172,800` | `69` |

The coordinator invokes the existing command with the runtime-only approved
input and the independently verified integration SHA:

```powershell
Push-Location ../h2-delivery-integrate-e3
node --max-old-space-size=4096 --import tsx validation/official-csv-e2e.mjs `
  --official-csv "<operator-approved-read-only-csv>" `
  --expected-commit "<verified-integration-sha>" `
  --run-id "<existing-sanitized-run-id>" `
  --task-id "<recorded-task-id>" `
  --dispatch-id "<recorded-dispatch-id>"
Pop-Location
```

Attempts 1 through 5 are immutable historical evidence. The runner must create
a new monotonically allocated attempt and must not rename, overwrite, edit, or
delete any earlier attempt. A retry after any new failure creates another new
attempt; evidence is never repaired in place.

Because the runner is frozen, it continues writing the existing
`validation/reports/epoch-2/**` repository-relative namespace. Epoch 3
provenance comes from the new tested SHA, recorded task and dispatch identities,
and newly allocated attempt; this plan does not claim or create an Epoch 3
report namespace.

The new attempt passes the official core chain only when all of the following
are true:

1. Raw and normalized bytes, SHA-256, rows, and fields exactly match the table.
2. Import and analyze complete through the same-origin Web path; transport
   status alone is insufficient.
3. The strict consumer accepts exactly `104` returned analysis events against
   the unchanged internal contracts.
4. Every event severity is canonical English; the severity-count object has all
   four canonical keys, equals the per-event counts, and sums to `104`.
5. Export is bound to that analysis run and produces the official external
   Chinese severity by C01-C07 taxonomy.
6. The unchanged checker accepts exactly 16 columns, reports a valid artifact,
   and its row count equals the analysis event count (`104`).
7. Cleanup succeeds and no stage is skipped, substituted, retried in place, or
   satisfied from Fixture evidence.

Series hydration runs only after checker success and remains an independent
measurement. It passes only when it is bound to the same dataset and
fingerprint, selects between 1 and 32 unique valid variables, and returns a
point count equal to the normalized row count. A successful core chain does not
hide a hydration failure. Epoch 3 technical delivery remains `HOLD` until the
independent hydration result is delivered and accepted.

The report contains only repository-relative artifact references, fixed
identities, tested SHA, attempt identity, stage statuses, stable error codes,
hashes, counts, durations, and bounded resource counters. It must not contain
an absolute or private path, runtime port, URL, CSV content, environment value,
credential, PID, command argument, raw request/response body, stdout, stderr, or
stack trace. A report-sanitization failure fails the attempt.

## 3. Acceptance criteria

Epoch 3's technical gate is `GO` only when all of these conditions are true:

- the published plan HEAD was independently observed and used as the sole
  `parallelTaskBaseSha`;
- exactly one serial worker was created from that base and changed only
  the nine exact allowlisted files;
- red evidence failed for the intended canonical severity mismatch, then the
  targeted and full green gates passed;
- internal/API events use only canonical English severity, and every analysis
  response carries exact four-key severity counts;
- unknown codes and severities fail closed;
- external official submission severity is Chinese by the frozen C01-C07
  taxonomy and the 16 columns remain unchanged;
- internal schemas are validated unchanged, without test relaxation;
- contract/vocabulary trees, UI, adapter, runner, checker, validators, routes,
  columns, and dependencies remain frozen;
- the worker and integration branches were normally pushed and independently
  observed at their accepted SHAs;
- the unique integration commit has the frozen base as its sole parent, differs
  from the worker SHA, and has the same tree as the accepted worker commit;
- the unique integration gate passed all npm, H2, Python, smoke, PowerShell, diff,
  and frozen-identity checks;
- the new official attempt preserved attempts 1-5, matched both exact input
  identities, passed same-origin import/analyze for strict 104 events, passed
  export/checker with 16 columns and count equality, and produced a sanitized
  report;
- independent series hydration passed and was accepted.

No metric, score, rank, deployment, screenshot, eligibility, submission,
receipt, approval, or competition acceptance follows from this technical gate.

## 4. Independent release gates and verdicts

The coordinator records each of the following independently and binds every
success to an immutable SHA or external receipt identity:

1. **CI:** the required remote jobs run on the integration SHA; committed
   workflow text or local tests are not remote CI evidence.
2. **Official evaluation and score:** validation metrics and the overfit
   sentinel require their own labeled datasets, matching contract, tested SHA,
   and versioned reports. The unlabeled official test flow cannot create F1,
   precision, recall, accuracy, rank, or organizer score evidence. The worker's
   failing-first regression red/green is unrelated to the overfit sentinel's
   metric verdict.
3. **Deployment:** the deployed artifact identity equals the tested integration
   SHA; configuration or a successful upload is not runtime proof.
4. **Deep links:** every required H2 route is loaded directly and refreshed on
   the deployed artifact, with the generic entry preserved and invalid modes
   failing closed. A root-page success does not prove a deep link.
5. **Visual review:** desktop and narrow-width results are recorded separately,
   including provenance labels, no clipping/overlap, and the
   human-confirmation boundary. A manual note is not a committed screenshot.
6. **Eligibility:** team and account eligibility come only from direct organizer
   evidence.
7. **Formal submission:** a completed technical artifact or local validator is
   not proof that the organizer form was submitted.
8. **Receipt/approval:** receipt, approval, and acceptance are distinct states
   and require their own organizer evidence.

The technical delivery may be recorded as `GO` when Section 3 passes. The final
release/competition verdict remains `HOLD` while eligibility is unknown, and it
also remains `HOLD` for any other required independent gate without direct
evidence. This dual status must be explicit; a technical `GO` must never be
rewritten as eligibility, submission, receipt, approval, or acceptance.

## 5. Risks and fail-closed responses

| Risk | Required response |
| --- | --- |
| Historical experiment is mistaken for accepted evidence | Reject the handoff; require a fresh worker commit descended from `parallelTaskBaseSha`. |
| Chinese taxonomy leaks back into internal/API objects | Fail unmodified-schema validation and the strict API test. |
| Internal English severity leaks into the official submission | Fail all-code mapping assertions and the unchanged official checker. |
| Counts omit zero categories or diverge from events | Fail the exact-key, per-event, sum, and API assertions. |
| Unknown code or severity receives a default | Raise a closed mapping error and fail the negative test. |
| A test rewrites an internal schema | Reject the worker even if tests pass. |
| Worker changes a frozen path or dependency | Reject the diff; do not repair it in integration. |
| Integration contains more than the accepted worker SHA | Recreate the integration branch from the frozen base. |
| An official identity or same-origin stage differs | Record a sanitized failed attempt and keep `HOLD`; do not retry in place. |
| Evidence leaks runtime or private data | Fail the attempt, quarantine the report from publication, and create a new sanitized attempt without deleting history. |
| Technical pass is used to imply release status | Keep independent gates pending and the overall verdict `HOLD`. |

## 6. Coordinator completion checklist

- [ ] Verify `planParentSha` and ensure this plan commit changes only
  `docs/competition/h2-sentinel/delivery/EPOCH-3-PLAN.md`.
- [ ] Run `git diff --check`, commit with an English message, push the plan
  normally, and independently observe its remote branch SHA.
- [ ] Record that observed plan SHA as `parallelTaskBaseSha` before dispatch.
- [ ] Record all frozen trees/blobs at the base, including the authorized
  starting `contracts.py` blob and the nested denylist.
- [ ] Create exactly one serial worker with the specified branch, worktree, and
  write allowlist.
- [ ] Capture the intended red failure, all green commands, the worker SHA, and
  an independent worker remote SHA.
- [ ] Create the unique integration branch from the same base, apply only the
  accepted worker SHA with `cherry-pick --no-commit`, verify the staged tree,
  and produce a distinct one-parent integration commit with an identical tree.
- [ ] Run every assembled npm, H2, Python, smoke, PowerShell, diff, and identity
  gate; normally push and independently verify the integration SHA.
- [ ] Run the official input only after the integration remote-SHA gate; preserve
  attempts 1-5 and create a new immutable attempt.
- [ ] Verify exact raw/normalized identities, strict 104 events, four-key counts,
  external Chinese severity, 16 columns, count equality, cleanup, report
  sanitization, and independent series hydration.
- [ ] Record CI, deployment, deep-link, visual, eligibility, formal submission,
  receipt, approval, and acceptance as independent gates.
- [ ] Record technical `GO` only if Section 3 passes, while retaining the final
  `HOLD` when eligibility remains unknown or another required independent gate
  lacks evidence.
