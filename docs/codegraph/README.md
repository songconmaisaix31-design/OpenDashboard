# CodeGraph Integration Runbook

Status: active for the integrated T0-T4 application candidate

## Task graph

`planning/codegraph/integration-graph.ts` gives CodeGraph a small, non-runtime
representation of the task dependencies, while the application source under
`apps/web/` supplies the implementation graph used during release integration:

```text
foundationTask
  |-- demoEngineTask
  |-- webDemoTask
  `-- submissionPackageTask
        -> integrationAndQaTask
```

The planning file must never be imported, compiled, bundled, or executed by the
application. It proves only that the task plan is queryable. Runtime claims
must be supported by source-symbol inspection plus the normal release gates.

## Commands

Run in the worktree being checked:

```powershell
codegraph status . --json
codegraph init .
codegraph sync .
codegraph node integrationAndQaTask --path .
codegraph impact foundationTask --path . --depth 3 --json
```

Run `codegraph init .` only when that worktree is not initialized. Generated
CodeGraph data stays local under `.codegraph/` and must not be committed.

After each task branch is merged into `competition-integration`, run
`codegraph sync .` and inspect the changed files or symbols with `node`,
`impact`, or `affected`. Historical T4 results stay in `reports/tasks/T4.md`;
release-candidate conclusions belong in the current release report.

CodeGraph does not grant permission to edit reached files and does not replace
Git diff review, build, type checking, lint, tests, or visual QA.
