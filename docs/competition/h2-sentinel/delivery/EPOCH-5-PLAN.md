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
promotion of the existing `h2-sentinel` project. Its only authorized
deployment-state workflow is `vercel --prod --skip-domain` followed by
exactly one `vercel promote <deployment>` for the exact qualified deployment,
and both operations may run only from a context independently verified as the
new `h2-sentinel-full` project. No worker may run `--prod`, promote, assign a
production deployment, or change a domain in the existing `h2-sentinel`
project. Immediately before the one promotion, the new project's custom-domain
set must be exactly `full.204421.xyz`; provider-generated `*.vercel.app`
hostnames are not custom domains for this check. The new project must never
contain the exact apex domain `204421.xyz` or any other custom domain.

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
only the minimal Fixture presentation, an isolated staged production
deployment in the new project, configuration of the sole custom domain, and
one explicit promotion of that exact deployment. It does not authorize a
public analytics backend, remote device access, public Local mode, or a broader
product redesign.

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

Provider-generated Preview and production hostnames are not anonymous delivery
paths: Standard Protection may return a 302 SSO redirect from either hostname.
That result must be recorded as `AUTH-REDIRECT`, but it is not by itself a
static-delivery failure and must not be followed or reclassified as an
anonymous pass. Epoch 5 must instead create the independent
`h2-sentinel-full` project with no exact `204421.xyz` apex-domain assignment.
From an explicitly verified new-project context, run exactly:

```text
vercel --prod --skip-domain
```

`--skip-domain` makes this a staged production deployment: qualification
occurs before a production domain points to it. Any production-mode deployment
or promote operation in the existing project, and any automatic or manual
assignment of `204421.xyz`, are prohibited. Qualification of the staged
deployment uses `vercel inspect` to require `Ready` state and the already
authenticated Vercel CLI's `vercel curl` to retrieve the shell and same-origin
assets for status and hash comparison. The CLI must add any required
protection authentication internally; workers must not extract, print, or
manually construct authentication material. This is authenticated pre-binding
technical qualification, not anonymous-public evidence.

After the staged deployment qualifies, configure `full.204421.xyz` as the new
project's only custom domain, re-inspect that exact singleton domain set, and
run exactly one `vercel promote <deployment>` for the qualified deployment.
The final anonymous-public gate is performed only against
`https://full.204421.xyz`: `/` must directly return the expected 307 and the H2
shell and assets must directly return 200, with no Standard Protection, SSO,
login, or authentication redirect. The project creation receipt, project name,
deployment URL, deployment ID, candidate Git SHA, local build asset hashes,
authenticated staged asset hashes, custom-domain state, promotion result, and
final anonymous result must be recorded together.

The deployer may use an already-authenticated Vercel CLI session, including
`vercel inspect` and `vercel curl`, but must not read, print, copy, export, or
persist tokens, cookies, credentials, `.env` files, environment values, or
credential-store content. Do not run an environment pull command. If the exact
`full.204421.xyz` domain already exists and is not covered by an explicit Epoch
5 creation/configuration receipt for `h2-sentinel-full`, stop for a collision
review rather than overwriting it. Project inspection must prove the deployment
context is `h2-sentinel-full` immediately before and after the staged deploy,
domain configuration, and single promotion. Anonymous final-gate requests must
send no cookies or authorization headers and must not use an authenticated
browser session. Do not modify the exact apex `204421.xyz`, wildcard, or
unrelated DNS records.

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
| C — Deployment evidence | `docs/competition/h2-sentinel/DEPLOYMENT_AND_SMOKE.md`; `scripts/h2-sentinel/HANDOFF.md`; `MEMORY.md` | Record only measured project creation, candidate, staged production deployment, authenticated pre-binding qualification, sole-custom-domain state, single promotion, anonymous HTTP, DNS/TLS, asset, unchanged-`204421.xyz`, test, rollback, and UNKNOWN-HOLD evidence. Do not copy secrets or private responses. |

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
6. resolve `full.204421.xyz` and query its Vercel domain state without printing
   authentication material;
7. query the exact `h2-sentinel-full` project name; require it to be available,
   or require an Epoch 5 creation receipt proving that this task created it;
