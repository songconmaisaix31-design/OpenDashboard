# CodeGraph Integration Checks

CodeGraph is used to inspect source relationships and composition impact after each accepted architecture commit. It is not proof that runtime behavior works.

```bash
codegraph init .
codegraph sync .
codegraph status . --json
codegraph query createPluginRuntime --path . --json
codegraph impact createPluginRuntime --path . --depth 3 --json
git diff --name-only --diff-filter=ACMR | codegraph affected --path . --stdin --json
```

The final status must show no pending files. A symbol query or affected-test result may provide evidence even when the current impact traversal returns no cross-file edge; record that limitation instead of overstating the graph. Every claimed integration also requires TypeScript checks, tests, a production build, and browser verification when UI composition changes. Generated database, WAL, log, and PID files under `.codegraph/` remain ignored.
