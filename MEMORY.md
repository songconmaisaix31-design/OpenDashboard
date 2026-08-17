# OpenDashboard Memory

## Current objective

- Date: 2026-08-17.
- Use the public plugin-first README as a product vision while correcting its implementation claims.
- Use the smallest verified architecture seam as the public development baseline: shared contracts, static trusted plugin lifecycle, and the existing Fixture provider as the first plugin.
- Keep the Chinese demo runnable throughout the migration.
- Treat PF3, the explicit opt-in read-only loopback health adapter, as the next implementation milestone.

## Repository facts

- The plugin-first publication lineage starts from former public baseline `origin/main@9a2268901569cd407d5a16fc8f79a936285ec185`; publication must preserve that ancestry without force push or history rewriting.
- Local root `main@6b9fb7e2884f61a078a52cdf7a0440a4d9f7df68` is an older ancestor and must not be used as an inferred current base.
- The architecture worktree uses branch `songconmaisaix31-design/plugin-first-architecture`; verify the live default branch before each release.
- The verified GitHub release tag `competition-demo-2026-08-16` points to `33165902fc997c6000b4e159d9e5473b4eaf7e15`.
- The public repository uses npm, not pnpm. Current source is a deterministic Fixture demo; it has no plugin loader, host scan, daemon, database, or real process control.
- T5-T10 planning branches and `local-console-planning@9853ed0` contain unpublished unique commits. They must be selectively migrated or archived before their worktrees are removed.

## Architecture decisions

- Plugin-first does not authorize arbitrary code. The PF1/PF2/PF7 baseline uses only explicit compile-time imports and rejects Tier 2 activation.
- Manifest capabilities are a closed audit vocabulary, not an operating-system permission system.
- The plugin runtime must support dependency ordering, failure rollback, reverse disposal, typed services, and deterministic snapshots.
- Preserve the existing Fixture state machine and provenance; move it behind a plugin service without changing behavior.
- The first real adapter, when authorized, is an explicit opt-in read-only loopback health adapter. Real Windows actions require a separate threat review and process/service ownership contract.
- Do not embed PM2, Glances, OpenTelemetry Collector, Beszel, or a remote agent in the first architecture milestone.
- `systeminformation` is a future candidate behind a narrow adapter, not a current dependency.

## Plugin baseline implementation evidence

- PF0 truth, licensing, research, cleanup, and architecture Gate is commit `39051b6` on the isolated architecture branch.
- Canonical Demo and plugin contracts now live under `packages/contracts`; the static lifecycle is under `packages/plugin-runtime`; the deterministic provider is under `plugins/fixture-demo`.
- The web entry resolves `DemoDataSource` from `fixtureDemoPlugin`; it no longer constructs the Fixture provider directly.
- A clean lockfile install followed by `npm run check` passed strict type checking, 32 tests, and the Vite production build.
- CodeGraph indexed 40 files, 327 nodes, and 1,143 edges with zero pending changes. Symbol query found the runtime definition and its web/test import nodes; affected-test analysis returned three focused tests. Symbol impact itself returned no traversed edge and is not treated as proof.
- Chrome completed the full Chinese flow at the default desktop viewport and at 375x812. The mobile page had no horizontal overflow and the final healthy/recovered report was visible.
- Current `npm audit` reports one low-severity advisory in the dev-only `tsx` nested `esbuild`. It is not used as the product dev server; a targeted tool upgrade was not retained because its clean Windows platform install was not reproducible during the registry timeout. No moderate, high, or critical advisory was reported.

## Research and licensing

- Useful patterns come from Cordis/Koishi lifecycle, VS Code manifests/disposables, OpenTelemetry Collector component factories, Uptime Kuma probe/incident separation, and go-plugin version/health semantics.
- PM2 is AGPL-3.0, Glances is LGPL-3.0, HashiCorp go-plugin is MPL-2.0, and no source from them is copied into the core.
- Open Design provides a strong local daemon/contracts/plugin-runtime folder pattern, but its full repository is far beyond OpenDashboard scope.
- The README claimed Apache-2.0 while the public tree had no `LICENSE`; a license decision and file must exist before accepting external source contributions.

## Cleanup and recovery

- Competition video, generated screenshots, T0-T4 prompts/reports, submission copy, and demo Skill descriptors are historical release material rather than active architecture.
- They may leave the active branch only after a recovery ledger points to the verified release tag and GitHub Release. Removing them from the branch does not shrink existing Git history.
- Never remove unpublished planning worktrees merely because their visible files look stale.

## Operational safety

- Never record secret values or read credential stores.
- CodeGraph state under `.codegraph/` is generated and ignored; it is not architecture evidence by itself.

## Handoff

- The consolidated Chinese research and architecture handoff is `docs/handoff/RESEARCH_AND_ARCHITECTURE_HANDOFF_ZH.md`.
- It is the onboarding map for the verified PF0/PF1/PF2/PF7 baseline, but canonical contracts and current source still take precedence.
