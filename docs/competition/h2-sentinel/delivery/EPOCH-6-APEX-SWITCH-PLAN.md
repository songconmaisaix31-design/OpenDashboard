# H2 Sentinel Epoch 6 Apex Domain Switch Plan

## 1. Specify

### 1.1 User outcome

Epoch 6 makes the already-qualified full H2 Sentinel Fixture deployment the
default experience at:

```text
https://204421.xyz
```

The user-visible change is intentionally limited to the entry hostname. Fresh
preflight established that current provider metadata and traffic have separate
owners:

- ProjectDomain `204421.xyz` belongs to Vercel project `dashboard`, project ID
  `prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql`;
- the apex alias sends traffic to Vercel project `h2-sentinel`, project ID
  `prj_6pRMaPgh3YXvgibdHBYnM9RoysUQ`; and
- that traffic is served by the `Ready` production deployment and immutable
  automatic URL:

```text
Deployment: dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf
Deployment URL: https://h2-sentinel-hxrbu0wan-dwwww.vercel.app
```

The `h2-sentinel` project itself has no custom domains. Therefore,
ProjectDomain ownership, current traffic target, and target ownership are
three distinct roles; this plan must not collapse them into one "old project."

After the switch, the apex must serve the complete six-page deterministic
Fixture from the existing `h2-sentinel-full` project and already-qualified
deployment:

```text
Project: h2-sentinel-full
Project ID: prj_KvPLDryNckM3lSaHVDG3YeMJyiCj
Deployment: dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU
Deployment URL: https://h2-sentinel-full-87jzhi1zh-dwwww.vercel.app
```

The six pages are overview, events, diagnosis, analysis, assistant, and
reports. This remains a deterministic Fixture product. It does not make the
loopback-only Local analytics service public.

### 1.2 Frozen scope

Epoch 6 changes only the exact Vercel assignment or alias for
`204421.xyz`, plus measured non-secret evidence after the switch. It must:

- keep `full.204421.xyz` attached to `h2-sentinel-full` and serving the same
  qualified deployment;
- keep the external apex DNS A result at `216.198.79.1`;
- avoid creating, updating, or deleting any apex, `full`, or wildcard DNS
  record;
- reuse `dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU` without a new deployment, build,
  promotion, or source change;
- retain `dashboard` as the metadata rollback owner and retain
  `h2-sentinel` / `dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf` as the traffic rollback
  target;
- avoid deleting or renaming any of the three Vercel projects or either
  deployment;
- avoid changing Vercel environment variables, access policy, or Deployment
  Protection;
- avoid changing code, configuration, dependencies, Git history, or remote
  refs; and
- never read, print, copy, export, or persist credentials, tokens, cookies,
  `.env` files, environment values, or credential-store content.

`full.204421.xyz`, any wildcard domain, any provider-generated hostname, and
every unrelated domain are outside the mutation scope. An operation whose
target is not provably the exact apex must not run.

### 1.3 Frozen source and recorded baseline

This plan is authored from the Epoch 5 evidence tip:

```text
da5ae929e67168a57dc4f7229bcee47e8047049f
```

The deployed implementation remains:

```text
f546a6aedaefa66f5634b20008a20cab41db26ed
```

Epoch 5 recorded, but Epoch 6 must freshly verify before mutation:

- `refs/heads/main` at
  `7889feb274dac77753fdd323df352c9c1335aebf`;
- `refs/heads/competition/h2-sentinel` at
  `39a599285cbd39b2575564d5dc79d078964c5bd7`;
- the old apex JavaScript at 935,592 bytes with SHA-256
  `b26ab9a88167f6b587732d52a4ae9461d8d2edfa4b17847e3f815ec81ef6d4b6`;
- the full JavaScript at 935,880 bytes with SHA-256
  `02ccb27f97ce0bc6098307e8ed8506577699a83ec5088ebed1a7b4b41610066d`;
  and
- the shared full CSS at 49,826 bytes with SHA-256
  `6ec8757d71b6518408ac83a8a0ddb4a8bdc1e3c0a4c41a7572ee404561a169b2`.

These are recorded baseline values, not substitutes for fresh preflight or
post-switch observations.

