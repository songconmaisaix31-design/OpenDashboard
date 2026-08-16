import { useEffect, useState } from 'react'

import type {
  DemoCommandResult,
  DemoDataSource,
  DemoEvidenceReport,
  DemoSnapshot,
} from '../contracts/index.ts'
import { GuidedDemoView } from './GuidedDemoView.tsx'
import {
  createExportIdempotencyKey,
  createIdempotencyKey,
  getCommandErrorMessage,
  getPrimaryAction,
  type PresentationOperation,
  type SnapshotCommand,
} from './presentation.ts'

export interface GuidedDemoPageProps {
  /** T1 supplies the fixture-backed implementation; T2 never imports provider data. */
  readonly dataSource: DemoDataSource
}

/** Presentation adapter for the frozen DemoDataSource contract. */
export function GuidedDemoPage({ dataSource }: GuidedDemoPageProps) {
  const [snapshot, setSnapshot] = useState<DemoSnapshot | null>(null)
  const [pendingOperation, setPendingOperation] = useState<PresentationOperation | null>(
    'loadInitialSnapshot',
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [report, setReport] = useState<DemoEvidenceReport | null>(null)
  const [cycle, setCycle] = useState(0)
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    let disposed = false

    setSnapshot(null)
    setPendingOperation('loadInitialSnapshot')
    setErrorMessage(null)
    setNotice(null)
    setReport(null)
    setCycle(0)

    void dataSource
      .loadInitialSnapshot()
      .then((initialSnapshot) => {
        if (!disposed) {
          setSnapshot(initialSnapshot)
          setPendingOperation(null)
        }
      })
      .catch(() => {
        if (!disposed) {
          setErrorMessage(
            '固定样例适配器加载失败；没有尝试连接实时提供器，也没有执行进程操作。',
          )
          setPendingOperation(null)
        }
      })

    return () => {
      disposed = true
    }
  }, [dataSource, loadAttempt])

  async function executeSnapshotCommand(command: SnapshotCommand): Promise<void> {
    if (!snapshot || pendingOperation) {
      return
    }

    const currentSnapshot = snapshot
    const approvalId = currentSnapshot.approval?.id

    if (command === 'approveAction' && !approvalId) {
      setErrorMessage('固定样例没有提供审批引用；没有应用任何操作。')
      return
    }

    const context = {
      runId: currentSnapshot.runId,
      idempotencyKey: createIdempotencyKey(currentSnapshot.runId, cycle, command),
    }

    setPendingOperation(command)
    setErrorMessage(null)
    setNotice(null)

    try {
      let result: DemoCommandResult<DemoSnapshot>

      switch (command) {
        case 'collectEvidence':
          result = await dataSource.collectEvidence({
            ...context,
            incidentId: currentSnapshot.incident.id,
          })
          break
        case 'requestRestart':
          result = await dataSource.requestRestart({
            ...context,
            targetId: currentSnapshot.target.id,
          })
          break
        case 'approveAction':
          if (!approvalId) {
            return
          }
          result = await dataSource.approveAction({ ...context, approvalId })
          break
        case 'verifyRecovery':
          result = await dataSource.verifyRecovery({
            ...context,
            targetId: currentSnapshot.target.id,
          })
          break
        case 'resetDemo':
          result = await dataSource.resetDemo(context)
          break
        default:
          return assertNever(command)
      }

      if (!result.ok) {
        setSnapshot(result.snapshot)
        setErrorMessage(getCommandErrorMessage(result.error.code))
        return
      }

      setSnapshot(result.value)
      setNotice(result.replayed ? '固定样例返回了已有的幂等结果。' : null)

      if (command === 'resetDemo') {
        setCycle((value) => value + 1)
        setReport(null)
      }
    } catch {
      setErrorMessage('固定样例适配器未完成这一步；没有尝试任何实时操作。')
    } finally {
      setPendingOperation(null)
    }
  }

  async function executeExport(): Promise<void> {
    if (!snapshot || pendingOperation) {
      return
    }

    setPendingOperation('exportEvidence')
    setErrorMessage(null)
    setNotice(null)

    try {
      const result = await dataSource.exportEvidence({
        runId: snapshot.runId,
        idempotencyKey: createExportIdempotencyKey(snapshot.runId, cycle, snapshot.phase),
      })

      if (!result.ok) {
        setSnapshot(result.snapshot)
        setErrorMessage(getCommandErrorMessage(result.error.code))
        return
      }

      setReport(result.value)
      setNotice(result.replayed ? '固定样例返回了已有的脱敏报告。' : null)
    } catch {
      setErrorMessage('无法生成脱敏样例报告；没有发生任何外部导出。')
    } finally {
      setPendingOperation(null)
    }
  }

  function handlePrimaryAction(): void {
    if (!snapshot) {
      return
    }

    const command = getPrimaryAction(snapshot.phase).command

    if (command === 'exportEvidence') {
      void executeExport()
      return
    }

    void executeSnapshotCommand(command)
  }

  function downloadReport(): void {
    if (!report) {
      return
    }

    const payload = `${JSON.stringify(report, null, 2)}\n`
    const objectUrl = URL.createObjectURL(new Blob([payload], { type: 'application/json' }))
    const anchor = document.createElement('a')

    anchor.href = objectUrl
    anchor.download = 'open-dashboard-evidence.json'
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(objectUrl)
  }

  if (!snapshot) {
    return (
      <main className="loading-state">
        <div className="loading-state__mark">OD</div>
        <p className="eyebrow">固定样例展示边界</p>
        <h1>{pendingOperation ? '正在加载可重复演示…' : '固定样例适配器不可用'}</h1>
        <p>{errorMessage ?? '正在从进程内 DemoDataSource 读取标准化快照。'}</p>
        {!pendingOperation ? (
          <button className="button button--primary" onClick={() => setLoadAttempt((value) => value + 1)} type="button">
            重新加载固定样例
          </button>
        ) : null}
      </main>
    )
  }

  return (
    <GuidedDemoView
      errorMessage={errorMessage}
      notice={notice}
      onCloseReport={() => setReport(null)}
      onDownloadReport={downloadReport}
      onExport={() => void executeExport()}
      onPrimaryAction={handlePrimaryAction}
      onReset={() => void executeSnapshotCommand('resetDemo')}
      pendingCommand={pendingOperation}
      report={report}
      snapshot={snapshot}
    />
  )
}

function assertNever(value: never): never {
  throw new Error(`Unhandled presentation command: ${String(value)}`)
}
