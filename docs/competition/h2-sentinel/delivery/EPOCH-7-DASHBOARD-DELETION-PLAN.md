# H2 Sentinel Epoch 7 Dashboard Permanent Deletion Plan

## 1. Authorization and exact scope

On 2026-08-24, the user explicitly authorized permanent deletion of exactly:

```text
Project: dashboard
Project ID: prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql
```

This authorization supersedes the earlier Epoch 7 deletion prohibition only
for this immutable project ID and one deletion attempt. The plan-author task
creates and commits this file only. It performs no provider mutation or push.

The authorized operation is:

```text
DELETE /v9/projects/prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql?teamId=<fresh-exact-team-id>
Body: none
Attempt limit: 1
```

Current official Vercel semantics and the exact account scope must be
reconfirmed immediately before execution. The project ID, not the display
name, must be used. Interactive deletion, `vercel remove dashboard`, a
private dashboard endpoint, or any separate deployment deletion is prohibited.

## 2. Accepted irreversible impact

Vercel documents that project deletion also deletes the deployments, domains,
environment variables, and settings within that project. The
authorization-time inventory records **24 deployments**. The user therefore
accepts permanent deletion of:

- project `dashboard` and its immutable ID;
- all 24 deployments and their provider history;
- every project-owned alias and ProjectDomain association;
- project settings, build/production history, protection configuration, and
  the Vercel-side Git integration link; and
- every project-scoped environment configuration and stored value.

No environment endpoint or broad project payload may be read. Environment
names, IDs, values, ciphertext, tokens, cookies, and credentials must not be
exported, printed, copied, compared, or persisted.

Deleting the Vercel project does not delete the external Git repository,
commits, branches, tags, pull requests, or protected refs. No recovery is
assumed. Recreating a project with the same name would not restore the project
ID, deployments, aliases, settings, or environment configuration.

## 3. Recorded baseline, not current proof

The earlier reversible pause attempt sent:

```text
POST /v1/projects/prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql/pause
HTTP 400; client exit code 1
Active production deployment does not exist
```

It caused no mutation. The same deployment and aliases remained, and all three
recorded `dashboard` origins still returned HTTP 200 at `/login`. The pause
result remains `UNKNOWN-HOLD`; it is neither shutdown nor deletion proof.

The last narrow inventory also recorded:

- two provider-owned aliases targeting
  `dpl_5qSx6duyyumiPz1iktqgdou9KhnT`;
- immutable URL `dashboard-4gdp8qvoe-dwwww.vercel.app`;
- empty `dashboard` ProjectDomain and custom-domain sets; and
- no `dashboard` dependency for `204421.xyz` or
  `full.204421.xyz`.

Both H2 public domains were independently owned and served by:

```text
Project: h2-sentinel-full
Project ID: prj_KvPLDryNckM3lSaHVDG3YeMJyiCj
Deployment: dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU
```

All counts, IDs, aliases, domains, routes, hashes, and Git refs must be freshly
frozen; cached receipts are context only.

## 4. Mandatory pre-delete freeze

Use narrow, minimum-field provider reads in one bounded window. Freeze:

1. exact project name, ID, owning team ID, existence, and transfer/deletion
   state;
2. exactly 24 unique deployment IDs, their bounded identity metadata, and a
   digest of the sorted ID set;
3. the complete alias set and a digest of the sorted aliases;
4. empty ProjectDomain/custom-domain sets and absence of any wildcard or H2
   hostname;
5. current official no-body `DELETE /v9/projects/{idOrName}` semantics; and
6. the external Git repository identity, without changing Git state.

If the deployment count is not exactly 24, pagination is incomplete, or any
identity/dependency differs, stop and obtain fresh authorization for the newly
observed impact.

Do not inventory project environment configuration. Its permanent deletion is
already accepted without reading its records or values.

### 4.1 Main/full public no-drift freeze

Treat `https://204421.xyz` as the main production origin and
`https://full.204421.xyz` as the full fallback origin. Freeze these
anonymous, redirect-disabled controls for both:

| Control | Required fresh result |
| --- | --- |
| Owner | `h2-sentinel-full` / `prj_KvPLDryNckM3lSaHVDG3YeMJyiCj` |
| Deployment | `dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU`, `Ready`, `production` |
| `/` | HTTP 307; `Location: /h2-sentinel/?mode=fixture` |
| Both Fixture slash forms | HTTP 200 HTML |
| `/api/v1/h2-sentinel/mode` | HTTP 404 |
| JavaScript | 935,880 bytes; SHA-256 `02ccb27f97ce0bc6098307e8ed8506577699a83ec5088ebed1a7b4b41610066d` |
| CSS | 49,826 bytes; SHA-256 `6ec8757d71b6518408ac83a8a0ddb4a8bdc1e3c0a4c41a7572ee404561a169b2` |
| Security | Exact-host TLS valid; HSTS present |

