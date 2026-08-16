# Skill Descriptor: Verify API Recovery

Capability status: `designed`

Descriptor ID: `skill.verify-api-recovery.v1`

Artifact type: `descriptor-only`

## Intent

Verify the fixture state after the approved simulated action and close the
incident only when the normalized snapshot reports recovery.

## Contract binding

- Runtime method: `DemoDataSource.verifyRecovery`.
- Input: `VerifyRecoveryInput` with `runId`, `targetId`, and
  `idempotencyKey`.
- Required phase: `action_confirmed`.
- Success: `DemoCommandResult<DemoSnapshot>` with phase `recovered`, target
  health `healthy`, incident status `recovered`, a passed `DemoVerification`,
  and a `recovery.verified` audit entry.
- Stable failures: the frozen `DemoCommandErrorCode` union.
- Side effects: fixture state only.

## Trust boundary

Verification reads the deterministic fixture state. It does not probe a real
endpoint or send a network request. A healthy fixture state is evidence of the
demo transition only, not production availability.

## Integration evidence

T1 must prove the before/after transition and invalid early verification. T2
must show both the recovered target and recovered incident without hiding the
fixture/mock provenance.