## 2. Completion definition

Epoch 6 is complete only when all of the following are true in one evidence
window:

1. fresh inspection binds `dashboard` as the current ProjectDomain owner,
   `h2-sentinel` as the current alias traffic target, both deployment
   identities, and `h2-sentinel-full` as the target owner and traffic target;
2. exactly one approved migration path in Section 5 is used;
3. the external apex DNS A result remains `216.198.79.1`;
4. `https://204421.xyz/` returns HTTP 307 with exact relative
   `Location: /h2-sentinel/?mode=fixture`;
5. both H2 Fixture slash forms return HTTP 200 HTML;
6. the apex JavaScript and CSS match the qualified full-deployment byte counts
   and SHA-256 values;
7. the apex JavaScript contains the required static markers;
8. TLS validates and HSTS is present at the apex;
9. `full.204421.xyz` remains unchanged and continues to pass the same route,
   asset, DNS, and TLS controls;
10. the old deployment remains `Ready` but no longer receives apex alias
    traffic, while `h2-sentinel` continues to have no custom domain;
11. the protected remote refs remain unchanged; and
12. the independent evidence statuses in Section 9 remain truthful.

Any missing, conflicting, or unauditable result is a `HOLD`. HTTP status is
transport evidence, asset identity is static-artifact evidence, and neither is
visual or interaction evidence.

## 3. Plan-author and later write boundaries

The plan-author commit may add only:

```text
docs/competition/h2-sentinel/delivery/EPOCH-6-APEX-SWITCH-PLAN.md
```

No application, test, deployment configuration, package, lockfile, analytics,
Fixture, CI, or submission path may change in the apex switch. A later
evidence-only commit may update only the existing measured-evidence locations
explicitly assigned by the Epoch 6 integrator. It must record facts observed
after the switch and must not retroactively rewrite Epoch 5 evidence.

All Git commits are normal append-only commits on the isolated Epoch 6 branch.
Amend, rebase, force push, destructive reset, and protected-ref movement are
prohibited.

## 4. Mandatory fresh preflight

Run this preflight immediately before choosing or executing a migration path.
Use CLI or provider API reads without environment export and without printing
authentication material.

### 4.1 Vercel identity and domain ownership

Record all of the following:

1. the authenticated Vercel scope `dwwww`, without credential material;
2. the ProjectDomain owner `dashboard`, project ID
   `prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql`, and its assignment of exact
   `204421.xyz`;
3. the current alias traffic project `h2-sentinel`, project ID
   `prj_6pRMaPgh3YXvgibdHBYnM9RoysUQ`, its empty custom-domain set, and the
   exact alias target
   `h2-sentinel-hxrbu0wan-dwwww.vercel.app`;
4. the exact new project identity
   `h2-sentinel-full` / `prj_KvPLDryNckM3lSaHVDG3YeMJyiCj`;
5. the complete custom-domain set for all three projects;
6. continued ownership of `full.204421.xyz` by `h2-sentinel-full`;
7. `Ready` state for both
   `dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf` and
   `dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU`;
8. the production deployment of `h2-sentinel-full` is exactly
   `dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU`; and
9. no wildcard or unrelated domain is implicated by the intended command or
   API request.

Stop at `HOLD` if the ProjectDomain owner is not `dashboard`, the alias does
not target the recorded `h2-sentinel` deployment, `h2-sentinel` has acquired a
custom domain, the target production deployment differs, either deployment is
not `Ready`, the full subdomain is not on the new project, or a proposed
mutation has broader scope.

### 4.2 Anonymous HTTP and artifact snapshot

With redirects disabled and without cookies or authorization headers, record
the old and target public states:

- `https://204421.xyz/`, both H2 Fixture slash forms, and
  `/api/v1/h2-sentinel/mode`;
- `https://full.204421.xyz/`, both H2 Fixture slash forms, and
  `/api/v1/h2-sentinel/mode`;
- exact `Location` values;
- same-origin JavaScript and CSS paths, HTTP status, bytes, and SHA-256;
- JavaScript markers `H2 Sentinel`, `氢哨`, `演示数据 Fixture`, and
  `不接收或上传用户文件` for the full artifact;
