import type { DemoEvidenceReport } from '../contracts/index.ts'
import { DemoBadge } from './DemoBadge.tsx'
import { formatUtcTime } from './format.ts'

interface DemoEvidenceReportPanelProps {
  readonly report: DemoEvidenceReport
  readonly onClose: () => void
  readonly onDownload: () => void
}

export function DemoEvidenceReportPanel({ report, onClose, onDownload }: DemoEvidenceReportPanelProps) {
  return (
    <section aria-labelledby="report-heading" className="report-panel">
      <div className="report-panel__heading">
        <div>
          <p className="eyebrow">Local artifact · JSON</p>
          <h2 id="report-heading">Redacted evidence report</h2>
          <p>Generated at {formatUtcTime(report.generatedAt)} from deterministic fixture state.</p>
        </div>
        <div className="badge-row">
          <DemoBadge label="Fixture" tone="fixture" />
          <DemoBadge label="Mocked" tone="mocked" />
          <DemoBadge label="Redacted" tone="neutral" />
        </div>
      </div>

      <div className="report-metrics">
        <div>
          <span>Before</span>
          <strong>Degraded / Open</strong>
        </div>
        <div>
          <span>After</span>
          <strong>{report.after ? 'Healthy / Recovered' : 'Not verified'}</strong>
        </div>
        <div>
          <span>Evidence</span>
          <strong>{report.evidence.length} redacted items</strong>
        </div>
        <div>
          <span>Audit</span>
          <strong>{report.audit.length} immutable events</strong>
        </div>
      </div>

      {report.unverifiedClaims.length > 0 ? (
        <div className="report-caveat">
          <strong>Unverified claims</strong>
          <ul>
            {report.unverifiedClaims.map((claim) => (
              <li key={claim}>{claim}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <details className="report-json">
        <summary>Inspect machine-readable artifact</summary>
        <pre>{JSON.stringify(report, null, 2)}</pre>
      </details>

      <div className="report-panel__actions">
        <button className="button button--primary" onClick={onDownload} type="button">
          Download redacted JSON
        </button>
        <button className="button button--ghost" onClick={onClose} type="button">
          Close report
        </button>
      </div>
    </section>
  )
}
