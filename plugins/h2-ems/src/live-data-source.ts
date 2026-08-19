import type {
  H2AnalysisRun,
  H2AnomalyEvent,
  H2AssistantAnswer,
  H2CsvImportResult,
  H2DataQualityReport,
  H2DatasetManifest,
  H2DatasetMode,
  H2ReportArtifact,
  H2SentinelDataSource,
  H2SeriesResponse,
} from '../../../packages/h2-contracts/src/index.ts'

import { H2EmsAdapterError } from './errors.ts'

export interface H2EmsLiveAdapterOptions {
  readonly enabled: true
  readonly baseUrl: string
  readonly timeoutMs?: number
  readonly signal?: AbortSignal
  readonly fetchFn?: typeof fetch
}

export const H2_EMS_LIVE_ROUTES = {
  mode: '/api/v1/h2-sentinel/mode',
  datasets: '/api/v1/h2-sentinel/datasets',
  importCsv: '/api/v1/h2-sentinel/datasets:import',
  quality: '/api/v1/h2-sentinel/datasets/quality',
  analysis: '/api/v1/h2-sentinel/datasets:analyze',
  overview: '/api/v1/h2-sentinel/runs/overview',
  events: '/api/v1/h2-sentinel/runs/events',
  event: '/api/v1/h2-sentinel/runs/event',
  series: '/api/v1/h2-sentinel/runs/series',
  assistant: '/api/v1/h2-sentinel/assistant:ask',
  report: '/api/v1/h2-sentinel/reports:export',
  submission: '/api/v1/h2-sentinel/submissions:export',
} as const

/**
 * Creates the sole Live boundary. It is opt-in, literal-loopback-only, and
 * maps every remote failure to a redacted local error.
 */
export function createLiveH2EmsDataSource(
  options: H2EmsLiveAdapterOptions,
): H2SentinelDataSource {
  if (options.enabled !== true) {
    throw new H2EmsAdapterError('live_adapter_disabled', false)
  }
  const baseUrl = validateLoopbackUrl(options.baseUrl)
  const timeoutMs = validateTimeout(options.timeoutMs)
  const fetchFn = options.fetchFn ?? fetch

  const request = <T>(
    route: string,
    payload: unknown,
    guard: (value: unknown) => value is T,
  ): Promise<T> => requestEnvelope(baseUrl, route, payload, guard, fetchFn, timeoutMs, options.signal)

  return {
    getMode: () => request(H2_EMS_LIVE_ROUTES.mode, undefined, isDatasetMode),
    listDatasets: () => request(H2_EMS_LIVE_ROUTES.datasets, undefined, isDatasetArray),
    importCsv: (input) => request(H2_EMS_LIVE_ROUTES.importCsv, input, isCsvImportResult),
    getDataQuality: (datasetId) => request(H2_EMS_LIVE_ROUTES.quality, { datasetId }, isQualityReport),
    runAnalysis: (datasetId) => request(H2_EMS_LIVE_ROUTES.analysis, { datasetId }, isAnalysisRun),
    getOverview: (runId) => request(H2_EMS_LIVE_ROUTES.overview, { runId }, isAnalysisRun),
    listEvents: (runId, filter) => request(H2_EMS_LIVE_ROUTES.events, { runId, ...(filter ? { filter } : {}) }, isEventArray),
    getEvent: (runId, eventId) => request(H2_EMS_LIVE_ROUTES.event, { runId, eventId }, isEvent),
    getSeries: (input) => request(H2_EMS_LIVE_ROUTES.series, input, isSeriesResponse),
    ask: (input) => request(H2_EMS_LIVE_ROUTES.assistant, input, isAssistantAnswer),
    exportReport: (input) => request(H2_EMS_LIVE_ROUTES.report, input, isReportArtifact),
    exportSubmission: (runId) => request(H2_EMS_LIVE_ROUTES.submission, { runId }, isReportArtifact),
  }
}

