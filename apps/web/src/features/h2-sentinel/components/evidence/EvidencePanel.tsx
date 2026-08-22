import type { H2EvidenceItem } from '../../../../../../../packages/h2-contracts/src/index.ts'
import {
  H2_CLAIM_LABELS,
  formatEvidenceValue,
  formatH2FieldLabel,
  formatH2Timestamp,
} from '../../model/presentation.ts'
import { StatusBadge } from '../common/StatusBadge.tsx'

export interface EvidencePanelProps {
  readonly activeEvidenceId?: string
  readonly evidence: readonly H2EvidenceItem[]
  readonly onLocate?: (evidence: H2EvidenceItem) => void
}

export function EvidencePanel({ activeEvidenceId, evidence, onLocate }: EvidencePanelProps) {
  return (
    <section aria-labelledby="h2-evidence-title" className="h2-panel h2-evidence-panel">
      <div className="h2-panel__heading">
        <div>
          <p className="h2-eyebrow">Evidence first</p>
          <h2 id="h2-evidence-title">证据链</h2>
        </div>
        <span>{evidence.length} 项结构化证据</span>
      </div>
      {evidence.length === 0 ? (
        <p className="h2-inline-empty">当前事件没有可展示的结构化证据，系统不会补写结论。</p>
      ) : (
        <div className="h2-evidence-list">
          {evidence.map((item, index) => (
            <EvidenceCard
              active={item.evidenceId === activeEvidenceId}
              item={item}
              key={item.evidenceId}
              {...(onLocate ? { onLocate } : {})}
              ordinal={index + 1}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function EvidenceCard({
  active,
  item,
  onLocate,
  ordinal,
}: {
  readonly active: boolean
  readonly item: H2EvidenceItem
  readonly onLocate?: (evidence: H2EvidenceItem) => void
  readonly ordinal: number
}) {
  return (
    <article
      className={active ? 'h2-evidence-card is-active' : 'h2-evidence-card'}
      ref={(element) => {
        if (active) {
          element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      }}
    >
      <div className="h2-evidence-card__index">{String(ordinal).padStart(2, '0')}</div>
      <div className="h2-evidence-card__body">
        <div className="h2-evidence-card__meta">
          <StatusBadge tone={item.claimKind === 'calculation' ? 'warning' : 'neutral'}>
            {H2_CLAIM_LABELS[item.claimKind]}
          </StatusBadge>
          <code>{item.evidenceId}</code>
          <span>
            {item.timestamp
              ? formatH2Timestamp(item.timestamp)
              : item.interval
                ? `${formatH2Timestamp(item.interval.startTime)}–${formatH2Timestamp(item.interval.endTime)}`
                : '时间未提供'}
          </span>
        </div>
        <h3>{item.conclusion}</h3>
        <dl className="h2-evidence-card__values">
          <div>
            <dt>变量</dt>
            <dd>{item.variable ? formatH2FieldLabel(item.variable) : '未指定'}</dd>
          </div>
          <div>
            <dt>实际值</dt>
            <dd>{formatEvidenceValue(item.actualValue, item.unit)}</dd>
          </div>
          <div>
            <dt>参照值</dt>
            <dd>{formatEvidenceValue(item.referenceValue, item.unit)}</dd>
          </div>
          <div>
            <dt>来源</dt>
            <dd>{item.source}</dd>
          </div>
        </dl>
        {onLocate ? (
          <div className="h2-evidence-card__locate">
            <button className="h2-text-button" onClick={() => onLocate(item)} type="button">
              {active ? '已定位到趋势图' : '定位到趋势图'}
            </button>
          </div>
        ) : null}
      </div>
    </article>
  )
}
