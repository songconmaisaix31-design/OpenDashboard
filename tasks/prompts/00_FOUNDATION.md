# Task Prompt — T0 Foundation

Create only the minimal shared base required by T1, T2, and T3.

Read `AGENTS.md`, `PRD.md`, `Tech-Spec.md`, `API_CONTRACT.md`,
`docs/TASKS.md`, and `docs/TIMETABLE_2026-08-16.md` first.

Work only in the assigned `competition-integration` worktree and branch. You
may change the root package manifest, lockfile, required build configuration,
`apps/web/src/contracts/**`, minimal application entry files, and
`reports/tasks/T0.md`.

Do not implement product features, add optional infrastructure, enable live
providers, read secrets, contact external services, push, deploy, upload, or
change `main`. Use the smallest dependency set that supports the frozen PRD and
contract.

Finish with a buildable skeleton, exact configured check commands, one base
commit SHA for all parallel tasks, and a short record in `reports/tasks/T0.md`.
Stop if implementation authorization, the exact worktree, branch, or base
cannot be verified.
