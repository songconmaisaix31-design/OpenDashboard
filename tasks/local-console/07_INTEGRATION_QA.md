# LC7 — CodeGraph Integration and QA

## Dispatch values

- Worktree: `<ABSOLUTE_INTEGRATION_WORKTREE_PATH>`
- Branch: `<INTEGRATION_BRANCH_NAME>`
- Gate SHA: `<40_CHARACTER_GATE_SHA>`
- Accepted commits: `<LC1_SHA> <LC2_SHA> <LC3_SHA> <LC4_SHA> <LC5_SHA_OR_SKIP> <LC6_SHA>`

## Task

Integrate accepted task commits in the listed order, add only the minimum
adapter and application-entry wiring, and verify the local-console candidate.

## Permission boundary

This prompt requires separate merge authorization. You may modify only
`apps/web/src/local-console/integration/**`, the minimum application entry and
configuration needed for composition, `docs/local-console/**`, and
`reports/local-console/LC7.md`. Do not redesign modules, add features, enable
real actions or plugin execution, resolve conflicts with broad rewrites, read
secrets, push, deploy, or advance `main`. LC1-LC6 must not import one another.

## CodeGraph and verification

After every accepted commit:

```powershell
codegraph sync .
codegraph status . --json
codegraph impact <public-symbol> --path . --depth 3 --json
git diff --name-only <GATE_SHA>...HEAD | codegraph affected --stdin --path . --depth 5 --json
```

Run every returned relevant test, then run the complete configured type, test
and build gates plus desktop/mobile visual and permission-boundary checks.

## Record and result

Record merge order, exact SHAs, CodeGraph results, checks actually run,
screenshots, remaining gaps and final candidate SHA in
`reports/local-console/LC7.md`. CodeGraph supports impact review; it does not
replace tests, build, visual QA or security review.
