# OpenDashboard Demo Contract

- Status: v1 implemented contract
- Transport: in-process for the competition build; no network API is required

The strict TypeScript definitions under `apps/web/src/contracts/**` are the
canonical machine-readable source. This document records their release-level
semantics and must not be used to override those definitions.

## Contract goals

- Give fixture and future live providers one normalized boundary.
- Keep provider-specific data out of the presentation layer.
- Make mock provenance impossible to omit.
- Make demo commands deterministic, approval-aware, and idempotent.

## Core types

```ts
type DemoMode = 'fixture' | 'live'

type DemoPhase =
  | 'incident_open'
  | 'evidence_collected'
  | 'approval_pending'
  | 'action_confirmed'
  | 'recovered'

interface ProvenanceBase {
  source: string
  observedAt: string
  limitations: string[]
}

interface FixtureProvenance extends ProvenanceBase {
  mode: 'fixture'
  mocked: true
}

interface LiveProvenance extends ProvenanceBase {
  mode: 'live'
  mocked: false
}

type Provenance = FixtureProvenance | LiveProvenance

interface DemoTarget {
  id: string
  name: string
  kind: 'application'
  health: 'degraded' | 'healthy'
  versionControl: 'git' | 'none' | 'unknown'
  provenance: Provenance
}

interface DemoIncident {
  id: string
  targetId: string
  ruleId: 'api-error-burst'
  status: 'open' | 'investigating' | 'recovered'
  severity: 'high'
  fingerprint: string
  evidenceIds: string[]
  provenance: Provenance
}

interface DemoAuditEntry {
  id: string
  event:
    | 'evidence.collected'
    | 'approval.requested'
    | 'approval.granted'
    | 'action.confirmed'
    | 'recovery.verified'
  occurredAt: string
  actor: 'demo-user' | 'fixture-provider'
  mocked: true
  provenance: FixtureProvenance
}

interface DemoProviderHealth {
  id: string
  status: 'mocked' | 'degraded' | 'healthy' | 'planned'
  provenance: Provenance
}

interface DemoSnapshot {
  schemaVersion: 1
  runId: string
  phase: DemoPhase
  target: DemoTarget
  incident: DemoIncident
  workflow: DemoWorkflow
  providerHealth: DemoProviderHealth[]
  evidence: DemoEvidence[]
  approval: DemoApproval | null
  action: DemoAction | null
  verification: DemoVerification | null
  audit: DemoAuditEntry[]
}
```

## Data source port

```ts
interface DemoDataSource {
  loadInitialSnapshot(): Promise<DemoSnapshot>
  collectEvidence(input: CollectEvidenceInput): Promise<DemoCommandResult<DemoSnapshot>>
  requestRestart(input: RequestRestartInput): Promise<DemoCommandResult<DemoSnapshot>>
  approveAction(input: ApproveActionInput): Promise<DemoCommandResult<DemoSnapshot>>
  verifyRecovery(input: VerifyRecoveryInput): Promise<DemoCommandResult<DemoSnapshot>>
  resetDemo(input: ResetDemoInput): Promise<DemoCommandResult<DemoSnapshot>>
  exportEvidence(input: ExportEvidenceInput): Promise<DemoCommandResult<DemoEvidenceReport>>
}
```

Every command input includes `runId` and `idempotencyKey`. Reference-bearing
commands additionally include the corresponding `incidentId`, `targetId`, or
`approvalId`. A successful result returns `{ ok: true, value, replayed }`. A
rejected result returns the unchanged snapshot and one stable error code:
`invalid_demo_transition`, `invalid_demo_reference`, or
`idempotency_conflict`.

The P0 implementation must expose only `FixtureDataSource`. A future live implementation must satisfy the same port and pass separate security and contract tests.

## Command rules

| Command | Required phase | Result phase | Approval | External side effect |
|---|---|---|---|---|
| `collectEvidence` | `incident_open` | `evidence_collected` | No | None |
| `requestRestart` | `evidence_collected` | `approval_pending` | Creates request | None |
| `approveAction` | `approval_pending` | `action_confirmed` | Required | None; in-memory fixture only |
| `verifyRecovery` | `action_confirmed` | `recovered` | No | None |
| `resetDemo` | Any | `incident_open` | No | None |
| `exportEvidence` | Any | Unchanged | No | None; returns an in-memory report |

Every command accepts a deterministic idempotency key in the implementation. Repeating the same accepted command returns the existing snapshot. Invalid phase transitions return a stable `invalid_demo_transition` error and do not mutate state.

`requestRestart` creates a fixture approval request and `approveAction`
confirms only a simulated fixture action. Neither command changes target
health. `verifyRecovery` performs the fixture-only transition to healthy.
None of these commands proves real process ownership, process control, or
source-code repair.

## Evidence report

```ts
interface DemoEvidenceReport {
  schemaVersion: 1
  runId: string
  mode: 'fixture'
  mocked: true
  generatedAt: string
  before: { targetHealth: 'degraded'; incidentStatus: 'open' }
  after: { targetHealth: 'healthy'; incidentStatus: 'recovered' } | null
  evidence: Array<{
    id: string
    kind: 'http' | 'trace' | 'log' | 'resource'
    summary: string
    redacted: true
    provenance: Provenance
  }>
  approval: DemoApproval | null
  action: DemoAction | null
  verification: DemoVerification | null
  audit: DemoAuditEntry[]
  unverifiedClaims: string[]
}
```

The report must never contain credentials, raw authorization headers, request bodies, host usernames, absolute local paths, or claims of live provider execution.
