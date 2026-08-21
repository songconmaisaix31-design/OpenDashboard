import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseCsvText } from '../../validation/lib/csv.mjs'
import { normalizeOfficialCsv } from '../../validation/lib/fields.mjs'
import {
  freeLoopbackPort,
  repositoryRoot,
  requestEnvelope,
  startLauncher,
} from '../../validation/lib/launcher.mjs'
import {
  eventToSubmissionRow,
  serializeSubmission,
} from '../../validation/lib/submission.mjs'
import { validateSubmissionText } from '../../validation/check-submission.mjs'

const directory = dirname(fileURLToPath(import.meta.url))
export const artifactDirectory = resolve(directory, 'artifacts')
const DEFAULT_OFFICIAL_DIR =
  'C:/Users/DW/Desktop/T03_设备故障排查与智能运维助手/T03_设备故障排查与智能运维助手/企业资料包04_雷动/数据与材料'

function sha256(buffer) {
  return `sha256:${createHash('sha256').update(buffer).digest('hex')}`
}

function parseArguments(argumentsList) {
  const values = new Map()
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index]
    if (argument === '--with-install') {
      values.set('--with-install', true)
      continue
    }
    const next = argumentsList[index + 1]
    if (next === undefined || next.startsWith('--')) {
      throw new Error(`${argument} requires a value`)
    }
    values.set(argument, next)
    index += 1
  }
  const mode = values.get('--mode') ?? 'fixture'
  if (mode !== 'local' && mode !== 'fixture') {
    throw new Error('--mode must be local or fixture')
  }
  return {
    mode,
    officialData: values.get('--official-data'),
    limitDays: values.get('--limit-days') === undefined ? 0 : Number(values.get('--limit-days')),
    withInstall: values.get('--with-install') === true,
    out: values.get('--out'),
  }
}

