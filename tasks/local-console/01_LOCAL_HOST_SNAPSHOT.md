# LC1 — Local Host Snapshot

## Dispatch values

- Worktree: `<ABSOLUTE_WORKTREE_PATH>`
- Branch: `<BRANCH_NAME>`
- Gate SHA: `<40_CHARACTER_GATE_SHA>`

## Task

Implement only the Gate-defined, coarse-grained, read-only local runtime and
resource snapshot with explicit `known`, `stale`, `unknown`, and `unsupported`
states.

## Permission boundary

You may modify only `apps/local-host/**` and
`reports/local-console/LC1.md`. Do not use Shell or PowerShell from product
code, enumerate full processes/windows/sessions, read environment variables or
file content, expose hostnames, IP addresses, usernames, paths or hardware IDs,
persist data, make network requests, mutate host state, edit contracts/UI/root
configuration, read another task branch, merge, push, or deploy.

## Record and result

Deliver a privacy-field matrix, deterministic Fixture, focused tests, one
public Gate-compatible output, commit SHA, and actual check results. No other
LC module may be imported.
