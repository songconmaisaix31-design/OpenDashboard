# H2 Sentinel Runtime Evidence Checklist

## Candidate record

- Executable/tested SHA: `58090bc1747d621bc87d698259319a70c34e75f2`.
- Attempt-6 report: `validation/reports/epoch-2/run_f2bc8c0433f8/attempt-6/official-csv-e2e.json`, SHA-256 `8796dd1f9e9baca3dad0711c6fb74ccca40485874527a5ef0e2323a9111bf27f`.
- Attempt-6 `submission.csv` SHA-256: `af8814d3e428ef1470a43e0a07d4d6dcdc79585846841a15778fff8c91d60326`.
- This checklist does not bind later document commits to the attempt-6 code SHA.

| ID | Required evidence | Status | What it proves and does not prove |
| --- | --- | --- | --- |
| R01 | Raw input identity | Recorded | 77,865,257 bytes, 172,800 rows, 69 fields, SHA-256 `88f3a5c...04504cd9`; not CSV disclosure or organizer receipt. |
| R02 | Normalized input identity | Recorded | 78,038,054 bytes, SHA-256 `4407495...59853169`; not an official score. |
| R03 | Attempt-6 analysis/export | Recorded | 104 events, 104 rows by 16 columns, 21 variables by 172,800 points; cleanup passed. |
| R04 | Sanitized attempt-6 report | Recorded | Named report and SHA `8796dd1f...9111bf27f`; hashes identify artifacts only. |
| R05 | Deployment HTTP routes | Recorded | Deployment ID and named routes returned 200 SPA shells. |
| R06 | Deployed JavaScript markers | Recorded | H2 title, invalid-mode, and Chinese-brand markers were present; not UI interaction evidence. |
| R07 | Desktop/mobile visual verification | UNKNOWN-HOLD | No authorized computer control, screenshots, or equivalent recorded visual check. |
| R08 | Interactive deep-link verification | UNKNOWN-HOLD | HTTP shell success is insufficient. |
| R09 | Remote CI at tested SHA | Recorded | Green push H2 `32591314579`, PR H2 `32591315711`, generic PR `32591315735`, all for `58090bc`. |
| R10 | Organizer registration/submission | UNKNOWN-HOLD | No form or submission evidence. |
| R11 | Organizer receipt/acceptance/approval | UNKNOWN-HOLD | No receipt tied to package hash. |
| R12 | Official score/rank | UNKNOWN-HOLD | No organizer result. |
| R13 | Historical internal metrics | Historical/unbound | 0.2168 and 0.9517 lack immutable `testedCodeSha` binding; not current metrics. |
| R14 | Organizer package documentation integrity | Discrepancy recorded | The three identical ZIP copies are 68,574,329 bytes, SHA-256 `27dd2d096e0eb002cf50feb68f33fd1b586b46e4daddf97398390dc6394a5072`; do not call the package fully verified. |
| R15 | Source-package licensing | Needs final archive review | No official CSV, screenshots, or secret material is included here. |

## Technical versus organizer evidence

Attempt-6 confirms a technical run on a specific code SHA. The independent
registration, receipt, acceptance, score, rank, and visual decisions remain
`UNKNOWN-HOLD`. Neither hashes, green CI, a deployment, nor an HTTP shell
response upgrades those decisions.