- TLS validation and HSTS for both public hostnames; and
- the un-followed access classification of both immutable generated
  deployment URLs.

The old generated deployment may remain protected. An un-followed 302 to the
stable Vercel SSO endpoint is recorded as `AUTH-REDIRECT`, not as public or H2
shell evidence.

### 4.3 DNS and Git controls

Using external DNS-over-HTTPS, record:

- apex A result exactly `216.198.79.1`;
- `full.204421.xyz` CNAME exactly
  `063cc3c97d7335db.vercel-dns-017.com`; and
- authoritative name servers, so an unexpected zone change is visible.

Freshly query the live remote values of `refs/heads/main` and
`refs/heads/competition/h2-sentinel` without fetching, checking out, merging,
or moving either ref. Stop if either differs from the frozen observations until
the difference is reconciled in the receipt. A ref difference does not
authorize changing it.

### 4.4 Command semantic gate

Fresh preflight used Vercel CLI `56.3.1` and confirmed the exact operation
semantics. `vercel domains add <domain> <project> --force` performs a
sequential DELETE of the existing exact ProjectDomain followed by a POST to
the new project with target `PRODUCTION`. It is not atomic. It does not change
DNS, another domain, or a deployment, and it does not delete or rename a
project. Reconfirm the same CLI version and semantics immediately before
mutation, and record a sanitized transcript.

The transcript must prove:

- the metadata source is the freshly inspected `dashboard` project;
- the current traffic source is the freshly inspected `h2-sentinel`
  deployment;
- the target is `h2-sentinel-full`;
- the only domain argument is exactly `204421.xyz`;
- the target production deployment is the already-qualified
  `dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU`;
- no command performs a deployment, promotion, DNS mutation, project deletion,
  access-policy change, wildcard action, or `full.204421.xyz` action; and
- a corresponding exact-apex rollback operation is available.

If the CLI version or semantics differ, stop at `HOLD`. Do not substitute a
new command or API mutation under this plan.

## 5. Migration strategy decision

Fresh preflight explicitly selects Path A. Do not switch to Path B, retry a
mutation, or proceed from a partial state without another fresh inspection.

| Path | Advantage | Primary risk | Selection policy |
| --- | --- | --- | --- |
| A — zero-downtime alias transition | Sends traffic to the qualified full deployment before changing ProjectDomain ownership | The later non-atomic metadata transfer can stop between DELETE and POST | **Selected:** CLI `56.3.1` semantics are known, and the traffic alias is switched and verified before metadata transfer |
| B — direct forced ProjectDomain transfer | Uses one metadata command | CLI `--force` is a sequential, non-atomic DELETE then POST; without the alias gate, users can see interruption | Evaluated but not selected or authorized for Epoch 6 execution |

Path A is selected because preserving public availability has direct user
value and fresh preflight proved that ProjectDomain ownership (`dashboard`)
and alias traffic (`h2-sentinel`) are already separate. The alias gate moves
traffic first; the later exact-domain command moves metadata from `dashboard`
to `h2-sentinel-full`. If the confirmed preconditions drift, stop at `HOLD`
rather than falling back to Path B.

### 5.1 Path A — preferred zero-downtime alias transition

The first and only traffic-switch command is:

```text
vercel alias set h2-sentinel-full-87jzhi1zh-dwwww.vercel.app 204421.xyz --scope dwwww --non-interactive
```

This must target the immutable automatic URL of
`dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU`, not a mutable project-default hostname.
The operator must not use a wildcard or `full.204421.xyz`.

The path has two gated mutation stages:

1. **Set the exact apex alias to the new immutable deployment.** Immediately
   verify that the apex returns the target 307, full asset hashes, TLS, and
   HSTS while DNS remains unchanged. If this gate fails, perform no domain
   ownership mutation and restore traffic with the exact rollback alias in
   Section 8.
