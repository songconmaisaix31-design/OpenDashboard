# Repository Cleanup Plan

- Status: executed in the isolated architecture branch
- Baseline: `origin/main@9a2268901569cd407d5a16fc8f79a936285ec185`
- Recovery tag: `competition-demo-2026-08-16@33165902fc997c6000b4e159d9e5473b4eaf7e15`

## Principle

The active branch should contain current source, current architecture, current tests, and compact recovery pointers. Completed competition coordination and generated media remain available through the verified release tag and GitHub Release. This cleanup changes the active tree only; it does not rewrite Git history or reduce the remote repository's historical object size.

## File disposition

| Path group | Action | Reason | Recovery |
|---|---|---|---|
| `apps/web/src/components/**`, `pages/**`, `styles/**`, active tests | Keep | Runnable Chinese product surface | Current branch or release tag |
| `apps/web/src/contracts/**` | Move to `packages/contracts/**` with compatibility re-export | Shared contract must not belong to UI | Release tag |
| `apps/web/src/demo/**`, `domain/**`, `fixtures/**` | Move to `plugins/fixture-demo/**` | Current deterministic provider becomes first plugin | Release tag |
| `artifacts/demo/**` | Remove from active branch | Generated video/images dominate the tree and are release evidence | Tag and GitHub Release |
| `apps/web/tests/e2e/screenshots/**` | Remove from active branch | Generated files are not read by tests; files use JPEG bytes with `.png` names | Tag |
| `docs/COMPETITION_EXECUTION_PLAN.md`, `PLAN_REVIEW.md`, `RELEASE_INTEGRATION_2026-08-16.md`, `TASKS.md`, `TIMETABLE_2026-08-16.md`, `docs/demo/**`, `docs/codegraph/README.md` | Remove after adding history ledger | Completed time-box instructions or superseded graph notes, not current architecture | Tag paths listed in history ledger |
| `planning/**`, `reports/**`, `submission/**`, `tasks/**`, root `skills/**` | Remove from active branch | T0-T4 dispatch/evidence or inert narrative descriptors | Tag |
| `.codegraph/.gitignore` | Keep | Prevents generated graph state from entering Git | Recreate if needed |
| T5-T10 and `local-console-planning` worktrees | Keep outside this cleanup | They contain unpublished unique commits | Their full commit SHAs |

## Worktree policy

No existing planning worktree is removed in this phase. Before later deletion, create durable archive refs or selectively migrate the unique documents and verify each branch has no unmerged content. The stale local root `main` is not force-updated here.

## Verification

- Confirm the release tag exists locally and remotely before deleting tracked release assets.
- Record exact deleted path groups in the commit.
- Run `git status`, `git diff --check`, and the full application checks after moves.
- Verify the current UI does not reference removed screenshots, scripts, or submission files.
