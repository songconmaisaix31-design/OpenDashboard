import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  H2_FIXTURE_ANALYSIS_RUN,
  H2_FIXTURE_ASSISTANT_ANSWER,
  H2_FIXTURE_DATASET,
  H2_FIXTURE_PROVENANCE,
  H2_FIXTURE_QUALITY_REPORT,
  H2_GOLDEN_C03_EVENT,
} from '../../../packages/h2-contracts/src/index.ts'
import {
  createFixtureH2EmsDataSource,
  createLiveH2EmsDataSource,
  H2EmsAdapterError,
} from '../src/index.ts'

type JsonRecord = Record<string, unknown>

const response = (value: unknown): Response =>
  ({
    ok: true,
    status: 200,
    json: async () => value,
  }) as Response

const envelope = (data: unknown): JsonRecord => ({
  ok: true,
  status: 'success',
  data,
  warnings: [],
  provenance: H2_FIXTURE_PROVENANCE,
})

const sourceFor = (body: unknown) =>
  createLiveH2EmsDataSource({
    enabled: true,
    baseUrl: 'http://127.0.0.1:8123/',
    fetchFn: async () => response(body),
  })

const clone = <T>(value: T): T => structuredClone(value)

async function rejectsInvalid(action: () => Promise<unknown>): Promise<void> {
  await assert.rejects(
    action,
    (error: unknown) =>
      error instanceof H2EmsAdapterError &&
      error.code === 'remote_response_invalid' &&
      !error.message.includes('password'),
  )
}

