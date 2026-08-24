# H2 Sentinel Epoch 7 Dashboard Project Shutdown Plan

## 1. Specify

### 1.1 User outcome

Epoch 7 takes the obsolete Vercel project named `dashboard` offline without
deleting it. In this plan, "shutdown" means pausing exactly this project:

```text
Project: dashboard
Project ID: prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql
```

Pausing is selected because it is reversible. The project, deployments,
settings, and provider history remain available for inspection and recovery.
Deletion is not authorized because it is materially harder to recover and is
unnecessary after Epoch 6 removed the project's public-domain responsibility.

When the provider supports the expected behavior, a direct request to a paused
production deployment should return HTTP 503 with provider classification
`DEPLOYMENT_PAUSED`. Anonymous HTTP behavior can instead be hidden by Standard
Protection, a missing alias, or another provider routing layer. Provider
metadata with `paused=true` is therefore the primary shutdown proof; anonymous
HTTP is a secondary, origin-specific observation.

### 1.2 Frozen scope

Epoch 7 may perform exactly one external mutation: pause project
`prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql` after every preflight gate passes. It must:

- preserve the `dashboard` project, all deployments, project settings, build
  history, production history, and recoverability;
- preserve every environment configuration without reading, exporting,
  printing, copying, comparing, or changing environment values;
- leave `h2-sentinel-full` and its qualified production deployment unchanged:

  ```text
  Project: h2-sentinel-full
  Project ID: prj_KvPLDryNckM3lSaHVDG3YeMJyiCj
  Deployment: dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU
  ```

- leave `https://204421.xyz` and `https://full.204421.xyz` attached to and
  served by `h2-sentinel-full`;
- leave the old `h2-sentinel` rollback deployment
  `dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf` retained and unchanged;
- leave all DNS records and the DNS zone unchanged;
- leave every alias, ProjectDomain, certificate, Deployment Protection rule,
  access policy, project name, project ID, deployment, and Git ref unchanged;
  and
- avoid creating a new deployment, build, promotion, alias, domain assignment,
  project, or recovery resource.

Project deletion, deployment deletion, domain deletion, alias removal, DNS
mutation, project rename, environment access, and repository publication are
outside scope. A command or API request that contains a deletion operation or
cannot prove its exact project target must not run.

### 1.3 Recorded baseline, not current proof

Epoch 6 recorded the following final state:

- `dashboard` ProjectDomains were empty;
- `h2-sentinel-full` owned `204421.xyz` and `full.204421.xyz`;
- both public domains served
  `dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU`, state `Ready`, target `production`;
- the old rollback deployment `dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf`
  remained `Ready`, target `production`;
- apex DNS returned A `216.198.79.1`;
- `full.204421.xyz` returned CNAME
  `063cc3c97d7335db.vercel-dns-017.com`; and
- the qualified full assets were:

  | Asset | Bytes | SHA-256 |
  | --- | ---: | --- |
  | `/assets/index-CG2awVBj.js` | 935,880 | `02ccb27f97ce0bc6098307e8ed8506577699a83ec5088ebed1a7b4b41610066d` |
  | `/assets/index-DPHGouYO.css` | 49,826 | `6ec8757d71b6518408ac83a8a0ddb4a8bdc1e3c0a4c41a7572ee404561a169b2` |

These facts may have drifted and must be freshly verified before pausing
anything. Epoch 7 must not infer current ownership or dependency safety from a
cached Epoch 6 receipt.

## 2. Completion definition

Epoch 7 is complete only when all of the following are established in one
bounded evidence window:

1. fresh provider reads bind project name `dashboard` to exact ID
   `prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql`;
2. the current provider pause state is recorded before mutation;
3. `dashboard` has no custom domain or ProjectDomain;
4. every current alias, deployment, production deployment, and production URL
   associated with `dashboard` is enumerated without private response bodies;
5. no `dashboard` domain, alias, deployment, or production URL is required by
   `204421.xyz`, `full.204421.xyz`, or `h2-sentinel-full`;
6. current provider documentation or sanitized client behavior proves the
   exact pause and unpause POST semantics for this project and scope;
