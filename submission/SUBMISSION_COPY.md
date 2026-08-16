# OpenDashboard Competition Submission Copy

Release status: local fixture candidate verified by T4; Chinese release visual
verification is tracked in
[`RELEASE_INTEGRATION_2026-08-16.md`](../docs/RELEASE_INTEGRATION_2026-08-16.md).

## One-line summary

OpenDashboard turns one deterministic local API incident into
explainable evidence, an approval-gated simulated recovery, and a redacted
audit record.

## Short description

OpenDashboard's competition scope delivers a 90-second Fixture Demo for a solo
AI-native developer. The journey presents `order-api` in a degraded
state, gathers normalized HTTP, trace, log, and resource evidence, runs the
read-only `api-500-triage` workflow, requests explicit approval for a
simulated managed-runtime restart, verifies fixture recovery, and exports a
redacted evidence report.

The narrow scope is deliberate: the reviewer can understand why an action was
proposed, whether the fixture approval event was recorded, what changed, and
which evidence is mocked without switching tools or trusting an opaque
automation step.

## Capability disclosure

- `implemented` — the deterministic five-phase engine, guided UI, approval
  gate, recovery verification, reset, and evidence export have local tests and
  an integrated T4 browser run.
- `mocked` — any Cordis, LocalOps, Agent Usage Manager, FastAPI Radar,
  Hardware, Orca, or AgentTeams observations in P0 must be fixture-backed and
  visibly labelled. They are not live integrations.
- `implemented` — this T3 package includes six contract-bound Skill
  descriptors and three narrative Agent role descriptions.
- `deferred` — live provider adapters, AgentTeams execution, real process
  control, arbitrary shell, executable plugins, external requests, deployment,
  and multi-user production operation are outside P0.

## Required trust statement

The demo fault is a fixture-owned transient latch, not a source-code defect.
Approval confirms only a simulated fixture action. The later verification
transition clears the fixture latch. Neither step restarts a real process,
repairs code, contacts an external service, or proves production availability.
