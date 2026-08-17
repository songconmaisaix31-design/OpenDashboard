# OpenDashboard Plugin-First Technical Specification

- Status: PF0 gate plus PF1/PF2/PF7 baseline implemented and verified
- Date: 2026-08-17
- Runtime: Node.js 22.12+, strict TypeScript, React 19, Vite, npm

## Decision summary

PF1 uses a small in-repository TypeScript plugin runtime, PF2 supplies the Fixture provider, and PF7 composes them into the application. Plugins are explicit imports reviewed with the application; there is no loader. This is the shortest reliable path to prove lifecycle and contract boundaries without creating a false sandbox or adding a second runtime.

Cordis, VS Code, HashiCorp go-plugin, Extism, and OpenTelemetry Collector are research inputs, not copied implementations. A dependency is added only when it removes more code and risk than it introduces.

## Target source shape

```text
apps/web/                         Chinese UI and composition
packages/contracts/              Shared demo and plugin contracts
packages/plugin-runtime/         Static registry and lifecycle
plugins/fixture-demo/            Deterministic Fixture provider
docs/architecture/               Decisions, boundaries, and roadmap
docs/research/                   Primary-source reuse matrix
docs/history/                    Recovery pointers for completed releases
```

The existing Fixture engine moves without behavior changes. Presentation components remain in `apps/web` and consume only `DemoDataSource`.

## Runtime model

```text
main.tsx
  -> createPluginRuntime([fixtureDemoPlugin])
    -> validate manifest and dependency graph
    -> activate reviewed plugins in dependency order
    -> register typed services
  -> resolve DemoDataSource
  -> App
```

Each plugin exports one immutable definition:

```ts
interface PluginDefinition {
  readonly manifest: PluginManifestV1
  activate(context: PluginContext): Disposable | Promise<Disposable>
}
```

The runtime state is `registered -> activating -> active | failed -> disposed`. Lifecycle requests share one ordered queue, so alternating `start` and `stop` calls are linearized. On activation failure, already-active plugins are disposed in reverse order. `stop()` attempts every disposer; failed cleanup remains retryable, leaves the runtime failed, and blocks restart until cleanup succeeds.

## Manifest contract

The initial manifest contains only fields needed for deterministic composition:

- `schemaVersion`, `apiVersion`, `id`, `version`, `displayName`.
- `tier`: `0 | 1 | 2`.
- `activation`: `startup | on-demand`.
- `requires`: plugin IDs.
- `capabilities`: values from a closed core vocabulary.
- `provenance`: `core | official | fixture | third-party`.

PF1 accepts only statically supplied Tier 0/1 definitions with `startup` activation. `on-demand` is reserved by the contract but rejected by the current runtime. Tier 2 manifests may be parsed for planning but cannot activate. YAML is not an execution format; adding a YAML parser before a loader exists would create an unnecessary trust boundary.

## Service boundary

Services use invariant typed tokens with runtime object identity. A plugin can provide a token only during activation and resolve only its own services or services from declared dependencies. Duplicate providers fail activation. Registration returns a disposable so rollback removes services without global residue.

Manifest capabilities are checked against a closed vocabulary and surfaced in runtime snapshots. They are not OS permissions. An in-process plugin remains fully trusted and cannot be made safe through metadata alone.

## Data and evidence

PF2 keeps the Fixture engine in memory and preserves its deterministic IDs, transitions, idempotency, provenance, redaction, and tests. No persistence is introduced.

The future local data plane is one non-elevated TypeScript process bound to `127.0.0.1`, with explicit targets, bounded probes, a pure incident reducer, an append-only SQLite event ledger, and same-origin HTTP/SSE. It is not implemented by the current baseline.

## Security invariants

- No dynamic import from user-controlled paths.
- No package install, shell, process spawn, eval, remote request, wildcard bind, or automatic elevation.
- No secrets, absolute user paths, raw authorization headers, or request bodies in evidence.
- No action is authorized by PID or process name alone.
- Tier 2 is disabled until a separate broker/sandbox protocol and threat model are approved.
- Loopback is not treated as authentication; a future daemon validates Host and Origin and uses CSRF protection for mutation.

## Open-source reuse rule

Reuse interface shapes and lifecycle ideas; do not copy vendor source unless a file-level license review and attribution decision is recorded. PM2 code is AGPL-3.0, Glances is LGPL-3.0, and HashiCorp go-plugin is MPL-2.0, so none is copied into the TypeScript core.

## Verification

```bash
npm ci
npm run typecheck
npm run test
npm run build
npm run check
git diff --check
codegraph sync .
codegraph status . --json
```

The browser golden path remains a required integration check after moving the Fixture provider. CodeGraph supports impact inspection but does not replace tests, build, or visual QA.
