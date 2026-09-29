# Independent Planning Prompt Index

Status: planning only; no task is dispatched by this file

| Task | Prompt | Planned branch | Planned top-level worktree |
|---|---|---|---|
| T5 | `tasks/independent/05_OBSERVABILITY_INCIDENTS.md` | `plan-observability-incidents` | `C:\Users\DW\orca\workspaces\OpenDashboard\plan-observability-incidents` |
| T6 | `tasks/independent/06_API_DEBUG_RADAR.md` | `plan-api-debug-radar` | `C:\Users\DW\orca\workspaces\OpenDashboard\plan-api-debug-radar` |
| T7 | `tasks/independent/07_RUNTIME_HARDWARE.md` | `plan-runtime-hardware` | `C:\Users\DW\orca\workspaces\OpenDashboard\plan-runtime-hardware` |
| T8 | `tasks/independent/08_ACTION_POLICY.md` | `plan-action-policy` | `C:\Users\DW\orca\workspaces\OpenDashboard\plan-action-policy` |
| T9 | `tasks/independent/09_PLUGIN_SDK.md` | `plan-plugin-sdk` | `C:\Users\DW\orca\workspaces\OpenDashboard\plan-plugin-sdk` |
| T10 | `tasks/independent/10_FRONTEND_DESIGN_RECOVERY.md` | `plan-frontend-design-recovery` | `C:\Users\DW\orca\workspaces\OpenDashboard\plan-frontend-design-recovery` |

All tasks start from the same recorded planning commit. They have no dependency
order and must not read or modify one another's planning files or records.

Before dispatch, append an exact worktree, branch, and full base SHA to the
selected prompt. Without separate planning authorization and those values, the
prompt permits read-only inspection only.

T10 dispatch must also record one immutable visual reference package with its
exact path and SHA-256, or explicitly record `UNAVAILABLE`. Missing visual or
MCP inputs activate its mock fallback and never block another task.