function validateLoopbackUrl(input: string): URL {
  let parsed: URL
  try {
    parsed = new URL(input)
  } catch {
    throw new H2EmsAdapterError('invalid_loopback_url', false)
  }
  const host = parsed.hostname.toLowerCase()
  if (
    (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') ||
    (host !== '127.0.0.1' && host !== '[::1]' && host !== '::1') ||
    parsed.username !== '' ||
    parsed.password !== '' ||
    parsed.pathname !== '/' ||
    parsed.search !== '' ||
    parsed.hash !== ''
  ) {
    throw new H2EmsAdapterError('invalid_loopback_url', false)
  }
  return parsed
}

function validateTimeout(value: number | undefined): number {
  const timeoutMs = value ?? 5_000
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30_000) {
    throw new H2EmsAdapterError('remote_response_invalid', false)
  }
  return timeoutMs
}

async function requestEnvelope<T>(
  baseUrl: URL,
  route: string,
  payload: unknown,
  guard: (value: unknown) => value is T,
  fetchFn: typeof fetch,
  timeoutMs: number,
  upstreamSignal: AbortSignal | undefined,
): Promise<T> {
  const controller = new AbortController()
  let upstreamAbort: (() => void) | undefined
  if (upstreamSignal) {
    upstreamAbort = () => controller.abort('upstream-abort')
    if (upstreamSignal.aborted) upstreamAbort()
    else upstreamSignal.addEventListener('abort', upstreamAbort, { once: true })
  }
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs)
  try {
    if (controller.signal.aborted) {
      throw new H2EmsAdapterError('request_aborted', false)
    }
    const init: RequestInit =
      payload === undefined
        ? { method: 'GET', signal: controller.signal }
        : {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
          }
    const response = await fetchFn(new URL(route, baseUrl), init)
    if (!response.ok) throw new H2EmsAdapterError('remote_request_failed', response.status >= 500)
    let body: unknown
    try {
      body = await response.json()
    } catch {
      throw new H2EmsAdapterError('remote_response_invalid', false)
    }
    return unwrapEnvelope(body, guard)
  } catch (error: unknown) {
    if (error instanceof H2EmsAdapterError) throw error
    if (controller.signal.aborted) {
      throw new H2EmsAdapterError(
        controller.signal.reason === 'timeout' ? 'request_timeout' : 'request_aborted',
        controller.signal.reason === 'timeout',
      )
    }
    throw new H2EmsAdapterError('remote_request_failed', true)
  } finally {
    clearTimeout(timer)
    if (upstreamSignal && upstreamAbort) upstreamSignal.removeEventListener('abort', upstreamAbort)
  }
}

function unwrapEnvelope<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
): T {
  if (!isRecord(value) || !isProvenance(value.provenance) || !Array.isArray(value.warnings)) {
    throw new H2EmsAdapterError('remote_response_invalid', false)
  }
  if (value.ok === false && value.status === 'error' && isRedactedError(value.error)) {
    throw new H2EmsAdapterError('remote_error', value.error.retryable)
  }
  if ((value.status !== 'success' && value.status !== 'warning') || value.ok !== true || !('data' in value) || !guard(value.data)) {
    throw new H2EmsAdapterError('remote_response_invalid', false)
  }
  return value.data
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every(isString)
}

function isProvenance(value: unknown): boolean {
  return isRecord(value) && isString(value.mode) && isString(value.source) && isString(value.generatedAt) && isStringArray(value.limitations)
}

function isRedactedError(value: unknown): value is { readonly retryable: boolean } {
  return isRecord(value) && isString(value.code) && isString(value.message) && typeof value.retryable === 'boolean' && isString(value.incidentId) && isStringArray(value.details)
}

function isDatasetMode(value: unknown): value is H2DatasetMode {
  return value === 'FIXTURE' || value === 'LIVE_ANALYSIS'
}

function isDataset(value: unknown): value is H2DatasetManifest {
  return isRecord(value) && value.schemaVersion === 1 && isString(value.datasetId) && isString(value.name) && isDatasetMode(value.mode) && isString(value.sourceFilename) && isString(value.fingerprint) && isFiniteNumber(value.rowCount) && isTimeRange(value.timeRange) && isFiniteNumber(value.samplingIntervalMinutes) && Array.isArray(value.fields) && value.fields.every(isRecord) && isProvenance(value.provenance)
}

