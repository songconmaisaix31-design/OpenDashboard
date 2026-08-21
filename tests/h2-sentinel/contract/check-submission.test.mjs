import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  SUBMISSION_COLUMNS,
  eventToSubmissionRow,
  serializeSubmission,
} from '../../../validation/lib/submission.mjs'
import { validateSubmissionText } from '../../../validation/check-submission.mjs'

const HEADER = SUBMISSION_COLUMNS.join(',')

function row(overrides = {}) {
  return {
    pred_event_id: 'C03-20260105-001',
    start_time: '2026-01-05T10:24:00Z',
    end_time: '2026-01-05T10:30:00Z',
    anomaly_code: 'C03',
    anomaly_subtype: 'BESS_DIRECTION_REVERSED',
    severity: '高',
    primary_control_object: 'EMS储能功率控制与接口映射模块',
    affected_equipment: 'BESS01:储能系统;PCC01:并网点',
    confidence: '0.94',
    evidence_json: '[{"evidence_id":"C03-EV-001","kind":"measurement","conclusion":"ok"}]',
    root_cause: 'Sign mapping mismatch.',
    recommended_action: 'Verify the sign mapping before dispatch.',
    primary_impact_metric: 'abnormal_grid_exchange_energy_kwh',
    estimated_impact_value: '112.4',
    first_detection_time: '2026-01-05T10:25:00Z',
    requires_human_confirmation: 'true',
    ...overrides,
  }
}

function submissionCsv(...rows) {
  const cells = rows.map((value) =>
    SUBMISSION_COLUMNS.map((column) => {
      const cell = value[column]
      return typeof cell === 'string' && /[",\n\r]/.test(cell)
        ? `"${cell.replaceAll('"', '""')}"`
        : String(cell)
    }).join(','),
  )
  return `${HEADER}\n${cells.join('\n')}\n`
}

describe('H2 Sentinel submission format checks', () => {
  it('accepts a canonical row with the official Chinese vocabulary', () => {
    const result = validateSubmissionText(submissionCsv(row()))
    assert.equal(result.valid, true)
    assert.deepEqual(result.issues, [])
    assert.equal(result.rowCount, 1)
    assert.deepEqual(result.columns, SUBMISSION_COLUMNS)
  })

  it('rejects a header with the wrong column order or count', () => {
    const wrongOrder = validateSubmissionText(
      `${[...SUBMISSION_COLUMNS].reverse().join(',')}\na\n`,
    )
    assert.equal(wrongOrder.valid, false)
    const wrongCount = validateSubmissionText('a,b\n1,2\n')
    assert.equal(wrongCount.valid, false)
  })

  it('rejects a non-official severity value', () => {
    for (const severity of ['低', 'HIGH', 'critical', '']) {
      const result = validateSubmissionText(submissionCsv(row({ severity })))
      assert.equal(result.valid, false, severity)
    }
  })

  it('rejects a primary_control_object outside the official Chinese vocabulary', () => {
    const result = validateSubmissionText(
      submissionCsv(row({ primary_control_object: 'EMS并网点功率边界控制模块' })),
    )
    assert.equal(result.valid, false)
    assert.match(result.issues[0], /primary_control_object/)
  })

  it('rejects an affected_equipment id that is not in the equipment master', () => {
    const result = validateSubmissionText(
      submissionCsv(row({ affected_equipment: 'BESS99:储能系统;PCC01:并网点' })),
    )
    assert.equal(result.valid, false)
    assert.match(result.issues[0], /not in the equipment master/)
  })

  it('rejects an affected_equipment name that does not match the master', () => {
    const result = validateSubmissionText(
      submissionCsv(row({ affected_equipment: 'BESS01:电池系统;PCC01:并网点' })),
    )
    assert.equal(result.valid, false)
    assert.match(result.issues[0], /does not match the master name/)
  })

  it('rejects affected_equipment segments that are not id:name', () => {
    const result = validateSubmissionText(
      submissionCsv(row({ affected_equipment: 'BESS01' })),
    )
    assert.equal(result.valid, false)
  })

  it('rejects mojibake and replacement characters', () => {
    for (const broken of [
      'root\uFFFDcause',
      '锟斤拷',
      'root鈥檚',
    ]) {
      const result = validateSubmissionText(
        submissionCsv(row({ root_cause: broken })),
      )
      assert.equal(result.valid, false)
    }
  })

  it('rejects empty values in any required column', () => {
    const result = validateSubmissionText(submissionCsv(row({ confidence: '' })))
    assert.equal(result.valid, false)
    assert.match(result.issues[0], /empty values/)
  })

  it('rejects a non-canonical boolean for requires_human_confirmation', () => {
    for (const value of ['True', 'TRUE', '1', 'yes']) {
      const result = validateSubmissionText(
        submissionCsv(row({ requires_human_confirmation: value })),
      )
      assert.equal(result.valid, false, value)
    }
  })

  it('rejects a primary_impact_metric that does not match the anomaly code', () => {
    const result = validateSubmissionText(
      submissionCsv(row({ primary_impact_metric: 'bess_extra_regulation_energy_kwh' })),
    )
    assert.equal(result.valid, false)
  })

  it('rejects an inverted or undetectable interval', () => {
    const inverted = validateSubmissionText(
      submissionCsv(row({ end_time: '2026-01-05T10:20:00Z' })),
    )
    assert.equal(inverted.valid, false)
    const outside = validateSubmissionText(
      submissionCsv(row({ first_detection_time: '2026-01-05T10:31:00Z' })),
    )
    assert.equal(outside.valid, false)
  })

  it('rejects duplicate pred_event_id values', () => {
    const result = validateSubmissionText(submissionCsv(row(), row()))
    assert.equal(result.valid, false)
    assert.match(result.issues[0], /duplicates pred_event_id/)
  })

  it('rejects an anomaly_code outside C01..C07 and invalid subtypes', () => {
    assert.equal(validateSubmissionText(submissionCsv(row({ anomaly_code: 'C99' }))).valid, false)
    assert.equal(
      validateSubmissionText(submissionCsv(row({ anomaly_subtype: 'NOT_A_SUBTYPE' }))).valid,
      false,
    )
  })

  it('serializes backend events into rows the checker accepts', () => {
    const event = {
      eventId: 'C03-20260105-001',
      code: 'C03',
      subtype: 'BESS_DIRECTION_REVERSED',
      startTime: '2026-01-05T10:24:00Z',
      endTime: '2026-01-05T10:30:00Z',
      firstDetectionTime: '2026-01-05T10:25:00Z',
      confidence: 0.94,
      impact: { metric: 'abnormal_grid_exchange_energy_kwh', value: 112.4 },
      evidence: [
        { evidenceId: 'C03-EV-001', kind: 'measurement', claimKind: 'fact', timestamp: '2026-01-05T10:25:00Z', variable: 'bess_power_kw', actualValue: 230, referenceValue: -240, unit: 'kW', conclusion: 'ok' },
      ],
      rootCause: 'Sign mapping mismatch.',
      recommendations: [{ summary: 'Verify the sign mapping before dispatch.' }],
      requiresHumanConfirmation: true,
    }
    const text = serializeSubmission([eventToSubmissionRow(event)])
    const result = validateSubmissionText(text)
    assert.equal(result.valid, true, result.issues.join(' | '))
    assert.equal(result.rowCount, 1)
  })
})
