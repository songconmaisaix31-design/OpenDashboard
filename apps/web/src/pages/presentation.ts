import type {
  DemoCommandErrorCode,
  DemoCommandName,
  DemoPhase,
} from '../contracts/index.ts'

export const DEMO_PHASES = [
  { phase: 'incident_open', label: 'Detect', caption: 'Incident open' },
  { phase: 'evidence_collected', label: 'Triage', caption: 'Evidence collected' },
  { phase: 'approval_pending', label: 'Approve', caption: 'Decision pending' },
  { phase: 'action_confirmed', label: 'Recover', caption: 'Action confirmed' },
  { phase: 'recovered', label: 'Verify', caption: 'Recovery proven' },
] as const satisfies readonly {
  readonly phase: DemoPhase
  readonly label: string
  readonly caption: string
}[]

export type SnapshotCommand = Exclude<DemoCommandName, 'exportEvidence'>
export type PrimaryCommand = Exclude<DemoCommandName, 'resetDemo'>
export type PresentationOperation = DemoCommandName | 'loadInitialSnapshot'

export interface PrimaryAction {
  readonly command: PrimaryCommand
  readonly label: string
  readonly eyebrow: string
  readonly title: string
  readonly description: string
}

const primaryActions: Readonly<Record<DemoPhase, PrimaryAction>> = {
  incident_open: {
    command: 'collectEvidence',
    label: 'Run read-only triage',
    eyebrow: 'Step 01 · Inspect',
    title: 'Collect the normalized evidence',
    description: 'Run api-500-triage without changing the fixture or contacting a live provider.',
  },
  evidence_collected: {
    command: 'requestRestart',
    label: 'Request simulated restart',
    eyebrow: 'Step 02 · Request',
    title: 'Open the approval gate',
    description: 'Request a bounded fixture action. Nothing executes until the approval is explicit.',
  },
  approval_pending: {
    command: 'approveAction',
    label: 'Approve simulated restart',
    eyebrow: 'Step 03 · Decide',
    title: 'Approve the fixture-only action',
    description: 'The approval is recorded before the transient fixture latch can be cleared.',
  },
  action_confirmed: {
    command: 'verifyRecovery',
    label: 'Verify recovery',
    eyebrow: 'Step 04 · Prove',
    title: 'Check the result, not the promise',
    description: 'Run fixture verification and confirm the API state before declaring recovery.',
  },
  recovered: {
    command: 'exportEvidence',
    label: 'Inspect redacted report',
    eyebrow: 'Step 05 · Export',
    title: 'Leave an honest evidence trail',
    description: 'Inspect or download a local JSON report with provenance, approval, action, and audit data.',
  },
}

const commandErrorMessages: Readonly<Record<DemoCommandErrorCode, string>> = {
  idempotency_conflict: 'This step conflicts with an earlier request key. Reset the fixture before retrying.',
  invalid_demo_reference: 'The fixture returned an invalid reference for this step. No action was applied.',
  invalid_demo_transition: 'This step is no longer valid for the current fixture phase.',
}

export function getPrimaryAction(phase: DemoPhase): PrimaryAction {
  return primaryActions[phase]
}

export function getPhaseIndex(phase: DemoPhase): number {
  return DEMO_PHASES.findIndex((item) => item.phase === phase)
}

export function createIdempotencyKey(
  runId: string,
  cycle: number,
  command: DemoCommandName,
): string {
  return `${runId}:web-demo:${cycle}:${command}`
}

export function createExportIdempotencyKey(
  runId: string,
  cycle: number,
  phase: DemoPhase,
): string {
  return `${createIdempotencyKey(runId, cycle, 'exportEvidence')}:${phase}`
}

export function getCommandErrorMessage(code: DemoCommandErrorCode): string {
  return commandErrorMessages[code]
}
