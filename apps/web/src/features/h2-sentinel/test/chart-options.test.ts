import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { EChartsCoreOption } from 'echarts/core'

import type { H2SeriesResponse } from '../../../../../../packages/h2-contracts/src/index.ts'
import {
  createEventChartOption,
  createPccChartOption,
  createQuotaChartOption,
  createSocChartOption,
  createVariableChartOption,
} from '../model/chart-options.ts'
import { evidenceFocusWindow } from '../model/presentation.ts'
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

const sliderZoom = (option: EChartsCoreOption): { readonly start: number; readonly end: number } => {
  const dataZoom = (option as { dataZoom?: readonly { readonly type?: string; readonly start?: number; readonly end?: number }[] }).dataZoom ?? []
  const slider = dataZoom.find(({ type }) => type === 'slider')
  assert(slider)
  assert(typeof slider.start === 'number')
  assert(typeof slider.end === 'number')
  return { start: slider.start, end: slider.end }
}

describe('H2 chart options', () => {
  it('uses official field labels for the golden power evidence chart', async () => {
    const c03Event = H2_WEB_FIXTURE_RUN.events.find(({ code }) => code === 'C03')
    assert(c03Event)
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

  it('plots the dedicated energy-quota view with official Chinese names', () => {
    const quotaSeries: H2SeriesResponse = {
      runId: H2_WEB_FIXTURE_RUN.runId,
      variables: [
        'grid_export_energy_used_kwh_day',
        'grid_export_energy_quota_kwh_day',
        'grid_import_energy_used_kwh_day',
        'grid_import_energy_quota_kwh_day',
      ],
      points: [
        {
          timestamp: '2026-01-05T00:00:00Z',
          values: {
            grid_export_energy_used_kwh_day: 1200,
            grid_export_energy_quota_kwh_day: 4000,
            grid_import_energy_used_kwh_day: 800,
            grid_import_energy_quota_kwh_day: 2500,
          },
        },
      ],
    }

    assert.deepEqual(seriesNames(createQuotaChartOption(quotaSeries)), [
      '当日累计上网电量',
      '当日上网电量配额',
      '当日累计下网电量',
      '当日下网电量配额',
    ])
  })

  it('skips quota series that are absent from the response', () => {
    const partialSeries: H2SeriesResponse = {
      runId: H2_WEB_FIXTURE_RUN.runId,
      variables: ['grid_export_energy_quota_kwh_day'],
      points: [
        {
          timestamp: '2026-01-05T00:00:00Z',
          values: { grid_export_energy_quota_kwh_day: 4000 },
        },
      ],
    }

    assert.deepEqual(seriesNames(createQuotaChartOption(partialSeries)), [
      '当日上网电量配额',
    ])
  })

  it('locates a timestamped evidence item to a clamped chart zoom window', async () => {
    const c03Event = H2_WEB_FIXTURE_RUN.events.find(({ code }) => code === 'C03')
    assert(c03Event)
    const measurement = c03Event.evidence.find(({ evidenceId }) => evidenceId === 'C03-EV-001')
    assert(measurement)
    const interval = c03Event.evidence.find(({ evidenceId }) => evidenceId === 'C03-EV-003')
    assert(interval)

    assert.deepEqual(evidenceFocusWindow(c03Event, measurement), {
      startTime: '2026-01-05T10:21:00.000Z',
      endTime: '2026-01-05T10:27:00.000Z',
    })
    assert.deepEqual(evidenceFocusWindow(c03Event, interval), {
      startTime: '2026-01-05T10:20:00Z',
      endTime: '2026-01-05T10:41:00Z',
    })

    const series = await seriesFor([
      'bess_power_cmd_kw',
      'bess_power_actual_kw',
      'pcc_power_actual_kw',
    ])
    const option = createEventChartOption(
      series,
      c03Event,
      evidenceFocusWindow(c03Event, measurement),
    )
    const zoom = sliderZoom(option)
    assert(Math.abs(zoom.start - 100 / 22) < 0.01)
    assert(Math.abs(zoom.end - (8 / 22) * 100) < 0.01)
  })
})
