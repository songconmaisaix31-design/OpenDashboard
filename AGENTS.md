# OpenDashboard Agent Guide

## Project status

- The public baseline is `origin/main@9a2268901569cd407d5a16fc8f79a936285ec185`.
- The repository contains a runnable React 19, strict TypeScript, Vite, and npm Fixture demo.
- The active objective is the isolated `plugin-first-architecture` worktree: establish truthful product docs, a static plugin runtime, shared contracts, and a Fixture plugin without changing behavior.
- Long-term README capabilities are goals unless source and verification prove otherwise.

## Product boundary

- Position OpenDashboard as a local service diagnosis and controlled-recovery console, not a universal computer administration panel.
- Preserve visible, machine-readable Fixture/Mock/Planned/Live provenance.
- PF0/PF1 permits only statically imported, reviewed Tier 0/1 TypeScript plugins.
- Dynamic plugin loading, arbitrary shell, real process control, remote hosts, automatic elevation, marketplace, and Tier 2 execution are out of scope.

## Source ownership

- `packages/contracts/**`: canonical shared contracts.
- `packages/plugin-runtime/**`: static registry, lifecycle, and service container.
- `plugins/fixture-demo/**`: deterministic Fixture provider.
- `apps/web/**`: Chinese presentation and final composition.
- `docs/architecture/**`, `docs/research/**`, `docs/plans/**`: current specifications and evidence.
- `docs/history/**`: pointers to immutable historical refs; it is not implementation proof.

## Working rules

- Use npm because `package-lock.json` and `packageManager` are authoritative.
- Prefer existing platform APIs and current dependencies; do not add a dependency for a small closed contract.
- Keep changes limited to the stated architecture paths. Do not refactor visual components while moving provider boundaries.
- Treat manifest capability declarations as audit metadata, not sandbox enforcement.
- Never read, print, copy, or persist `.env`, private keys, tokens, passwords, or credential stores.
- Use English for code, comments, file names, commit messages, and technical documents. Chinese UI and public product copy are intentional.

## Git and cleanup

- Work only in the isolated architecture worktree and preserve unrelated branches/worktrees.
- The immutable tag `competition-demo-2026-08-16` is the recovery source for removed competition media and T0-T4 material.
- Do not delete T5-T10 or `local-console-planning` worktrees because they contain unpublished unique commits.
- Never use destructive history rewriting, force push, `git reset --hard`, or `git clean`.

## Verification

- Run `npm run typecheck`, `npm run test`, `npm run build`, and `npm run check` when relevant.
- Run `git diff --check` before handoff.
- Sync CodeGraph and inspect the composition impact; CodeGraph never replaces runtime checks.
- For UI-affecting composition changes, run the production entry and verify the complete Chinese Fixture flow at desktop and mobile widths.
- Do not report a check as passed unless it ran successfully in the current worktree.

## Project memory

- Record durable non-secret decisions in `MEMORY.md`.
- Do not store generated logs, CodeGraph databases, credentials, or facts obvious from source.
