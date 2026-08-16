# Skill Descriptor: Approve Simulated Restart

Capability status: `designed`

Descriptor ID: `skill.approve-simulated-restart.v1`

Artifact type: `descriptor-only`

## Intent

Record the demo user's explicit approval and confirm the fixture-only recovery
action. This is the only step allowed to move the journey beyond the pending
approval gate.

## Contract binding

- Runtime method: `DemoDataSource.approveAction`.
- Input: `ApproveActionInput` with `runId`, `approvalId`, and
  `idempotencyKey`.
- Required phase: `approval_pending`.
- Success: `DemoCommandResult<DemoSnapshot>` with phase `action_confirmed`, a
  granted `DemoApproval`, a `DemoAction` whose `executionMode` is `simulated`,
  and corresponding audit entries.
- Stable failures: the frozen `DemoCommandErrorCode` union.
- Side effect: only the in-memory fixture latch may change.

## Trust boundary

Approval does not authorize a real process restart, shell execution, source
mutation, or external request. The simulated action clears only the
fixture-owned transient latch; it must never be presented as repairing a code
defect.

## Integration evidence

T1 must prove that an unapproved action is impossible and that replays do not
duplicate actions or audit entries. T2 must show the user approval and
simulated execution mode before recovery verification begins.
