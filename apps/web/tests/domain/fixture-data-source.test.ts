import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type {
  DemoCommandErrorCode,
  DemoCommandResult,
  DemoDataSource,
  DemoSnapshot,
} from '../../src/contracts/index.ts'
import { createFixtureDataSource } from '../../src/demo/index.ts'

type SuccessfulResult<T> = Extract<DemoCommandResult<T>, { readonly ok: true }>
type FailedResult<T> = Extract<DemoCommandResult<T>, { readonly ok: false }>

const expectSuccess = <T>(
  result: DemoCommandResult<T>,
): SuccessfulResult<T> => {
  if (!result.ok) {
    assert.fail(`Expected success, received ${result.error.code}.`)
  }
  return result
}

const expectFailure = <T>(
  result: DemoCommandResult<T>,
  code: DemoCommandErrorCode,
): FailedResult<T> => {
  if (result.ok) {
    assert.fail('Expected the command to fail.')
  }
  assert.equal(result.error.code, code)
  return result
}

const runToRecovered = async (
  dataSource: DemoDataSource,
  keyPrefix: string,
): Promise<DemoSnapshot> => {
  const initial = await dataSource.loadInitialSnapshot()
  const collected = expectSuccess(
    await dataSource.collectEvidence({
      runId: initial.runId,
      incidentId: initial.incident.id,
      idempotencyKey: `${keyPrefix}-collect`,
    }),
  )
  const requested = expectSuccess(
    await dataSource.requestRestart({
      runId: collected.value.runId,
      targetId: collected.value.target.id,
      idempotencyKey: `${keyPrefix}-request`,
    }),
  )
  assert(requested.value.approval)

  const approved = expectSuccess(
    await dataSource.approveAction({
      runId: requested.value.runId,
      approvalId: requested.value.approval.id,
      idempotencyKey: `${keyPrefix}-approve`,
    }),
  )

  return expectSuccess(
    await dataSource.verifyRecovery({
      runId: approved.value.runId,
      targetId: approved.value.target.id,
      idempotencyKey: `${keyPrefix}-verify`,
    }),
  ).value
}

const runToPhase = async (
  dataSource: DemoDataSource,
  phase: DemoSnapshot['phase'],
  keyPrefix: string,
): Promise<DemoSnapshot> => {
  let snapshot = await dataSource.loadInitialSnapshot()
  if (phase === 'incident_open') return snapshot

  snapshot = expectSuccess(
    await dataSource.collectEvidence({
      runId: snapshot.runId,
      incidentId: snapshot.incident.id,
      idempotencyKey: `${keyPrefix}-collect`,
    }),
  ).value
  if (phase === 'evidence_collected') return snapshot

  snapshot = expectSuccess(
    await dataSource.requestRestart({
      runId: snapshot.runId,
      targetId: snapshot.target.id,
      idempotencyKey: `${keyPrefix}-request`,
    }),
  ).value
  if (phase === 'approval_pending') return snapshot

  assert(snapshot.approval)
  snapshot = expectSuccess(
    await dataSource.approveAction({
      runId: snapshot.runId,
      approvalId: snapshot.approval.id,
      idempotencyKey: `${keyPrefix}-approve`,
    }),
  ).value
  if (phase === 'action_confirmed') return snapshot

  return expectSuccess(
    await dataSource.verifyRecovery({
      runId: snapshot.runId,
      targetId: snapshot.target.id,
      idempotencyKey: `${keyPrefix}-verify`,
    }),
  ).value
}

