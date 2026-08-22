# H2 Sentinel Epoch 2 Delivery Plan

## 1. Purpose and frozen base

Epoch 2 is a constrained reliability and official-data delivery epoch. Its `planParentSha` is the immutable parent commit `3810c04a50bcacc30172833adff228e10a406ea7`. The parent has already passed the Ubuntu H2, Windows H2, and generic CI checks; those results are prerequisites, not a substitute for the gates defined here. Before dispatch, the coordinator must independently observe the final published plan-branch HEAD and freeze that value as `parallelTaskBaseSha`; this document deliberately does not self-reference that future value.

The epoch is a no-contract-change release. The following identities are frozen and must be recorded by the coordinator before dispatch:

- `packages/h2-contracts/**` tree: `11608e5ff5c0e69c3dd4a18588e5a13027151e82`;
- `packages/h2-vocabulary/**` tree: `84d3d39a864e25e69e607a0314f3b27aa10c0fe8`;
- `services/h2-analytics/src/h2_analytics/contracts.py` blob: `3d33f410379339f417f4bc7451483e484124acc6`;
- `planParentSha`: `3810c04a50bcacc30172833adff228e10a406ea7`.

Workers must verify those object identities with `git rev-parse`/`git rev-parse HEAD:<path>` and must not edit, regenerate, reformat, or indirectly alter them. Any defect in a frozen contract, vocabulary, analytics blob, event schema, field name, provenance value, route envelope, or export column is a handoff to a future contract epoch. It is not an Epoch 2 patch. The coordinator records all verified identities in the final release manifest; a plan document cannot make a contract change acceptable.

The frozen base also includes the existing H2 route vocabulary, Live adapter envelopes, Fixture provenance, analytics request/response shapes, and submission columns. No track may add a new dependency, rename an API field, change a timeout contract, or change a report schema to make its local test easier.

## 2. Specify -> Plan -> Task -> Execute -> Verify

### Specify

The product requirement is a truthful, reproducible path from an authorized official CSV to a same-origin Web import, analysis, export, and checker result, while retaining a deterministic Fixture path. Reliability changes must preserve the human-confirmation boundary and read-only loopback boundary. Official metrics, score, deployment, visual review, eligibility, and organizer acceptance are separate facts and must never be inferred from a passing unit test or a plan.

The exact official input identity is fixed:

| Representation | Bytes | SHA-256 | Rows | Fields |
| --- | ---: | --- | ---: | ---: |
| Raw official CSV | `77,865,257` | `88f3a5c15fb5c42d265475f2998fe9f6c271dcef16f43daee7626f6704504cd9` | `172,800` | `69` |
| Normalized official CSV | `78,038,054` | `4407495ad75299f2f8f06112f6d3209eb93b2773ff3f0c797c47874159853169` | `172,800` | `69` |

The file is external, read-only, and must not be committed, copied into reports, or embedded in fixtures. A run may refer to it only by an approved environment variable or operator-provided path; sanitized evidence records the expected identity, not the path.

### Plan

Six implementation tracks are deliberately independent. Each has one owner, one exact write allowlist, one worktree, and one branch created from the coordinator-frozen `parallelTaskBaseSha`. A worker may read other tracks for interface context but may not edit them. Cross-track needs are handoff-only and include the requested path, reason, evidence, and acceptance impact. The coordinator owns assembly and any conflict resolution.

| Track | Owner / branch | Exact write path | Acceptance focus |
| --- | --- | --- | --- |
| T1 local timeout | `epoch2-web-entry` / `h2-e2-web-entry` | `apps/web/src/main.tsx` | Pass `timeoutMs: 30_000` explicitly at the local adapter seam; no global/default contract edit. |
| T2 composition red test | `epoch2-composition` / `h2-e2-composition` | `scripts/h2-sentinel/composition.test.mjs` | Add the failing-first test for the required combination and then make it green only through assembled behavior. |
| T3 curve hydration | `epoch2-analysis` / `h2-e2-analysis` | `apps/web/src/features/h2-sentinel/{model/workspace-loader.ts,test/workspace-loader.test.ts,pages/analysis/AnalysisPage.tsx,test/presentation.test.tsx}` | Select at most 32 real curve variables, preserve identity/provenance, and render without changing frozen contracts. |
| T4 validator compatibility | `epoch2-validator` / `h2-e2-validator` | `submission/h2-sentinel/scripts/validate-submission.ps1` | Replace the literal em dash with regex ASCII `\u2014` handling so Windows PowerShell 5.1 parses and validates it. |
| T5 Windows CI gate | `epoch2-ci` / `h2-e2-ci` | `.github/workflows/h2-sentinel.yml` | Add a Windows PowerShell 5.1 validator gate; keep existing Ubuntu/Windows H2 and generic gates intact. |
| T6 official runner | `epoch2-official-e2e` / `h2-e2-official-e2e` | `validation/official-csv-e2e.mjs`, `validation/official-csv-e2e.test.mjs`, `validation/README.md` | Add the same-origin official CSV runner and its dependency-free tests/documentation. |

