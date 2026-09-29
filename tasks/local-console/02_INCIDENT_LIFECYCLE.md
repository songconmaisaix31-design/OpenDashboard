# LC2 — Incident Lifecycle

## Dispatch values

- Worktree: `<ABSOLUTE_WORKTREE_PATH>`
- Branch: `<BRANCH_NAME>`
- Gate SHA: `<40_CHARACTER_GATE_SHA>`

## Task

Implement deterministic, pure incident grouping, deduplication, severity, and
recovery lifecycle behavior from Gate-normalized observations.

## Permission boundary

You may modify only `apps/web/src/local-console/incidents/**`,
`apps/web/tests/local-console/incidents/**`, and
`reports/local-console/LC2.md`. Do not add collectors, providers, networking,
UI, persistence, notification, approval, execution or contract changes. Do not
read another task branch, merge, push, deploy, or access secrets.

## Record and result

Cover reordered, duplicate and incomplete evidence with deterministic
Fixtures. Record stable outcomes, checks, changed files, limitations and commit
SHA. The module consumes only Gate types and has no direct LC1-LC6 imports.
