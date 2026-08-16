import type { DemoPhase } from '../contracts/index.ts'
import { DEMO_PHASES, getPhaseIndex } from '../pages/presentation.ts'

interface DemoPhaseRailProps {
  readonly phase: DemoPhase
}

export function DemoPhaseRail({ phase }: DemoPhaseRailProps) {
  const currentIndex = getPhaseIndex(phase)

  return (
    <nav aria-label="Demo progress" className="phase-rail">
      <ol>
        {DEMO_PHASES.map((item, index) => {
          const state = index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming'

          return (
            <li
              aria-current={state === 'current' ? 'step' : undefined}
              className={`phase-step phase-step--${state}`}
              key={item.phase}
            >
              <span aria-hidden="true" className="phase-step__marker">
                {state === 'complete' ? '✓' : index + 1}
              </span>
              <span className="phase-step__copy">
                <strong>{item.label}</strong>
                <span>{item.caption}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
