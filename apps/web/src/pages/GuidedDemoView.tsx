import type {
  DemoCommandName,
  DemoEvidenceReport,
  DemoSnapshot,
} from '../contracts/index.ts'
import {
  DemoAuditTrail,
  DemoBadge,
  DemoDecisionPanel,
  DemoEvidenceGrid,
  DemoEvidenceReportPanel,
  DemoPhaseRail,
  DemoProviderStrip,
} from '../components/index.ts'
import { formatHealth, formatIncidentStatus } from '../components/format.ts'
import { getPrimaryAction } from './presentation.ts'

export interface GuidedDemoViewProps {
  readonly snapshot: DemoSnapshot
  readonly pendingCommand: DemoCommandName | 'loadInitialSnapshot' | null
  readonly errorMessage: string | null
  readonly notice: string | null
  readonly report: DemoEvidenceReport | null
  readonly onCloseReport: () => void
  readonly onDownloadReport: () => void
  readonly onExport: () => void
  readonly onPrimaryAction: () => void
  readonly onReset: () => void
}

export function GuidedDemoView({
  snapshot,
  pendingCommand,
  errorMessage,
  notice,
  report,
  onCloseReport,
  onDownloadReport,
  onExport,
  onPrimaryAction,
  onReset,
}: GuidedDemoViewProps) {
  const primaryAction = getPrimaryAction(snapshot.phase)
  const targetTone = snapshot.target.health === 'healthy' ? 'healthy' : 'degraded'

  return (
    <div className="demo-app">
      <a className="skip-link" href="#demo-workspace">
        跳到演示工作区
      </a>

      <header className="demo-header">
        <div className="demo-header__brand">
          <span aria-hidden="true" className="brand-mark">
            OD
          </span>
          <div>
            <strong>OpenDashboard</strong>
            <span>故障响应控制台</span>
          </div>
        </div>
        <div className="demo-header__trust">
          <DemoBadge label="固定样例演示" tone="fixture" />
          <DemoBadge label="模拟证据" tone="mocked" />
          <DemoBadge label="实时适配器待开发" tone="planned" />
        </div>
      </header>

      <main className="demo-workspace" id="demo-workspace">
        <section className="demo-hero">
          <div className="demo-hero__copy">
            <p className="eyebrow">90 秒引导式响应 · 运行 {snapshot.runId}</p>
            <h1>定位故障，审批恢复。</h1>
            <p>
              沿着一个可重复的故障，从 API 降级走到已验证恢复；每一步都清楚展示可信边界。
            </p>
          </div>
          <div className="target-card">
            <div className="target-card__topline">
              <span>应用</span>
              <DemoBadge label={formatHealth(snapshot.target.health)} tone={targetTone} />
            </div>
            <strong>{snapshot.target.name}</strong>
            <div className="target-card__meta">
              <span>{snapshot.incident.ruleId}</span>
              <span>{formatIncidentStatus(snapshot.incident.status)}</span>
            </div>
            <div className="badge-row">
              <DemoBadge label="固定样例" tone="fixture" />
              <DemoBadge label="模拟" tone="mocked" />
              <DemoBadge label="高危" tone="degraded" />
            </div>
          </div>
        </section>

        <DemoPhaseRail phase={snapshot.phase} />

        <div aria-atomic="true" aria-live="polite" className="message-stack">
          {errorMessage ? <p className="message message--error">{errorMessage}</p> : null}
          {notice ? <p className="message message--notice">{notice}</p> : null}
        </div>

        <div className="demo-grid">
          <DemoEvidenceGrid evidence={snapshot.evidence} workflow={snapshot.workflow} />
          <DemoDecisionPanel
            action={primaryAction}
            onExport={onExport}
            onPrimaryAction={onPrimaryAction}
            onReset={onReset}
            pendingCommand={pendingCommand}
            snapshot={snapshot}
          />
          <DemoAuditTrail entries={snapshot.audit} />
        </div>

        <DemoProviderStrip providers={snapshot.providerHealth} />

        {report ? (
          <DemoEvidenceReportPanel
            onClose={onCloseReport}
            onDownload={onDownloadReport}
            report={report}
          />
        ) : null}

        <footer className="demo-footer">
          <span>P0 仅启用固定样例数据源。</span>
          <span>无外部或提供器请求 · 无真实进程控制 · 不访问机密信息</span>
        </footer>
      </main>
    </div>
  )
}
