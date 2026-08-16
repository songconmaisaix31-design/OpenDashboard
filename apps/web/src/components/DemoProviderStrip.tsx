import type { DemoProviderHealth } from '../contracts/index.ts'
import type { DemoBadgeTone } from './DemoBadge.tsx'
import { DemoBadge } from './DemoBadge.tsx'
import { formatProviderName, formatProviderStatus } from './format.ts'

const statusTones: Readonly<Record<DemoProviderHealth['status'], DemoBadgeTone>> = {
  degraded: 'degraded',
  healthy: 'healthy',
  mocked: 'mocked',
  planned: 'planned',
}

interface DemoProviderStripProps {
  readonly providers: readonly DemoProviderHealth[]
}

export function DemoProviderStrip({ providers }: DemoProviderStripProps) {
  return (
    <section aria-labelledby="providers-heading" className="provider-strip">
      <div className="provider-strip__intro">
        <p className="eyebrow">可信边界</p>
        <h2 id="providers-heading">提供器来源</h2>
        <p>每张提供器卡片只展示标准化契约数据，不读取提供器私有字段。</p>
      </div>
      <div className="provider-grid">
        {providers.map((provider) => (
          <article className="provider-card" key={provider.id}>
            <span className="provider-card__name">{formatProviderName(provider.id)}</span>
            <div className="badge-row">
              <DemoBadge label={formatProviderStatus(provider.status)} tone={statusTones[provider.status]} />
              <DemoBadge
                label={provider.provenance.mode === 'fixture' ? '固定样例' : '实时'}
                tone={provider.provenance.mode === 'fixture' ? 'fixture' : 'healthy'}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
