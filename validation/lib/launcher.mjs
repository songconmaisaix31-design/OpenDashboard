import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { terminatePidTree } from '../../scripts/h2-sentinel/launch.mjs'

const LOOPBACK_HOST = '127.0.0.1'
const directory = dirname(fileURLToPath(import.meta.url))
export const repositoryRoot = resolve(directory, '../..')
const launcherPath = resolve(directory, '../../scripts/h2-sentinel/launch.mjs')

export async function freeLoopbackPort() {
  return new Promise((resolvePromise, rejectPromise) => {
    const server = createServer()
    server.once('error', rejectPromise)
    server.listen({ host: LOOPBACK_HOST, port: 0 }, () => {
      const address = server.address()
      if (address === null || typeof address !== 'object') {
        server.close()
        rejectPromise(new Error('Failed to allocate a loopback port.'))
        return
      }
      const port = address.port
      server.close((error) => (error ? rejectPromise(error) : resolvePromise(port)))
    })
  })
}

function collectLines(stream, lines) {
  let pending = ''
  stream.setEncoding('utf8')
  stream.on('data', (chunk) => {
    pending += chunk
    const parts = pending.split(/\r?\n/)
    pending = parts.pop() ?? ''
    lines.push(...parts)
  })
  stream.on('end', () => {
    if (pending) lines.push(pending)
  })
}

function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve({ code: child.exitCode, signal: child.signalCode })
  }
  return new Promise((resolvePromise, rejectPromise) => {
    const timeout = setTimeout(
      () => rejectPromise(new Error('Launcher process exit timed out.')),
      timeoutMs,
    )
    child.once('exit', (code, signal) => {
      clearTimeout(timeout)
      resolvePromise({ code, signal })
    })
  })
}

export async function startLauncher({ mode, webPort, analyticsPort }) {
  const argumentsList = [
    '--mode',
    mode,
    '--web-port',
    String(webPort),
    '--ready-json',
  ]
  if (mode === 'local') {
    argumentsList.push('--analytics-port', String(analyticsPort))
  }
  const stdout = []
  const stderr = []
  const child = spawn(process.execPath, [launcherPath, ...argumentsList], {
    cwd: repositoryRoot,
    env: process.env,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    windowsHide: true,
  })
  collectLines(child.stdout, stdout)
  collectLines(child.stderr, stderr)

  const ready = await new Promise((resolvePromise, rejectPromise) => {
    const deadline = setTimeout(() => {
      rejectPromise(new Error(`Launcher readiness timed out: ${stderr.join(' ')}`))
    }, 60_000)
    const inspect = () => {
      for (const line of stdout) {
        try {
          const value = JSON.parse(line)
          if (value.event === 'READY') {
            clearTimeout(deadline)
            resolvePromise(value)
            return
          }
        } catch {
          // Vite and uv output is intentionally ignored by the ready parser.
        }
      }
    }
    const interval = setInterval(inspect, 25)
    child.once('exit', (code) => {
      clearTimeout(deadline)
      clearInterval(interval)
      rejectPromise(
        new Error(`Launcher exited before readiness (${code}): ${stderr.join(' ')}`),
      )
    })
    const originalResolve = resolvePromise
    resolvePromise = (value) => {
      clearInterval(interval)
      originalResolve(value)
    }
  })

  return {
    child,
    ready,
    stdout,
    stderr,
    async stop({ timeoutMs = 20_000 } = {}) {
      if (child.exitCode === null && child.signalCode === null) {
        child.send({ type: 'shutdown' })
      }
      try {
        const result = await waitForExit(child, timeoutMs)
        return { code: result.code, signal: result.signal, timedOut: false }
      } catch {
        await terminatePidTree(child.pid)
        return { code: null, signal: null, timedOut: true }
      }
    },
  }
}

export async function requestEnvelope(baseUrl, route, payload) {
  const response = await fetch(new URL(route, baseUrl), {
    method: payload === undefined ? 'GET' : 'POST',
    ...(payload === undefined
      ? {}
      : {
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        }),
    signal: AbortSignal.timeout(30_000),
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

export function assertLoopbackHttp(text) {
  return typeof text === 'string' && text.startsWith(`http://${LOOPBACK_HOST}:`)
}
