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

/**
 * Official `affected_equipment` tokens, taken verbatim from the official label
 * files (`04_train_event_labels.csv` + `05_validation_event_labels.csv`, 350
 * rows): comma-separated without spaces. `equipment_master.csv` ids such as
 * `BESS01` must never appear in a submission.
 *
 * Per-code facts from the labels:
 * - C01: two oscillating tanks plus `BESS,PCC`; tank order varies by event
 *   (severity order), so only the set is fixed.
 * - C02: exactly one tank (`ELZ1`/`ELZ2`/`ELZ3`), varies by event.
 * - C03: `BESS,PCC`; C04: `PCC,BESS,ELZ,PV`; C05: `PCC,BESS,ELZ`;
 *   C06: `ELZ1,ELZ2,ELZ3`; C07: `BESS,PCC,PV,ELZ`.
 */
export const OFFICIAL_EQUIPMENT_TOKENS = new Set([
  'BESS',
  'PCC',
  'PV',
  'ELZ',
  'ELZ1',
  'ELZ2',
  'ELZ3',
])

export const AFFECTED_EQUIPMENT_TOKEN_SETS_BY_CODE = new Map([
  ['C01', new Set(['BESS', 'PCC', 'ELZ1', 'ELZ2', 'ELZ3'])],
  ['C02', new Set(['ELZ1', 'ELZ2', 'ELZ3'])],
  ['C03', new Set(['BESS', 'PCC'])],
  ['C04', new Set(['PCC', 'BESS', 'ELZ', 'PV'])],
  ['C05', new Set(['PCC', 'BESS', 'ELZ'])],
  ['C06', new Set(['ELZ1', 'ELZ2', 'ELZ3'])],
  ['C07', new Set(['BESS', 'PCC', 'PV', 'ELZ'])],
])

/** Canonical serialization order for each code (C01/C02 vary per event). */
export const CANONICAL_EQUIPMENT_TOKENS_BY_CODE = new Map([
  ['C01', ['ELZ1', 'ELZ2', 'BESS', 'PCC']],
  ['C02', ['ELZ1']],
  ['C03', ['BESS', 'PCC']],
  ['C04', ['PCC', 'BESS', 'ELZ', 'PV']],
  ['C05', ['PCC', 'BESS', 'ELZ']],
  ['C06', ['ELZ1', 'ELZ2', 'ELZ3']],
  ['C07', ['BESS', 'PCC', 'PV', 'ELZ']],
])

/**
 * Validate an `affected_equipment` token list against the official per-code
 * rules. Returns a problem description or null when the tokens are valid.
 * C01/C02 carry per-event equipment and are checked as sets with a
 * cardinality rule; the other codes require the exact official set.
 */
export function validateEquipmentTokenSet(code, tokens) {
  if (tokens.some((token) => !OFFICIAL_EQUIPMENT_TOKENS.has(token))) {
    return 'has a non-official token'
  }
  if (code === 'C01') {
    const electrolyzers = tokens.filter((token) => token.startsWith('ELZ'))
    if (
      tokens.length !== 4 ||
      !tokens.includes('BESS') ||
      !tokens.includes('PCC') ||
      new Set(tokens).size !== tokens.length ||
      electrolyzers.length !== 2
    ) {
      return 'must be exactly BESS,PCC plus two distinct oscillating tanks (ELZ1/ELZ2/ELZ3)'
    }
    return null
  }
  if (code === 'C02') {
    if (tokens.length !== 1 || !['ELZ1', 'ELZ2', 'ELZ3'].includes(tokens[0])) {
      return 'must be exactly one derated tank (ELZ1/ELZ2/ELZ3)'
    }
    return null
  }
  const expected = AFFECTED_EQUIPMENT_TOKEN_SETS_BY_CODE.get(code)
  if (expected === undefined) return null
  const actual = new Set(tokens)
  if (
    actual.size !== expected.size ||
    tokens.length !== expected.size ||
    [...expected].some((token) => !actual.has(token))
  ) {
    return `must be exactly the official token set [${[...expected].join(', ')}] for ${code}`
  }
  return null
}

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