7. if the project was active, exactly one pause POST targets the exact project
   ID; if it was already paused, no mutation is repeated;
8. post-operation provider metadata reports `paused=true` for the exact
   `dashboard` project while the project and its deployments remain present;
9. each discovered `dashboard` production URL or alias is probed anonymously
   and its actual result is classified; HTTP 503 `DEPLOYMENT_PAUSED` is the
   expected direct result, but protection redirects or missing routes are not
   rewritten as 503 evidence;
10. `204421.xyz` and `full.204421.xyz` retain their exact route behavior,
    artifact identities, TLS, HSTS, and DNS results;
11. `dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU` remains `Ready` and continues serving
    both public custom domains;
12. `dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf` remains retained and unchanged;
13. the exact unpause operation is recorded and recovery requires no new
    deployment; and
14. no resource, DNS record, code, environment setting, access policy, or Git
    ref was deleted or changed outside the one pause-state mutation.

Any identity mismatch, unproven dependency, broader mutation, or incomplete
recovery path is a `HOLD`. HTTP 503 alone does not prove that the correct
project was paused.

## 3. Plan-author and evidence boundaries

The plan-author commit may add only:

```text
docs/competition/h2-sentinel/delivery/EPOCH-7-DASHBOARD-SHUTDOWN-PLAN.md
```

No application source, test, build configuration, package, lockfile, existing
evidence document, project memory, deployment configuration, or remote state
may change in the plan-author task.

A later integrator may write measured, non-secret evidence only to paths
explicitly assigned for Epoch 7. It must preserve Epoch 4 through Epoch 6 as
historical receipts and must not turn expected behavior into measured fact.

## 4. Mandatory fresh preflight

Run every item in this section immediately before any pause request. Provider
reads must use normal authenticated CLI or API handling without displaying
authentication headers, tokens, cookies, environment values, private response
bodies, or nonce-bearing SSO locations.

### 4.1 Exact project identity and pause state

Record sanitized provider metadata proving:

- authenticated scope identity, without a team identifier guessed from prior
  runs or embedded into the plan;
- project name exactly `dashboard`;
- project ID exactly `prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql`;
- the current boolean pause state;
- the project's continued existence and non-deleted status; and
- the provider capability to pause and unpause this project without deploying,
  deleting, renaming, or changing settings.

If the name and ID do not identify the same project, stop. If the project is
already paused, perform no new pause mutation; continue with the post-pause
verification matrix and record the operation as an idempotent no-op.

### 4.2 Complete domain, alias, and deployment inventory

Freshly enumerate all of the following for `dashboard`:

1. complete ProjectDomain and custom-domain sets;
2. every alias, including aliases attached to historical deployments;
3. every retained deployment, including its ID, target, state, and immutable
   URL, plus an explicit identification of the current production deployment
   and production URL;
4. the current production deployment ID, immutable URL, target, and provider
   state;
5. the project-default hostname, if present; and
6. any branch, redirect, or protection metadata relevant to anonymous access.

The preflight passes only if the custom-domain and ProjectDomain sets are
empty and none of the discovered aliases is `204421.xyz`,
`full.204421.xyz`, a wildcard covering either hostname, or an alias required by
`h2-sentinel-full`.

An exhaustive inventory is necessary because ProjectDomain ownership and
alias traffic target were different in Epoch 6. An empty ProjectDomain list
alone does not prove that pausing `dashboard` is dependency-free.

### 4.3 Public target and rollback controls

Freshly prove the production path is independent from `dashboard`:

- `h2-sentinel-full` is still exact project ID
  `prj_KvPLDryNckM3lSaHVDG3YeMJyiCj`;
- `dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU` is still `Ready`, target
  `production`;
- both exact custom domains are owned by and resolve to that target project and
  deployment;
- neither custom domain appears in the complete `dashboard` domain or alias
  inventory;
- the old `h2-sentinel` deployment
  `dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf` remains retained and its state is
  recorded without mutation; and
- no shared alias, domain, certificate, or routing dependency would be disabled
  by pausing `dashboard`.

