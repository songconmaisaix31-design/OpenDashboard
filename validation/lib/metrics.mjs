export const ANOMALY_CODES = ['C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07']

export function toInstant(value) {
  if (typeof value !== 'string' || value.trim() === '') return NaN
  const trimmed = value.trim()
  const isoLike = trimmed.replace(' ', 'T')
  if (/(?:Z|[+-]\d{2}:\d{2})$/.test(isoLike)) {
    return Date.parse(isoLike)
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(isoLike)) {
    return Date.parse(`${isoLike}Z`)
  }
  return Date.parse(isoLike)
}

function precision(tp, fp) {
  return tp + fp === 0 ? 0 : tp / (tp + fp)
}

function recall(tp, fn) {
  return tp + fn === 0 ? 0 : tp / (tp + fn)
}

function f1(tp, fp, fn) {
  const p = precision(tp, fp)
  const r = recall(tp, fn)
  return p + r === 0 ? 0 : (2 * p * r) / (p + r)
}

export function computeMetrics({ tp, fp, fn }) {
  return {
    tp,
    fp,
    fn,
    precision: precision(tp, fp),
    recall: recall(tp, fn),
    f1: f1(tp, fp, fn),
  }
}

export function matchEvents({ groundTruth, predictions, graceMinutes = 10 }) {
  const graceMs = graceMinutes * 60_000
  const normalizedGroundTruth = groundTruth.map((event) => {
    const start = toInstant(event.startTime)
    const end = toInstant(event.endTime)
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      throw new Error(`Ground-truth event has an invalid interval: ${event.id}`)
    }
    if (start > end) {
      throw new Error(`Ground-truth event has an inverted interval: ${event.id}`)
    }
    return { ...event, start, end }
  })
  const normalizedPredictions = predictions.map((event) => {
    const start = toInstant(event.startTime)
    const end = toInstant(event.endTime)
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      throw new Error(`Predicted event has an invalid interval: ${event.id}`)
    }
    return { ...event, start, end }
  })

  const matchedPredictionIds = new Set()
  const matches = []
  const orderedGroundTruth = [...normalizedGroundTruth].sort(
    (a, b) => a.start - b.start || a.id.localeCompare(b.id),
  )
  for (const groundEvent of orderedGroundTruth) {
    const candidate = normalizedPredictions
      .filter(
        (predicted) =>
          !matchedPredictionIds.has(predicted.id) &&
          predicted.code === groundEvent.code &&
          predicted.start <= groundEvent.end + graceMs &&
          predicted.end >= groundEvent.start - graceMs,
      )
      .sort((a, b) => a.start - b.start || a.id.localeCompare(b.id))[0]
    if (candidate === undefined) continue
    matchedPredictionIds.add(candidate.id)
    matches.push({
      groundTruthId: groundEvent.id,
      predictionId: candidate.id,
      code: groundEvent.code,
      groundTruthStart: groundEvent.startTime,
      groundTruthEnd: groundEvent.endTime,
      predictionStart: candidate.startTime,
      predictionEnd: candidate.endTime,
    })
  }

  const overall = computeMetrics({
    tp: matches.length,
    fp: normalizedPredictions.length - matches.length,
    fn: normalizedGroundTruth.length - matches.length,
  })

  const byCode = ANOMALY_CODES.map((code) => {
    const groundCount = normalizedGroundTruth.filter(
      (event) => event.code === code,
    ).length
    const predictionCount = normalizedPredictions.filter(
      (event) => event.code === code,
    ).length
    const truePositive = matches.filter((match) => match.code === code).length
    return {
      code,
      groundTruth: groundCount,
      predictions: predictionCount,
      ...computeMetrics({
        tp: truePositive,
        fp: predictionCount - truePositive,
        fn: groundCount - truePositive,
      }),
    }
  })

  const matchedPredictionIdsSet = new Set(matches.map((match) => match.predictionId))
  return {
    ...overall,
    matches,
    unmatchedGroundTruth: orderedGroundTruth
      .filter((event) => !matches.some((match) => match.groundTruthId === event.id))
      .map((event) => event.id),
    unmatchedPredictions: normalizedPredictions
      .filter((event) => !matchedPredictionIdsSet.has(event.id))
      .map((event) => event.id),
    byCode,
  }
}

