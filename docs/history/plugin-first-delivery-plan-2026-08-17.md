# Plugin-First Delivery Blocks

Each block starts from an explicit immutable Gate commit, uses its own Orca worktree, writes only the listed paths, and returns a commit plus verification record. A block may read frozen contracts but must not read another parallel block's output.

## PF0 — Product truth and architecture gate

Paths: root governance/specification files and `docs/{architecture,research,history,plans}/**`.

Deliver the truthful README, PRD, technical specification, plugin contract, open-source reuse matrix, cleanup ledger, and immutable Gate SHA. Do not change runtime source or claim planned integrations.

Constraint prompt:

> Work only in the declared documentation paths. You may inspect the repository and primary upstream sources read-only. Do not modify application source, lockfiles, branches, releases, credentials, or external systems. Separate implemented, planned, deferred, and rejected capability.

## PF1 — Shared contracts and static runtime

Paths: `packages/contracts/**`, `packages/plugin-runtime/**`, and focused tests.

Implement manifest validation, service tokens, dependency ordering, lifecycle rollback/disposal, runtime snapshots, and Tier 2 rejection. Do not add a dynamic loader, network, persistence, shell, or new dependency.

Constraint prompt:

> Your authority is limited to the PF1 paths and the frozen PF0 contract. Do not edit UI, Fixture behavior, root scripts/lockfiles, or another module. No user-controlled import, process, network, filesystem mutation, eval, or external write is allowed. Record test results and unresolved contract risks.

## PF2 — Fixture plugin migration

Paths: `plugins/fixture-demo/**` and migration tests only.

Move the existing Fixture data source, transitions, and golden data behind the PF1 service boundary without behavior changes. Preserve IDs, Chinese copy, provenance, idempotency, redaction, and the full golden path.

Constraint prompt:

> Work only in the Fixture plugin paths. Treat PF1 as read-only. Do not redesign domain behavior, add providers, change UI, add real I/O, or weaken Fixture labels. Return a commit and evidence that existing transition tests still pass.

## PF3 — Read-only local host adapter

Paths: `plugins/local-host-readonly/**` and its tests/fixtures.

After the security Gate, implement one opt-in read-only adapter for explicit targets. It must never scan or control arbitrary processes, send non-loopback requests, or read credentials.

Constraint prompt:

> Your authority is limited to the read-only plugin. Follow the frozen target/probe contract and threat review. No process control, shell, elevation, LAN discovery, wildcard bind, arbitrary URL, persistence migration, or UI change. Failure must return typed evidence rather than trigger an action.

## PF4 — Incidents and evidence

Paths: `packages/core/src/{incidents,evidence}/**` and tests.

Create pure reducers and evidence records over normalized observations. Keep storage behind a port; do not select a database or add actions.

Constraint prompt:

> Work only in the incident/evidence paths. Inputs are immutable normalized contracts. No provider imports, UI, network, process, storage implementation, or action execution. Prove deterministic replay and redaction boundaries with tests.

## PF5 — Action decision boundary

Paths: `packages/core/src/action-policy/**` and tests.

Define deny-by-default decisions, approval binding, idempotency, and reconciliation states. This block makes no real change to the host.

Constraint prompt:

> Implement decisions only. Do not execute commands, manage services, inspect credentials, or infer ownership from PID/name/port. Every unknown or stale input is denied. Return typed decisions and focused tests.

## PF6 — Chinese console surface

Paths: `apps/web/src/features/local-console/**`, matching UI tests, and approved static assets.

Build the Chinese local-console view from frozen view models and Fixture data. Do not connect live providers or alter shared contracts.

Constraint prompt:

> Work only in the feature UI and its tests/assets. Shared contracts and runtime are read-only. Use the approved visual source and fixed data. Do not add external requests, provider logic, runtime configuration, or unverified live wording. Verify desktop and mobile layouts.

## PF7 — Integration and release gate

Paths: composition entrypoints, root configuration when strictly necessary, end-to-end tests, and current release evidence.

Integrate accepted commits, rewire imports, remove compatibility shims, run CodeGraph impact checks and all build/test/browser gates. This block does not invent new capability.

Constraint prompt:

> Integrate only reviewed task commits from the declared Gate. Do not redesign modules or add features. Root config and lockfile changes require direct evidence. Preserve Chinese Fixture behavior and provenance. Stop on contract drift, unowned path changes, failed checks, or new external side effects.
