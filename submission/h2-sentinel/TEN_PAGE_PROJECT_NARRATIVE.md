# H2 Sentinel Ten-Page Project Narrative

This is submission copy, not evidence that every described runtime surface is assembled. Do not add a metric, screenshot, deployment claim, organizer outcome, or approval until its artifact exists.

## Page 1 — Title and outcome

**H2 Sentinel / 氢哨** is a local-first anomaly-diagnosis and operations-support concept for weak-grid green-hydrogen EMS data. It makes a coordination anomaly reviewable through evidence, impact, safety checks, provenance, and an advisory next step requiring human confirmation.

## Page 2 — The operator problem

An alarm alone does not determine whether a disturbance is normal renewable fluctuation, when it began, which control object is involved, or what should be reviewed. H2 Sentinel is intended to turn minute-level data into an auditable incident workflow rather than a disconnected classifier, notebook, or chat interface.

## Page 3 — Product boundary

The product supports diagnosis and bounded operational review. It does not replace the EMS, directly control equipment, autonomously dispatch power, or allow language output to decide a control action. This protects users from mistaking decision support for an industrial controller.

## Page 4 — Evidence before explanation

Each intended diagnosis exposes an interval, variable identity, observed value, reference or constraint, and machine-readable conclusion. Deterministic quality, event, impact, safety, report, and export stages create the evidence base; optional language rendering may only explain structured results.

## Page 5 — Local-first architecture

The planned composition is a Web shell, H2 feature, data-source boundary, deterministic Fixture adapter, and optional loopback analytics adapter. It deliberately excludes remote host control, dynamic plugins, arbitrary shell, and required outbound network access.

## Page 6 — Data quality and provenance

The contracts distinguish `FIXTURE`, `LIVE_ANALYSIS`, `DERIVED`, `MODEL`, `RULE`, and `LLM_RENDERED`. Fixture data must be visibly labeled and never presented as live analysis. A live claim requires an authorized import, recorded run, quality output, and reproducible configuration.

## Page 7 — Seven anomaly classes

The frozen vocabulary covers C01-C07 across electrolyzer setpoints, available capacity, BESS direction, PCC boundaries, energy quotas, load allocation, and SOC/reserve. Event start, end, and first-detection time are distinct; confidence is normalized to 0..1. This contract does not itself prove detector performance.

## Page 8 — C03 evidence-first case

C03 is the BESS charge/discharge direction anomaly case. The planned story uses a sanitized synthetic C03 fixture to show evidence, BESS/PCC context, impact, safety checks, and an advisory recommendation. It is Fixture evidence only, not an official-data result or measured score.

## Page 9 — C04 boundary-tracking case

C04 is the PCC import/export power-boundary tracking case. The planned story uses a sanitized synthetic C04 fixture to explain a boundary deviation through time-aligned values and constraint evidence. Any live import/export limit claim awaits assembly and official-data evidence.

## Page 10 — Reproducibility and honest evaluation

The deliverable target is an offline-capable Fixture path plus a separate official-data analysis path. A credible final package must show exact start steps, provenance, report/CSV outputs, and test results. Validation precision, recall, F1, boundary error, first-detection delay, per-class results, and organizer score are intentionally absent because no such artifact is available at this gate.

## Source basis

Derived from the [H2 PRD](../../docs/competition/h2-sentinel/PRD.md) and bounded by the [contract package](../../packages/h2-contracts/README.md).
