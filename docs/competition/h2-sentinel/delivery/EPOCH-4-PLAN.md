# H2 Sentinel Epoch 4 Delivery Plan

## 1. Purpose and authority

Epoch 4 is a release-evidence and truthfulness epoch. It does not add product
behavior. Its goal is to make the following evidence reproducible and
machine-auditable:

1. the already-produced attempt-6 report and submission-export technical
   evidence;
2. production deployment and deep-link evidence;
3. corrections to stale competition documentation and project memory; and
4. a final release decision that keeps technical readiness separate from
   organizer and visual outcomes.

The executable base is frozen at:

```text
58090bc1747d621bc87d698259319a70c34e75f2
```

The remote `refs/heads/competition/h2-sentinel` ref must equal that SHA before
dispatch. Workers may not update that canonical ref or `refs/heads/main`. The
unique integrator may update `refs/heads/competition/h2-sentinel` only after
all final gates in Section 6 pass, and only with a normal fast-forward push.
The local and remote `refs/heads/main` refs are protected and must remain:

```text
7889feb274dac77753fdd323df352c9c1335aebf
```

Epoch 4 may not change `main`, re-run the official CSV, or promote an untested
code tree. Attempts 1 through 5 are immutable historical records. Attempt 6 is
the only official-run evidence input for this epoch.

## 2. Evidence identities to preserve

The coordinator records these exact identities and checks them at every
integration boundary:

| Evidence | Required identity |
| --- | --- |
| Executable base SHA | `58090bc1747d621bc87d698259319a70c34e75f2` |
| Attempt-6 report SHA-256 | `8796dd1f9e9baca3dad0711c6fb74ccca40485874527a5ef0e2323a9111bf27f` |
| Attempt-6 `submission.csv` SHA-256 | `af8814d3e428ef1470a43e0a07d4d6dcdc79585846841a15778fff8c91d60326` |
| Final submission package/archive SHA-256 | `UNKNOWN-HOLD` |
| Deployment ID | `dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf` |
| Deployment hostname | `h2-sentinel-hxrbu0wan-dwwww.vercel.app` |
| Custom domain | `204421.xyz` |
| CI run | `32591314579` |
| CI run | `32591315711` |
| CI run | `32591315735` |

Hashes are evidence of the named artifact only; they do not prove organizer
submission, acceptance, an official score, deployment parity, or visual
quality by themselves. In particular, the attempt-6 `submission.csv` SHA-256
above identifies only that pipeline-produced export; it is not a
package/archive hash.

Raw official input must not be copied into Git, logs, or memory. Track B may
archive the pipeline-produced attempt-6 submission export and its sanitized
report, but that archive is not organizer submission or receipt evidence, and
permission to redistribute the final artifact still requires separate review.
Credentials and secret configuration must never be copied into Git, logs, or
memory.

## 3. Independent tracks and closed write allowlists

Tracks branch from the executable base and have non-overlapping write
ownership. Each track may publish one or more small, append-only normal
commits; the planned two-commit sequences for Tracks C and F are therefore
valid. Once published, a sequence is not amended, rebased, reset, or
force-pushed; a correction is appended as another normal commit. Before
integration, the coordinator records and validates the complete ordered commit
sequence and independently confirms that its final commit equals the observed
remote tip. On every later observation, the recorded sequence must remain an
exact prefix; otherwise the track is rejected as rewritten.

