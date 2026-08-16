import {
  CONTRACT_EXAMPLE_SNAPSHOT,
  type DemoEvidenceReport,
  type DemoPhase,
  type DemoProviderHealth,
  type DemoSnapshot,
} from '../../src/contracts/index.ts'

const providerHealth: readonly DemoProviderHealth[] = CONTRACT_EXAMPLE_SNAPSHOT.providerHealth.map(
  (provider) => ({
    ...provider,
    status: getPreviewProviderStatus(provider.id),
  }),
)

const degradedTarget: DemoSnapshot['target'] = {
  ...CONTRACT_EXAMPLE_SNAPSHOT.target,
  health: 'degraded',
}

const investigatingIncident: DemoSnapshot['incident'] = {
  ...CONTRACT_EXAMPLE_SNAPSHOT.incident,
  status: 'investigating',
}

/**
 * Presentation-only snapshots derived from T0's read-only contract example.
 * They are not a provider, runtime fixture, or implementation of T1 transitions.
 */
export const PRESENTATION_SNAPSHOTS: Readonly<Record<DemoPhase, DemoSnapshot>> = {
  incident_open: {
    ...CONTRACT_EXAMPLE_SNAPSHOT,
    phase: 'incident_open',
    target: degradedTarget,
    incident: {
      ...CONTRACT_EXAMPLE_SNAPSHOT.incident,
      status: 'open',
      evidenceIds: [],
    },
    workflow: {
      ...CONTRACT_EXAMPLE_SNAPSHOT.workflow,
      status: 'ready',
      summary: null,
      evidenceIds: [],
    },
    providerHealth,
    evidence: [],
    approval: null,
    action: null,
    verification: null,
    audit: [],
  },
  evidence_collected: {
    ...CONTRACT_EXAMPLE_SNAPSHOT,
    phase: 'evidence_collected',
    target: degradedTarget,
    incident: investigatingIncident,
    providerHealth,
    approval: null,
    action: null,
    verification: null,
    audit: CONTRACT_EXAMPLE_SNAPSHOT.audit.slice(0, 1),
  },
  approval_pending: {
    ...CONTRACT_EXAMPLE_SNAPSHOT,
    phase: 'approval_pending',
    target: degradedTarget,
    incident: investigatingIncident,
    providerHealth,
    approval: {
      ...getRecoveredApproval(),
      status: 'pending',
      grantedAt: null,
    },
    action: null,
    verification: null,
    audit: CONTRACT_EXAMPLE_SNAPSHOT.audit.slice(0, 2),
  },
  action_confirmed: {
    ...CONTRACT_EXAMPLE_SNAPSHOT,
    phase: 'action_confirmed',
    target: degradedTarget,
    incident: investigatingIncident,
    providerHealth,
    verification: null,
    audit: CONTRACT_EXAMPLE_SNAPSHOT.audit.slice(0, 4),
  },
  recovered: {
    ...CONTRACT_EXAMPLE_SNAPSHOT,
    providerHealth,
  },
}

export function createPresentationReport(snapshot: DemoSnapshot): DemoEvidenceReport {
  return {
    schemaVersion: 1,
    runId: snapshot.runId,
    mode: 'fixture',
    mocked: true,
    generatedAt: '2026-08-16T10:20:06.000Z',
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
    unverifiedClaims: ['这个固定样例演示尚未验证实时提供器执行。'],
  }
}

function getPreviewProviderStatus(providerId: string): DemoProviderHealth['status'] {
  if (providerId === 'fastapi-radar') {
    return 'degraded'
  }

  if (providerId === 'hardware' || providerId === 'orca' || providerId === 'agentteams') {
    return 'planned'
  }

  return 'mocked'
}

function getRecoveredApproval(): NonNullable<DemoSnapshot['approval']> {
  const approval = CONTRACT_EXAMPLE_SNAPSHOT.approval

  if (!approval) {
    throw new Error('T0 契约示例必须包含已恢复状态的审批记录。')
  }

  return approval
}