With redirects disabled and no cookies or authorization headers, capture the
current route and artifact baseline for both public origins:

| Probe | Required preflight result |
| --- | --- |
| `/` | HTTP 307; exact relative `Location: /h2-sentinel/?mode=fixture` |
| `/h2-sentinel?mode=fixture` | HTTP 200 HTML |
| `/h2-sentinel/?mode=fixture` | HTTP 200 HTML |
| `/api/v1/h2-sentinel/mode` | HTTP 404 |
| JavaScript | 935,880 bytes and SHA-256 `02ccb27f97ce0bc6098307e8ed8506577699a83ec5088ebed1a7b4b41610066d` |
| CSS | 49,826 bytes and SHA-256 `6ec8757d71b6518408ac83a8a0ddb4a8bdc1e3c0a4c41a7572ee404561a169b2` |
| JavaScript markers | `H2 Sentinel`, `氢哨`, `演示数据 Fixture`, and `不接收或上传用户文件` all present |
| Transport security | Exact-host TLS validates and HSTS is present |

Using external DNS-over-HTTPS, record apex A, full-subdomain CNAME, and
authoritative name servers. Stop if either public origin is unhealthy or its
provider target cannot be separated conclusively from `dashboard`.

### 4.4 Exact pause and recovery semantic gate

Do not guess the Vercel team identifier, API version, endpoint, or request
body. Immediately before execution, a read-only reviewer and the integrator
must resolve the current official or client-confirmed semantics and replace
the placeholders below in the sanitized execution receipt:

```text
Pause:   POST <provider-confirmed exact pause endpoint for project prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql and freshly resolved scope>
Unpause: POST <provider-confirmed exact unpause endpoint for project prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql and freshly resolved scope>
```

The semantic gate must prove that both POST operations:

- target exact project ID `prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql`;
- operate only the project's pause state;
- do not delete the project or a deployment;
- do not create a deployment or promotion;
- do not change a domain, alias, DNS record, environment setting, access
  policy, project name, or Git integration; and
- are exact inverses, so unpause restores availability of retained deployments
  without redeployment.

Record the sanitized HTTP method, path shape, API version, resolved scope
parameter name, and empty or minimal provider-required request-body shape.
Never record authorization material or a raw private response. If current
semantics cannot be proved, stop at `HOLD`; do not experiment on another
project and do not substitute deletion.

## 5. Plan

### 5.1 Selected shutdown strategy

The only selected path is reversible project pause:

1. freeze the exact `dashboard` identity, current pause state, complete
   dependency inventory, public-target baseline, and exact unpause path;
2. if active, send one provider-confirmed pause POST to exact project ID
   `prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql`;
3. verify `paused=true` from provider metadata before interpreting anonymous
   HTTP behavior;
4. verify every discovered `dashboard` production URL and alias using the
   classification rules in Section 8.2;
5. verify the apex, full subdomain, DNS, target deployment, and old rollback
   deployment remain unchanged; and
6. retain the exact unpause POST as the sole recovery operation.

No retry is automatic. A timed-out or ambiguous pause request requires fresh
read-only inspection before deciding whether it took effect. Repeating the
POST without resolving the current pause state is prohibited.

### 5.2 Rejected destructive strategy

Deleting `dashboard`, its deployments, aliases, settings, or history is not a
valid interpretation of "shutdown" in Epoch 7. Deletion adds no user value
once the project has no production dependency, removes recovery evidence, and
creates avoidable irreversible risk. No delete endpoint or destructive CLI
command belongs in the execution or rollback receipt.

## 6. Task sequence

### Task 0 — Freeze identity, dependencies, and recovery

Complete every Section 4 read. Bind exact project name and ID, current pause
state, complete domain/alias/deployment inventory, public-target independence,
and the current pause/unpause API pair. Preserve a sanitized evidence window.
Do not mutate external state until the recovery POST is independently proven.

### Task 1 — Execute the bounded pause

If and only if the project is currently active and all preflight gates pass,
send exactly one provider-confirmed pause POST to the exact project ID. Do not
send a delete, deploy, promote, alias, domain, DNS, environment, access-policy,
or Git operation.

