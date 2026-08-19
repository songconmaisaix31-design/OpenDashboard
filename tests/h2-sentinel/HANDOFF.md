# H2 Sentinel QA Handoff

## Ownership and base

- Worker branch: `songconmaisaix31-design/h2-qa`
- Frozen Wave 1 gate: `f9dd7df83a81da57fdaa2b03cd67470c8c7a22c4`
- Verified before editing: branch was at the frozen gate, the gate was an
  ancestor of `HEAD`, and `git status --short` was empty.
- Write ownership: `tests/h2-sentinel/**` only.

## Delivered QA assets

- `run-contract-qa.mjs` is a dependency-free Node contract gate. It checks the
  sanitized fixture fingerprint, C03 command/BESS evidence, C04 impact
  calculation, Fixture provenance, human-confirmation boundary, and the
  report/submission/redaction contract surface.
- `ACCEPTANCE_MATRIX.md` separates runnable H0 rows from analytics, plugin,
  offline journey, loopback, report, provenance, redaction, and responsive UI
  suites that require later assembly.
- `DEFECT_LOG.md` records the current no-defect contract result and gives the
  mandatory reproduction fields for later blockers.

## Verification evidence

Run from repository root:

```bash
node tests/h2-sentinel/run-contract-qa.mjs
git diff --check
```

Current contract-gate result is `PASS=4 SKIP=8 FAIL=1`. The failure is
`H2-QA-001`: C04 declares `86.5 kWh`, while the frozen CSV and PRD formula
produce `29.333333333333336 kWh`. The eight `SKIP` results are intentional
assembly gates and must never be summarized as passing runtime behavior.

## Integration notes

H6 can invoke the Node file directly without changing root dependencies or
scripts. Replace a `SKIP` only after the named component exists and a focused
black-box assertion has been added in this owned directory; implementation
defects belong in `DEFECT_LOG.md`, not in contracts or application code from
this QA lane.

The exact pushed worker `HEAD` is reported in the orchestration completion
payload after this handoff is committed and pushed; this file intentionally
does not self-reference an as-yet-uncreated Git object.