Every branch starts at the same coordinator-observed `parallelTaskBaseSha`, never directly at `planParentSha`. Each branch has its own isolated worktree and a single owner. No worker may combine two rows of this table in one branch. The coordinator alone performs integration, final run, deployment binding, and release-manifest updates.

### Task

Each owner first writes or updates a task-local acceptance note in its handoff (without writing outside the allowlist), then implements the smallest change, and stages only exact allowlisted files. Each task produces one focused commit with an English imperative message, pushes normally, and reports the local SHA plus an independently observed remote SHA. No amend, rebase, force push, `git reset --hard`, or `git clean` is permitted.

The task order is:

1. T1 establishes the explicit 30-second local request budget.
2. T2 adds the red composition assertion against the current assembled behavior.
3. T3 adds bounded curve-variable selection and presentation hydration.
4. T4 makes the submission validator parse on Windows PowerShell 5.1.
5. T5 wires the Windows PowerShell 5.1 validator gate.
6. T6 builds the official runner against the already-frozen same-origin seams.

The coordinator must not call the final integration run until every task has a remote SHA and task-local gate result. A task that finds a contract mismatch stops and hands it off; it does not widen scope.

### Execute

T1 must make the local adapter invocation carry the literal `timeoutMs: 30_000` explicitly in `apps/web/src/main.tsx`. It must not change Fixture behavior, remote behavior, service defaults, or the frozen adapter type.

T2 must assert the assembled composition that is otherwise easy to miss: the entry, H2 route, selected analysis page, local adapter request, and report/export boundary. The test must fail against the pre-Epoch-2 assembly before its implementation is accepted, and then pass on the assembled commit. It may import existing test helpers but may not patch product code outside its path.

T3 must choose no more than 32 real curve variables from the official 69-field vocabulary, using the existing workspace-loader/model seam. It must filter unknown evidence variables, deduplicate selected fields, preserve source field identity, units, timestamps, and Fixture/Live provenance, and remain bounded for the 172,800-row input. `AnalysisPage` should expose the selected curves without inventing a health score or changing contract names. Tests cover loader selection, empty/unknown input, order stability, deduplication, and presentation output.

T4 must make the existing validator's em dash matching portable to Windows PowerShell 5.1 by using regex ASCII `\u2014` semantics. It must preserve all current claim/evidence checks and must not turn unavailable official metrics, deployment, visual evidence, eligibility, or organizer receipt into success.

T5 must run the real validator under Windows PowerShell 5.1, not PowerShell 7 as a substitute. The gate must install/use only repository-approved dependencies, fail on validator failure, and retain sanitized logs. Existing CI matrix coverage must not be removed or weakened.

T6 must implement a same-origin runner using the existing Node/`tsx`/Live adapter and server seams. It must add no dependency and must operate with a 4 GiB Node heap on a machine with at least 8 GiB RAM. The runner must:

- verify the raw and normalized file byte counts, row count, field count, and exact expected SHA-256 values before processing;
- normalize through the existing approved path, then exercise same-origin Web import, analyze, export, and the existing checker in that order;
- bind every result to the tested commit, input identity, and an attempt identifier;
- use a fixed sanitized repository-relative report path and never overwrite an earlier attempt;
- prohibit absolute paths, PIDs, ports, URLs, environment values, credentials, and raw request/response bodies in reports;
- fail closed on identity mismatch, response mismatch, timeout, checker mismatch, or a missing stage.

Series hydration is a separate measurement: run it after the import/analyze/export/checker chain, record its own bounded result and selected-variable count, and do not let series success upgrade the official E2E gate. The runner may use an operator path at execution time, but reports contain only the fixed relative report path and sanitized identity metadata.