8. record the current custom-domain set for `h2-sentinel-full`, distinguishing
   custom domains from provider-generated `*.vercel.app` hostnames;
9. record the existing `h2-sentinel` project and its exact domains as a frozen
   no-mutation control, without reading environment values; and
10. stop if the project name or `full.204421.xyz` is owned by an unrecorded
    project or deployment, or if the new project contains `204421.xyz` or any
    unrelated custom domain.

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
vercel --prod --skip-domain
```

This is the only authorized production deployment-creation command; Task 5
separately authorizes one promotion. It is authorized only in the verified
`h2-sentinel-full` context. `--skip-domain` must prevent automatic
production-domain assignment. Do not promote a deployment yet, and do not run
any production-mode operation in the existing project.

Inspect the immutable staged deployment with `vercel inspect` and require the
provider state to be `Ready`. Record the generated URL's direct no-auth status.
A Standard Protection 302 is recorded as `AUTH-REDIRECT`; it neither fails this
pre-binding qualification nor proves anonymous availability. Do not follow the
redirect and do not treat its target as delivery evidence.

Use the already-authenticated CLI's `vercel curl` against the exact staged
deployment for the following pre-binding technical checks. Authentication is
allowed only through the CLI's normal credential handling; do not read, print,
copy, export, persist, or manually supply authentication material:

- root returns the expected one-hop temporary redirect;
- both slash forms of the H2 Fixture route return a 200 SPA shell;
- the emitted JavaScript and CSS assets are same-origin and return 200;
- remote asset SHA-256 values exactly equal the local build asset hashes;
- the JavaScript asset contains `H2 Sentinel`, `氢哨`, and both exact
  truth-boundary strings;
- `/api/v1/h2-sentinel/mode` does not return a successful analytics response;
- no response or log used as evidence contains credentials or private data;
  and
- each measured result is labeled `AUTHENTICATED-PRE-BINDING` and is not
  presented as anonymous-public proof.

Project inspection after deployment must still identify `h2-sentinel-full`,
show no exact `204421.xyz` apex domain or unrelated custom domain, and show no
mutation to the existing project's deployment or domain state.

### Task 5 — Configure the sole custom domain and promote exactly once

After Task 4 passes, configure only `full.204421.xyz` as a custom domain of
`h2-sentinel-full`. Immediately before promotion, inspect the project and
require its custom-domain set to be exactly the singleton
`{full.204421.xyz}`. Provider-generated `*.vercel.app` hostnames are excluded
from this custom-domain count. Stop at `HOLD` if `204421.xyz` or any unrelated
custom domain is present.

From the independently verified `h2-sentinel-full` context, run exactly once:

```text
vercel promote <deployment>
```

`<deployment>` must resolve to the exact staged deployment ID and URL that
passed Task 4. Record the sanitized invocation and provider result. Do not
promote any other deployment, invoke another production deployment during
promotion, assign a separate alias, or touch the exact `204421.xyz` apex domain
or any existing-project domain.

After DNS and certificate propagation, verify with CLI-only checks:

1. DNS resolves the exact hostname without changing apex or wildcard records;
2. TLS validates for `full.204421.xyz` with no certificate warning;
3. a direct anonymous request to `/` returns the exact temporary 307 and
   destination, without a preceding protection or SSO redirect;
4. `/h2-sentinel?mode=fixture` and
   `/h2-sentinel/?mode=fixture` directly return the H2 SPA shell with 200;
5. the remote asset paths and SHA-256 values match the qualified staged
   deployment and local build, and the assets directly return 200 anonymously;
6. all six hash deep-link URLs resolve to the same H2 document transport;
7. `/api/v1/h2-sentinel/mode` is not a successful analytics API;
8. source and focused tests still prove that public origins cannot activate
   the literal-loopback Live adapter; and
9. project inspection still shows the exact singleton custom-domain set and
   the promoted deployment identity; and
10. `https://204421.xyz` still matches its recorded before-state for route
   status, redirect behavior, asset paths, and asset hashes.

All final public requests must be made without cookies, authorization headers,
or an authenticated browser session. Any Standard Protection, SSO, login, or
authentication redirect from `full.204421.xyz` is `AUTH-REDIRECT/HOLD`. The
generated staged hostname's access status is not part of this final anonymous
gate.

