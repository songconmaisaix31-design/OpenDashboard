# H2 Sentinel Epoch 5 Full Fixture Deployment Plan

## 1. Purpose and frozen authority

Epoch 5 creates a second, isolated public presentation of the existing H2
Sentinel six-page Fixture experience. The target hostname is frozen as:

```text
full.204421.xyz
```

The isolated Vercel project name is frozen as:

```text
h2-sentinel-full
```

The project must be created and recorded by Epoch 5. If that exact project
name is already occupied and there is no Epoch 5 creation receipt binding it
to this task, delivery is `HOLD`; workers must not adopt, rename, delete, or
overwrite the existing project.

The existing `204421.xyz` deployment, alias, DNS behavior, TLS behavior, and
served asset identity must remain unchanged. Epoch 5 is not a production
promotion of the existing `h2-sentinel` project. The only permitted
production-mode deployment command is `vercel deploy --prod --skip-domain`,
and it may run only from a context independently verified as the new
`h2-sentinel-full` project. No worker may run `--prod`, promote, assign a
production deployment, or change a domain in the existing `h2-sentinel`
project. The new project must never contain the exact apex domain
`204421.xyz`; only `full.204421.xyz` may be bound after qualification.

The Git base is frozen at:

```text
39a599285cbd39b2575564d5dc79d078964c5bd7
```

Every implementation commit must descend linearly from that SHA. Epoch 5 must
not move, merge, push to, or otherwise update `refs/heads/main` or
`refs/heads/competition/h2-sentinel`. The implementation remains on the
isolated Epoch 5 branch and is deployed from a clean, committed candidate.
Amend, rebase, force push, destructive reset, and history rewriting are
prohibited.

This plan is the Epoch 5 specification and acceptance contract. It authorizes
only the minimal Fixture presentation and an isolated staged production
deployment in the new project followed by one explicit alias assignment. It
does not authorize a public analytics backend, remote device access, public
Local mode, or a broader product redesign.

## 2. Product definition and truth boundary

For Epoch 5, **full version** means the complete existing six-page H2 Sentinel
Fixture experience:

1. overview;
2. events;
3. diagnosis;
4. analysis;
5. assistant; and
6. reports.

It reuses the accepted deterministic H2 Fixture provider, charts, evidence,
diagnosis, safety boundaries, deterministic assistant answers, reports, and
Fixture export behavior. It does not substitute a remote service for the
loopback analytics sidecar and does not process user CSV data.

The following Chinese truth-boundary strings are exact product requirements:

```text
演示数据 Fixture
不接收或上传用户文件
```

On the analysis page, a Fixture workspace must display both strings and must
not display an actionable CSV file input, file-picker label, or upload action.
Live-only import implementation may remain in source for the existing local
launcher, but it must remain conditional on `LIVE_ANALYSIS` and must not be
advertised as a public capability on `full.204421.xyz`.

The public deployment must not expose:

- the Python analytics sidecar;
- Vercel Functions or another API under `/api/v1/h2-sentinel/**`;
- a public or remote `mode=local` capability;
- arbitrary file, path, command, plugin, process, or remote-host access;
- official competition input, account data, credentials, or secret material;
- an LLM-backed result or an inferred official score; or
- any device or scheduling control action.

HTTP success, a JavaScript marker, a Fixture result, or a generated report is
not evidence of Live analysis, organizer submission, official acceptance,
official score, or visual quality.

## 3. Hosting behavior

The Epoch 5 deployment candidate must implement one temporary redirect:

```text
GET https://full.204421.xyz/
307 Location: /h2-sentinel/?mode=fixture
```

The redirect must be temporary, same-origin, and terminate after one hop at a
200 H2 SPA shell. The existing slash and no-slash H2 Fixture deep links must
continue to resolve through the static SPA rewrite. Hash navigation for all
six pages remains client-side.

The existing `h2-sentinel` project's direct Preview is not a delivery path:
Standard Protection may return a 302 SSO redirect and prevent anonymous
access. Epoch 5 must instead create the independent `h2-sentinel-full` project
with no exact `204421.xyz` apex-domain assignment. From an explicitly verified
new-project context, run exactly:

```text
vercel deploy --prod --skip-domain
```