### Verify

Verification has four layers and must remain auditable:

1. **Unit/task gates.** T1 runs the focused entry/type tests. T2 runs its red-then-green composition test. T3 runs the two loader/presentation test files and strict type checking. T4 runs the validator under Windows PowerShell 5.1 and PowerShell 7 for parity. T5 runs the workflow gate on the actual Windows runner. T6 runs its dependency-free tests with a synthetic representative input and report-sanitization assertions; it does not claim official-data success from synthetic data.
2. **Unique integration gate.** From a clean assembled worktree based on the frozen `parallelTaskBaseSha` plus exactly the six task commits, the coordinator runs the repository H2/type/build/check suites and `scripts/h2-sentinel/composition.test.mjs`. The integration result is one gate, bound to the assembled SHA. It includes no unrecorded worker changes.
3. **Final official run.** The coordinator runs the exact external raw file and records the exact normalized file identity. The expected literal SHA values and counts above must match. The run must pass `normalize -> same-origin import -> analyze -> export -> checker`; a separate series-hydration result is recorded. The final report is sanitized, repository-relative, attempt-preserving, and bound to the assembled/deployed SHA. A missing official file or missing same-origin stage is `pending`/`not-delivered`, never `passed`.
4. **Release and platform gates.** CI results, deployment SHA binding, submission validator, visual review, eligibility, and organizer acceptance are recorded independently. A successful CI run cannot imply deployment; a deployment URL cannot imply visual review; local validator success cannot imply formal submission. The team registration deadline has passed and the formal submission status is unknown, so Epoch 2 must not describe eligibility or submission as passed without direct evidence.

The final manifest retains failed attempts in chronological order. It records task dispatch, commit, test command/status, integration SHA, official-run attempt, CI run, deployment identity, and independent submission/visual/eligibility status. The final verdict is `HOLD` unless every required gate is independently evidenced; no plan, fixture, screenshot, or intermediate report can promote a gate.

## 3. Track handoff contracts

- T1 hands off the exact local call site and proof that only its explicit timeout argument changed.
- T2 hands off the red-test evidence, the expected assembled route/composition, and the command used to turn it green.
- T3 hands off the selected variable list (at most 32), source vocabulary references, bounds, and presentation screenshots or test output if available.
- T4 hands off the PowerShell 5.1 parser/validator output and confirms that unavailable claims remain unavailable.
- T5 hands off the workflow job name, runner image, shell version, and sanitized CI URL/run identity.
- T6 hands off the runner command, exact expected identities, report relative path, attempt ID, stage statuses, and the separate series-hydration result.

The coordinator rejects a handoff that contains a cross-track edit, an unbound SHA, a raw official file, a secret, an absolute path, a PID/port/URL/env value, or a claim stronger than its evidence.

## 4. Explicit non-goals and release boundaries

Epoch 2 does not change contracts, vocabulary, analytics schemas, submission columns, route envelopes, or the official metric definitions. It does not add a model, a health score, a network isolation claim, automatic control, credentials, remote hosts, or a new dependency. It does not rewrite Epoch 1 history or erase failed attempts.

Official score/metrics, deployment, screenshots, visual review, eligibility, formal submission, organizer receipt/approval, and competition acceptance remain independent gates. The registration deadline has passed; because formal submission status is unknown, no final document may state or imply that the team is eligible, submitted, approved, or accepted.

## 5. Coordinator completion checklist

- [ ] Independently observe and record `planParentSha` and the final published plan-branch `parallelTaskBaseSha`, plus the frozen contract, vocabulary, and analytics identities.
- [ ] Create six isolated worktrees and branches from the same `parallelTaskBaseSha`, with one owner per exact write path.
- [ ] Record each red/green task gate, local SHA, independently observed remote SHA, and handoff.
- [ ] Assemble only the accepted task commits and run the unique integration gate.
- [ ] Run the official file with the exact identity table and 4 GiB heap/8 GiB RAM preflight.
- [ ] Record import/analyze/export/checker and separate series-hydration results in sanitized, attempt-preserving reports.
- [ ] Run CI, bind deployment to the tested SHA, and record submission/visual/eligibility/organizer states independently.
- [ ] Run `git diff --check` and validate the release manifest; publish only with normal push and independently observed remote SHA.
