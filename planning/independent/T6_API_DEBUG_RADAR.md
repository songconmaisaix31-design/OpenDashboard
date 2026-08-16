# T6 — API Debug Radar Boundary

Status: independent planning task; no implementation

## Goal

Define a read-only diagnostic contract that converts already-normalized HTTP,
trace, and log fixtures into concise API failure findings.

## Scope

- Diagnostic input and output fields
- Correlation, redaction, confidence, and limitation rules
- Representative 5xx fixture cases
- Contract-level acceptance and failure cases

## Boundaries

- Do not design interception, proxying, request replay, live tracing, incident
  creation, actions, UI, or network transport.
- Do not inspect real requests, headers, bodies, or credentials.
- Own only diagnostic findings; do not define incident, inventory, action, or
  plugin mappings.
- A finding is diagnostic evidence only, never proof of root cause.

## Result

A self-contained diagnostic contract, fixture matrix, redaction rules,
acceptance checks, and deferred-decision list. Record the planning outcome in
`reports/planning/T6.md`.
