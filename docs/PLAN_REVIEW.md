# Review of the Supplied OpenDashboard Plan

## Verdict

The master plan is suitable as a long-term product and architecture reference. It is not safe to use unchanged as the 2026-08-16 competition execution plan.

The long-term strengths are the clear user problem, federated sources of truth, provider boundaries, fixture-first thinking, approval and audit model, non-Git limitations, and honest claim policy. The execution weakness is breadth: it combines a product shell, domain platform, plugin SDK, six provider integrations, observability storage, automation, security, UI, AgentTeams, and submission assets in roughly five hours.

## P0 blockers in the supplied pack

### Source-package integrity

The files cannot be dispatched or parsed by filename. Their extensions and contents are frequently different, and the named Agent packet set is incomplete.

| Supplied file | Actual content observed |
|---|---|
| `AGENT_COORDINATION_RULES (1).md` | Byte-for-byte duplicate of `OpenDashboard_MASTER_PLAN.md` |
| `README (1).md` | Integration order |
| `TIMEBOX_2026-08-16 (1).md` | Start-here instructions |
| `INTEGRATION_ORDER (1).md` | Agent coordination rules |
| `OPEN_SOURCE_REFERENCE_MATRIX (1).md` | Timebox |
| `PLUGIN_MANIFEST (1).yaml` | Markdown open-source reference matrix |
| `AUTOMATION_EXAMPLE (1).yaml` | Skill manifest template |
| `EVIDENCE (1).json` | Plugin manifest YAML |
| `AGENT-02_CORDIS_CORE_PLUGIN_SDK (1).md` | A07 Frontend packet |
| `AGENT-03_OBSERVABILITY_INCIDENTS (1).md` | Evidence JSON template |
| `AGENT-04_RUNTIME_AGENT_HARDWARE (1).md` | A03 Observability packet |
| `AGENT-05_API_DEBUG_RADAR (1).md` | Agent report template |
| `AGENT-06_AUTOMATION_ACTION_POLICY (1).md` | A01 Architecture and Contracts packet |
| `AGENT-07_FRONTEND (1).md` | Automation YAML example |
| `AGENT-08_GOAI_SUBMISSION_REVIEW (1).md` | A05 API Debugging packet |

The named set does not contain reliable packets for A02, A04, A06, or A08. No automation should consume this pack until it is rebuilt with normalized filenames, content-type checks, and a manifest of hashes.

### Delivery complexity

- The proposed repository contains more than twenty packages/plugins before one user journey exists.
- Eight builders plus an Integrator create more contract, merge, and coordination overhead than the timebox can absorb.
- Cordis, LocalOps, AUM, Radar, Hardware, Orca, and AgentTeams each add independent startup and compatibility failure modes.
- The full action/policy/reconciliation design is appropriate for real process control but unnecessary for a simulated competition action.
- Twelve UI sections, a workflow builder, charts, traces, logs, and approvals dilute the one story the reviewer needs to understand.
- The listed `pnpm` and Python gates assume source, lockfiles, and sidecars that do not currently exist.

## Keep without relaxation

- Honest separation of implemented, mocked, designed, and deferred capabilities.
- No secret access or persistence.
- No PID/port ownership inference and no unapproved high-risk action.
- One file owner per implementation path and one task per worktree.
- Fixture-first demo behavior and deterministic replay.
- Prominent provenance, approval, audit, and evidence.
- Fast downgrade when an integration takes more than ten minutes to recover.

## Relax for the competition

| Long-term rule | Competition baseline |
|---|---|
| 1 Integrator + 8 builders | 1 Integrator + 3 builders + 1 read-only reviewer |
| Full provider integration | Normalized fixture adapters with visible mock provenance |
| Full Cordis/plugin runtime | Contract and architecture note only |
| Three report files per Agent | One concise handoff report plus command evidence |
| Contract v0.2 rebase wave | Freeze one minimal demo contract before dispatch |
| Twelve UI sections | One guided golden-path experience |
| Visual automation builder | One fixed read-only workflow and controlled buttons |
| Full action state machine | Five deterministic demo phases |
| All listed gates | Only configured gates, with missing gates reported honestly |
| Six implemented Skills | Six complete descriptors; implement only the golden-path behavior |

## Recommended product cut

The competition system should be a deterministic visual proof of:

```text
API failure
  -> normalized evidence
  -> incident explanation
  -> approval-gated simulated recovery
  -> before/after verification
  -> redacted audit artifact
```

This preserves the product's differentiator while removing every integration that is not required to understand it.
