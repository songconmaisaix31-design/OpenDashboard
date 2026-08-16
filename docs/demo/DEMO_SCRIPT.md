# 90-Second Fixture Demo Script

Artifact status: aligned to the T4-verified local fixture candidate. The script
does not replace current Chinese-release browser and video verification.

## Preflight outside the timer

1. Confirm the integrated candidate is built from the recorded T0 Gate and the
   scoped T1, T2, and T3 commits.
2. Run `resetDemo` and confirm phase `incident_open`, target `order-api` is
   `degraded`, incident rule is `api-error-burst`, and fixture/mock provenance
   is visible.
3. Confirm no live provider, real process control, external request, or secret
   is enabled.
4. Keep a locally inspectable evidence export ready only as a fallback; do not
   present a contract example as runtime proof.

## Timed path

| Time | Presenter action | Contract checkpoint | Narration |
|---|---|---|---|
| 0–10s | Open `Fixture Demo`. | `loadInitialSnapshot()` returns `incident_open`. | "This is Fixture Demo. Every external provider signal is deterministic and mocked." |
| 10–22s | Frame the `order-api` target card and phase rail. | Target is `degraded`; incident is open with rule `api-error-burst`. | "A fixture-owned transient latch caused this incident; this is not a source-code defect." |
| 22–38s | Run `API 500 Triage` and inspect the four evidence kinds. | `collectEvidence` returns `evidence_collected`; workflow is read-only and complete. | "One normalized contract gives us redacted HTTP, trace, log, and resource evidence without contacting live providers." |
| 38–50s | Point to source badges and limitations. | Every displayed record carries fixture/mock provenance. | "The evidence is useful because its source and limitations stay visible, not because the demo pretends to be live." |
| 50–62s | Select `Request Simulated Restart`. | `requestRestart` returns `approval_pending`; no action is confirmed. | "The recovery proposal stops at an explicit approval gate." |
| 62–72s | Approve as the demo user. | `approveAction` returns `action_confirmed`; execution mode is `simulated`. | "Approval confirms only a simulated fixture action. It does not restart a real process or repair code." |
| 72–83s | Run recovery verification. | `verifyRecovery` clears the fixture latch, returns `recovered`, and adds a verification audit event. | "Verification returns the fixture to healthy, and the before-and-after transition is recorded." |
| 83–90s | Export and inspect the report summary. | `exportEvidence` preserves phase and returns a redacted `DemoEvidenceReport`. | "The local report keeps provenance, approval, simulated action, verification, audit history, and unverified claims together." |

## Stop conditions

Stop the demo and downgrade the affected claim if any expected phase is
missing, a command skips approval, fixture/mock provenance is not visible, the
export contains unredacted sensitive fields, or the timed path cannot be
completed deterministically. Do not improvise a live-integration or
real-process claim as a fallback.
