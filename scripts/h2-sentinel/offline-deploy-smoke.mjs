import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { normalizeOfficialCsv, OFFICIAL_FIELDS } from '../../validation/lib/fields.mjs'
import {
  freeLoopbackPort,
  repositoryRoot,
  requestEnvelope,
  startLauncher,
} from '../../validation/lib/launcher.mjs'
import { parseCsvText } from '../../validation/lib/csv.mjs'
import { validateSubmissionText } from '../../validation/check-submission.mjs'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const DEFAULT_OFFICIAL_DIR =
  'C:/Users/DW/Desktop/T03_设备故障排查与智能运维助手/T03_设备故障排查与智能运维助手/企业资料包04_雷动/数据与材料'
const TEST_SET_FILENAME = '03_test_timeseries.csv'
const ARTIFACT_DIRECTORY = resolve(scriptDirectory, 'artifacts')
const DEFAULT_OUTPUT_REPORT = resolve(
  repositoryRoot,
  'validation/reports/offline-deploy-smoke.json',
)
const LAUNCH_TIMEOUT_MS = 60_000
const REQUEST_TIMEOUT_MS = 120_000

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
  return {
    officialData: resolve(values.get('--official-data') ?? DEFAULT_OFFICIAL_DIR),
    output: values.get('--output') ? resolve(values.get('--output')) : DEFAULT_OUTPUT_REPORT,
    keepServer: values.get('--keep-server') === 'true',
  }
}

function verifyPrerequisites() {
  const problems = []
  if (!existsSync(resolve(repositoryRoot, 'node_modules'))) {
    problems.push('node_modules is missing; run `npm ci` first (D4 clean-env step).')
  }
  return problems
}

