# LC5 — Plugin Metadata Compatibility

## Dispatch values

- Worktree: `<ABSOLUTE_WORKTREE_PATH>`
- Branch: `<BRANCH_NAME>`
- Gate SHA: `<40_CHARACTER_GATE_SHA>`

## Task

Validate static manifest shape, SDK version and declared capability
compatibility only. This block is optional and must not block the first local
console release.

## Permission boundary

You may modify only `apps/web/src/local-console/plugin-contract/**`,
`apps/web/tests/local-console/plugin-contract/**`, and
`reports/local-console/LC5.md`. Do not load, import, install or execute a
plugin; do not build a marketplace or registry, grant permissions, make
network calls, edit contracts/UI/root configuration, read another task branch,
merge, push, deploy, or access secrets.

## Record and result

Deliver compatible and incompatible manifest Fixtures, integrity checks,
stable errors, focused tests, limitations and commit SHA. The output is static
compatibility metadata, not an executable plugin system.
