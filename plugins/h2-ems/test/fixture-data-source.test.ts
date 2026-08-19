import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createPluginRuntime } from '../../../packages/plugin-runtime/src/index.ts'
import {
  createFixtureH2EmsDataSource,
  H2_EMS_DATA_SOURCE,
  h2EmsPlugin,
} from '../src/index.ts'

describe('H2 EMS Fixture adapter', () => {
  it('returns canonical C03/C04 data without sending a request', async () => {
    const source = createFixtureH2EmsDataSource()
    const run = await source.runAnalysis('fixture-h2-sentinel-golden')
    const events = await source.listEvents(run.runId)

    assert.equal(await source.getMode(), 'FIXTURE')
    assert.deepEqual(events.map(({ code }) => code), ['C03', 'C04'])
    assert(events.every(({ provenance }) => provenance.mode === 'FIXTURE'))
    assert(events.every(({ requiresHumanConfirmation }) => requiresHumanConfirmation))
  })

  it('registers the fixture default through the static plugin runtime', async () => {
    const runtime = createPluginRuntime([h2EmsPlugin])
    await runtime.start()
    assert.equal(await runtime.resolve(H2_EMS_DATA_SOURCE).getMode(), 'FIXTURE')
    await runtime.stop()
  })
})