function isDatasetArray(value: unknown): value is readonly H2DatasetManifest[] {
  return Array.isArray(value) && value.every(isDataset)
}

function isQualityReport(value: unknown): value is H2DataQualityReport {
  return isRecord(value) && value.schemaVersion === 1 && isString(value.reportId) && isString(value.datasetId) && isString(value.status) && isString(value.generatedAt) && isFiniteNumber(value.rowCount) && isTimeRange(value.timeRange) && Array.isArray(value.checks) && isStringArray(value.warnings) && isStringArray(value.blockingReasons) && isProvenance(value.provenance)
}

function isEvent(value: unknown): value is H2AnomalyEvent {
  return isRecord(value) && value.schemaVersion === 1 && isString(value.eventId) && isString(value.code) && isString(value.subtype) && isString(value.title) && isString(value.startTime) && isString(value.endTime) && isString(value.firstDetectionTime) && isString(value.severity) && isFiniteNumber(value.confidence) && Array.isArray(value.evidence) && Array.isArray(value.safetyChecks) && Array.isArray(value.recommendations) && isString(value.rootCause) && isString(value.rootCauseKind) && isString(value.reviewState) && typeof value.requiresHumanConfirmation === 'boolean' && isProvenance(value.provenance)
}

function isEventArray(value: unknown): value is readonly H2AnomalyEvent[] {
  return Array.isArray(value) && value.every(isEvent)
}

function isAnalysisRun(value: unknown): value is H2AnalysisRun {
  return isRecord(value) && value.schemaVersion === 1 && isString(value.runId) && isDataset(value.dataset) && isQualityReport(value.quality) && isString(value.status) && isString(value.startedAt) && isRecord(value.eventCountsByCode) && isRecord(value.eventCountsBySeverity) && isEventArray(value.events) && isStringArray(value.warnings) && isProvenance(value.provenance)
}

function isTimeRange(value: unknown): boolean {
  return isRecord(value) && isString(value.startTime) && isString(value.endTime)
}

function isSeriesResponse(value: unknown): value is H2SeriesResponse {
  return isRecord(value) && isString(value.runId) && isStringArray(value.variables) && Array.isArray(value.points) && value.points.every((point) => isRecord(point) && isString(point.timestamp) && isRecord(point.values))
}

function isAssistantAnswer(value: unknown): value is H2AssistantAnswer {
  return isRecord(value) && value.schemaVersion === 1 && isString(value.answerId) && isString(value.runId) && isString(value.questionId) && isString(value.mode) && isString(value.generatedAt) && Array.isArray(value.sections) && Array.isArray(value.citations) && typeof value.refusedControlClaim === 'boolean' && isProvenance(value.provenance)
}

function isCsvImportResult(value: unknown): value is H2CsvImportResult {
  return isRecord(value) && isDataset(value.dataset) && isQualityReport(value.quality)
}

function isReportArtifact(value: unknown): value is H2ReportArtifact {
  if (!isRecord(value) || !isRecord(value.descriptor) || !isString(value.content) || value.content.length > 2_000_000) return false
  const descriptor = value.descriptor
  const mediaType = value.mediaType
  return descriptor.schemaVersion === 1 && isString(descriptor.reportId) && isString(descriptor.runId) && isString(descriptor.kind) && isString(descriptor.format) && isString(descriptor.status) && isString(descriptor.generatedAt) && isSafeFilename(descriptor.filename) && isHash(descriptor.contentHash) && isStringArray(descriptor.warnings) && isString(descriptor.safetyDisclaimer) && isProvenance(descriptor.provenance) && isReportMediaType(mediaType, descriptor.format)
}

function isSafeFilename(value: unknown): boolean {
  return isString(value) && !/[\\/:]/.test(value) && !value.includes('..')
}

function isHash(value: unknown): boolean {
  return isString(value) && /^sha256:[a-f0-9]{64}$/.test(value)
}

function isReportMediaType(value: unknown, format: unknown): boolean {
  return (format === 'html' && value === 'text/html') || (format === 'json' && value === 'application/json') || (format === 'csv' && value === 'text/csv')
}
