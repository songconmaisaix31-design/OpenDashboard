import type { DemoAuditEntry, DemoAuditEvent } from '../contracts/index.ts'
import { DemoBadge } from './DemoBadge.tsx'
import { formatUtcTime } from './format.ts'

const auditLabels: Readonly<Record<DemoAuditEvent, string>> = {
  'action.confirmed': 'Simulated action confirmed',
  'approval.granted': 'Approval granted',
  'approval.requested': 'Approval requested',
  'evidence.collected': 'Evidence collected',
  'recovery.verified': 'Recovery verified',
}

interface DemoAuditTrailProps {
  readonly entries: readonly DemoAuditEntry[]
}

export function DemoAuditTrail({ entries }: DemoAuditTrailProps) {
  return (
    <section aria-labelledby="audit-heading" className="panel panel--audit">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">Immutable run record</p>
          <h2 id="audit-heading">Audit trail</h2>
        </div>
        <DemoBadge label={`${entries.length} events`} tone="neutral" />
      </div>

      {entries.length === 0 ? (
        <div className="audit-empty">
          <span className="status-dot status-dot--neutral" />
          <p>Accepted fixture commands will appear here in deterministic order.</p>
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
                  {entry.actor} · {formatUtcTime(entry.occurredAt)}
                </span>
              </div>
              <DemoBadge label="Mocked" tone="mocked" />
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
