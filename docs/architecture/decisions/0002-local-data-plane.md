# ADR 0002: One Loopback Data Plane, Read-only First

- Status: accepted as the next milestone constraint; not implemented
- Date: 2026-08-17

## Context

The long-term README describes automatic target discovery, telemetry, incidents, and controlled recovery. Reviewed projects solve parts of this with full monitoring servers, supervisors, Python/Go agents, or external collectors. Importing those runtimes would add more authority and operational burden than the first local use case needs.

## Decision

The first real data plane will be one non-elevated TypeScript process bound explicitly to loopback. Targets are user-approved records, probes are closed and bounded, and all initial adapters are read-only. Same-origin HTTP/SSE is preferred over a new Socket.IO or gRPC dependency.

## Required controls

- Validate Host and Origin; loopback is not authentication.
- Permit only loopback network targets, with redirect, byte, concurrency, and timeout limits.
- Record failed observations instead of converting them directly into actions.
- Keep incident reduction pure and deterministic.
- Defer SQLite until the event/redaction/retention contract is frozen.
- Defer real actions until Windows ownership and post-action reconciliation are specified and authorized.

## Consequences

The first real capability is less broad than “scan and control the whole PC,” but it is explainable, testable, and safe enough to become a reliable product foundation.
