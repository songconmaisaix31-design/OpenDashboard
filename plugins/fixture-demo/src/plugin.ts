import {
  createServiceToken,
  type DemoDataSource,
  type PluginDefinition,
} from '../../../packages/contracts/src/index.ts'

import { createFixtureDataSource } from './fixture-data-source.ts'

export const FIXTURE_DEMO_DATA_SOURCE = createServiceToken<DemoDataSource>(
  'opendashboard.demo:data-source',
)

/**
 * The first reviewed Tier 1 plugin. Activation only creates deterministic
 * in-memory state and registers it with the static runtime.
 */
const fixtureDemoDefinition: PluginDefinition = {
  manifest: {
    schemaVersion: 1,
    apiVersion: 1,
    id: 'opendashboard.fixture-demo',
    version: '1.0.0',
    displayName: 'OpenDashboard Fixture Demo',
    tier: 1,
    activation: 'startup',
    requires: [],
    capabilities: [
      'target:read',
      'incident:write',
      'evidence:write',
      'action:fixture',
    ],
    provenance: 'fixture',
  },
  activate(context) {
    return context.provide(FIXTURE_DEMO_DATA_SOURCE, createFixtureDataSource())
  },
}

export const fixtureDemoPlugin: PluginDefinition = Object.freeze(
  fixtureDemoDefinition,
)
