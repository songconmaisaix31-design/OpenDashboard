import { execFile } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(directory, '..')
const evaluatorPath = resolve(directory, 'evaluate.mjs')
const reportsDirectory = resolve(directory, 'reports')
const DEFAULT_OFFICIAL_DIR =
  'C:/Users/DW/Desktop/T03_设备故障排查与智能运维助手/T03_设备故障排查与智能运维助手/企业资料包04_雷动/数据与材料'
const RED_THRESHOLD = 0.15

function parseArguments(argumentsList) {
  const values = new Map()
  const flags = new Set()
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index]
    if (argument === '--combine-only') {
      flags.add(argument)
      continue
    }
    const next = argumentsList[index + 1]
    if (next === undefined || next.startsWith('--')) {
      throw new Error(`${argument} requires a value`)
    }
    values.set(argument, next)
    index += 1
  }
  return {
    officialData: resolve(values.get('--official-data') ?? DEFAULT_OFFICIAL_DIR),
    output: values.get('--output'),
    combineOnly: flags.has('--combine-only'),
  }
}

function runEvaluation({ officialData, set }) {
  return new Promise((resolvePromise, rejectPromise) => {
    execFile(
      process.execPath,
      [evaluatorPath, '--mode', 'local', '--set', set, '--official-data', officialData],
      { cwd: repositoryRoot, timeout: 30 * 60 * 1000 },
      (error, stdout, stderr) => {
        if (error) {
          rejectPromise(new Error(`evaluate.mjs --set ${set} failed: ${stderr || error.message}`))
          return
        }
        resolvePromise({ set, stdout })
      },
    )
  })
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  const outputPath = options.output
    ? resolve(options.output)
    : resolve(reportsDirectory, 'overfit-sentinel.json')

  console.log(`overfit sentinel: validation set vs train-last-90 window (delta threshold ${RED_THRESHOLD})`)
  if (!options.combineOnly) {
    await runEvaluation({ officialData: options.officialData, set: 'validation' })
    await runEvaluation({ officialData: options.officialData, set: 'train-last-90' })
  } else {
    console.log('--combine-only: reusing the existing evaluation reports')
  }

  const validationReport = JSON.parse(
    readFileSync(resolve(reportsDirectory, 'evaluate-validation.json'), 'utf8'),
  )
  const trainReport = JSON.parse(
    readFileSync(resolve(reportsDirectory, 'evaluate-train-last-90.json'), 'utf8'),
  )

  const validationF1 = validationReport.metrics.overall.f1
  const trainF1 = trainReport.metrics.overall.f1
  const delta = Math.abs(validationF1 - trainF1)
  const red = delta > RED_THRESHOLD
  const deltaReason = red
    ? `|validation F1 (${validationF1.toFixed(4)}) - train-last-90 F1 (${trainF1.toFixed(4)})| = ${delta.toFixed(4)} > ${RED_THRESHOLD}`
    : null

  const report = {
    contract: 'h2-sentinel-overfit-sentinel-v1',
    threshold: { redDelta: RED_THRESHOLD },
    windows: {
      validation: {
        source: '02_validation_timeseries.csv vs 05_validation_event_labels.csv',
        groundTruth: validationReport.groundTruth.count,
        predictions: validationReport.predictions.mergedCount,
        f1: validationF1,
        precision: validationReport.metrics.overall.precision,
        recall: validationReport.metrics.overall.recall,
        classificationAccuracy: validationReport.metrics.classification.classificationAccuracy,
        report: 'validation/reports/evaluate-validation.json',
      },
      trainLast90: {
        source: '01_train_timeseries.csv (days >= 2025-10-03) vs 04_train_event_labels.csv',
        groundTruth: trainReport.groundTruth.count,
        predictions: trainReport.predictions.mergedCount,
        f1: trainF1,
        precision: trainReport.metrics.overall.precision,
        recall: trainReport.metrics.overall.recall,
        classificationAccuracy: trainReport.metrics.classification.classificationAccuracy,
        report: 'validation/reports/evaluate-train-last-90.json',
      },
    },
    result: {
      validationF1,
      trainLast90F1: trainF1,
      absoluteDelta: delta,
      red,
      reason: deltaReason ?? 'within the 0.15 tolerance; no overfit signal',
      interpretation: red
        ? 'RED: the gap between the validation-set F1 and the held-out train-window F1 exceeds 0.15. Investigate detector thresholds tuned on the validation set before reporting a final F1.'
        : 'GREEN: both windows agree within 0.15; no evidence that validation-set tuning diverged from the train window.',
    },
    provenance: {
      generatedAt: new Date().toISOString(),
      tool: 'validation/overfit-sentinel.mjs',
      evaluator: 'validation/evaluate.mjs',
      matching: 'greedy event-level: same anomaly_code and interval overlap with a 10-minute grace window',
      limitations: [
        'The train-last-90 window is not a held-out test set; it is the same rule pipeline on the final 90 days of the official train series.',
        'Event-level evaluation contract, not the organizer score.',
      ],
    },
  }

  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

  console.log(`validation f1=${validationF1.toFixed(4)} | train-last-90 f1=${trainF1.toFixed(4)} | delta=${delta.toFixed(4)}`)
  console.log(`sentinel verdict: ${red ? 'RED' : 'GREEN'} — ${report.result.reason}`)
  console.log(`report written to ${outputPath}`)
  if (red) process.exitCode = 1
}

await main()
