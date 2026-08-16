# OpenDashboard Memory

## Current objective

- Date: 2026-08-17.
- Use the public plugin-first README as a product vision while correcting its implementation claims.
- Build the smallest verified architecture seam: shared contracts, static trusted plugin lifecycle, and the existing Fixture provider as the first plugin.
- Keep the Chinese demo runnable throughout the migration.

## Repository facts

- Public `origin/main` is `9a2268901569cd407d5a16fc8f79a936285ec185`; local root `main` remains the older ancestor `6b9fb7e2884f61a078a52cdf7a0440a4d9f7df68` and must not be used as an inferred base.
- The architecture worktree is based explicitly on `origin/main` and uses branch `songconmaisaix31-design/plugin-first-architecture`.
- The immutable release tag `competition-demo-2026-08-16` points to `33165902fc997c6000b4e159d9e5473b4eaf7e15`.
- The public repository uses npm, not pnpm. Current source is a deterministic Fixture demo; it has no plugin loader, host scan, daemon, database, or real process control.
- T5-T10 planning branches and `local-console-planning@9853ed0` contain unpublished unique commits. They must be selectively migrated or archived before their worktrees are removed.

## Architecture decisions

- Plugin-first does not authorize arbitrary code. PF0/PF1 uses only explicit compile-time imports and rejects Tier 2 activation.
- Manifest capabilities are a closed audit vocabulary, not an operating-system permission system.
- The plugin runtime must support dependency ordering, failure rollback, reverse disposal, typed services, and deterministic snapshots.
- Preserve the existing Fixture state machine and provenance; move it behind a plugin service without changing behavior.
- The first real adapter, when authorized, is an explicit opt-in read-only loopback health adapter. Real Windows actions require a separate threat review and process/service ownership contract.
- Do not embed PM2, Glances, OpenTelemetry Collector, Beszel, or a remote agent in the first architecture milestone.
- `systeminformation` is a future candidate behind a narrow adapter, not a current dependency.

## Research and licensing

- Useful patterns come from Cordis/Koishi lifecycle, VS Code manifests/disposables, OpenTelemetry Collector component factories, Uptime Kuma probe/incident separation, and go-plugin version/health semantics.
- PM2 is AGPL-3.0, Glances is LGPL-3.0, HashiCorp go-plugin is MPL-2.0, and no source from them is copied into the core.
- Open Design provides a strong local daemon/contracts/plugin-runtime folder pattern, but its full repository is far beyond OpenDashboard scope.
- The README claimed Apache-2.0 while the public tree had no `LICENSE`; a license decision and file must exist before accepting external source contributions.

## Cleanup and recovery

- Competition video, generated screenshots, T0-T4 prompts/reports, submission copy, and demo Skill descriptors are historical release material rather than active architecture.
- They may leave the active branch only after a recovery ledger points to the immutable tag and GitHub Release. Removing them from the branch does not shrink existing Git history.
- Never remove unpublished planning worktrees merely because their visible files look stale.

## Operational safety

- Never record secret values or read credential stores.
- CodeGraph state under `.codegraph/` is generated and ignored; it is not architecture evidence by itself.
