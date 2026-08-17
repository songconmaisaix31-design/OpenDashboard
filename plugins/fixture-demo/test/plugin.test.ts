import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createPluginRuntime } from '../../../packages/plugin-runtime/src/index.ts'
import {
  FIXTURE_DEMO_DATA_SOURCE,
  fixtureDemoPlugin,
} from '../src/index.ts'

describe('fixtureDemoPlugin', () => {
  it('provides the deterministic DemoDataSource through the runtime', async () => {
    const runtime = createPluginRuntime([fixtureDemoPlugin])

    await runtime.start()
    assert.equal(
      fixtureDemoPlugin.manifest.capabilities.includes('observation:publish'),
      false,
    )
    const dataSource = runtime.resolve(FIXTURE_DEMO_DATA_SOURCE)
    const snapshot = await dataSource.loadInitialSnapshot()

    assert.equal(snapshot.phase, 'incident_open')
    assert.equal(snapshot.target.provenance.mode, 'fixture')
    assert.equal(runtime.snapshot()[0]?.state, 'active')

    await runtime.stop()
    assert.equal(runtime.snapshot()[0]?.state, 'disposed')
  })
})
