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
- Epoch 4 delivery is bound to executable SHA `58090bc1747d621bc87d698259319a70c34e75f2` (Epoch 3). Internal/API severity remains English; external submission severity is Chinese.

## H2 Sentinel Epoch 4 delivery evidence

- Attempt 6 is the only official technical run used as new Epoch 4 evidence; attempts 1–5 remain retained historical records. Raw identity: 77,865,257 bytes, 172,800 rows, 69 fields, SHA-256 `88f3a5c15fb5c42d265475f2998fe9f6c271dcef16f43daee7626f6704504cd9`. Normalized identity: 78,038,054 bytes, SHA-256 `4407495ad75299f2f8f06112f6d3209eb93b2773ff3f0c797c47874159853169`.
- Attempt 6 completed with 104 detected events, a 104-row by 16-column export, 21 variables by 172,800 points, and cleanup passed. The sanitized report SHA-256 is `8796dd1f9e9baca3dad0711c6fb74ccca40485874527a5ef0e2323a9111bf27f`; the attempt-6 `submission.csv` SHA-256 is `af8814d3e428ef1470a43e0a07d4d6dcdc79585846841a15778fff8c91d60326`.
- Exact remote CI runs `32591314579`, `32591315711`, and `32591315735` are green for the executable SHA. Deployment identity is `dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf`, host `h2-sentinel-hxrbu0wan-dwwww.vercel.app`, with custom domain `204421.xyz`. The custom domain currently exposes the public H2 SPA shell with HTTP 200 and confirmed `H2 Sentinel` and `氢哨` asset markers; the invalid-mode route was observed only as a 200 shell, not as a confirmed JavaScript literal. Direct access to the Vercel hostname currently returns `AUTH-REDIRECT`, so its H2 shell status is `UNKNOWN-HOLD`. This remains static deep-link evidence only and does not establish deployment code-SHA binding.
- Analytics is local-only and is not a public server. No organizer score, visual or interactive GUI verification, committed screenshots, or general network-isolation proof is established. Registration/form submission, receipt/acceptance, and official score remain `UNKNOWN-HOLD` after the 2026-08-21 deadline; technical evidence must not imply any of them.
- The organizer package ZIP evidence is 68,574,329 bytes with SHA-256 `27dd2d096e0eb002cf50feb68f33fd1b586b46e4daddf97398390dc6394a5072`; its checksum manifest passes 20 data/material entries, but documentation paths/content have a recorded manifest discrepancy and the whole package is not called verified. This is source-package evidence, not the final submission archive.
- The final submission package/archive SHA-256 and organizer submission/receipt/acceptance remain `UNKNOWN-HOLD`. The `af8814d3e428ef1470a43e0a07d4d6dcdc79585846841a15778fff8c91d60326` identity is only the pipeline-derived Attempt-6 `submission.csv`; raw official input was not committed to the repository or copied into memory.
- Technical GO remains pending until the final post-document SHA passes every required gate and receives fresh exact-SHA CI; the existing green runs are evidence for the executable SHA only.
- Production dependency audit is clean. Full audit has one low-severity dev-only nested `esbuild` advisory (`GHSA-g7r4-m6w7-qqqr`) and no moderate, high, or critical findings.
