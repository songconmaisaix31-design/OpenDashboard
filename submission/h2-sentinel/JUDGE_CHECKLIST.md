# H2 Sentinel Judge Checklist

This checklist separates evidence a judge can inspect now from evidence that must be shown after assembly. A PRD design or a contract definition does not complete a pending runtime item.

## Review framing

- Product: local-first, evidence-first H2 EMS anomaly diagnosis and decision support.
- Safety: no equipment control; recommendations remain advisory and require human confirmation.
- Demonstration mode: sanitized synthetic Fixture, visibly labeled `FIXTURE`.
- Core cases: C03 BESS direction anomaly and C04 PCC boundary tracking.

## Evaluation checklist

| Item | What the judge should see | Evidence status now |
| --- | --- | --- |
| Problem and user value | Operator workflow from anomaly to human review | Narrative available; runtime pending |
| Safety boundary | No control claim; human-confirmation label | Contract/narrative available; UI pending |
| Evidence-first diagnosis | Timing, variables, reference/constraint, conclusion | Contract available; UI pending |
| Provenance | Clear Fixture versus live-analysis distinction | Contract available; UI pending |
| C03 walkthrough | Event, evidence, impact, safety, recommendation | Synthetic fixture available; rendered walkthrough pending |
| C04 walkthrough | Event and PCC boundary evidence | Synthetic fixture available; rendered walkthrough pending |
| Data quality | Manifest, checks, warning/blocker display | Contract available; runtime pending |
| Assistant | Ten structured questions and cited deterministic answer | Contract available; runtime pending |
| Structured output | Exact CSV-column header and serializer evidence | Contract available; generated export pending |
| Report | Readable diagnosis report with provenance/disclaimer | Pending |
| Reproducibility | Launcher, checks, no-key Fixture path | Pending H6 evidence |
| Evaluation | Versioned validation report separate from organizer score | Unavailable |
| Legal and assets | Notices plus traceable capture sources | Pending |

## Plain answers

1. **Is this controlling equipment?** No. It is decision support; recommendations require human confirmation.
2. **Are these official-data results?** No. The available C03/C04 materials are sanitized synthetic Fixture inputs.
3. **Where are the metrics?** They are unavailable until a versioned validation artifact exists; validation is not an organizer score.
4. **How is it auditable?** The target connects timing, evidence, impact assumptions, safety checks, provenance, and exact export fields; H6 must prove the assembled path.
