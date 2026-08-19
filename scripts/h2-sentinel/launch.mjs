import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createServer } from 'node:net'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const LOOPBACK_HOST = '127.0.0.1'
const DEFAULT_WEB_PORT = 5173
const DEFAULT_ANALYTICS_PORT = 8765
const DEFAULT_HEALTH_TIMEOUT_MS = 20_000
const MIN_PORT = 1024
const MAX_PORT = 65_535
const MIN_HEALTH_TIMEOUT_MS = 250
const MAX_HEALTH_TIMEOUT_MS = 60_000
const API_NAMESPACE = '/api/v1/h2-sentinel'
const HEALTH_ENVELOPE_KEYS = Object.freeze([
  'data',
  'ok',
  'provenance',
  'status',
  'warnings',
])
const HEALTH_DATA_KEYS = Object.freeze([
  'aggregationVersion',
  'apiVersion',
  'bindHost',
  'configurationVersion',
  'detectorVersion',
  'featureVersion',
  'namespace',
  'ruleVersion',
  'serviceVersion',
  'status',
])
const HEALTH_PROVENANCE_KEYS = Object.freeze([
  'configurationVersion',
  'generatedAt',
  'limitations',
  'mode',
  'ruleVersion',
  'source',
])
const HEALTH_VERSION_KEYS = Object.freeze([
  'aggregationVersion',
  'apiVersion',
  'configurationVersion',
  'detectorVersion',
  'featureVersion',
  'ruleVersion',
  'serviceVersion',
])
const STABLE_VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')
const analyticsDirectory = resolve(repositoryRoot, 'services/h2-analytics')
const viteEntry = resolve(repositoryRoot, 'node_modules/vite/bin/vite.js')
const productionIndex = resolve(repositoryRoot, 'apps/web/dist/index.html')

class LauncherError extends Error {
  constructor(message) {
    super(message)
    this.name = 'LauncherError'
  }
}

export function parseLauncherArguments(argumentsList) {
  const values = new Map()
  let readyJson = false

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index]
    if (argument === '--ready-json') {
      if (readyJson) throw new LauncherError('--ready-json may be provided only once.')
      readyJson = true
      continue
    }
    if (
      argument !== '--mode' &&
      argument !== '--web-port' &&
      argument !== '--analytics-port' &&
      argument !== '--external-sidecar-url' &&
      argument !== '--health-timeout-ms' &&
      argument !== '--web-runtime'
    ) {
      throw new LauncherError(`Unsupported launcher option: ${String(argument)}`)
    }
    if (values.has(argument)) {
      throw new LauncherError(`${argument} may be provided only once.`)
    }
    const value = argumentsList[index + 1]
    if (value === undefined || value.startsWith('--')) {
      throw new LauncherError(`${argument} requires a value.`)
    }
    values.set(argument, value)
    index += 1
  }

  const mode = values.get('--mode')
  if (mode !== 'fixture' && mode !== 'local') {
    throw new LauncherError('--mode must be fixture or local.')
  }
  const webRuntime = values.get('--web-runtime') ?? 'dev'
  if (webRuntime !== 'dev' && webRuntime !== 'preview') {
    throw new LauncherError('--web-runtime must be dev or preview.')
  }
  const webPort = parsePort(values.get('--web-port') ?? String(DEFAULT_WEB_PORT), '--web-port')
  const analyticsPortWasProvided = values.has('--analytics-port')
  const analyticsPort = parsePort(
    values.get('--analytics-port') ?? String(DEFAULT_ANALYTICS_PORT),
    '--analytics-port',
  )
  const healthTimeoutMs = parseBoundedInteger(
    values.get('--health-timeout-ms') ?? String(DEFAULT_HEALTH_TIMEOUT_MS),
    '--health-timeout-ms',
    MIN_HEALTH_TIMEOUT_MS,
    MAX_HEALTH_TIMEOUT_MS,
  )
  const externalSidecarUrlInput = values.get('--external-sidecar-url')
  if (mode === 'fixture' && externalSidecarUrlInput !== undefined) {
    throw new LauncherError('--external-sidecar-url is available only in local mode.')
  }
  if (externalSidecarUrlInput !== undefined && analyticsPortWasProvided) {
    throw new LauncherError('--external-sidecar-url and --analytics-port cannot be combined.')
  }
  const externalSidecarUrl =
    externalSidecarUrlInput === undefined
      ? null
      : parseExternalSidecarUrl(externalSidecarUrlInput)
  const effectiveAnalyticsPort =
    externalSidecarUrl === null
      ? analyticsPort
      : Number(new URL(externalSidecarUrl).port)

  if (mode === 'local' && webPort === effectiveAnalyticsPort) {
    throw new LauncherError('Web and analytics ports must be different.')
  }

  return Object.freeze({
    mode,
    webPort,
    analyticsPort: effectiveAnalyticsPort,
    externalSidecarUrl,
    healthTimeoutMs,
    readyJson,
    webRuntime,
  })
}

