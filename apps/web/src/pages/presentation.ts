import type {
  DemoCommandErrorCode,
  DemoCommandName,
  DemoPhase,
} from '../contracts/index.ts'

export const DEMO_PHASES = [
  { phase: 'incident_open', label: '发现', caption: '故障发现' },
  { phase: 'evidence_collected', label: '排查', caption: '证据收集' },
  { phase: 'approval_pending', label: '审批', caption: '人工决策' },
  { phase: 'action_confirmed', label: '恢复', caption: '模拟操作' },
  { phase: 'recovered', label: '验证', caption: '结果验证' },
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
    label: '运行只读排查',
    eyebrow: '步骤 01 · 检查',
    title: '收集标准化证据',
    description: '运行 api-500-triage；不修改固定样例，也不连接实时提供器。',
  },
  evidence_collected: {
    command: 'requestRestart',
    label: '申请模拟重启',
    eyebrow: '步骤 02 · 申请',
    title: '打开审批门',
    description: '申请一个有边界的样例操作；没有明确审批，就不会确认执行。',
  },
  approval_pending: {
    command: 'approveAction',
    label: '批准模拟重启',
    eyebrow: '步骤 03 · 决策',
    title: '批准仅作用于样例的操作',
    description: '记录审批并确认模拟操作；这一步不会改变样例健康状态。',
  },
  action_confirmed: {
    command: 'verifyRecovery',
    label: '验证恢复结果',
    eyebrow: '步骤 04 · 证明',
    title: '检查结果，而不是相信承诺',
    description: '运行样例验证并更新样例健康状态，确认结果后再宣布恢复。',
  },
  recovered: {
    command: 'exportEvidence',
    label: '查看脱敏报告',
    eyebrow: '步骤 05 · 导出',
    title: '留下真实可信的证据链',
    description: '查看或下载本地 JSON 报告，其中包含来源、审批、操作和审计数据。',
  },
}

const commandErrorMessages: Readonly<Record<DemoCommandErrorCode, string>> = {
  idempotency_conflict: '这一步与之前的请求键冲突。请重置固定样例后重试。',
  invalid_demo_reference: '固定样例为这一步返回了无效引用；没有应用任何操作。',
  invalid_demo_transition: '当前固定样例阶段不再允许执行这一步。',
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
