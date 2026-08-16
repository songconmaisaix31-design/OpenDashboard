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
        Skip to demo workspace
      </a>

      <header className="demo-header">
        <div className="demo-header__brand">
          <span aria-hidden="true" className="brand-mark">
            OD
          </span>
          <div>
            <strong>OpenDashboard</strong>
            <span>Incident response cockpit</span>
          </div>
        </div>
        <div className="demo-header__trust">
          <DemoBadge label="Fixture Demo" tone="fixture" />
          <DemoBadge label="Mocked evidence" tone="mocked" />
          <DemoBadge label="Live adapters planned" tone="planned" />
        </div>
      </header>

      <main className="demo-workspace" id="demo-workspace">
        <section className="demo-hero">
          <div className="demo-hero__copy">
            <p className="eyebrow">90-second guided response · Run {snapshot.runId}</p>
            <h1>Trace the failure. Approve the recovery.</h1>
            <p>
              Follow one deterministic incident from a degraded API to verified recovery, with the
              trust boundary visible at every step.
            </p>
          </div>
          <div className="target-card">
            <div className="target-card__topline">
              <span>Application</span>
              <DemoBadge label={snapshot.target.health} tone={targetTone} />
            </div>
            <strong>{snapshot.target.name}</strong>
            <div className="target-card__meta">
              <span>{snapshot.incident.ruleId}</span>
              <span>{snapshot.incident.status}</span>
            </div>
            <div className="badge-row">
              <DemoBadge label="Fixture" tone="fixture" />
              <DemoBadge label="Mocked" tone="mocked" />
              <DemoBadge label={snapshot.incident.severity} tone="degraded" />
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
          <span>Fixture mode is the only enabled P0 data source.</span>
          <span>No network requests · No real process control · No secret access</span>
        </footer>
      </main>
    </div>
  )
}