`--skip-domain` makes this a staged production deployment: qualification
occurs before any custom domain points to it. Any production-mode deployment
in the existing project, any promote operation, and any automatic or manual
assignment of `204421.xyz` are prohibited. After the staged deployment passes
its anonymous-access and static-delivery gates, only that exact deployment may
receive `full.204421.xyz`. The project creation receipt, project name,
deployment URL, deployment ID, candidate Git SHA, local build asset hashes,
remote asset hashes, and alias result must be recorded together.

The deployer may use an already-authenticated Vercel CLI session, but must not
read, print, copy, export, or persist tokens, cookies, credentials, `.env`
files, environment values, or credential-store content. Do not run an
environment pull command. If the exact `full.204421.xyz` alias already exists
and does not point to an explicitly recorded Epoch 5 deployment, stop for a
collision review rather than overwriting it. Project inspection must prove the
deployment context is `h2-sentinel-full` immediately before and after the
staged deployment. Anonymous requests must succeed without cookies,
authorization headers, or an authenticated browser session. Do not modify the
exact apex `204421.xyz`, wildcard, or unrelated DNS records.

## 4. Exact write allowlists

The plan-author commit may add only:

```text
docs/competition/h2-sentinel/delivery/EPOCH-5-PLAN.md
```

After the accepted plan-author commit, implementation work is divided into
closed, non-overlapping tracks. A path not listed below is frozen.

| Track | Exact write allowlist | Responsibility |
| --- | --- | --- |
| A — Fixture UI boundary | `apps/web/src/features/h2-sentinel/pages/analysis/AnalysisPage.tsx`; `apps/web/src/features/h2-sentinel/test/presentation.test.tsx` | Condition the analysis-page import presentation on dataset mode. Fixture must show the two exact Chinese strings and no actionable file input; Local behavior remains intact. |
| B — Staged deployment routing | `vercel.json`; `scripts/h2-sentinel/composition.test.mjs` | Add the exact temporary root redirect, preserve both H2 deep-link rewrites, and statically prove that no public API/function route was added. |
| C — Deployment evidence | `docs/competition/h2-sentinel/DEPLOYMENT_AND_SMOKE.md`; `scripts/h2-sentinel/HANDOFF.md`; `MEMORY.md` | Record only measured project creation, candidate, staged production deployment, alias, anonymous HTTP, DNS/TLS, asset, unchanged-`204421.xyz`, test, rollback, and UNKNOWN-HOLD evidence. Do not copy secrets or private responses. |

The final Epoch 5 candidate may differ from the frozen base only at the plan
path and the union of Tracks A through C. Root package manifests, lockfiles,
dependencies, contracts, analytics service, plugin implementation, Fixture
data, CI workflows, submission artifacts, prior Epoch plans, and every other
path are frozen. No new dependency is required or permitted.

Each track uses normal append-only commits. The integrator rejects any commit
whose parent chain is not linear from the accepted predecessor or whose
base-to-tip changed-path list escapes its exact allowlist. Corrections are new
normal commits, never amended or rebased commits.

## 5. Execution tasks

### Task 0 — Record immutable preflight state

Before implementation or external mutation:

1. verify `HEAD` equals the frozen base before the plan-author commit;
2. record the current branch and the exact plan-author commit;
3. snapshot local and live remote values for `refs/heads/main` and
   `refs/heads/competition/h2-sentinel` without moving them;
4. require a clean working tree apart from accepted track work;
5. record the live HTTP status, redirect behavior, same-origin asset paths,
   and asset SHA-256 values for `https://204421.xyz` as the before-state;
6. resolve `full.204421.xyz` and query the Vercel alias state without printing
   authentication material;
7. query the exact `h2-sentinel-full` project name; require it to be available,
   or require an Epoch 5 creation receipt proving that this task created it;
8. record the existing `h2-sentinel` project and its exact domains as a frozen
   no-mutation control, without reading environment values; and
9. stop if the project name or `full.204421.xyz` is owned by an unrecorded
   project or deployment.

### Task 1 — Implement the Fixture-only analysis presentation

Track A must use the existing workspace mode as the source of truth. It must
not create a host-name heuristic, deployment environment flag, parallel data
source, or duplicated page.

The presentation test must render representative Fixture and Live analysis
states. It must prove all of the following semantically, not only with a source
regular expression:

- Fixture output contains `演示数据 Fixture`;
- Fixture output contains `不接收或上传用户文件`;
- Fixture output contains no enabled or disabled `<input type="file">` and no
  upload/file-picker call to action;
