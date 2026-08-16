# T7 — Runtime and Hardware Inventory

Status: independent planning task; no implementation

## Goal

Define a read-only snapshot contract for runtime identity, resource state, and
hardware capability with explicit unknown, stale, and unsupported states.

## Scope

- Snapshot fields and provenance
- Freshness and unsupported-capability semantics
- Redaction and machine-identity boundaries
- Deterministic fixture cases and contract checks

## Boundaries

- Do not enumerate real processes, inspect user sessions, invoke OS commands,
  read hardware APIs, or control a runtime.
- Do not design monitoring daemons, actions, UI, or provider transport.
- Own only inventory snapshots; do not define incident, diagnostic, action, or
  plugin mappings.
- Never persist usernames, absolute paths, host identifiers, or secrets.

## Result

A self-contained snapshot contract, state table, fixture cases, acceptance
checks, and deferred-decision list. Record the planning outcome in
`reports/planning/T7.md`.
