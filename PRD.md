# OpenDashboard Plugin-First Product Requirements

- Status: specified; PF0 architecture baseline in progress
- Date: 2026-08-17
- Product language: Simplified Chinese
- Baseline: `origin/main@9a2268901569cd407d5a16fc8f79a936285ec185`

## Product decision

OpenDashboard is a local service diagnosis and controlled-recovery console for a single developer machine. It is not a universal computer administration panel. The product must help a developer understand why a local service is unhealthy, see the evidence, approve a bounded action, verify the outcome, and retain a redacted record without switching tools.

Plugin-first means every optional capability enters through a versioned contract and explicit lifecycle. It does not mean arbitrary code is safe to load.

## Primary user

A solo developer or AI-native builder running multiple local API, model, and agent services on a Windows workstation.

## User outcome

The user can complete this loop with truthful provenance:

1. Register or select a local target.
2. Observe health and resource evidence.
3. Correlate evidence into an incident.
4. Inspect a diagnosis and proposed bounded action.
5. Approve the action when required.
6. Verify observed state after the action.
7. Export a redacted evidence record.

## Current milestone: PF0/PF1

The first architecture milestone preserves the runnable Fixture demo while replacing app-owned composition with a tested plugin boundary.

### Must deliver

- One canonical TypeScript plugin manifest contract.
- A compile-time registry for reviewed Tier 0 and Tier 1 plugins.
- Deterministic activation, dependency ordering, failure rollback, and reverse disposal.
- An explicit service registry with duplicate-provider rejection.
- Migration of the Fixture data source behind a plugin-owned service.
- Existing Chinese golden path remains runnable and visibly Fixture-backed.
- Root README and technical documents separate implemented, planned, and deferred capability.
- Generated competition media and obsolete dispatch material leave the active source tree with a documented recovery path.

### Must not deliver in this milestone

- Dynamic path loading, package installation, marketplace, hot reload, or remote plugins.
- Tier 2 execution, process spawning, WebAssembly, gRPC, or plugin RPC.
- Real host discovery, arbitrary network probes, process control, Shell, or elevation.
- SQLite, OpenTelemetry Collector, PM2, Glances, or a second runtime.
- A general workflow editor, multi-user authorization, or remote access.

## Plugin trust tiers

| Tier | Execution | Trust model | PF0/PF1 |
|---|---|---|---|
| 0 | Core process | Core-maintained and required | Contract/runtime only |
| 1 | Core process | Reviewed, statically imported, fully trusted | Fixture plugin only |
| 2 | Separate boundary | Untrusted until independently authorized | Contract notes only |

Capabilities in a Tier 0/1 manifest are closed vocabulary used for validation, composition, and audit. They do not prevent a trusted in-process module from using Node APIs.

## Acceptance criteria

- `npm run check` passes from the lockfile.
- Runtime tests cover duplicate IDs, unknown dependencies, activation order, rollback, reverse disposal, and Tier 2 rejection.
- The application resolves `DemoDataSource` from the plugin runtime rather than constructing it directly.
- The golden-path tests still reach `recovered` and export the same redacted Fixture evidence.
- No added source reads secrets, launches a process, opens a network listener, or sends a request.
- `git diff --check` passes.
- CodeGraph indexes the final tree with no pending files and is used to inspect the composition change.
- Documentation never presents planned local adapters or Sidecars as implemented.

## Next milestone gate

PF2 may add one explicit, opt-in, read-only loopback health adapter only after a threat review defines target registration, SSRF prevention, Host/Origin checks, timeouts, redaction, and failure evidence. Real actions require a later and separate authorization gate.

## Success metric

A contributor can add a reviewed read-only plugin without editing domain or UI internals, while a reviewer can still identify exactly what code executes and which capabilities remain simulated.
