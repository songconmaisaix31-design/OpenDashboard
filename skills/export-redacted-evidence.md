# Skill Descriptor: Export Redacted Evidence

Capability status: `designed`

Descriptor ID: `skill.export-redacted-evidence.v1`

Artifact type: `descriptor-only`

## Intent

Produce a locally inspectable evidence report for the current fixture run
without changing the demo phase.

## Contract binding

- Runtime method: `DemoDataSource.exportEvidence`.
- Input: `ExportEvidenceInput` with `runId` and `idempotencyKey`.
- Required phase: any.
- Success: `DemoCommandResult<DemoEvidenceReport>`; the snapshot phase remains
  unchanged.
- Stable failures: the frozen `DemoCommandErrorCode` union.
- External side effects: none. The artifact remains local.

## Required report content

The report must identify `mode: fixture` and `mocked: true`, include available
before/after state, redacted evidence, approval, simulated action,
verification, audit history, provenance, and `unverifiedClaims`.

## Trust boundary

The report must not contain credentials, authorization headers, request
bodies, host usernames, absolute paths, or claims of live provider execution.
This descriptor does not upload or publish the artifact.

## Integration evidence

T1 must verify report shape, redaction, determinism, and phase preservation. T2
must provide an inspectable or downloadable local artifact. T4 must review a
representative export before promoting the claim.
