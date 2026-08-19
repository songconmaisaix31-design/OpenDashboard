import assert from 'node:assert/strict'
import test from 'node:test'

import {
  childFailure,
  isHealthyAnalyticsEnvelope,
  parseLauncherArguments,
} from './launch.mjs'

test('accepts only the closed Fixture and local launch contracts', () => {
  assert.deepEqual(parseLauncherArguments(['--mode', 'fixture']), {
    mode: 'fixture',
    webPort: 5173,
    analyticsPort: 8765,
    externalSidecarUrl: null,
    healthTimeoutMs: 20_000,
    readyJson: false,
    webRuntime: 'dev',
  })
  assert.deepEqual(
    parseLauncherArguments([
      '--mode',
      'local',
      '--external-sidecar-url',
      'http://127.0.0.1:9001/',
      '--ready-json',
      '--web-runtime',
      'preview',
    ]),
    {
      mode: 'local',
      webPort: 5173,
      analyticsPort: 9001,
      externalSidecarUrl: 'http://127.0.0.1:9001/',
      healthTimeoutMs: 20_000,
      readyJson: true,
      webRuntime: 'preview',
    },
  )
})

test('rejects arbitrary modes, commands, ports, and sidecar targets', () => {
  const invalidArguments = [
    [],
    ['--mode', 'remote'],
    ['--mode', 'fixture', '--exec', 'python'],
    ['--mode', 'fixture', '--web-port', '80'],
    ['--mode', 'fixture', '--external-sidecar-url', 'http://127.0.0.1:9001/'],
    ['--mode', 'local', '--external-sidecar-url', 'http://localhost:9001/'],
    ['--mode', 'local', '--external-sidecar-url', 'http://2130706433:9001/'],
    ['--mode', 'local', '--external-sidecar-url', 'http://0x7f000001:9001/'],
    ['--mode', 'local', '--external-sidecar-url', 'http://0177.0.0.1:9001/'],
    ['--mode', 'local', '--external-sidecar-url', 'http://127.0.0.1:9001/api'],
    ['--mode', 'local', '--external-sidecar-url', 'https://127.0.0.1:9001/'],
    [
      '--mode',
      'local',
      '--analytics-port',
      '9001',
      '--external-sidecar-url',
      'http://127.0.0.1:9001/',
    ],
    ['--mode', 'local', '--web-port', '8765'],
  ]

  for (const argumentsList of invalidArguments) {
    assert.throws(() => parseLauncherArguments(argumentsList))
  }
})

test('maps bind-race child exits to the role and actual loopback port', () => {
  const failure = childFailure(
    {
      label: 'Analytics',
      port: 18765,
      spawnError: null,
      child: { exitCode: 1, signalCode: null },
    },
    'before readiness',
  )
  assert.match(failure.message, /Analytics process exited before readiness/)
  assert.match(failure.message, /127\.0\.0\.1:18765/)
  assert.match(failure.message, /analytics port is still available/)
})

test('keeps repeated termination signals handled until cleanup completes', async () => {
  const source = await import('node:fs/promises').then(({ readFile }) =>
    readFile(new URL('./launch.mjs', import.meta.url), 'utf8'),
  )
  assert.match(source, /process\.on\('SIGINT', requestShutdown\)/)
  assert.match(source, /process\.on\('SIGTERM', requestShutdown\)/)
  assert.doesNotMatch(source, /process\.once\('SIG(?:INT|TERM)'/)
  assert.equal((source.match(/redirect: 'error'/g) ?? []).length, 2)
})

test('requires the exact analytics health success envelope', () => {
  assert.equal(
    isHealthyAnalyticsEnvelope({
      ok: true,
      status: 'success',
      data: { status: 'healthy' },
    }),
    true,
  )
  assert.equal(
    isHealthyAnalyticsEnvelope({
      ok: true,
      status: 'warning',
      data: { status: 'healthy' },
    }),
    false,
  )
  assert.equal(
    isHealthyAnalyticsEnvelope({
      ok: true,
      status: 'success',
      data: { status: 'starting' },
    }),
    false,
  )
})
