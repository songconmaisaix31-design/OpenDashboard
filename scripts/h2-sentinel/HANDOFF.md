# H2 Sentinel Epoch 4 Production Handoff

## Scope and tested identity

This document records release evidence for the already-tested executable tree.
It does not change launch behavior, rerun the official CSV, or claim organizer
acceptance.

- Executable SHA: `58090bc1747d621bc87d698259319a70c34e75f2`.
- Track: Epoch 4 Track E (`scripts/h2-sentinel/HANDOFF.md` only).
- Attempt 6 is the only official-run evidence used for this handoff. Attempts
  1 through 5 remain historical and were not modified.
- Attempt-6 report SHA-256:
  `8796dd1f9e9baca3dad0711c6fb74ccca40485874527a5ef0e2323a9111bf27f`.
- Submission package SHA-256:
  `af8814d3e428ef1470a43e0a07d4d6dcdc79585846841a15778fff8c91d60326`.

The attempt-6 technical facts are: 104 analysis events; an exported
submission with 16 columns; and 21 hydrated variables with 172800 points each
(`21 x 172800`). The source dataset had 172800 rows and 69 fields. These are
artifact facts, not an organizer score or acceptance result.

## CI and deployment evidence

The following GitHub Actions runs were reported successful for the executable
SHA:

- [Run 32591314579](https://github.com/songconmaisaix31-design/OpenDashboard/actions/runs/32591314579)
- [Run 32591315711](https://github.com/songconmaisaix31-design/OpenDashboard/actions/runs/32591315711)
- [Run 32591315735](https://github.com/songconmaisaix31-design/OpenDashboard/actions/runs/32591315735)

The tested deployment identity was `dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf`.
The public hosts were:

- `https://h2-sentinel-hxrbu0wan-dwwww.vercel.app`
- `https://204421.xyz`

Remote deep-link checks on both hosts requested the root, Fixture routes with
and without the trailing slash, Local routes, and an invalid H2 mode. Each
returned HTTP 200, the SPA shell, and the expected remote JavaScript markers.
The checks included direct navigation (not only navigation from the root):

```text
/
/h2-sentinel?mode=fixture
/h2-sentinel/?mode=fixture
/h2-sentinel?mode=local
/h2-sentinel/?mode=local
/h2-sentinel?mode=invalid
```

This proves static hosting and deep-link fallback only. No GUI or visual
verification was performed for this production deployment. The public site
serves the static Fixture shell; it cannot run loopback analytics on an
evaluator's machine without the local launcher.

## Reproducible commands

Run from a clean checkout at the tested SHA. These commands use only local
Fixture or sanitized artifacts. Do not put official data, credentials, tokens,
or secret configuration into the repository or command history.

```powershell
git checkout 58090bc1747d621bc87d698259319a70c34e75f2
npm ci
npm run typecheck
npm run test
npm run build
npm run check
npm run h2:check
npm run h2:smoke
npm run h2:qa

# Local Fixture flow.
npm run h2:fixture
start-h2-sentinel.bat --mode fixture
start-h2-sentinel.bat --mode local --ready-json

# Only when an authorized sanitized data directory is available.
$officialDataDir = "<official-data-dir>"
Get-ChildItem -LiteralPath $officialDataDir -File

# Inspect remote deep links directly; HTTP 200 is the hosting-shell check.
Invoke-WebRequest -Uri "https://h2-sentinel-hxrbu0wan-dwwww.vercel.app/h2-sentinel?mode=fixture"
Invoke-WebRequest -Uri "https://h2-sentinel-hxrbu0wan-dwwww.vercel.app/h2-sentinel/?mode=fixture"
Invoke-WebRequest -Uri "https://204421.xyz/h2-sentinel?mode=local"
```

The commands above are reproduction instructions, not evidence that an
evaluator can access local analytics. Local mode is loopback-only and requires
the launcher and analytics service on that evaluator machine.

## Independent status boundaries

| Decision | Status | Evidence boundary |
| --- | --- | --- |
| Technical executable evidence | GO for SHA `58090bc` as reported by the named CI and attempt-6 artifacts | This is not a submission, receipt, score, or visual approval. |
| Registration/submission | UNKNOWN-HOLD | No organizer form or submission-action evidence is recorded here. |
| Receipt/acceptance | UNKNOWN-HOLD | No organizer receipt or acceptance tied to the package hash is recorded. |
| Official score | UNKNOWN-HOLD | No official score is available; technical metrics are not a score. |
| Visual verification | UNKNOWN-HOLD | No GUI or production desktop/mobile visual verification was performed. |

There is no organizer form evidence, receipt evidence, approval evidence, or
score evidence in this handoff. The deployment and HTTP checks must not be
described as those outcomes.

## Path and safety boundary

Epoch 4 Track E changed only this handoff document. No application source,
contracts, runner, CI workflow, official CSV, `.env`, credential, token,
private key, or launch behavior was changed. The handoff intentionally keeps
the public deployment's static Fixture limitation visible.
