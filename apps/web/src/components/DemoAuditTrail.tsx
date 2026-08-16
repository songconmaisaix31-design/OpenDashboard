import type { DemoAuditEntry, DemoAuditEvent } from '../contracts/index.ts'
import { DemoBadge } from './DemoBadge.tsx'
import { formatAuditActor, formatUtcTime } from './format.ts'

const auditLabels: Readonly<Record<DemoAuditEvent, string>> = {
  'action.confirmed': '模拟操作已确认',
  'approval.granted': '审批已通过',
  'approval.requested': '审批已申请',
  'evidence.collected': '证据已收集',
  'recovery.verified': '恢复已验证',
}

interface DemoAuditTrailProps {
  readonly entries: readonly DemoAuditEntry[]
}

export function DemoAuditTrail({ entries }: DemoAuditTrailProps) {
  return (
    <section aria-labelledby="audit-heading" className="panel panel--audit">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">按序运行记录</p>
          <h2 id="audit-heading">审计轨迹</h2>
        </div>
        <DemoBadge label={`${entries.length} 个事件`} tone="neutral" />
      </div>

      {entries.length === 0 ? (
        <div className="audit-empty">
          <span className="status-dot status-dot--neutral" />
          <p>已接受的样例命令会按确定顺序显示在这里。</p>
        </div>
      ) : (
        <ol className="audit-list">
          {entries.map((entry, index) => (
            <li key={entry.id}>
              <span aria-hidden="true" className="audit-list__marker">
                {index + 1}
              </span>
              <div className="audit-list__copy">
                <strong>{auditLabels[entry.event]}</strong>
                <span>
                  {formatAuditActor(entry.actor)} · {formatUtcTime(entry.occurredAt)}
                </span>
              </div>
              <DemoBadge label="模拟" tone="mocked" />
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
