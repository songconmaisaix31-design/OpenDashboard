import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseCsvText } from './lib/csv.mjs'
import { normalizeOfficialCsv } from './lib/fields.mjs'
import {
  freeLoopbackPort,
  repositoryRoot,
  requestEnvelope,
  startLauncher,
} from './lib/launcher.mjs'
import { matchEvents, mergePredictions } from './lib/metrics.mjs'

const directory = dirname(fileURLToPath(import.meta.url))
const DEFAULT_OFFICIAL_DIR =
  'C:/Users/DW/Desktop/T03_设备故障排查与智能运维助手/T03_设备故障排查与智能运维助手/企业资料包04_雷动/数据与材料'

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
  return {
    mode,
    officialData: values.get('--official-data'),
    limitDays: values.get('--limit-days') === undefined ? 0 : Number(values.get('--limit-days')),
    graceMinutes: values.get('--grace-minutes') === undefined ? 10 : Number(values.get('--grace-minutes')),
    output: values.get('--output'),
  }
}

function loadGroundTruthLocal(officialData) {
  const path = resolve(officialData, '05_validation_event_labels.csv')
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

async function collectPredictions({ mode, officialData, limitDays }) {
  const webPort = await freeLoopbackPort()
  const analyticsPort = await freeLoopbackPort()
  const session = await startLauncher({ mode: 'local', webPort, analyticsPort })
  const predictions = []
  const importedChunks = []
  let detectorVersion = null
  try {
    const apiBase = session.ready.analyticsUrl
    if (mode === 'fixture') {
      const text = readFileSync(
        resolve(repositoryRoot, 'packages/h2-contracts/fixtures/tiny-valid-timeseries.csv'),
        'utf8',
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
      const path = resolve(officialData, '02_validation_timeseries.csv')
      if (!existsSync(path)) throw new Error(`Official timeseries not found: ${path}`)
      const raw = readFileSync(path, 'utf8')
      const lines = raw.replace(/\r\n/g, '\n').split('\n')
      const headerLine = lines[0]
      const dataLines = lines.slice(1).filter((line) => line.trim() !== '')
      const chunks = chunkLinesByDay(headerLine, dataLines)
      const selected = limitDays > 0 ? chunks.slice(0, limitDays) : chunks
      for (const chunk of selected) {
        const normalized = normalizeOfficialCsv(chunk.text)
        const imported = await requestEnvelope(apiBase, '/api/v1/h2-sentinel/datasets:import', {
          filename: `validation-${chunk.day}.csv`,
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

  const groundTruth =
    options.mode === 'fixture' ? loadGroundTruthFixture() : loadGroundTruthLocal(officialData)

  const { predictions, importedChunks, detectorVersion } = await collectPredictions({
    ...options,
    officialData,
  })
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

  const byCode = Object.fromEntries(result.byCode.map((entry) => [entry.code, entry]))
  const report = {
    contract: 'h2-sentinel-official-validation-evaluation-v1',
    mode: options.mode,
    parameters: {
      graceMinutes: options.graceMinutes,
      limitDays: options.limitDays,
      mergeGapMinutes: 2,
      matching: 'greedy event-level: same anomaly_code and interval overlap with a 10-minute grace window',
      preprocessing: {
        local: [
          'official timeseries chunked by UTC calendar day',
          'official fields mapped to canonical backend fields per packages/h2-vocabulary/data/deprecated-field-map.json',
          'total_electrolyzer_power_kw = elz1+elz2+elz3 power_actual_kw',
          'naive "YYYY-MM-DD HH:MM:SS" timestamps normalized to ISO-8601 UTC (Z)',
        ],
        fixture: ['packages/h2-contracts/fixtures/tiny-valid-timeseries.csv'],
      },
    },
    dataset: options.mode === 'fixture'
      ? { source: 'packages/h2-contracts/fixtures/tiny-valid-timeseries.csv', chunks: importedChunks }
      : {
          source: resolve(officialData, '02_validation_timeseries.csv'),
          fingerprintSha256: sha256(readFileSync(resolve(officialData, '02_validation_timeseries.csv'))),
          labelsFingerprintSha256: sha256(readFileSync(resolve(officialData, '05_validation_event_labels.csv'))),
          chunks: importedChunks,
        },
    groundTruth: {
      count: groundTruth.length,
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
        'The deterministic backend fallback detects C03/C04 only.',
        'Chunking may split predictions that straddle a UTC midnight boundary; adjacent same-code predictions are merged.',
      ],
    },
  }

  const outputPath = options.output
    ? resolve(options.output)
    : resolve(directory, 'reports', `evaluate-${options.mode}.json`)
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

  const overall = report.metrics.overall
  console.log(`mode=${options.mode} groundTruth=${groundTruth.length} predictions=${merged.length}`)
  console.log(`overall precision=${overall.precision.toFixed(4)} recall=${overall.recall.toFixed(4)} f1=${overall.f1.toFixed(4)} (tp=${overall.tp} fp=${overall.fp} fn=${overall.fn})`)
  for (const entry of result.byCode) {
    console.log(`  ${entry.code} gt=${entry.groundTruth} pred=${entry.predictions} p=${entry.precision.toFixed(4)} r=${entry.recall.toFixed(4)} f1=${entry.f1.toFixed(4)}`)
  }
  console.log(`report written to ${outputPath}`)
}

await main()
