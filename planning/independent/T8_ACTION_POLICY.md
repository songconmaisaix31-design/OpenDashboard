# T8 — Action and Approval Policy

Status: independent planning task; no implementation

## Goal

Define a deny-by-default policy contract for action requests, approvals,
idempotency, expiry, audit, and explicit rejection.

## Scope

- Action-request and decision states
- Approval, expiry, idempotency, and audit rules
- Safe fixture-only decision examples
- Contract-level acceptance and denial cases

## Boundaries

- Do not build an executor, workflow engine, shell action, process control,
  file mutation, network action, or policy runtime.
- Do not define application-specific remediation behavior.
- Own only a future generic policy model; do not modify or reinterpret the
  current demo approval and action contract.
- Approval records never authorize capabilities outside the declared action.

## Result

A self-contained policy contract, decision table, fixture cases, acceptance
checks, and deferred-decision list. Record the planning outcome in
`reports/planning/T8.md`.
