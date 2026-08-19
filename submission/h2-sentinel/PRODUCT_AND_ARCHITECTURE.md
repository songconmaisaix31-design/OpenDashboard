# H2 Sentinel: Product and Architecture Narrative

## Product narrative

H2 Sentinel / 氢哨 is designed for an operations engineer who must decide whether a weak-grid green-hydrogen EMS deviation is a cross-device coordination anomaly, what evidence supports it, and what bounded next check merits review. It turns data into a traceable workflow instead of an opaque alert, a classifier-only notebook, or an autonomous controller.

```text
data import -> quality result -> event -> time-aligned evidence
-> impact calculation -> safety checks -> advisory recommendation
-> human confirmation -> report and structured export
```

Its user value is traceability: event timing, equipment, evidence, assumptions, provenance, and the advisory status are visible before a person acts.

## Safety and trust boundary

The H2 source of truth requires: models detect, deterministic rules verify, AI explains, and humans decide. H2 Sentinel is not an EMS replacement, real-time industrial controller, autonomous dispatcher, or general-purpose agent platform. Recommendations that could influence operations require human confirmation.

No H2 runtime or deployment has been verified in this worktree. Claims about a complete application, local sidecar, launcher, report, or CSV must await H6 evidence.

## Intended architecture, not runtime proof

```text
OpenDashboard Web shell
  -> H2 Sentinel feature UI
      -> H2 EMS data source
          -> Fixture adapter OR loopback API adapter
              -> trusted local analytics sidecar
```

The intended sidecar is loopback-only with a fixed H2 API namespace, bounded validated input, redacted failure evidence, and no required outbound network. It is a competition-specific adapter, not a general plugin runtime and not proof that such a process runs today.

## What exists at this gate

[H2 contracts](../../packages/h2-contracts/README.md) define TypeScript and JSON Schema shapes for dataset manifests, quality, events, provenance, assistant answers, reports, API envelopes, and the exact `submission.csv` column order. They include sanitized synthetic golden C03/C04 fixtures. The contract handoff states that official data, analytics, plugin, Web UI, root wiring, launcher, and submission package were not changed by that track.

This package adds documentation only. It creates no runtime artifact, score, screenshot, report, CSV export, release, approval, or third-party attribution record.

## Competition scope and limits

The PRD P0 target is CSV validation, C01-C07 event vocabulary, evidence and impact presentation, safety checks, deterministic answers for ten official questions, report/CSV export, and six H2 views. C03 (BESS direction reversal) and C04 (PCC boundary tracking) are the primary story cases because sanitized fixtures exist for both.

Official data, labels, validation metrics, event-level precision/recall/F1, organizer score, and deployment status are unavailable here. Keep them blank or explicitly unavailable until verified artifacts exist.

## Sources

- [H2 PRD](../../docs/competition/h2-sentinel/PRD.md)
- [H2 multi-agent plan](../../docs/competition/h2-sentinel/MULTI_AGENT_TASKS.md)
- [H2 branch overview](../../docs/competition/h2-sentinel/BRANCH_OVERVIEW.md)
- [H2 contracts handoff](../../packages/h2-contracts/HANDOFF.md)
