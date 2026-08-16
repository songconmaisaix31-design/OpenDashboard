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
          <p className="eyebrow">本地产物 · JSON</p>
          <h2 id="report-heading">脱敏证据报告</h2>
          <p>基于可重复的固定样例状态，于 {formatUtcTime(report.generatedAt)} 生成。</p>
        </div>
        <div className="badge-row">
          <DemoBadge label="固定样例" tone="fixture" />
          <DemoBadge label="模拟" tone="mocked" />
          <DemoBadge label="已脱敏" tone="neutral" />
        </div>
      </div>

      <div className="report-metrics">
        <div>
          <span>之前</span>
          <strong>已降级 / 待处理</strong>
        </div>
        <div>
          <span>之后</span>
          <strong>{report.after ? '健康 / 已恢复' : '尚未验证'}</strong>
        </div>
        <div>
          <span>证据</span>
          <strong>{report.evidence.length} 条脱敏记录</strong>
        </div>
        <div>
          <span>审计</span>
          <strong>{report.audit.length} 个审计事件</strong>
        </div>
      </div>

      {report.unverifiedClaims.length > 0 ? (
        <div className="report-caveat">
          <strong>未验证声明</strong>
          <ul>
            {report.unverifiedClaims.map((claim) => (
              <li key={claim}>{claim}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <details className="report-json">
        <summary>查看机器可读产物</summary>
        <pre>{JSON.stringify(report, null, 2)}</pre>
      </details>

      <div className="report-panel__actions">
        <button className="button button--primary" onClick={onDownload} type="button">
          下载脱敏 JSON
        </button>
        <button className="button button--ghost" onClick={onClose} type="button">
          关闭报告
        </button>
      </div>
    </section>
  )
}
