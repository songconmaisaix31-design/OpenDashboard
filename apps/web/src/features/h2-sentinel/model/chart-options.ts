import type { EChartsCoreOption } from 'echarts/core'

import type {
  H2AnomalyEvent,
  H2DatasetField,
  H2SeriesResponse,
} from '../../../../../../packages/h2-contracts/src/index.ts'
import {
  formatH2FieldLabel,
  formatH2FieldUnit,
  formatH2Timestamp,
  type H2ChartFocusWindow,
} from './presentation.ts'

const COLORS = ['#49d6bd', '#ffb45d', '#8ea9ff', '#f3778f', '#b393ff'] as const

interface SeriesDefinition {
  readonly variable: string
  readonly label?: string
  readonly color: string
  readonly dashed?: boolean
}

const powerSeriesByCode = {
  C03: [
    {
      variable: 'bess_power_cmd_kw',
      color: COLORS[1],
      dashed: true,
    },
    { variable: 'bess_power_actual_kw', color: COLORS[0] },
    { variable: 'pcc_power_actual_kw', color: COLORS[2] },
  ],
  C04: [
    { variable: 'pcc_power_actual_kw', color: COLORS[3] },
    {
      variable: 'grid_export_power_limit_kw',
      color: COLORS[1],
      dashed: true,
    },
  ],
} as const satisfies Readonly<Record<'C03' | 'C04', readonly SeriesDefinition[]>>

export function createEventChartOption(
  response: H2SeriesResponse,
  event: H2AnomalyEvent,
  focusWindow?: H2ChartFocusWindow | null,
): EChartsCoreOption {
  const definitions =
    event.code === 'C03'
      ? powerSeriesByCode.C03
      : event.code === 'C04'
        ? powerSeriesByCode.C04
        : createEvidenceSeries(event)

  return createLineOption(
    response,
    definitions,
    'kW',
    {
      startTime: event.startTime,
      endTime: event.endTime,
      label: `${event.code} 事件区间`,
    },
    focusWindow,
  )
}

function createEvidenceSeries(event: H2AnomalyEvent): readonly SeriesDefinition[] {
  const variables = event.evidence
    .filter(
      (item): item is typeof item & { readonly variable: string } =>
        typeof item.variable === 'string',
    )
    .filter(
      (item, index, items) =>
        items.findIndex(({ variable }) => variable === item.variable) === index,
    )
    .slice(0, COLORS.length)

  return variables.map(({ kind, variable }, index) => ({
    variable,
    label: formatH2FieldLabel(variable),
    color: COLORS[index] ?? COLORS[0],
    dashed: kind === 'constraint',
  }))
}

export function createPccChartOption(response: H2SeriesResponse): EChartsCoreOption {
  return createLineOption(
    response,
    [
      {
        variable: 'pcc_power_actual_kw',
        label: formatH2FieldLabel('pcc_power_actual_kw'),
        color: COLORS[0],
      },
      {
        variable: 'grid_export_power_limit_kw',
        label: formatH2FieldLabel('grid_export_power_limit_kw'),
        color: COLORS[1],
        dashed: true,
      },
      {
        variable: 'grid_import_power_limit_kw',
        label: formatH2FieldLabel('grid_import_power_limit_kw'),
        color: COLORS[2],
        dashed: true,
      },
    ],
    'kW',
  )
}

export function createSocChartOption(response: H2SeriesResponse): EChartsCoreOption {
  return createLineOption(
    response,
    [
      {
        variable: 'soc_target_pct',
        label: formatH2FieldLabel('soc_target_pct'),
        color: COLORS[1],
        dashed: true,
      },
      {
        variable: 'bess_soc_pct',
        label: formatH2FieldLabel('bess_soc_pct'),
        color: COLORS[4],
      },
    ],
    '%',
  )
}

export function createVariableChartOption(
  response: H2SeriesResponse,
  field: H2DatasetField,
): EChartsCoreOption {
  return createLineOption(
    response,
    [
      {
        variable: field.name,
        label: formatH2FieldLabel(field.name),
        color: COLORS[0],
      },
    ],
    formatH2FieldUnit(field.name) || field.unit || '',
  )
}

const quotaSeriesByDirection = {
  export: {
    used: 'grid_export_energy_used_kwh_day',
    quota: 'grid_export_energy_quota_kwh_day',
  },
  import: {
    used: 'grid_import_energy_used_kwh_day',
    quota: 'grid_import_energy_quota_kwh_day',
  },
} as const satisfies Readonly<
  Record<
    'export' | 'import',
    { readonly used: string; readonly quota: string }
  >
>

export const H2_QUOTA_VARIABLES = [
  quotaSeriesByDirection.export.used,
  quotaSeriesByDirection.export.quota,
  quotaSeriesByDirection.import.used,
  quotaSeriesByDirection.import.quota,
] as const

/**
 * Dedicated energy-quota view: daily cumulative export/import energy against
 * the daily quota lines. Series that are absent from the response are skipped
 * so a partial dataset degrades instead of drawing phantom curves.
 */
