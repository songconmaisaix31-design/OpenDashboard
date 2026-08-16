# Task Prompt Index

Status: planning only; the prompts do not start implementation by themselves

| Task | Prompt | Planned worktree |
|---|---|---|
| T0 Foundation | `tasks/prompts/00_FOUNDATION.md` | `C:\Users\DW\orca\workspaces\OpenDashboard\competition-integration` |
| T1 Demo Engine | `tasks/prompts/01_DEMO_ENGINE.md` | `C:\Users\DW\orca\workspaces\OpenDashboard\demo-engine` |
| T2 Web Demo | `tasks/prompts/02_WEB_DEMO.md` | `C:\Users\DW\orca\workspaces\OpenDashboard\web-demo` |
| T3 Submission Package | `tasks/prompts/03_SUBMISSION_PACKAGE.md` | `C:\Users\DW\orca\workspaces\OpenDashboard\submission-package` |
| T4 Integration and QA | `tasks/prompts/04_INTEGRATION_QA.md` | `C:\Users\DW\orca\workspaces\OpenDashboard\competition-integration` |

T0 runs first. T1, T2, and T3 start from the same frozen T0 commit and run in
separate worktrees. T4 merges and verifies them in that order.

Before dispatch, append the exact worktree, branch, and 40-character base SHA
to the selected prompt. Without explicit implementation authorization and
those values, the prompt permits planning inspection only.

## Local computer console phase

The next product phase is planned separately under
`tasks/local-console/README.md`. LC0 freezes a new contract and safety Gate;
LC1-LC6 then run from the same immutable SHA in disjoint worktrees. LC7 is the
only block allowed to integrate accepted commits after separate authorization.

These prompts do not redefine T0-T10 as implemented local-console modules and
do not authorize host access, real actions, plugin execution, merge, push or
deployment.