Hash deep-link HTTP checks prove document transport only because fragments are
not sent to the server. They do not prove rendered navigation or interaction.

### Task 6 — Record truthful evidence

Track C records the new-project creation receipt, candidate SHA, staged
production deployment ID and URL, `vercel inspect` Ready state, generated-URL
access classification, authenticated `vercel curl` qualification, sole
custom-domain state, exact single-promotion receipt, final anonymous-access
proof, DNS/TLS outcome, redirect status and `Location`, route matrix, local and
remote asset hashes, exact test commands and results, unchanged
existing-project and `204421.xyz` comparisons, and rollback state.

The evidence must keep these independent statuses:

| Decision | Required Epoch 5 status policy |
| --- | --- |
| Static Fixture delivery | May become `GO` only when every local, project-isolation, staged-deployment inspection, authenticated pre-binding qualification, sole-custom-domain, single-promotion, final anonymous-access, asset, route, DNS/TLS, unchanged-existing-site, and path/ref gate passes. |
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
   `204421.xyz` apex domain or unrelated custom domain, and is the independently
   verified deployment context;
8. the staged deployment was created only with
   `vercel --prod --skip-domain`, with no automatic custom-domain
   assignment before qualification;
9. `vercel inspect` reports the exact staged deployment as `Ready`, and
   authenticated `vercel curl` checks bind its shell and asset hashes to the
   local candidate without exposing authentication material;
10. any direct generated-URL 302 is recorded as `AUTH-REDIRECT` and is neither
    treated as a staged failure nor converted into anonymous-public evidence;
11. immediately before promotion, the new project's custom-domain set is
    exactly `{full.204421.xyz}`, excluding provider-generated `*.vercel.app`
    hostnames from the custom-domain count;
12. exactly one `vercel promote <deployment>` targets the exact staged
    deployment qualified in Task 4, and no separate alias assignment occurs;
13. direct anonymous requests to `full.204421.xyz` return the required root 307
    and H2 shell and asset 200 responses without SSO or protection redirect;
14. local, authenticated staged-deployment, and anonymously served custom-domain
    asset hashes match;
15. DNS and TLS pass for `full.204421.xyz`;
16. no successful public H2 analytics API, sidecar, or remote Local capability
    exists;
17. no production-mode command, promotion, deployment assignment, domain
    mutation, or access-policy change occurred in the existing `h2-sentinel`
    project, and the only custom-domain mutation in the new project was
    `full.204421.xyz`;
18. the before/after evidence shows the existing project and `204421.xyz` are
    unchanged;
19. local and live remote `main` and canonical competition refs remain at
    their recorded preflight values; and
20. all evidence claims preserve the Fixture, Live, visual, organizer, and
    score boundaries.