function parsePort(input, option) {
  return parseBoundedInteger(input, option, MIN_PORT, MAX_PORT)
}

function parseBoundedInteger(input, option, minimum, maximum) {
  if (!/^\d+$/.test(input)) {
    throw new LauncherError(`${option} must be a decimal integer.`)
  }
  const value = Number(input)
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new LauncherError(`${option} must be between ${minimum} and ${maximum}.`)
  }
  return value
}

function parseExternalSidecarUrl(input) {
  let url
  try {
    url = new URL(input)
  } catch {
    throw new LauncherError('--external-sidecar-url must be a valid URL.')
  }
  if (
    url.protocol !== 'http:' ||
    url.hostname !== LOOPBACK_HOST ||
    url.port === '' ||
    url.username !== '' ||
    url.password !== '' ||
    url.pathname !== '/' ||
    url.search !== '' ||
    url.hash !== ''
  ) {
    throw new LauncherError(
      '--external-sidecar-url must match http://127.0.0.1:<port>/.',
    )
  }
  parsePort(url.port, '--external-sidecar-url port')
  const canonicalUrl = `http://${LOOPBACK_HOST}:${url.port}/`
  if (input !== canonicalUrl) {
    throw new LauncherError(
      '--external-sidecar-url must use the canonical literal 127.0.0.1 URL.',
    )
  }
  return canonicalUrl
}

export function isHealthyAnalyticsEnvelope(value) {
  if (!isRecord(value) || !hasExactKeys(value, HEALTH_ENVELOPE_KEYS)) return false
  if (value.ok !== true || value.status !== 'success') return false
  if (!Array.isArray(value.warnings) || value.warnings.length !== 0) return false
  if (!isRecord(value.data) || !hasExactKeys(value.data, HEALTH_DATA_KEYS)) return false
  if (value.data.status !== 'healthy') return false
  if (value.data.namespace !== API_NAMESPACE || value.data.bindHost !== LOOPBACK_HOST) {
    return false
  }
  if (!HEALTH_VERSION_KEYS.every((key) => isStableVersion(value.data[key]))) return false
  return isCanonicalHealthProvenance(value.provenance, value.data)
}

