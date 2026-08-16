# T3 Skill Descriptor Index

These six files are static competition descriptors. They contain no scripts,
plugin entry points, network calls, or executable configuration.

## Runtime source of truth

The only runtime boundary is
[`DemoDataSource`](../apps/web/src/contracts/data-source.ts). Descriptors refer
to its exported type names instead of repeating TypeScript schemas. T1 owns the
fixture implementation, T2 consumes the port, and T3 only documents the
competition narrative.

`loadInitialSnapshot()` is bootstrap behavior and is intentionally not a Skill.

| Descriptor | Port method | Input type | Result type | Required phase | Result phase |
|---|---|---|---|---|---|
| [`api-500-triage`](./api-500-triage.md) | `collectEvidence` | `CollectEvidenceInput` | `DemoCommandResult<DemoSnapshot>` | `incident_open` | `evidence_collected` |
| [`request-simulated-restart`](./request-simulated-restart.md) | `requestRestart` | `RequestRestartInput` | `DemoCommandResult<DemoSnapshot>` | `evidence_collected` | `approval_pending` |
| [`approve-simulated-restart`](./approve-simulated-restart.md) | `approveAction` | `ApproveActionInput` | `DemoCommandResult<DemoSnapshot>` | `approval_pending` | `action_confirmed` |
| [`verify-api-recovery`](./verify-api-recovery.md) | `verifyRecovery` | `VerifyRecoveryInput` | `DemoCommandResult<DemoSnapshot>` | `action_confirmed` | `recovered` |
| [`export-redacted-evidence`](./export-redacted-evidence.md) | `exportEvidence` | `ExportEvidenceInput` | `DemoCommandResult<DemoEvidenceReport>` | Any | Unchanged |
| [`reset-fixture-demo`](./reset-fixture-demo.md) | `resetDemo` | `ResetDemoInput` | `DemoCommandResult<DemoSnapshot>` | Any | `incident_open` |

## Shared command rules

- Every mutating demo command receives `runId` and `idempotencyKey` through its
  frozen input type.
- Accepted replays return the original value with `replayed: true`.
- Stable errors are `invalid_demo_transition`, `invalid_demo_reference`, and
  `idempotency_conflict`.
- Every external-provider record remains fixture-backed with visible
  provenance. No descriptor authorizes a live adapter.
- No descriptor authorizes shell execution, real process control, source-code
  repair, upload, deployment, or external requests.

All six capabilities remain `designed` at T3 handoff. T4 may change a status
only when the integrated T1/T2 candidate supplies the evidence required by
[`submission/CLAIMS.md`](../submission/CLAIMS.md).
