# LC4 — Action Decision

## Dispatch values

- Worktree: `<ABSOLUTE_WORKTREE_PATH>`
- Branch: `<BRANCH_NAME>`
- Gate SHA: `<40_CHARACTER_GATE_SHA>`

## Task

Implement deny-by-default action decisions, approval binding, expiry,
idempotency and ordered audit output. The result states whether an action is
authorized; it never states that an action ran or succeeded.

## Permission boundary

You may modify only `apps/web/src/local-console/action-policy/**`,
`apps/web/tests/local-console/action-policy/**`, and
`reports/local-console/LC4.md`. Do not create an executor, mutate processes or
files, use Shell, make network calls, read credentials, use real authorization
tokens or automatically retry. Do not edit contracts/UI, read another task
branch, merge, push, or deploy.

## Record and result

Cover allow, deny, expiry, replay and race Fixtures. Record decisions, checks,
changed files, limitations and commit SHA. Execution remains simulated and
outside this task.

