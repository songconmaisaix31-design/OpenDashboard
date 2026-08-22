import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { describe, it } from 'node:test'

import type {
  H2AnalysisRun,
  H2AnomalyEvent,
  H2CsvImportRequest,
  H2DatasetField,
  H2EvidenceItem,
  H2SentinelDataSource,
} from '../../../../../../packages/h2-contracts/src/index.ts'
import {
  H2_CSV_MAX_BYTES,
  H2CsvInputError,
  hydrateH2Workspace,
  importH2CsvWorkspace,
  validateH2CsvFile,
} from '../model/workspace-loader.ts'
import {
  createH2WebFixtureDataSource,
  H2_WEB_FIXTURE_RUN,
} from './fixture-data-source.ts'

describe('H2 CSV workspace loading', () => {
  it('bounds a 69-field run to the ordered baseline and real event evidence', async () => {
    const baseline = [
      'pcc_power_actual_kw',
      'grid_export_power_limit_kw',
      'grid_import_power_limit_kw',
      'soc_target_pct',
      'bess_soc_pct',
      'grid_export_energy_used_kwh_day',
      'grid_export_energy_quota_kwh_day',
      'grid_import_energy_used_kwh_day',
      'grid_import_energy_quota_kwh_day',
    ] as const
    const evidenceVariables = Array.from(
      { length: 30 },
      (_, index) => `evidence_measurement_${String(index).padStart(2, '0')}`,
    )
    const fields: readonly H2DatasetField[] = [
      ...baseline,
      ...evidenceVariables,
      ...Array.from(
        { length: 28 },
        (_, index) => `unrelated_measurement_${String(index).padStart(2, '0')}`,
      ),
    ].map((name) => ({
      name,
      displayNameZh: name,
      role: 'measurement',
      required: false,
    }))
    const nonChartableFields: readonly H2DatasetField[] = [
      { name: 'label_only', displayNameZh: 'label', role: 'label', required: false },
      { name: 'metadata_only', displayNameZh: 'metadata', role: 'metadata', required: false },
    ]
    assert.equal(fields.length + nonChartableFields.length, 69)

    const { evidence, event } = fixtureEventAndEvidence()
    const events: readonly H2AnomalyEvent[] = [
      {
        ...event,
        evidence: [
          { ...evidence, variable: 'unknown_field' },
          { ...evidence, variable: 'label_only' },
          { ...evidence, variable: 'metadata_only' },
          { ...evidence, variable: baseline[0] },
          ...evidenceVariables.flatMap((variable) => [
            { ...evidence, variable },
            { ...evidence, variable },
          ]),
        ],
      },
    ]
    const run: H2AnalysisRun = {
      ...H2_WEB_FIXTURE_RUN,
      dataset: {
        ...H2_WEB_FIXTURE_RUN.dataset,
        fields: [...fields, ...nonChartableFields],
      },
      events,
    }
    let requestedVariables: readonly string[] = []
    const fixture = createH2WebFixtureDataSource()
    const dataSource: H2SentinelDataSource = {
      ...fixture,
      async runAnalysis() {
        return run
      },
      async getSeries(request) {
        requestedVariables = request.variables
        assert.ok(request.variables.length <= 32, 'the analytics request rejects more than 32 variables')
        return { runId: request.runId, variables: request.variables, points: [] }
      },
    }

    const workspace = await hydrateH2Workspace(dataSource, [run.dataset], run.dataset)

    assert.notEqual(workspace.series, null)
    assert.deepEqual(requestedVariables, [...baseline, ...evidenceVariables.slice(0, 23)])
    assert.equal(new Set(requestedVariables).size, requestedVariables.length)
    assert.ok(!requestedVariables.includes('unknown_field'))
    assert.ok(!requestedVariables.includes('label_only'))
    assert.ok(!requestedVariables.includes('metadata_only'))
    assert.ok(!requestedVariables.some((variable) => variable.startsWith('unrelated_measurement_')))
  })

  it('falls back to the first chartable dataset field when the preferred fields are unavailable', async () => {
    const fallbackField: H2DatasetField = {
      name: 'available_measurement',
      displayNameZh: 'available measurement',
      role: 'measurement',
      required: false,
    }
    const { evidence, event } = fixtureEventAndEvidence()
    const run: H2AnalysisRun = {
      ...H2_WEB_FIXTURE_RUN,
      dataset: {
        ...H2_WEB_FIXTURE_RUN.dataset,
        fields: [
          { name: 'timestamp', displayNameZh: 'timestamp', role: 'timestamp' as const, required: true },
          fallbackField,
        ],
      },
      events: [
        {
          ...event,
          evidence: [{ ...evidence, variable: 'unknown_field' }],
        },
      ],
    }
    let requestedVariables: readonly string[] = []
    const fixture = createH2WebFixtureDataSource()
    const dataSource: H2SentinelDataSource = {
      ...fixture,
      async runAnalysis() {
        return run
      },
      async getSeries(request) {
        requestedVariables = request.variables
        return { runId: request.runId, variables: request.variables, points: [] }
      },
    }

    await hydrateH2Workspace(dataSource, [run.dataset], run.dataset)

    assert.deepEqual(requestedVariables, [fallbackField.name])
  })

  it('hydrates from the request-bound run events without listing another snapshot', async () => {
    let listEventsCalls = 0
    const fixture = createH2WebFixtureDataSource()
    const dataSource: H2SentinelDataSource = {
      ...fixture,
      async listEvents() {
        listEventsCalls += 1
        throw new Error('A second event snapshot must not replace run.events.')
      },
    }

    const workspace = await hydrateH2Workspace(
      dataSource,
      [H2_WEB_FIXTURE_RUN.dataset],
      H2_WEB_FIXTURE_RUN.dataset,
    )

    assert.equal(listEventsCalls, 0)
    assert.strictEqual(workspace.events, H2_WEB_FIXTURE_RUN.events)
  })

  it('keeps an existing ready workspace aligned with its Fixture run', async () => {
    const fixture = createH2WebFixtureDataSource()
    const dataSource: H2SentinelDataSource = {
      ...fixture,
      async getMode() {
        return 'LIVE_ANALYSIS'
      },
    }
    assert.equal(await dataSource.getMode(), 'LIVE_ANALYSIS')
    const workspace = await hydrateH2Workspace(
      dataSource,
      [H2_WEB_FIXTURE_RUN.dataset],
      H2_WEB_FIXTURE_RUN.dataset,
    )

    assert.equal(workspace.mode, 'FIXTURE')
    assert.equal(workspace.run.dataset.mode, 'FIXTURE')
    assert.equal(workspace.run.dataset.provenance.mode, 'FIXTURE')
    assert.equal(workspace.run.provenance.mode, 'FIXTURE')
  })

  it('keeps the canonical CSV Fixture-provenanced on a local transport', async () => {
    let imported = false
    let transportModeReads = 0
    const fixture = createH2WebFixtureDataSource()
    const csv = await readFile(
      new URL('../../../../../../packages/h2-contracts/fixtures/tiny-valid-timeseries.csv', import.meta.url),
      'utf8',
    )
    const dataSource: H2SentinelDataSource = {
      ...fixture,
      async getMode() {
        transportModeReads += 1
        return 'LIVE_ANALYSIS'
      },
      async listDatasets() {
        return imported ? [H2_WEB_FIXTURE_RUN.dataset] : []
      },
      async importCsv(request: H2CsvImportRequest) {
        assert.equal(request.filename, 'tiny-valid-timeseries.csv')
        assert.equal(request.text, csv)
        imported = true
        return {
          dataset: H2_WEB_FIXTURE_RUN.dataset,
          quality: H2_WEB_FIXTURE_RUN.quality,
        }
      },
    }

    const result = await importH2CsvWorkspace(dataSource, {
      name: 'tiny-valid-timeseries.csv',
      size: Buffer.byteLength(csv),
      async text() {
        return csv
      },
    })

    assert.equal(result.workspace.mode, 'FIXTURE')
    assert.equal(result.workspace.run.dataset.mode, 'FIXTURE')
    assert.equal(result.workspace.run.dataset.provenance.mode, 'FIXTURE')
    assert.equal(result.workspace.run.provenance.mode, 'FIXTURE')
    assert.equal(transportModeReads, 0)
  })

  it('moves a clean LIVE_ANALYSIS source from empty through import to ready', async () => {
    let imported = false
    const fixture = createH2WebFixtureDataSource()
    const liveProvenance = {
      ...H2_WEB_FIXTURE_RUN.provenance,
      mode: 'LIVE_ANALYSIS',
      source: 'local-import-test',
    } as const
    const liveDataset = {
      ...H2_WEB_FIXTURE_RUN.dataset,
      mode: 'LIVE_ANALYSIS',
      provenance: liveProvenance,
    } as const
    const liveRun = {
      ...H2_WEB_FIXTURE_RUN,
      dataset: liveDataset,
      quality: {
        ...H2_WEB_FIXTURE_RUN.quality,
        provenance: liveProvenance,
      },
      provenance: liveProvenance,
    }
    const dataSource: H2SentinelDataSource = {
      ...fixture,
      async getMode() {
        return 'LIVE_ANALYSIS'
      },
      async listDatasets() {
        return imported ? [liveDataset] : []
      },
      async importCsv(request: H2CsvImportRequest) {
        assert.equal(request.filename, 'first-live-run.csv')
        assert.match(request.text, /^timestamp,pv_actual_kw/m)
        imported = true
        return {
          dataset: liveDataset,
          quality: {
            ...liveRun.quality,
          },
        }
      },
      async runAnalysis(datasetId: string) {
        assert.equal(datasetId, liveDataset.datasetId)
        return liveRun
      },
    }

    assert.deepEqual(await dataSource.listDatasets(), [])
    const result = await importH2CsvWorkspace(dataSource, {
      name: 'first-live-run.csv',
      size: 42,
      async text() {
        return 'timestamp,pv_actual_kw\n2026-01-05T10:20:00Z,820\n'
      },
    })

    assert.equal(result.workspace.mode, 'LIVE_ANALYSIS')
    assert.equal(result.workspace.run.dataset.mode, 'LIVE_ANALYSIS')
    assert.equal(result.workspace.run.dataset.provenance.mode, 'LIVE_ANALYSIS')
    assert.equal(result.workspace.run.provenance.mode, 'LIVE_ANALYSIS')
    assert.equal(result.workspace.run.status, 'completed')
    assert.equal(result.workspace.events.length, 2)
    assert.equal(result.workspace.datasets.length, 1)
    assert.equal(result.qualityStatus, 'passed')
  })

  it('accepts the official CSV byte size and the exact local analytics boundary', () => {
    assert.doesNotThrow(() => validateH2CsvFile({ name: 'official.csv', size: 77_865_257 }))
    assert.doesNotThrow(() => validateH2CsvFile({ name: 'at-limit.csv', size: H2_CSV_MAX_BYTES }))
  })

  it('fails invalid or oversized files before reading content or calling the data source', async () => {
    const fixture = createH2WebFixtureDataSource()
    const cases = [
      { code: 'invalid_type' as const, name: 'payload.xlsx', size: 12 },
      { code: 'too_large' as const, name: 'too-large.csv', size: H2_CSV_MAX_BYTES + 1 },
    ]

    for (const testCase of cases) {
      let textCalls = 0
      let dataSourceCalls = 0
      const dataSource: H2SentinelDataSource = {
        ...fixture,
        async importCsv() {
          dataSourceCalls += 1
          throw new Error('The input guard must run before the data source.')
        },
      }

      await assert.rejects(
        () => importH2CsvWorkspace(dataSource, {
          name: testCase.name,
          size: testCase.size,
          async text() {
            textCalls += 1
            return 'must not be read'
          },
        }),
        (error) => error instanceof H2CsvInputError && error.code === testCase.code,
      )
      assert.equal(textCalls, 0)
      assert.equal(dataSourceCalls, 0)
    }
  })
})

function fixtureEventAndEvidence(): {
  readonly event: H2AnomalyEvent
  readonly evidence: H2EvidenceItem
} {
  const event = H2_WEB_FIXTURE_RUN.events[0]
  assert.ok(event, 'The H2 Fixture must provide an event for workspace-loader tests.')
  const evidence = event.evidence[0]
  assert.ok(evidence, 'The H2 Fixture event must provide evidence for workspace-loader tests.')
  return { event, evidence }
}
