# LC3 — API Diagnostics

## Dispatch values

- Worktree: `<ABSOLUTE_WORKTREE_PATH>`
- Branch: `<BRANCH_NAME>`
- Gate SHA: `<40_CHARACTER_GATE_SHA>`

## Task

Produce evidence-limited diagnostic results from pre-normalized and
pre-redacted API 5xx Fixtures.

## Permission boundary

You may modify only `apps/web/src/local-console/api-diagnostics/**`,
`apps/web/tests/local-console/api-diagnostics/**`, and
`reports/local-console/LC3.md`. Do not proxy, intercept, replay or send real
requests; do not accept raw headers, bodies, logs or stacks; do not claim root
cause without evidence or perform a fix. Do not edit contracts/UI, read another
task branch, merge, push, deploy, or access secrets.

## Record and result

Deliver correlated, conflicting, no-finding and error Fixtures; stable result
codes; focused tests; limitations; checks and commit SHA. Output must be one of
`finding`, `limited`, `no-finding`, or `error` as frozen by the Gate.

