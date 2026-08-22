# H2 Sentinel Judge Checklist

## Review framing

- Product: local-first, evidence-first H2 EMS diagnosis and decision support.
- Safety: no equipment control; recommendations require human confirmation.
- Tested technical base: `58090bc1747d621bc87d698259319a70c34e75f2`.
- Organizer outcomes and visual/interactivity outcomes are independent of the technical record.

## Evidence at a glance

| Item | Status | Boundary |
| --- | --- | --- |
| Attempt-6 raw input | Recorded | 77,865,257 bytes, 172,800 rows, 69 fields, SHA-256 `88f3a5c...04504cd9`. |
| Attempt-6 normalized input | Recorded | 78,038,054 bytes, SHA-256 `4407495...59853169`. |
| Attempt-6 result | Recorded | 104 events, 104 rows by 16 columns, 21 variables by 172,800 points, cleanup passed. |
| Sanitized report | Recorded | SHA-256 `8796dd1f...9111bf27f`; hashes identify evidence, not acceptance. |
| Custom-domain deployment routes | Recorded | Eight `204421.xyz` routes returned 200 same-origin H2 SPA shells; direct Vercel root/Fixture returned 302 SSO. |
| Remote CI | Recorded | Three listed runs are green for exact `58090bc`. |
| Desktop/mobile visuals | UNKNOWN-HOLD | No authorized computer control or visual artifact. |
| Interactive deep links | UNKNOWN-HOLD | HTTP shell success is insufficient. |
| Registration/form/submission | UNKNOWN-HOLD | No organizer-form evidence. |
| Receipt/acceptance/approval | UNKNOWN-HOLD | No admissible receipt. |
| Official score/rank | UNKNOWN-HOLD | No organizer result. |
| Final organizer package/archive hash | UNKNOWN-HOLD | The pipeline-derived attempt-6 CSV hash is not an archive identity. |
| Historical 0.2168 / 0.9517 metrics | Historical/unbound | No immutable `testedCodeSha`; not current results. |

## Plain answers

1. **Does it control equipment?** No. It is decision support with mandatory human confirmation.
2. **Was an official technical CSV run recorded?** Yes, attempt-6 is SHA-bound technical evidence with the identities above.
3. **Does that prove a score or submitted entry?** No. Submission, receipt, acceptance, score, and rank are `UNKNOWN-HOLD`.
4. **Is deployment visually verified?** No. Only custom-domain HTTP SPA-shell and `H2 Sentinel`/`氢哨` asset-marker checks are recorded; direct Vercel root/Fixture is 302 SSO.
5. **Which severity representation is used?** Internal/API uses English enums; external submission taxonomy uses Chinese `高`/`中`.
6. **Can missing requirement sections define claims?** No. Referenced D01-D13 and Section 13 scoring text is absent, so no criterion is invented.
7. **Where do organizer rules come from?** Feishu revision 146, reviewed 2026-08-23; its external availability and final organizer status are not proven here.
