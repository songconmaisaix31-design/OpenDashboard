import type { DemoProviderHealth } from '../contracts/index.ts'
import type { DemoBadgeTone } from './DemoBadge.tsx'
import { DemoBadge } from './DemoBadge.tsx'
import { formatProviderName } from './format.ts'

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
        <p className="eyebrow">Trust boundary</p>
        <h2 id="providers-heading">Provider provenance</h2>
        <p>Every provider card reflects normalized contract data, never provider-specific fields.</p>
      </div>
      <div className="provider-grid">
        {providers.map((provider) => (
          <article className="provider-card" key={provider.id}>
            <span className="provider-card__name">{formatProviderName(provider.id)}</span>
            <div className="badge-row">
              <DemoBadge label={provider.status} tone={statusTones[provider.status]} />
              <DemoBadge
                label={provider.provenance.mode === 'fixture' ? 'Fixture' : 'Live'}
                tone={provider.provenance.mode === 'fixture' ? 'fixture' : 'healthy'}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