function formatSubmissionCheckerNote(check) {
  const status = check.valid ? 'passed' : 'failed'
  const issueCount = check.issues.length
  const issueSummary = issueCount === 0 ? '' : ` (${issueCount} issue${issueCount === 1 ? '' : 's'})`
  return `The affected_equipment serialization is checked against the official comma-separated token format; the current submission checker ${status}${issueSummary}.`
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  const prerequisites = verifyPrerequisites()
  if (prerequisites.length > 0) {
    for (const problem of prerequisites) console.error(`FAIL prereq: ${problem}`)
    process.exitCode = 1
    return
  }

  const timeseriesPath = resolve(options.officialData, TEST_SET_FILENAME)
  if (!existsSync(timeseriesPath)) {
    console.error(`FAIL official test set not found: ${timeseriesPath}`)
    process.exitCode = 1
    return
  }

  const webPort = await freeLoopbackPort()
  const analyticsPort = await freeLoopbackPort()
  const session = await startLauncher({ mode: 'local', webPort, analyticsPort })
  const ports = {
    web: webPort,
    analytics: analyticsPort,
    webUrl: session.ready.webUrl,
    analyticsUrl: session.ready.analyticsUrl,
  }
  console.log(`READY web=${ports.webUrl} analytics=${ports.analyticsUrl}`)
  console.log(`ports: web=${webPort} analytics=${analyticsPort}`)

  const steps = []
  try {
    const apiBase = session.ready.analyticsUrl

    // 1. Normalize the official test set exactly like the validation lane:
    //    naive timestamps to ISO-8601 UTC; the 69 official headers pass through.
    const raw = readFileSync(timeseriesPath, 'utf8')
    const lines = raw.replace(/\r\n/g, '\n').split('\n')
    const headerLine = lines[0]
    const headerCount = headerLine.split(',').length
    const dataLines = lines.slice(1).filter((line) => line.trim() !== '')
    if (dataLines.length !== 172_800) {
      console.log(`NOTE test set row count is ${dataLines.length}; expected 172,800`)
    }
    const normalized = normalizeOfficialCsv(`${headerLine}\n${dataLines.join('\n')}\n`)
    const { columns } = parseCsvText(normalized)
    const missingFields = OFFICIAL_FIELDS.filter((name) => !columns.includes(name))
    steps.push({
      step: 'normalize',
      rows: dataLines.length,
      headerColumns: headerCount,
      officialFieldCount: OFFICIAL_FIELDS.length,
      missingFields,
      status: missingFields.length === 0 ? 'passed' : 'failed',
    })

    // 2. Import the full test set in a single request.
    const importStartedAt = Date.now()
    const imported = await requestWithTimeout(
      apiBase,
      '/api/v1/h2-sentinel/datasets:import',
      { filename: TEST_SET_FILENAME, text: normalized },
      REQUEST_TIMEOUT_MS,
    )
    const importDurationMs = Date.now() - importStartedAt
    steps.push({
      step: 'import',
      datasetId: imported.dataset.datasetId,
      rowCount: imported.dataset.rowCount,
      fingerprint: imported.dataset.fingerprint,
      durationMs: importDurationMs,
      status: imported.dataset.rowCount === dataLines.length ? 'passed' : 'failed',
    })

    // 3. Analyze the dataset.
    const analyzeStartedAt = Date.now()
    const run = await requestWithTimeout(
      apiBase,
      '/api/v1/h2-sentinel/datasets:analyze',
      { datasetId: imported.dataset.datasetId },
      REQUEST_TIMEOUT_MS,
    )
    const analyzeDurationMs = Date.now() - analyzeStartedAt
    steps.push({
      step: 'analyze',
      runId: run.runId,
      events: run.events.length,
      detectorVersion: run.provenance?.modelVersion ?? null,
      durationMs: analyzeDurationMs,
      status: 'passed',
    })

    // 4. Export the submission CSV (same-origin proxy path, user-facing).
    const submission = await requestWithTimeout(
      session.ready.webUrl,
      '/api/v1/h2-sentinel/submissions:export',
      { runId: run.runId },
      REQUEST_TIMEOUT_MS,
    )
    mkdirSync(ARTIFACT_DIRECTORY, { recursive: true })
    const submissionPath = resolve(ARTIFACT_DIRECTORY, 'submission-testset.csv')
    writeFileSync(submissionPath, submission.content, 'utf8')
    const check = validateSubmissionText(submission.content)
    steps.push({
      step: 'export',
      mediaType: submission.mediaType,
      rows: submission.content.trim().split('\n').length - 1,
      artifactPath: submissionPath,
      checkerValid: check.valid,
      checkerIssues: check.issues.slice(0, 5),
      checkerRowCount: check.rowCount,
      status: 'passed',
    })

    // 5. Verdict: the pipeline steps must all pass, and the exported file must
    //    satisfy the official submission format (D3). A format failure blocks
    //    the verdict even when import/analyze/export succeed.
    const report = {
      contract: 'h2-sentinel-offline-deploy-smoke-v1',
      verdict: steps.every((step) => step.status === 'passed') && check.valid ? 'passed' : 'blocked',
      prerequisites,
      ports,
      dataset: {
        source: TEST_SET_FILENAME,
        absolutePath: timeseriesPath,
        rows: dataLines.length,
      },
      steps,
      notes: [
        formatSubmissionCheckerNote(check),
        'Artifact directory is gitignored; the JSON report is the committed evidence.',
      ],
      provenance: {
        generatedAt: new Date().toISOString(),
        tool: 'scripts/h2-sentinel/offline-deploy-smoke.mjs',
        environment: {
          node: process.version,
          platform: process.platform,
        },
      },
    }
    mkdirSync(dirname(options.output), { recursive: true })
    writeFileSync(options.output, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
    console.log(`exported ${steps.find((s) => s.step === 'export').rows} submission rows to ${submissionPath}`)
    console.log(`submission checker: ${check.valid ? 'PASS' : 'FAIL'} (${check.issues.length} issues)`)
    console.log(`report written to ${options.output}`)
    if (check.issues.length > 0) {
      for (const issue of check.issues.slice(0, 3)) console.log(`  checker: ${issue}`)
    }
    if (report.verdict !== 'passed') process.exitCode = 1
  } catch (error) {
    console.error(`FAIL offline deploy smoke: ${error.message}`)
    process.exitCode = 1
  } finally {
    if (!options.keepServer) {
      await session.stop()
      console.log(`stopped launcher (web ${webPort}, analytics ${analyticsPort})`)
    } else {
      console.log(`--keep-server: leaving launcher running on web ${webPort}, analytics ${analyticsPort}`)
    }
  }
}

async function requestWithTimeout(baseUrl, route, payload, timeoutMs) {
  const response = await fetch(new URL(route, baseUrl), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  })
  const body = await response.json()
  if (!response.ok || body.ok !== true) {
    const detail = Array.isArray(body.details) ? ` ${body.details.join(' ')}` : ''
    throw new Error(
      `${route} returned HTTP ${response.status} ${body.code ?? ''}: ${body.message ?? 'unknown error'}${detail}`,
    )
  }
  return body.data
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main()
}

export { formatSubmissionCheckerNote }
