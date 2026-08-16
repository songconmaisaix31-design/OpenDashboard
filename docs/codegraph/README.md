# CodeGraph Integration Runbook

Status: planning-only until application source exists

## Task graph

`planning/codegraph/integration-graph.ts` gives CodeGraph a small, non-runtime
representation of the task dependencies:

```text
foundationTask
  |-- demoEngineTask
  |-- webDemoTask
  `-- submissionPackageTask
        -> integrationAndQaTask
```

The file must never be imported, compiled, bundled, or executed by the
application. Before source exists, it proves only that the task plan is
queryable; it is not evidence of a working product.

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
`impact`, or `affected`. Record the conclusion in `reports/tasks/T4.md`.

CodeGraph does not grant permission to edit reached files and does not replace
Git diff review, build, type checking, lint, tests, or visual QA.