2. **Transfer the exact ProjectDomain metadata from `dashboard` to
   `h2-sentinel-full`.** Only after Stage 1 passes, run:

   ```text
   vercel domains add 204421.xyz h2-sentinel-full --force --scope dwwww --non-interactive
   ```

   CLI `56.3.1` performs a non-atomic DELETE of exact `204421.xyz` from
   `dashboard`, then POSTs exact `204421.xyz` to `h2-sentinel-full` with target
   `PRODUCTION`. Immediately require `dashboard` to no longer list the apex,
   `h2-sentinel-full` to list both apex and `full.204421.xyz`, the apex alias
   to continue serving the qualified full deployment, and `h2-sentinel` to
   retain an empty custom-domain set and its old `Ready` deployment. Then run
   the complete Section 7 matrix.

For this plan, `--force` authorizes only the exact ProjectDomain transfer
described above. It does not authorize a wildcard, `full.204421.xyz`, DNS
mutation, another domain, project deletion, deployment creation, promotion,
or access-policy change.

Each stage must finish its gate before the next mutation. A failed or timed-out
stage is not retried blindly. If Stage 2 stops between DELETE and POST, the
already-verified new alias is the traffic-preservation layer; fresh inspection
must determine the exact partial metadata state before Section 8 rollback.

### 5.2 Path B — evaluated but not selected

Running only the Stage 2 `--force` command would directly move ProjectDomain
metadata but would expose users to the non-atomic DELETE/POST interval. Path B
is therefore not authorized in this Epoch. Any need to abandon Path A requires
a new plan and fresh authority; it is not an in-run fallback.

## 6. Task sequence

### Task 0 — Freeze the receipt and rollback targets

Complete Section 4, reconfirm selected Path A, and bind all three roles:
`dashboard` as metadata owner, `h2-sentinel` as old traffic target, and
`h2-sentinel-full` as new owner and traffic target. Record the frozen commands
and exact rollback operations. Require a clean Epoch 6 worktree and record the
plan commit. Do not mutate external state until every field is complete.

### Task 1 — Execute selected Path A

Run only the two ordered Path A operations in Section 5.1, with the complete
Stage 1 traffic gate between them. Preserve timestamped sanitized results for
each stage. Do not follow authentication redirects, expose private responses,
or run Path B.

### Task 2 — Verify the new default origin

Run every Section 7 check from an anonymous CLI-only context. A passing
project-assignment response without passing anonymous routes and assets is a
`HOLD`, not a delivery pass.

### Task 3 — Verify controls and record evidence

Re-inspect all three projects and both deployments, `full.204421.xyz`, DNS,
TLS, and protected refs. Record the selected path, exact sanitized operations,
intermediate gates, final domain sets, route and asset evidence, rollback
readiness, and independent status matrix. Update durable project memory only
with measured non-secret outcomes.

## 7. Post-switch verification matrix

### 7.1 Apex public gate

All requests are direct and anonymous, with redirects disabled unless a
separate one-hop termination check is being performed.

| Request or control | Required result |
| --- | --- |
| `https://204421.xyz/` | HTTP 307 and exact relative `Location: /h2-sentinel/?mode=fixture` |
| `https://204421.xyz/h2-sentinel?mode=fixture` | HTTP 200 HTML |
| `https://204421.xyz/h2-sentinel/?mode=fixture` | HTTP 200 HTML |
| One-hop redirect destination | HTTP 200 H2 SPA document |
| Six `#h2/...` URLs | HTTP 200 document transport; no visual or client-navigation claim |
| `https://204421.xyz/api/v1/h2-sentinel/mode` | HTTP 404; no public analytics API |
| JavaScript | `/assets/index-CG2awVBj.js`, 935,880 bytes, SHA-256 `02ccb27f97ce0bc6098307e8ed8506577699a83ec5088ebed1a7b4b41610066d` |
| CSS | `/assets/index-DPHGouYO.css`, 49,826 bytes, SHA-256 `6ec8757d71b6518408ac83a8a0ddb4a8bdc1e3c0a4c41a7572ee404561a169b2` |
| JavaScript markers | `H2 Sentinel`, `氢哨`, `演示数据 Fixture`, and `不接收或上传用户文件` all present |
| TLS | Certificate validation succeeds for the exact apex |
| HSTS | Present on the apex HTTPS response |
| External DNS-over-HTTPS | Apex A remains exactly `216.198.79.1` |

Fragments are not sent to the server. Hash-route results prove document
transport only, not rendered navigation or interaction.

