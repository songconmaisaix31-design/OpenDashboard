# H2 Sentinel Web Handoff

## Epoch 1 CSV boundary update

This update is the current evidence for the Web CSV boundary task. It is
bound to the following identities and exact scope:

- Branch: `songconmaisaix31-design/h2-e1-web-csv`
- Execution base: `2e809854422230f5afaca4776d6ec56e5c8507be`
- Implementation commit: `64a5b2d3f5da40e2be48e542e44edebef92cb1cd`
- Remote branch match: `origin/songconmaisaix31-design/h2-e1-web-csv` matched
  `64a5b2d3f5da40e2be48e542e44edebef92cb1cd` before this documentation repair.
- Exact allowed scope: `apps/web/src/features/h2-sentinel/HANDOFF.md` only.
- Frozen contract gate: contracts `11608e5ff5c0e69c3dd4a18588e5a13027151e82`,
  vocabulary `84d3d39a864e25e69e607a0314f3b27aa10c0fe8`, and analytics
  contract blob `3d33f410379339f417f4bc7451483e484124acc6`.

The Web local analytics pre-read boundary is **300 MiB** (`314,572,800`
bytes). The accepted official metadata size is **77,865,257 bytes**. Current
feature tests cover the exact limit and the `+1` rejection, and verify that an
invalid or oversized file fails closed before content is read or the injected
data source is called. Metadata acceptance is not a full 77.9 MB browser or
analytics end-to-end proof: official-data validation and visual QA remain
pending.

Current gates, all independently rerun in this worktree, are:

- `npm run typecheck` — passed.
- Feature tests — passed: 24 tests, 0 failures.
- `npm run h2:test` — passed: 74 tests, 0 failures.
- `npm run test` — passed: 106 tests, 0 failures.
- `npm run build` — passed as worker-reported evidence from the implementation
  gate; it was not independently rerun in this documentation-only repair.

## Historical/archive evidence

The following identity and counts belong to the archived h2-web Wave 1
snapshot and are not current-worker or current-head assertions:

- Archived branch: `songconmaisaix31-design/h2-web`
- Archived worktree: `C:\Users\DW\orca\workspaces\OpenDashboard\h2-web`
- Archived Wave 1 base SHA: `f9dd7df83a81da57fdaa2b03cd67470c8c7a22c4`
- Archived implementation head: `ed306f98b287adc094271083668f9722f511f31d`
- Archived focused evidence: 7 tests; archived repository evidence: 53 tests.
- Archived contract correction design input: `4f2a8a3156a96a7670f4ee9830ff1c560faf1c94`

## Pushed archive commits

| SHA | Purpose | Checks |
|---|---|---|
| `37b366207a7c4c00b174a326e2c6b403ad7f8391` | Six-page injected feature, state boundaries, ECharts wrapper, and Live empty import | typecheck, focused tests, root tests, root build |
| `9fc98b3426e98f0f335b8ad08d465951f90b0d05` | Deterministic Fixture preview and feature-local regression coverage | 7 focused tests, 53 root tests |
| `ed306f98b287adc094271083668f9722f511f31d` | Accessible question semantics, truthful non-golden charts, and Live provenance test | typecheck, 7 focused tests |

The handoff documentation commit SHA is reported separately because a commit
cannot contain its own final object ID without rewriting history.

## Delivered behavior

- Six responsive Chinese views: overview, events, diagnosis, analysis,
  assistant, and reports.
- Injected `H2SentinelDataSource`; no direct API request or provider import.
- Direct C03/C04 navigation with corrected owned preview expectation
  `29.333333333333332 kWh` for C04.
- Visible Fixture/Live provenance, claim kinds, units, safety state, human
  confirmation, and limitations.
- Feature-local tree-shaken ECharts 6 lifecycle wrapper with synchronized
  tooltips, constraint series, event band, zoom, and reduced-motion handling.
- Loading, empty, error, degraded series, missing event, missing validation
  labels, and unknown-safety states.
- Clean Live Analysis empty-state CSV import path with `.csv` and the 300 MiB
  local analytics pre-read bound, followed by injected import, analysis, event, and series
  hydration.
- Deterministic Fixture preview and feature-local regression tests.

## Public interfaces consumed