If the request times out or returns an ambiguous response, stop and inspect the
exact project's pause state. Do not retry blindly.

### Task 2 — Verify provider shutdown and retention

Require `paused=true` for the exact project. Re-list the project, settings
metadata that can be inspected without environment values, complete domain and
alias sets, deployments, production deployment, and production URL. Prove that
the project and deployment history remain retained.

### Task 3 — Verify public controls and recovery readiness

Run the complete Section 8 matrix. Compare public route, asset, DNS, and target
deployment results with the frozen preflight. Confirm the old rollback
deployment is unchanged. Record the exact unpause POST, but do not execute it
unless rollback conditions are met.

### Task 4 — Record bounded evidence

Record the sanitized before/after project state, the exact operation shape,
the actual anonymous access classifications, unaffected public controls, and
independent status boundaries. Run the repository documentation gates and
leave the isolated worktree clean.

## 7. Execute

### 7.1 Final authorization gate

Immediately before mutation, the integrator must attest in the sanitized
receipt that Sections 4 through 6 are complete, the project is active, the
public production path is healthy and independent, and both current POST
shapes are frozen. An earlier inspection is invalid if any project, alias,
deployment, domain, API version, or authenticated-scope fact has changed.

### 7.2 Exact pause operation

The executable request remains intentionally unresolved in this plan:

```text
POST <provider-confirmed exact pause endpoint for project prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql and freshly resolved scope>
Body: <provider-confirmed empty or minimal pause body>
```

The integrator may replace these placeholders in the execution receipt only
after the read-only semantic gate passes. Send the resolved request once. Do
not add a delete flag, force option, alternate project name, deployment target,
domain, alias, or environment parameter.

If preflight reports `paused=true`, skip this operation. If the request result
is ambiguous, do not retry; proceed only with fresh exact-project reads.

### 7.3 Immediate fail-closed observation

After the pause request or already-paused no-op:

1. read exact project identity and pause state;
2. require `paused=true` before claiming shutdown;
3. confirm project and deployment inventory remains retained;
4. probe every discovered project origin without following redirects;
5. run the apex and full-subdomain no-drift controls; and
6. stop before any further mutation on the first mismatch.

If the wrong project is paused or a public control regresses causally, use only
the independently frozen exact unpause operation in Section 9. Do not attempt
to repair routing, deploy code, or change DNS inside this Epoch.

## 8. Verify

### 8.1 Provider state and retention gate

The provider gate passes only when:

- exact project name and ID still match;
- provider metadata reports `paused=true`;
- the project is not deleted, renamed, or transferred;
- all preflight deployments remain listed with the same IDs and historical
  metadata;
- the production deployment and production URL remain identifiable;
- ProjectDomain and custom-domain sets remain empty;
- alias inventory has not changed;
- settings remain retained, without reading environment values; and
- the exact provider-confirmed unpause POST remains valid.

A provider success message without a fresh `paused=true` read is insufficient.

### 8.2 Dashboard anonymous access classification

Probe every production URL and alias discovered in Section 4.2 with redirects
disabled and without cookies or authorization headers. Classify each actual
result independently:

| Observed result | Classification and evidence boundary |
| --- | --- |
| HTTP 503 with provider code `DEPLOYMENT_PAUSED` | Direct paused-deployment evidence for that exact origin |
| HTTP 302 to stable provider SSO | `AUTH-REDIRECT`; protection hides the application response, so provider `paused=true` remains primary |
| HTTP 404 or missing alias | `NOT_ROUTED`; proves no content at that origin, not by itself a pause-state proof |
| Any other status | `UNEXPECTED-HOLD`; preserve the exact sanitized status and investigate before completion |

Do not follow SSO, log in, obtain cookies, or convert an authenticated result
into anonymous shutdown proof. Do not include a nonce-bearing redirect target
or private response body in evidence.

### 8.3 Public production no-drift gate

Both `https://204421.xyz` and `https://full.204421.xyz` must match their fresh
preflight observations after the pause:

