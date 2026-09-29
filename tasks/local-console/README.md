# Local Console Task Prompt Index

Status: planning only; these prompts do not authorize implementation

| Block | Prompt | Planned worktree |
|---|---|---|
| LC0 Contract and Safety Gate | `00_CONTRACT_SAFETY_GATE.md` | `lc0-contract-gate` |
| LC1 Local Host Snapshot | `01_LOCAL_HOST_SNAPSHOT.md` | `lc1-local-host-snapshot` |
| LC2 Incident Lifecycle | `02_INCIDENT_LIFECYCLE.md` | `lc2-incident-lifecycle` |
| LC3 API Diagnostics | `03_API_DIAGNOSTICS.md` | `lc3-api-diagnostics` |
| LC4 Action Decision | `04_ACTION_DECISION.md` | `lc4-action-decision` |
| LC5 Plugin Metadata | `05_PLUGIN_METADATA.md` | `lc5-plugin-metadata` |
| LC6 Chinese Console UI | `06_CHINESE_CONSOLE_UI.md` | `lc6-chinese-console-ui` |
| LC7 Integration and QA | `07_INTEGRATION_QA.md` | `local-console-integration` |

LC0 runs first and records one immutable 40-character Gate SHA. LC1-LC6 start
from that exact SHA in separate Orca worktrees. They may read the Gate contract
but must not read or merge one another's branches. LC7 is the only block that
may integrate accepted commits, and it requires separate implementation and
merge authorization.

Before dispatch, replace every placeholder for worktree, branch, Gate SHA, and
accepted commit. Without those exact values, a prompt permits read-only
planning inspection only.

