import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createServer as createHttpServer, request as httpRequest } from 'node:http'
import { createServer as createNetServer } from 'node:net'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const LOOPBACK = '127.0.0.1'
const directory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(directory, '../../..')
const launcherPath = resolve(repositoryRoot, 'scripts/h2-sentinel/launch.mjs')
const fixtureCsvPath = resolve(repositoryRoot, 'packages/h2-contracts/fixtures/tiny-valid-timeseries.csv')
const mainPath = resolve(repositoryRoot, 'apps/web/src/main.tsx')
const shellPath = resolve(repositoryRoot, 'apps/web/src/features/h2-sentinel/components/common/H2Shell.tsx')
const fixtureDataSourcePath = pathToFileURL(resolve(repositoryRoot, 'plugins/h2-ems/src/fixture-data-source.ts')).href

const outcomes = []
const activeLaunchers = new Set()

function safeDetail(error) {
  const detail = error instanceof Error ? error.message : String(error)
  return /(?:[A-Za-z]:\\|\/Users\/|\/home\/|authorization:|api[_-]?key|password|token|secret)/i.test(detail)
    ? 'redacted assertion failure'
    : detail.replace(/\s+/g, ' ').slice(0, 240)
}

async function check(id, scope, operation) {
  try {
    await operation()
    outcomes.push({ id, scope, status: 'PASS' })
    console.log(`PASS ${id} — ${scope}`)
  } catch (error) {
    outcomes.push({ id, scope, status: 'FAIL', detail: safeDetail(error) })
    console.error(`FAIL ${id} — ${scope}: ${safeDetail(error)}`)
  }
}

function collectLines(stream, destination) {
  let pending = ''
  stream.setEncoding('utf8')
  stream.on('data', (chunk) => {
    pending += chunk
    const parts = pending.split(/\r?\n/)
    pending = parts.pop() ?? ''
    destination.push(...parts)
  })
  stream.on('end', () => {
    if (pending) destination.push(pending)
  })
}

function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve({ code: child.exitCode, signal: child.signalCode })
  }
  return new Promise((resolvePromise, rejectPromise) => {
    const timeout = setTimeout(() => rejectPromise(new Error('child exit timed out')), timeoutMs)
    child.once('exit', (code, signal) => {
      clearTimeout(timeout)
      resolvePromise({ code, signal })
    })
  })
}

async function freePort() {
  const server = createNetServer()
  await new Promise((resolvePromise, rejectPromise) => {
    server.once('error', rejectPromise)
    server.listen({ host: LOOPBACK, port: 0 }, resolvePromise)
  })
  const address = server.address()
  assert.ok(address && typeof address === 'object')
  await new Promise((resolvePromise, rejectPromise) => server.close((error) => error ? rejectPromise(error) : resolvePromise()))
  return address.port
}

async function assertPortReleased(port) {
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    const server = createNetServer()
    try {
      await new Promise((resolvePromise, rejectPromise) => {
        server.once('error', rejectPromise)
        server.listen({ host: LOOPBACK, port, exclusive: true }, resolvePromise)
      })
      await new Promise((resolvePromise) => server.close(resolvePromise))
      return
    } catch {
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 100))
    }
  }
  assert.fail('owned loopback port was not released')
}

async function assertPidStopped(pid) {
  assert.equal(typeof pid, 'number')
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    try {
      process.kill(pid, 0)
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 100))
    } catch {
      return
    }
  }
  assert.fail('owned launcher child did not exit')
}

async function startLauncher(argumentsList) {
  const stdout = []
  const stderr = []
  const child = spawn(process.execPath, [launcherPath, ...argumentsList, '--ready-json'], {
    cwd: repositoryRoot,
    env: process.env,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    windowsHide: true,
  })
  activeLaunchers.add(child)
  collectLines(child.stdout, stdout)
  collectLines(child.stderr, stderr)

  const ready = await new Promise((resolvePromise, rejectPromise) => {
    const deadline = setTimeout(() => rejectPromise(new Error('launcher did not become ready')), 30_000)
    const inspect = () => {
      for (const line of stdout) {
        try {
          const parsed = JSON.parse(line)
          if (parsed.event === 'READY') {
            clearTimeout(deadline)
            clearInterval(interval)
            resolvePromise(parsed)
            return
          }
        } catch {
          // Startup diagnostics are deliberately not evidence artifacts.
        }
      }
    }
    const interval = setInterval(inspect, 25)
    child.once('exit', () => {
      clearTimeout(deadline)
      clearInterval(interval)
      rejectPromise(new Error('launcher exited before readiness'))
    })
  })
  return { child, ready, stderr }
}

