import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseCsvText, serializeCsv } from './csv.mjs'

const directory = dirname(fileURLToPath(import.meta.url))
export const repositoryRoot = resolve(directory, '../..')

function loadJson(relativePath) {
  return JSON.parse(readFileSync(resolve(repositoryRoot, relativePath), 'utf8'))
}

export const OFFICIAL_FIELDS = loadJson(
  'packages/h2-vocabulary/data/fields.json',
).fields.map((field) => field.name)

export const ANOMALY_TAXONOMY = loadJson(
  'packages/h2-vocabulary/data/anomaly-taxonomy.json',
)

export const EQUIPMENT = loadJson('packages/h2-vocabulary/data/equipment.json')

export const OFFICIAL_FIELD_MAPPINGS = loadJson(
  'packages/h2-vocabulary/data/deprecated-field-map.json',
).mappings

export const ANOMALY_CODES = ANOMALY_TAXONOMY.map((entry) => entry.code)

export const SEVERITY_BY_CODE = new Map(
  ANOMALY_TAXONOMY.map((entry) => [entry.code, entry.severity]),
)

export const PRIMARY_CONTROL_OBJECT_BY_CODE = new Map(
  ANOMALY_TAXONOMY.map((entry) => [entry.code, entry.primaryControlObject]),
)

export const PRIMARY_IMPACT_METRIC_BY_CODE = new Map(
  ANOMALY_TAXONOMY.map((entry) => [entry.code, entry.primaryImpactMetric]),
)

export const SUBTYPES_BY_CODE = new Map(
  ANOMALY_TAXONOMY.map((entry) => [
    entry.code,
    entry.subtypes.map((subtype) => subtype.code),
  ]),
)

export const AFFECTED_EQUIPMENT_BY_CODE = new Map(
  ANOMALY_TAXONOMY.map((entry) => [entry.code, entry.affectedEquipment]),
)

export const EQUIPMENT_NAME_BY_ID = new Map(
  EQUIPMENT.map((entry) => [entry.equipment_id, entry.equipment_name]),
)

export const PRIMARY_CONTROL_OBJECTS = [
  ...new Set(ANOMALY_TAXONOMY.map((entry) => entry.primaryControlObject)),
]

export const CANONICAL_FIELDS = [
  'timestamp',
  'pv_actual_kw',
  'bess_power_kw',
  'bess_dispatch_command_kw',
  'pcc_power_kw',
  'pcc_export_limit_kw',
  'pcc_import_limit_kw',
  'bess_soc_percent',
  'auxiliary_load_kw',
  'total_electrolyzer_power_kw',
]

const MAPPINGS = new Map(
  OFFICIAL_FIELD_MAPPINGS.map((entry) => [entry.internal, entry]),
)

export const CANONICAL_OFFICIAL_SOURCE = Object.freeze(
  Object.fromEntries(
    CANONICAL_FIELDS.map((name) => [
      name,
      name === 'timestamp' || name === 'pv_actual_kw'
        ? name
        : MAPPINGS.get(name)?.official ?? null,
    ]),
  ),
)

const REQUIRED_OFFICIAL_FIELDS = [
  ...new Set(
    CANONICAL_FIELDS.filter((name) => CANONICAL_OFFICIAL_SOURCE[name] !== null)
      .map((name) => CANONICAL_OFFICIAL_SOURCE[name])
      .filter(Boolean),
  ),
]

const ELECTROLYZER_ACTUAL_FIELDS = [
  'elz1_power_actual_kw',
  'elz2_power_actual_kw',
  'elz3_power_actual_kw',
]

export function normalizeOfficialCsv(chunkText) {
  const { columns, rows } = parseCsvText(chunkText)
  const indexByColumn = new Map(columns.map((column, index) => [column, index]))
  for (const required of REQUIRED_OFFICIAL_FIELDS) {
    if (!indexByColumn.has(required)) {
      throw new Error(`Official CSV chunk is missing required field: ${required}`)
    }
  }
  const normalizedRows = []
  for (const row of rows) {
    const read = (name) => {
      const index = indexByColumn.get(name)
      return index === undefined ? '' : (row[index] ?? '').trim()
    }
    const totalElectrolyzerKw = ELECTROLYZER_ACTUAL_FIELDS.reduce(
      (sum, field) => sum + (parseFinite(read(field)) ?? 0),
      0,
    )
    const values = {}
    for (const name of CANONICAL_FIELDS) {
      if (name === 'timestamp') {
        values[name] = normalizeTimestamp(read('timestamp'))
      } else if (name === 'total_electrolyzer_power_kw') {
        values[name] = String(Math.round(totalElectrolyzerKw * 1e6) / 1e6)
      } else {
        values[name] = read(CANONICAL_OFFICIAL_SOURCE[name])
      }
    }
    normalizedRows.push(CANONICAL_FIELDS.map((name) => values[name]))
  }
  return serializeCsv(CANONICAL_FIELDS, normalizedRows)
}

function parseFinite(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeTimestamp(value) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/(?:Z|[+-]\d{2}:\d{2})$/.test(trimmed)) return trimmed
  const isoLike = trimmed.replace(' ', 'T')
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(isoLike)) {
    return `${isoLike}Z`
  }
  return trimmed
}
