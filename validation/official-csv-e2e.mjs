import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { totalmem } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getHeapStatistics } from 'node:v8'
import { resourceUsage, memoryUsage } from 'node:process'

import { hydrateH2Workspace } from '../apps/web/src/features/h2-sentinel/model/workspace-loader.ts'
import { createLiveH2EmsDataSource } from '../plugins/h2-ems/src/index.ts'
import { validateSubmissionFile } from './check-submission.mjs'
import { splitCsvLine } from './lib/csv.mjs'
import { normalizeOfficialCsv, OFFICIAL_FIELDS } from './lib/fields.mjs'
import { freeLoopbackPort, repositoryRoot, startLauncher } from './lib/launcher.mjs'

export const OFFICIAL_RAW_IDENTITY = Object.freeze({
  bytes: 77_865_257,
  sha256: '88f3a5c15fb5c42d265475f2998fe9f6c271dcef16f43daee7626f6704504cd9',
  rows: 172_800,
  fields: 69,
})

export const OFFICIAL_NORMALIZED_IDENTITY = Object.freeze({
  bytes: 78_038_054,
  sha256: '4407495ad75299f2f8f06112f6d3209eb93b2773ff3f0c797c47874159853169',
  rows: 172_800,
  fields: 69,
})

const MIN_MEMORY_BYTES = 8 * 1024 ** 3
const MIN_HEAP_BYTES = 4 * 1024 ** 3
const REQUEST_TIMEOUT_MS = 30_000
const REPORT_SCHEMA = 'h2-sentinel-official-csv-e2e-v1'
const SAFE_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/
const COMMIT_PATTERN = /^[0-9a-f]{40}$/
const LOOPBACK_HOSTS = new Set(['127.0.0.1', '[::1]', '::1'])
const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const DEFAULT_REPORT_ROOT = resolve(scriptDirectory, 'reports/epoch-2')

class RunnerError extends Error {
  constructor(code) {
    super(code)
    this.code = code
  }
}

function defaultDependencies() {
  return {
    getHead: async () => {
      const { execFile } = await import('node:child_process')
      return new Promise((resolvePromise, rejectPromise) => {
        execFile('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, windowsHide: true }, (error, stdout) => {
          if (error) rejectPromise(error)
          else resolvePromise(stdout.trim())
        })
      })
    },
    statRaw: stat,
    inspectRaw: inspectCsvIdentity,
    readFile,
    normalize: normalizeOfficialCsv,
    inspectNormalized: inspectCsvTextIdentity,
    officialFields: OFFICIAL_FIELDS,
    totalMemoryBytes: totalmem,
    heapLimitBytes: () => getHeapStatistics().heap_size_limit,
    freeLoopbackPort,
    startLauncher,
    createLiveDataSource: createLiveH2EmsDataSource,
    checkSubmission: validateSubmissionFile,
    hydrateWorkspace: hydrateH2Workspace,
    getResources: currentResources,
  }
}

function currentResources() {
  return {
    rssBytes: memoryUsage.rss(),
    resourceUsage: numericResourceUsage(resourceUsage()),
  }
}

function numericResourceUsage(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => Number.isFinite(entry)))
}

function assertIdentity(actual, expected, prefix) {
  if (actual.bytes !== expected.bytes) throw new RunnerError(`E_${prefix}_BYTES_MISMATCH`)
  if (actual.sha256 !== expected.sha256) throw new RunnerError(`E_${prefix}_SHA256_MISMATCH`)
  if (actual.rows !== expected.rows) throw new RunnerError(`E_${prefix}_ROWS_MISMATCH`)
  if (actual.fields !== expected.fields) throw new RunnerError(`E_${prefix}_FIELDS_MISMATCH`)
  if (actual.headerMatches === false) throw new RunnerError(`E_${prefix}_HEADER_MISMATCH`)
}

function inspectText(text, expectedFields) {
  const buffer = Buffer.from(text, 'utf8')
  const newlineIndex = buffer.indexOf(10)
  if (newlineIndex < 0) throw new RunnerError('E_CSV_HEADER_MISSING')
  const header = buffer.subarray(0, newlineIndex).toString('utf8').replace(/\r$/, '')
  const columns = splitCsvLine(header)
  const lineBreaks = countByte(buffer, 10)
  const hasFinalLine = buffer.length > 0 && buffer[buffer.length - 1] !== 10
  return {
    bytes: buffer.length,
    sha256: createHash('sha256').update(buffer).digest('hex'),
    rows: lineBreaks - 1 + (hasFinalLine ? 1 : 0),
    fields: columns.length,
    headerMatches: sameStrings(columns, expectedFields),
  }
}

