export type DemoBadgeTone =
  | 'neutral'
  | 'fixture'
  | 'mocked'
  | 'degraded'
  | 'healthy'
  | 'planned'
  | 'warning'

interface DemoBadgeProps {
  readonly label: string
  readonly tone?: DemoBadgeTone
  readonly title?: string
}

export function DemoBadge({ label, tone = 'neutral', title }: DemoBadgeProps) {
  return (
    <span className={`demo-badge demo-badge--${tone}`} title={title}>
      {label}
    </span>
  )
}