describe('H2 EMS remote response validation', () => {
  it('rejects malformed data and never exposes raw response text', async () => {
    await rejectsInvalid(() =>
      sourceFor({ invalid: 'password=not-for-ui' }).getMode(),
    )
  })

  it('enforces the closed envelope, warning, error, and provenance contracts', async () => {
    const warning = { code: 'partial', message: 'Partial result', evidenceIds: [] }
    const invalidEnvelopes: unknown[] = [
      { ...envelope('LIVE_ANALYSIS'), unexpected: true },
      { ...envelope('LIVE_ANALYSIS'), warnings: [warning] },
      { ...envelope('LIVE_ANALYSIS'), status: 'warning', warnings: [] },
      { ...envelope('LIVE_ANALYSIS'), status: 'warning', warnings: [{ ...warning, unexpected: true }] },
      { ...envelope('LIVE_ANALYSIS'), status: 'warning', warnings: [{ code: 'partial', message: 'Partial result' }] },
      { ...envelope('LIVE_ANALYSIS'), provenance: { ...H2_FIXTURE_PROVENANCE, mode: 'NOT_A_MODE' } },
      { ...envelope('LIVE_ANALYSIS'), provenance: { ...H2_FIXTURE_PROVENANCE, generatedAt: 'not-a-date' } },
      { ...envelope('LIVE_ANALYSIS'), provenance: { ...H2_FIXTURE_PROVENANCE, unexpected: true } },
      { ...envelope('LIVE_ANALYSIS'), provenance: { ...H2_FIXTURE_PROVENANCE, limitations: [7] } },
      {
        ok: false,
        status: 'error',
        error: {
          code: 'upstream_failure',
          message: 'Redacted',
          retryable: false,
          incidentId: 'incident-1',
          details: [],
          unexpected: true,
        },
        warnings: [],
        provenance: H2_FIXTURE_PROVENANCE,
      },
    ]

    for (const invalidEnvelope of invalidEnvelopes) {
      await rejectsInvalid(() => sourceFor(invalidEnvelope).getMode())
    }

    const validError = {
      ok: false,
      status: 'error',
      error: {
        code: 'upstream_failure',
        message: 'Redacted',
        retryable: true,
        incidentId: 'incident-1',
        details: [],
      },
      warnings: [warning],
      provenance: H2_FIXTURE_PROVENANCE,
    }
    await assert.rejects(
      () => sourceFor(validError).getMode(),
      (error: unknown) =>
        error instanceof H2EmsAdapterError &&
        error.code === 'remote_error' &&
        error.retryable,
    )
  })

  it('rejects the previously accepted shallow event and correlated nested mutations', async () => {
    const shallowEvent = {
      schemaVersion: 1,
      eventId: 'event-unsafe',
      code: 'C99',
      subtype: 'ANYTHING',
      title: 'Unsafe',
      startTime: '2026-01-01T00:00:00Z',
      endTime: '2026-01-01T00:01:00Z',
      firstDetectionTime: '2026-01-01T00:00:00Z',
      severity: 'extreme',
      confidence: 7,
      evidence: [],
      safetyChecks: [],
      recommendations: [],
      rootCause: 'Unknown',
      rootCauseKind: 'guess',
      reviewState: 'unchecked',
      requiresHumanConfirmation: false,
      provenance: { ...H2_FIXTURE_PROVENANCE, mode: 'NOT_A_MODE' },
    }
    await rejectsInvalid(() =>
      sourceFor(envelope(shallowEvent)).getEvent('run-1', 'event-unsafe'),
    )

    const mutations: Array<(event: JsonRecord) => void> = [
      (event) => { event.confidence = Number.NaN },
      (event) => { event.confidence = 1.01 },
      (event) => { event.firstDetectionTime = '2025-01-01T00:00:00Z' },
      (event) => { event.startTime = '2026-02-31T00:00:00Z' },
      (event) => { delete event.primaryControlObject },
      (event) => {
        ;(event.primaryControlObject as JsonRecord).type = 'UNSAFE_CONTROL'
      },
      (event) => {
        delete ((event.affectedEquipment as JsonRecord[])[0] as JsonRecord).displayName
      },
      (event) => {
        ;((event.evidence as JsonRecord[])[0] as JsonRecord).actualValue = Number.NaN
      },
      (event) => {
        ;((event.evidence as JsonRecord[])[0] as JsonRecord).kind = 'raw_secret'
      },
      (event) => { delete event.impact },
      (event) => {
        ;(event.impact as JsonRecord).metric = 'pcc_power_limit_violation_energy_kwh'
      },
      (event) => { event.subtype = 'EXPORT_POWER_LIMIT_NOT_TRACKED' },
      (event) => {
        ;((event.safetyChecks as JsonRecord[])[0] as JsonRecord).status = 'trusted'
      },
      (event) => {
        ;((event.recommendations as JsonRecord[])[0] as JsonRecord).requiresHumanConfirmation = false
      },
    ]

    for (const mutate of mutations) {
      const event = clone(H2_GOLDEN_C03_EVENT) as unknown as JsonRecord
      mutate(event)
      await rejectsInvalid(() =>
        sourceFor(envelope(event)).getEvent('run-1', H2_GOLDEN_C03_EVENT.eventId),
      )
    }
  })

  it('deeply validates dataset and quality payloads', async () => {
    const datasetMutations: Array<(dataset: JsonRecord) => void> = [
      (dataset) => { dataset.rowCount = -1 },
      (dataset) => { dataset.samplingIntervalMinutes = 0 },
      (dataset) => { dataset.fingerprint = 'not-a-sha256' },
      (dataset) => { dataset.sourceFilename = 'C:\\Users\\operator\\private.csv' },
      (dataset) => { dataset.sourceFilename = '../x.csv' },
      (dataset) => {
        dataset.timeRange = {
          startTime: '2026-01-02T00:00:00Z',
          endTime: '2026-01-01T00:00:00Z',
        }
      },
      (dataset) => {
        ;((dataset.fields as JsonRecord[])[0] as JsonRecord).role = 'secret'
      },
      (dataset) => {
        ;((dataset.fields as JsonRecord[])[0] as JsonRecord).unexpected = true
      },
    ]
    for (const mutate of datasetMutations) {
      const dataset = clone(H2_FIXTURE_DATASET) as unknown as JsonRecord
      mutate(dataset)
      await rejectsInvalid(() => sourceFor(envelope([dataset])).listDatasets())
    }

    const qualityMutations: Array<(quality: JsonRecord) => void> = [
      (quality) => { quality.status = 'trusted' },
      (quality) => { quality.rowCount = 1.5 },
      (quality) => {
        ;((quality.checks as JsonRecord[])[0] as JsonRecord).code = 'unchecked'
      },
      (quality) => {
        ;((quality.checks as JsonRecord[])[0] as JsonRecord).observedValue = Number.POSITIVE_INFINITY
      },
      (quality) => {
        ;((quality.checks as JsonRecord[])[0] as JsonRecord).provenance = { mode: 'FIXTURE' }
      },
    ]
    for (const mutate of qualityMutations) {
      const quality = clone(H2_FIXTURE_QUALITY_REPORT) as unknown as JsonRecord
      mutate(quality)
      await rejectsInvalid(() => sourceFor(envelope(quality)).getDataQuality('dataset-1'))
    }

    const importedDataset = clone(H2_FIXTURE_DATASET) as unknown as JsonRecord
    ;((importedDataset.fields as JsonRecord[])[0] as JsonRecord).required = 'yes'
    await rejectsInvalid(() =>
      sourceFor(envelope({
        dataset: importedDataset,
        quality: H2_FIXTURE_QUALITY_REPORT,
      })).importCsv({ filename: 'input.csv', text: 'timestamp\n' }),
    )
  })

  it('deeply validates analysis, series, and assistant payloads', async () => {
    const analysisMutations: Array<(run: JsonRecord) => void> = [
      (run) => { run.status = 'trusted' },
      (run) => { delete (run.eventCountsByCode as JsonRecord).C07 },
      (run) => { (run.eventCountsBySeverity as JsonRecord).critical = -1 },
      (run) => {
        ;((run.events as JsonRecord[])[0] as JsonRecord).confidence = 2
      },
    ]
    for (const mutate of analysisMutations) {
      const run = clone(H2_FIXTURE_ANALYSIS_RUN) as unknown as JsonRecord
      mutate(run)
      await rejectsInvalid(() => sourceFor(envelope(run)).getOverview('run-1'))
    }

    const invalidSeries = {
      runId: 'run-1',
      variables: ['pcc_power_kw'],
      points: [{ timestamp: 'not-a-date', values: { pcc_power_kw: Number.NaN } }],
    }
    await rejectsInvalid(() =>
      sourceFor(envelope(invalidSeries)).getSeries({
        runId: 'run-1',
        variables: ['pcc_power_kw'],
        startTime: '2026-01-01T00:00:00Z',
        endTime: '2026-01-01T00:01:00Z',
      }),
    )

    const assistantMutations: Array<(answer: JsonRecord) => void> = [
      (answer) => { answer.questionId = 'H2Q99' },
      (answer) => { answer.mode = 'UNTRUSTED_LLM' },
      (answer) => { answer.generatedAt = 'yesterday' },
      (answer) => { answer.sections = [] },
      (answer) => {
        ;((answer.sections as JsonRecord[])[0] as JsonRecord).claimKind = 'opinion'
      },
      (answer) => {
        ;((answer.citations as JsonRecord[])[0] as JsonRecord).sourceType = 'credential'
      },
    ]
    for (const mutate of assistantMutations) {
      const answer = clone(H2_FIXTURE_ASSISTANT_ANSWER) as unknown as JsonRecord
      mutate(answer)
      await rejectsInvalid(() => sourceFor(envelope(answer)).ask({
        runId: 'run-1',
        questionId: 'H2Q01',
        allowLlmRendering: false,
      }))
    }
  })

  it('rejects replayed request identities and internally contradictory payloads', async () => {
    const mismatchedImport = {
      dataset: H2_FIXTURE_DATASET,
      quality: {
        ...H2_FIXTURE_QUALITY_REPORT,
        datasetId: 'another-dataset',
        rowCount: H2_FIXTURE_QUALITY_REPORT.rowCount + 1,
      },
    }
    await rejectsInvalid(() =>
      sourceFor(envelope(mismatchedImport)).importCsv({
        filename: 'input.csv',
        text: 'timestamp\n',
      }),
    )

    const replayedQuality = {
      ...H2_FIXTURE_QUALITY_REPORT,
      datasetId: 'another-dataset',
    }
    await rejectsInvalid(() =>
      sourceFor(envelope(replayedQuality)).getDataQuality(H2_FIXTURE_DATASET.datasetId),
    )

    const mismatchedFingerprint = clone(H2_FIXTURE_DATASET) as unknown as JsonRecord
    mismatchedFingerprint.provenance = {
      ...H2_FIXTURE_PROVENANCE,
      datasetFingerprint: `sha256:${'0'.repeat(64)}`,
    }
    await rejectsInvalid(() =>
      sourceFor(envelope([mismatchedFingerprint])).listDatasets(),
    )

    const mismatchedCount = clone(H2_FIXTURE_ANALYSIS_RUN) as unknown as JsonRecord
    ;(mismatchedCount.eventCountsByCode as JsonRecord).C03 = 99
    await rejectsInvalid(() =>
      sourceFor(envelope(mismatchedCount)).getOverview(H2_FIXTURE_ANALYSIS_RUN.runId),
    )

    const replayedRun = clone(H2_FIXTURE_ANALYSIS_RUN) as unknown as JsonRecord
    ;(replayedRun.dataset as JsonRecord).datasetId = 'another-dataset'
    ;(replayedRun.quality as JsonRecord).datasetId = 'another-dataset'
    await rejectsInvalid(() =>
      sourceFor(envelope(replayedRun)).runAnalysis(H2_FIXTURE_DATASET.datasetId),
    )

    const replayedOverview = {
      ...H2_FIXTURE_ANALYSIS_RUN,
      runId: 'another-run',
    }
    await rejectsInvalid(() =>
      sourceFor(envelope(replayedOverview)).getOverview(H2_FIXTURE_ANALYSIS_RUN.runId),
    )

    const replayedEvent = {
      ...H2_GOLDEN_C03_EVENT,
      eventId: 'another-event',
    }
    await rejectsInvalid(() =>
      sourceFor(envelope(replayedEvent)).getEvent(
        H2_FIXTURE_ANALYSIS_RUN.runId,
        H2_GOLDEN_C03_EVENT.eventId,
      ),
    )

    const seriesRequest = {
      runId: H2_FIXTURE_ANALYSIS_RUN.runId,
      variables: ['pcc_power_kw', 'bess_power_kw'],
      startTime: '2026-01-05T10:20:00Z',
      endTime: '2026-01-05T10:21:00Z',
    }
    const replayedSeries = {
      runId: 'another-run',
      variables: [...seriesRequest.variables].reverse(),
      points: [{
        timestamp: seriesRequest.startTime,
        values: { pcc_power_kw: 1, bess_power_kw: 2 },
      }],
    }
    await rejectsInvalid(() =>
      sourceFor(envelope(replayedSeries)).getSeries(seriesRequest),
    )

    const assistantRequest = {
      runId: H2_FIXTURE_ASSISTANT_ANSWER.runId,
      questionId: H2_FIXTURE_ASSISTANT_ANSWER.questionId,
      eventId: H2_FIXTURE_ASSISTANT_ANSWER.eventId,
      allowLlmRendering: false,
    }
    const replayedAnswer = {
      ...H2_FIXTURE_ASSISTANT_ANSWER,
      runId: 'another-run',
    }
    await rejectsInvalid(() =>
      sourceFor(envelope(replayedAnswer)).ask(assistantRequest),
    )

    const forbiddenLlmAnswer = {
      ...H2_FIXTURE_ASSISTANT_ANSWER,
      mode: 'LLM_RENDERED',
    }
    await rejectsInvalid(() =>
      sourceFor(envelope(forbiddenLlmAnswer)).ask(assistantRequest),
    )

    const falseControlBoundary = {
      ...H2_FIXTURE_ASSISTANT_ANSWER,
      refusedControlClaim: false,
    }
    await rejectsInvalid(() =>
      sourceFor(envelope(falseControlBoundary)).ask(assistantRequest),
    )
  })

  it('correlates report kind, format, media type, filename, status, and content hash', async () => {
    const valid = await createFixtureH2EmsDataSource().exportReport({
      runId: H2_FIXTURE_ANALYSIS_RUN.runId,
      kind: 'single_event_diagnosis',
      eventId: H2_GOLDEN_C03_EVENT.eventId,
    })
    const mutations: Array<(artifact: JsonRecord) => void> = [
      (artifact) => { (artifact.descriptor as JsonRecord).format = 'json' },
      (artifact) => { artifact.mediaType = 'application/json' },
      (artifact) => { (artifact.descriptor as JsonRecord).filename = 'diagnosis.json' },
      (artifact) => { (artifact.descriptor as JsonRecord).status = 'trusted' },
      (artifact) => { (artifact.descriptor as JsonRecord).generatedAt = 'invalid-date' },
      (artifact) => { (artifact.descriptor as JsonRecord).kind = 'unknown_report' },
      (artifact) => { (artifact.descriptor as JsonRecord).unexpected = true },
      (artifact) => { artifact.content = `${valid.content}\ntampered` },
    ]

    for (const mutate of mutations) {
      const artifact = clone(valid) as unknown as JsonRecord
      mutate(artifact)
      await rejectsInvalid(() =>
        sourceFor(envelope(artifact)).exportReport({
          runId: H2_FIXTURE_ANALYSIS_RUN.runId,
          kind: 'single_event_diagnosis',
          eventId: H2_GOLDEN_C03_EVENT.eventId,
        }),
      )
    }

    const replayed = clone(valid) as unknown as JsonRecord
    ;(replayed.descriptor as JsonRecord).runId = 'another-run'
    ;(replayed.descriptor as JsonRecord).contentHash = valid.descriptor.contentHash
    await rejectsInvalid(() =>
      sourceFor(envelope(replayed)).exportReport({
        runId: H2_FIXTURE_ANALYSIS_RUN.runId,
        kind: 'single_event_diagnosis',
        eventId: H2_GOLDEN_C03_EVENT.eventId,
      }),
    )

    await rejectsInvalid(() =>
      sourceFor(envelope(valid)).exportSubmission(H2_FIXTURE_ANALYSIS_RUN.runId),
    )

    const period = await createFixtureH2EmsDataSource().exportReport({
      runId: H2_FIXTURE_ANALYSIS_RUN.runId,
      kind: 'period_summary',
    })
    const periodWithUnexpectedEvent = clone(period) as unknown as JsonRecord
    ;(periodWithUnexpectedEvent.descriptor as JsonRecord).eventId = H2_GOLDEN_C03_EVENT.eventId
    await rejectsInvalid(() =>
      sourceFor(envelope(periodWithUnexpectedEvent)).exportReport({
        runId: H2_FIXTURE_ANALYSIS_RUN.runId,
        kind: 'period_summary',
      }),
    )
  })
})