Any missing, inconsistent, or unauditable result is a HOLD, not a pass. An
`AUTH-REDIRECT` from a provider-generated staged hostname is an allowed recorded
access condition, but it cannot satisfy the final anonymous gate; any such
redirect from `full.204421.xyz` is a HOLD. HTTP 200 proves transport only. A
matching asset proves static artifact identity only. Neither proves interactive
rendering or visual quality.

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
| Production command runs in the existing project | Existing public site changes unexpectedly | Independently verify the project context before and after `vercel --prod --skip-domain`, custom-domain configuration, and the single `vercel promote`; prohibit all existing-project production, promote, domain, and access-policy operations. |
| Automatic domain assignment during staging | A candidate becomes public before qualification | Require `--skip-domain`; inspect new-project domains before and after staging; configure the sole custom domain only after authenticated qualification. |
| Generated hostname is protected | A valid staged artifact is rejected, or authenticated evidence is mislabeled public | Record direct 302 as `AUTH-REDIRECT`; require `vercel inspect` Ready plus authenticated `vercel curl` hash checks; reserve anonymous GO evidence for `full.204421.xyz`. |
| Custom-domain set is contaminated | Promotion publishes the candidate on an unintended hostname | Immediately before promotion require the exact singleton `{full.204421.xyz}`; exclude only provider-generated `*.vercel.app` hostnames from the count and stop on every other custom domain. |
| Wrong promotion target | Users see stale or unrelated content | Record project identity, deployment ID, URL, candidate SHA, and asset hashes before promotion; resolve `<deployment>` to those exact identities and inspect the production target afterward. |
| Existing `204421.xyz` changes | Current delivery is disrupted | Capture before-state and require identical after-state; never alias, deploy, or change DNS for the apex. |
| Fixture appears to accept real CSV | Users may disclose data or believe analysis is Live | Hide the actionable input in Fixture and show both exact Chinese boundary strings; test Fixture and Live separately. |
| Public sidecar or API exposure | Data leakage, resource abuse, and false Live claims | Add no function/API route; verify negative API behavior; preserve literal-loopback code and tests. |
| Redirect loop or incorrect query | Root becomes unusable | Freeze one temporary redirect and exact destination; verify one-hop Location and both H2 path forms. |
| Deployment/source identity drift | Evidence cannot be tied to code | Deploy a clean commit; compare local, authenticated staged-deployment, and anonymous custom-domain asset hashes; record all identities together. |
| Standard Protection or SSO blocks the custom domain | Judges cannot open the site without an account | Make final requests to `full.204421.xyz` without auth context; any SSO/login redirect there is `AUTH-REDIRECT/HOLD`, regardless of successful authenticated staged checks. |
| A retry causes a second promotion | The one-promotion authority is exceeded and provenance becomes ambiguous | Permit exactly one promotion in Epoch 5; on failure remove only the exact new custom domain when safe, preserve evidence, and require new publication authority for another promotion. |
| DNS or TLS propagation is incomplete | Users receive resolution or certificate failures | Keep delivery on HOLD until exact-host DNS and TLS checks pass. |
| No visual inspection | Undetected presentation defects remain | Preserve `UNKNOWN-HOLD`; report the specific residual risks and only the permitted substitute evidence. |

## 9. Rollback

Rollback is scoped only to `full.204421.xyz` and the isolated Epoch 5 branch.
It must never use `204421.xyz`, a wildcard record, `main`, or the canonical
competition branch as a rollback target. The single authorized promotion is
not repeatable as a rollback or retry mechanism.

Before configuring the custom domain, prove that `full.204421.xyz` has no
unrecorded prior owner or deployment target; any collision stops Epoch 5 before
mutation. Before promotion, record the exact staged deployment identity and the
singleton custom-domain set. If any post-promotion acceptance gate fails:

1. stop further publication and preserve the staged/promoted deployment and
   sanitized evidence for diagnosis;
2. use project inspection to verify the exact current production deployment and
   custom-domain set before mutation;
3. if `full.204421.xyz` was created by Epoch 5 and remains the sole custom
   domain, remove only that exact custom-domain binding using the
   provider-supported domain operation;
4. do not run a second promotion, automatic rollback, production deployment,
   alias assignment, or access-policy change under this plan;
5. verify that `204421.xyz` and the existing `h2-sentinel` project still match
   their untouched before-state;
6. repeat exact-host DNS and TLS observations and record the rollback result;
   and
7. fix code only with a new normal commit on the Epoch 5 branch and repeat the
   local gates; a replacement staged deployment or another promotion requires
   fresh explicit publication authority and a revised receipt contract.

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
   it never contained the exact `204421.xyz` apex domain or an unrelated custom
   domain;
6. local, authenticated staged-deployment, and anonymous custom-domain asset
   identities;
7. staged production deployment ID and URL, sanitized exact deployment command,
   `vercel inspect` Ready result, direct generated-URL access classification,
   and authenticated `vercel curl` qualification result;
8. the exact singleton custom-domain inspection, sanitized single
   `vercel promote <deployment>` invocation and result, and final anonymous
   `full.204421.xyz` 307/200/no-SSO evidence;
9. DNS, TLS, redirect, deep-link, negative API, and unchanged-existing-project
   and site results;
10. rollback preflight and final state, including confirmation that no second
    promotion occurred;
11. `Static Fixture delivery`, `Live/Local analytics`, `Visual verification`,
   organizer, and score statuses as independent fields; and
12. confirmation that `MEMORY.md` was updated only with durable, non-secret,
    measured Epoch 5 facts, or an explicit reason it was not updated.

The handoff must not convert transport, bundle, Fixture, or test evidence into
a visual, Live, organizer, acceptance, or score claim.
