# T9 — Plugin SDK Contract

Status: independent planning task; no implementation

## Goal

Define the smallest future-facing metadata and lifecycle contract for a plugin
or provider adapter without creating a plugin runtime.

## Scope

- Metadata, compatibility, capability, and provenance fields
- Lifecycle states and stable initialization errors
- Trust assumptions and explicit unsupported behavior
- Static fixture manifests and contract-level checks

## Boundaries

- Do not build a loader, dynamic import, arbitrary execution, signing system,
  marketplace, package installation, sandbox, or remote registry.
- Do not select a framework or bind the contract to a provider.
- Own only plugin metadata and lifecycle; do not define incident, diagnostic,
  inventory, or action mappings.
- Static examples are data only and must never be executed.

## Result

A self-contained metadata contract, lifecycle table, static examples,
acceptance checks, and deferred-decision list. Record the planning outcome in
`reports/planning/T9.md`.