| Track | Exact write allowlist | Responsibility |
| --- | --- | --- |
| A | `.gitattributes` | Preserve LF normalization for evidence blobs and plan/release documents. |
| B | `validation/reports/epoch-2/run_f2bc8c0433f8/attempt-6/**` | Add or repair the sanitized attempt-6 report and pipeline-produced `submission.csv` export, and verify their required hashes. Do not add raw official input or edit any attempt-1..5 file. The export is not organizer submission/receipt evidence, and final redistribution permission remains subject to separate review. |
| C | `submission/h2-sentinel/**` | Correct submission evidence, artifact identities, claims, and validators without changing application code. |
| D | `docs/competition/h2-sentinel/BRANCH_OVERVIEW.md`, `docs/competition/h2-sentinel/DEPLOYMENT_AND_SMOKE.md`, `docs/competition/h2-sentinel/MULTI_AGENT_TASKS.md`, `docs/competition/h2-sentinel/PRD.md`, `docs/competition/h2-sentinel/delivery/RELEASE-MANIFEST.json`, `docs/competition/h2-sentinel/delivery/RELEASE-MANIFEST.schema.json` | Correct only stale claims and status fields; make the minimum schema v2 extension needed to machine-express Technical GO, registration/submission, receipt/acceptance, official score, and visual verification while preserving historical attempt and old-schema semantics; do not edit the whole docs directory or historical Epoch plans. |
| E | `scripts/h2-sentinel/HANDOFF.md` | Record the tested deployment/deep-link handoff and evidence commands. |
| F | `MEMORY.md` | Record durable, non-secret Epoch 4 evidence boundaries and unresolved UNKNOWN-HOLD states. |

The plan file itself is owned by the plan author before dispatch. No track may
edit another track's path, the root package manifests, application source,
contracts, API, runner, or CI workflow.

## 4. Frozen paths and prohibited actions

The following are frozen for Epoch 4: `attempt-1` through `attempt-5`, all
business code, `packages/**` contracts, API and analytics runner behavior,
`apps/web/**`, `plugins/**`, the raw official CSV input, `main`, and any code
tree not proven by the executable SHA. The official analysis must not be
re-run, and the raw input must not be re-uploaded or added. The
pipeline-produced attempt-6 submission export and sanitized report may be
archived, hashed, validated, and described, but they may not be replaced by a
new official run or presented as organizer submission/receipt evidence. Final
redistribution permission remains a separate review decision.

No worker may read `.env`, credential stores, private keys, tokens, or secret
configuration. No worker may merge, deploy, update
`refs/heads/competition/h2-sentinel` or `refs/heads/main`, or claim success for
old or new code that has not passed the required gates on its exact SHA.

## 5. Status model: independent decisions

Epoch 4 uses separate statuses; one status never implies another:

| Decision | Meaning | Initial policy |
| --- | --- | --- |
| Technical GO | The exact executable SHA passes repository, H2, Python, artifact, and release-integrity gates. | May become `GO` only after the final post-document SHA gates pass. |
| Registration/submission | Organizer form or submission action completed for the intended submitted artifact/version. | `UNKNOWN-HOLD` until independently evidenced. |
| Receipt/acceptance | Organizer receipt, acknowledgement, or approval exists and independent evidence binds it to the actual submitted artifact/version, including the final package/archive identity when available. | `UNKNOWN-HOLD`; local validator output and the attempt-6 CSV hash are not receipts. |
| Official score | An official organizer score/result is available and attributable to this submission. | `UNKNOWN-HOLD`; internal validation metrics are not scores. |
| Visual verification | Production desktop/mobile and deep-link flows have current, reproducible visual evidence. | `UNKNOWN-HOLD` until screenshots or an equivalent recorded visual check are tied to the tested deployment. |

The final report must show these decisions in separate fields. A technical GO
must not be worded as submission, acceptance, score, or visual approval.
Receipt binding does not require inventing a missing package/archive hash: it
requires independent evidence of the actual submitted artifact/version. Until
that evidence exists, both the final package/archive SHA-256 and
receipt/acceptance remain `UNKNOWN-HOLD`.

## 6. Required execution and integration gates

Each track first creates its branch from the executable base and verifies that
the first commit's parent is that exact SHA. It then performs only its
allowlisted writes through a linear sequence of normal commits. The
coordinator rejects a sequence if any commit has zero or multiple parents, its
parent chain is not exact, its cumulative name-only diff contains any other
path, LF normalization changes unrelated blobs, or the resulting tree is not
reproducible.

The remote tip and the whole append-only sequence are one acceptance unit. The
coordinator uses the live remote ref, not a cached remote-tracking ref:

