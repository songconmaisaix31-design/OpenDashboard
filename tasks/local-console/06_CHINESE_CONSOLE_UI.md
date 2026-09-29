# LC6 — Chinese Console UI

## Dispatch values

- Worktree: `<ABSOLUTE_WORKTREE_PATH>`
- Branch: `<BRANCH_NAME>`
- Gate SHA: `<40_CHARACTER_GATE_SHA>`

## Task

Build the Chinese local-console experience from the frozen Gate view-model.
Complete static visual fidelity with fixed data before connecting Fixture
state.

## Permission boundary

You may modify only `apps/web/src/local-console/ui/**`,
`apps/web/tests/local-console/ui/**`, `apps/web/public/local-console/**`,
`artifacts/design/local-console/**`, and `reports/local-console/LC6.md`. Do not
change domain state machines, access host or network APIs, modify the app entry,
add dependencies, or connect real data before screenshot QA passes. Do not
read another task branch, merge, push, deploy, or access secrets.

## Record and result

Deliver frozen assets/tokens, desktop and mobile screenshots, file hashes,
Fixture-backed interaction checks, visual findings and commit SHA. Every card
must show its own `fixture`, `local`, or `planned` provenance.
