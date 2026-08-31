# OpenDashboard Memory

## Current maintenance state

- Date: 2026-09-01.
- Public status is `LAB / MAINTENANCE`; the GOAI entry did not advance to the semifinal.
- OpenDashboard is an experimental local AI control console built from the original H2 Sentinel diagnosis-demo foundation. It is not a production enterprise control hub.
- Current runtime behavior is deterministic Fixture data plus simulated approval and recovery transitions. There is no Live provider or real host operation.

## Durable boundaries

- Keep H2 continuation history, worktrees, tags, and unpublished fixes separate; do not merge them into `main` as cleanup work.
- Keep provenance explicit across Fixture, Mock, Planned, and Live states.
- The plugin runtime accepts only reviewed compile-time Tier 0/1 TypeScript definitions. Manifest capabilities are audit metadata, not a sandbox.
- Do not add dynamic loading, arbitrary shell, elevation, real process control, remote hosts, multi-machine control, a marketplace, WASM execution, or an Agent platform under maintenance scope.
- Use npm and `package-lock.json`; the publication gate is `npm ci`, `npm run check`, and `git diff --check`.
- Never read or record `.env`, credentials, tokens, private keys, or credential stores.

## Current implementation

- Canonical contracts: `packages/contracts/**`.
- Static lifecycle and service container: `packages/plugin-runtime/**`.
- Deterministic provider: `plugins/fixture-demo/**`.
- Chinese presentation and composition: `apps/web/**`.
- Historical plans and the previous architecture memory are retained under `docs/history/**`; they are not current implementation proof.

## Single candidate milestone

PF3 is the only candidate milestone: an explicit opt-in, read-only, loopback-only health adapter for user-declared targets, after a threat model and target/probe contracts are frozen. Without separate authorization, remain in limited maintenance.