async function stopLauncher(session) {
  if (session.child.exitCode === null && session.child.signalCode === null) {
    session.child.send({ type: 'shutdown' })
  }
  const result = await waitForExit(session.child, 15_000)
  activeLaunchers.delete(session.child)
  assert.equal(result.code, 0, 'launcher shutdown must exit cleanly')
}

function startExpectedFailure(argumentsList) {
  const stderr = []
  const child = spawn(process.execPath, [launcherPath, ...argumentsList, '--ready-json'], {
    cwd: repositoryRoot,
    env: process.env,
    shell: false,
    stdio: ['ignore', 'ignore', 'pipe'],
    windowsHide: true,
  })
  collectLines(child.stderr, stderr)
  return { child, stderr }
}

async function request(baseUrl, route, payload, headers = {}) {
  const response = await fetch(new URL(route, baseUrl), {
    method: payload === undefined ? 'GET' : 'POST',
    headers: payload === undefined ? headers : { 'content-type': 'application/json', ...headers },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
    redirect: 'error',
    signal: AbortSignal.timeout(5_000),
  })
  const text = await response.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    assert.fail(`public API response for ${route} was not JSON`)
  }
  return { response, body, text }
}

async function rawHttpRequest(baseUrl, route, headers) {
  const url = new URL(route, baseUrl)
  return new Promise((resolvePromise, rejectPromise) => {
    const request = httpRequest(url, { method: 'GET', headers, timeout: 5_000 }, (response) => {
      const chunks = []
      response.on('data', (chunk) => chunks.push(chunk))
      response.once('end', () => {
        const text = Buffer.concat(chunks).toString('utf8')
        try {
          resolvePromise({
            response: {
              status: response.statusCode ?? 0,
              ok: (response.statusCode ?? 0) >= 200 && (response.statusCode ?? 0) < 300,
            },
            body: JSON.parse(text),
            text,
          })
        } catch {
          rejectPromise(new Error('raw public API response was not JSON'))
        }
      })
    })
    request.once('timeout', () => request.destroy(new Error('raw HTTP request timed out')))
    request.once('error', rejectPromise)
    request.end()
  })
}

function assertSafePublicText(text) {
  assert.doesNotMatch(text, /(?:[A-Za-z]:\\|\\\\|\/(?:Users|home|etc)\/|traceback|authorization:|api[_-]?key|password|private[_ -]?key|token|secret)/i)
}

function assertSuccess(result) {
  assert.equal(result.response.ok, true)
  assert.equal(result.body.ok, true)
  assert.ok(result.body.status === 'success' || result.body.status === 'warning')
  return result.body.data
}

function assertRedactedError(result, expectedStatus) {
  assert.equal(result.response.status, expectedStatus)
  assert.equal(result.body.ok, false)
  assert.equal(result.body.status, 'error')
  assert.equal(typeof result.body.error?.code, 'string')
  assert.equal(typeof result.body.error?.message, 'string')
  assert.equal(typeof result.body.error?.retryable, 'boolean')
  assertSafePublicText(result.text)
}

function parseCsv(text) {
  const rows = []
  let cell = ''
  let row = []
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"'
        index += 1
      } else if (character === '"') {
        quoted = false
      } else {
        cell += character
      }
    } else if (character === '"') {
      quoted = true
    } else if (character === ',') {
      row.push(cell)
      cell = ''
    } else if (character === '\n') {
      row.push(cell.replace(/\r$/, ''))
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += character
    }
  }
  if (quoted) assert.fail('submission CSV has an unterminated quoted field')
  if (cell !== '' || row.length > 0) {
    row.push(cell.replace(/\r$/, ''))
    rows.push(row)
  }
  return rows
}

