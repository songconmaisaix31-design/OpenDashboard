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
    affected_equipment: 'BESS,PCC',
    confidence: '0.94',
    evidence_json: '[{"evidence_id":"C03-EV-001","kind":"measurement","conclusion":"ok"}]',
    root_cause: 'Sign mapping mismatch.',
    recommended_action: 'Verify the sign mapping before dispatch.',
    primary_impact_metric: 'abnormal_grid_exchange_energy_kwh',
    // These checks only validate submission *format*, so any well-formed number
    // works here. The golden C03 impact is used anyway so the repository holds a
    // single C03 figure, and that figure is one the CSV can reproduce.
    estimated_impact_value: '17.333333333333332',
    first_detection_time: '2026-01-05T10:25:00Z',
    requires_human_confirmation: 'true',
    ...overrides,
  }
}

function subtypeFor(code) {
  return {
    C01: 'SETPOINT_OSCILLATION',
    C02: 'CAPACITY_NOT_SYNCHRONIZED',
    C03: 'BESS_DIRECTION_REVERSED',
    C04: 'EXPORT_POWER_LIMIT_NOT_TRACKED',
    C05: 'EXPORT_ENERGY_QUOTA_RISK',
    C06: 'INEFFICIENT_POWER_ALLOCATION',
    C07: 'CHARGE_HEADROOM_SHORTFALL',
  }[code]
}

function codeRow(code) {
  return {
    anomaly_code: code,
    anomaly_subtype: subtypeFor(code),
    primary_control_object: {
      C01: 'EMS电解槽群控与功率分配模块',
      C02: 'EMS设备状态与容量同步模块',
      C03: 'EMS储能功率控制与接口映射模块',
      C04: 'EMS并网点功率边界控制模块',
      C05: 'EMS周期电量配额与日内能量计划模块',
      C06: 'EMS电解槽群控分配模块',
      C07: 'EMS储能SOC计划与调节备用管理模块',
    }[code],
    primary_impact_metric: {
      C01: 'bess_extra_regulation_energy_kwh',
      C02: 'unserved_elz_energy_kwh',
      C03: 'abnormal_grid_exchange_energy_kwh',
      C04: 'pcc_power_limit_violation_energy_kwh',
      C05: 'grid_energy_quota_deviation_kwh',
      C06: 'extra_energy_consumption_kwh',
      C07: 'bess_regulation_reserve_shortfall_kwh',
    }[code],
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

  it('rejects an affected_equipment token that is not official', () => {
    const result = validateSubmissionText(
      submissionCsv(row({ affected_equipment: 'BESS99,PCC' })),
    )
    assert.equal(result.valid, false)
    assert.match(result.issues[0], /non-official token/)
  })

  it('rejects an affected_equipment token set that does not match the code', () => {
    const result = validateSubmissionText(
      submissionCsv(row({ affected_equipment: 'BESS,PCC,PV' })),
    )
    assert.equal(result.valid, false)
    assert.match(result.issues[0], /official token set/)
  })

  it('rejects affected_equipment with spaces or id:name segments', () => {
    for (const affected_equipment of ['BESS, PCC', 'BESS01:储能系统;PCC01:并网点']) {
      const result = validateSubmissionText(submissionCsv(row({ affected_equipment })))
      assert.equal(result.valid, false, affected_equipment)
    }
  })

  it('accepts the official per-code affected_equipment sets', () => {
    const cases = [
      ['C01', 'ELZ2,ELZ3,BESS,PCC'],
      ['C02', 'ELZ1'],
      ['C03', 'BESS,PCC'],
      ['C04', 'PCC,BESS,ELZ,PV'],
      ['C05', 'PCC,BESS,ELZ'],
      ['C06', 'ELZ1,ELZ2,ELZ3'],
      ['C07', 'BESS,PCC,PV,ELZ'],
    ]
    for (const [code, affected_equipment] of cases) {
      const result = validateSubmissionText(
        submissionCsv(row({ ...codeRow(code), affected_equipment })),
      )
      assert.equal(result.valid, true, `${code} ${affected_equipment}: ${result.issues.join(' | ')}`)
    }
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
      impact: { metric: 'abnormal_grid_exchange_energy_kwh', value: 17.333333333333332 },
      evidence: [
        // `bess_power_actual_kw` is the official field name; the pre-migration
        // `bess_power_kw` alias no longer exists in the vocabulary.
        { evidenceId: 'C03-EV-001', kind: 'measurement', claimKind: 'fact', timestamp: '2026-01-05T10:25:00Z', variable: 'bess_power_actual_kw', actualValue: 230, referenceValue: -240, unit: 'kW', conclusion: 'ok' },
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
