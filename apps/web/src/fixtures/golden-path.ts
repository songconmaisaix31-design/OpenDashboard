import type {
  DemoAction,
  DemoApproval,
  DemoAuditEntry,
  DemoEvidence,
  DemoPhase,
  DemoProviderHealth,
  DemoSnapshot,
  DemoVerification,
  FixtureProvenance,
} from '../contracts/index.ts'

export const FIXTURE_IDS = {
  run: 'run-demo-001',
  target: 'target-order-api',
  incident: 'incident-api-error-burst-001',
  approval: 'approval-restart-001',
} as const

export const FIXTURE_TIMESTAMPS = {
  observed: '2026-08-16T10:20:00.000Z',
  evidenceCollected: '2026-08-16T10:20:01.000Z',
  approvalRequested: '2026-08-16T10:20:02.000Z',
  approvalGranted: '2026-08-16T10:20:03.000Z',
  actionConfirmed: '2026-08-16T10:20:04.000Z',
  recoveryVerified: '2026-08-16T10:20:05.000Z',
} as const

const fixtureProvenance = (
  source: string,
  limitation: string,
): FixtureProvenance => ({
  source,
  mode: 'fixture',
  mocked: true,
  observedAt: FIXTURE_TIMESTAMPS.observed,
  limitations: [limitation],
})

const providerDefinitions = [
  ['cordis', 'Fixture composition only; no Cordis runtime is connected.'],
  ['localops', 'Restart behavior is simulated; no process is controlled.'],
  [
    'agent-usage-manager',
    'Resource observations are fixed fixture values, not host telemetry.',
  ],
  ['fastapi-radar', 'Trace and exception evidence is bundled fixture data.'],
  ['hardware', 'Hardware telemetry is not collected in the competition build.'],
  ['orca', 'No Orca workspace or session data is read by this fixture.'],
  ['agentteams', 'The triage workflow is simulated and read-only.'],
] as const

export const FIXTURE_PROVIDER_HEALTH: readonly DemoProviderHealth[] =
  providerDefinitions.map(([id, limitation]) => ({
    id,
    status: 'mocked',
    provenance: fixtureProvenance(id, limitation),
  }))

export const FIXTURE_EVIDENCE: readonly DemoEvidence[] = [
  {
    id: 'evidence-http-001',
    kind: 'http',
    summary: 'POST /orders returned a redacted HTTP 500 response.',
    redacted: true,
    provenance: fixtureProvenance(
      'cordis',
      'The HTTP observation is bundled fixture data; no request was sent.',
    ),
  },
  {
    id: 'evidence-trace-001',
    kind: 'trace',
    summary: 'The fixture trace links the request to the order-api incident.',
    redacted: true,
    provenance: fixtureProvenance(
      'fastapi-radar',
      'The trace is illustrative fixture data, not a live capture.',
    ),
  },
  {
    id: 'evidence-log-001',
    kind: 'log',
    summary: 'A redacted fixture log records the transient runtime latch.',
    redacted: true,
    provenance: fixtureProvenance(
      'fastapi-radar',
      'The log is bundled and contains no host or request identifiers.',
    ),
  },
  {
    id: 'evidence-resource-001',
    kind: 'resource',
    summary: 'Fixture resource usage remains within the demo threshold.',
    redacted: true,
    provenance: fixtureProvenance(
      'agent-usage-manager',
      'The resource values are fixed and do not inspect the local machine.',
    ),
  },
]

export const FIXTURE_APPROVAL_PENDING: DemoApproval = {
  id: FIXTURE_IDS.approval,
  targetId: FIXTURE_IDS.target,
  action: 'simulated-managed-runtime-restart',
  status: 'pending',
  requestedAt: FIXTURE_TIMESTAMPS.approvalRequested,
  grantedAt: null,
  provenance: fixtureProvenance(
    'localops',
    'Approval applies only to a fixture-owned transient latch.',
  ),
}

export const FIXTURE_APPROVAL_GRANTED: DemoApproval = {
  ...FIXTURE_APPROVAL_PENDING,
  status: 'granted',
  grantedAt: FIXTURE_TIMESTAMPS.approvalGranted,
}

