import type {
  ApproveActionInput,
  CollectEvidenceInput,
  DemoCommandContext,
  DemoCommandName,
  DemoCommandResult,
  DemoDataSource,
  DemoEvidenceReport,
  DemoSnapshot,
  ExportEvidenceInput,
  RequestRestartInput,
  ResetDemoInput,
  VerifyRecoveryInput,
} from '../contracts/index.ts'
import {
  approveFixtureRestart,
  collectFixtureEvidence,
  exportFixtureEvidence,
  requestFixtureRestart,
  resetFixtureDemo,
  verifyFixtureRecovery,
} from '../domain/demo-transitions.ts'
import {
  createInitialFixtureSnapshot,
  FIXTURE_IDS,
} from '../fixtures/golden-path.ts'

type StoredCommandResult =
  | { readonly kind: 'snapshot'; readonly value: DemoSnapshot }
  | { readonly kind: 'evidence-report'; readonly value: DemoEvidenceReport }

interface StoredCommand {
  readonly signature: string
  readonly result: StoredCommandResult
}

const cloneSnapshot = (snapshot: DemoSnapshot): DemoSnapshot =>
  structuredClone(snapshot)

const cloneReport = (report: DemoEvidenceReport): DemoEvidenceReport =>
  structuredClone(report)

const commandSignature = (
  command: DemoCommandName,
  input: DemoCommandContext,
  reference: string | null = null,
): string => JSON.stringify([command, input.runId, reference])

/**
 * Creates an isolated, in-memory implementation of the frozen DemoDataSource
 * contract. It has no network, process, persistence, or file-system effects.
 */
