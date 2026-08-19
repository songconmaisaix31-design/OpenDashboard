import { createHash } from 'node:crypto'

import {
  H2_ASSISTANT_QUESTIONS,
  H2_FIXTURE_ANALYSIS_RUN,
  H2_FIXTURE_ASSISTANT_ANSWER,
  H2_FIXTURE_DATASET,
  H2_FIXTURE_QUALITY_REPORT,
  H2_FIXTURE_REPORT_DESCRIPTOR,
  H2_FIXTURE_PROVENANCE,
  H2_GOLDEN_C03_EVENT,
  H2_GOLDEN_C04_EVENT,
  serializeH2SubmissionRows,
  toH2SubmissionRow,
  type H2AnomalyEvent,
  type H2AssistantRequest,
  type H2CsvImportRequest,
  type H2CsvImportResult,
  type H2EventFilter,
  type H2ReportArtifact,
  type H2ReportRequest,
  type H2SentinelDataSource,
  type H2SeriesRequest,
  type H2SeriesResponse,
} from '../../../packages/h2-contracts/src/index.ts'

import { H2EmsAdapterError } from './errors.ts'

const fixtureEvents = [H2_GOLDEN_C03_EVENT, H2_GOLDEN_C04_EVENT] as const

/**
 * Provides only immutable, sanitized contract fixtures. It deliberately does
 * not accept CSV input so a Fixture session cannot be mistaken for analysis.
 */
export function createFixtureH2EmsDataSource(): H2SentinelDataSource {
  return {
    async getMode() {
      return 'FIXTURE'
    },
    async listDatasets() {
      return [H2_FIXTURE_DATASET]
    },
    async importCsv(request: H2CsvImportRequest): Promise<H2CsvImportResult> {
      if (request.filename.length === 0 || request.text.length === 0) {
        throw new H2EmsAdapterError('invalid_fixture_request', false)
      }
      throw new H2EmsAdapterError('fixture_import_disabled', false)
    },
    async getDataQuality(datasetId) {
      assertFixtureDataset(datasetId)
      return H2_FIXTURE_QUALITY_REPORT
    },
    async runAnalysis(datasetId) {
      assertFixtureDataset(datasetId)
      return H2_FIXTURE_ANALYSIS_RUN
    },
    async getOverview(runId) {
      assertFixtureRun(runId)
      return H2_FIXTURE_ANALYSIS_RUN
    },
    async listEvents(runId, filter) {
      assertFixtureRun(runId)
      return fixtureEvents.filter((event) => matchesFilter(event, filter))
    },
    async getEvent(runId, eventId) {
      assertFixtureRun(runId)
      const event = fixtureEvents.find((item) => item.eventId === eventId)
      if (!event) throw new H2EmsAdapterError('invalid_fixture_request', false)
      return event
    },
    async getSeries(request) {
      assertFixtureRun(request.runId)
      return createFixtureSeries(request)
    },
    async ask(request) {
      assertFixtureAssistantRequest(request)
      return H2_FIXTURE_ASSISTANT_ANSWER
    },
    async exportReport(request) {
      assertFixtureRun(request.runId)
      return createFixtureReport(request)
    },
    async exportSubmission(runId) {
      assertFixtureRun(runId)
      const content = serializeH2SubmissionRows(
        fixtureEvents.map((event) => toH2SubmissionRow(event)),
      )
      return createArtifact('submission_csv', 'csv', 'h2-fixture-submission.csv', content)
    },
  }
}

function assertFixtureDataset(datasetId: string): void {
  if (datasetId !== H2_FIXTURE_DATASET.datasetId) {
    throw new H2EmsAdapterError('invalid_fixture_request', false)
  }
}

function assertFixtureRun(runId: string): void {
  if (runId !== H2_FIXTURE_ANALYSIS_RUN.runId) {
    throw new H2EmsAdapterError('invalid_fixture_request', false)
  }
}

function assertFixtureAssistantRequest(request: H2AssistantRequest): void {
  assertFixtureRun(request.runId)
  if (!H2_ASSISTANT_QUESTIONS.some(({ questionId }) => questionId === request.questionId)) {
    throw new H2EmsAdapterError('invalid_fixture_request', false)
  }
  if (request.eventId && !fixtureEvents.some((event) => event.eventId === request.eventId)) {
    throw new H2EmsAdapterError('invalid_fixture_request', false)
  }
}

function matchesFilter(event: H2AnomalyEvent, filter?: H2EventFilter): boolean {
  if (!filter) return true
  return (
    (!filter.codes || filter.codes.includes(event.code)) &&
    (!filter.severities || filter.severities.includes(event.severity)) &&
    (!filter.equipmentIds || event.affectedEquipment.some(({ id }) => filter.equipmentIds?.includes(id))) &&
    (!filter.reviewStates || filter.reviewStates.includes(event.reviewState)) &&
    (filter.minConfidence === undefined || event.confidence >= filter.minConfidence) &&
    (!filter.startsAtOrAfter || event.startTime >= filter.startsAtOrAfter) &&
    (!filter.endsAtOrBefore || event.endTime <= filter.endsAtOrBefore)
  )
}

function createFixtureSeries(request: H2SeriesRequest): H2SeriesResponse {
  if (request.variables.length === 0 || request.startTime > request.endTime) {
    throw new H2EmsAdapterError('invalid_fixture_request', false)
  }
  return {
    runId: request.runId,
    variables: [...request.variables],
    points: [],
  }
}

function createFixtureReport(request: H2ReportRequest): H2ReportArtifact {
  const event = request.eventId
    ? fixtureEvents.find((item) => item.eventId === request.eventId)
    : undefined
  if (request.eventId && !event) throw new H2EmsAdapterError('invalid_fixture_request', false)

  const content = JSON.stringify(
    {
      descriptor: H2_FIXTURE_REPORT_DESCRIPTOR,
      requestedKind: request.kind,
      event: event ?? null,
      provenance: H2_FIXTURE_PROVENANCE,
    },
    null,
    2,
  )
  return createArtifact(
    request.kind,
    'json',
    `${request.kind}-${request.runId}.json`,
    content,
    request.eventId,
  )
}

function createArtifact(
  kind: H2ReportArtifact['descriptor']['kind'],
  format: H2ReportArtifact['descriptor']['format'],
  filename: string,
  content: string,
  eventId?: string,
): H2ReportArtifact {
  const descriptor = {
    ...H2_FIXTURE_REPORT_DESCRIPTOR,
    reportId: `fixture-${kind}-${eventId ?? H2_FIXTURE_ANALYSIS_RUN.runId}`,
    kind,
    format,
    filename,
    contentHash: `sha256:${createHash('sha256').update(content).digest('hex')}`,
    ...(eventId ? { eventId } : {}),
    provenance: H2_FIXTURE_PROVENANCE,
  } as const
  return {
    descriptor,
    mediaType: format === 'csv' ? 'text/csv' : format === 'html' ? 'text/html' : 'application/json',
    content,
  }
}
