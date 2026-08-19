import assert from 'node:assert/strict'
import test from 'node:test'

import {
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
