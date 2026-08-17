import type {
  DemoEvidenceReport,
  DemoSnapshot,
} from '../../../packages/contracts/src/index.ts'
import {
  createInitialFixtureSnapshot,
  FIXTURE_ACTION,
  FIXTURE_APPROVAL_GRANTED,
  FIXTURE_APPROVAL_PENDING,
  FIXTURE_AUDIT,
  FIXTURE_EVIDENCE,
  FIXTURE_REPORT_GENERATED_AT,
  FIXTURE_UNVERIFIED_CLAIMS,
  FIXTURE_VERIFICATION,
} from './golden-path.ts'

/** Pure fixture transition from an open incident to collected evidence. */
export const collectFixtureEvidence = (
  snapshot: DemoSnapshot,
): DemoSnapshot => {
  const evidenceIds = FIXTURE_EVIDENCE.map(({ id }) => id)

  return {
    ...snapshot,
    phase: 'evidence_collected',
    incident: {
      ...snapshot.incident,
      status: 'investigating',
      evidenceIds,
    },
    workflow: {
      ...snapshot.workflow,
      status: 'completed',
      summary: '固定样例证据定位到一个临时运行时故障锁。',
      evidenceIds,
    },
    evidence: FIXTURE_EVIDENCE,
    audit: [...snapshot.audit, FIXTURE_AUDIT.evidenceCollected],
  }
}

/** Creates a pending approval without performing an external action. */
export const requestFixtureRestart = (
  snapshot: DemoSnapshot,
): DemoSnapshot => ({
  ...snapshot,
  phase: 'approval_pending',
  approval: FIXTURE_APPROVAL_PENDING,
  audit: [...snapshot.audit, FIXTURE_AUDIT.approvalRequested],
})

/** Grants approval and confirms only the simulated fixture action. */
export const approveFixtureRestart = (
  snapshot: DemoSnapshot,
): DemoSnapshot => ({
  ...snapshot,
  phase: 'action_confirmed',
  approval: FIXTURE_APPROVAL_GRANTED,
  action: FIXTURE_ACTION,
  audit: [
    ...snapshot.audit,
    FIXTURE_AUDIT.approvalGranted,
    FIXTURE_AUDIT.actionConfirmed,
  ],
})

/** Records fixture recovery verification and marks the incident recovered. */
export const verifyFixtureRecovery = (
  snapshot: DemoSnapshot,
): DemoSnapshot => ({
  ...snapshot,
  phase: 'recovered',
  target: { ...snapshot.target, health: 'healthy' },
  incident: { ...snapshot.incident, status: 'recovered' },
  verification: FIXTURE_VERIFICATION,
  audit: [...snapshot.audit, FIXTURE_AUDIT.recoveryVerified],
})

export const resetFixtureDemo = (): DemoSnapshot =>
  createInitialFixtureSnapshot()

/** Builds a redacted in-memory artifact without reading or writing local files. */
export const exportFixtureEvidence = (
  snapshot: DemoSnapshot,
): DemoEvidenceReport => ({
  schemaVersion: 1,
  runId: snapshot.runId,
  mode: 'fixture',
  mocked: true,
  generatedAt: FIXTURE_REPORT_GENERATED_AT[snapshot.phase],
  before: {
    targetHealth: 'degraded',
    incidentStatus: 'open',
  },
  after:
    snapshot.phase === 'recovered'
      ? {
          targetHealth: 'healthy',
          incidentStatus: 'recovered',
        }
      : null,
  evidence: snapshot.evidence,
  approval: snapshot.approval,
  action: snapshot.action,
  verification: snapshot.verification,
  audit: snapshot.audit,
  unverifiedClaims: FIXTURE_UNVERIFIED_CLAIMS,
})
