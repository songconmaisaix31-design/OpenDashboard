import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { EChartsCoreOption } from 'echarts/core'

import type { H2SeriesResponse } from '../../../../../../packages/h2-contracts/src/index.ts'
import {
  createEventChartOption,
  createPccChartOption,
  createSocChartOption,
  createVariableChartOption,
} from '../model/chart-options.ts'
import { H2_WEB_FIXTURE_RUN } from './fixture-data-source.ts'
import { createH2WebFixtureDataSource } from './fixture-data-source.ts'

const seriesFor = async (variables: readonly string[]): Promise<H2SeriesResponse> =>
  createH2WebFixtureDataSource().getSeries({
    runId: H2_WEB_FIXTURE_RUN.runId,
    variables,
    startTime: H2_WEB_FIXTURE_RUN.dataset.timeRange.startTime,
    endTime: H2_WEB_FIXTURE_RUN.dataset.timeRange.endTime,
  })

const seriesNames = (option: EChartsCoreOption): readonly string[] =>
  ((option as { series?: readonly { readonly name?: string }[] }).series ?? [])
    .map(({ name }) => name ?? '')
    .filter(Boolean)

describe('H2 chart options', () => {
  it('uses official field labels for the golden power evidence chart', async () => {
    const c03Event = H2_WEB_FIXTURE_RUN.events[0]
    const series = await seriesFor([
      'bess_power_cmd_kw',
      'bess_power_actual_kw',
      'pcc_power_actual_kw',
    ])

    assert.deepEqual(seriesNames(createEventChartOption(series, c03Event)), [
      '储能功率指令',
      '储能实际功率',
      'PCC实际有功功率',
    ])
  })

  it('plots the official boundary and SOC variables with units', async () => {
    const pccSeries = await seriesFor([
      'pcc_power_actual_kw',
      'grid_export_power_limit_kw',
      'grid_import_power_limit_kw',
    ])
    const socSeries = await seriesFor(['soc_target_pct', 'bess_soc_pct'])

    assert.deepEqual(seriesNames(createPccChartOption(pccSeries)), [
      'PCC实际有功功率',
      '上网功率上限',
      '下网功率上限',
    ])
    assert.deepEqual(seriesNames(createSocChartOption(socSeries)), [
      '储能目标SOC',
      '储能实际SOC',
    ])
  })

  it('shows the official Chinese name and unit in the variable explorer chart', async () => {
    const field = H2_WEB_FIXTURE_RUN.dataset.fields.find(
      ({ name }) => name === 'bess_soc_pct',
    )
    assert(field)
    const series = await seriesFor(['bess_soc_pct'])

    assert.deepEqual(seriesNames(createVariableChartOption(series, field)), [
      '储能实际SOC',
    ])
  })
})
