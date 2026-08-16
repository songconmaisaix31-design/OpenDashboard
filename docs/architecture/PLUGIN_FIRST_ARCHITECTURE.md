# Plugin-First Architecture Baseline

- Status: PF0 decision baseline
- Date: 2026-08-17
- Product surface: local-only Simplified Chinese console

## Why this architecture

The product problem is fragmented local-service diagnosis, not plugin loading itself. The architecture therefore starts with one verified extension seam and one real consumer: the existing Fixture demo. A marketplace or arbitrary loader would add code execution risk before it adds user value.

## Layers

```text
Chinese Web UI
      |
      v
Typed service tokens
      |
      v
Static Plugin Runtime ---- Runtime snapshot/audit
      |
      +---- Fixture Demo Plugin (implemented first)
      +---- Local Host Read-only Plugin (next gate)
      +---- Incident/Evidence Plugins (later)

Tier 2 broker / WASM / sidecars (deferred)
```

### Core

`packages/contracts` owns stable data and plugin contracts. `packages/plugin-runtime` validates explicit definitions, orders dependencies, owns service lifetimes, and reports state. Core code does not know provider-specific payloads.

### Tier 1

Tier 1 plugins are reviewed source compiled with the application. They receive a narrow context but remain fully trusted because JavaScript imports cannot be constrained by metadata. PF1 ships only the Fixture provider.

### Tier 2

Tier 2 is a future execution boundary, not a current runtime mode. A valid design requires artifact identity, API negotiation, signed or hash-pinned packages, OS-level filesystem/network/resource policy, health and termination, and typed RPC. Sidecar process separation alone is fault isolation, not a sandbox.

## Composition rules

1. The application supplies an immutable list of reviewed plugin definitions.
2. The runtime validates every manifest and the full dependency graph before activation.
3. Dependencies activate first. Each activation returns a disposer.
4. Service providers are unique by typed token ID.
5. A failure rolls back every earlier activation in reverse order.
6. Shutdown disposes all active plugins in reverse order.
7. Tier 2 definitions cannot activate in the in-process runtime.

## Product data path

PF1 preserves the Fixture path:

```text
Fixture records -> deterministic transitions -> DemoDataSource service -> Chinese UI
```

PF2 introduces, only after security review:

```text
Explicit TargetRegistry
  -> bounded read-only Probe
  -> normalized Observation
  -> pure IncidentReducer
  -> evidence ledger/read model
  -> UI
```

Automatic process scanning is observation, not ownership. No future action may be authorized by PID, port, or process name alone.

## Dependency policy

- Keep npm and the current toolchain.
- Add no runtime dependency for manifest validation or lifecycle while the contract remains small and closed.
- Consider `systeminformation` only for a later narrow Windows snapshot adapter.
- Keep OpenTelemetry as an optional outward adapter; it is not the authoritative incident ledger.
- Do not embed PM2, Glances, Uptime Kuma, Beszel, OTel Collector, VS Code extension host, or go-plugin.

## Security gates

| Gate | Required before |
|---|---|
| Manifest and lifecycle tests | Any additional Tier 1 plugin |
| Loopback/Host/Origin/SSRF threat review | Local HTTP probe or daemon |
| Storage/redaction/retention design | SQLite evidence persistence |
| Windows ownership, approval, idempotency, reconciliation | Any real service action |
| Artifact signing, resource policy, RPC, crash/termination model | Tier 2 execution |

## Integration evidence

Each integration commit must include the focused tests for its boundary, `npm run check`, `git diff --check`, CodeGraph impact inspection, and a production-entry browser pass when composition or UI changes.