- Live output retains the existing CSV picker and file constraints; and
- provenance and report behavior remain unchanged.

### Task 2 — Add isolated staged-deployment routing

Track B adds one non-permanent root redirect to
`/h2-sentinel/?mode=fixture`. It must preserve the existing exact rewrites for
`/h2-sentinel` and `/h2-sentinel/`. It must not add functions, API rewrites,
proxy targets, remote origins, or a catch-all rewrite.

The composition test must parse the configuration and prove:

- one root redirect exists and is non-permanent;
- its destination is exactly `/h2-sentinel/?mode=fixture`;
- both existing H2 rewrites still target `/index.html`;
- there is no `/api/v1/h2-sentinel` route or function declaration; and
- application composition still selects the deterministic Fixture plugin for
  `mode=fixture` and preserves the literal-loopback guard for Local mode.

### Task 3 — Run the exact-candidate local gate

From the clean candidate worktree, run the full applicable gates:

```powershell
npm ci
npm run typecheck
npm run test
npm run build
npm run check
npm run h2:check
npm run h2:smoke
Push-Location services/h2-analytics
uv lock --check
uv sync --locked --extra dev
uv run --locked --extra dev pytest tests
Pop-Location
git diff --check 39a599285cbd39b2575564d5dc79d078964c5bd7 HEAD
```

The duplicated build/test coverage is intentional for the delivery receipt:
each named gate must complete successfully on the exact candidate. Generated
or ignored outputs are not committed.

After the build, extract the JavaScript and CSS asset paths from
`apps/web/dist/index.html`, compute SHA-256 for each local asset, and confirm
that the emitted JavaScript contains the two exact Chinese truth-boundary
strings. String presence is static-bundle evidence only; the semantic test is
the behavior evidence, and neither is visual evidence.

### Task 4 — Create the independent project and qualify a staged deployment

Create the exact `h2-sentinel-full` project only after the name-availability
preflight passes. Record the provider-issued project identity and creation
result without recording credentials or environment values. Verify that the
new project has no exact `204421.xyz` apex-domain assignment and that the
working context targets this new project, not the existing `h2-sentinel`
project.

Deploy the clean committed candidate with exactly:

```text
vercel deploy --prod --skip-domain
```

This is the only authorized production-mode command. It is authorized only in
the verified `h2-sentinel-full` context. `--skip-domain` must prevent automatic
custom-domain assignment. Do not assign any custom alias yet, do not promote a
deployment, and do not run any production-mode operation in the existing
project.

Qualify the immutable staged deployment URL with CLI HTTP checks made without
cookies or authorization headers:

- root returns the expected one-hop temporary redirect;
- both slash forms of the H2 Fixture route return a 200 SPA shell;
- the emitted JavaScript and CSS assets are same-origin and return 200;
- remote asset SHA-256 values exactly equal the local build asset hashes;
- the JavaScript asset contains `H2 Sentinel`, `氢哨`, and both exact
  truth-boundary strings;
- `/api/v1/h2-sentinel/mode` does not return a successful analytics response;
- no response or log used as evidence contains credentials or private data;
  and
- no request returns Standard Protection, SSO, login, or authentication
  redirect behavior; any such response is `AUTH-REDIRECT/HOLD` and cannot be
  converted into a pass by following it.

Project inspection after deployment must still identify `h2-sentinel-full`,
show no exact `204421.xyz` apex domain, and show no mutation to the existing
project's deployment or domain state.

### Task 5 — Assign only the new alias

After Task 4 passes, assign only `full.204421.xyz` to the exact qualified
staged production deployment in `h2-sentinel-full`. Do not promote the
deployment, do not invoke another production deployment during aliasing, and
do not touch the exact `204421.xyz` apex alias or any existing-project domain.

After DNS and certificate propagation, verify with CLI-only checks:

1. DNS resolves the exact hostname without changing apex or wildcard records;
2. TLS validates for `full.204421.xyz` with no certificate warning;
3. `/` returns the exact temporary redirect and destination;
4. `/h2-sentinel?mode=fixture` and
   `/h2-sentinel/?mode=fixture` return the H2 SPA shell;
5. the remote asset paths and SHA-256 values match the qualified staged
   deployment and local build;
