import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

import {
  H2_PRIMARY_IMPACT_METRIC_BY_CODE,
  H2_GOLDEN_C03_EVENT,
  H2_GOLDEN_C04_EVENT,
  isH2AnomalySubtypeForCode,
  type H2AnomalyEvent,
} from '../src/index.ts'

const jsonFixture = (name: string): unknown =>
  JSON.parse(
    readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8'),
  ) as unknown

const csvFixture = (name: string): string =>
  readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8')

describe('H2 golden fixtures', () => {
  it('keep C03 and C04 domain invariants explicit', () => {
    assertEventInvariants(H2_GOLDEN_C03_EVENT)
    assertEventInvariants(H2_GOLDEN_C04_EVENT)

    assert.equal(
      H2_GOLDEN_C03_EVENT.impact.metric,
      'abnormal_grid_exchange_energy_kwh',
    )
    assert.equal(
      H2_GOLDEN_C04_EVENT.impact.metric,
      'pcc_power_limit_violation_energy_kwh',
    )
  })

  it('keep JSON fixtures aligned with typed fixture identities', () => {
    assertFixtureIdentity(jsonFixture('golden-c03.json'), H2_GOLDEN_C03_EVENT)
    assertFixtureIdentity(jsonFixture('golden-c04.json'), H2_GOLDEN_C04_EVENT)
  })

  it('do not contain absolute paths or secret-shaped values', () => {
    const allFixtureText = [
      JSON.stringify(H2_GOLDEN_C03_EVENT),
      JSON.stringify(H2_GOLDEN_C04_EVENT),
      csvFixture('tiny-valid-timeseries.csv'),
      csvFixture('tiny-invalid-timeseries.csv'),
    ].join('\n')

    assert(!/[A-Za-z]:\\/.test(allFixtureText))
    assert(!/\\\\[^,\n]+\\/.test(allFixtureText))
    assert(!/(api[_-]?key|password|private key|secret=|token=)/i.test(allFixtureText))
  })

  it('provide one tiny valid CSV and one intentionally invalid CSV', () => {
    const validRows = parseCsv(csvFixture('tiny-valid-timeseries.csv'))
    const invalidRows = parseCsv(csvFixture('tiny-invalid-timeseries.csv'))

    assert.equal(validRows.headers[0], 'timestamp')
    assert.equal(validRows.rows.length, 3)
    assert.equal(new Set(validRows.rows.map((row) => row.timestamp)).size, 3)
    assert(validRows.rows.every((row) => row.pcc_power_kw !== ''))

    assert.equal(invalidRows.rows.length, 3)
    assert.notEqual(
      new Set(invalidRows.rows.map((row) => row.timestamp)).size,
      invalidRows.rows.length,
    )
    assert(invalidRows.rows.some((row) => row.pcc_power_kw === ''))
    assert(invalidRows.rows.some((row) => Number(row.bess_soc_percent) > 90))
  })
})

function assertEventInvariants(event: H2AnomalyEvent): void {
  assert(isH2AnomalySubtypeForCode(event.code, event.subtype))
  assert.equal(event.impact.metric, H2_PRIMARY_IMPACT_METRIC_BY_CODE[event.code])
  assert.equal(event.requiresHumanConfirmation, true)
  assert(event.confidence >= 0 && event.confidence <= 1)
  assert(Date.parse(event.startTime) <= Date.parse(event.firstDetectionTime))
  assert(Date.parse(event.firstDetectionTime) <= Date.parse(event.endTime))
  assert(event.evidence.length >= 3)
  assert(event.recommendations.every((item) => item.requiresHumanConfirmation))

  const evidenceIds = new Set(event.evidence.map(({ evidenceId }) => evidenceId))
  const referencedEvidenceIds = [
    ...event.impact.evidenceIds,
    ...event.safetyChecks.flatMap(({ evidenceIds }) => evidenceIds),
    ...event.recommendations.flatMap(({ evidenceIds }) => evidenceIds),
  ]

  assert(referencedEvidenceIds.every((id) => evidenceIds.has(id)))
}

function assertFixtureIdentity(
  candidate: unknown,
  expected: H2AnomalyEvent,
): void {
  assert(isObject(candidate))
  assert.equal(candidate.eventId, expected.eventId)
  assert.equal(candidate.code, expected.code)
  assert.equal(candidate.subtype, expected.subtype)
  assert.equal(candidate.requiresHumanConfirmation, true)
}

interface CsvRows {
  readonly headers: readonly string[]
  readonly rows: readonly Record<string, string>[]
}

function parseCsv(csv: string): CsvRows {
  const [headerLine, ...rowLines] = csv.trim().split(/\r?\n/)
  assert(headerLine)
  const headers = headerLine.split(',')
  return {
    headers,
    rows: rowLines.map((line) => {
      const cells = line.split(',')
      return Object.fromEntries(
        headers.map((header, index) => [header, cells[index] ?? '']),
      )
    }),
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