async function fixtureReportArtifact() {
  const program = [
    `import { createFixtureH2EmsDataSource } from ${JSON.stringify(fixtureDataSourcePath)};`,
    "const source = createFixtureH2EmsDataSource();",
    "const result = await source.exportReport({ runId: 'run-fixture-h2-sentinel-golden', kind: 'single_event_diagnosis', eventId: 'C03-20260105-001' });",
    'process.stdout.write(JSON.stringify(result));',
  ].join('')
  const child = spawn(process.execPath, ['--import', 'tsx', '--input-type=module', '--eval', program], {
    cwd: repositoryRoot,
    env: process.env,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
  const stdout = []
  const stderr = []
  collectLines(child.stdout, stdout)
  collectLines(child.stderr, stderr)
  const result = await waitForExit(child, 20_000)
  assert.equal(result.code, 0, 'Fixture public data source probe must run')
  assert.equal(stderr.length, 0, 'Fixture public data source probe must not emit diagnostics')
  return JSON.parse(stdout.join('\n'))
}

async function verifySourceLevelEntryContract() {
  const [main, shell] = await Promise.all([readFile(mainPath, 'utf8'), readFile(shellPath, 'utf8')])
  assert.match(main, /H2_ENTRY_PATHS = new Set\(\['\/h2-sentinel', '\/h2-sentinel\/'\]\)/)
  assert.match(main, /return \{ kind: 'generic' \}/)
  assert.match(main, /if \(mode !== 'fixture' && mode !== 'local'\)/)
  assert.match(main, /message\.setAttribute\('role', 'alert'\)/)
  for (const route of ['overview', 'events', 'diagnosis', 'analysis', 'assistant', 'reports']) {
    assert.match(shell, new RegExp(`route: '${route}'`))
  }
}

async function testFixtureLaunchAndArtifact() {
  const webPort = await freePort()
  const session = await startLauncher(['--mode', 'fixture', '--web-port', String(webPort)])
  try {
    assert.equal(session.ready.mode, 'fixture')
    assert.equal(session.ready.analyticsUrl, null)
    assert.equal(session.ready.analyticsPid, null)
    assert.equal(session.ready.webUrl, `http://${LOOPBACK}:${webPort}/h2-sentinel/?mode=fixture`)
    const generic = await fetch(`http://${LOOPBACK}:${webPort}/`, { signal: AbortSignal.timeout(5_000) })
    const h2 = await fetch(session.ready.webUrl, { signal: AbortSignal.timeout(5_000) })
    assert.equal(generic.ok, true)
    assert.equal(h2.ok, true)
    const artifact = await fixtureReportArtifact()
    assert.equal(artifact.mediaType, 'text/html')
    assert.equal(artifact.descriptor.format, 'html')
    assert.match(artifact.descriptor.filename, /^[A-Za-z0-9][A-Za-z0-9._-]*$/)
    assert.equal(artifact.descriptor.contentHash, `sha256:${createHash('sha256').update(artifact.content).digest('hex')}`)
  } finally {
    await stopLauncher(session)
  }
  await assertPidStopped(session.ready.webPid)
  await assertPortReleased(webPort)
}

async function testLocalCanonicalApiAndExports() {
  const webPort = await freePort()
  const analyticsPort = await freePort()
  const session = await startLauncher([
    '--mode', 'local', '--web-port', String(webPort), '--analytics-port', String(analyticsPort),
  ])
  try {
    assert.equal(session.ready.mode, 'local')
    assert.equal(session.ready.analyticsUrl, `http://${LOOPBACK}:${analyticsPort}/`)
    assert.equal(session.ready.webUrl, `http://${LOOPBACK}:${webPort}/h2-sentinel/?mode=local`)
    assert.equal(typeof session.ready.analyticsPid, 'number')

    const health = await request(session.ready.analyticsUrl, '/health')
    const healthData = assertSuccess(health)
    assert.equal(healthData.status, 'healthy')
    assert.equal(healthData.bindHost, LOOPBACK)

    const invalidHost = await rawHttpRequest(session.ready.analyticsUrl, '/health', { host: 'external.invalid' })
    assertRedactedError(invalidHost, 400)
    assert.equal(invalidHost.body.error.code, 'boundary.invalid_host')
    const invalidOrigin = await rawHttpRequest(session.ready.analyticsUrl, '/health', { origin: 'https://external.invalid' })
    assertRedactedError(invalidOrigin, 403)
    assert.equal(invalidOrigin.body.error.code, 'boundary.invalid_origin')

    const csv = await readFile(fixtureCsvPath, 'utf8')
    const imported = assertSuccess(await request(
      session.ready.analyticsUrl,
      '/api/v1/h2-sentinel/datasets:import',
      { filename: 'tiny-valid-timeseries.csv', text: csv },
    ))
    assert.ok(imported.dataset.datasetId)
    const run = assertSuccess(await request(
      session.ready.analyticsUrl,
      '/api/v1/h2-sentinel/datasets:analyze',
      { datasetId: imported.dataset.datasetId },
    ))
    assert.deepEqual(run.events.map((event) => event.code), ['C03', 'C04'])
    assert.equal(run.events[1].impact.value, 29.333333333333332)
    const events = assertSuccess(await request(
      session.ready.analyticsUrl,
      '/api/v1/h2-sentinel/runs/events',
      { runId: run.runId },
    ))
    assert.deepEqual(events.map((event) => event.eventId), ['C03-20260105-001', 'C04-20260105-001'])

    const assistantFirst = assertSuccess(await request(
      session.ready.analyticsUrl,
      '/api/v1/h2-sentinel/assistant:ask',
      { runId: run.runId, questionId: 'H2Q03', eventId: events[0].eventId, allowLlmRendering: false },
    ))
    const assistantSecond = assertSuccess(await request(
      session.ready.analyticsUrl,
      '/api/v1/h2-sentinel/assistant:ask',
      { runId: run.runId, questionId: 'H2Q03', eventId: events[0].eventId, allowLlmRendering: false },
    ))
    assert.equal(assistantFirst.mode, 'DETERMINISTIC_TEMPLATE')
    assert.deepEqual(assistantSecond, assistantFirst)

    const report = assertSuccess(await request(
      session.ready.analyticsUrl,
      '/api/v1/h2-sentinel/reports:export',
      { runId: run.runId, kind: 'single_event_diagnosis', eventId: events[0].eventId },
    ))
    assert.equal(report.mediaType, 'text/html')
    assert.equal(report.descriptor.format, 'html')
    assert.match(report.descriptor.filename, /^[A-Za-z0-9][A-Za-z0-9._-]*$/)
    assert.equal(report.descriptor.contentHash, `sha256:${createHash('sha256').update(report.content).digest('hex')}`)
    assertSafePublicText(`${report.descriptor.safetyDisclaimer}\n${report.content}`)

    const submission = assertSuccess(await request(
      session.ready.analyticsUrl,
      '/api/v1/h2-sentinel/submissions:export',
      { runId: run.runId },
    ))
    assert.equal(submission.mediaType, 'text/csv')
    const submissionRows = parseCsv(submission.content)
    assert.equal(submissionRows[0].length, 16)
    assert.deepEqual(submissionRows[0], [
      'pred_event_id', 'start_time', 'end_time', 'anomaly_code', 'anomaly_subtype', 'severity',
      'primary_control_object', 'affected_equipment', 'confidence', 'evidence_json', 'root_cause',
      'recommended_action', 'primary_impact_metric', 'estimated_impact_value', 'first_detection_time',
      'requires_human_confirmation',
    ])
    assert.deepEqual(submissionRows.slice(1).map((row) => [row[0], row[3], row[13]]), [
      ['C03-20260105-001', 'C03', '112.4'],
      ['C04-20260105-001', 'C04', '29.333333333333332'],
    ])
    assertSafePublicText(submission.content)

    const missingRun = await request(
      session.ready.analyticsUrl,
      '/api/v1/h2-sentinel/datasets:analyze',
      { datasetId: 'unknown-dataset' },
    )
    assertRedactedError(missingRun, 404)
  } finally {
    await stopLauncher(session)
  }
  await assertPidStopped(session.ready.webPid)
  await assertPidStopped(session.ready.analyticsPid)
  await assertPortReleased(webPort)
  await assertPortReleased(analyticsPort)
}

async function testLaunchFailureBoundaries() {
  const webPort = await freePort()
  const webBlocker = createNetServer()
  await new Promise((resolvePromise, rejectPromise) => {
    webBlocker.once('error', rejectPromise)
    webBlocker.listen({ host: LOOPBACK, port: webPort }, resolvePromise)
  })
  try {
    const session = startExpectedFailure(['--mode', 'fixture', '--web-port', String(webPort)])
    const result = await waitForExit(session.child, 10_000)
    assert.equal(result.code, 1)
    assert.match(session.stderr.join(' '), /Web port \d+ is already in use/)
  } finally {
    await new Promise((resolvePromise) => webBlocker.close(resolvePromise))
  }

  const analyticsPort = await freePort()
  const analyticsBlocker = createNetServer()
  await new Promise((resolvePromise, rejectPromise) => {
    analyticsBlocker.once('error', rejectPromise)
    analyticsBlocker.listen({ host: LOOPBACK, port: analyticsPort }, resolvePromise)
  })
  try {
    const session = startExpectedFailure([
      '--mode', 'local', '--web-port', String(await freePort()), '--analytics-port', String(analyticsPort),
    ])
    const result = await waitForExit(session.child, 10_000)
    assert.equal(result.code, 1)
    assert.match(session.stderr.join(' '), /Analytics port \d+ is already in use/)
  } finally {
    await new Promise((resolvePromise) => analyticsBlocker.close(resolvePromise))
  }

  const unhealthyPort = await freePort()
  const unhealthy = createHttpServer((request, response) => {
    if (request.url === '/health') {
      response.writeHead(302, { location: '/healthy' })
      response.end()
      return
    }
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ ok: true, status: 'success', data: { status: 'healthy' } }))
  })
  await new Promise((resolvePromise, rejectPromise) => {
    unhealthy.once('error', rejectPromise)
    unhealthy.listen({ host: LOOPBACK, port: unhealthyPort }, resolvePromise)
  })
  try {
    const session = startExpectedFailure([
      '--mode', 'local', '--external-sidecar-url', `http://${LOOPBACK}:${unhealthyPort}/`, '--health-timeout-ms', '500',
    ])
    const result = await waitForExit(session.child, 10_000)
    assert.equal(result.code, 1)
    assert.match(session.stderr.join(' '), /health check timed out/)
  } finally {
    await new Promise((resolvePromise) => unhealthy.close(resolvePromise))
  }
}

await check('A02/A05', 'Fixture launcher starts without a Python sidecar, exports a C03 HTML artifact, and cleans its owned Web process', testFixtureLaunchAndArtifact)
await check('A01/A03/A04/A05/A07', 'Local public API import, analysis, events, deterministic assistant, export, loopback boundary, and redacted error', testLocalCanonicalApiAndExports)
await check('A04/A07', 'Occupied ports and redirecting sidecar readiness fail visibly and safely', testLaunchFailureBoundaries)
await check('A06/A08', 'Source-level generic/H2 entry, closed invalid-mode alert, and six-page navigation contract', verifySourceLevelEntryContract)

for (const child of activeLaunchers) {
  if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
}

const summary = {
  contract: 'h2-sentinel-assembled-qa-v1',
  results: outcomes,
  counts: Object.fromEntries(['PASS', 'FAIL'].map((status) => [status, outcomes.filter((item) => item.status === status).length])),
  visualVerification: 'MANUAL_REQUIRED: no browser automation dependency was added; inspect Fixture desktop and 390px widths separately.',
}
console.log(JSON.stringify(summary))
if (outcomes.some((item) => item.status === 'FAIL')) process.exitCode = 1
