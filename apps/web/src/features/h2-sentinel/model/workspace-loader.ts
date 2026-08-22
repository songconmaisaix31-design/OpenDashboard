import type {
  H2AnalysisRun,
  H2DatasetManifest,
  H2SentinelDataSource,
} from '../../../../../../packages/h2-contracts/src/index.ts'
import type { H2Workspace } from './view-state.ts'

/** Matches the local analytics import boundary before browser content is read. */
export const H2_CSV_MAX_BYTES = 300 * 1024 * 1024

const H2_SERIES_MAX_VARIABLES = 32

const H2_SERIES_BASELINE_VARIABLES = [
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
  datasets: readonly H2DatasetManifest[],
  dataset: H2DatasetManifest,
): Promise<H2Workspace> {
  const run = await dataSource.runAnalysis(dataset.datasetId)
  const events = run.events
  const variables = selectH2SeriesVariables(run)

  try {
    const series = await dataSource.getSeries({
      runId: run.runId,
      variables,
      startTime: run.dataset.timeRange.startTime,
      endTime: run.dataset.timeRange.endTime,
    })
    return {
      mode: run.dataset.mode,
      datasets,
      run,
      events,
      series,
      seriesError: null,
    }
  } catch {
    return {
      mode: run.dataset.mode,
      datasets,
      run,
      events,
      series: null,
      seriesError:
        '时间序列读取失败；没有绘制占位曲线。事件、证据和安全检查仍来自规范化结果。',
    }
  }
}

function selectH2SeriesVariables(run: H2AnalysisRun): readonly string[] {
  const chartableFields = run.dataset.fields.filter(
    ({ role }) => role === 'measurement' || role === 'constraint',
  )
  const chartableNames = new Set(chartableFields.map(({ name }) => name))
  const variables: string[] = []

  const appendIfChartable = (variable: string | undefined): void => {
    if (
      variable !== undefined &&
      chartableNames.has(variable) &&
      !variables.includes(variable) &&
      variables.length < H2_SERIES_MAX_VARIABLES
    ) {
      variables.push(variable)
    }
  }

  for (const variable of H2_SERIES_BASELINE_VARIABLES) {
    appendIfChartable(variable)
  }
  for (const event of run.events) {
    for (const evidence of event.evidence) {
      appendIfChartable(evidence.variable)
    }
  }

  // A valid dataset with no preferred/evidenced fields remains explorable.
  if (variables.length === 0 && chartableFields[0]) {
    variables.push(chartableFields[0].name)
  }

  return variables
}

export async function importH2CsvWorkspace(
  dataSource: H2SentinelDataSource,
  file: H2CsvFileInput,
): Promise<H2ImportedWorkspace> {
  validateH2CsvFile(file)
  const text = await file.text()
  const result = await dataSource.importCsv({ filename: file.name, text })
  const listedDatasets = await dataSource.listDatasets()
  const datasets = listedDatasets.some(
    ({ datasetId }) => datasetId === result.dataset.datasetId,
  )
    ? listedDatasets
    : [...listedDatasets, result.dataset]
  const workspace = await hydrateH2Workspace(
    dataSource,
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