async function runCleanInstall() {
  console.log('STEP clean environment: npm ci')
  const child = spawn('npm', ['ci'], {
    cwd: repositoryRoot,
    env: process.env,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
  const stderr = []
  child.stderr.setEncoding('utf8')
  child.stderr.on('data', (chunk) => stderr.push(chunk))
  const code = await new Promise((resolvePromise) => child.once('exit', resolvePromise))
  if (code !== 0) {
    throw new Error(`npm ci failed (${code}): ${stderr.join('')}`)
  }
  console.log('npm ci completed')
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

async function main() {
  const options = parseArguments(process.argv.slice(2))
  const startedAt = Date.now()
  const troubleshooting = []
  if (options.withInstall) {
    await runCleanInstall()
  }

  const webPort = await freeLoopbackPort()
  const analyticsPort = await freeLoopbackPort()
  console.log(`STEP launch h2:local launcher on web=${webPort} analytics=${analyticsPort}`)
  const session = await startLauncher({ mode: 'local', webPort, analyticsPort })
  console.log(`READY webUrl=${session.ready.webUrl}`)
  console.log(`READY analyticsUrl=${session.ready.analyticsUrl}`)
  console.log(`READY webPid=${session.ready.webPid} analyticsPid=${session.ready.analyticsPid}`)

  const collectedEvents = []
  let dataset = null
  let sourceFingerprint = null
  let sourceRows = 0
  try {
    const apiBase = session.ready.analyticsUrl
    if (options.mode === 'fixture') {
      const text = readFileSync(
        resolve(repositoryRoot, 'packages/h2-contracts/fixtures/tiny-valid-timeseries.csv'),
        'utf8',
      )
      dataset = { source: 'packages/h2-contracts/fixtures/tiny-valid-timeseries.csv' }
      sourceFingerprint = `sha256:${createHash('sha256').update(text).digest('hex')}`
      const imported = await requestEnvelope(apiBase, '/api/v1/h2-sentinel/datasets:import', {
        filename: 'tiny-valid-timeseries.csv',
        text,
      })
      const run = await requestEnvelope(apiBase, '/api/v1/h2-sentinel/datasets:analyze', {
        datasetId: imported.dataset.datasetId,
      })
      sourceRows = imported.dataset.rowCount
      collectedEvents.push(...run.events)
    } else {
      const officialData = resolve(options.officialData ?? DEFAULT_OFFICIAL_DIR)
      const path = resolve(officialData, '03_test_timeseries.csv')
      if (!existsSync(path)) {
        throw new Error(`Official test timeseries not found: ${path}`)
      }
      const raw = readFileSync(path, 'utf8')
      dataset = { source: path }
      sourceFingerprint = sha256(readFileSync(path))
      const lines = raw.replace(/\r\n/g, '\n').split('\n')
      const headerLine = lines[0]
      const dataLines = lines.slice(1).filter((line) => line.trim() !== '')
      sourceRows = dataLines.length
      const chunks = chunkLinesByDay(headerLine, dataLines)
      const selected = options.limitDays > 0 ? chunks.slice(0, options.limitDays) : chunks
      console.log(`STEP importing ${selected.length} official test day chunks (${sourceRows} source rows)`)
      for (const chunk of selected) {
        const normalized = normalizeOfficialCsv(chunk.text)
        const imported = await requestEnvelope(apiBase, '/api/v1/h2-sentinel/datasets:import', {
          filename: `test-${chunk.day}.csv`,
          text: normalized,
        })
        const run = await requestEnvelope(apiBase, '/api/v1/h2-sentinel/datasets:analyze', {
          datasetId: imported.dataset.datasetId,
        })
        collectedEvents.push(...run.events)
      }
    }

    const uniqueEventIds = new Set()
    const rows = []
    for (const event of collectedEvents) {
      let eventId = event.eventId
      let suffix = 2
      while (uniqueEventIds.has(eventId)) {
        eventId = `${event.eventId}-${suffix}`
        suffix += 1
      }
      uniqueEventIds.add(eventId)
      rows.push(eventToSubmissionRow({ ...event, eventId }))
    }

    const submissionCsv = serializeSubmission(rows)
    const outputPath = options.out
      ? resolve(options.out)
      : resolve(artifactDirectory, 'submission.csv')
    mkdirSync(dirname(outputPath), { recursive: true })
    writeFileSync(outputPath, submissionCsv, 'utf8')

    const validation = validateSubmissionText(submissionCsv)
    console.log(`STEP exported submission.csv with ${rows.length} rows to ${outputPath}`)
    console.log(`STEP submission validation valid=${validation.valid} warnings=${validation.warnings.length}`)
    for (const warning of validation.warnings) console.log(`  WARN ${warning}`)
    if (!validation.valid) {
      for (const issue of validation.issues.slice(0, 20)) console.log(`  ISSUE ${issue}`)
      troubleshooting.push(`submission validation failed with ${validation.issues.length} issues`)
      process.exitCode = 1
      return
    }
    console.log(`STEP submission.csv is valid (${rows.length} rows, 16 columns)`)
    console.log(
      `STEP elapsed=${((Date.now() - startedAt) / 1000).toFixed(1)}s source=${sourceFingerprint} rows=${sourceRows}`,
    )
  } catch (error) {
    troubleshooting.push(
      `launcher/analytics failure: ${error instanceof Error ? error.message : String(error)}`,
    )
    console.error(`FAIL ${troubleshooting[0]}`)
    process.exitCode = 1
  } finally {
    await session.stop()
  }

  if (troubleshooting.length > 0) {
    console.error('TROUBLESHOOTING')
    for (const note of troubleshooting) console.error(`- ${note}`)
    console.error(
      '- Port conflicts: choose free ports with --web-port/--analytics-port defaults; the launcher reports "already in use".',
    )
    console.error(
      '- Local mode requires uv and Python: run `uv --version`; the analytics child is started through the locked uv environment.',
    )
    console.error(
      '- Health timeouts: the launcher waits for the canonical loopback health envelope; check stderr for the exact rejection reason.',
    )
  }
}

await main()
