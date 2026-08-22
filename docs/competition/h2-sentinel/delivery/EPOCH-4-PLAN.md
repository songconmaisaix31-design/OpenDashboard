# H2 Sentinel Epoch 4 Delivery Plan

## 1. Purpose and authority

Epoch 4 is a release-evidence and truthfulness epoch. It does not add product
behavior. Its goal is to make the following evidence reproducible and
machine-auditable:

1. the already-produced attempt-6 official CSV technical evidence;
2. production deployment and deep-link evidence;
3. corrections to stale competition documentation and project memory; and
4. a final release decision that keeps technical readiness separate from
   organizer and visual outcomes.

The executable base is frozen at:

```text
58090bc1747d621bc87d698259319a70c34e75f2
```

The remote `competition/h2-sentinel` ref must equal that SHA before dispatch.
`main` is protected and must remain:

```text
7889feb274dac77753fdd323df352c9c1335aebf
```

Epoch 4 may not change either protected ref, re-run the official CSV, or
promote an untested code tree. Attempts 1 through 5 are immutable historical
records. Attempt 6 is the only official-run evidence input for this epoch.

## 2. Evidence identities to preserve

The coordinator records these exact identities and checks them at every
integration boundary:

| Evidence | Required identity |
| --- | --- |
| Executable base SHA | `58090bc1747d621bc87d698259319a70c34e75f2` |
| Attempt-6 report SHA-256 | `8796dd1f9e9baca3dad0711c6fb74ccca40485874527a5ef0e2323a9111bf27f` |
| Submission package SHA-256 | `af8813d4e428ef1470a43e0a07d4d6dcdc79585846841a15778fff8c91d60326` |
| Deployment ID | `dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf` |
| Deployment hostname | `h2-sentinel-hxrbu0wan-dwwww.vercel.app` |
| Custom domain | `204421.xyz` |
| CI run | `32591314579` |
| CI run | `32591315711` |
| CI run | `32591315735` |

Hashes are evidence of the named artifact only; they do not prove organizer
acceptance, an official score, deployment parity, or visual quality by
themselves. No official CSV contents, credentials, or secret configuration may
be copied into Git, logs, or memory.

## 3. Independent tracks and closed write allowlists

Tracks run from the executable base and have non-overlapping write ownership.
Each track must publish one normal commit, and the coordinator independently
checks the remote SHA before integration.

| Track | Exact write allowlist | Responsibility |
| --- | --- | --- |
| A | `.gitattributes` | Preserve LF normalization for evidence blobs and plan/release documents. |
| B | `validation/reports/epoch-2/run_f2bc8c0433f8/attempt-6/**` | Add or repair sanitized attempt-6 report evidence and verify its required hash. No official CSV is added and no attempt-1..5 file is edited. |
| C | `submission/h2-sentinel/**` | Correct submission-package evidence, hashes, claims, and validators without changing application code. |
| D | `docs/competition/h2-sentinel/BRANCH_OVERVIEW.md`, `docs/competition/h2-sentinel/DEPLOYMENT_AND_SMOKE.md`, `docs/competition/h2-sentinel/MULTI_AGENT_TASKS.md`, `docs/competition/h2-sentinel/PRD.md`, `docs/competition/h2-sentinel/delivery/RELEASE-MANIFEST.json` | Correct only stale claims and status fields; do not edit the whole docs directory or historical Epoch plans. |
| E | `scripts/h2-sentinel/HANDOFF.md` | Record the tested deployment/deep-link handoff and evidence commands. |
| F | `MEMORY.md` | Record durable, non-secret Epoch 4 evidence boundaries and unresolved UNKNOWN-HOLD states. |

The plan file itself is owned by the plan author before dispatch. No track may
edit another track's path, the root package manifests, application source,
contracts, API, runner, or CI workflow.

## 4. Frozen paths and prohibited actions

