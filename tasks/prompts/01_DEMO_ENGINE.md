# Task Prompt — T1 Demo Engine

Implement only the deterministic fixture-backed demo engine defined by
`API_CONTRACT.md`.

Work only in the assigned worktree and branch created from the frozen T0 SHA.
You may change:

- `apps/web/src/domain/**`
- `apps/web/src/fixtures/**`
- `apps/web/src/demo/**`
- `apps/web/tests/domain/**`
- `reports/tasks/T1.md`

Do not change UI, shared contracts, root configuration, dependencies,
submission files, or another task's files. Do not add live providers, network
requests, real process control, secret access, or external side effects. Do not
delegate, merge, push, deploy, or upload.

Deliver deterministic transitions, idempotency, approval, reset, audit, and
evidence export with focused checks. Record changed files, checks, results, and
gaps in `reports/tasks/T1.md`. If a required change is outside the allowed
paths, record the blocker and stop that part of the task.