### 7.2 Project and deployment gate

- `h2-sentinel-full` owns both exact custom domains `204421.xyz` and
  `full.204421.xyz`, with no unintended domain introduced by Epoch 6;
- `dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU` remains `Ready` and is the production
  deployment serving both exact domains;
- `dashboard` no longer lists the `204421.xyz` ProjectDomain;
- the apex alias targets
  `h2-sentinel-full-87jzhi1zh-dwwww.vercel.app`;
- `h2-sentinel` continues to have an empty custom-domain set and no longer
  receives apex alias traffic;
- `dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf` remains `Ready` and retained for bounded
  rollback; and
- no new deployment, promotion, project, wildcard, DNS record, access-policy
  change, or environment mutation occurred.

### 7.3 Full-subdomain regression gate

`https://full.204421.xyz` must remain unchanged:

- `/` returns HTTP 307 with the exact Fixture `Location`;
- both H2 Fixture slash forms return HTTP 200 HTML;
- the analytics API probe returns HTTP 404;
- JavaScript and CSS paths, byte counts, and SHA-256 match Section 7.1;
- static markers remain present;
- TLS and HSTS pass; and
- external DNS-over-HTTPS still returns CNAME
  `063cc3c97d7335db.vercel-dns-017.com`.

### 7.4 Git and worktree gate

- live remote `refs/heads/main` and
  `refs/heads/competition/h2-sentinel` equal their fresh preflight values;
- the base-to-tip changed-path list is limited to authorized Epoch 6 plan and
  measured-evidence files;
- `git diff --check` passes; and
- the final worktree is clean with no untracked deliverable.

## 8. Rollback

Rollback is mandatory if any apex route, asset, TLS, domain-assignment, or
control gate fails after mutation. It is scoped to restoring `dashboard` as
the exact ProjectDomain owner and the old `h2-sentinel` deployment as the apex
alias target. It must not delete or change DNS.

Before rollback, freshly inspect:

1. the current ProjectDomain owner and alias target of exact `204421.xyz`;
2. all three project identities and complete custom-domain sets;
3. both immutable deployment identities and `Ready` states;
4. the current apex HTTP and asset result;
5. the unchanged `full.204421.xyz` assignment and result; and
6. the unchanged apex A and full-subdomain CNAME results.

For immediate traffic rollback, run exactly:

```text
vercel alias set h2-sentinel-hxrbu0wan-dwwww.vercel.app 204421.xyz --scope dwwww --non-interactive
```

If only Stage 1 ran and `dashboard` still owns the ProjectDomain, verify old
traffic and perform no metadata mutation. If Stage 2 began or completed, first
restore complete metadata ownership with exactly:

```text
vercel domains add 204421.xyz dashboard --force --scope dwwww --non-interactive
```

Then lock traffic to the old immutable deployment by running the exact alias
rollback command again. Every rollback operation is preceded by fresh
inspection of the observed partial state. The `--force` rollback may move only
exact `204421.xyz` from its observed current metadata owner to `dashboard`;
it must not remove `full.204421.xyz` from `h2-sentinel-full`.

Rollback succeeds only when:

- `dashboard` again owns the `204421.xyz` ProjectDomain;
- the exact apex alias again targets
  `h2-sentinel-hxrbu0wan-dwwww.vercel.app` and serves
  `dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf`;
- `h2-sentinel` retains an empty custom-domain set and the old deployment
  remains `Ready`;
- the apex returns its recorded preflight route behavior and old JavaScript
  identity of 935,592 bytes / SHA-256
  `b26ab9a88167f6b587732d52a4ae9461d8d2edfa4b17847e3f815ec81ef6d4b6`;
- apex DNS remains A `216.198.79.1`;
- `full.204421.xyz` continues serving the full artifact unchanged;
- both deployments remain retained; and
- protected refs remain unchanged.

Do not delete a DNS record, wildcard, domain zone, project, deployment,
certificate, branch, or Git history during rollback. Do not deploy, promote,
or change access policy as a rollback shortcut. If exact rollback ownership or
command semantics cannot be proven, stop at `HOLD` and preserve the measured
partial state rather than broadening the mutation.