function isCanonicalHealthProvenance(value, healthData) {
  return (
    isRecord(value) &&
    hasExactKeys(value, HEALTH_PROVENANCE_KEYS) &&
    value.mode === 'RULE' &&
    value.source === 'h2-analytics-api' &&
    isNonEmptyString(value.generatedAt) &&
    isStableVersion(value.ruleVersion) &&
    value.ruleVersion === healthData.ruleVersion &&
    isStableVersion(value.configurationVersion) &&
    value.configurationVersion === healthData.configurationVersion &&
    Array.isArray(value.limitations) &&
    value.limitations.every(isNonEmptyString)
  )
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasExactKeys(value, expectedKeys) {
  const actualKeys = Object.keys(value)
  return (
    actualKeys.length === expectedKeys.length &&
    expectedKeys.every((key) => Object.hasOwn(value, key))
  )
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0 && value === value.trim()
}

function isStableVersion(value) {
  return isNonEmptyString(value) && STABLE_VERSION_PATTERN.test(value)
}

async function assertPortAvailable(port, label) {
  await new Promise((resolvePromise, rejectPromise) => {
    const server = createServer()
    server.unref()
    server.once('error', (error) => {
      const detail = error && error.code === 'EADDRINUSE' ? 'is already in use' : 'is unavailable'
      rejectPromise(
        new LauncherError(
          `${label} port ${port} ${detail} on ${LOOPBACK_HOST}. Choose another ${label.toLowerCase()} port.`,
        ),
      )
    })
    server.listen({ host: LOOPBACK_HOST, port, exclusive: true }, () => {
      server.close((error) => {
        if (error) rejectPromise(new LauncherError(`${label} port ${port} could not be released.`))
        else resolvePromise()
      })
    })
  })
}

function spawnOwnedProcess(label, port, command, argumentsList, options) {
  const child = spawn(command, argumentsList, {
    ...options,
    detached: process.platform !== 'win32',
    shell: false,
    stdio: 'inherit',
    windowsHide: true,
  })
  const record = { label, port, child, spawnError: null }
  child.on('error', (error) => {
    record.spawnError = error
  })
  return record
}

export function childFailure(record, phase) {
  const endpoint = `${LOOPBACK_HOST}:${record.port}`
  if (record.spawnError) {
    if (record.label === 'Analytics') {
      return new LauncherError(
        `Analytics could not start on ${endpoint}. uv is required for local mode; install uv and sync the locked dev environment.`,
      )
    }
    return new LauncherError(
      `Web could not start on ${endpoint}. Run npm ci and retry with an available --web-port.`,
    )
  }
  if (record.child.exitCode !== null || record.child.signalCode !== null) {
    const outcome =
      record.child.exitCode === null
        ? `signal ${record.child.signalCode ?? 'unknown'}`
        : `exit code ${record.child.exitCode}`
    return new LauncherError(
      `${record.label} process exited ${phase} on ${endpoint} (${outcome}). Verify the selected ${record.label.toLowerCase()} port is still available.`,
    )
  }
  return null
}

async function waitForAnalyticsHealth(url, timeoutMs, analyticsProcess) {
  const deadline = Date.now() + timeoutMs
  const healthUrl = new URL('/health', url)

  while (Date.now() < deadline) {
    if (analyticsProcess) {
      const failure = childFailure(analyticsProcess, 'before readiness')
      if (failure) throw failure
    }
    try {
      const response = await fetch(healthUrl, {
        redirect: 'error',
        signal: AbortSignal.timeout(1_000),
      })
      if (response.ok && isHealthyAnalyticsEnvelope(await response.json())) return
    } catch {
      // Readiness retries intentionally expose no remote response details.
    }
    await delay(100)
  }

  throw new LauncherError(
    `Analytics health check timed out after ${timeoutMs} ms on ${LOOPBACK_HOST}:${url.port}. Verify that /health returns the canonical healthy success envelope.`,
  )
}

async function waitForWeb(url, timeoutMs, webProcess) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const failure = childFailure(webProcess, 'before readiness')
    if (failure) throw failure
    try {
      const response = await fetch(url, {
        redirect: 'error',
        signal: AbortSignal.timeout(1_000),
      })
      if (response.ok && (await response.text()).includes('id="root"')) return
    } catch {
      // Vite may need several polling intervals before accepting requests.
    }
    await delay(100)
  }
  throw new LauncherError(
    `Web readiness timed out after ${timeoutMs} ms on ${LOOPBACK_HOST}:${url.port}. Run npm ci and verify Vite can start.`,
  )
}

function delay(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds))
}

function runAndWait(command, argumentsList) {
  return new Promise((resolvePromise) => {
    const child = spawn(command, argumentsList, {
      shell: false,
      stdio: 'ignore',
      windowsHide: true,
    })
    let settled = false
    const finish = (result) => {
      if (settled) return
      settled = true
      resolvePromise(result)
    }
    child.once('error', () => finish({ ok: false }))
    child.once('exit', (code) => finish({ ok: code === 0 }))
  })
}

async function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) return true
  return new Promise((resolvePromise) => {
    const timeout = setTimeout(() => resolvePromise(false), timeoutMs)
    child.once('exit', () => {
      clearTimeout(timeout)
      resolvePromise(true)
    })
  })
}

export async function terminatePidTree(pid) {
  if (!pid) return true

  if (process.platform === 'win32') {
    return (await runAndWait('taskkill.exe', ['/PID', String(pid), '/T', '/F'])).ok
  }

  try {
    process.kill(-pid, 'SIGTERM')
  } catch {
    return true
  }
  await delay(3_000)
  try {
    process.kill(-pid, 0)
  } catch {
    return true
  }
  try {
    process.kill(-pid, 'SIGKILL')
  } catch {
    // The process group may have completed between the probe and forced stop.
  }
  return true
}

export async function terminateProcessTree(record) {
  const pid = record.child.pid
  if (!pid) return
  await terminatePidTree(pid)
  if (!(await waitForExit(record.child, 2_000))) {
    try {
      record.child.kill('SIGKILL')
    } catch {
      // The process may have completed after tree cleanup.
    }
  }
  if (!(await waitForExit(record.child, 2_000))) {
    throw new LauncherError(`${record.label} process tree could not be stopped.`)
  }
}

async function stopOwnedProcesses(records) {
  const errors = []
  for (const record of [...records].reverse()) {
    try {
      await terminateProcessTree(record)
    } catch (error) {
      errors.push(error)
    }
  }
  if (errors.length > 0) {
    throw new LauncherError('One or more child process trees could not be stopped.')
  }
}

function waitForShutdownOrChildExit(records, shutdown) {
  const exits = records.map(
    (record) =>
      new Promise((_, rejectPromise) => {
        record.child.once('exit', (code, signal) => {
          if (!shutdown.requested) {
            const outcome = code === null ? `signal ${signal ?? 'unknown'}` : `exit code ${code}`
            rejectPromise(
              new LauncherError(
                `${record.label} process exited unexpectedly on ${LOOPBACK_HOST}:${record.port} (${outcome}).`,
              ),
            )
          }
        })
      }),
  )
  return Promise.race([shutdown.promise, ...exits])
}

