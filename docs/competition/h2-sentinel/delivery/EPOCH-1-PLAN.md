# H2 Sentinel Epoch 1 Delivery Plan

## 1. Frozen inputs and scope

This plan is an Epoch 1 delivery freeze. `planParentSha` is `f5646486f3912d1f97052bc9ee08f9c48053346e` (the planning parent), while `parallelTaskBaseSha` and the frozen `planSha` are `2e809854422230f5afaca4776d6ec56e5c8507be` (`docs(h2): freeze delivery epoch 1 plan`). Integration must not silently rebase. The final `testedCodeSha` is the later coordinator-doc commit that follows the accepted track commits; it is not either frozen planning SHA. The contract gate is immutable for this epoch:

| Gate | Frozen identity |
| --- | --- |
| Plan parent SHA | `f5646486f3912d1f97052bc9ee08f9c48053346e` |
| Parallel task base / plan SHA | `2e809854422230f5afaca4776d6ec56e5c8507be` |
| `packages/h2-contracts` tree | `11608e5ff5c0e69c3dd4a18588e5a13027151e82` |
| `packages/h2-vocabulary` tree | `84d3d39a864e25e69e607a0314f3b27aa10c0fe8` |
| `services/h2-analytics/src/h2_analytics/contracts.py` blob | `3d33f410379339f417f4bc7451483e484124acc6` |

No Epoch 1 task may change a contract, vocabulary, or the frozen analytics contract blob. A contract defect is a change request for a later contract gate, not an in-track patch.

## 2. Audited blockers

The following are recorded facts, not completion claims:

1. At freeze time, the Web import guard was **5 MiB**, while the official test CSV is **77,865,257 bytes** (172,800 rows and 69 fields). The accepted Web change raises the metadata/pre-read ceiling to **300 MiB** and avoids reading file contents before metadata checks. That change is necessary, not sufficient. The official gate passes only when that exact authorized file completes `normalize -> same-origin Web import -> analyze -> export -> checker` on `testedCodeSha`. The current product Live request timeout still defaults to **5,000 ms**; an older unbound full-file import/analyze observation exceeded six seconds, and the older smoke import/analyze path bypassed the Web same-origin proxy. Those observations remain unresolved and cannot establish official-file E2E success.
2. The current deployed artifact/path evidence has drift: the committed smoke report records an artifact path under a different checkout (`H2_Sentinel`) and an ignored generated artifact, so it is not release-location proof. Deployment remains unverified until a fresh run records the actual release artifact and URL from the final commit.
3. Ubuntu smoke is not complete. Both recorded GitHub Actions attempts failed on the frozen plan commit: [run 32581403575 / job 97051221180](https://github.com/songconmaisaix31-design/OpenDashboard/actions/runs/32581403575/job/97051221180) and [run 32581406281 / job 97051227728](https://github.com/songconmaisaix31-design/OpenDashboard/actions/runs/32581406281/job/97051227728), each against `2e809854422230f5afaca4776d6ec56e5c8507be`. A Windows-local pass cannot substitute for an Ubuntu result; the Ubuntu gate remains pending until a fresh Ubuntu attempt against `testedCodeSha` passes and records sanitized evidence.
4. Existing evidence is stale or conflicting across snapshots (including prior PASS/SKIP rows and superseded artifact paths). Evidence must be bound to the exact run, task, dispatch, commit, and test result in the final manifest; a planning document or historical report cannot upgrade a stale result.
5. Submission validation is environment-sensitive. The historical wrong script path failed, Windows PowerShell 5.1 reaches the real script but fails to parse it, and PowerShell 7.6.5 can pass the repository validator. The passing PowerShell 7 result does not prove organizer form receipt, approval, deployment, visual review, or official-data acceptance, so the submission gate remains pending.

Relevant current evidence includes `docs/plans/2026-08-21-h2-solo-execution-brief.md`, `tests/h2-sentinel/DEFECT_LOG.md`, `validation/reports/offline-deploy-smoke.json`, and `submission/h2-sentinel/RUNTIME_EVIDENCE_CHECKLIST.md`. These references are audit inputs only; they do not establish official score, deployment, Ubuntu success, or release approval.

## 3. Exact tracks and write paths

Each path has one owner. Reading another track is allowed; editing another track is not. The allowlist is exact and recursive.

| Track | Purpose | `write_paths` |
| --- | --- | --- |
| Web | H2 presentation, Fixture/Live composition, responsive UI | `apps/web/src/features/h2-sentinel/**` |
| Scripts | H2 launcher, smoke, e2e, and script-local tests | `scripts/h2-sentinel/**` |
| Deployment config | Vercel deployment configuration only | `vercel.json` |
| Later validation | Official-data validation, submission checks, reports | `validation/**` |
| Later submission | Candidate-specific claims, runtime checklist, release narrative | `submission/h2-sentinel/**` |
| Unique integration | Root composition and CI wiring that cannot safely be parallelized | `apps/web/src/main.tsx`, `apps/web/index.html`, `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.*`, `.github/workflows/*h2*`, `start-h2-sentinel.sh`, `start-h2-sentinel.bat`, `.gitignore`, `NOTICE`, `THIRD_PARTY_NOTICES.md` |

The delivery plan and manifest schema are owned by the coordinator under `docs/competition/h2-sentinel/delivery/**`; no other track may edit them. `vercel.json` is intentionally a separate single-file gate because a deployment rewrite can change the public artifact without changing application source. No track may write official datasets, credentials, generated model files, ignored run artifacts, or files outside its allowlist.

## 4. Functional acceptance

Epoch 1 is complete only when all of the following are proven against the final assembled commit:

- The Fixture golden path runs offline, identifies its provenance as Fixture/synthetic, exposes the six H2 views, and does not require analytics or an API key.
- The Live path is explicitly opt-in and loopback-only; it does not imply official-data success until the later validation gate passes.
- Reports and submission exports preserve the frozen contract, provenance, safety disclaimer, content identity, and human-confirmation boundary. No export may claim an organizer score.
- The 300 MiB metadata/pre-read change is not official-data proof. The Web official CSV gate remains pending until the exact 77,865,257-byte, 172,800-row, 69-field authorized file completes `normalize -> same-origin Web import -> analyze -> export -> checker` on `testedCodeSha`. The 5,000 ms Live timeout and the older proxy-bypassing/unbound observations must be resolved or replaced by this bound run.
- Deployment, Ubuntu smoke, official-data validation, and submission evidence are each independently labelled `passed`, `failed`, `pending`, or `not-delivered`; an unavailable artifact is never represented as PASS.
- Every acceptance result is reproducible from a run ID and points to sanitized evidence, with no secrets, absolute private paths, PIDs, or raw credentials.

## 5. Machine gates by track

Track gates are run in the owning worktree and recorded against the commit under test. A command that was not run in the current worktree is not a pass.

| Track | Required gate | Minimum assertions |
| --- | --- | --- |
| Web | `npm run typecheck`; `npm run h2:test`; `npm run build` | strict types, focused H2 tests, production build; desktop and 390x844 visual checks are separately recorded, never inferred from build success |
| Scripts | `npm run h2:launcher:test`; `npm run h2:smoke` | launcher failure/cleanup behavior, Fixture and Local smoke; report exit status and sanitized output |
| Deployment config | `git diff --check`; deployment preview/health command declared by the release environment | `vercel.json` parses, routes only intended paths, and the deployed URL/artifact is bound to the tested commit |
| Later validation | `node validation/check-submission.mjs <file>` and the declared official-data evaluation command | exact 16-column format, official field vocabulary, no fabricated metrics; full-data success requires the authorized official pack and a fresh report |
| Later submission | `submission/h2-sentinel/scripts/validate-submission.ps1` | local links resolve, claims match evidence, and unavailable deployment/score/screenshots/official metrics remain explicitly unavailable |
| Unique integration | `npm run check`; `npm test`; `npm run build`; `git diff --check` | root composition works from the assembled commit, no forbidden path drift, and all dependent track gates are represented in the manifest |

Visual review is a manual gate unless a committed automated visual artifact exists. It must name viewport, URL, commit, and observed result.

## 6. Closed release gates

The release manifest contains exactly six current gates. Task completion and historical attempts never silently upgrade a gate:

1. `webOfficialCsvE2E`
2. `ubuntuSmoke`
3. `officialDataValidation`
4. `deployment`
5. `submission`
6. `integration`

A failed attempt remains in chronological order after a retry. In particular, the historical cold smoke failure precedes service-directory `uv sync`, and the later warm smoke pass does not erase that failure. Root-level `uv` failure is separate from the passing service-directory lock, sync, and 47-test records. A blocker must reference a non-passed gate. `PASS` requires all six gates to be `passed` and no blockers; otherwise the verdict is `HOLD`, or `FAIL` for a reproducible regression.

## 7. Handoff, commits, and remote completion

Cross-track work is handoff-only. A worker that discovers a required edit outside its allowlist stops, records the requested path, reason, evidence, and acceptance impact in its handoff, and leaves the other path untouched. The coordinator assigns the owner or schedules unique integration; workers must not solve cross-track needs by convenience edits.

Each task produces one small focused commit after its local gate. Stage explicit allowlisted paths only, use an English imperative commit message, and push the branch normally with no amend, rebase, force push, or history rewrite. A task is not complete at a local SHA: the remote branch must contain that SHA, and the coordinator must verify the live remote SHA (not a cached value) before accepting it.

Epoch 1 does not change contracts. Any request touching the frozen gate is blocked and escalated as a contract change for a new epoch.

## 8. Orchestration identity ledger

The following identities are the actual Epoch 1 orchestration records. A missing dispatch is left absent rather than invented:

| Task | Dispatch | Purpose | Recorded outcome |
| --- | --- | --- | --- |
| `task_dab68d3285f0` | `ctx_5ba11eeea8a6` | Web metadata/pre-read implementation | passed task; not official-file E2E proof |
| `task_6e6cc9448893` | `ctx_9dd1d5e68d8a` | Web evidence handoff refresh | passed |
| `task_9036d70dac77` | `ctx_fc32646f5c0a` | Web composition evidence correction | passed |
| `task_655e51c62e42` | `ctx_0f820c611d98` | Cross-platform smoke stabilization | passed |
| `task_e9362a97d703` | `ctx_0371109f5120` | Smoke process ownership | passed |
| `task_100bb1a1be7a` | `ctx_3afaf16bcc10` | Vercel route configuration | passed config task; not deployment proof |
| `task_80c5a51b18c3` | `ctx_7a5d29219bc7` | Earlier integration attempt | failed; retain its cold-smoke, root-uv, and remote-verification failures |
| `task_985faa3dfa4a` | none | Coordinator evidence-gate reconciliation (`collaboration:/root/rules_audit`) | current task; no dispatch is fabricated |

## 9. Required evidence chain and final manifest

The release record must preserve this chain for every task and gate:

`Plan → Run → Task → Dispatch → Commit → Test → Release Manifest`

The final manifest must identify the frozen base and contract gate, each task owner and write path, real dispatch identity when one exists, local and independently observed remote commit SHAs, exact test commands and statuses, the integration-branch and canonical publication states, deployment identity and URL (or an explicit unavailable status), submission status, and the final verdict. Manifest entries may reference normalized repository-relative evidence paths or complete HTTPS evidence URLs. Absolute paths, any `..` traversal, credentials, private paths, PIDs, and runtime ports are forbidden. A future placeholder must use a non-success status and a reason. The closed schema is `RELEASE-MANIFEST.schema.json` in this directory.

The final verdict is `PASS` only if all required release gates are green and no audited blocker remains unresolved. Otherwise it is `HOLD` (or `FAIL` for a reproducible regression), with the blocking evidence named. Historical evidence may explain context but cannot satisfy a current gate.
