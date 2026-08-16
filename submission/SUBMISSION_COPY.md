# OpenDashboard Competition Submission Copy

Release status: `designed` until T4 verifies the integrated runtime, claim, and
visual gates in [`CLAIMS.md`](./CLAIMS.md).

## One-line summary

OpenDashboard is designed to turn one deterministic local API incident into
explainable evidence, an approval-gated simulated recovery, and a redacted
audit record.

## Short description

OpenDashboard's competition scope defines a 90-second Fixture Demo for a solo
AI-native developer. The intended journey presents `order-api` in a degraded
state, gathers normalized HTTP, trace, log, and resource evidence, runs the
read-only `api-500-triage` workflow, requests explicit approval for a
simulated managed-runtime restart, verifies fixture recovery, and exports a
redacted evidence report.

The narrow scope is deliberate: the reviewer can understand why an action was
proposed, who approved it, what changed, and which evidence is mocked without
switching tools or trusting an opaque automation step.

## Capability disclosure

- `designed` — the deterministic five-phase engine, guided UI, approval gate,
  recovery verification, reset, and evidence export require integrated T1/T2
  evidence before release.
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
The approved action clears only that fixture latch. It does not restart a real
process, repair code, contact an external service, or prove production
availability.
