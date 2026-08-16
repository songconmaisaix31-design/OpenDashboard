# Submission Claim Ledger

This ledger is the release source of truth. Each capability has exactly one
status:

- `implemented` — the local artifact or behavior exists and has direct
  evidence.
- `mocked` — the competition behavior intentionally uses fixture/mock data and
  must never be described as live.
- `designed` — the contract or narrative exists, but working integrated
  evidence is still required.
- `deferred` — the capability is excluded from P0.

Evidence state is separate from capability status. `partial` or `pending`
evidence blocks present-tense external claims.

| ID | Approved wording | Status | Evidence state at T3 handoff | Required release evidence |
|---|---|---|---|---|
| `T3-001` | The submission package includes six static Skill descriptors mapped to the six frozen `DemoDataSource` commands. | `implemented` | Ready | Six descriptor files plus `skills/README.md` count and binding check. |
| `T3-002` | The submission package includes three narrative Agent role descriptions; it does not implement AgentTeams execution. | `implemented` | Ready | `submission/AGENT_ROLES.md` role count and authority review. |
| `P0-001` | The candidate runs one deterministic five-phase incident-to-recovery journey for `order-api`. | `designed` | Pending | T1 golden-path test and T4 local golden-path run. |
| `P0-002` | The read-only `api-500-triage` workflow collects redacted HTTP, trace, log, and resource evidence. | `designed` | Pending | T1 evidence test and T2 visual evidence. |
| `P0-003` | Any Cordis, LocalOps, Agent Usage Manager, FastAPI Radar, Hardware, Orca, or AgentTeams observations in the competition candidate must be fixture-backed and visibly mocked; none may be described as live. | `mocked` | Partial | T0 provenance contract, T1 fixture evidence, and T2 persistent mock badges. |
| `P0-004` | A demo user must approve the simulated managed-runtime restart before the fixture action is confirmed. | `designed` | Pending | T1 invalid-transition and approval tests plus T2 approval-state evidence. |
| `P0-005` | Recovery verification moves the fixture target from degraded to healthy and the incident from open to recovered. | `designed` | Pending | T1 before/after test and T4 golden-path evidence. |
| `P0-006` | The local evidence report contains redacted before/after state, provenance, approval, simulated action, verification, audit history, and unverified claims. | `designed` | Pending | T1 export test and T4 review of a representative report. |
| `P0-007` | Reset restores the deterministic initial fixture state. | `designed` | Pending | T1 reset-from-every-phase test and T4 repeated run. |
| `P0-008` | The guided interface keeps fixture/mock provenance, approval, and audit state visible at each relevant phase. | `designed` | Pending | T2 desktop screenshots and T4 visual review. |
| `EXT-001` | Live Cordis, LocalOps, Agent Usage Manager, FastAPI Radar, Hardware, Orca, and AgentTeams adapters are not included in the competition build. | `deferred` | Not applicable | Keep the exclusion in external copy. |
| `EXT-002` | Real process control, arbitrary shell, external requests, executable plugins, deployment, and multi-user production operation are not included. | `deferred` | Not applicable | Keep the exclusion in external copy. |

## T4 handoff protocol

1. Verify that the T1, T2, and T3 commits share the exact T0 Gate SHA.
2. Run configured build, type, test, and visual checks in the integrated
   candidate.
3. Attach evidence by repository path or exact check name; prose is not
   evidence.
4. Promote `designed` only when every required evidence item exists. Use
   `mocked`, not `implemented`, for behavior whose provider source remains a
   fixture.
5. Downgrade or remove any unsupported claim. Never expand T3 scope to create
   missing runtime evidence.

The read-only `CONTRACT_EXAMPLE_SNAPSHOT` proves contract shape only. It is not
T1 runtime evidence and cannot satisfy a behavior claim by itself.