```powershell
$executableSha = '58090bc1747d621bc87d698259319a70c34e75f2'
$remoteRef = 'refs/heads/<track-branch>'
$remoteLines = @(git ls-remote --exit-code --heads origin $remoteRef)
if ($LASTEXITCODE -ne 0 -or $remoteLines.Count -ne 1) {
  throw "Missing or ambiguous remote ref: $remoteRef"
}
$remoteTip = ($remoteLines[0] -split '\s+')[0]

git fetch --no-tags origin $remoteRef
if ($LASTEXITCODE -ne 0) { throw "Fetch failed: $remoteRef" }
$sequence = @(git rev-list --reverse "$executableSha..$remoteTip")
if ($LASTEXITCODE -ne 0 -or $sequence.Count -eq 0) {
  throw "Empty or unreadable commit sequence: $remoteRef"
}

$expectedParent = $executableSha
foreach ($commit in $sequence) {
  $parentText = (git show -s --format=%P $commit).Trim()
  if ($LASTEXITCODE -ne 0) { throw "Cannot inspect commit: $commit" }
  $parents = @($parentText -split '\s+')
  if ($parents.Count -ne 1 -or $parents[0] -ne $expectedParent) {
    throw "Non-linear or wrong-base commit: $commit"
  }
  $expectedParent = $commit
}
if ($expectedParent -ne $remoteTip) { throw 'Remote tip/sequence mismatch' }
```

The unique integration worktree is created from the published plan and the
accepted track sequences. Every cumulative path/tree comparison has both the
executable SHA and candidate SHA as endpoints; a clean working tree is not a
substitute for this base-to-candidate comparison:

```powershell
$candidate = '<candidate-sha>'
git diff --check $executableSha $candidate
if ($LASTEXITCODE -ne 0) { throw 'Whitespace gate failed' }

$changedPaths = @(git diff --no-renames --name-only $executableSha $candidate)
if ($LASTEXITCODE -ne 0) { throw 'Changed-path gate failed' }
$changedPaths

git diff --quiet $executableSha $candidate -- `
  apps/web packages plugins services tests package.json package-lock.json `
  .github/workflows
if ($LASTEXITCODE -ne 0) { throw 'Frozen business tree changed' }
```

For an individual track, every entry in `$changedPaths` must be inside that
track's exact Section 3 allowlist. For the final integration candidate, every
entry must be inside the union of the accepted track allowlists plus the exact
`docs/competition/h2-sentinel/delivery/EPOCH-4-PLAN.md` path from the accepted
plan-author commit. Renames are evaluated as deletion plus addition so that
both paths are checked.

Protected refs are checked as refs, never as path arguments. Before final
publication, both local canonical refs and independently observed remote refs
must still identify the frozen SHAs:

```powershell
$expectedMain = '7889feb274dac77753fdd323df352c9c1335aebf'
$localMain = (git rev-parse --verify refs/heads/main).Trim()
if ($LASTEXITCODE -ne 0 -or $localMain -ne $expectedMain) {
  throw 'Local refs/heads/main moved'
}
$localCompetition = (
  git rev-parse --verify refs/heads/competition/h2-sentinel
).Trim()
if ($LASTEXITCODE -ne 0 -or $localCompetition -ne $executableSha) {
  throw 'Local refs/heads/competition/h2-sentinel moved before publication'
}

$remoteMainLines = @(
  git ls-remote --exit-code --heads origin refs/heads/main
)
if ($LASTEXITCODE -ne 0 -or $remoteMainLines.Count -ne 1 -or
    ($remoteMainLines[0] -split '\s+')[0] -ne $expectedMain) {
  throw 'Remote refs/heads/main moved'
}
$remoteCompetitionLines = @(
  git ls-remote --exit-code --heads origin refs/heads/competition/h2-sentinel
)
if ($LASTEXITCODE -ne 0 -or $remoteCompetitionLines.Count -ne 1 -or
    ($remoteCompetitionLines[0] -split '\s+')[0] -ne $executableSha) {
  throw 'Remote competition ref moved before publication'
}
```

