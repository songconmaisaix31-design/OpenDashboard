import type {
  H2DatasetManifest,
  H2DatasetMode,
  H2SentinelDataSource,
} from '../../../../../../packages/h2-contracts/src/index.ts'
import type { H2Workspace } from './view-state.ts'

export const H2_CSV_MAX_BYTES = 5 * 1024 * 1024

export interface H2CsvFileInput {
  readonly name: string
  readonly size: number
  text(): Promise<string>
}

export interface H2ImportedWorkspace {
  readonly workspace: H2Workspace
  readonly qualityStatus: 'passed' | 'warning' | 'blocked'
}

export class H2CsvInputError extends Error {
  constructor(readonly code: 'invalid_type' | 'too_large') {
    super(code)
    this.name = 'H2CsvInputError'
  }
}

export async function hydrateH2Workspace(
  dataSource: H2SentinelDataSource,
  mode: H2DatasetMode,
  datasets: readonly H2DatasetManifest[],
  dataset: H2DatasetManifest,
): Promise<H2Workspace> {
  const run = await dataSource.runAnalysis(dataset.datasetId)
  const events = await dataSource.listEvents(run.runId)
  const variables = dataset.fields
    .filter(({ role }) => role === 'measurement' || role === 'constraint')
    .map(({ name }) => name)

  try {
    const series = await dataSource.getSeries({
      runId: run.runId,
      variables,
      startTime: dataset.timeRange.startTime,
      endTime: dataset.timeRange.endTime,
    })
    return { mode, datasets, run, events, series, seriesError: null }
  } catch {
    return {
      mode,
      datasets,
      run,
      events,
      series: null,
      seriesError:
        '时间序列读取失败；没有绘制占位曲线。事件、证据和安全检查仍来自规范化结果。',
    }
  }
}

export async function importH2CsvWorkspace(
  dataSource: H2SentinelDataSource,
  file: H2CsvFileInput,
): Promise<H2ImportedWorkspace> {
  validateH2CsvFile(file)
  const text = await file.text()
  const result = await dataSource.importCsv({ filename: file.name, text })
  const [mode, listedDatasets] = await Promise.all([
    dataSource.getMode(),
    dataSource.listDatasets(),
  ])
  const datasets = listedDatasets.some(
    ({ datasetId }) => datasetId === result.dataset.datasetId,
  )
    ? listedDatasets
    : [...listedDatasets, result.dataset]
  const workspace = await hydrateH2Workspace(
    dataSource,
    mode,
    datasets,
    result.dataset,
  )

  return { workspace, qualityStatus: result.quality.status }
}

export function validateH2CsvFile(
  file: Pick<H2CsvFileInput, 'name' | 'size'>,
): void {
  if (!file.name.toLocaleLowerCase('en-US').endsWith('.csv')) {
    throw new H2CsvInputError('invalid_type')
  }
  if (file.size > H2_CSV_MAX_BYTES) {
    throw new H2CsvInputError('too_large')
  }
}