export function mergePredictions(predictions, { gapMinutes = 2 } = {}) {
  const gapMs = gapMinutes * 60_000
  const byCode = new Map()
  for (const prediction of predictions) {
    const list = byCode.get(prediction.code) ?? []
    list.push(prediction)
    byCode.set(prediction.code, list)
  }
  const merged = []
  for (const [code, events] of [...byCode.entries()].sort()) {
    const ordered = [...events].sort((a, b) => toInstant(a.startTime) - toInstant(b.startTime))
    for (const event of ordered) {
      const previous = merged[merged.length - 1]
      if (
        previous !== undefined &&
        previous.code === code &&
        toInstant(event.startTime) - toInstant(previous.endTime) <= gapMs
      ) {
        previous.endTime = event.endTime
        previous.ids.push(event.id)
      } else {
        merged.push({ ...event, ids: [event.id] })
      }
    }
  }
  return merged
}

/**
 * Code-agnostic event detection and classification metrics.
 *
 * Unlike `matchEvents` (which requires the same anomaly_code), this matcher
 * pairs ground-truth and predicted events by temporal overlap alone, then
 * counts how often the predicted code is correct. It separates detection
 * quality (did we find the event at all) from classification quality (did we
 * label it right):
 *
 * - detectionRecall = matched ground-truth / ground-truth
 * - detectionPrecision = matched predictions / predictions
 * - classificationAccuracy = code-correct matches / matched pairs
 * - eventAccuracy = code-correct matches / ground-truth
 */
export function classifyEvents({ groundTruth, predictions, graceMinutes = 10 }) {
  const graceMs = graceMinutes * 60_000
  const normalizedGroundTruth = groundTruth.map((event) => ({
    ...event,
    start: toInstant(event.startTime),
    end: toInstant(event.endTime),
  }))
  const normalizedPredictions = predictions.map((event) => ({
    ...event,
    start: toInstant(event.startTime),
    end: toInstant(event.endTime),
  }))

  const matchedPredictionIds = new Set()
  const orderedGroundTruth = [...normalizedGroundTruth].sort(
    (a, b) => a.start - b.start || a.id.localeCompare(b.id),
  )
  const matches = []
  for (const groundEvent of orderedGroundTruth) {
    const candidate = normalizedPredictions
      .filter(
        (predicted) =>
          !matchedPredictionIds.has(predicted.id) &&
          predicted.start <= groundEvent.end + graceMs &&
          predicted.end >= groundEvent.start - graceMs,
      )
      .sort((a, b) => a.start - b.start || a.id.localeCompare(b.id))[0]
    if (candidate === undefined) continue
    matchedPredictionIds.add(candidate.id)
    matches.push({
      groundTruthId: groundEvent.id,
      predictionId: candidate.id,
      groundTruthCode: groundEvent.code,
      predictionCode: candidate.code,
    })
  }

  const correctCode = matches.filter(
    (match) => match.groundTruthCode === match.predictionCode,
  ).length
  const detectionRecall = normalizedGroundTruth.length === 0 ? 0 : matches.length / normalizedGroundTruth.length
  const detectionPrecision = normalizedPredictions.length === 0 ? 0 : matches.length / normalizedPredictions.length
  const classificationAccuracy = matches.length === 0 ? 0 : correctCode / matches.length
  const eventAccuracy = normalizedGroundTruth.length === 0 ? 0 : correctCode / normalizedGroundTruth.length
  return {
    matches: matches.length,
    correctCode,
    detectionPrecision,
    detectionRecall,
    detectionF1: f1FromPrecisionRecall(detectionPrecision, detectionRecall),
    classificationAccuracy,
    eventAccuracy,
  }
}

export function f1FromPrecisionRecall(precision, recall) {
  return precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall)
}
