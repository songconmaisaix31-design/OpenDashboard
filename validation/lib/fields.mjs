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

export function normalizeOfficialCsv(chunkText) {
  const { columns, rows } = parseCsvText(chunkText)
  const timestampIndex = columns.indexOf('timestamp')
  if (timestampIndex === -1) {
    throw new Error('Official CSV chunk is missing required field: timestamp')
  }
  const normalizedRows = rows.map((row) =>
    row.map((cell, columnIndex) =>
      columnIndex === timestampIndex ? normalizeTimestamp(cell) : cell,
    ),
  )
  return serializeCsv(columns, normalizedRows)
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