## 9. Independent status boundaries

| Decision | Epoch 6 policy |
| --- | --- |
| Static Fixture production default | May become `GO` only after every post-switch apex, full-subdomain, project/deployment, DNS/TLS, asset, path, and protected-ref gate passes |
| Live/Local analytics | `NOT_EXPOSED`; the public API remains 404 and CSV analytics remains literal-loopback-only |
| Visual verification | `UNKNOWN-HOLD`; no browser, screenshot, desktop/mobile render, or interaction check is authorized |
| Organizer submission/receipt/acceptance | Preserve `UNKNOWN-HOLD`; Epoch 6 performs no organizer action |
| Official score | Preserve `UNKNOWN-HOLD`; Fixture and technical outputs are not an official score |
| Final submission archive | Preserve `UNKNOWN-HOLD`; no organizer archive is created or verified |

The user's prohibition on computer control remains binding. Epoch 6 may use
only file, CLI, HTTP, DNS, TLS, hash, and provider-inspection evidence. It must
not open or drive a browser, capture screenshots, or claim visual quality.

## 10. Risks and controls

| Risk | User impact | Control |
| --- | --- | --- |
| Traffic interruption or stale cache | The default link may briefly fail or show the old shell | Prefer the verified zero-downtime alias path; use temporary redirect and immutable asset hashes as immediate probes; keep the old deployment Ready for rollback |
| Wrong project or domain | Users reach an unrelated deployment, or another hostname is displaced | Freshly bind source owner, target project ID, deployment ID, and exact apex before every mutation; reject wildcard or unrelated-domain scope |
| Partial multi-step state | Alias target and project ownership diverge after a failed stage | Gate every Path A stage, stop on first mismatch, fresh-inspect the partial state, and use its stage-specific exact-apex rollback |
| Forced-transfer scope is misunderstood | `--force` moves more than intended | Use it only as Path A Stage 2 after the alias gate; CLI `56.3.1` must still prove exact DELETE from `dashboard` and POST to `h2-sentinel-full`, with no other mutation |
| DNS is edited unnecessarily | Propagation delay or outage is introduced despite compatible existing routing | Freeze the apex A record and full CNAME; perform project/alias reassignment only |
| Full subdomain regresses | The already-delivered fallback URL stops working | Treat `full.204421.xyz` as a no-mutation control and verify it after every external mutation |
| Rollback target drifts | Recovery returns users to the wrong artifact | Freshly inspect and preserve the old immutable deployment and asset identity before switching |
| Protected refs move | Deployment evidence becomes entangled with source publication | Read remote refs before and after without updating them; a difference is a recorded HOLD, not authority to repair the ref |
| Static evidence is overstated | Transport checks are mistaken for visual, Live, or organizer acceptance | Keep Section 9 statuses independent and preserve visual and official outcomes as `UNKNOWN-HOLD` |

## 11. Final evidence receipt

The Epoch 6 receipt must contain:

1. plan commits, selected Path A, authenticated scope, all three project IDs
   and roles, both deployment IDs, immutable URLs, and fresh preflight domain
   sets;
2. exact sanitized mutation operation or ordered Path A operations, including
   every intermediate gate and the reason the path was selected;
3. before/after apex and full-subdomain HTTP route matrices, exact redirect
   locations, API results, TLS, HSTS, and external DNS-over-HTTPS results;
4. before/after asset paths, byte counts, SHA-256 values, and full JavaScript
   marker results;
5. final project domain sets and proof that the old deployment remains Ready
   without the apex;
6. confirmation that the apex A and full CNAME records were not changed;
7. confirmation that no deployment, promotion, project deletion, access-policy
   change, environment operation, code change, or protected-ref update
   occurred;
8. live remote protected-ref values before and after;
9. rollback preflight, exact rollback command or API shape, and whether
   rollback was required;
10. `git diff --check`, changed-path, clean-worktree, and untracked-file
    results; and
11. the independent decision matrix, with static production default separated
    from Live, visual, organizer, score, and archive claims.

The receipt must not contain credentials, environment values, private response
bodies, nonce-bearing SSO locations, or claims unsupported by the measured
evidence.
