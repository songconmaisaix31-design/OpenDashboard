import type { DemoEvidence, DemoEvidenceKind, DemoWorkflow } from '../contracts/index.ts'
import { DemoBadge } from './DemoBadge.tsx'
import { formatProviderName } from './format.ts'

const evidenceLabels: Readonly<Record<DemoEvidenceKind, string>> = {
  http: 'HTTP',
  trace: 'Trace',
  log: 'Log',
  resource: 'Resource',
}

interface DemoEvidenceGridProps {
  readonly evidence: readonly DemoEvidence[]
  readonly workflow: DemoWorkflow
}

export function DemoEvidenceGrid({ evidence, workflow }: DemoEvidenceGridProps) {
  return (
    <section aria-labelledby="evidence-heading" className="panel panel--evidence">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">Evidence board</p>
          <h2 id="evidence-heading">Normalized signals</h2>
        </div>
        <div className="badge-row">
          <DemoBadge label={workflow.id} tone="neutral" />
          <DemoBadge label="Read-only" tone="fixture" />
        </div>
      </div>

      {evidence.length === 0 ? (
        <div className="evidence-empty">
          <span className="evidence-empty__index">00 / 04</span>
          <div>
            <h3>Evidence is intentionally gated</h3>
            <p>
              Run the read-only triage workflow to collect redacted HTTP, trace, log, and resource
              signals from the fixture.
            </p>
          </div>
        </div>
      ) : (
        <div className="evidence-grid">
          {evidence.map((item, index) => (
            <EvidenceCard evidence={item} index={index} key={item.id} />
          ))}
        </div>
      )}

      <div className="workflow-summary">
        <span className={`status-dot status-dot--${workflow.status === 'completed' ? 'healthy' : 'neutral'}`} />
        <div>
          <strong>{workflow.status === 'completed' ? 'Triage complete' : 'Triage ready'}</strong>
          <span>{workflow.summary ?? 'No evidence has been collected for this fixture run.'}</span>
        </div>
      </div>
    </section>
  )
}

interface EvidenceCardProps {
  readonly evidence: DemoEvidence
  readonly index: number
}

function EvidenceCard({ evidence, index }: EvidenceCardProps) {
  const limitationTitle = evidence.provenance.limitations.join(' ')

  return (
    <article className="evidence-card">
      <div className="evidence-card__topline">
        <span className="evidence-card__index">0{index + 1}</span>
        <span className={`evidence-kind evidence-kind--${evidence.kind}`}>
          {evidenceLabels[evidence.kind]}
        </span>
      </div>
      <p>{evidence.summary}</p>
      <div className="evidence-card__source">
        <span>Source</span>
        <strong>{formatProviderName(evidence.provenance.source)}</strong>
      </div>
      <div className="badge-row">
        <DemoBadge
          label={evidence.provenance.mode === 'fixture' ? 'Fixture' : 'Live'}
          tone={evidence.provenance.mode === 'fixture' ? 'fixture' : 'healthy'}
          title={limitationTitle}
        />
        {evidence.provenance.mocked ? <DemoBadge label="Mocked" tone="mocked" /> : null}
        <DemoBadge label="Redacted" tone="neutral" />
      </div>
    </article>
  )
}
