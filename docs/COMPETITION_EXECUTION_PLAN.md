# Competition Execution and Worktree Plan

Status: planning baseline; product implementation has not started

## Operating model

- `main` is the protected release baseline and changes only after the release gate.
- `competition-integration` is the Integrator-owned pre-release merge branch in a separate top-level Orca worktree.
- Every writable Agent task uses one Orca child worktree under `competition-integration` and one branch created from the same explicit frozen Gate commit.
- Agents do not merge, rebase other Agents, edit root configuration, or write outside their owned paths.
- Handoffs occur through reviewed commits, not copied files or shared working directories.
- The Integrator cherry-picks into `competition-integration` in the declared order and resolves only small boundary differences.
- A conflict that cannot be resolved in ten minutes triggers scope downgrade or branch omission.

## Current review worktrees

The planning review is already isolated in three top-level worktrees:

| Worktree | Branch | Scope | Write policy |
|---|---|---|---|
| `review-product-scope` | `review-product-scope` | Product scope and competition value | Read-only |
| `review-architecture-mocks` | `review-architecture-mocks` | Architecture, integration, and mock seams | Read-only |
| `review-coordination-git` | `review-coordination-git` | Git, worktree, ownership, and merge policy | Read-only |

They start from the same `main` baseline and have no parent/child stacking relationship.

The implementation integration worktree is separate from these review peers. Builder worktrees are created just in time after G0; eight idle worktrees are not pre-created.

## Implementation task DAG

Create implementation worktrees only after the Integrator explicitly starts the build phase.

```text
G0 Scope and contract freeze
  |-- T1 Demo domain, fixture, and state machine
  |-- T2 Guided web presentation
  |-- T3 Skills and submission assets
  `-- G1 Integrator merge and configured checks
        `-- T4 Read-only claim and demo audit
              `-- G2 Upload freeze
```

The dependency depth is three gates. T1, T2, and T3 may run in parallel because `API_CONTRACT.md` is frozen at G0.

## Planned ownership

| Owner | Branch | Owned paths | Acceptance |
|---|---|---|---|
| Integrator | `competition-integration`, then `main` at release | Root config, lockfile, `README.md`, `AGENTS.md`, `MEMORY.md`, final merge | Baseline frozen; configured checks recorded |
| Demo Domain Agent | `agent/demo-domain` | `apps/web/src/domain/**`, `apps/web/src/fixtures/**`, `apps/web/src/demo/**`, focused tests | Deterministic transitions, reset, idempotency, evidence export |
| Web Presentation Agent | `agent/web-presentation` | `apps/web/src/components/**`, `apps/web/src/pages/**`, `apps/web/src/styles/**` | Golden path visible; provenance and approval never hidden |
| Submission Agent | `agent/submission` | `skills/**`, `submission/**`, `docs/demo/**` | Three roles, six descriptors, truthful script and claims |
| Claim Reviewer | `review/claim-audit` | `reports/review/**`; all other paths read-only | Claims mapped to files and executed checks; blockers ranked |

No file path has two builder owners. A needed cross-boundary change becomes a short contract-change note to the Integrator.

## Merge order

1. Integrator freezes the Gate commit in `competition-integration`, then creates the minimal source skeleton and lockfile after implementation is authorized.
2. Cherry-pick Demo Domain Agent.
3. Cherry-pick Web Presentation Agent.
4. Cherry-pick Submission Agent.
5. Run every configured check from the clean `competition-integration` worktree.
6. Dispatch the Claim Reviewer against the integrated commit.
7. Apply only claim corrections or P0 blockers; do not add features.
8. Advance `main` only after the release gate passes and the submission commit is identified.

## Handoff contract

Each builder returns one to three commits and one concise report:

```text
TASK_DONE
branch:
commit:
owned_paths:
checks_run:
results:
implemented_claims:
mocked_claims:
known_gaps:
integration_notes:
```

An empty or unexecuted check is reported as `not run` with a reason. It is never converted into a passing claim.

## Timebox

The 22:15 upload freeze is fixed. If execution starts later, shorten earlier blocks rather than moving the freeze.

| Asia/Shanghai | Gate |
|---|---|
| 18:00-18:20 | G0 scope, contract, source skeleton, and worktree creation |
| 18:20-19:30 | T1/T2/T3 parallel build |
| 19:30-19:45 | Contract and claim freeze; no new capability |
| 19:45-20:45 | G1 merge, focused fixes, and configured checks |
| 20:45-21:30 | Golden-path dry run, screenshots, evidence, T4 audit |
| 21:30-22:00 | Submission copy and recorded fallback |
| 22:00-22:15 | Draft upload and link/attachment verification |
| 22:15 onward | No feature or architecture changes |

## Downgrade order

1. Remove optional live probe and remain fixture-only.
2. Remove animation and secondary panels.
3. Replace downloadable evidence with an inspectable deterministic report.
4. Replace Agent execution with role and Skill descriptors.
5. Preserve the golden path, visible provenance, approval, audit, and truthful submission copy.

## Cleanup policy

- Keep worktrees while their task is active or under review.
- After a task is merged and verified, release its Agent terminal first.
- Remove a worktree only after its branch and commits are confirmed recoverable.
- Never delete or force-reset a dirty worktree.
- Record abandoned branches and why they were excluded from the demo.
