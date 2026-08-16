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
  const primaryLabel = isPending ? '正在应用样例步骤…' : action.label

  return (
    <section aria-labelledby="decision-heading" className="panel panel--decision">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">有边界的恢复</p>
          <h2 id="decision-heading">决策门</h2>
        </div>
        <DemoBadge
          label={approval?.status === 'granted' ? '已批准' : approval?.status === 'pending' ? '待审批' : '未申请'}
          tone={approval?.status === 'granted' ? 'healthy' : approval?.status === 'pending' ? 'warning' : 'neutral'}
        />
      </div>

      <div className="decision-explainer">
        <span className="decision-explainer__rule">安全规则 01</span>
        <p>
          审批只确认模拟样例操作；只有后续恢复验证才会更新样例健康状态。整个流程不会控制真实进程，也不会声称修复了源代码。
        </p>
      </div>

      <dl className="decision-facts">
        <div>
          <dt>申请的操作</dt>
          <dd>模拟托管运行时重启</dd>
        </div>
        <div>
          <dt>外部副作用</dt>
          <dd>无</dd>
        </div>
        <div>
          <dt>审批记录</dt>
          <dd>{approval?.id ?? '等待申请'}</dd>
        </div>
        <div>
          <dt>申请时间</dt>
          <dd>{approval ? formatUtcTime(approval.requestedAt) : '尚未申请'}</dd>
        </div>
      </dl>

      {snapshot.action ? (
        <div className="action-confirmation">
          <div>
            <span className="status-dot status-dot--healthy" />
            <strong>模拟操作已确认</strong>
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
              查看报告
            </button>
          ) : null}
          <button className="button button--ghost" disabled={isPending} onClick={onReset} type="button">
            重置固定样例
          </button>
        </div>
      </div>
    </section>
  )
}
