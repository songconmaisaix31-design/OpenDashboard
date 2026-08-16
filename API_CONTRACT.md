# OpenDashboard Demo Contract

Status: v0.1 planning contract  
Transport: in-process for the competition build; no network API is required

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

interface Provenance {
  source: string
  mode: DemoMode
  mocked: boolean
  observedAt: string
  limitations: string[]
}

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
}

interface DemoSnapshot {
  schemaVersion: 1
  runId: string
  phase: DemoPhase
  target: DemoTarget
  incident: DemoIncident
  providerHealth: Array<{
    id: string
    status: 'mocked' | 'degraded' | 'planned'
    provenance: Provenance
  }>
  audit: DemoAuditEntry[]
}
```

## Data source port

```ts
interface DemoDataSource {
  loadInitialSnapshot(): Promise<DemoSnapshot>
  collectEvidence(input: { runId: string; incidentId: string }): Promise<DemoSnapshot>
  requestRestart(input: { runId: string; targetId: string }): Promise<DemoSnapshot>
  approveAction(input: { runId: string; approvalId: string }): Promise<DemoSnapshot>
  verifyRecovery(input: { runId: string; targetId: string }): Promise<DemoSnapshot>
  resetDemo(input: { runId: string }): Promise<DemoSnapshot>
  exportEvidence(input: { runId: string }): Promise<DemoEvidenceReport>
}
```

The P0 implementation must expose only `FixtureDataSource`. A future live implementation must satisfy the same port and pass separate security and contract tests.

## Command rules

| Command | Required phase | Result phase | Approval | External side effect |
|---|---|---|---|---|
| `collectEvidence` | `incident_open` | `evidence_collected` | No | None |
| `requestRestart` | `evidence_collected` | `approval_pending` | Creates request | None |
| `approveAction` | `approval_pending` | `action_confirmed` | Required | Simulated only |
| `verifyRecovery` | `action_confirmed` | `recovered` | No | None |
| `resetDemo` | Any | `incident_open` | No | None |
| `exportEvidence` | Any | Unchanged | No | Local artifact only |

Every command accepts a deterministic idempotency key in the implementation. Repeating the same accepted command returns the existing snapshot. Invalid phase transitions return a stable `invalid_demo_transition` error and do not mutate state.

`requestRestart` and `approveAction` operate only on the fixture-owned transient fault latch. They must never be presented as proof of real process ownership, process control, or source-code repair.

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
  audit: DemoAuditEntry[]
  unverifiedClaims: string[]
}
```

The report must never contain credentials, raw authorization headers, request bodies, host usernames, absolute local paths, or claims of live provider execution.
