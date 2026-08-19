import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  H2_FIXTURE_PROVENANCE,
  H2_FIXTURE_ANALYSIS_RUN,
} from '../../../packages/h2-contracts/src/index.ts'
import {
  createH2EmsPlugin,
  createLiveH2EmsDataSource,
  H2_EMS_DATA_SOURCE,
  H2_EMS_LIVE_ROUTES,
  H2EmsAdapterError,
} from '../src/index.ts'
import { createPluginRuntime } from '../../../packages/plugin-runtime/src/index.ts'

const envelope = (data: unknown): Response =>
  Response.json({
    ok: true,
    status: 'success',
    data,
    warnings: [],
    provenance: H2_FIXTURE_PROVENANCE,
  })

describe('H2 EMS loopback adapter', () => {
  it('rejects non-loopback and path-bearing base URLs before fetch', () => {
    for (const baseUrl of ['https://example.com/', 'http://localhost:8000/', 'http://127.0.0.1:8000/api']) {
      assert.throws(
        () => createLiveH2EmsDataSource({ enabled: true, baseUrl }),
        (error: unknown) => error instanceof H2EmsAdapterError && error.code === 'invalid_loopback_url',
      )
    }
  })

  it('uses the mandated namespace and preserves live response provenance', async () => {
    const source = createLiveH2EmsDataSource({
      enabled: true,
      baseUrl: 'http://127.0.0.1:8123/',
      fetchFn: async (input) => {
        assert.equal(new URL(input.toString()).pathname, H2_EMS_LIVE_ROUTES.overview)
        return envelope(H2_FIXTURE_ANALYSIS_RUN)
      },
    })
    const result = await source.getOverview(H2_FIXTURE_ANALYSIS_RUN.runId)
    assert.equal(result.provenance.mode, 'FIXTURE')
  })

  it('registers explicit local mode through the static plugin factory', async () => {
    const runtime = createPluginRuntime([
      createH2EmsPlugin({
        enabled: true,
        baseUrl: 'http://127.0.0.1:8123/',
        fetchFn: async () => envelope('LIVE_ANALYSIS'),
      }),
    ])
    await runtime.start()
    assert.equal(await runtime.resolve(H2_EMS_DATA_SOURCE).getMode(), 'LIVE_ANALYSIS')
    await runtime.stop()
  })

  it('maps timeout and cancellation to stable errors', async () => {
    const timedOut = createLiveH2EmsDataSource({
      enabled: true,
      baseUrl: 'http://127.0.0.1:8123/',
      timeoutMs: 1,
      fetchFn: (_input, init) => new Promise((_, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('raw transport failure')))),
    })
    await assert.rejects(
      () => timedOut.getMode(),
      (error: unknown) => error instanceof H2EmsAdapterError && error.code === 'request_timeout',
    )

    const controller = new AbortController()
    controller.abort()
    const cancelled = createLiveH2EmsDataSource({
      enabled: true,
      baseUrl: 'http://127.0.0.1:8123/',
      signal: controller.signal,
      fetchFn: async () => envelope('LIVE_ANALYSIS'),
    })
    await assert.rejects(
      () => cancelled.getMode(),
      (error: unknown) => error instanceof H2EmsAdapterError && error.code === 'request_aborted',
    )
  })
})
