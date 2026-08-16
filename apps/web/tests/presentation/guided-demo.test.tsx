import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'

import type { DemoEvidenceReport, DemoPhase } from '../../src/contracts/index.ts'
import { GuidedDemoView } from '../../src/pages/GuidedDemoView.tsx'
import { createPresentationReport, PRESENTATION_SNAPSHOTS } from './snapshots.ts'

const noop = () => undefined

describe('GuidedDemoView', () => {
  it('keeps fixture provenance and planned live adapters visible at the initial phase', () => {
    const markup = renderPhase('incident_open')

    assert.match(markup, /Fixture Demo/)
    assert.match(markup, /Mocked evidence/)
    assert.match(markup, /Live adapters planned/)
    assert.match(markup, /degraded/)
    assert.match(markup, /Evidence is intentionally gated/)
    assert.match(markup, /Run read-only triage/)
  })

  it('shows the approval reference and bounded action copy before approval', () => {
    const markup = renderPhase('approval_pending')

    assert.match(markup, /approval-restart-001/)
    assert.match(markup, /Approve simulated restart/)
    assert.match(markup, /does not control a real process/)
    assert.match(markup, /Pending/)
  })

  it('shows normalized evidence and immutable audit records after collection', () => {
    const markup = renderPhase('action_confirmed')

    assert.match(markup, />HTTP</)
    assert.match(markup, />Trace</)
    assert.match(markup, />Log</)
    assert.match(markup, />Resource</)
    assert.match(markup, /Simulated action confirmed/)
    assert.match(markup, /4 events/)
    assert.match(markup, /Verify recovery/)
  })

  it('renders the redacted report as an inspectable local artifact', () => {
    const snapshot = PRESENTATION_SNAPSHOTS.recovered
    const report = createPresentationReport(snapshot)
    const markup = renderPhase('recovered', report)

    assert.match(markup, /Healthy \/ Recovered/)
    assert.match(markup, /Redacted evidence report/)
    assert.match(markup, /Inspect machine-readable artifact/)
    assert.match(markup, /Download redacted JSON/)
    assert.match(markup, /Live provider execution is not verified/)
  })
})

function renderPhase(phase: DemoPhase, report: DemoEvidenceReport | null = null): string {
  return renderToStaticMarkup(
    <GuidedDemoView
      errorMessage={null}
      notice={null}
      onCloseReport={noop}
      onDownloadReport={noop}
      onExport={noop}
      onPrimaryAction={noop}
      onReset={noop}
      pendingCommand={null}
      report={report}
      snapshot={PRESENTATION_SNAPSHOTS[phase]}
    />,
  )
}
