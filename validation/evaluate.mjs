import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseCsvText, serializeCsv } from './lib/csv.mjs'
import { normalizeOfficialCsv, OFFICIAL_FIELDS } from './lib/fields.mjs'
import {
  freeLoopbackPort,
  repositoryRoot,
  requestEnvelope,
  startLauncher,
} from './lib/launcher.mjs'
import { classifyEvents, matchEvents, mergePredictions } from './lib/metrics.mjs'

const directory = dirname(fileURLToPath(import.meta.url))
const DEFAULT_OFFICIAL_DIR =
  'C:/Users/DW/Desktop/T03_设备故障排查与智能运维助手/T03_设备故障排查与智能运维助手/企业资料包04_雷动/数据与材料'

/** Official set presets for D1 (validation) and D2 (train-last-90 sentinel). */
const SET_PRESETS = {
  validation: {
    label: 'validation',
    timeseries: '02_validation_timeseries.csv',
    labels: '05_validation_event_labels.csv',
    minDay: null,
  },
  'train-last-90': {
    label: 'train-last-90',
    timeseries: '01_train_timeseries.csv',
    labels: '04_train_event_labels.csv',
    // The last 90 calendar days of the train window (525,600 rows from
    // 2025-01-01 00:00 UTC) start on 2025-10-03.
    minDay: '2025-10-03',
  },
}

function sha256(buffer) {
  return `sha256:${createHash('sha256').update(buffer).digest('hex')}`
}

function parseArguments(argumentsList) {
  const values = new Map()
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index]
    const next = argumentsList[index + 1]
    if (next === undefined || next.startsWith('--')) {
      throw new Error(`${argument} requires a value`)
    }
    values.set(argument, next)
    index += 1
  }
  const mode = values.get('--mode') ?? 'local'
  if (mode !== 'local' && mode !== 'fixture') {
    throw new Error('--mode must be local or fixture')
  }
  const set = values.get('--set') ?? 'validation'
  if (!(set in SET_PRESETS)) {
    throw new Error('--set must be validation or train-last-90')
  }
  return {
    mode,
    set,
    officialData: values.get('--official-data'),
    limitDays: values.get('--limit-days') === undefined ? 0 : Number(values.get('--limit-days')),
    graceMinutes: values.get('--grace-minutes') === undefined ? 10 : Number(values.get('--grace-minutes')),
    output: values.get('--output'),
  }
}

function loadGroundTruthLocal(officialData, labelsName) {
  const path = resolve(officialData, labelsName)
  if (!existsSync(path)) throw new Error(`Official labels not found: ${path}`)
  const text = readFileSync(path, 'utf8')
  const { columns, rows } = parseCsvText(text)
  const index = new Map(columns.map((column, columnIndex) => [column, columnIndex]))
  const required = ['event_id', 'anomaly_code', 'start_time', 'end_time']
  for (const column of required) {
    if (!index.has(column)) throw new Error(`Labels CSV is missing column: ${column}`)
  }
  return rows.map((row) => ({
    id: row[index.get('event_id')],
    code: row[index.get('anomaly_code')],
    startTime: row[index.get('start_time')],
    endTime: row[index.get('end_time')],
  }))
}

/**
 * Restrict labels to the imported UTC day window.
 *
 * `--limit-days` imports only the first N calendar days, so scoring those
 * predictions against every label in the file counts un-imported days as false
 * negatives and makes the fast loop report a meaningless recall.
 */
function filterGroundTruthToDays(groundTruth, days) {
  if (days.length === 0) return groundTruth
  const window = new Set(days)
  return groundTruth.filter(
    (event) => window.has(event.startTime.slice(0, 10)) || window.has(event.endTime.slice(0, 10)),
  )
}

function loadGroundTruthFixture() {
  const read = (name) => JSON.parse(
    readFileSync(resolve(repositoryRoot, `packages/h2-contracts/fixtures/${name}`), 'utf8'),
  )
  return ['golden-c03.json', 'golden-c04.json'].map((name) => {
    const event = read(name)
    return {
      id: event.eventId,
      code: event.code,
      startTime: event.startTime,
      endTime: event.endTime,
    }
  })
}

function chunkLinesByDay(headerLine, dataLines) {
  const byDay = new Map()
  for (const line of dataLines) {
    const timestamp = line.split(',')[0]
    const day = timestamp.slice(0, 10)
    const chunk = byDay.get(day) ?? []
    chunk.push(line)
    byDay.set(day, chunk)
  }
  return [...byDay.entries()]
    .sort(([dayA], [dayB]) => dayA.localeCompare(dayB))
    .map(([day, lines]) => ({ day, text: `${headerLine}\n${lines.join('\n')}\n` }))
}

/**
 * The sanitized tiny fixture predates the 69-field official schema, so the
 * validation lane pads the missing columns at import time (the fixture file
 * itself is frozen and untouched). Derived columns that follow directly from
 * present base columns are computed with the official formulas from
 * `fields.json`; all other columns receive a neutral zero.
 */