export const FIXTURE_ACTION: DemoAction = {
  id: 'action-restart-001',
  approvalId: FIXTURE_IDS.approval,
  targetId: FIXTURE_IDS.target,
  action: 'managed-runtime-restart',
  executionMode: 'simulated',
  status: 'confirmed',
  confirmedAt: FIXTURE_TIMESTAMPS.actionConfirmed,
  provenance: fixtureProvenance(
    'localops',
    'No real process was restarted; only the fixture latch was cleared.',
  ),
}

export const FIXTURE_VERIFICATION: DemoVerification = {
  id: 'verification-recovery-001',
  targetId: FIXTURE_IDS.target,
  status: 'passed',
  verifiedAt: FIXTURE_TIMESTAMPS.recoveryVerified,
  provenance: fixtureProvenance(
    'open-dashboard-fixture',
    'Recovery verifies deterministic fixture state only.',
  ),
}

const auditEntry = (
  id: string,
  event: DemoAuditEntry['event'],
  occurredAt: string,
  actor: DemoAuditEntry['actor'],
): DemoAuditEntry => ({
  id,
  event,
  occurredAt,
  actor,
  mocked: true,
  provenance: fixtureProvenance(
    'open-dashboard-fixture',
    'This audit entry records a deterministic simulated event.',
  ),
})

export const FIXTURE_AUDIT = {
  evidenceCollected: auditEntry(
    'audit-001',
    'evidence.collected',
    FIXTURE_TIMESTAMPS.evidenceCollected,
    'fixture-provider',
  ),
  approvalRequested: auditEntry(
    'audit-002',
    'approval.requested',
    FIXTURE_TIMESTAMPS.approvalRequested,
    'demo-user',
  ),
  approvalGranted: auditEntry(
    'audit-003',
    'approval.granted',
    FIXTURE_TIMESTAMPS.approvalGranted,
    'demo-user',
  ),
  actionConfirmed: auditEntry(
    'audit-004',
    'action.confirmed',
    FIXTURE_TIMESTAMPS.actionConfirmed,
    'fixture-provider',
  ),
  recoveryVerified: auditEntry(
    'audit-005',
    'recovery.verified',
    FIXTURE_TIMESTAMPS.recoveryVerified,
    'fixture-provider',
  ),
} as const

export const FIXTURE_REPORT_GENERATED_AT: Readonly<Record<DemoPhase, string>> = {
  incident_open: '2026-08-16T10:20:00.500Z',
  evidence_collected: '2026-08-16T10:20:01.500Z',
  approval_pending: '2026-08-16T10:20:02.500Z',
  action_confirmed: '2026-08-16T10:20:04.500Z',
  recovered: '2026-08-16T10:20:06.000Z',
}

export const FIXTURE_UNVERIFIED_CLAIMS = [
  'No live provider execution was verified.',
  'No real process restart was performed.',
] as const

/** Creates the only mutable run boundary; all observations remain fixture data. */
export const createInitialFixtureSnapshot = (): DemoSnapshot => ({
  schemaVersion: 1,
  runId: FIXTURE_IDS.run,
  phase: 'incident_open',
  target: {
    id: FIXTURE_IDS.target,
    name: 'order-api',
    kind: 'application',
    health: 'degraded',
    versionControl: 'git',
    provenance: fixtureProvenance(
      'cordis',
      'The target is declared by the fixture; no service was discovered.',
    ),
  },
  incident: {
    id: FIXTURE_IDS.incident,
    targetId: FIXTURE_IDS.target,
    ruleId: 'api-error-burst',
    status: 'open',
    severity: 'high',
    fingerprint: 'fixture-api-error-burst-v1',
    evidenceIds: [],
    provenance: fixtureProvenance(
      'fastapi-radar',
      'The incident is deterministic and not derived from a live exception.',
    ),
  },
  workflow: {
    id: 'api-500-triage',
    access: 'read-only',
    status: 'ready',
    summary: null,
    evidenceIds: [],
    provenance: fixtureProvenance(
      'agentteams',
      'The workflow is a fixture transition, not an agent execution.',
    ),
  },
  providerHealth: FIXTURE_PROVIDER_HEALTH,
  evidence: [],
  approval: null,
  action: null,
  verification: null,
  audit: [],
})
