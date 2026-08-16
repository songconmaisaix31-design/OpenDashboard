import type {
  DemoCommandResult,
  DemoDataSource,
  DemoEvidenceReport,
  DemoPhase,
  DemoSnapshot,
} from '../../src/contracts/index.ts'
import {
  createPresentationReport,
  PRESENTATION_SNAPSHOTS,
} from '../presentation/snapshots.ts'

/**
 * Test-only port stub for browser screenshot QA. It returns prebuilt snapshots
 * and deliberately does not validate inputs or implement T1 domain rules.
 */
export function createPreviewDataSource(): DemoDataSource {
  let phase: DemoPhase = 'incident_open'

  const select = (nextPhase: DemoPhase): DemoCommandResult<DemoSnapshot> => {
    phase = nextPhase
    return accepted(PRESENTATION_SNAPSHOTS[phase])
  }

  return {
    async loadInitialSnapshot() {
      phase = 'incident_open'
      return PRESENTATION_SNAPSHOTS[phase]
    },
    async collectEvidence() {
      return select('evidence_collected')
    },
    async requestRestart() {
      return select('approval_pending')
    },
    async approveAction() {
      return select('action_confirmed')
    },
    async verifyRecovery() {
      return select('recovered')
    },
    async resetDemo() {
      return select('incident_open')
    },
    async exportEvidence() {
      return accepted<DemoEvidenceReport>(
        createPresentationReport(PRESENTATION_SNAPSHOTS[phase]),
      )
    },
  }
}

function accepted<T>(value: T): DemoCommandResult<T> {
  return {
    ok: true,
    value,
    replayed: false,
  }
}