function padFixtureToOfficialSchema(text) {
  const { columns, rows } = parseCsvText(text)
  const missing = OFFICIAL_FIELDS.filter((name) => !columns.includes(name))
  if (missing.length === 0) return text
  const index = new Map(columns.map((column, columnIndex) => [column, columnIndex]))
  const derivedCell = (row, name) => {
    const pcc = Number(row[index.get('pcc_power_actual_kw')] ?? '')
    const exportLimit = Number(row[index.get('grid_export_power_limit_kw')] ?? '')
    const importLimit = Number(row[index.get('grid_import_power_limit_kw')] ?? '')
    switch (name) {
      case 'pcc_export_power_violation_kw':
        return Number.isFinite(pcc) && Number.isFinite(exportLimit)
          ? String(Math.max(0, pcc - exportLimit))
          : '0'
      case 'pcc_import_power_violation_kw':
        return Number.isFinite(pcc) && Number.isFinite(importLimit)
          ? String(Math.max(0, -pcc - importLimit))
          : '0'
      default:
        return '0'
    }
  }
  const paddedRows = rows.map((row) => [...row, ...missing.map((name) => derivedCell(row, name))])
  return serializeCsv([...columns, ...missing], paddedRows)
}

async function collectPredictions({ mode, set, officialData, limitDays }) {
  const webPort = await freeLoopbackPort()
  const analyticsPort = await freeLoopbackPort()
  const session = await startLauncher({ mode: 'local', webPort, analyticsPort })
  const predictions = []
  const importedChunks = []
  let detectorVersion = null
  try {
    const apiBase = session.ready.analyticsUrl
    if (mode === 'fixture') {
      const text = padFixtureToOfficialSchema(
        readFileSync(
          resolve(repositoryRoot, 'packages/h2-contracts/fixtures/tiny-valid-timeseries.csv'),
          'utf8',
        ),
      )
      const imported = await requestEnvelope(apiBase, '/api/v1/h2-sentinel/datasets:import', {
        filename: 'tiny-valid-timeseries.csv',
        text,
      })
      const run = await requestEnvelope(apiBase, '/api/v1/h2-sentinel/datasets:analyze', {
        datasetId: imported.dataset.datasetId,
      })
      detectorVersion = run.provenance?.modelVersion ?? null
      predictions.push(...run.events)
      importedChunks.push({ day: 'fixture', rows: imported.dataset.rowCount, events: run.events.length })
    } else {
      const preset = SET_PRESETS[set]
      const path = resolve(officialData, preset.timeseries)
      if (!existsSync(path)) throw new Error(`Official timeseries not found: ${path}`)
      const raw = readFileSync(path, 'utf8')
      const lines = raw.replace(/\r\n/g, '\n').split('\n')
      const headerLine = lines[0]
      const dataLines = lines.slice(1).filter((line) => line.trim() !== '')
      const chunks = chunkLinesByDay(headerLine, dataLines)
      let selected = limitDays > 0 ? chunks.slice(0, limitDays) : chunks
      if (preset.minDay !== null) {
        selected = selected.filter((chunk) => chunk.day >= preset.minDay)
      }
      for (const chunk of selected) {
        const normalized = normalizeOfficialCsv(chunk.text)
        const imported = await requestEnvelope(apiBase, '/api/v1/h2-sentinel/datasets:import', {
          filename: `${set}-${chunk.day}.csv`,
          text: normalized,
        })
        const run = await requestEnvelope(apiBase, '/api/v1/h2-sentinel/datasets:analyze', {
          datasetId: imported.dataset.datasetId,
        })
        detectorVersion = detectorVersion ?? run.provenance?.modelVersion ?? null
        importedChunks.push({ day: chunk.day, rows: imported.dataset.rowCount, events: run.events.length })
        predictions.push(...run.events)
      }
    }
  } finally {
    await session.stop()
  }
  return { predictions, importedChunks, detectorVersion }
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  const officialData = options.mode === 'local'
    ? resolve(options.officialData ?? DEFAULT_OFFICIAL_DIR)
    : null
  const preset = SET_PRESETS[options.set]

  const allGroundTruth =
    options.mode === 'fixture' ? loadGroundTruthFixture() : loadGroundTruthLocal(officialData, preset.labels)

  const { predictions, importedChunks, detectorVersion } = await collectPredictions({
    ...options,
    officialData,
  })

  const importedDays =
    options.mode === 'fixture' || (options.limitDays <= 0 && preset.minDay === null)
      ? []
      : importedChunks.map((chunk) => chunk.day)
  const groundTruth = filterGroundTruthToDays(allGroundTruth, importedDays)
  const merged = mergePredictions(
    predictions.map((event) => ({
      id: event.eventId,
      code: event.code,
      startTime: event.startTime,
      endTime: event.endTime,
    })),
  )
  const result = matchEvents({
    groundTruth,
    predictions: merged,
    graceMinutes: options.graceMinutes,
  })
  const classification = classifyEvents({
    groundTruth,
    predictions: merged,
    graceMinutes: options.graceMinutes,
  })

  const byCode = Object.fromEntries(result.byCode.map((entry) => [entry.code, entry]))
  const report = {
    contract: 'h2-sentinel-official-validation-evaluation-v1',
    mode: options.mode,
    set: options.set,
    parameters: {
      graceMinutes: options.graceMinutes,
      limitDays: options.limitDays,
      minDay: preset.minDay,
      mergeGapMinutes: 2,
      matching: 'greedy event-level: same anomaly_code and interval overlap with a 10-minute grace window',
      preprocessing: {
        local: [
          'official timeseries chunked by UTC calendar day',
          'official 69 field names passed through unchanged to the analytics service',
          'naive "YYYY-MM-DD HH:MM:SS" timestamps normalized to ISO-8601 UTC (Z)',
        ],
        fixture: [
          'packages/h2-contracts/fixtures/tiny-valid-timeseries.csv',
          'missing official fields padded with zero at import time (the fixture predates the 69-field schema)',
        ],
      },
    },
    dataset: options.mode === 'fixture'
      ? { source: 'packages/h2-contracts/fixtures/tiny-valid-timeseries.csv', chunks: importedChunks }
      : {
          source: preset.timeseries,
          labelsSource: preset.labels,
          fingerprintSha256: sha256(readFileSync(resolve(officialData, preset.timeseries))),
          labelsFingerprintSha256: sha256(readFileSync(resolve(officialData, preset.labels))),
          chunks: importedChunks,
        },
    groundTruth: {
      count: groundTruth.length,
      totalCount: allGroundTruth.length,
      dayWindow: importedDays.length === 0
        ? 'all days'
        : `${importedDays[0]}..${importedDays[importedDays.length - 1]} (${importedDays.length} days)`,
      byCode: Object.fromEntries(
        [...new Set(groundTruth.map((event) => event.code))].map((code) => [
          code,
          groundTruth.filter((event) => event.code === code).length,
        ]),
      ),
    },
    predictions: {
      rawCount: predictions.length,
      mergedCount: merged.length,
      detectorVersion,
      byCode: Object.fromEntries(
        [...new Set(merged.map((event) => event.code))].map((code) => [
          code,
          merged.filter((event) => event.code === code).length,
        ]),
      ),
    },
    metrics: {
      overall: {
        tp: result.tp,
        fp: result.fp,
        fn: result.fn,
        precision: result.precision,
        recall: result.recall,
        f1: result.f1,
      },
      classification: {
        definition: 'code-agnostic temporal overlap; classification accuracy = code-correct / matched pairs',
        matches: classification.matches,
        correctCode: classification.correctCode,
        detectionPrecision: classification.detectionPrecision,
        detectionRecall: classification.detectionRecall,
        detectionF1: classification.detectionF1,
        classificationAccuracy: classification.classificationAccuracy,
        eventAccuracy: classification.eventAccuracy,
      },
      byCode,
    },
    matches: result.matches,
    unmatchedGroundTruth: result.unmatchedGroundTruth,
    unmatchedPredictions: result.unmatchedPredictions,
    provenance: {
      generatedAt: new Date().toISOString(),
      tool: 'validation/evaluate.mjs',
      limitations: [
        'Event-level evaluation contract, not the organizer score.',
        'Rule detection covers the official C01-C07 field mappings.',
        'Chunking may split predictions that straddle a UTC midnight boundary; adjacent same-code predictions are merged.',
        'With --limit-days, labels are restricted to the imported UTC day window; a truncated run is not comparable to a full-window run.',
      ],
    },
  }

  const outputPath = options.output
    ? resolve(options.output)
    : resolve(
        directory,
        'reports',
        options.mode === 'fixture' ? 'evaluate-fixture.json' : `evaluate-${options.set}.json`,
      )
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

  const overall = report.metrics.overall
  const classificationSummary = report.metrics.classification
  console.log(`mode=${options.mode} set=${options.set} groundTruth=${groundTruth.length} predictions=${merged.length}`)
  console.log(`overall precision=${overall.precision.toFixed(4)} recall=${overall.recall.toFixed(4)} f1=${overall.f1.toFixed(4)} (tp=${overall.tp} fp=${overall.fp} fn=${overall.fn})`)
  console.log(`classification detectionP=${classificationSummary.detectionPrecision.toFixed(4)} detectionR=${classificationSummary.detectionRecall.toFixed(4)} accuracy=${classificationSummary.classificationAccuracy.toFixed(4)} eventAccuracy=${classificationSummary.eventAccuracy.toFixed(4)}`)
  for (const entry of result.byCode) {
    console.log(`  ${entry.code} gt=${entry.groundTruth} pred=${entry.predictions} p=${entry.precision.toFixed(4)} r=${entry.recall.toFixed(4)} f1=${entry.f1.toFixed(4)}`)
  }
  console.log(`report written to ${outputPath}`)
}

await main()