describe('FixtureDataSource golden path', () => {
  it('runs the deterministic approval-gated incident recovery flow', async () => {
    const dataSource = createFixtureDataSource()
    const initial = await dataSource.loadInitialSnapshot()

    assert.equal(initial.phase, 'incident_open')
    assert.equal(initial.target.health, 'degraded')
    assert.equal(initial.incident.status, 'open')
    assert.equal(initial.evidence.length, 0)
    assert.equal(initial.audit.length, 0)
    assert(
      initial.providerHealth.every(
        ({ status, provenance }) =>
          status === 'mocked' &&
          provenance.mode === 'fixture' &&
          provenance.mocked,
      ),
    )

    const collected = expectSuccess(
      await dataSource.collectEvidence({
        runId: initial.runId,
        incidentId: initial.incident.id,
        idempotencyKey: 'golden-collect',
      }),
    )
    assert.equal(collected.replayed, false)
    assert.equal(collected.value.phase, 'evidence_collected')
    assert.equal(collected.value.incident.status, 'investigating')
    assert.deepEqual(
      collected.value.evidence.map(({ kind }) => kind),
      ['http', 'trace', 'log', 'resource'],
    )
    assert.deepEqual(
      collected.value.audit.map(({ event }) => event),
      ['evidence.collected'],
    )

    const requested = expectSuccess(
      await dataSource.requestRestart({
        runId: collected.value.runId,
        targetId: collected.value.target.id,
        idempotencyKey: 'golden-request',
      }),
    )
    assert.equal(requested.value.phase, 'approval_pending')
    assert.equal(requested.value.approval?.status, 'pending')
    assert.equal(requested.value.action, null)

    assert(requested.value.approval)
    const approved = expectSuccess(
      await dataSource.approveAction({
        runId: requested.value.runId,
        approvalId: requested.value.approval.id,
        idempotencyKey: 'golden-approve',
      }),
    )
    assert.equal(approved.value.phase, 'action_confirmed')
    assert.equal(approved.value.approval?.status, 'granted')
    assert.equal(approved.value.action?.executionMode, 'simulated')
    assert.equal(approved.value.target.health, 'degraded')
    assert.match(
      approved.value.action?.provenance.limitations.join(' ') ?? '',
      /健康状态等待后续验证/,
    )
    assert.doesNotMatch(
      approved.value.action?.provenance.limitations.join(' ') ?? '',
      /清除/,
    )

    const recovered = expectSuccess(
      await dataSource.verifyRecovery({
        runId: approved.value.runId,
        targetId: approved.value.target.id,
        idempotencyKey: 'golden-verify',
      }),
    )
    assert.equal(recovered.value.phase, 'recovered')
    assert.equal(recovered.value.target.health, 'healthy')
    assert.equal(recovered.value.incident.status, 'recovered')
    assert.equal(recovered.value.verification?.status, 'passed')
    assert.deepEqual(
      recovered.value.audit.map(({ event }) => event),
      [
        'evidence.collected',
        'approval.requested',
        'approval.granted',
        'action.confirmed',
        'recovery.verified',
      ],
    )

    const exported = expectSuccess(
      await dataSource.exportEvidence({
        runId: recovered.value.runId,
        idempotencyKey: 'golden-export',
      }),
    )
    assert.equal(exported.value.mode, 'fixture')
    assert.equal(exported.value.mocked, true)
    assert.deepEqual(exported.value.after, {
      targetHealth: 'healthy',
      incidentStatus: 'recovered',
    })
    assert.equal(exported.value.evidence.length, 4)
    assert.equal(exported.value.audit.length, 5)
    assert.equal(exported.value.action?.executionMode, 'simulated')
    assert(
      exported.value.evidence.every(
        ({ redacted, provenance }) =>
          redacted && provenance.mode === 'fixture' && provenance.mocked,
      ),
    )
    assert(
      exported.value.audit.every(
        ({ mocked, provenance }) =>
          mocked && provenance.mode === 'fixture' && provenance.mocked,
      ),
    )
    assert.deepEqual(exported.value.unverifiedClaims, [
      '尚未验证任何实时提供器执行。',
      '没有执行真实进程重启。',
    ])

    const serializedReport = JSON.stringify(exported.value)
    for (const forbiddenField of [
      'authorization',
      'requestBody',
      'hostUsername',
      'absolutePath',
    ]) {
      assert.equal(serializedReport.includes(forbiddenField), false)
    }
  })

  it('produces identical snapshots and reports across isolated instances', async () => {
    const firstDataSource = createFixtureDataSource()
    const secondDataSource = createFixtureDataSource()
    const firstRecovered = await runToRecovered(firstDataSource, 'deterministic')
    const secondRecovered = await runToRecovered(secondDataSource, 'deterministic')

    assert.deepEqual(secondRecovered, firstRecovered)

    const firstReport = expectSuccess(
      await firstDataSource.exportEvidence({
        runId: firstRecovered.runId,
        idempotencyKey: 'deterministic-export',
      }),
    )
    const secondReport = expectSuccess(
      await secondDataSource.exportEvidence({
        runId: secondRecovered.runId,
        idempotencyKey: 'deterministic-export',
      }),
    )
    assert.deepEqual(secondReport.value, firstReport.value)
  })
})

