# OpenDashboard

OpenDashboard is currently a planning-only repository for a timeboxed competition demo. It does not yet contain application source, dependencies, a package manager lockfile, or a runnable system.

The competition baseline deliberately narrows the long-term product plan to one deterministic incident-response journey. External providers such as Cordis, LocalOps, Agent Usage Manager, FastAPI Radar, Orca, and AgentTeams are represented by clearly labelled fixture data until a later integration phase proves them independently.

## Planning baseline

- [Competition PRD](./PRD.md)
- [Minimal technical specification](./Tech-Spec.md)
- [Demo contract](./API_CONTRACT.md)
- [Long-term plan review](./docs/PLAN_REVIEW.md)
- [Competition execution and worktree plan](./docs/COMPETITION_EXECUTION_PLAN.md)

## Current boundary

- No supplied YAML or JSON file is executable input.
- No external provider, process-control action, or network integration is enabled.
- No implementation claim is valid until source exists and the corresponding check has run.
- `main` is the release baseline; competition merges occur in the separate `competition-integration` worktree, and isolated task work belongs in one Orca worktree per branch.
