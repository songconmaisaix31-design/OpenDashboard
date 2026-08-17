# Plugin Baseline Integration Verification

- Date: 2026-08-17
- Worktree: `plugin-first-architecture`
- Base: `origin/main@9a2268901569cd407d5a16fc8f79a936285ec185`
- PF0 Gate: `39051b6`

## Implemented stage boundaries

- PF1: shared Demo/plugin contracts under `packages/contracts`, plus the static Tier 0/1 runtime under `packages/plugin-runtime`.
- PF2: the existing Fixture data source, transitions, golden data, and focused tests under `plugins/fixture-demo`, without behavior changes.
- PF7: compatibility re-exports, production-entry composition, root test/typecheck scope, and final verification evidence.

No network listener, request, process launch, filesystem mutation, persistence, dynamic import, or real host action was added.

## Automated checks

```text
npm ci --offline                         PASS
npm run typecheck                       PASS
npm run test                            PASS (32/32)
npm run build                           PASS
npm run check                           PASS
git diff --check                        PASS
```

`npm audit --json` reports one low-severity advisory in `tsx`'s nested `esbuild`; it is a development/test dependency and is not the Vite dev-server binary. No moderate, high, or critical finding was reported. A focused `tsx` upgrade was evaluated but not retained because a clean Windows platform-package install did not complete reliably during registry timeouts.

## CodeGraph

```text
files: 40
nodes: 327
edges: 1143
pending: 0
worktree mismatch: none
```

`query createPluginRuntime` found the definition plus import nodes in `apps/web/src/main.tsx`, `packages/plugin-runtime/test/runtime.test.ts`, and `plugins/fixture-demo/test/plugin.test.ts`. `affected` returned the contract example, Fixture data-source, and Fixture plugin tests. The current symbol-level `impact` command returned only the definition node, so it is not used as integration proof.

## Browser verification

The real Vite production entry completed the Fixture flow in Chrome:

1. Run read-only triage.
2. Request simulated restart.
3. Approve simulated restart.
4. Verify recovery.
5. Open the redacted evidence report.

At desktop and 375x812 viewports, the final page showed healthy/recovered state, the redacted report, unverified claims, and five audit events. Mobile `scrollWidth` did not exceed the viewport. No application-origin console error was observed; two errors came from an installed Chrome extension and referenced only its `chrome-extension://` source.
