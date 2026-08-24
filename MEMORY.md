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

## H2 Sentinel Epoch 5 isolated full-Fixture delivery

- Date: 2026-08-23. Epoch 5 reused the canonical six-page deterministic Fixture from frozen base `39a599285cbd39b2575564d5dc79d078964c5bd7` on isolated branch `songconmaisaix31-design/h2-full-deploy-e5`; the deployed implementation candidate is `f546a6aedaefa66f5634b20008a20cab41db26ed`. The protected remote `main@7889feb274dac77753fdd323df352c9c1335aebf` and `competition/h2-sentinel@39a599285cbd39b2575564d5dc79d078964c5bd7` refs remained unchanged.
- `https://full.204421.xyz` is the isolated public Fixture origin for Vercel project `h2-sentinel-full` (`prj_KvPLDryNckM3lSaHVDG3YeMJyiCj`) and deployment `dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU`. Root returns a temporary 307 to `/h2-sentinel/?mode=fixture`; both H2 Fixture slash forms return the SPA document; the public analytics route returns 404. TLS, HSTS, exact-host CNAME, and anonymous assets passed CLI-only checks.
- The Epoch 5 JavaScript identity is 935,880 bytes, SHA-256 `02ccb27f97ce0bc6098307e8ed8506577699a83ec5088ebed1a7b4b41610066d`; the CSS identity is 49,826 bytes, SHA-256 `6ec8757d71b6518408ac83a8a0ddb4a8bdc1e3c0a4c41a7572ee404561a169b2`. Local build, authenticated staged fetch, and anonymous custom-domain fetch matched byte-for-byte. Static markers and hashes are artifact evidence, not visual or interaction evidence.
- The existing `204421.xyz` deployment remained unchanged at `dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf`, including JavaScript SHA-256 `b26ab9a88167f6b587732d52a4ae9461d8d2edfa4b17847e3f815ec81ef6d4b6`, the shared CSS identity, and apex A result `216.198.79.1`.
- Epoch 5 decisions are independent: Static Fixture delivery is `GO`; Live/Local analytics is `NOT_EXPOSED`; visual verification, organizer submission/receipt/acceptance, official score, and final submission archive remain `UNKNOWN-HOLD`. HTTP status, hash routes, matching bundles, Fixture results, and tests must not be promoted into those unsupported claims.
- The approved isolated publication pattern is a clean `vercel --prod --skip-domain` staged deployment, authenticated pre-binding qualification without extracting credentials, one exact custom domain, and exactly one explicit promotion. Provider-generated hostnames may remain `AUTH-REDIRECT`; only the anonymous custom domain can satisfy public delivery.
- Vercel linking may materialize `.env.local`. Treat any such file as secret: never read it, remove only the exact generated file, restore unrelated ignore-file changes, and verify that no environment material persists before handoff.

## H2 Sentinel Epoch 6 apex production default

- Date: 2026-08-24. Plan commits `2bf604fb5efb2439552d57702675551b620e8205` and `78e966f6d839ef7dce7416c7c77132b29409826a` governed the exact-apex switch. `204421.xyz` and `full.204421.xyz` now both serve the already-qualified six-page Fixture from `h2-sentinel-full` (`prj_KvPLDryNckM3lSaHVDG3YeMJyiCj`) production deployment `dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU`; no new deployment or promotion was used.
- Preflight exposed an important provider distinction: ProjectDomain metadata for the apex belonged to `dashboard` (`prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql`), while alias traffic reached `h2-sentinel` (`prj_6pRMaPgh3YXvgibdHBYnM9RoysUQ`) deployment `dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf`; `h2-sentinel` itself had no custom domain. Domain ownership and traffic target must be inspected independently before future routing work.
- Vercel CLI `56.3.1` implements `domains add --force` as a non-atomic exact ProjectDomain DELETE then POST. The safe reusable pattern is alias the qualified immutable deployment first, verify anonymous traffic, then transfer exact-domain metadata. Rollback restores the old immutable alias immediately, transfers exact `204421.xyz` back to `dashboard` when required, and locks the old alias again; DNS and `full.204421.xyz` remain untouched.
- Final provider state has no ProjectDomain on `dashboard`; `h2-sentinel` retains only its platform hostname; `h2-sentinel-full` has `204421.xyz`, `full.204421.xyz`, and its platform hostname. Both custom domains bind to the same `Ready` production deployment. The old deployment remains `Ready` as the bounded rollback target.
- Apex DNS remains A `216.198.79.1`; the full subdomain remains CNAME `063cc3c97d7335db.vercel-dns-017.com`; authoritative name servers remain `dns31.hichina.com` and `dns32.hichina.com`. Resolver TTL variation is not by itself configuration drift.
- The full JavaScript identity is 935,880 bytes with SHA-256 `02ccb27f97ce0bc6098307e8ed8506577699a83ec5088ebed1a7b4b41610066d`; CSS is 49,826 bytes with SHA-256 `6ec8757d71b6518408ac83a8a0ddb4a8bdc1e3c0a4c41a7572ee404561a169b2`. These hashes and HTTP results bind static transport only, not visual or interaction quality.
- Hostname access classifications can drift independently: immutable automatic URLs and project-default hostnames must be freshly probed rather than inferred from an earlier receipt. Epoch 6 did not rewrite the Epoch 5 hostname observation.
- Epoch 6 decisions remain independent: Static Fixture production default is `GO`; Live/Local analytics is `NOT_EXPOSED`; visual/interaction, organizer submission/receipt/acceptance, official score, and final submission archive remain `UNKNOWN-HOLD`. The user prohibited browser/computer control.
- Environment values were deliberately not queried. No credential or environment value was read or persisted, and `.env.local` was absent from the Epoch 6 worktree.

