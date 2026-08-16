# Competition Task Blocks

Status: planning only; implementation requires separate authorization

## Shared constraints

- Each task works only in its assigned branch, isolated worktree, and listed
  file paths.
- A task must not edit another task's files, broaden its scope, delegate work,
  or merge another branch.
- Do not read secrets or `.env` files, enable live providers, control real
  processes, execute supplied YAML/JSON, or make external requests.
- Do not add dependencies or change root configuration outside T0.
- Do not push, deploy, upload, or change `main`. T4 is the only task that may
  merge local task commits into `competition-integration`.
- CodeGraph shows dependency impact but never expands file-write permission.
- Each task writes one short record under its assigned `reports/tasks/` file:
  changed files, checks actually run, result, and remaining gaps.

## T0 — Foundation

Goal: create the smallest buildable application skeleton and freeze the shared
demo contract before parallel work starts.

Files:

- Root package manifest, lockfile, and required build configuration
- `apps/web/src/contracts/**`
- Minimal application entry files
- `reports/tasks/T0.md`

Constraints: no product features, live integration, optional infrastructure,
or speculative dependencies. Record one immutable base SHA for T1, T2, and T3.

Result: a shared base that can build and that exposes the normalized fixture
contract required by the other tasks.

## T1 — Demo Engine

Goal: implement the deterministic fixture flow, state transitions, approval,
reset, audit, and evidence export.

Files:

- `apps/web/src/domain/**`
- `apps/web/src/fixtures/**`
- `apps/web/src/demo/**`
- `apps/web/tests/domain/**`
- `reports/tasks/T1.md`

Constraints: fixture-only; no UI, provider adapters, network requests, real
process control, root configuration, or contract changes.

Result: a deterministic engine that follows `API_CONTRACT.md` and can be
verified independently.

## T2 — Web Demo

Goal: present the 90-second guided journey using the frozen contract.

Files:

- `apps/web/src/components/**`
- `apps/web/src/pages/**`
- `apps/web/src/styles/**`
- `apps/web/src/assets/**`
- `apps/web/public/**`
- `apps/web/tests/presentation/**`
- `apps/web/tests/e2e/**`
- `reports/tasks/T2.md`

Constraints: do not redefine domain behavior or edit fixture/state-machine
files. Fixture and mocked provenance, approval status, and audit state must stay
visible. No live data or external assets are required.

Result: a clear guided interface with representative desktop visual evidence.

## T3 — Submission Package

Goal: prepare the competition narrative, Skill descriptors, demo script, and
claim list.

Files:

- `skills/**`
- `submission/**`
- `docs/demo/**`
- `reports/tasks/T3.md`

Constraints: documentation and descriptors only; no executable plugins,
application code, deployment, upload, or unsupported live-integration claims.
Every capability must be labelled implemented, mocked, designed, or deferred.

Result: locally reviewable submission materials aligned with the actual demo.

## T4 — Integration and QA

Goal: merge T1, T2, and T3 into `competition-integration`, use CodeGraph to
inspect impact, and verify the final local candidate.

Files:

- `planning/codegraph/**`
- `.codegraph/.gitignore`
- `reports/tasks/T4.md`
- Minimal conflict or P0 fixes in already merged task files, with each fix
  recorded in `reports/tasks/T4.md`

Constraints: integrate only commits based on the T0 SHA and only files inside
the originating task's paths. Do not add features, push, deploy, upload, or
advance `main`. CodeGraph results do not replace build, type, lint, test, claim,
or visual checks.

Result: one local candidate SHA, CodeGraph impact record, exact check outcomes,
known blockers, and a frozen local evidence package.
