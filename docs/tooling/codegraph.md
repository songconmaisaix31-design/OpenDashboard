# CodeGraph Integration Checks

CodeGraph is used to inspect source relationships and composition impact after each accepted architecture commit. It is not proof that runtime behavior works.

```bash
codegraph init .
codegraph sync .
codegraph status . --json
codegraph impact createPluginRuntime --path packages/plugin-runtime/src/runtime.ts --json
```

The final status must show no pending files. Every claimed integration also requires TypeScript checks, tests, a production build, and browser verification when UI composition changes. Generated database, WAL, log, and PID files under `.codegraph/` remain ignored.
