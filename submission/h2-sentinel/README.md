# H2 Sentinel Submission Package

## Status

This package records Epoch 4 evidence for executable base
`58090bc1747d621bc87d698259319a70c34e75f2`. Attempt-6 is a completed
technical CSV end-to-end run bound to that SHA; it is not an organizer
submission, receipt, acceptance, score, rank, or visual-interaction result.

H2 Sentinel / 氢哨 is a local-first, evidence-first H2 EMS diagnosis and
decision-support application. Recommendations require human confirmation; the
application does not issue equipment commands or replace the EMS.

## Evidence labels

| Label | Meaning |
| --- | --- |
| Attempt-6 technical E2E | Immutable technical evidence bound to `58090bc`; it proves the named local CSV pipeline and report artifact only. |
| Deployment HTTP shell | An HTTP request returned the deployed SPA shell and its inspected JavaScript markers; it is not a visual or interactive pass. |
| Remote CI | The named GitHub Actions runs are green for exact SHA `58090bc`; this does not verify later documentation commits. |
| Fixture evidence | Sanitized synthetic C03/C04 data, visibly `FIXTURE`; never official data, a score, or live plant evidence. |
| UNKNOWN-HOLD | A required organizer or visual fact has no admissible evidence and must not be inferred. |

## Attempt-6 technical record

- Tested code SHA: `58090bc1747d621bc87d698259319a70c34e75f2`.
- Raw official input was processed without being copied into this package:
  77,865,257 bytes, 172,800 rows, 69 fields, SHA-256
  `88f3a5c15fb5c42d265475f2998fe9f6c271dcef16f43daee7626f6704504cd9`.
- Normalized data: 78,038,054 bytes, SHA-256
  `4407495ad75299f2f8f06112f6d3209eb93b2773ff3f0c797c47874159853169`.
- Result: 104 detected events, a 104-row by 16-column submission export, and
  21 variables by 172,800 points. Cleanup passed.
- Sanitized report path:
  `validation/reports/epoch-2/run_f2bc8c0433f8/attempt-6/official-csv-e2e.json`;
  report SHA-256
  `8796dd1f9e9baca3dad0711c6fb74ccca40485874527a5ef0e2323a9111bf27f`.
- Submission package SHA-256:
  `af8814d3e428ef1470a43e0a07d4d6dcdc79585846841a15778fff8c91d60326`.

The technical result replaces prior incorrect descriptions of the input shape
and export result. It does not establish accuracy, organizer acceptance,
ranking, or official score.

## Deployment and CI evidence

- Deployment: `dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf` at
  `h2-sentinel-hxrbu0wan-dwwww.vercel.app`; `204421.xyz` is an explicit alias.
- HTTP checks for `/`, `/?mode=fixture`, `/h2-sentinel?mode=fixture`,
  `/h2-sentinel/?mode=fixture`, `?mode=local`, and `?mode=invalid` all returned
  200 SPA shells. The remote JavaScript contained the H2 title, invalid-mode,
  and Chinese-brand markers.
- This is route/shell evidence only. Desktop and mobile visual verification and
  interactive flow verification are `UNKNOWN-HOLD` because no computer control
  was authorized.
- Green remote CI runs for exact SHA `58090bc`: push H2 `32591314579`, PR H2
  `32591315711`, and generic PR `32591315735`.

## Independent release statuses

| Decision | Status | Boundary |
| --- | --- | --- |
| Technical attempt-6 evidence | Recorded | Bound to `58090bc`; later document SHA needs its own gates. |
| Registration/submission | UNKNOWN-HOLD | No organizer form evidence. |
| Receipt/acceptance/approval | UNKNOWN-HOLD | No receipt tied to package hash. |
| Official score/rank | UNKNOWN-HOLD | No organizer result. |
| Visual verification | UNKNOWN-HOLD | HTTP shells are not visual or interactive verification. |

## Contents

- [Product and architecture narrative](PRODUCT_AND_ARCHITECTURE.md)
- [Implementation boundary (T01–T14)](IMPLEMENTATION_BOUNDARY.md)
- [Ten-page project narrative](TEN_PAGE_PROJECT_NARRATIVE.md)
- [Demo and fallback scripts](DEMO_SCRIPT.md)
- [Screenshot shot list](SCREENSHOT_SHOT_LIST.md)
- [Claims ledger](CLAIMS_LEDGER.md)
- [License and third-party checklist](LICENSE_AND_THIRD_PARTY_CHECKLIST.md)
- [Judge checklist](JUDGE_CHECKLIST.md)
- [Runtime evidence checklist](RUNTIME_EVIDENCE_CHECKLIST.md)
- [Handoff](HANDOFF.md)

Run `pwsh -NoProfile -File submission/h2-sentinel/scripts/validate-submission.ps1`
from the repository root to validate required files, local links, the ten-page
structure, and placeholder language. It does not validate organizer outcomes,
visual quality, or later-SHA CI.
