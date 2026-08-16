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
  ['cordis', '仅进行固定样例组合；未连接 Cordis 运行时。'],
  ['localops', '重启行为为模拟操作；不会控制任何进程。'],
  [
    'agent-usage-manager',
    '资源观测是固定样例值，不是主机遥测。',
  ],
  ['fastapi-radar', '追踪和异常证据是内置固定样例数据。'],
  ['hardware', '竞赛版本不会采集硬件遥测。'],
  ['orca', '这个固定样例不会读取 Orca 工作区或会话数据。'],
  ['agentteams', '排查流程为只读模拟。'],
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
    summary: 'POST /orders 返回了一条已脱敏的 HTTP 500 响应。',
    redacted: true,
    provenance: fixtureProvenance(
      'cordis',
      'HTTP 观测是内置固定样例数据；没有发送任何请求。',
    ),
  },
  {
    id: 'evidence-trace-001',
    kind: 'trace',
    summary: '固定样例追踪把请求与 order-api 故障关联起来。',
    redacted: true,
    provenance: fixtureProvenance(
      'fastapi-radar',
      '这条追踪是说明性固定样例数据，不是实时采集。',
    ),
  },
  {
    id: 'evidence-log-001',
    kind: 'log',
    summary: '一条脱敏样例日志记录了临时运行时故障锁。',
    redacted: true,
    provenance: fixtureProvenance(
      'fastapi-radar',
      '这条日志已内置，不包含主机或请求标识。',
    ),
  },
  {
    id: 'evidence-resource-001',
    kind: 'resource',
    summary: '固定样例资源使用量保持在演示阈值内。',
    redacted: true,
    provenance: fixtureProvenance(
      'agent-usage-manager',
      '资源数值是固定值，不会检查本机。',
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
    '审批只作用于固定样例持有的临时故障锁。',
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
    '只确认模拟样例操作；没有重启真实进程，健康状态等待后续验证。',
  ),
}

export const FIXTURE_VERIFICATION: DemoVerification = {
  id: 'verification-recovery-001',
  targetId: FIXTURE_IDS.target,
  status: 'passed',
  verifiedAt: FIXTURE_TIMESTAMPS.recoveryVerified,
  provenance: fixtureProvenance(
    'open-dashboard-fixture',
    '恢复只验证可重复的固定样例状态。',
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
    '这条审计记录描述一个可重复的模拟事件。',
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
  '尚未验证任何实时提供器执行。',
  '没有执行真实进程重启。',
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
      '目标由固定样例声明；没有发现任何真实服务。',
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
      '故障是可重复的，不来自实时异常。',
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
      '流程是固定样例状态转换，不是智能体执行。',
    ),
  },
  providerHealth: FIXTURE_PROVIDER_HEALTH,
  evidence: [],
  approval: null,
  action: null,
  verification: null,
  audit: [],
})
