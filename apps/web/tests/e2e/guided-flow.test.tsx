import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'

import type { DemoSnapshot } from '../../src/contracts/index.ts'
import { GuidedDemoView } from '../../src/pages/GuidedDemoView.tsx'
import { createPreviewDataSource } from './preview-data-source.ts'

const noop = () => undefined

describe('T2 presentation preview flow', () => {
  it('renders every fixture phase through the frozen data-source port', async () => {
    const dataSource = createPreviewDataSource()
    let snapshot = await dataSource.loadInitialSnapshot()

    assertPhase(snapshot, 'incident_open', 'Run read-only triage')

    snapshot = unwrap(
      await dataSource.collectEvidence({
        runId: snapshot.runId,
        incidentId: snapshot.incident.id,
        idempotencyKey: 'preview:collect',
      }),
    )
    assertPhase(snapshot, 'evidence_collected', 'Request simulated restart')

    snapshot = unwrap(
      await dataSource.requestRestart({
        runId: snapshot.runId,
        targetId: snapshot.target.id,
        idempotencyKey: 'preview:request',
      }),
    )
    assertPhase(snapshot, 'approval_pending', 'Approve simulated restart')

    const approvalId = snapshot.approval?.id
    assert(approvalId)
    snapshot = unwrap(
      await dataSource.approveAction({
        runId: snapshot.runId,
        approvalId,
        idempotencyKey: 'preview:approve',
      }),
    )
    assertPhase(snapshot, 'action_confirmed', 'Verify recovery')

    snapshot = unwrap(
      await dataSource.verifyRecovery({
        runId: snapshot.runId,
        targetId: snapshot.target.id,
        idempotencyKey: 'preview:verify',
      }),
    )
    assertPhase(snapshot, 'recovered', 'Inspect redacted report')

    const reportResult = await dataSource.exportEvidence({
      runId: snapshot.runId,
      idempotencyKey: 'preview:export',
    })
    assert(reportResult.ok)
    assert.equal(reportResult.value.after?.targetHealth, 'healthy')
    assert.equal(reportResult.value.mocked, true)
  })
})

function assertPhase(snapshot: DemoSnapshot, expectedPhase: DemoSnapshot['phase'], label: string): void {
  const markup = renderToStaticMarkup(
    <GuidedDemoView
      errorMessage={null}
      notice={null}
      onCloseReport={noop}
      onDownloadReport={noop}
      onExport={noop}
      onPrimaryAction={noop}
      onReset={noop}
      pendingCommand={null}
      report={null}
      snapshot={snapshot}
    />,
  )

  assert.equal(snapshot.phase, expectedPhase)
  assert.match(markup, new RegExp(label))
  assert.match(markup, /Fixture Demo/)
}

function unwrap<T>(result: Awaited<ReturnType<DemoDataSourceMethod<T>>>): T {
  if (!result.ok) {
    throw new Error(`Preview data source returned ${result.error.code}.`)
  }

  return result.value
}

type DemoDataSourceMethod<T> = () => Promise<
  | { readonly ok: true; readonly value: T; readonly replayed: boolean }
  | {
      readonly ok: false
      readonly snapshot: DemoSnapshot
      readonly error: { readonly code: string }
    }
>