Also freeze apex A, full-subdomain CNAME, and authoritative name servers using
external DNS-over-HTTPS. Stop if either origin is unhealthy or cannot be
proven independent from `dashboard`.

### 4.2 Protected refs

Read, without fetching or updating, the live remote values of:

```text
refs/heads/main
refs/heads/competition/h2-sentinel
```

Earlier evidence recorded `7889feb274dac77753fdd323df352c9c1335aebf`
and `39a599285cbd39b2575564d5dc79d078964c5bd7`, respectively.
These SHAs are not current proof. Freeze fresh pre-delete values and require
exact equality afterward. An unexpected difference is `HOLD`, not authority
to repair a ref.

## 5. Execution

Immediately before mutation, the sanitized receipt must show:

- user authorization date `2026-08-24`;
- exact project name, ID, and team scope;
- deployment count `24` and deployment-set digest;
- alias count/digest and empty domain sets;
- accepted deletion of settings and environment configuration without value
  access;
- passing main/full and protected-ref baselines; and
- `attempt 1 of 1` and `no rollback`.

Then send exactly one provider-confirmed no-body DELETE to the immutable
project ID. Record only method, sanitized path, timestamp, HTTP status,
non-sensitive provider request ID, and bounded error code.

After the first send, the mutation budget is exhausted regardless of result.
For any error, timeout, connection loss, malformed response, or ambiguous
completion:

1. send no retry and no compensating mutation;
2. perform only the read-only checks in Section 6;
3. if the project remains, classify deletion as `UNKNOWN-HOLD`; and
4. if the project is absent, require every post-delete gate before `GO`.

A later retry requires a new plan and new explicit authorization.

## 6. Post-delete acceptance

Permanent deletion is `GO` only when all checks pass:

- exact-ID lookup returns the documented not-found result and a complete
  project list contains no matching ID;
- all 24 frozen deployment IDs return the documented deleted/not-found state;
- every frozen alias no longer maps to a retained `dashboard` deployment;
- repeated read-only checks agree after the bounded consistency window;
- every main/full provider, route, redirect, API, asset, TLS, HSTS, and DNS
  value exactly matches the fresh pre-delete baseline;
- `h2-sentinel-full` and
  `dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU` remain unchanged;
- both protected remote refs exactly match their fresh pre-delete SHAs;
- the external Git repository remains present; and
- no separate deployment, promotion, alias, domain, DNS, certificate,
  environment, access-policy, billing, source, or Git mutation occurred.

A successful DELETE response alone is insufficient. Project 404 alone is
insufficient. An alias 404/410 alone is transport evidence, not project
deletion proof. If any frozen deployment remains active or an alias still
serves the application, record `UNKNOWN-HOLD`; do not delete it separately.

There is no rollback. If deletion succeeds but an H2 or Git control fails,
record `POST_DELETE_HOLD` and perform no repair under this authorization.
If deletion fails and the project remains, do not retry, pause, rename, remove
aliases, or simulate deletion by changing routes.

## 7. Evidence boundaries

The final receipt must record:

1. authorization, time window, exact target/scope, and pre-delete inventories;
2. one sanitized DELETE, labeled `attempt 1 of 1`;
3. exact project absence plus all 24 deployment and alias results;
4. before/after main/full routes, artifacts, provider owner, DNS/TLS, and HSTS;
5. before/after protected refs and external repository existence;
6. explicit `no retry`, `no rollback`, and mutation-scope attestations; and
7. independent statuses for deletion, static Fixture delivery, visual
   verification, organizer acceptance, official score, and final archive.

HTTP and hashes establish static transport only, not rendered interaction.
Deletion does not prove organizer submission, receipt, acceptance, score, or
archive status. Those outcomes remain `UNKNOWN-HOLD`; Live/Local analytics
remains `NOT_EXPOSED`.

The receipt must not contain credentials, tokens, cookies, authentication
headers, environment metadata or values, provider ciphertext, raw private
responses, nonce-bearing SSO locations, or unsupported recovery claims.

## 8. Documentation gate

The plan-author commit may change only this file. Run `git diff --check`,
commit exactly as `docs(h2): authorize dashboard project deletion`, and do
not push. `MEMORY.md` remains unchanged because this task's allowlist is one
file; durable measured deletion outcome belongs to a later authorized receipt.
