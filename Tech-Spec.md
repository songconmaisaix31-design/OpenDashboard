# OpenDashboard Competition Demo Technical Specification

Status: proposed, not implemented

## Decision summary

Use a single client application with an in-process deterministic demo state machine. Do not add a server, database, Cordis runtime, sidecar, container, or live provider to the P0 competition path.

This is the shortest reliable route because the judged outcome is a coherent workflow. External integrations add startup, compatibility, security, and evidence risk without improving the core demonstration.

## Runtime shape

```text
Presentation
    -> DemoController
        -> DemoDataSource
            -> FixtureDataSource (P0)
            -> LiveDataSource (deferred)
        -> EvidenceExporter
```

- `Presentation` renders status, evidence, approvals, actions, and audit history.
- `DemoController` owns the finite state transition rules.
- `DemoDataSource` is the only data boundary used by the presentation layer.
- `FixtureDataSource` is deterministic, local, and the only enabled P0 provider.
- `LiveDataSource` is a future adapter boundary, not a competition implementation.
- `EvidenceExporter` creates a redacted, append-only report from the current run.

## State model

The demo has one linear happy path with explicit invalid-transition errors:

```text
incident_open
  -> evidence_collected
  -> approval_pending
  -> action_confirmed
  -> recovered
```

`reset_demo` returns to `incident_open`. A command cannot skip a phase. Repeated commands return the existing result rather than creating duplicate actions or evidence.

The initial failure is a fixture-owned transient runtime latch, not a deterministic source-code defect. The simulated restart clears that latch. This keeps the state transition internally valid without claiming that a restart repaired code or controlled a real process.

## Data and persistence

- Bundle versioned fixture data with the application.
- Keep run state in memory for P0.
- Export evidence as a generated JSON artifact or deterministic on-screen document.
- Do not persist tokens, paths, request bodies, raw headers, or machine-specific identifiers.
- Use opaque demo IDs and fixed UTC timestamps where deterministic screenshots are required.

## Mock boundary

The fixture provider must return the same normalized contract intended for future live adapters. Each record includes:

- `source`: provider name.
- `mode`: `fixture` or `live`.
- `mocked`: boolean.
- `observedAt`: timestamp.
- `limitations`: human-readable missing capabilities.

The presentation layer must not infer status from log text and must not import provider-specific fields.

## Security boundary

- No arbitrary shell, process control, file mutation outside the evidence export, or external request.
- No supplied YAML/JSON file is loaded as executable configuration.
- No secrets or credential stores are read.
- The simulated restart remains approval-gated even though it has no real side effect.
- All evidence is fixture-based and redacted before display or export.
- A future live adapter requires separate threat review, input validation, loopback restrictions, authentication, timeout, and reconciliation.

## Planned source ownership

The exact framework and package commands remain unconfigured until implementation begins. The intended ownership seams are:

```text
apps/web/src/domain/**       Demo contract and state types
apps/web/src/fixtures/**     Deterministic source data
apps/web/src/demo/**         State machine and commands
apps/web/src/components/**   Presentation components
apps/web/src/pages/**        Guided demo composition
skills/**                    Skill descriptors
submission/**                Competition copy and demo script
reports/review/**            Read-only claim and verification reports
```

Root package configuration, lockfiles, CI, and the final README remain Integrator-owned.

## Verification gates

Once source exists, the Integrator must discover the actual package manager from the lockfile and record exact commands. Minimum evidence is:

- Dependency installation succeeds from the lockfile.
- Production build succeeds.
- Type checking succeeds.
- One unit test covers invalid and idempotent state transitions.
- One golden-path test reaches `recovered` and verifies the audit/evidence output.
- A static review confirms visible mock provenance at every phase.
- `git diff --check` succeeds.

No command is considered configured or passed before the corresponding source and tool configuration exist.

## Deferred long-term architecture

Cordis composition, provider sidecars, SQLite, reconciliation, retention, real automation, and AgentTeams remain valid long-term topics. They should be introduced one verified adapter at a time behind `DemoDataSource`, beginning with a read-only loopback health provider. They are not dependencies of the competition demo.