function countByte(buffer, value) {
  let count = 0
  for (const byte of buffer) if (byte === value) count += 1
  return count
}

function sameStrings(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

/**
 * Hash and inspect a CSV incrementally so raw identity failures never require
 * loading the external official CSV into a full text buffer.
 */
export async function inspectCsvIdentity(filePath, expectedFields = OFFICIAL_FIELDS) {
  const hash = createHash('sha256')
  const headerChunks = []
  let headerLength = 0
  let headerComplete = false
  let bytes = 0
  let lineBreaks = 0
  let lastByte = -1

  await new Promise((resolvePromise, rejectPromise) => {
    const stream = createReadStream(filePath)
    stream.on('data', (chunk) => {
      bytes += chunk.length
      hash.update(chunk)
      lineBreaks += countByte(chunk, 10)
      lastByte = chunk[chunk.length - 1] ?? lastByte
      if (!headerComplete) {
        const newline = chunk.indexOf(10)
        const part = newline === -1 ? chunk : chunk.subarray(0, newline)
        headerChunks.push(part)
        headerLength += part.length
        if (headerLength > 64 * 1024) {
          stream.destroy(new RunnerError('E_CSV_HEADER_INVALID'))
          return
        }
        if (newline !== -1) headerComplete = true
      }
    })
    stream.once('error', rejectPromise)
    stream.once('end', resolvePromise)
  })

  if (!headerComplete) throw new RunnerError('E_CSV_HEADER_MISSING')
  let header
  try {
    header = new TextDecoder('utf-8', { fatal: true })
      .decode(Buffer.concat(headerChunks))
      .replace(/\r$/, '')
  } catch {
    throw new RunnerError('E_CSV_HEADER_INVALID')
  }
  const columns = splitCsvLine(header)
  return {
    bytes,
    sha256: hash.digest('hex'),
    rows: lineBreaks - 1 + (lastByte !== 10 ? 1 : 0),
    fields: columns.length,
    headerMatches: sameStrings(columns, expectedFields),
  }
}

export async function inspectCsvTextIdentity(text, expectedFields = OFFICIAL_FIELDS) {
  return inspectText(text, expectedFields)
}

function safeIdentifier(value, errorCode) {
  if (typeof value !== 'string' || !SAFE_ID_PATTERN.test(value)) throw new RunnerError(errorCode)
  return value
}

function safeRunId(value) {
  return safeIdentifier(value, 'E_RUN_ID_INVALID')
}

function safeTaskId(value) {
  return safeIdentifier(value, 'E_TASK_ID_INVALID')
}

function safeDispatchId(value) {
  return safeIdentifier(value, 'E_DISPATCH_ID_INVALID')
}

async function createAttempt(outputRoot, runId) {
  const runDirectory = resolve(outputRoot, runId)
  await mkdir(runDirectory, { recursive: true })
  for (let attempt = 1; attempt <= 10_000; attempt += 1) {
    const directory = resolve(runDirectory, `attempt-${attempt}`)
    try {
      await mkdir(directory)
      return { attempt, directory }
    } catch (error) {
      if (error && typeof error === 'object' && error.code === 'EEXIST') continue
      throw error
    }
  }
  throw new RunnerError('E_ATTEMPT_LIMIT')
}

function stageRecord(stage, status, startedAt, extra = {}) {
  return { stage, status, durationMs: Date.now() - startedAt, ...extra }
}

function stableStageError(stage, error) {
  if (error instanceof RunnerError) return error
  return new RunnerError(`E_${stage.toUpperCase()}_FAILED`)
}

function reportRefFor(runId, attempt, filename) {
  return `validation/reports/epoch-2/${runId}/attempt-${attempt}/${filename}`
}

function reportIdentity(identity) {
  return {
    bytes: identity.bytes,
    sha256: identity.sha256,
    rows: identity.rows,
    fields: identity.fields,
  }
}

function assertRawMetadata(metadata, expected) {
  if (!metadata || typeof metadata.isFile !== 'function' || !metadata.isFile()) {
    throw new RunnerError('E_RAW_NOT_FILE')
  }
  if (!Number.isSafeInteger(metadata.size) || metadata.size !== expected.bytes) {
    throw new RunnerError('E_RAW_BYTES_MISMATCH')
  }
}

function sha256Descriptor(text) {
  return `sha256:${createHash('sha256').update(text).digest('hex')}`
}

function assertImportBinding(imported, normalizedIdentity) {
  if (!imported || typeof imported !== 'object' || !imported.dataset || typeof imported.dataset !== 'object') {
    throw new RunnerError('E_IMPORT_RESPONSE_INVALID')
  }
  const { dataset, quality } = imported
  if (dataset.mode !== 'LIVE_ANALYSIS') throw new RunnerError('E_IMPORT_MODE_INVALID')
  if (dataset.rowCount !== normalizedIdentity.rows) throw new RunnerError('E_IMPORT_ROW_COUNT_MISMATCH')
  if (!Array.isArray(dataset.fields) || dataset.fields.length !== normalizedIdentity.fields) {
    throw new RunnerError('E_IMPORT_FIELD_COUNT_MISMATCH')
  }
  if (dataset.fingerprint !== `sha256:${normalizedIdentity.sha256}`) {
    throw new RunnerError('E_IMPORT_FINGERPRINT_MISMATCH')
  }
  if (!quality || typeof quality !== 'object') throw new RunnerError('E_IMPORT_QUALITY_INVALID')
  if (quality.status === 'blocked') throw new RunnerError('E_IMPORT_QUALITY_BLOCKED')
  if (quality.status !== 'passed' && quality.status !== 'warning') {
    throw new RunnerError('E_IMPORT_QUALITY_INVALID')
  }
  if (typeof dataset.datasetId !== 'string' || dataset.datasetId.length === 0) {
    throw new RunnerError('E_IMPORT_RESPONSE_INVALID')
  }
}

function assertAnalysisBinding(analysis, imported) {
  if (!analysis || typeof analysis !== 'object') throw new RunnerError('E_ANALYSIS_RESPONSE_INVALID')
  if (analysis.status !== 'completed') throw new RunnerError('E_ANALYSIS_STATUS_INVALID')
  if (!analysis.dataset || typeof analysis.dataset !== 'object') {
    throw new RunnerError('E_ANALYSIS_RESPONSE_INVALID')
  }
  if (analysis.dataset.datasetId !== imported.dataset.datasetId) {
    throw new RunnerError('E_ANALYSIS_DATASET_ID_MISMATCH')
  }
  if (analysis.dataset.fingerprint !== imported.dataset.fingerprint) {
    throw new RunnerError('E_ANALYSIS_FINGERPRINT_MISMATCH')
  }
  if (!analysis.quality || typeof analysis.quality !== 'object') {
    throw new RunnerError('E_ANALYSIS_QUALITY_INVALID')
  }
  if (analysis.quality.status === 'blocked') throw new RunnerError('E_ANALYSIS_QUALITY_BLOCKED')
  if (analysis.quality.status !== 'passed' && analysis.quality.status !== 'warning') {
    throw new RunnerError('E_ANALYSIS_QUALITY_INVALID')
  }
  if (typeof analysis.runId !== 'string' || analysis.runId.length === 0 || !Array.isArray(analysis.events)) {
    throw new RunnerError('E_ANALYSIS_RESPONSE_INVALID')
  }
}

function assertExportBinding(submission, runId) {
  if (!submission || typeof submission !== 'object' || typeof submission.content !== 'string') {
    throw new RunnerError('E_EXPORT_RESPONSE_INVALID')
  }
  const { descriptor } = submission
  if (!descriptor || typeof descriptor !== 'object') throw new RunnerError('E_EXPORT_RESPONSE_INVALID')
  if (descriptor.status !== 'ready') throw new RunnerError('E_EXPORT_STATUS_INVALID')
  if (descriptor.kind !== 'submission_csv') throw new RunnerError('E_EXPORT_KIND_INVALID')
  if (descriptor.format !== 'csv') throw new RunnerError('E_EXPORT_FORMAT_INVALID')
  if (descriptor.runId !== runId) throw new RunnerError('E_EXPORT_RUN_ID_MISMATCH')
  if (submission.mediaType !== 'text/csv') throw new RunnerError('E_EXPORT_MEDIA_TYPE_INVALID')
  if (descriptor.contentHash !== sha256Descriptor(submission.content)) {
    throw new RunnerError('E_EXPORT_CONTENT_HASH_MISMATCH')
  }
}

function assertCheckerBinding(check, eventCount) {
  if (!check || check.valid !== true) throw new RunnerError('E_CHECKER_INVALID')
  if (!Array.isArray(check.columns) || check.columns.length !== 16) {
    throw new RunnerError('E_CHECKER_COLUMNS_INVALID')
  }
  if (!Number.isSafeInteger(check.rowCount) || check.rowCount !== eventCount) {
    throw new RunnerError('E_CHECKER_ROW_COUNT_MISMATCH')
  }
}

function isCleanStop(result) {
  return result?.timedOut === false && result.code === 0 && result.signal === null
}

function deriveLiveOrigin(readyWebUrl) {
  try {
    const url = new URL(readyWebUrl)
    if (
      (url.protocol !== 'http:' && url.protocol !== 'https:') ||
      !LOOPBACK_HOSTS.has(url.hostname.toLowerCase()) ||
      url.username !== '' ||
      url.password !== '' ||
      url.port === ''
    ) {
      throw new RunnerError('E_LAUNCHER_READY_INVALID')
    }
    return url.origin
  } catch (error) {
    if (error instanceof RunnerError) throw error
    throw new RunnerError('E_LAUNCHER_READY_INVALID')
  }
}

function assertSeriesHydrationBinding(workspace, imported, normalizedIdentity) {
  if (!workspace || typeof workspace !== 'object' || !workspace.run || typeof workspace.run !== 'object') {
    throw new RunnerError('E_SERIES_HYDRATION_FAILED')
  }
  const { run, series, seriesError } = workspace
  if (series === null || seriesError !== null || !series || typeof series !== 'object') {
    throw new RunnerError('E_SERIES_HYDRATION_FAILED')
  }
  if (!run.dataset || typeof run.dataset !== 'object' ||
    run.dataset.datasetId !== imported.dataset.datasetId ||
    run.dataset.fingerprint !== imported.dataset.fingerprint) {
    throw new RunnerError('E_SERIES_IDENTITY_MISMATCH')
  }
  if (typeof run.runId !== 'string' || run.runId.length === 0 || series.runId !== run.runId) {
    throw new RunnerError('E_SERIES_RUN_ID_MISMATCH')
  }
  if (!Array.isArray(series.variables) ||
    series.variables.length < 1 ||
    series.variables.length > 32 ||
    new Set(series.variables).size !== series.variables.length ||
    series.variables.some((variable) => typeof variable !== 'string' || variable.length === 0)) {
    throw new RunnerError('E_SERIES_VARIABLES_INVALID')
  }
  if (!Array.isArray(series.points) || series.points.length !== normalizedIdentity.rows) {
    throw new RunnerError('E_SERIES_POINT_COUNT_MISMATCH')
  }
  return {
    runId: run.runId,
    variableCount: series.variables.length,
    pointCount: series.points.length,
  }
}

function seriesHydrationErrorCode(error) {
  return error instanceof RunnerError && /^E_SERIES_[A-Z0-9_]+$/.test(error.code)
    ? error.code
    : 'E_SERIES_HYDRATION_FAILED'
}

export function sanitizeErrorCode(error) {
  return error instanceof RunnerError && /^E_[A-Z0-9_]+$/.test(error.code)
    ? error.code
    : 'E_STAGE_FAILED'
}

/**
 * Executes the authorized official-data path. Dependencies are injectable for
 * tests; production always uses the static launcher, Live adapter, and checker.
 */
export async function runOfficialCsvE2e({
  rawPath,
  expectedCommit,
  runId,
  taskId,
  dispatchId,
  outputRoot = DEFAULT_REPORT_ROOT,
  expected = { raw: OFFICIAL_RAW_IDENTITY, normalized: OFFICIAL_NORMALIZED_IDENTITY },
  dependencies = {},
}) {
  const deps = { ...defaultDependencies(), ...dependencies }
  const safeId = safeRunId(runId)
  const safeTask = safeTaskId(taskId)
  const safeDispatch = dispatchId === undefined ? undefined : safeDispatchId(dispatchId)
  const { attempt, directory } = await createAttempt(outputRoot, safeId)
  const reportPath = resolve(directory, 'official-csv-e2e.json')
  const report = {
    schema: REPORT_SCHEMA,
    status: 'failed',
    errorCode: null,
    runId: safeId,
    taskId: safeTask,
    ...(safeDispatch === undefined ? {} : { dispatchId: safeDispatch }),
    testedCodeSha: null,
    attempt,
    expected: {
      raw: reportIdentity(expected.raw),
      normalized: reportIdentity(expected.normalized),
    },
    stages: [],
    artifacts: [],
    seriesHydration: {
      status: 'not_attempted',
      errorCode: 'E_SERIES_HYDRATION_NOT_ATTEMPTED',
    },
    resources: null,
  }
  let session
  let resultError

  try {
    if (typeof expectedCommit !== 'string' || !COMMIT_PATTERN.test(expectedCommit)) {
      throw new RunnerError('E_COMMIT_INVALID')
    }
    const head = await deps.getHead()
    if (typeof head === 'string' && COMMIT_PATTERN.test(head)) report.testedCodeSha = head
    if (head !== expectedCommit) throw new RunnerError('E_COMMIT_MISMATCH')
    if (deps.totalMemoryBytes() < MIN_MEMORY_BYTES) throw new RunnerError('E_MEMORY_UNAVAILABLE')
    if (deps.heapLimitBytes() < MIN_HEAP_BYTES) throw new RunnerError('E_HEAP_UNAVAILABLE')

    let startedAt = Date.now()
    try {
      const metadata = await deps.statRaw(rawPath)
      assertRawMetadata(metadata, expected.raw)
      report.stages.push(stageRecord('raw_metadata', 'passed', startedAt, { bytes: metadata.size }))
    } catch (error) {
      throw stableStageError('raw_metadata', error)
    }

    startedAt = Date.now()
    let rawIdentity
    try {
      rawIdentity = await deps.inspectRaw(rawPath, deps.officialFields)
      assertIdentity(rawIdentity, expected.raw, 'RAW')
      report.stages.push(stageRecord('raw_identity', 'passed', startedAt, reportIdentity(rawIdentity)))
    } catch (error) {
      throw stableStageError('raw_identity', error)
    }

    startedAt = Date.now()
    let normalized
    let normalizedIdentity
    try {
      const rawText = await deps.readFile(rawPath, 'utf8')
      normalized = deps.normalize(rawText)
      normalizedIdentity = await deps.inspectNormalized(normalized, deps.officialFields)
      assertIdentity(normalizedIdentity, expected.normalized, 'NORMALIZED')
      report.stages.push(stageRecord('normalize', 'passed', startedAt, reportIdentity(normalizedIdentity)))
    } catch (error) {
      throw stableStageError('normalize', error)
    }

    const webPort = await deps.freeLoopbackPort()
    const analyticsPort = await deps.freeLoopbackPort()
    startedAt = Date.now()
    try {
      session = await deps.startLauncher({ mode: 'local', webPort, analyticsPort })
      if (!session?.ready || typeof session.ready.webUrl !== 'string' || typeof session.stop !== 'function') {
        throw new RunnerError('E_LAUNCHER_READY_INVALID')
      }
      report.stages.push(stageRecord('launcher', 'passed', startedAt))
    } catch (error) {
      throw stableStageError('launcher', error)
    }

    let source
    startedAt = Date.now()
    try {
      const baseUrl = deriveLiveOrigin(session.ready.webUrl)
      source = deps.createLiveDataSource({
        enabled: true,
        baseUrl,
        timeoutMs: REQUEST_TIMEOUT_MS,
      })
      report.stages.push(stageRecord('same_origin_adapter', 'passed', startedAt))
    } catch (error) {
      throw stableStageError('source', error)
    }

    let imported
    startedAt = Date.now()
    try {
      imported = await source.importCsv({ filename: 'official-timeseries.csv', text: normalized })
      assertImportBinding(imported, normalizedIdentity)
      report.stages.push(stageRecord('import', 'passed', startedAt, {
        rowCount: imported.dataset.rowCount,
        fieldCount: imported.dataset.fields.length,
        fingerprint: imported.dataset.fingerprint,
        qualityStatus: imported.quality.status,
      }))
    } catch (error) {
      throw stableStageError('import', error)
    }

    let analysis
    startedAt = Date.now()
    try {
      analysis = await source.runAnalysis(imported.dataset.datasetId)
      assertAnalysisBinding(analysis, imported)
      report.stages.push(stageRecord('analysis', 'passed', startedAt, {
        runId: analysis.runId,
        eventCount: analysis.events.length,
        analysisStatus: analysis.status,
      }))
    } catch (error) {
      throw stableStageError('analysis', error)
    }

    let submission
    startedAt = Date.now()
    try {
      submission = await source.exportSubmission(analysis.runId)
      assertExportBinding(submission, analysis.runId)
      const artifactPath = resolve(directory, 'submission.csv')
      await writeFile(artifactPath, submission.content, { encoding: 'utf8', flag: 'wx' })
      report.artifacts.push({
        ref: reportRefFor(safeId, attempt, 'submission.csv'),
        bytes: Buffer.byteLength(submission.content),
        sha256: createHash('sha256').update(submission.content).digest('hex'),
      })
      report.stages.push(stageRecord('export', 'passed', startedAt, {
        contentHash: submission.descriptor.contentHash,
      }))
    } catch (error) {
      throw stableStageError('export', error)
    }

    startedAt = Date.now()
    try {
      const check = await deps.checkSubmission(resolve(directory, 'submission.csv'))
      assertCheckerBinding(check, analysis.events.length)
      report.stages.push(stageRecord('checker', 'passed', startedAt, {
        rowCount: check.rowCount,
        columnCount: check.columns.length,
      }))
    } catch (error) {
      throw stableStageError('checker', error)
    }

    const hydrationStartedAt = Date.now()
    try {
      const workspace = await deps.hydrateWorkspace(
        source,
        [imported.dataset],
        imported.dataset,
      )
      const summary = assertSeriesHydrationBinding(workspace, imported, normalizedIdentity)
      report.seriesHydration = {
        status: 'passed',
        durationMs: Date.now() - hydrationStartedAt,
        ...summary,
      }
    } catch (error) {
      report.seriesHydration = {
        status: 'failed',
        errorCode: seriesHydrationErrorCode(error),
      }
    }

    report.status = 'passed'
  } catch (error) {
    resultError = sanitizeErrorCode(error)
    report.errorCode = resultError
  } finally {
    if (session) {
      const startedAt = Date.now()
      try {
        const stopResult = await session.stop()
        if (!isCleanStop(stopResult)) throw new RunnerError('E_CLEANUP_FAILED')
        report.stages.push(stageRecord('cleanup', 'passed', startedAt))
      } catch {
        report.stages.push(stageRecord('cleanup', 'failed', startedAt, { errorCode: 'E_CLEANUP_FAILED' }))
        report.status = 'failed'
        report.errorCode ??= 'E_CLEANUP_FAILED'
        resultError ??= 'E_CLEANUP_FAILED'
      }
    }
    report.resources = deps.getResources()
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
  }

  return {
    status: report.status,
    errorCode: report.errorCode,
    exitCode: report.status === 'passed' ? 0 : 1,
    reportPath,
    reportRef: reportRefFor(safeId, attempt, 'official-csv-e2e.json'),
    ...(resultError ? { errorCode: resultError } : {}),
  }
}

export function parseOfficialCsvE2eArgs(argumentsList) {
  const values = new Map()
  for (let index = 0; index < argumentsList.length; index += 1) {
    const flag = argumentsList[index]
    const value = argumentsList[index + 1]
    if (!['--official-csv', '--expected-commit', '--run-id', '--task-id', '--dispatch-id'].includes(flag) || value === undefined || value.startsWith('--')) {
      throw new RunnerError('E_ARGUMENTS_INVALID')
    }
    if (values.has(flag)) throw new RunnerError('E_ARGUMENTS_INVALID')
    values.set(flag, value)
    index += 1
  }
  const rawPath = values.get('--official-csv')
  const expectedCommit = values.get('--expected-commit')
  const runId = values.get('--run-id')
  const taskId = values.get('--task-id')
  const dispatchId = values.get('--dispatch-id')
  if (!rawPath || !expectedCommit || !runId || !taskId) throw new RunnerError('E_ARGUMENTS_INVALID')
  return {
    rawPath,
    expectedCommit,
    runId: safeRunId(runId),
    taskId: safeTaskId(taskId),
    ...(dispatchId === undefined ? {} : { dispatchId: safeDispatchId(dispatchId) }),
  }
}

async function main() {
  let result
  try {
    result = await runOfficialCsvE2e(parseOfficialCsvE2eArgs(process.argv.slice(2)))
  } catch (error) {
    result = { status: 'failed', errorCode: sanitizeErrorCode(error), exitCode: 1 }
  }
  console.log(JSON.stringify({
    status: result.status,
    errorCode: result.errorCode ?? null,
    exitCode: result.exitCode,
    ...(result.reportRef ? { reportRef: result.reportRef } : {}),
  }))
  process.exitCode = result.exitCode
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null
if (invokedPath === fileURLToPath(import.meta.url)) await main()
