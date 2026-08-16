# Task Prompt — T4 Integration and QA

Integrate and verify the completed task commits without adding capability.

Work only in the assigned `competition-integration` worktree and branch. Merge
T1, then T2, then T3 only when each commit is based on the recorded T0 SHA and
changes only its assigned paths.

After each merge, run `codegraph sync .` and inspect affected files or symbols
with CodeGraph. Use `docs/codegraph/README.md` as the command guide. You may
change `planning/codegraph/**`, `.codegraph/.gitignore`,
`reports/tasks/T4.md`, and only the smallest recorded conflict or P0 fix in
already merged files.

Do not add features, dependencies, live providers, network access, process
control, secret access, or unrelated refactoring. Do not push, deploy, upload,
or advance `main`. CodeGraph does not grant write access and does not replace
the configured build, type, lint, test, claim, and visual checks.

Deliver one local candidate SHA plus the CodeGraph impact summary, exact check
outcomes, remaining blockers, and evidence locations in `reports/tasks/T4.md`.
Stop integration when a commit crosses its task boundary or cannot be resolved
with a minimal, documented fix.