## H2 Sentinel Epoch 7 dashboard shutdown hold

- Date: 2026-08-24. The sole authorized shutdown path was a reversible pause of exact Vercel project `dashboard` (`prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql`); deletion, redeploy, promotion, alias removal, domain transfer, and DNS mutation were prohibited substitutes.
- The narrow live alias registry showed two provider-owned aliases targeting `dpl_5qSx6duyyumiPz1iktqgdou9KhnT`; the same deployment retained immutable URL `dashboard-4gdp8qvoe-dwwww.vercel.app`, while the project's ProjectDomain list was empty. The exact pause POST returned HTTP 400, client exit code 1, with `Active production deployment does not exist`; no mutation occurred, all three origin probes at `/login` remained HTTP 200, and shutdown is `UNKNOWN-HOLD`.
- The provider state is inconsistent: live aliases serve an application deployment but the pause control cannot find an active production deployment. Vercel support or control-plane repair is required; after repair, repeat a fresh narrow preflight and retry only the exact project pause. Never retry blindly or simulate shutdown by removing routes.
- `204421.xyz` and `full.204421.xyz` remained unchanged on `h2-sentinel-full` deployment `dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU`, including their Fixture routes and JavaScript/CSS hashes. Epoch 7 changed no source/code, deployment, alias, ProjectDomain, custom domain, DNS record, or protected ref.
- One delegated read-only preflight used an over-broad project GET and encountered encrypted environment metadata and provider ciphertext. No plaintext secret was observed, used, copied, or persisted. Future provider reads must use minimum-field identity/domain/alias/deployment/pause-state endpoints and must not retrieve broad project, environment, credential, or ciphertext payloads.

## H2 Sentinel Epoch 7 dashboard permanent deletion

- Date: 2026-08-24. The user explicitly authorized permanent deletion of exact Vercel project `dashboard` (`prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql`). A single no-body v9 DELETE exited 0 as attempt 1 of 1, with no retry and no rollback.
- Pre-delete scope was exactly 24 deployments, two aliases, and zero domains. The LF-delimited UTF-8 set digests were `1755cf715f07dc07f0498c816d5326cd23d6268b39058ebfce3d3acb4e147ac2` for deployments and `fdfa7fb5f0916126680e6e6a8e22df1e7993359e3d947a3c17b5f4745aba0cfc` for aliases.
- Post-delete evidence found exact project name/ID missing, zero exact project-list rows, all 24 deployment IDs missing, both alias lookups at HTTP 404 `Project not found`, both alias origins at HTTP 404 `DEPLOYMENT_NOT_FOUND`, and the immutable origin at HTTP 410 `GONE`. Deletion is `GO`.
- Deletion permanently removed the accepted project-scoped configuration. During this authorized deletion run, no environment endpoint, value, metadata record, or provider ciphertext was read. The external Git repository was preserved.
- `204421.xyz` and `full.204421.xyz` remained unchanged on `h2-sentinel-full` production `dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU`; its four aliases and three domains, Fixture routes, static asset identities, TLS/HSTS, DNS values, rollback deployment, and protected refs showed no drift.
- Static Fixture production remains `GO`; Live/Local analytics remains `NOT_EXPOSED`; visual/interaction and organizer submission, receipt, acceptance, official score, and final archive remain independent `UNKNOWN-HOLD` outcomes.
