# Competition Execution and Worktree Plan

Status: planning only; product implementation has not started

## Execution shape

```text
T0 Foundation
  |-- T1 Demo Engine
  |-- T2 Web Demo
  `-- T3 Submission Package
        -> T4 Integration and QA
```

T1, T2, and T3 start from the same immutable T0 commit and run in separate
worktrees. T4 integrates them in the fixed order T1, T2, T3 and uses CodeGraph
after each merge.

## Worktrees

| Task | Branch | Worktree |
|---|---|---|
| T0 / T4 | `competition-integration` | `C:\Users\DW\orca\workspaces\OpenDashboard\competition-integration` |
| T1 | `task/demo-engine` | `C:\Users\DW\orca\workspaces\OpenDashboard\demo-engine` |
| T2 | `task/web-demo` | `C:\Users\DW\orca\workspaces\OpenDashboard\web-demo` |
| T3 | `task/submission-package` | `C:\Users\DW\orca\workspaces\OpenDashboard\submission-package` |

`main` remains unchanged until a separately authorized release step. Task
worktrees are created only after T0 records the exact base SHA. Files are moved
between tasks only through Git commits; no task edits another worktree.

## Task references

- Scope and file boundaries: `docs/TASKS.md`
- Timetable: `docs/TIMETABLE_2026-08-16.md`
- Prompts: `tasks/PROMPT_INDEX.md`
- CodeGraph protocol: `docs/codegraph/README.md`

## Integration rules

- Reject a task commit that changes files outside its assigned paths.
- Stop or reduce scope when a conflict cannot be resolved with a small,
  recorded integration fix.
- Keep all providers fixture-backed and visibly mocked.
- Record checks as passed, failed, or not run; never infer success.
- Do not push, deploy, upload, or advance `main` without separate authority.

The 22:15 Asia/Shanghai freeze is fixed. Optional polish is removed before the
fixture golden path, approval, provenance, audit, reset, evidence, or truthful
claims are reduced.
