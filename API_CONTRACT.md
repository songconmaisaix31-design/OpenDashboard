# OpenDashboard Plugin Contract

- Status: v1 specified; implementation pending verification
- Transport: in-process static composition for PF0/PF1
- Canonical source after implementation: `packages/contracts/src/**`

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

IDs use lowercase reverse-domain or scoped kebab-case segments and are unique within one runtime. Versions use a numeric `major.minor.patch` shape. PF0 rejects unknown keys only at external parse boundaries; compile-time definitions are still validated at startup.

## Lifecycle

```ts
interface Disposable {
  dispose(): void | Promise<void>
}

interface ServiceToken<T> {
  readonly id: string
  readonly __type?: (value: T) => T
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

`provide` rejects duplicate service IDs. `resolve` rejects missing services. A plugin receives a context only while activating. Every provided service is tied to the plugin's disposer.

## Runtime operations

```ts
interface PluginRuntime {
  start(): Promise<void>
  stop(): Promise<void>
  resolve<T>(token: ServiceToken<T>): T
  snapshot(): readonly PluginRuntimeEntry[]
}
```

Rules:

1. Validate all manifests before activating any plugin.
2. Reject duplicate IDs, missing dependencies, cycles, unsupported API versions, unknown capabilities, and Tier 2 execution.
3. Activate dependencies before consumers.
4. On failure, roll back active plugins in reverse order.
5. Stop in reverse activation order and remove all services.
6. Repeated `start` and `stop` calls are safe and do not duplicate effects.

## Fixture service

The first Tier 1 plugin provides the existing `DemoDataSource` under a typed token. Its data remains deterministic and carries Fixture provenance. Activating the plugin has no network, process, persistence, or filesystem effect.

## Deferred Tier 2 wire contract

No Tier 2 transport exists in v1. A future contract must define artifact identity, API negotiation, signed or hash-pinned packages, explicit filesystem/network/resource policy, health, timeout, crash handling, termination, and typed RPC. Process separation alone is not a sandbox.
