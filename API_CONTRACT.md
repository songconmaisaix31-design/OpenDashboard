# OpenDashboard Plugin Contract

- Status: v1 implemented and verified
- Transport: in-process static composition for the PF1/PF2/PF7 baseline
- Canonical source: `packages/contracts/src/**` and exported runtime types in `packages/plugin-runtime/src/**`

## Goals

- Make plugin identity, compatibility, dependencies, trust tier, and declared capabilities explicit.
- Keep optional providers behind typed service tokens.
- Guarantee deterministic activation and cleanup.
- Prevent a manifest from being mistaken for execution authorization.

## Manifest

```ts
type PluginTier = 0 | 1 | 2
type PluginActivation = 'startup' | 'on-demand'
type PluginProvenance = 'core' | 'official' | 'fixture' | 'third-party'

type PluginCapability =
  | 'target:read'
  | 'observation:publish'
  | 'incident:write'
  | 'evidence:write'
  | 'action:fixture'

interface PluginManifestV1 {
  readonly schemaVersion: 1
  readonly apiVersion: 1
  readonly id: string
  readonly version: string
  readonly displayName: string
  readonly tier: PluginTier
  readonly activation: PluginActivation
  readonly requires: readonly string[]
  readonly capabilities: readonly PluginCapability[]
  readonly provenance: PluginProvenance
}
```

IDs use lowercase segments separated only by dots or hyphens and are unique within one runtime. Versions use a numeric `major.minor.patch` shape. Runtime validation rejects unknown keys before activation, including for compile-time definitions.

## Lifecycle

```ts
interface Disposable {
  dispose(): void | Promise<void>
}

declare const serviceTokenType: unique symbol

interface ServiceToken<T> {
  readonly id: string
  readonly [serviceTokenType]?: (value: T) => T
}

interface PluginContext {
  provide<T>(token: ServiceToken<T>, value: T): Disposable
  resolve<T>(token: ServiceToken<T>): T
}

interface PluginDefinition {
  readonly manifest: PluginManifestV1
  activate(context: PluginContext): Disposable | Promise<Disposable>
}
```

`provide` is accepted only during plugin activation and rejects duplicate service IDs. `resolve` rejects a missing service or a different token object that reuses the same ID. The runtime removes every registration when its owning plugin is disposed.

## Runtime operations

```ts
type PluginRuntimeState =
  | 'idle'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'failed'

type PluginEntryState =
  | 'registered'
  | 'activating'
  | 'active'
  | 'failed'
  | 'disposed'

type PluginRuntimeErrorCode =
  | 'duplicate_plugin'
  | 'missing_dependency'
  | 'dependency_cycle'
  | 'unsupported_tier'
  | 'unsupported_activation'
  | 'duplicate_service'
  | 'missing_service'
  | 'undeclared_dependency'
  | 'invalid_lifecycle'
  | 'reentrant_lifecycle'
  | 'cleanup_required'
  | 'runtime_not_running'
  | 'activation_failed'

interface PluginRuntimeEntry {
  readonly id: string
  readonly version: string
  readonly tier: PluginTier
  readonly state: PluginEntryState
  readonly capabilities: readonly PluginCapability[]
  readonly error?: string
}

interface PluginRuntime {
  start(): Promise<void>
  stop(): Promise<void>
  resolve<T>(token: ServiceToken<T>): T
  snapshot(): readonly PluginRuntimeEntry[]
  getState(): PluginRuntimeState
}
```

Rules:

1. Validate all manifests before activating any plugin.
2. Reject duplicate IDs, missing dependencies, cycles, unsupported API versions, unknown capabilities, non-startup activation, and Tier 2 execution.
3. Activate dependencies before consumers.
4. On failure, roll back active plugins in reverse order.
5. Stop in reverse activation order and remove all services.
6. Repeated and overlapping `start` and `stop` calls are serialized and do not duplicate effects.
7. Runtime faults use a closed error-code union; cleanup failures may surface as `AggregateError` after all remaining disposers have run.
8. A plugin may resolve services from itself or from plugin IDs listed in `requires`; array order cannot grant undeclared access.
9. Plugin callbacks must not call runtime lifecycle methods. A synchronous re-entry is rejected.
10. A failed disposer keeps cleanup debt retryable, leaves the runtime failed, and blocks restart until a later `stop` succeeds.

## Fixture service

The first Tier 1 plugin provides the existing `DemoDataSource` under a typed token. Its data remains deterministic and carries Fixture provenance. Activating the plugin has no network, process, persistence, or filesystem effect.

## Deferred Tier 2 wire contract

No Tier 2 transport exists in v1. A future contract must define artifact identity, API negotiation, signed or hash-pinned packages, explicit filesystem/network/resource policy, health, timeout, crash handling, termination, and typed RPC. Process separation alone is not a sandbox.
