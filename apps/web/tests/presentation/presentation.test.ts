import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { DemoPhase } from '../../src/contracts/index.ts'
import {
  createExportIdempotencyKey,
  createIdempotencyKey,
  getCommandErrorMessage,
  getPrimaryAction,
} from '../../src/pages/presentation.ts'

describe('presentation command mapping', () => {
  it('maps every frozen phase to one explicit next command', () => {
    const expected = {
      incident_open: 'collectEvidence',
      evidence_collected: 'requestRestart',
      approval_pending: 'approveAction',
      action_confirmed: 'verifyRecovery',
      recovered: 'exportEvidence',
    } as const satisfies Readonly<Record<DemoPhase, string>>

    for (const phase of Object.keys(expected) as DemoPhase[]) {
      assert.equal(getPrimaryAction(phase).command, expected[phase])
    }
  })

  it('creates deterministic keys that are isolated across reset cycles', () => {
    const first = createIdempotencyKey('run-demo-001', 0, 'collectEvidence')

    assert.equal(first, createIdempotencyKey('run-demo-001', 0, 'collectEvidence'))
    assert.notEqual(first, createIdempotencyKey('run-demo-001', 1, 'collectEvidence'))
    assert.notEqual(first, createIdempotencyKey('run-demo-001', 0, 'requestRestart'))
  })

  it('isolates evidence exports across fixture phases', () => {
    const beforeRecovery = createExportIdempotencyKey('run-demo-001', 0, 'action_confirmed')
    const afterRecovery = createExportIdempotencyKey('run-demo-001', 0, 'recovered')

    assert.equal(
      beforeRecovery,
      createExportIdempotencyKey('run-demo-001', 0, 'action_confirmed'),
    )
    assert.notEqual(beforeRecovery, afterRecovery)
  })

  it('uses bounded UI copy for contract error codes', () => {
    assert.match(getCommandErrorMessage('invalid_demo_transition'), /当前固定样例阶段/)
    assert.match(getCommandErrorMessage('invalid_demo_reference'), /没有应用任何操作/)
    assert.match(getCommandErrorMessage('idempotency_conflict'), /重置固定样例/)
  })
})
