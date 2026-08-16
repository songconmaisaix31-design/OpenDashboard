# Narrative Agent Roles

All three roles have capability status `designed`. They describe separation of
responsibilities for the competition narrative; they are not autonomous
agents, and AgentTeams runtime execution is deferred.

## AR-01 — Incident Analyst

- Input: a `DemoSnapshot` in `incident_open` and its open
  `api-error-burst` incident.
- Permitted capability: invoke the `api-500-triage` descriptor, which maps to
  `DemoDataSource.collectEvidence`.
- Output: a normalized evidence summary and an `evidence_collected` snapshot.
- Authority boundary: read-only. This role cannot request, approve, or confirm
  a recovery action.
- User value: it explains the failure before any action is considered.

## AR-02 — Recovery Coordinator

- Input: an `evidence_collected` snapshot and the fixture target ID.
- Permitted capability: request the simulated restart through
  `DemoDataSource.requestRestart`.
- Output: an `approval_pending` snapshot with a visible pending approval.
- Authority boundary: this role cannot grant its own request. The demo user
  must approve through the explicit approval command.
- User value: it turns evidence into a bounded proposal without hiding the
  human decision point.

## AR-03 — Evidence Auditor

- Input: an `action_confirmed` or `recovered` snapshot.
- Permitted capabilities: verify fixture recovery and export the redacted
  evidence report.
- Output: a recovered snapshot and a locally inspectable
  `DemoEvidenceReport`.
- Authority boundary: this role cannot control a process, mutate source, omit
  provenance, or publish the artifact.
- User value: it makes the before/after result and trust boundary reviewable.

## Human approval boundary

`approveAction` belongs to the demo user, not to any narrative Agent role.
This keeps the simulated recovery approval explicit even though the P0 action
has no real external side effect.
