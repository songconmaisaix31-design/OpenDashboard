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
| R05 | Custom-domain deployment HTTP routes | Recorded | Eight named `204421.xyz` routes returned 200 same-origin H2 SPA shells. |
| R06 | Deployed asset markers | Recorded | `/assets/index-C2wmhv_n.js` returned 200 at 935,592 bytes with `H2 Sentinel` and `氢哨`; literal `invalid-mode` was absent and no UI interaction follows. |
| R07 | Direct Vercel hostname | AUTH-REDIRECT/UNKNOWN-HOLD | Root and Fixture checks returned 302 SSO, not H2 shell evidence. |
| R08 | Desktop/mobile visual verification | UNKNOWN-HOLD | No authorized computer control, screenshots, or equivalent recorded visual check. |
| R09 | Interactive deep-link verification | UNKNOWN-HOLD | HTTP shell success is insufficient. |
| R10 | Remote CI at tested SHA | Recorded | Green push H2 `32591314579`, PR H2 `32591315711`, generic PR `32591315735`, all for `58090bc`. |
| R11 | Organizer registration/submission | UNKNOWN-HOLD | No form or submission evidence. |
| R12 | Organizer receipt/acceptance/approval | UNKNOWN-HOLD | No organizer receipt independently tied to the actual submitted artifact/version. |
| R13 | Official score/rank | UNKNOWN-HOLD | No organizer result. |
| R14 | Historical internal metrics | Historical/unbound | 0.2168 and 0.9517 lack immutable `testedCodeSha` binding; not current metrics. |
| R15 | Organizer package documentation integrity | Discrepancy recorded | The three supplied organizer ZIP copies are 68,574,329 bytes, SHA-256 `27dd2d096e0eb002cf50feb68f33fd1b586b46e4daddf97398390dc6394a5072`; do not call the package fully verified. |
| R16 | Source-package licensing | UNKNOWN-HOLD | Final archive redistribution/licensing review is not complete; no raw official input, screenshots, or secret material is included here. |
| R17 | Organizer-rule source | Revision fact | Feishu revision 146, reviewed 2026-08-23; external accessibility and final organizer status are not repository proof. |

## Technical versus organizer evidence

Attempt-6 confirms a technical run on a specific code SHA. The independent
registration, receipt, acceptance, score, rank, and visual decisions remain
`UNKNOWN-HOLD`. Neither hashes, green CI, a deployment, nor an HTTP shell
response upgrades those decisions.
