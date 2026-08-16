import type { DemoCommandName, DemoSnapshot } from '../contracts/index.ts'
import type { PrimaryAction } from '../pages/presentation.ts'
import { DemoBadge } from './DemoBadge.tsx'
import { formatUtcTime } from './format.ts'

interface DemoDecisionPanelProps {
  readonly snapshot: DemoSnapshot
  readonly action: PrimaryAction
  readonly pendingCommand: DemoCommandName | 'loadInitialSnapshot' | null
  readonly onExport: () => void
  readonly onPrimaryAction: () => void
  readonly onReset: () => void
}

export function DemoDecisionPanel({
  snapshot,
  action,
  pendingCommand,
  onExport,
  onPrimaryAction,
  onReset,
}: DemoDecisionPanelProps) {
  const approval = snapshot.approval
  const isPending = pendingCommand !== null
  const primaryLabel = isPending ? 'Applying fixture step…' : action.label

  return (
    <section aria-labelledby="decision-heading" className="panel panel--decision">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">Bounded recovery</p>
          <h2 id="decision-heading">Decision gate</h2>
        </div>
        <DemoBadge
          label={approval?.status === 'granted' ? 'Approved' : approval?.status === 'pending' ? 'Pending' : 'Not requested'}
          tone={approval?.status === 'granted' ? 'healthy' : approval?.status === 'pending' ? 'warning' : 'neutral'}
        />
      </div>

      <div className="decision-explainer">
        <span className="decision-explainer__rule">Safety rule 01</span>
        <p>
          Approval clears only a fixture-owned transient latch. It does not control a real process or
          claim to repair source code.
        </p>
      </div>

      <dl className="decision-facts">
        <div>
          <dt>Requested action</dt>
          <dd>Simulated managed-runtime restart</dd>
        </div>
        <div>
          <dt>External side effect</dt>
          <dd>None</dd>
        </div>
        <div>
          <dt>Approval record</dt>
          <dd>{approval?.id ?? 'Awaiting request'}</dd>
        </div>
        <div>
          <dt>Requested at</dt>
          <dd>{approval ? formatUtcTime(approval.requestedAt) : 'Not requested'}</dd>
        </div>
      </dl>

      {snapshot.action ? (
        <div className="action-confirmation">
          <div>
            <span className="status-dot status-dot--healthy" />
            <strong>Simulated action confirmed</strong>
          </div>
          <span>{snapshot.action.id}</span>
        </div>
      ) : null}

      <div className="decision-next">
        <span>{action.eyebrow}</span>
        <h3>{action.title}</h3>
        <p>{action.description}</p>
      </div>

      <div className="decision-actions">
        <button
          aria-busy={isPending}
          className="button button--primary"
          disabled={isPending}
          onClick={onPrimaryAction}
          type="button"
        >
          {primaryLabel}
        </button>
        <div className="decision-actions__secondary">
          {action.command !== 'exportEvidence' ? (
            <button className="button button--secondary" disabled={isPending} onClick={onExport} type="button">
              Inspect report
            </button>
          ) : null}
          <button className="button button--ghost" disabled={isPending} onClick={onReset} type="button">
            Reset fixture
          </button>
        </div>
      </div>
    </section>
  )
}
