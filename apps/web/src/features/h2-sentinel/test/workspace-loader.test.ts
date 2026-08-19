import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type {
  H2CsvImportRequest,
  H2SentinelDataSource,
} from '../../../../../../packages/h2-contracts/src/index.ts'
import {
  H2_CSV_MAX_BYTES,
  H2CsvInputError,
  importH2CsvWorkspace,
  validateH2CsvFile,
} from '../model/workspace-loader.ts'
import {
  createH2WebFixtureDataSource,
  H2_WEB_FIXTURE_RUN,
} from './fixture-data-source.ts'

describe('H2 CSV workspace loading', () => {
  it('moves a clean LIVE_ANALYSIS source from empty through import to ready', async () => {
    let imported = false
    const fixture = createH2WebFixtureDataSource()
    const dataSource: H2SentinelDataSource = {
      ...fixture,
      async getMode() {
        return 'LIVE_ANALYSIS'
      },
      async listDatasets() {
        return imported ? [H2_WEB_FIXTURE_RUN.dataset] : []
      },
      async importCsv(request: H2CsvImportRequest) {
        assert.equal(request.filename, 'first-live-run.csv')
        assert.match(request.text, /^timestamp,pcc_power_kw/m)
        imported = true
        return {
          dataset: {
            ...H2_WEB_FIXTURE_RUN.dataset,
            mode: 'LIVE_ANALYSIS',
            provenance: {
              ...H2_WEB_FIXTURE_RUN.dataset.provenance,
              mode: 'LIVE_ANALYSIS',
              source: 'local-import-test',
            },
          },
          quality: {
            ...H2_WEB_FIXTURE_RUN.quality,
            provenance: {
              ...H2_WEB_FIXTURE_RUN.quality.provenance,
              mode: 'LIVE_ANALYSIS',
              source: 'local-import-test',
            },
          },
        }
      },
    }

    assert.deepEqual(await dataSource.listDatasets(), [])
    const result = await importH2CsvWorkspace(dataSource, {
      name: 'first-live-run.csv',
      size: 42,
      async text() {
        return 'timestamp,pcc_power_kw\n2026-01-05T10:20:00Z,590\n'
      },
    })

    assert.equal(result.workspace.mode, 'LIVE_ANALYSIS')
    assert.equal(result.workspace.run.status, 'completed')
    assert.equal(result.workspace.events.length, 2)
    assert.equal(result.workspace.datasets.length, 1)
    assert.equal(result.qualityStatus, 'passed')
  })

  it('fails closed for non-CSV and oversized files before reading content', () => {
    assert.throws(
      () => validateH2CsvFile({ name: 'payload.xlsx', size: 12 }),
      (error) => error instanceof H2CsvInputError && error.code === 'invalid_type',
    )
    assert.throws(
      () => validateH2CsvFile({ name: 'too-large.csv', size: H2_CSV_MAX_BYTES + 1 }),
      (error) => error instanceof H2CsvInputError && error.code === 'too_large',
    )
  })
})

