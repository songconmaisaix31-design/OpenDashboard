# OpenDashboard

OpenDashboard is a runnable, deterministic competition demo for a local API
incident-response workflow. The current release target is a Simplified Chinese
website plus a 90-second local demonstration video.

The competition baseline deliberately narrows the long-term product plan to one deterministic incident-response journey. External providers such as Cordis, LocalOps, Agent Usage Manager, FastAPI Radar, Orca, and AgentTeams are represented by clearly labelled fixture data until a later integration phase proves them independently.

## Local run

```powershell
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm run dev
```

Use `npm ci --offline` only when the npm cache is already populated.

The enabled runtime is fixture-only. It does not contact live providers or
control a real process.

## Project baseline

- [Competition PRD](./PRD.md)
- [Minimal technical specification](./Tech-Spec.md)
- [Demo contract](./API_CONTRACT.md)
- [Long-term plan review](./docs/PLAN_REVIEW.md)
- [Competition execution and worktree plan](./docs/COMPETITION_EXECUTION_PLAN.md)
- [Competition task blocks](./docs/TASKS.md)
- [Competition timetable](./docs/TIMETABLE_2026-08-16.md)
- [Task prompt index](./tasks/PROMPT_INDEX.md)
- [CodeGraph integration runbook](./docs/codegraph/README.md)
- [Chinese release integration](./docs/RELEASE_INTEGRATION_2026-08-16.md)

## Current boundary

- No supplied YAML or JSON file is executable input.
- No external provider, process-control action, or network integration is enabled.
- T0-T4 implementation claims require the evidence recorded under
  `reports/tasks/`. T5-T10 remain planning-only.
- `main` is the release baseline; competition merges occur in the separate `competition-integration` worktree, and isolated task work belongs in one Orca worktree per branch.
