import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  classifyEvents,
  computeMetrics,
  matchEvents,
  mergePredictions,
  toInstant,
} from '../../../validation/lib/metrics.mjs'

function groundTruth(...events) {
  return events.map(([id, code, startTime, endTime]) => ({ id, code, startTime, endTime }))
}

function predictions(...events) {
  return events.map(([id, code, startTime, endTime]) => ({ id, code, startTime, endTime }))
}

describe('H2 Sentinel evaluation metrics', () => {
  it('parses official naive and ISO timestamps as UTC instants', () => {
    assert.equal(toInstant('2026-01-05 10:24:00'), toInstant('2026-01-05T10:24:00Z'))
    assert.equal(toInstant('2026-01-05T10:24:00Z'), Date.parse('2026-01-05T10:24:00Z'))
    assert.equal(Number.isNaN(toInstant('not-a-time')), true)
  })

  it('scores a perfect match with F1 = 1 and empty confusion counts', () => {
    const gt = groundTruth(['g1', 'C03', '2026-01-05T10:00:00Z', '2026-01-05T11:00:00Z'])
    const pred = predictions(['p1', 'C03', '2026-01-05T10:01:00Z', '2026-01-05T10:59:00Z'])
    const result = matchEvents({ groundTruth: gt, predictions: pred })
    assert.equal(result.tp, 1)
    assert.equal(result.fp, 0)
    assert.equal(result.fn, 0)
    assert.equal(result.f1, 1)
    assert.equal(result.matches.length, 1)
    assert.deepEqual(result.unmatchedGroundTruth, [])
    assert.deepEqual(result.unmatchedPredictions, [])
  })

  it('rejects a prediction with a different anomaly_code', () => {
    const result = matchEvents({
      groundTruth: groundTruth(['g1', 'C03', '2026-01-05T10:00:00Z', '2026-01-05T11:00:00Z']),
      predictions: predictions(['p1', 'C04', '2026-01-05T10:10:00Z', '2026-01-05T10:50:00Z']),
    })
    assert.equal(result.tp, 0)
    assert.equal(result.fp, 1)
    assert.equal(result.fn, 1)
    assert.equal(result.precision, 0)
    assert.equal(result.recall, 0)
    assert.equal(result.f1, 0)
  })

  it('applies the grace window for early detection', () => {
    const result = matchEvents({
      groundTruth: groundTruth(['g1', 'C03', '2026-01-05T10:00:00Z', '2026-01-05T11:00:00Z']),
      predictions: predictions(['p1', 'C03', '2026-01-05T09:55:00Z', '2026-01-05T09:58:00Z']),
      graceMinutes: 10,
    })
    assert.equal(result.tp, 1)
    assert.equal(result.fp, 0)
    assert.equal(result.fn, 0)
  })

  it('does not match a prediction outside the grace window', () => {
    const result = matchEvents({
      groundTruth: groundTruth(['g1', 'C03', '2026-01-05T10:00:00Z', '2026-01-05T11:00:00Z']),
      predictions: predictions(['p1', 'C03', '2026-01-05T09:00:00Z', '2026-01-05T09:30:00Z']),
      graceMinutes: 10,
    })
    assert.equal(result.tp, 0)
    assert.equal(result.fn, 1)
  })

  it('counts a false positive for an unmatched prediction', () => {
    const result = matchEvents({
      groundTruth: groundTruth(['g1', 'C02', '2026-01-05T10:00:00Z', '2026-01-05T11:00:00Z']),
      predictions: predictions(
        ['p1', 'C02', '2026-01-05T10:05:00Z', '2026-01-05T10:30:00Z'],
        ['p2', 'C04', '2026-01-06T00:00:00Z', '2026-01-06T00:30:00Z'],
      ),
    })
    assert.equal(result.tp, 1)
    assert.equal(result.fp, 1)
    assert.equal(result.fn, 0)
    assert.equal(result.precision, 0.5)
    assert.equal(result.recall, 1)
    assert.equal(result.f1, 2 / 3)
  })

  it('never reuses a predicted event across ground-truth events', () => {
    const result = matchEvents({
      groundTruth: groundTruth(
        ['g1', 'C04', '2026-01-05T10:00:00Z', '2026-01-05T10:30:00Z'],
        ['g2', 'C04', '2026-01-05T10:31:00Z', '2026-01-05T11:00:00Z'],
      ),
      predictions: predictions(['p1', 'C04', '2026-01-05T10:05:00Z', '2026-01-05T10:59:00Z']),
    })
    assert.equal(result.tp, 1)
    assert.equal(result.fp, 0)
    assert.equal(result.fn, 1)
  })

  it('reports per-code metrics for all seven classes', () => {
    const result = matchEvents({
      groundTruth: groundTruth(
        ['g1', 'C03', '2026-01-05T10:00:00Z', '2026-01-05T11:00:00Z'],
        ['g2', 'C04', '2026-01-05T12:00:00Z', '2026-01-05T13:00:00Z'],
      ),
      predictions: predictions(
        ['p1', 'C03', '2026-01-05T10:00:00Z', '2026-01-05T11:00:00Z'],
        ['p2', 'C05', '2026-01-05T14:00:00Z', '2026-01-05T15:00:00Z'],
      ),
    })
    assert.deepEqual(result.byCode.map((entry) => entry.code), [
      'C01',
      'C02',
      'C03',
      'C04',
      'C05',
      'C06',
      'C07',
    ])
    const byCode = Object.fromEntries(result.byCode.map((entry) => [entry.code, entry]))
    assert.equal(byCode.C03.tp, 1)
    assert.equal(byCode.C03.f1, 1)
    assert.equal(byCode.C04.fn, 1)
    assert.equal(byCode.C05.fp, 1)
  })

  it('computes metrics with zero denominators safely', () => {
    const metrics = computeMetrics({ tp: 0, fp: 0, fn: 0 })
    assert.equal(metrics.precision, 0)
    assert.equal(metrics.recall, 0)
    assert.equal(metrics.f1, 0)
  })

  it('merges adjacent same-code predictions across chunk boundaries', () => {
    const merged = mergePredictions(
      predictions(
        ['a', 'C04', '2026-01-05T23:59:00Z', '2026-01-06T00:01:00Z'],
        ['b', 'C04', '2026-01-06T00:02:00Z', '2026-01-06T00:10:00Z'],
      ),
      { gapMinutes: 2 },
    )
    assert.equal(merged.length, 1)
    assert.equal(merged[0].code, 'C04')
    assert.equal(merged[0].startTime, '2026-01-05T23:59:00Z')
    assert.equal(merged[0].endTime, '2026-01-06T00:10:00Z')
  })

  it('keeps predictions of different codes separate when merging', () => {
    const merged = mergePredictions(
      predictions(
        ['a', 'C04', '2026-01-05T23:59:00Z', '2026-01-06T00:01:00Z'],
        ['b', 'C03', '2026-01-06T00:02:00Z', '2026-01-06T00:10:00Z'],
      ),
    )
    assert.equal(merged.length, 2)
  })

  it('classifies an exact-match event with accuracy 1', () => {
    const result = classifyEvents({
      groundTruth: groundTruth(['g1', 'C03', '2026-01-05T10:00:00Z', '2026-01-05T11:00:00Z']),
      predictions: predictions(['p1', 'C03', '2026-01-05T10:01:00Z', '2026-01-05T10:59:00Z']),
    })
    assert.equal(result.matches, 1)
    assert.equal(result.correctCode, 1)
    assert.equal(result.detectionRecall, 1)
    assert.equal(result.detectionPrecision, 1)
    assert.equal(result.detectionF1, 1)
    assert.equal(result.classificationAccuracy, 1)
    assert.equal(result.eventAccuracy, 1)
  })

  it('separates detection from a wrong-code classification', () => {
    const result = classifyEvents({
      groundTruth: groundTruth(['g1', 'C03', '2026-01-05T10:00:00Z', '2026-01-05T11:00:00Z']),
      predictions: predictions(['p1', 'C04', '2026-01-05T10:10:00Z', '2026-01-05T10:50:00Z']),
    })
    assert.equal(result.matches, 1)
    assert.equal(result.correctCode, 0)
    assert.equal(result.detectionRecall, 1)
    assert.equal(result.detectionPrecision, 1)
    assert.equal(result.detectionF1, 1)
    assert.equal(result.classificationAccuracy, 0)
    assert.equal(result.eventAccuracy, 0)
  })

  it('counts a detection miss and an unmatched prediction', () => {
    const result = classifyEvents({
      groundTruth: groundTruth(
        ['g1', 'C02', '2026-01-05T10:00:00Z', '2026-01-05T11:00:00Z'],
        ['g2', 'C05', '2026-01-06T10:00:00Z', '2026-01-06T11:00:00Z'],
      ),
      predictions: predictions(
        ['p1', 'C02', '2026-01-05T10:05:00Z', '2026-01-05T10:30:00Z'],
        ['p2', 'C04', '2026-01-07T00:00:00Z', '2026-01-07T00:30:00Z'],
      ),
    })
    assert.equal(result.matches, 1)
    assert.equal(result.correctCode, 1)
    assert.equal(result.detectionRecall, 0.5)
    assert.equal(result.detectionPrecision, 0.5)
    assert.equal(result.detectionF1, 0.5)
    assert.equal(result.classificationAccuracy, 1)
    assert.equal(result.eventAccuracy, 0.5)
  })

  it('handles an empty prediction set safely', () => {
    const result = classifyEvents({
      groundTruth: groundTruth(['g1', 'C03', '2026-01-05T10:00:00Z', '2026-01-05T11:00:00Z']),
      predictions: [],
    })
    assert.equal(result.matches, 0)
    assert.equal(result.correctCode, 0)
    assert.equal(result.detectionRecall, 0)
    assert.equal(result.detectionPrecision, 0)
    assert.equal(result.detectionF1, 0)
    assert.equal(result.classificationAccuracy, 0)
    assert.equal(result.eventAccuracy, 0)
  })
})
