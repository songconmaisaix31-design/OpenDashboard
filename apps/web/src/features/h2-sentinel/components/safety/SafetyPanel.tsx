import type { H2AnomalyEvent } from '../../../../../../../packages/h2-contracts/src/index.ts'
import { H2_SAFETY_LABELS } from '../../model/presentation.ts'
import { StatusBadge, type H2BadgeTone } from '../common/StatusBadge.tsx'

const safetyTone = {
  passed: 'positive',
  warning: 'warning',
  failed: 'danger',
  unknown: 'planned',
  not_applicable: 'neutral',
} as const satisfies Readonly<Record<H2AnomalyEvent['safetyChecks'][number]['status'], H2BadgeTone>>

export interface SafetyPanelProps {
  readonly event: H2AnomalyEvent
}

export function SafetyPanel({ event }: SafetyPanelProps) {
  return (
    <section aria-labelledby="h2-safety-title" className="h2-panel h2-safety-panel">
      <div className="h2-panel__heading">
        <div>
          <p className="h2-eyebrow">Human in the loop</p>
          <h2 id="h2-safety-title">安全检查与建议</h2>
        </div>
        <StatusBadge tone="danger">必须人工确认</StatusBadge>
      </div>
      <div className="h2-safety-list">
        {event.safetyChecks.map((check) => (
          <article className="h2-safety-item" key={check.checkId}>
            <StatusBadge tone={safetyTone[check.status]}>{H2_SAFETY_LABELS[check.status]}</StatusBadge>
            <div>
              <h3>{check.title}</h3>
              <p>{check.message}</p>
              <code>{check.constraintId ?? '未关联约束'}</code>
            </div>
          </article>
        ))}
      </div>
      {event.safetyChecks.length === 0 ? (
        <p className="h2-unknown-safety" role="status">安全状态未知：缺少检查结果，不能视为通过。</p>
      ) : null}
      <div className="h2-recommendations">
        {event.recommendations.map((recommendation) => (
          <article key={recommendation.recommendationId}>
            <div>
              <StatusBadge tone="warning">建议</StatusBadge>
              {recommendation.requiresHumanConfirmation ? (
                <StatusBadge tone="danger">需人工确认</StatusBadge>
              ) : null}
              <code>{recommendation.recommendationId}</code>
            </div>
            <h3>{recommendation.summary}</h3>
            <p>{recommendation.rationale}</p>
            <strong>需人工确认后执行；应用不闭环下发，不自动调整设备或设定值。</strong>
          </article>
        ))}
      </div>
      <div className="h2-safety-boundary-callout">
        <strong>安全边界（T14）</strong>
        <span>本应用只做监督诊断与建议，任何建议都需人工确认；它不闭环下发控制指令，不会自动改变调度、设定值或设备状态。</span>
      </div>
    </section>
  )
}