describe('FixtureDataSource command safety', () => {
  it('rejects invalid references and transitions without mutating state', async () => {
    const dataSource = createFixtureDataSource()
    const initial = await dataSource.loadInitialSnapshot()

    const invalidReference = expectFailure(
      await dataSource.collectEvidence({
        runId: initial.runId,
        incidentId: 'incident-unknown',
        idempotencyKey: 'invalid-reference',
      }),
      'invalid_demo_reference',
    )
    assert.deepEqual(invalidReference.snapshot, initial)

    const invalidTransition = expectFailure(
      await dataSource.requestRestart({
        runId: initial.runId,
        targetId: initial.target.id,
        idempotencyKey: 'retryable-request',
      }),
      'invalid_demo_transition',
    )
    assert.deepEqual(invalidTransition.snapshot, initial)
    assert.deepEqual(await dataSource.loadInitialSnapshot(), initial)

    const collected = expectSuccess(
      await dataSource.collectEvidence({
        runId: initial.runId,
        incidentId: initial.incident.id,
        idempotencyKey: 'valid-collect',
      }),
    )
    const retried = expectSuccess(
      await dataSource.requestRestart({
        runId: collected.value.runId,
        targetId: collected.value.target.id,
        idempotencyKey: 'retryable-request',
      }),
    )
    assert.equal(retried.value.phase, 'approval_pending')
  })

  it('replays accepted input and rejects conflicting key reuse', async () => {
    const dataSource = createFixtureDataSource()
    const initial = await dataSource.loadInitialSnapshot()
    const input = {
      runId: initial.runId,
      incidentId: initial.incident.id,
      idempotencyKey: 'shared-key',
    }

    const first = expectSuccess(await dataSource.collectEvidence(input))
    const replay = expectSuccess(await dataSource.collectEvidence(input))
    assert.equal(first.replayed, false)
    assert.equal(replay.replayed, true)
    assert.deepEqual(replay.value, first.value)

    const conflict = expectFailure(
      await dataSource.requestRestart({
        runId: initial.runId,
        targetId: initial.target.id,
        idempotencyKey: 'shared-key',
      }),
      'idempotency_conflict',
    )
    assert.equal(conflict.snapshot.phase, 'evidence_collected')
    assert.deepEqual(
      conflict.snapshot.audit.map(({ event }) => event),
      ['evidence.collected'],
    )

    const changedInputConflict = expectFailure(
      await dataSource.collectEvidence({
        runId: initial.runId,
        incidentId: 'incident-unknown',
        idempotencyKey: 'shared-key',
      }),
      'idempotency_conflict',
    )
    assert.equal(changedInputConflict.snapshot.phase, 'evidence_collected')
  })

  it('returns detached values so consumers cannot mutate engine state', async () => {
    const dataSource = createFixtureDataSource()
    const first = await dataSource.loadInitialSnapshot()
    const mutableAudit = first.audit as DemoSnapshot['audit'][number][]
    mutableAudit.push({
      id: 'consumer-mutation',
      event: 'evidence.collected',
      occurredAt: '2000-01-01T00:00:00.000Z',
      actor: 'demo-user',
      mocked: true,
      provenance: {
        source: 'consumer',
        mode: 'fixture',
        mocked: true,
        observedAt: '2000-01-01T00:00:00.000Z',
        limitations: [],
      },
    })

    const second = await dataSource.loadInitialSnapshot()
    assert.equal(second.audit.length, 0)
  })
})

describe('FixtureDataSource reset and evidence export', () => {
  it('resets every phase to the same clean initial fixture state', async () => {
    const phases: readonly DemoSnapshot['phase'][] = [
      'incident_open',
      'evidence_collected',
      'approval_pending',
      'action_confirmed',
      'recovered',
    ]

    for (const phase of phases) {
      const dataSource = createFixtureDataSource()
      const snapshot = await runToPhase(dataSource, phase, `reset-${phase}`)
      const resetInput = {
        runId: snapshot.runId,
        idempotencyKey: `reset-from-${phase}`,
      }
      const reset = expectSuccess(await dataSource.resetDemo(resetInput))

      assert.equal(reset.value.phase, 'incident_open')
      assert.equal(reset.value.target.health, 'degraded')
      assert.equal(reset.value.incident.status, 'open')
      assert.equal(reset.value.evidence.length, 0)
      assert.equal(reset.value.approval, null)
      assert.equal(reset.value.action, null)
      assert.equal(reset.value.verification, null)
      assert.equal(reset.value.audit.length, 0)

      const replay = expectSuccess(await dataSource.resetDemo(resetInput))
      assert.equal(replay.replayed, true)
      assert.deepEqual(replay.value, reset.value)

      const rerun = expectSuccess(
        await dataSource.collectEvidence({
          runId: reset.value.runId,
          incidentId: reset.value.incident.id,
          idempotencyKey: `rerun-after-${phase}`,
        }),
      )
      assert.equal(rerun.value.phase, 'evidence_collected')
    }
  })

  it('exports an explicitly incomplete report before recovery', async () => {
    const dataSource = createFixtureDataSource()
    const initial = await dataSource.loadInitialSnapshot()
    const exported = expectSuccess(
      await dataSource.exportEvidence({
        runId: initial.runId,
        idempotencyKey: 'initial-export',
      }),
    )

    assert.equal(exported.value.after, null)
    assert.equal(exported.value.evidence.length, 0)
    assert.equal(exported.value.approval, null)
    assert.equal(exported.value.action, null)
    assert.equal(exported.value.verification, null)

    const replay = expectSuccess(
      await dataSource.exportEvidence({
        runId: initial.runId,
        idempotencyKey: 'initial-export',
      }),
    )
    assert.equal(replay.replayed, true)
    assert.deepEqual(replay.value, exported.value)
  })
})
