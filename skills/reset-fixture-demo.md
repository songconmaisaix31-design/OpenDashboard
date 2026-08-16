# Skill Descriptor: Reset Fixture Demo

Capability status: `designed`

Descriptor ID: `skill.reset-fixture-demo.v1`

Artifact type: `descriptor-only`

## Intent

Restore the deterministic initial fixture state so the same incident journey
can be demonstrated repeatedly.

## Contract binding

- Runtime method: `DemoDataSource.resetDemo`.
- Input: `ResetDemoInput` with `runId` and `idempotencyKey`.
- Required phase: any.
- Success: `DemoCommandResult<DemoSnapshot>` with phase `incident_open` and the
  versioned initial fixture state.
- Stable failures: the frozen `DemoCommandErrorCode` union.
- Side effects: in-memory fixture state only.

## Trust boundary

Reset does not delete files, kill processes, clear external services, or
contact a provider. It restores only the demo-owned state and may not be used
as evidence of environment reconciliation.

## Integration evidence

T1 must prove that reset produces the same initial state for the same fixture
version from every phase. T2 must expose reset without implying destructive
system behavior. T4 must run reset before each timed golden-path check.
