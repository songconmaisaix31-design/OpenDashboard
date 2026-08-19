# H6 Runtime Evidence Checklist

## Purpose

H6 must close these gaps after Wave 1 assembly. A code merge, design preview, or planned command does not close a runtime item. Record candidate commit SHA, command, exit status, mode, date, and redacted artifact path for every completed row.

| ID | Required evidence | Why it matters | Status at frozen gate |
| --- | --- | --- | --- |
| R01 | Accepted assembly SHA and source-path inventory | Identifies the candidate behind public claims | Missing |
| R02 | Actual documented Windows and shell/WSL start command | Makes local reproduction testable | Missing |
| R03 | Fixture-only start without Python sidecar or LLM key | Proves offline golden-path resilience | Missing |
| R04 | Fixture C03 journey: event, evidence, impact, safety, assistant, report | Proves product loop beyond a static screen | Missing |
| R05 | Fixture C04 detail and export journey | Proves second story and shared contract flow | Missing |
| R06 | Generated `submission.csv` header and validation result | Proves serialization, not contract definition | Missing |
| R07 | Generated HTML/JSON report descriptor and redacted artifact | Proves report availability and disclaimer | Missing |
| R08 | Loopback binding/health and failure behavior | Verifies sidecar boundary if assembled | Missing |
| R09 | Official CSV import and data-quality record | Required before a live-analysis claim | Missing; official data absent |
| R10 | Versioned validation report with matching policy/metrics | Supports only labeled validation claims | Missing |
| R11 | Desktop and narrow-width real-app screenshots | Confirms presentation and capture assets | Missing |
| R12 | `npm run typecheck`, `npm run test`, `npm run build`, `npm run check`, applicable Python tests, and `git diff --check` | Establishes candidate integrity | Missing |
| R13 | Third-party notice and asset-origin review | Prevents unsupported attribution claims | Missing |
| R14 | Release/archive manifest with hashes and no secrets/private data | Makes candidate reviewable and safe to distribute | Missing |

## Evidence record template

```markdown
### R00 — name

- Candidate commit:
- Command:
- Mode: FIXTURE | LIVE_ANALYSIS
- Result: pass | fail
- Date/time:
- Redacted artifact path:
- What this proves:
- What it does not prove:
```

## Exact gaps at this gate

There is no H2 Web feature, H2 EMS plugin, analytics service, H2 test subtree, launcher, H2 entry composition, generated report, generated `submission.csv`, screenshot, official dataset, validation result, organizer score, deployment record, or H2-specific third-party notice. The only H2 implementation evidence is the frozen contract package and its sanitized fixtures. H6 must not turn that evidence into a runtime or performance claim.