- root HTTP 307 and exact Fixture `Location`;
- both Fixture slash forms HTTP 200;
- public analytics probe HTTP 404;
- exact JavaScript and CSS paths, byte counts, and SHA-256 values;
- all four static JavaScript markers;
- valid exact-host TLS and HSTS;
- both custom domains still owned by and served from `h2-sentinel-full`;
- `dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU` still `Ready`, target
  `production`; and
- external DNS-over-HTTPS results and authoritative name servers unchanged.

The six hash URLs may be recorded as HTTP document transport only. Fragments
are not sent to the server and cannot establish visual or interaction quality.

### 8.4 Rollback-target and mutation-scope gate

- `dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf` remains retained and its state matches
  preflight;
- no project or deployment was deleted;
- no alias, domain, certificate, DNS record, environment setting, access
  policy, project name, or Git integration changed;
- no deployment, build, promotion, or source publication occurred;
- protected Git refs remain unchanged if they are included in the integrator's
  evidence scope; and
- the only external before/after difference is the exact `dashboard` pause
  state.

### 8.5 Repository gate

- the plan-author changed-path list contains only this plan;
- any later evidence task changes only its explicitly authorized evidence
  files;
- `git diff --check` passes; and
- the final isolated worktree is clean with no untracked deliverable.

## 9. Rollback and recovery

Rollback means unpausing the same retained project. It does not mean restoring
from Git, redeploying, promoting, relinking domains, changing DNS, or creating
a replacement project.

Before recovery, freshly verify:

1. exact project name and ID;
2. `paused=true` for that project;
3. complete domain and alias inventory;
4. retained production deployment and production URL;
5. exact current unpause POST semantics and freshly resolved scope; and
6. continued health and independence of the apex and full-subdomain production
   path.

Then send exactly the provider-confirmed unpause POST frozen by Section 4.4.
Recovery passes only when provider metadata reports `paused=false`, retained
deployments require no new build or deployment, and the project's pre-pause
production access classification is restored as far as provider protection and
its retained aliases permit.

Rollback is mandatory if the wrong project was paused, either public domain or
target deployment regresses, an undisclosed shared dependency is discovered,
or the pause affects a resource outside the exact project. If exact unpause
semantics or project identity cannot be proved, stop at `HOLD` and preserve the
measured state; do not broaden mutations.

## 10. Stop conditions

Stop without mutation, or stop before any retry, when any of the following is
true:

- `dashboard` does not resolve to exact project ID
  `prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql`;
- the project has a custom domain, ProjectDomain, apex/full alias, wildcard, or
  other unresolved shared routing dependency;
- a `dashboard` deployment or alias is required by `h2-sentinel-full`,
  `204421.xyz`, or `full.204421.xyz`;
- `dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU` is not `Ready` or either public domain
  fails its preflight route, artifact, TLS, HSTS, or DNS gate;
- the old rollback deployment cannot be proven retained;
- current pause and unpause POST semantics cannot be independently proven as
  exact inverses limited to pause state;
- an operation requires guessing a team ID, API version, project, alias, or
  domain target;
- the proposed operation contains a delete, deploy, promotion, domain, alias,
  DNS, environment, access-policy, or Git mutation;
- the provider reports an ambiguous result and a fresh pause-state read cannot
  resolve it;
- authentication requires reading or exporting a credential, `.env`, token,
  cookie, or private response; or
- observed state conflicts across provider reads, DNS, or public HTTP and the
  conflict cannot be reconciled safely.

## 11. Risks and controls