export const createFixtureDataSource = (): DemoDataSource => {
  let snapshot = createInitialFixtureSnapshot()
  const completedCommands = new Map<string, StoredCommand>()

  const commandError = <T>(
    command: DemoCommandName,
    code: 'invalid_demo_transition' | 'invalid_demo_reference' | 'idempotency_conflict',
    message: string,
  ): DemoCommandResult<T> => ({
    ok: false,
    snapshot: cloneSnapshot(snapshot),
    error: {
      code,
      command,
      phase: snapshot.phase,
      message,
    },
  })

  const replaySnapshot = (
    command: DemoCommandName,
    input: DemoCommandContext,
    signature: string,
  ): DemoCommandResult<DemoSnapshot> | null => {
    const stored = completedCommands.get(input.idempotencyKey)
    if (!stored) return null

    if (stored.signature !== signature || stored.result.kind !== 'snapshot') {
      return commandError(
        command,
        'idempotency_conflict',
        'The idempotency key was already accepted for different input.',
      )
    }

    return { ok: true, value: cloneSnapshot(stored.result.value), replayed: true }
  }

  const replayReport = (
    command: DemoCommandName,
    input: DemoCommandContext,
    signature: string,
  ): DemoCommandResult<DemoEvidenceReport> | null => {
    const stored = completedCommands.get(input.idempotencyKey)
    if (!stored) return null

    if (
      stored.signature !== signature ||
      stored.result.kind !== 'evidence-report'
    ) {
      return commandError(
        command,
        'idempotency_conflict',
        'The idempotency key was already accepted for different input.',
      )
    }

    return { ok: true, value: cloneReport(stored.result.value), replayed: true }
  }

  const acceptSnapshot = (
    idempotencyKey: string,
    signature: string,
    nextSnapshot: DemoSnapshot,
  ): DemoCommandResult<DemoSnapshot> => {
    snapshot = nextSnapshot
    completedCommands.set(idempotencyKey, {
      signature,
      result: { kind: 'snapshot', value: snapshot },
    })

    return { ok: true, value: cloneSnapshot(snapshot), replayed: false }
  }

  const hasRun = (input: DemoCommandContext): boolean =>
    input.runId === FIXTURE_IDS.run

  return {
    async loadInitialSnapshot(): Promise<DemoSnapshot> {
      return cloneSnapshot(snapshot)
    },

    async collectEvidence(
      input: CollectEvidenceInput,
    ): Promise<DemoCommandResult<DemoSnapshot>> {
      const command = 'collectEvidence'
      const signature = commandSignature(command, input, input.incidentId)
      const replay = replaySnapshot(command, input, signature)
      if (replay) return replay

      if (!hasRun(input) || input.incidentId !== FIXTURE_IDS.incident) {
        return commandError(
          command,
          'invalid_demo_reference',
          'The run or incident reference does not belong to this fixture.',
        )
      }
      if (snapshot.phase !== 'incident_open') {
        return commandError(
          command,
          'invalid_demo_transition',
          'collectEvidence requires the incident_open phase.',
        )
      }

      return acceptSnapshot(
        input.idempotencyKey,
        signature,
        collectFixtureEvidence(snapshot),
      )
    },

    async requestRestart(
      input: RequestRestartInput,
    ): Promise<DemoCommandResult<DemoSnapshot>> {
      const command = 'requestRestart'
      const signature = commandSignature(command, input, input.targetId)
      const replay = replaySnapshot(command, input, signature)
      if (replay) return replay

      if (!hasRun(input) || input.targetId !== FIXTURE_IDS.target) {
        return commandError(
          command,
          'invalid_demo_reference',
          'The run or target reference does not belong to this fixture.',
        )
      }
      if (snapshot.phase !== 'evidence_collected') {
        return commandError(
          command,
          'invalid_demo_transition',
          'requestRestart requires the evidence_collected phase.',
        )
      }

      return acceptSnapshot(
        input.idempotencyKey,
        signature,
        requestFixtureRestart(snapshot),
      )
    },

    async approveAction(
      input: ApproveActionInput,
    ): Promise<DemoCommandResult<DemoSnapshot>> {
      const command = 'approveAction'
      const signature = commandSignature(command, input, input.approvalId)
      const replay = replaySnapshot(command, input, signature)
      if (replay) return replay

      if (!hasRun(input) || input.approvalId !== FIXTURE_IDS.approval) {
        return commandError(
          command,
          'invalid_demo_reference',
          'The run or approval reference does not belong to this fixture.',
        )
      }
      if (snapshot.phase !== 'approval_pending') {
        return commandError(
          command,
          'invalid_demo_transition',
          'approveAction requires the approval_pending phase.',
        )
      }

      return acceptSnapshot(
        input.idempotencyKey,
        signature,
        approveFixtureRestart(snapshot),
      )
    },

    async verifyRecovery(
      input: VerifyRecoveryInput,
    ): Promise<DemoCommandResult<DemoSnapshot>> {
      const command = 'verifyRecovery'
      const signature = commandSignature(command, input, input.targetId)
      const replay = replaySnapshot(command, input, signature)
      if (replay) return replay

      if (!hasRun(input) || input.targetId !== FIXTURE_IDS.target) {
        return commandError(
          command,
          'invalid_demo_reference',
          'The run or target reference does not belong to this fixture.',
        )
      }
      if (snapshot.phase !== 'action_confirmed') {
        return commandError(
          command,
          'invalid_demo_transition',
          'verifyRecovery requires the action_confirmed phase.',
        )
      }

      return acceptSnapshot(
        input.idempotencyKey,
        signature,
        verifyFixtureRecovery(snapshot),
      )
    },

    async resetDemo(
      input: ResetDemoInput,
    ): Promise<DemoCommandResult<DemoSnapshot>> {
      const command = 'resetDemo'
      const signature = commandSignature(command, input)
      const replay = replaySnapshot(command, input, signature)
      if (replay) return replay

      if (!hasRun(input)) {
        return commandError(
          command,
          'invalid_demo_reference',
          'The run reference does not belong to this fixture.',
        )
      }

      return acceptSnapshot(input.idempotencyKey, signature, resetFixtureDemo())
    },

    async exportEvidence(
      input: ExportEvidenceInput,
    ): Promise<DemoCommandResult<DemoEvidenceReport>> {
      const command = 'exportEvidence'
      const signature = commandSignature(command, input)
      const replay = replayReport(command, input, signature)
      if (replay) return replay

      if (!hasRun(input)) {
        return commandError(
          command,
          'invalid_demo_reference',
          'The run reference does not belong to this fixture.',
        )
      }

      const report = exportFixtureEvidence(snapshot)
      completedCommands.set(input.idempotencyKey, {
        signature,
        result: { kind: 'evidence-report', value: report },
      })

      return { ok: true, value: cloneReport(report), replayed: false }
    },
  }
}
