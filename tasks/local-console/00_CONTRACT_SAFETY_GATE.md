# LC0 — Contract and Safety Gate

## Dispatch values

- Worktree: `<ABSOLUTE_WORKTREE_PATH>`
- Branch: `<BRANCH_NAME>`
- Base SHA: `<40_CHARACTER_BASE_SHA>`

## Task

Freeze the smallest local-console PRD, technical boundary, API contract,
provenance model, view-model, and module interfaces. Record one immutable Gate
SHA for LC1-LC6.

## Permission boundary

You may modify only:

- `docs/local-console/**`
- `apps/web/src/contracts/local-console/**`
- `reports/local-console/LC0.md`

Do not implement host access or product features, add dependencies, change the
existing Fixture contract, read secrets, access host state, create other
worktrees, merge, push, deploy, or modify external state.

## Record and result

Record changed files, decisions, risks, checks actually run, the final commit,
and the 40-character Gate SHA in `reports/local-console/LC0.md`. The result is a
type-checkable contract and safety Gate, not a runnable local console.