export function createQuotaChartOption(response: H2SeriesResponse): EChartsCoreOption {
  const definitions: SeriesDefinition[] = []
  for (const direction of ['export', 'import'] as const) {
    const { used, quota } = quotaSeriesByDirection[direction]
    if (hasSeriesVariable(response, used)) {
      definitions.push({
        variable: used,
        label: formatH2FieldLabel(used),
        color: COLORS[0],
      })
    }
    if (hasSeriesVariable(response, quota)) {
      definitions.push({
        variable: quota,
        label: formatH2FieldLabel(quota),
        color: COLORS[1],
        dashed: true,
      })
    }
  }
  return createLineOption(response, definitions, 'kWh')
}

export function hasSeriesVariable(
  response: H2SeriesResponse,
  variable: string,
): boolean {
  return response.variables.includes(variable)
}

function createLineOption(
  response: H2SeriesResponse,
  definitions: readonly SeriesDefinition[],
  unit: string,
  eventBand?: {
    readonly startTime: string
    readonly endTime: string
    readonly label: string
  },
  focusWindow?: H2ChartFocusWindow | null,
): EChartsCoreOption {
  const timestamps = response.points.map(({ timestamp }) => Date.parse(timestamp))
  const resolvedDefinitions = definitions.map((definition) => ({
    ...definition,
    label: definition.label ?? formatH2FieldLabel(definition.variable),
  }))
  const zoomRange = createFocusZoomRange(timestamps, focusWindow)

  return {
    aria: { enabled: true, decal: { show: true } },
    color: resolvedDefinitions.map(({ color }) => color),
    grid: { left: 54, right: 24, top: 54, bottom: 48, containLabel: false },
    legend: {
      top: 4,
      left: 0,
      textStyle: { color: '#a9b7c8', fontSize: 11 },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross', label: { backgroundColor: '#152333' } },
      backgroundColor: 'rgba(7, 16, 26, 0.96)',
      borderColor: '#2d4258',
      textStyle: { color: '#ecf4f6' },
    },
    // Every chart shares the same time-axis configuration so all views stay
    // aligned on one filterable, zoomable time scale.
    dataZoom: createTimeZoom(zoomRange),
    xAxis: createTimeAxis(response),
    yAxis: {
      type: 'value',
      name: unit,
      nameTextStyle: { color: '#7f91a4' },
      axisLabel: { color: '#7f91a4' },
      splitLine: { lineStyle: { color: 'rgba(126, 148, 170, 0.14)' } },
    },
    series: resolvedDefinitions.map((definition, index) => ({
      name: definition.label,
      type: 'line',
      data: response.points.map(({ values }) => values[definition.variable] ?? null),
      connectNulls: false,
      showSymbol: false,
      smooth: false,
      lineStyle: {
        color: definition.color,
        width: definition.dashed ? 1.5 : 2.5,
        type: definition.dashed ? 'dashed' : 'solid',
      },
      itemStyle: { color: definition.color },
      markArea:
        index === 0 && eventBand
          ? {
              silent: true,
              itemStyle: { color: 'rgba(243, 119, 143, 0.11)' },
              label: { color: '#f6a1b2', formatter: eventBand.label },
              data: [[{ xAxis: eventBand.startTime }, { xAxis: eventBand.endTime }]],
            }
          : undefined,
    })),
  }
}

/** One shared category time axis for every H2 chart view. */
function createTimeAxis(response: H2SeriesResponse): EChartsCoreOption['xAxis'] {
  return {
    type: 'category',
    boundaryGap: false,
    data: response.points.map(({ timestamp }) => timestamp),
    axisLabel: {
      color: '#7f91a4',
      formatter: (value: string) => formatH2Timestamp(value),
    },
    axisLine: { lineStyle: { color: '#304458' } },
  }
}

/** One shared inside+slider zoom configuration for every H2 chart view. */
function createTimeZoom(
  zoomRange: { readonly start: number; readonly end: number } | null,
): EChartsCoreOption['dataZoom'] {
  return [
    { type: 'inside', filterMode: 'none' },
    {
      type: 'slider',
      height: 16,
      bottom: 4,
      borderColor: '#26384b',
      fillerColor: 'rgba(73, 214, 189, 0.12)',
      handleStyle: { color: '#49d6bd' },
      textStyle: { color: '#77899c' },
      ...(zoomRange ? { start: zoomRange.start, end: zoomRange.end } : {}),
    },
  ]
}

function createFocusZoomRange(
  timestamps: readonly number[],
  focusWindow: H2ChartFocusWindow | null | undefined,
): { readonly start: number; readonly end: number } | null {
  if (!focusWindow) {
    return null
  }
  const startTime = Date.parse(focusWindow.startTime)
  const endTime = Date.parse(focusWindow.endTime)
  if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
    return null
  }

  const total = timestamps.length
  if (total === 0) {
    return null
  }
  const first = timestamps.findIndex((value) => value >= startTime)
  if (first === -1) {
    return { start: 0, end: 100 }
  }
  const exclusiveEnd = timestamps.findIndex((value) => value > endTime)
  const last = exclusiveEnd === -1 ? total - 1 : exclusiveEnd - 1
  if (last < first) {
    return { start: 0, end: 100 }
  }

  return {
    start: (first / total) * 100,
    end: ((last + 1) / total) * 100,
  }
}
