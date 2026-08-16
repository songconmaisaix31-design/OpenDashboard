import type { DemoEvidence, DemoEvidenceKind, DemoWorkflow } from '../contracts/index.ts'
import { DemoBadge } from './DemoBadge.tsx'
import { formatProviderName } from './format.ts'

const evidenceLabels: Readonly<Record<DemoEvidenceKind, string>> = {
  http: 'HTTP',
  trace: '追踪',
  log: '日志',
  resource: '资源',
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
          <p className="eyebrow">证据面板</p>
          <h2 id="evidence-heading">标准化信号</h2>
        </div>
        <div className="badge-row">
          <DemoBadge label={workflow.id} tone="neutral" />
          <DemoBadge label="只读" tone="fixture" />
        </div>
      </div>

      {evidence.length === 0 ? (
        <div className="evidence-empty">
          <span className="evidence-empty__index">00 / 04</span>
          <div>
            <h3>证据收集受到明确控制</h3>
            <p>
              运行只读排查流程，从固定样例中收集已脱敏的 HTTP、追踪、日志和资源信号。
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
          <strong>{workflow.status === 'completed' ? '排查完成' : '排查就绪'}</strong>
          <span>{workflow.summary ?? '这次固定样例运行尚未收集证据。'}</span>
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
        <span>来源</span>
        <strong>{formatProviderName(evidence.provenance.source)}</strong>
      </div>
      <div className="badge-row">
        <DemoBadge
          label={evidence.provenance.mode === 'fixture' ? '固定样例' : '实时'}
          tone={evidence.provenance.mode === 'fixture' ? 'fixture' : 'healthy'}
          title={limitationTitle}
        />
        {evidence.provenance.mocked ? <DemoBadge label="模拟" tone="mocked" /> : null}
        <DemoBadge label="已脱敏" tone="neutral" />
      </div>
    </article>
  )
}
