import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseCsvText } from '../../../validation/lib/csv.mjs'
import {
  ANOMALY_CODES,
  EQUIPMENT,
  OFFICIAL_FIELD_MAPPINGS,
  OFFICIAL_FIELDS,
  PRIMARY_CONTROL_OBJECTS,
  SEVERITY_BY_CODE,
  SUBTYPES_BY_CODE,
} from '../../../validation/lib/fields.mjs'
import { SUBMISSION_COLUMNS } from '../../../validation/lib/submission.mjs'

const directory = dirname(fileURLToPath(import.meta.url))
const fixtureDirectory = resolve(directory, '../fixtures')
const repositoryRoot = resolve(directory, '../../..')

function readFixture(name) {
  return JSON.parse(
    readFileSync(resolve(fixtureDirectory, name), 'utf8'),
  )
}

describe('H2 Sentinel official vocabulary contract', () => {
  it('freezes the 69-field official timeseries header', () => {
    const frozen = readFixture('official-timeseries-columns.json')
    assert.equal(frozen.count, 69)
    assert.equal(frozen.fields.length, 69)
    assert.equal(new Set(frozen.fields).size, 69)
    assert.deepEqual(OFFICIAL_FIELDS, frozen.fields)
  })

  it('keeps the deprecated-field-map values within the official field vocabulary', () => {
    const officialSet = new Set(OFFICIAL_FIELDS)
    for (const mapping of OFFICIAL_FIELD_MAPPINGS) {
      assert.equal(typeof mapping.internal, 'string')
      if (mapping.official === null) {
        assert.ok(mapping.derived, `derived expression required for ${mapping.internal}`)
      } else {
        assert.ok(officialSet.has(mapping.official), `${mapping.official} must be an official field`)
      }
    }
    for (const name of OFFICIAL_FIELDS) {
      assert.equal(typeof name, 'string')
      assert.notEqual(name, '')
    }
  })

  it('defines exactly the seven anomaly classes with a closed vocabulary', () => {
    assert.deepEqual(ANOMALY_CODES, ['C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07'])
    assert.deepEqual(
      [...SEVERITY_BY_CODE.values()].filter((severity) => severity !== '高' && severity !== '中'),
      [],
    )
    assert.equal(PRIMARY_CONTROL_OBJECTS.length, 7)
    for (const code of ANOMALY_CODES) {
      const subtypes = SUBTYPES_BY_CODE.get(code)
      assert.ok(subtypes && subtypes.length >= 1, code)
      assert.equal(new Set(subtypes).size, subtypes.length, `${code} subtypes are unique`)
    }
  })

  it('keeps every affected-equipment entry inside the equipment master', () => {
    const master = new Map(EQUIPMENT.map((entry) => [entry.equipment_id, entry]))
    assert.ok(master.has('PV01'))
    assert.ok(master.has('BESS01'))
    assert.ok(master.has('PCC01'))
    assert.ok(master.has('ELZ01'))
    assert.ok(master.has('ELZ02'))
    assert.ok(master.has('ELZ03'))
  })

  it('matches the official event-label sample rows to the taxonomy', () => {
    const sample = readFileSync(
      resolve(fixtureDirectory, 'validation-event-labels.sample.csv'),
      'utf8',
    )
    const { columns, rows } = parseCsvText(sample)
    const index = new Map(columns.map((column, columnIndex) => [column, columnIndex]))
    for (const row of rows) {
      const code = row[index.get('anomaly_code')]
      const subtype = row[index.get('anomaly_subtype')]
      const severity = row[index.get('severity')]
      assert.ok(ANOMALY_CODES.includes(code))
      assert.ok(SUBTYPES_BY_CODE.get(code).includes(subtype))
      assert.equal(SEVERITY_BY_CODE.get(code), severity)
    }
  })

  it('freezes the 16-column submission contract', () => {
    assert.deepEqual(SUBMISSION_COLUMNS, [
      'pred_event_id',
      'start_time',
      'end_time',
      'anomaly_code',
      'anomaly_subtype',
      'severity',
      'primary_control_object',
      'affected_equipment',
      'confidence',
      'evidence_json',
      'root_cause',
      'recommended_action',
      'primary_impact_metric',
      'estimated_impact_value',
      'first_detection_time',
      'requires_human_confirmation',
    ])
    assert.equal(new Set(SUBMISSION_COLUMNS).size, 16)
  })
})