function createShutdownSignal() {
  let resolveShutdown
  const shutdown = {
    requested: false,
    promise: new Promise((resolvePromise) => {
      resolveShutdown = resolvePromise
    }),
    request() {
      if (shutdown.requested) return
      shutdown.requested = true
      resolveShutdown()
    },
  }
  return shutdown
}

export async function runLauncher(options) {
  if (!existsSync(viteEntry)) {
    throw new LauncherError('Vite is unavailable. Run npm ci before starting H2 Sentinel.')
  }
  if (options.webRuntime === 'preview' && !existsSync(productionIndex)) {
    throw new LauncherError('The production Web build is unavailable. Run npm run h2:build first.')
  }

  await assertPortAvailable(options.webPort, 'Web')
  if (options.mode === 'local' && options.externalSidecarUrl === null) {
    await assertPortAvailable(options.analyticsPort, 'Analytics')
  }

  const ownedProcesses = []
  const shutdown = createShutdownSignal()
  const requestShutdown = () => shutdown.request()
  const requestIpcShutdown = (message) => {
    if (
      typeof message === 'object' &&
      message !== null &&
      message.type === 'shutdown'
    ) {
      shutdown.request()
    }
  }
  process.on('SIGINT', requestShutdown)
  process.on('SIGTERM', requestShutdown)
  process.on('message', requestIpcShutdown)

  try {
    let analyticsProcess = null
    let analyticsUrl = null
    if (options.mode === 'local') {
      analyticsUrl =
        options.externalSidecarUrl ?? `http://${LOOPBACK_HOST}:${options.analyticsPort}/`
      if (options.externalSidecarUrl === null) {
        analyticsProcess = spawnOwnedProcess(
          'Analytics',
          options.analyticsPort,
          'uv',
          [
            'run',
            '--locked',
            '--extra',
            'dev',
            'python',
            '-m',
            'h2_analytics',
            '--port',
            String(options.analyticsPort),
          ],
          { cwd: analyticsDirectory, env: process.env },
        )
        ownedProcesses.push(analyticsProcess)
      }
      await waitForAnalyticsHealth(analyticsUrl, options.healthTimeoutMs, analyticsProcess)
    }

    const webEnvironment = { ...process.env }
    delete webEnvironment.H2_SENTINEL_ANALYTICS_PORT
    if (options.mode === 'local') {
      webEnvironment.H2_SENTINEL_ANALYTICS_PORT = String(options.analyticsPort)
    }
    const viteArguments =
      options.webRuntime === 'preview'
        ? ['preview', 'apps/web']
        : ['apps/web']
    viteArguments.push(
      '--config',
      'vite.config.ts',
      '--host',
      LOOPBACK_HOST,
      '--strictPort',
      '--port',
      String(options.webPort),
    )
    const webProcess = spawnOwnedProcess(
      'Web',
      options.webPort,
      process.execPath,
      [viteEntry, ...viteArguments],
      { cwd: repositoryRoot, env: webEnvironment },
    )
    ownedProcesses.push(webProcess)

    const webUrl = new URL(
      `/h2-sentinel/?mode=${options.mode}`,
      `http://${LOOPBACK_HOST}:${options.webPort}/`,
    )
    await waitForWeb(webUrl, options.healthTimeoutMs, webProcess)

    const readyRecord = {
      event: 'READY',
      mode: options.mode,
      webUrl: webUrl.href,
      analyticsUrl,
      webPid: webProcess.child.pid ?? null,
      analyticsPid: analyticsProcess?.child.pid ?? null,
    }
    console.log(options.readyJson ? JSON.stringify(readyRecord) : `READY ${JSON.stringify(readyRecord)}`)
    await waitForShutdownOrChildExit(ownedProcesses, shutdown)
  } finally {
    process.removeListener('SIGINT', requestShutdown)
    process.removeListener('SIGTERM', requestShutdown)
    process.removeListener('message', requestIpcShutdown)
    await stopOwnedProcesses(ownedProcesses)
  }
}

async function main() {
  try {
    const options = parseLauncherArguments(process.argv.slice(2))
    await runLauncher(options)
  } catch (error) {
    const message = error instanceof LauncherError ? error.message : 'Launcher failed unexpectedly.'
    console.error(`[H2 Sentinel] ${message}`)
    process.exitCode = 1
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main()
}

export { API_NAMESPACE, LauncherError, LOOPBACK_HOST }