- `packages/h2-contracts/src/index.ts`, especially
  `H2SentinelDataSource` and canonical dataset/event/report types.
- React 19 and the already-gated `echarts@6.1.0` root dependency.

## Public interfaces produced

- `H2SentinelApp` and `H2SentinelAppProps` from `index.ts`.
- `H2SentinelView` for deterministic presentation tests.
- Hash-route helpers for six directly accessible views.

## Integration changes required outside this track

H6 must statically register the accepted H2 EMS plugin, resolve its
`H2SentinelDataSource`, and render:

```tsx
<H2SentinelApp dataSource={dataSource} />
```

No root, `main.tsx`, plugin, contract, CI, launcher, or lockfile change is part
of this worker branch.

## Archived Wave 1 verification evidence

The following checks are retained only as historical/archive evidence for the
snapshot identified above; use the Epoch 1 CSV boundary update for current
worker evidence.

- `npm ci` — passed from the frozen lockfile; 31 packages installed. The first
  sandboxed attempt could not access the npm cache/network, then the approved
  retry completed without manifest or lockfile edits.
- `node --import tsx --test
  "apps/web/src/features/h2-sentinel/test/*.test.ts*"` — archived result: 7 tests, 0
  failures. Coverage includes all six views, loading/empty/error/unknown safety,
  corrected C04 impact, hash routing, immutable filtering, 300 MiB/type bounds,
  and clean `LIVE_ANALYSIS` empty → import → ready hydration.
- `npm run typecheck` — passed with strict TypeScript.
- `npm run test` — archived result: 53 tests, 0 failures across the repository.
- `npm run build` — archived result: 51 modules. This
  does not prove H2 runtime composition because `main.tsx` is H6-owned.
- `npm run check` — passed after the final accessible-state correction;
  typecheck, all 53 repository tests, and the production build completed.
- Feature-only production build from `preview/index.html` — passed: 645 modules,
  28.46 kB CSS, 838.37 kB JavaScript (278.58 kB gzip). Vite emitted its standard
  >500 kB chunk warning; no dependency or speculative split was added in H3.
- Local Vite preview — the HTML, preview module, H2 app module, ECharts wrapper,
  and feature CSS each transformed and returned HTTP 200 from
  `127.0.0.1:4177`.
- Direct-request audit — 32 feature files inspected, 0 direct `fetch(` calls.
- `git diff --check` — passed before every archive point.
- Owned-path audit — every H3-authored path is under
  `apps/web/src/features/h2-sentinel/**`; no contract correction was
  cherry-picked into this path-pure Wave 1 branch.

## Known limitations

- The feature cannot prove plugin composition or Live Analysis behavior until
  H6 mounts accepted worker modules.
- Browser screenshot control was not available in this worker session. Static
  SSR rendering, responsive CSS review, Vite transform checks, and the
  feature-only production build passed, but desktop/mobile screenshot QA is not
  claimed. H6 must capture the mounted Fixture flow at representative desktop
  and 390×844 mobile widths, including C03 and C04.
- Fixture preview is sanitized demonstration evidence, not an official dataset
  or score artifact.
- Report download behavior depends on the browser environment; server-rendered
  tests verify presentation, not a native download dialog.
- The archived Wave 1 worker base contained the pre-correction contract
  fixture; H3 did not modify or merge contracts. Its owned Fixture preview overrides
  C04 to `29.333333333333332 kWh`; H6 must compose from accepted Contract Gate
  correction `4f2a8a3` so the injected provider supplies the same value.
- The feature-only bundle includes ECharts and triggers Vite's 500 kB chunk
  warning. Imports are already tree-shaken; route-level lazy splitting is a
  measured post-integration optimization, not required for the deterministic
  golden path.

## Open-source reuse decision

Apache ECharts is adopted through the existing root dependency and a small
feature-local wrapper. No React wrapper, admin template, new dependency, or
vendor source copy was introduced.

## Golden-path risk

Composition remains the only cross-track dependency. C03/C04, deterministic
assistant, reports, responsive layout, empty Live import, and safe degraded
states are implemented within this subtree.

## MEMORY.md

`MEMORY.md` was not changed because it is outside this track's immutable write
allowlist. Durable integration notes are recorded in this handoff instead.