The following are frozen for Epoch 4: `attempt-1` through `attempt-5`, all
business code, `packages/**` contracts, API and analytics runner behavior,
`apps/web/**`, `plugins/**`, the official CSV input, `main`, and any code tree
not proven by the executable SHA. The official CSV must not be re-run or
re-uploaded. Existing attempt-6 evidence may be hashed, validated, and
described, but not replaced by a new official run.

No worker may read `.env`, credential stores, private keys, tokens, or secret
configuration. No worker may merge, deploy, or claim success for old or new
code that has not passed the required gates on its exact SHA.

## 5. Status model: independent decisions

Epoch 4 uses separate statuses; one status never implies another:

| Decision | Meaning | Initial policy |
| --- | --- | --- |
| Technical GO | The exact executable SHA passes repository, H2, Python, artifact, and release-integrity gates. | May become `GO` only after the final post-document SHA gates pass. |
| Registration/submission | Organizer form or submission action completed for the intended package. | `UNKNOWN-HOLD` until independently evidenced. |
| Receipt/acceptance | Organizer receipt, acknowledgement, or approval exists and is tied to the package hash. | `UNKNOWN-HOLD`; local validator output is not a receipt. |
| Official score | An official organizer score/result is available and attributable to this submission. | `UNKNOWN-HOLD`; internal validation metrics are not scores. |
| Visual verification | Production desktop/mobile and deep-link flows have current, reproducible visual evidence. | `UNKNOWN-HOLD` until screenshots or an equivalent recorded visual check are tied to the tested deployment. |

The final report must show these decisions in separate fields. A technical GO
must not be worded as submission, acceptance, score, or visual approval.

## 6. Required execution and integration gates

Each track first verifies `git rev-parse HEAD` equals the executable base, then
performs only its allowlisted writes. The coordinator rejects a commit if its
name-only diff contains any other path, if LF normalization changes unrelated
blobs, or if the track's tree is not reproducible.

The unique integration worktree is created from the published plan/track
identities. Before integration, run:

```powershell
git diff --check <base-or-parent> <candidate>
git diff --name-only <base-or-parent> <candidate>
git diff --exit-code <candidate> -- apps/web packages plugins services validation submission scripts/h2-sentinel
git diff --exit-code <candidate> -- main
git ls-tree -r <candidate> --full-tree | Select-String '\.env|private|secret|token|credential'
```

The coordinator must also verify the attempt-6 report SHA, submission package
SHA, and LF blob hashes. Sensitive-file scanning must be nonzero-safe and must
not print file contents. The documentation validator must pass for the edited
claims and release manifest.

The final exact-SHA gate runs from the unique integration worktree:

```powershell
npm ci
npm run typecheck
npm run test
npm run build
npm run check
npm run h2:check
npm run h2:smoke
npm run h2:qa
powershell.exe -NoProfile -ExecutionPolicy Bypass -File submission/h2-sentinel/scripts/validate-submission.ps1
Push-Location services/h2-analytics
uv lock --check
uv sync --locked --extra dev
uv run --locked --extra dev pytest tests
Pop-Location
git diff --check <executable-sha> HEAD
```

The final post-document SHA must then receive fresh CI verification. A CI run
from an older SHA, a local-only result, or a result before the final document
changes is not a pass. Deployment evidence must identify the tested SHA and
the deep links for both `h2-sentinel-hxrbu0wan-dwwww.vercel.app` and
`204421.xyz`; a deployment URL alone is insufficient.

## 7. Release handoff and decision record

The coordinator records, in order:

1. base SHA, parent SHA, track SHAs, and final post-document SHA;
2. exact changed paths and tree/path gate results;
3. attempt-6 report and submission-package hashes;
4. deployment ID, hostnames, deep-link checks, and CI run identities;
5. technical gate results and the five independent statuses in Section 5; and
6. the normal push and independently observed remote SHA.

The release is blocked if any required technical gate fails, if a path gate
finds an unauthorized edit, if a hash is inconsistent, or if old/new untested
code is merged or deployed. Unknown organizer, score, receipt, or visual facts
remain `UNKNOWN-HOLD`; they are not filled with assumptions or roadmap claims.
