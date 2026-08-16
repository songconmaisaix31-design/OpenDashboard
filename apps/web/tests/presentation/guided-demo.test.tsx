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

    assert.match(markup, /固定样例演示/)
    assert.match(markup, /模拟证据/)
    assert.match(markup, /实时适配器待开发/)
    assert.match(markup, /已降级/)
    assert.match(markup, /证据收集受到明确控制/)
    assert.match(markup, /运行只读排查/)
  })

  it('shows the approval reference and bounded action copy before approval', () => {
    const markup = renderPhase('approval_pending')

    assert.match(markup, /approval-restart-001/)
    assert.match(markup, /批准模拟重启/)
    assert.match(markup, /不会控制真实进程/)
    assert.match(markup, /待审批/)
  })

  it('shows normalized evidence and ordered audit records after collection', () => {
    const markup = renderPhase('action_confirmed')

    assert.match(markup, />HTTP</)
    assert.match(markup, />追踪</)
    assert.match(markup, />日志</)
    assert.match(markup, />资源</)
    assert.match(markup, /模拟操作已确认/)
    assert.match(markup, /4 个事件/)
    assert.match(markup, /验证恢复结果/)
  })

  it('renders the redacted report as an inspectable local artifact', () => {
    const snapshot = PRESENTATION_SNAPSHOTS.recovered
    const report = createPresentationReport(snapshot)
    const markup = renderPhase('recovered', report)

    assert.match(markup, /健康 \/ 已恢复/)
    assert.match(markup, /脱敏证据报告/)
    assert.match(markup, /查看机器可读产物/)
    assert.match(markup, /下载脱敏 JSON/)
    assert.match(markup, /尚未验证实时提供器执行/)
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
