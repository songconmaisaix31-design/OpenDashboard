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

## GitHub publication

- Pull request `https://github.com/songconmaisaix31-design/OpenDashboard/pull/1` tracks publication of the plugin-first baseline to the default branch without history rewriting.
- `.github/workflows/ci.yml` runs `npm ci` and `npm run check` with read-only repository permissions for pull requests and pushes to `main`.
- Do not claim the baseline is public until the live PR state is merged and `origin/main` contains commit `7a81636` or a descendant.

## H2 Sentinel assembled vertical slice

- Date: 2026-08-19. The integration branch is `competition/h2-sentinel`; the H2 work did not modify or merge `main`. The frozen Wave 1 assembly gate is `b706678123461f407ca89d905cac920b007a17ba`.
- H2 has two explicit equivalent entries, `/h2-sentinel?mode=fixture|local` and `/h2-sentinel/?mode=fixture|local`. The generic `/` application remains the default, and unknown H2 modes fail closed with a visible startup error.
- Fixture mode is deterministic and requires no Python sidecar. Local mode is an explicit read-only, same-origin Web path backed only by a literal `127.0.0.1` analytics service. It has no LLM rendering and executes no device or scheduling control.
- ECharts is pinned directly at `6.1.0` and imported with tree-shakable module APIs; no wrapper dependency was added.
- Canonical H0 fixtures cover C03 and C04. The reproducible C04 impact is `29.333333333333332 kWh`, derived from eight inclusive one-minute rows at `720 - 500 kW`; it is Fixture evidence, not an official score.
- Local and Fixture report formats are aligned: single-event diagnosis, period summary, and quality report are HTML; analysis result and validation metrics are JSON; submission is CSV. Report content hashes are validated and visible in the Web report details.
- The Live plugin has 12 fixed namespace routes and rejects malformed or semantically inconsistent envelopes, nested provenance, request identity, event references, duplicate event IDs, report metadata or hashes, assistant citation graphs, series identities, and redirected responses. CSV filename and exact UTF-8 SHA-256 are bound to import responses; a 307 target receives no forwarded body.
- Ready workspaces use `run.dataset.mode` and the request-bound `run.events`; transport mode and the unbound `listEvents` response cannot overwrite displayed provenance or events. The unused `listEvents`/`getEvent` seams still lack run identity in H0 and must not be reintroduced into a product path without a contract change.
- Launcher health accepts only the exact closed H0/H1 health response. Windows-owned Web and analytics trees use a narrow Job Object wrapper with kill-on-close; readiness observes every owned child from spawn through shutdown. External sidecars remain unowned. POSIX retains the process-group cleanup path.
- Final verification on the code tree at `736d648` passed strict type checking, 92 repository tests, 60 focused H2 tests, five assembled QA groups, nine launcher tests, nine real launcher smoke scenarios, and 32 locked Python tests. Golden generation produced C03/C04, the corrected impact, and a valid two-row/16-column submission CSV.
- The production build processed 684 modules and emitted 900.01 kB minified JavaScript (297.15 kB gzip) and 47.44 kB CSS. The greater-than-500-kB Vite warning remains accepted evidence, not a resolved performance claim. Python tests retain one upstream Starlette/httpx deprecation warning.
- Manual browser verification covered the complete Chinese Fixture flow at desktop and 390x844, the Local golden C03/C04/report flow, visible provenance and human-confirmation boundaries, report hash visibility, and document-width containment. No formal screenshot artifact or automated visual regression suite is claimed.
- CodeGraph indexed 163 files, 1,657 nodes, and 5,326 edges with zero pending changes. `runLauncher` impact reached its production entry, smoke helper, adversarial helper, and launcher test; affected-test analysis selected the H3 workspace, plugin loopback/response, and launcher tests. CodeGraph remains navigation evidence, not runtime proof.
- Remaining non-release-blocking debt: arbitrary period-range semantics are not implemented, `H2SeriesRequest.eventId` is unused, several H0 JSON schemas leave provenance structurally broad, assistant section-to-citation claim-kind correlation is intentionally undefined because the canonical Fixture mixes fact and calculation citations, and the POSIX cleanup path was not adversarially exercised in this Windows run.
- Official competition data, official validation metrics or score, deployment, a remote GitHub Actions result, committed screenshots, and a general network-isolation proof remain undelivered and must not be claimed.
