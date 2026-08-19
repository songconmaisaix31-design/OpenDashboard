# H2 Sentinel Submission Package

## Status

This is a truthful pre-assembly competition-submission package for H2 Sentinel / 氢哨. It is based on immutable Wave 1 gate `f9dd7df83a81da57fdaa2b03cd67470c8c7a22c4`; it is not evidence of a runtime, deployment, official-data result, score, approval, or screenshot.

H2 Sentinel is a local-first supervision and diagnosis concept for weak-grid green-hydrogen EMS data. It presents evidence and advisory recommendations for human confirmation; it does not issue equipment commands or replace the EMS.

## Evidence labels

| Label | Meaning |
| --- | --- |
| Implemented contract fact | Present in `packages/h2-contracts/**` at the gate. |
| Fixture evidence | Sanitized synthetic C03/C04 data; not official data or a score. |
| Assembly pending | Requires the future H6 integration candidate and runtime proof. |
| Metric unavailable | Official-data, validation, organizer, or deployment evidence absent here. |
| Roadmap | A PRD future option, not a present capability. |

## Contents

- [Product and architecture narrative](PRODUCT_AND_ARCHITECTURE.md)
- [Ten-page project narrative](TEN_PAGE_PROJECT_NARRATIVE.md)
- [Demo and fallback scripts](DEMO_SCRIPT.md)
- [Screenshot shot list](SCREENSHOT_SHOT_LIST.md)
- [Claims ledger](CLAIMS_LEDGER.md)
- [License and third-party checklist](LICENSE_AND_THIRD_PARTY_CHECKLIST.md)
- [Judge checklist](JUDGE_CHECKLIST.md)
- [Runtime evidence checklist](RUNTIME_EVIDENCE_CHECKLIST.md)
- [Handoff](HANDOFF.md)

## Source inputs

- [H2 PRD](../../docs/competition/h2-sentinel/PRD.md)
- [H2 multi-agent plan](../../docs/competition/h2-sentinel/MULTI_AGENT_TASKS.md)
- [H2 branch overview](../../docs/competition/h2-sentinel/BRANCH_OVERVIEW.md)
- [Canonical H2 contracts](../../packages/h2-contracts/README.md)

Run `powershell -ExecutionPolicy Bypass -File submission/h2-sentinel/scripts/validate-submission.ps1` from the repository root to validate this package's required files, local links, ten-page structure, and placeholder scan.
