# H2 Sentinel Submission Handoff

## Identity and scope

- Submission track branch: `songconmaisaix31-design/h2-e4-submission`.
- Executable attempt-6 base: `58090bc1747d621bc87d698259319a70c34e75f2`.
- Frozen plan: `30f8f36ff936b295596c5515f15d2a8d17cebaff`.
- Owned write path: `submission/h2-sentinel/**` only.
- No application code, contracts, CI, deployment configuration, scripts outside
  this package, or `MEMORY.md` were changed by this track.

## Corrected evidence

Attempt-6 is the only official-run input described here. It is bound to
`58090bc` and records raw 77,865,257 bytes / 172,800 rows / 69 fields
(`88f3a5c15fb5c42d265475f2998fe9f6c271dcef16f43daee7626f6704504cd9`),
normalized 78,038,054 bytes
(`4407495ad75299f2f8f06112f6d3209eb93b2773ff3f0c797c47874159853169`),
104 events, a 104-row by 16-column output, 21 variables by 172,800 points, and
passed cleanup. The report path is
`validation/reports/epoch-2/run_f2bc8c0433f8/attempt-6/official-csv-e2e.json`
with SHA-256 `8796dd1f9e9baca3dad0711c6fb74ccca40485874527a5ef0e2323a9111bf27f`.
The submission package SHA-256 is
`af8814d3e428ef1470a43e0a07d4d6dcdc79585846841a15778fff8c91d60326`.

Deployment evidence is `dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf` at
`h2-sentinel-hxrbu0wan-dwwww.vercel.app`, with explicit alias `204421.xyz`.
The named root/mode routes returned 200 SPA shells, and remote JavaScript
contained H2, invalid-mode, and Chinese-brand markers. This is not a visual or
interactive pass. Visual desktop/mobile and interactive verification remain
`UNKNOWN-HOLD` because computer control was prohibited.

Remote CI is green for exact SHA `58090bc`: push H2 `32591314579`, PR H2
`32591315711`, and generic PR `32591315735`. It must not be reused as CI proof
for any later document or integration SHA.

## Explicit holds

Registration/submission, organizer receipt/acceptance/approval, and official
score/rank are all `UNKNOWN-HOLD`. Historical internal numbers 0.2168 and
0.9517 lack immutable `testedCodeSha` binding, so they are historical/unbound
and are not current F1, precision, recall, or accuracy claims.

## Verification commands

```powershell
pwsh -NoProfile -File submission/h2-sentinel/scripts/validate-submission.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File submission/h2-sentinel/scripts/validate-submission.ps1
git diff --check -- submission/h2-sentinel
```

The validator checks document-package structure, not runtime, organizer action,
visual quality, or exact-SHA CI.

## Project memory

`MEMORY.md` was not updated because it is outside the sole write allowlist.
