# Skill Descriptor: API 500 Triage

Capability status: `designed`

Descriptor ID: `skill.api-500-triage.v1`

Artifact type: `descriptor-only`

## Intent

Collect normalized, redacted fixture evidence for the open
`api-error-burst` incident and complete the read-only `api-500-triage`
workflow. This visible workflow name maps to the existing
`DemoDataSource.collectEvidence` command; it does not introduce another runtime
command.

## Contract binding

- Input: `CollectEvidenceInput` with `runId`, `incidentId`, and
  `idempotencyKey`.
- Required phase: `incident_open`.
- Success: `DemoCommandResult<DemoSnapshot>` with phase
  `evidence_collected`, a completed `api-500-triage` workflow, and redacted
  `http`, `trace`, `log`, and `resource` evidence.
- Stable failures: the frozen `DemoCommandErrorCode` union.
- Side effects: none. The workflow is read-only.

## Trust boundary

Evidence must carry `Provenance`, remain visibly fixture/mock labelled, and
contain summaries rather than raw headers, request bodies, credentials,
usernames, or absolute paths. The descriptor never contacts Cordis, FastAPI
Radar, Agent Usage Manager, or another provider.

## Integration evidence

T1 must prove the phase transition, evidence kinds, redaction, and idempotent
replay. T2 must show the provenance and read-only workflow state. Until both are
verified in T4, external copy must describe this capability as designed.
