# Skill Descriptor: Request Simulated Restart

Capability status: `designed`

Descriptor ID: `skill.request-simulated-restart.v1`

Artifact type: `descriptor-only`

## Intent

Request approval for the fixture-only managed-runtime restart after evidence
has been collected. The request creates an approval record but performs no
action.

## Contract binding

- Runtime method: `DemoDataSource.requestRestart`.
- Input: `RequestRestartInput` with `runId`, `targetId`, and
  `idempotencyKey`.
- Required phase: `evidence_collected`.
- Success: `DemoCommandResult<DemoSnapshot>` with phase `approval_pending`, a
  non-null pending `DemoApproval`, and no confirmed `DemoAction`.
- Stable failures: the frozen `DemoCommandErrorCode` union.
- Side effects: none.

## Trust boundary

The requested action is `simulated-managed-runtime-restart`. It does not
control a process, run a command, repair source code, or call LocalOps. The
workflow must stop at the approval gate until the demo user explicitly grants
approval.

## Integration evidence

T1 must prove that the request cannot skip phases and cannot confirm an action.
T2 must keep the pending approval and simulated label visible. T4 must reject
any copy that calls the request a real restart.