| Risk | User impact | Control |
| --- | --- | --- |
| Wrong project is paused | An unrelated production service becomes unavailable | Bind exact name and immutable project ID before both pause and unpause; require post-operation identity and pause-state reads |
| Hidden shared alias or routing dependency | The public H2 site or another service becomes unavailable | Enumerate ProjectDomains and all aliases/deployments; prove apex and full ownership and traffic independently before mutation |
| Destructive deletion is mistaken for shutdown | Project history, settings, and recovery path are lost | Authorize pause only; reject every delete operation; verify project and deployments remain present |
| Pause API semantics drift | A current client call mutates broader state or cannot be reversed | Resolve current official/client-confirmed POST shapes at preflight; do not guess endpoint, API version, body, or scope |
| Pause request times out after taking effect | A blind retry creates an ambiguous operation trail | Never retry automatically; read the exact project's current pause state first |
| HTTP response is misinterpreted | SSO, a missing alias, or unrelated 503 is claimed as shutdown proof | Use provider `paused=true` as primary evidence and classify each anonymous origin separately |
| Public target regresses during the window | Users lose access to the default or fallback H2 site | Capture before/after routes, hashes, DNS/TLS, domains, and exact target deployment; unpause on demonstrated causal regression |
| Recovery accidentally redeploys old code | History changes or a different artifact becomes public | Recovery is exact project unpause only; no deploy, promotion, alias, domain, or DNS command |
| Environment or credential material leaks | Secrets enter logs or repository history | Never query environment values or private auth material; keep receipts sanitized and omit nonce-bearing redirects |
| Static transport evidence is overstated | Delivery is reported as visually verified or officially accepted | Preserve independent visual, organizer, score, and archive statuses as `UNKNOWN-HOLD` |

## 12. Independent status boundaries

| Decision | Epoch 7 policy |
| --- | --- |
| `dashboard` project shutdown | May become `GO` only after exact provider `paused=true`, retained resources, actual origin classifications, public no-drift gates, and exact unpause readiness pass |
| Static Fixture production default | Preserve `GO` only if apex/full provider, HTTP, asset, DNS, and TLS controls remain unchanged |
| Live/Local analytics | Preserve `NOT_EXPOSED`; public API remains 404 and CSV analytics remains literal-loopback-only |
| Visual and interaction verification | Preserve `UNKNOWN-HOLD`; CLI, HTTP, hashes, DNS, and provider metadata are not browser evidence |
| Organizer submission/receipt/acceptance | Preserve `UNKNOWN-HOLD`; Epoch 7 performs no organizer action |
| Official score | Preserve `UNKNOWN-HOLD`; Fixture and technical outputs are not an official score |
| Final submission archive | Preserve `UNKNOWN-HOLD`; no organizer archive is created or verified |

The user prohibited computer control. Epoch 7 uses file, CLI, provider
metadata, anonymous HTTP, DNS, TLS, and hash evidence only. It does not drive a
browser or claim visual quality.

## 13. Final evidence receipt requirements

The integrator's Epoch 7 receipt must contain:

1. operation time window and authenticated scope identity without secret
   material;
2. exact project name, project ID, and pause state before and after;
3. complete preflight and post-pause ProjectDomain, custom-domain, alias,
   deployment, production deployment, and production URL inventories;
4. proof that no `dashboard` resource is a dependency of `204421.xyz`,
   `full.204421.xyz`, or `h2-sentinel-full`;
5. the provider-confirmed sanitized pause and unpause POST shapes, including
   method, API path/version, resolved scope parameter name, and minimal body
   shape;
6. the exact pause result or an already-paused no-op result, followed by fresh
   `paused=true` provider proof;
7. every discovered `dashboard` origin's anonymous status and truthful access
   classification;
8. before/after apex and full route, artifact, TLS/HSTS, provider-domain, and
   external DNS evidence;
9. unchanged identities and states for the qualified full deployment and old
   rollback deployment;
10. confirmation that project, deployments, settings, and history remain
    retained and recoverable without redeployment;
11. confirmation that no deletion, environment read/change, DNS, alias,
    domain, access-policy, deployment, promotion, source, or protected-ref
    mutation occurred;
12. rollback decision and exact unpause readiness;
13. changed-path, `git diff --check`, clean-worktree, and untracked-file
    results; and
14. the independent decision matrix with shutdown separated from static
    delivery, Live analytics, visual quality, organizer acceptance, score, and
    archive claims.

The receipt must not contain credentials, tokens, cookies, environment values,
private response bodies, raw authentication headers, nonce-bearing SSO
locations, or unsupported claims. Expected HTTP 503 behavior must remain
clearly separate from the actual measured result.
