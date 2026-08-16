# T5 — Observability and Incident Model

Status: independent planning task; no implementation

## Goal

Define a provider-neutral model for observations, evidence, incident grouping,
severity, lifecycle, and provenance.

## Scope

- Canonical observation and incident fields
- Deterministic grouping and deduplication rules
- Incident lifecycle and stable error states
- Fixture examples and contract-level acceptance checks

## Boundaries

- Do not design collectors, provider adapters, UI, actions, storage, or network
  transport.
- Do not depend on provider-specific payloads.
- Own only incident aggregation and lifecycle; do not define mappings to
  diagnostic findings, inventory snapshots, actions, or plugins.
- Keep live ingestion, retention, reconciliation, and streaming deferred.

## Result

A self-contained contract proposal, lifecycle table, fixture cases, acceptance
checks, and deferred-decision list. Record the planning outcome in
`reports/planning/T5.md`.
