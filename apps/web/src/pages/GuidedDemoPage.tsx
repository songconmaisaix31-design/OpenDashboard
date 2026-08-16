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
            'The fixture adapter could not load. No live provider or process action was attempted.',
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
      setErrorMessage('The fixture did not provide an approval reference. No action was applied.')
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
      setNotice(result.replayed ? 'The fixture returned the existing idempotent result.' : null)

      if (command === 'resetDemo') {
        setCycle((value) => value + 1)
        setReport(null)
      }
    } catch {
      setErrorMessage('The fixture adapter did not complete this step. No live action was attempted.')
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
      setNotice(result.replayed ? 'The fixture returned the existing redacted report.' : null)
    } catch {
      setErrorMessage('The redacted fixture report could not be generated. No external export occurred.')
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
        <p className="eyebrow">Fixture presentation boundary</p>
        <h1>{pendingOperation ? 'Loading deterministic demo…' : 'Fixture adapter unavailable'}</h1>
        <p>{errorMessage ?? 'Reading the normalized snapshot from the in-process DemoDataSource.'}</p>
        {!pendingOperation ? (
          <button className="button button--primary" onClick={() => setLoadAttempt((value) => value + 1)} type="button">
            Retry fixture load
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