6. all six hash deep-link URLs resolve to the same H2 document transport;
7. `/api/v1/h2-sentinel/mode` is not a successful analytics API;
8. source and focused tests still prove that public origins cannot activate
   the literal-loopback Live adapter; and
9. `https://204421.xyz` still matches its recorded before-state for route
   status, redirect behavior, asset paths, and asset hashes.

Hash deep-link HTTP checks prove document transport only because fragments are
not sent to the server. They do not prove rendered navigation or interaction.

### Task 6 — Record truthful evidence

Track C records the new-project creation receipt, candidate SHA, staged
production deployment ID and URL, alias, anonymous-access proof, DNS/TLS
outcome, redirect status and `Location`, route matrix, local and remote asset
hashes, exact test commands and results, unchanged existing-project and
`204421.xyz` comparisons, and rollback state.

The evidence must keep these independent statuses:

| Decision | Required Epoch 5 status policy |
| --- | --- |
| Static Fixture delivery | May become `GO` only when every local, project-isolation, staged-deployment, anonymous-access, alias, asset, route, DNS/TLS, unchanged-existing-site, and path/ref gate passes. |
| Live/Local analytics | `NOT_EXPOSED`; no public capability is claimed. |
| Visual verification | `UNKNOWN-HOLD`; see Section 7. |
| Organizer submission/acceptance | Preserve the prior independent state; Epoch 5 does not change it. |
| Official score | Preserve the prior independent state; Fixture output is not a score. |

## 6. Acceptance gates

Epoch 5 Static Fixture delivery is accepted only when all conditions below are
true on the same committed candidate:

1. candidate ancestry begins at the frozen base and is linear;
2. base-to-candidate changed paths equal a subset of the exact Section 4
   allowlist, with no untracked files included in the deliverable;
3. `git diff --check` passes;
4. every Task 3 command passes in the Epoch 5 worktree;
5. Fixture semantic tests prove the exact copy and absence of an actionable
   CSV input while Live semantic tests preserve local behavior;
6. the root redirect is a one-hop 307 to the exact Fixture URL;
7. `h2-sentinel-full` was created and recorded by Epoch 5, contains no exact
   `204421.xyz` apex domain, and is the independently verified deployment
   context;
8. the staged deployment was created only with
   `vercel deploy --prod --skip-domain`, with no automatic custom-domain
   assignment and no promote operation;
9. the H2 Fixture shell and same-origin assets return 200 anonymously from both
   the staged deployment and `full.204421.xyz`, with no SSO or protection
   redirect;
10. local, staged-deployment, and aliased asset hashes match;
11. DNS and TLS pass for `full.204421.xyz`;
12. no successful public H2 analytics API, sidecar, or remote Local capability
    exists;
13. no production-mode command, promotion, deployment assignment, domain
    mutation, or access-policy change occurred in the existing `h2-sentinel`
    project, and only the new alias was assigned in the new project;
14. the before/after evidence shows the existing project and `204421.xyz` are
    unchanged;
15. local and live remote `main` and canonical competition refs remain at
    their recorded preflight values; and
16. all evidence claims preserve the Fixture, Live, visual, organizer, and
    score boundaries.

Any missing, redirected, inconsistent, or unauditable result is a HOLD, not a
pass. HTTP 200 proves transport only. A matching asset proves static artifact
identity only. Neither proves interactive rendering or visual quality.

## 7. Visual verification restriction

The user prohibited computer control for this task. Epoch 5 therefore must not
open or operate a desktop browser, use browser-driving automation, capture
screenshots, or claim a desktop/mobile visual pass.

The strongest permitted substitutes are:

- full repository, H2, launcher, smoke, and Python tests;
- semantic React presentation tests;
- production static bundle inspection and local/remote asset hashing;
- CLI-only HTTP status, redirect, header, asset, and deep-link checks; and
- CLI-only DNS and TLS validation.

Even if every substitute passes, the production visual status remains exactly:

```text
UNKNOWN-HOLD
```

Known residual risks include layout regression, text truncation, overlap,
mobile viewport behavior, chart rendering, focus order, download interaction,
and client-side hash navigation. None may be described as visually verified.

## 8. Risks and controls

