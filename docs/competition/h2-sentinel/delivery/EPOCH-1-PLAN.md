# H2 Sentinel Epoch 1 Delivery Plan

## 1. Frozen inputs and scope

This plan is an Epoch 1 delivery freeze. It starts from `f5646486f3912d1f97052bc9ee08f9c48053346e` (`h2(coord): point local golden smoke at the 69-field fixture`) and must not silently rebase. The contract gate is immutable for this epoch:

| Gate | Frozen identity |
| --- | --- |
| Base SHA | `f5646486f3912d1f97052bc9ee08f9c48053346e` |
| `packages/h2-contracts` tree | `11608e5ff5c0e69c3dd4a18588e5a13027151e82` |
| `packages/h2-vocabulary` tree | `84d3d39a864e25e69e607a0314f3b27aa10c0fe8` |
| `services/h2-analytics/src/h2_analytics/contracts.py` blob | `3d33f410379339f417f4bc7451483e484124acc6` |

No Epoch 1 task may change a contract, vocabulary, or the frozen analytics contract blob. A contract defect is a change request for a later contract gate, not an in-track patch.

## 2. Audited blockers

The following are recorded facts, not completion claims:

1. The Web import guard is **5 MiB**, while the official test CSV is **77,865,257 bytes** (172,800 rows and 69 columns). The official full-dataset path is therefore not accepted by the current Web path; a later implementation must address size and memory behavior before claiming official import.
2. The current deployed artifact/path evidence has drift: the committed smoke report records an artifact path under a different checkout (`H2_Sentinel`) and an ignored generated artifact, so it is not release-location proof. Deployment remains unverified until a fresh run records the actual release artifact and URL from the final commit.
3. Ubuntu smoke is not complete: the recorded smoke attempt timed out. A Windows-local pass cannot substitute for an Ubuntu result; the Ubuntu gate remains pending until it completes within the declared timeout and records sanitized evidence.
4. Existing evidence is stale or conflicting across snapshots (including prior PASS/SKIP rows and superseded artifact paths). Evidence must be bound to the exact run, task, dispatch, commit, and test result in the final manifest; a planning document or historical report cannot upgrade a stale result.

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
- The Web path does not claim acceptance of the 77,865,257-byte official CSV while the 5 MiB guard remains in force.
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

## 6. Handoff, commits, and remote completion

Cross-track work is handoff-only. A worker that discovers a required edit outside its allowlist stops, records the requested path, reason, evidence, and acceptance impact in its handoff, and leaves the other path untouched. The coordinator assigns the owner or schedules unique integration; workers must not solve cross-track needs by convenience edits.

Each task produces one small focused commit after its local gate. Stage explicit allowlisted paths only, use an English imperative commit message, and push the branch normally with no amend, rebase, force push, or history rewrite. A task is not complete at a local SHA: the remote branch must contain that SHA, and the coordinator must verify the live remote SHA (not a cached value) before accepting it.

Epoch 1 does not change contracts. Any request touching the frozen gate is blocked and escalated as a contract change for a new epoch.

## 7. Required evidence chain and final manifest

The release record must preserve this chain for every task and gate:

`Plan → Run → Task → Dispatch → Commit → Test → Release Manifest`

The final manifest must identify the frozen base and contract gate, each task owner and write path, dispatch identity, local and remote commit SHAs, exact test commands and statuses, deployment identity and URL (or an explicit unavailable status), submission status, and the final verdict. Manifest entries must reference existing local evidence only; a future placeholder must use a non-success status and a reason. The closed schema is `RELEASE-MANIFEST.schema.json` in this directory.

The final verdict is `PASS` only if all required release gates are green and no audited blocker remains unresolved. Otherwise it is `HOLD` (or `FAIL` for a reproducible regression), with the blocking evidence named. Historical evidence may explain context but cannot satisfy a current gate.