Sensitive filename scanning and sensitive content scanning are separate gates
over the base-to-candidate change set. The content gate uses `git grep -l`, so
it emits filenames only and never prints matched content. Exit code 1 means no
match; errors greater than 1 fail the gate:

```powershell
$filenamePattern = '(?i)(^|/)(\.env(?:\.|$)|[^/]*(?:private|secret|token|credential)[^/]*|[^/]+\.(?:pem|key|p12|pfx))$'
$filenameHits = @($changedPaths | Where-Object { $_ -match $filenamePattern })
if ($filenameHits.Count -gt 0) {
  $filenameHits
  throw 'Sensitive filename gate failed'
}

$contentPaths = @(
  git diff --no-renames --diff-filter=ACMRTUXB --name-only `
    $executableSha $candidate
)
if ($LASTEXITCODE -ne 0) { throw 'Content path enumeration failed' }
if ($contentPaths.Count -gt 0) {
  $contentPattern = '(-----BEGIN ([A-Z0-9]+ )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{20,}|(api[_-]?key|client[_-]?secret|access[_-]?token|password)[[:space:]]*[:=][[:space:]]*[^[:space:]<]{8,})'
  $grepArgs = @(
    'grep', '-I', '-i', '-l', '-E', '--', $contentPattern,
    $candidate, '--'
  ) + $contentPaths
  $contentHits = @(& git @grepArgs)
  $grepExit = $LASTEXITCODE
  if ($grepExit -gt 1) { throw 'Sensitive content scan failed to run' }
  if ($contentHits.Count -gt 0) {
    $contentHits
    throw 'Sensitive content gate failed'
  }
}
```

The coordinator must also verify the attempt-6 report SHA and attempt-6
`submission.csv` SHA, record the independently measured final submission
package/archive SHA or `UNKNOWN-HOLD`, and verify LF blob hashes. The CSV hash
must never substitute for a package/archive identity. The documentation
validator must pass for the edited claims and release manifest.

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

Only after all required final technical, artifact, path/ref, exact-SHA CI, and
deployment/deep-link gates pass may the unique integrator publish the final SHA
to the canonical competition ref. The push must be a normal fast-forward, and
the remote observation is a separate command from the push:

```powershell
$finalSha = (git rev-parse HEAD).Trim()
git merge-base --is-ancestor $executableSha $finalSha
if ($LASTEXITCODE -ne 0) { throw 'Final SHA is not a base descendant' }

git push origin "${finalSha}:refs/heads/competition/h2-sentinel"
if ($LASTEXITCODE -ne 0) { throw 'Canonical fast-forward push failed' }

$publishedLines = @(
  git ls-remote --exit-code --heads origin refs/heads/competition/h2-sentinel
)
if ($LASTEXITCODE -ne 0 -or $publishedLines.Count -ne 1 -or
    ($publishedLines[0] -split '\s+')[0] -ne $finalSha) {
  throw 'Independent canonical remote verification failed'
}
```

After that publication, repeat the local and remote `refs/heads/main` checks;
both must still equal `7889feb274dac77753fdd323df352c9c1335aebf`.

## 7. Release handoff and decision record

The coordinator records, in order:

1. base SHA, parent SHA, each track's ordered commit sequence and independently
   observed remote tip, and the final post-document SHA;
2. exact changed paths and tree/path gate results;
3. the attempt-6 report SHA, attempt-6 `submission.csv` SHA, and independently
   measured final submission package/archive SHA or `UNKNOWN-HOLD`;
4. the actual intended submitted artifact/version used for any independently
   evidenced receipt binding;
5. deployment ID, hostnames, deep-link checks, and CI run identities;
6. technical gate results and the five independent statuses in Section 5; and
7. the integrator's normal fast-forward push, independently observed canonical
   remote SHA, and unchanged local/remote `main` ref evidence.

The release is blocked if any required technical gate fails, if a path gate
finds an unauthorized edit, if a hash is inconsistent, or if old/new untested
code is merged or deployed. Unknown organizer, score, receipt, or visual facts
remain `UNKNOWN-HOLD`; they are not filled with assumptions or roadmap claims.