| Risk | User impact | Control |
| --- | --- | --- |
| New-project name collision | An unrelated project is overwritten or trusted | Require an Epoch 5 creation receipt for `h2-sentinel-full`; otherwise stop at `HOLD` without adopting or deleting it. |
| Production command runs in the existing project | Existing public site changes unexpectedly | Independently verify the project context before and after the sole allowed `vercel deploy --prod --skip-domain`; prohibit existing-project production, promote, domain, and access-policy operations. |
| Automatic domain assignment during staging | A candidate becomes public before qualification | Require `--skip-domain`; inspect new-project domains before and after staging; bind only `full.204421.xyz` after qualification. |
| Wrong alias target | Users see stale or unrelated content | Record project identity, deployment ID, URL, candidate SHA, and asset hashes before aliasing; independently inspect alias target after mutation. |
| Existing `204421.xyz` changes | Current delivery is disrupted | Capture before-state and require identical after-state; never alias, deploy, or change DNS for the apex. |
| Fixture appears to accept real CSV | Users may disclose data or believe analysis is Live | Hide the actionable input in Fixture and show both exact Chinese boundary strings; test Fixture and Live separately. |
| Public sidecar or API exposure | Data leakage, resource abuse, and false Live claims | Add no function/API route; verify negative API behavior; preserve literal-loopback code and tests. |
| Redirect loop or incorrect query | Root becomes unusable | Freeze one temporary redirect and exact destination; verify one-hop Location and both H2 path forms. |
| Deployment/source identity drift | Evidence cannot be tied to code | Deploy a clean commit; compare local, staged-deployment, and alias asset hashes; record all identities together. |
| Standard Protection or SSO blocks anonymous users | Judges cannot open the site without an account | Use the isolated project rather than the protected existing Preview; make requests without auth context; any SSO/login redirect is `AUTH-REDIRECT/HOLD`. |
| DNS or TLS propagation is incomplete | Users receive resolution or certificate failures | Keep delivery on HOLD until exact-host DNS and TLS checks pass. |
| No visual inspection | Undetected presentation defects remain | Preserve `UNKNOWN-HOLD`; report the specific residual risks and only the permitted substitute evidence. |

## 9. Rollback

Rollback is scoped only to `full.204421.xyz` and the isolated Epoch 5 branch.
It must never use `204421.xyz`, a wildcard record, `main`, or the canonical
competition branch as a rollback target.

Before assigning the alias, record whether `full.204421.xyz` is absent or its
exact prior deployment target. If any post-alias acceptance gate fails:

1. stop further publication and preserve the failed staged deployment and
   sanitized evidence for diagnosis;
2. verify the exact current alias target before mutation;
3. if the alias was absent at preflight, remove only the exact
   `full.204421.xyz` alias using the provider-supported alias operation;
4. if a recorded prior target existed and overwrite had separately been
   authorized, reassign only `full.204421.xyz` to that exact prior deployment;
5. verify that `204421.xyz` still matches its untouched before-state;
6. repeat exact-host DNS and TLS observations and record the rollback result;
   and
7. fix code with a new normal commit on the Epoch 5 branch, repeat all local
   gates, create the replacement staged deployment only with
   `vercel deploy --prod --skip-domain` in the verified new-project context,
   and assign the alias again only after the new exact deployment qualifies.

Do not delete a deployment, project, DNS zone, wildcard, certificate, branch,
or Git history as part of routine rollback. Destructive cleanup requires a
separate explicit authorization and exact-target verification.

## 10. Final handoff receipt

The final Epoch 5 receipt must contain:

1. frozen base SHA, plan-author SHA, ordered implementation commits, and final
   candidate SHA;
2. exact base-to-candidate changed paths and clean/untracked status;
3. unchanged local and live remote protected-ref observations;
4. all Task 3 command results;
5. `h2-sentinel-full` creation receipt, exact project identity, and proof that
   it never contained the exact `204421.xyz` apex domain;
6. local, staged-deployment, and alias asset identities;
7. staged production deployment ID and URL, the sanitized exact deployment
   command, anonymous-access result, and the exact new alias;
8. DNS, TLS, redirect, deep-link, negative API, and unchanged-existing-project
   and site results;
9. rollback preflight and final state;
10. `Static Fixture delivery`, `Live/Local analytics`, `Visual verification`,
   organizer, and score statuses as independent fields; and
11. confirmation that `MEMORY.md` was updated only with durable, non-secret,
    measured Epoch 5 facts, or an explicit reason it was not updated.

The handoff must not convert transport, bundle, Fixture, or test evidence into
a visual, Live, organizer, acceptance, or score claim.
