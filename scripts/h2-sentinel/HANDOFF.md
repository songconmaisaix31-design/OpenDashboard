# H2 Sentinel Epoch 4 and Epoch 5 Production Handoff

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
- Attempt-6 `submission.csv` SHA-256:
  `af8814d3e428ef1470a43e0a07d4d6dcdc79585846841a15778fff8c91d60326`.
- Final submission package/archive identity: `UNKNOWN-HOLD`; no final
  package/archive hash is recorded.

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
The recorded deployment origins and identities were:

- Vercel deployment origin (protected/authenticated, not classified as public):
  `https://h2-sentinel-hxrbu0wan-dwwww.vercel.app`
- Custom deployment origin: `https://204421.xyz`

The custom domain `https://204421.xyz` was checked by direct navigation for the
complete eight-route matrix below. Each request returned HTTP 200 with the H2
SPA shell. The HTML itself did not contain H2 text; the marker evidence comes
from the same-origin JavaScript asset `/assets/index-C2wmhv_n.js`, which
returned HTTP 200 with 935592 bytes and contained both `H2 Sentinel` and `氢哨`.
Direct Vercel root/Fixture requests returned 302 SSO redirects and remain
`AUTH-REDIRECT/UNKNOWN-HOLD`; they have no recorded direct H2-shell evidence.
A 200 obtained only after following SSO is not counted as an H2 shell result.

The checks included direct navigation (not only navigation from the root):

```text
/
/?mode=fixture
/h2-sentinel?mode=fixture
/h2-sentinel/?mode=fixture
/h2-sentinel?mode=local
/h2-sentinel/?mode=local
/h2-sentinel?mode=invalid
/h2-sentinel/?mode=invalid
```

This proves static hosting and deep-link fallback for the custom domain only.
No GUI or visual verification was performed for this production deployment.
The public site serves the static Fixture shell; it cannot run loopback
analytics on an evaluator's machine without the local launcher.

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

# Inspect every remote deep link without following redirects. Extract only
# same-origin /assets/*.js paths from HTML, then fetch each asset explicitly.
# Record status, redirect target, observed/final origin, asset bytes, and JS
# markers from the fetched asset body.
$routes = @(
  "/",
  "/?mode=fixture",
  "/h2-sentinel?mode=fixture",
  "/h2-sentinel/?mode=fixture",
  "/h2-sentinel?mode=local",
  "/h2-sentinel/?mode=local",
  "/h2-sentinel?mode=invalid",
  "/h2-sentinel/?mode=invalid"
)
$origins = @(
  "https://204421.xyz",
  "https://h2-sentinel-hxrbu0wan-dwwww.vercel.app"
)
$handler = [System.Net.Http.HttpClientHandler]::new()
$handler.AllowAutoRedirect = $false
$client = [System.Net.Http.HttpClient]::new($handler)
$routeResults = @()
$assetResults = @()
foreach ($origin in $origins) {
  foreach ($route in $routes) {
    $requestedUri = [Uri]::new("$origin$route")
    $response = $client.GetAsync($requestedUri).GetAwaiter().GetResult()
    $body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    $assetMatches = [regex]::Matches($body, '/assets/[^"''\s]+\.js')
    $assetPaths = @($assetMatches | ForEach-Object { $_.Value } | Select-Object -Unique)
    $routeResults += [pscustomobject]@{
      RequestedUri = $requestedUri.AbsoluteUri
      Status = [int]$response.StatusCode
      RedirectDisabled = $true
      Location = if ($response.Headers.Location) { $response.Headers.Location.AbsoluteUri } else { $null }
      FinalOrigin = if ($response.IsSuccessStatusCode) { $response.RequestMessage.RequestUri.GetLeftPart([UriPartial]::Authority) } else { "NOT_FOLLOWED" }
      FinalOriginVerified = $response.IsSuccessStatusCode -and ($response.RequestMessage.RequestUri.GetLeftPart([UriPartial]::Authority) -eq $origin)
      HtmlAssetPaths = $assetPaths -join ","
    }
    $response.Dispose()
    foreach ($assetPath in $assetPaths) {
      $assetUri = [Uri]::new("$origin$assetPath")
      $assetResponse = $client.GetAsync($assetUri).GetAwaiter().GetResult()
      $assetBytes = $assetResponse.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
      $assetBody = [System.Text.Encoding]::UTF8.GetString($assetBytes)
      $assetResults += [pscustomobject]@{
        RequestedUri = $assetUri.AbsoluteUri
        Status = [int]$assetResponse.StatusCode
        Bytes = $assetBytes.Length
        RedirectDisabled = $true
        Location = if ($assetResponse.Headers.Location) { $assetResponse.Headers.Location.AbsoluteUri } else { $null }
        FinalOrigin = if ($assetResponse.IsSuccessStatusCode) { $assetResponse.RequestMessage.RequestUri.GetLeftPart([UriPartial]::Authority) } else { "NOT_FOLLOWED" }
        FinalOriginVerified = $assetResponse.IsSuccessStatusCode -and ($assetResponse.RequestMessage.RequestUri.GetLeftPart([UriPartial]::Authority) -eq $origin)
        H2SentinelMarker = $assetBody -match 'H2 Sentinel'
        ChineseMarker = $assetBody -match '氢哨'
      }
      $assetResponse.Dispose()
    }
  }
}
$routeResults
$assetResults
$client.Dispose()
```

The command records an un-followed `Location` instead of silently converting
an auth redirect into a pass. A route is a hosting-shell pass only when its
status, final origin, same-origin asset path, fetched asset status/bytes, and
both JavaScript markers are verified. It does not treat HTML text as the H2
marker source.
The commands above are reproduction instructions, not evidence that an
evaluator can access local analytics. Local mode is loopback-only and requires
the launcher and analytics service on that evaluator machine.

## Independent status boundaries

| Decision | Status | Evidence boundary |
| --- | --- | --- |
| Technical executable evidence | BASE TECHNICAL EVIDENCE RECORDED | Base SHA `58090bc` has the named CI and attempt-6 evidence; final post-document gates and fresh CI remain pending. |
| Registration/submission | UNKNOWN-HOLD | No organizer form or submission-action evidence is recorded here. |
| Receipt/acceptance | UNKNOWN-HOLD | No organizer receipt or acceptance evidence is recorded here. |
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

## Epoch 5 full-Fixture delivery receipt

Epoch 5 added a second, isolated public presentation of the complete H2
Sentinel six-page deterministic Fixture experience. It did not replace or
promote the existing `h2-sentinel` project, expose the loopback analytics
sidecar, or change the Epoch 4 organizer-evidence boundary.

### Source and project identity

- Frozen base:
  `39a599285cbd39b2575564d5dc79d078964c5bd7`.
- Plan commits, in order: `c77a0b0cb659bc922588b0415978e92f1470530e`,
  `0d1183e6c3dbf4cae8521d8a3d23c53b16b052bc`, and
  `b88472de32c67293cbd6e79f01ef614f063f0bee`.
- Implementation commits, in order:
  `4a9bdbbc911ccd96390d3ff31c2d4237bca95139` and
  `f546a6aedaefa66f5634b20008a20cab41db26ed`.
- Deployed implementation candidate:
  `f546a6aedaefa66f5634b20008a20cab41db26ed`.
- Isolated branch: `songconmaisaix31-design/h2-full-deploy-e5`.
- Vercel project: `h2-sentinel-full`, project ID
  `prj_KvPLDryNckM3lSaHVDG3YeMJyiCj`.
- Qualified and promoted production deployment:
  `dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU` at
  `https://h2-sentinel-full-87jzhi1zh-dwwww.vercel.app`, state `Ready`.

The exact publication sequence was one staged `vercel --prod --skip-domain`
deployment in the independently verified new-project context, authenticated
pre-binding qualification, configuration of the sole custom domain
`full.204421.xyz`, and exactly one `vercel promote <deployment>` targeting that
qualified deployment. There was no second promotion, separate alias command,
existing-project production command, or apex-domain mutation. The provider's
default `h2-sentinel-full.vercel.app` hostname is not counted as a custom
domain.

Both the generated deployment hostname and the provider default hostname
returned an un-followed anonymous HTTP 302 under Standard Protection. They are
`AUTH-REDIRECT`, not anonymous-public proof. Their stable classification is
recorded without a nonce-bearing SSO target or authentication material.

### Anonymous public result

`https://full.204421.xyz/` is anonymously reachable over valid TLS and returns
HTTP 307 with the exact relative `Location` value
`/h2-sentinel/?mode=fixture`. HSTS is present. Both
`/h2-sentinel?mode=fixture` and `/h2-sentinel/?mode=fixture` return HTTP 200
HTML. The overview, events, diagnosis, analysis, assistant, and reports hash
URLs each return the same HTTP 200 document transport; fragments are not sent
to the server, so this does not prove rendered navigation or interaction.

`/api/v1/h2-sentinel/mode` returns HTTP 404. The public product is the complete
six-page deterministic Fixture and exposes no public analytics API, Python
sidecar, remote Local mode, or public CSV processing.

The final DNS state is host `full`, CNAME
`063cc3c97d7335db.vercel-dns-017.com`, TTL 600. Vercel reported the domain as
configured correctly, verified, CNAME-configured, and free of issues or
conflicts. External DNS-over-HTTPS agreed. The exact provider DNS record ID for
bounded rollback inspection is `2091551737541830656`; it is not a credential.

### Artifact binding

The local build, authenticated pre-binding fetch, and anonymous custom-domain
fetch matched byte-for-byte:

| Asset | Bytes | SHA-256 |
| --- | ---: | --- |
| `/assets/index-CG2awVBj.js` | 935880 | `02ccb27f97ce0bc6098307e8ed8506577699a83ec5088ebed1a7b4b41610066d` |
| `/assets/index-DPHGouYO.css` | 49826 | `6ec8757d71b6518408ac83a8a0ddb4a8bdc1e3c0a4c41a7572ee404561a169b2` |

The JavaScript asset contains `H2 Sentinel`, `氢哨`, `演示数据 Fixture`, and
`不接收或上传用户文件`. The hash and marker evidence binds the static
artifact; it is not visual or interactive proof.

### Unchanged controls

The existing `https://204421.xyz` control remained on deployment
`dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf`. Its recorded HTML routes remained HTTP
200, `/api/v1/h2-sentinel/mode` remained HTTP 404, apex DNS remained A
`216.198.79.1`, JavaScript remained 935592 bytes with SHA-256
`b26ab9a88167f6b587732d52a4ae9461d8d2edfa4b17847e3f815ec81ef6d4b6`,
and CSS remained 49826 bytes with SHA-256
`6ec8757d71b6518408ac83a8a0ddb4a8bdc1e3c0a4c41a7572ee404561a169b2`.

Live remote protected refs also remained unchanged:

- `refs/heads/main` at
  `7889feb274dac77753fdd323df352c9c1335aebf`;
- `refs/heads/competition/h2-sentinel` at
  `39a599285cbd39b2575564d5dc79d078964c5bd7`.

### Candidate verification

The candidate passed `npm ci`, strict type checking, the production build,
`npm run check`, 110/110 repository tests, 78/78 H2 tests, 39/39 contract tests,
5/5 QA groups, 5/5 assembled QA groups, 13/13 launcher tests, 9/9 launcher
smoke scenarios, `uv lock --check`, locked dev-environment sync, and 50/50
Python tests. A process-scoped production dependency audit against the official
npm registry reported zero vulnerabilities. `git diff --check` and the Epoch 5
path/ref controls passed on the implementation candidate.

Recorded exceptions and residual warnings are:

- the first `npm run h2:check` attempt had a transient Local readiness failure;
  no code changed, a dedicated-port launcher run released both ports, and the
  full command then passed;
- npmmirror's audit endpoint returned HTTP 404; the official-registry rerun
  reported zero production vulnerabilities;
- local `vercel build` returned `project_settings_required` because environment
  pull was prohibited; the cloud build and production deployment passed;
- `vercel link` created `.env.local` and modified `.gitignore`; `.env.local`
  was deleted without being read, `.gitignore` was restored, and no environment
  value was persisted;
- Vite retains its greater-than-500-kB JavaScript bundle warning; and
- the Python tests retain one upstream Starlette/httpx deprecation warning.

### Epoch 5 decision matrix

| Decision | Status | Evidence boundary |
| --- | --- | --- |
| Static Fixture delivery | `GO` | Isolated project, staged qualification, sole-domain gate, one promotion, anonymous HTTP, DNS/TLS, artifact identity, unchanged controls, and candidate gates passed. |
| Live/Local analytics | `NOT_EXPOSED` | Local CSV analytics remains literal-loopback-only; the public endpoint is a 404 and no public sidecar exists. |
| Visual verification | `UNKNOWN-HOLD` | No browser control, screenshot, desktop/mobile render, or interaction verification was performed. |
| Registration/submission | `UNKNOWN-HOLD` | No organizer action evidence is recorded. |
| Receipt/acceptance | `UNKNOWN-HOLD` | No organizer receipt or acceptance evidence is recorded. |
| Official score | `UNKNOWN-HOLD` | Fixture and technical results are not an official score. |
| Final submission archive | `UNKNOWN-HOLD` | No final organizer archive identity is established. |

Rollback is limited to the exact `full.204421.xyz` binding and its exact DNS
record after fresh inspection. It does not authorize a second promotion,
deletion, apex/wildcard mutation, protected-ref movement, or history rewrite.

## Epoch 6 apex production-default handoff

Epoch 6 made the existing qualified full Fixture deployment the default at
`https://204421.xyz`. The operation window was 2026-08-24, and the final HTTP
receipt ran from 00:15:13 through 00:16:17 `+08:00`. The accepted plan commits
were `2bf604fb5efb2439552d57702675551b620e8205` and
`78e966f6d839ef7dce7416c7c77132b29409826a`.

### Preflight and selected migration

Fresh provider inspection separated three roles:

- ProjectDomain owner: `dashboard`, project ID
  `prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql`, owned exact `204421.xyz`;
- old alias traffic target: `h2-sentinel`, project ID
  `prj_6pRMaPgh3YXvgibdHBYnM9RoysUQ`, had no custom domain and served the apex
  from `Ready` production `dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf` at
  `h2-sentinel-hxrbu0wan-dwwww.vercel.app`; and
- target owner and traffic target: `h2-sentinel-full`, project ID
  `prj_KvPLDryNckM3lSaHVDG3YeMJyiCj`, with `Ready` production
  `dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU` at
  `h2-sentinel-full-87jzhi1zh-dwwww.vercel.app`.

The apex before-state was HTTP 200 and JavaScript
`/assets/index-C2wmhv_n.js`, 935592 bytes, SHA-256
`b26ab9a88167f6b587732d52a4ae9461d8d2edfa4b17847e3f815ec81ef6d4b6`.
The full subdomain already had the HTTP 307 Fixture entry and qualified full
asset identities.

Vercel CLI `56.3.1` proved that `domains add --force` uses a sequential,
non-atomic exact-domain DELETE then POST with target `PRODUCTION`. Path A put
the qualified deployment on the alias before that metadata interval.

Stage 1 ran successfully:

```text
vercel alias set h2-sentinel-full-87jzhi1zh-dwwww.vercel.app 204421.xyz --scope dwwww --non-interactive
```

While `dashboard` still owned the ProjectDomain, the immediate gate proved the
apex root 307 and exact Fixture `Location`, both Fixture routes 200, API 404,
full JavaScript/CSS identities and four static markers, HSTS, valid TLS, and
unchanged DNS.

Stage 2 then ran successfully:

```text
vercel domains add 204421.xyz h2-sentinel-full --force --scope dwwww --non-interactive
```

The sanitized result showed removal of exact `204421.xyz` from
`prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql`, then addition to
`h2-sentinel-full`. No new deployment or promotion occurred, and DNS was not
changed.

### Final provider and public result

Final ProjectDomain listings were:

- `dashboard`: empty;
- `h2-sentinel`: only platform hostname `h2-sentinel.vercel.app`;
- `h2-sentinel-full`: `204421.xyz`, `full.204421.xyz`, and platform hostname
  `h2-sentinel-full.vercel.app`.

The three target-project entries were verified with no redirect or branch
binding. Both custom domains were `configured_correctly`, attached and
verified, with no issue or conflict. Both inspected to
`dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU`, `Ready`, target `production`. The old
`dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf` remained `Ready`, target `production`.
Protection was observed as `all_except_custom_domains`, with
`gitForkProtection=true`.

Both `https://204421.xyz` and `https://full.204421.xyz` returned:

| Probe | Measured result |
| --- | --- |
| `/` | HTTP 307; exact `Location: /h2-sentinel/?mode=fixture` |
| `/h2-sentinel?mode=fixture` | HTTP 200 HTML, 528 bytes |
| `/h2-sentinel/?mode=fixture` | HTTP 200 HTML, 528 bytes |
| `/api/v1/h2-sentinel/mode` | HTTP 404, 79 bytes |
| `/assets/index-CG2awVBj.js` | 935880 bytes; SHA-256 `02ccb27f97ce0bc6098307e8ed8506577699a83ec5088ebed1a7b4b41610066d` |
| `/assets/index-DPHGouYO.css` | 49826 bytes; SHA-256 `6ec8757d71b6518408ac83a8a0ddb4a8bdc1e3c0a4c41a7572ee404561a169b2` |
| Static markers | `H2 Sentinel`, `氢哨`, `演示数据 Fixture`, and `不接收或上传用户文件`: all present |
| Transport security | Exact-host TLS valid; HSTS present |

All six hash URLs returned HTTP 200 document transport on both origins. This
does not prove client-side navigation, rendering, or interaction. The old
JavaScript identity no longer served at the apex; the full subdomain remained
unchanged.

External DNS-over-HTTPS remained apex A `216.198.79.1`, full CNAME
`063cc3c97d7335db.vercel-dns-017.com`, and authoritative name servers
`dns31.hichina.com` / `dns32.hichina.com`. Resolver TTL variation was cache
behavior, not configuration drift.

Fresh Epoch 6 hostname observations, which do not rewrite Epoch 5 history,
were:

- both immutable old and new automatic URLs: HTTP 302 `AUTH-REDIRECT`;
- `h2-sentinel.vercel.app`: HTTP 200 `DIRECT`;
- `h2-sentinel-full.vercel.app`: HTTP 307 `DIRECT-APP-REDIRECT`.

These classifications are drift-prone and require fresh verification.

### Controls, security, and rollback

The live remote refs remained:

- `refs/heads/main` at
  `7889feb274dac77753fdd323df352c9c1335aebf`;
- `refs/heads/competition/h2-sentinel` at
  `39a599285cbd39b2575564d5dc79d078964c5bd7`;
- `refs/heads/songconmaisaix31-design/h2-full-deploy-e5` at
  `da5ae929e67168a57dc4f7229bcee47e8047049f`.

Environment values were deliberately not queried. The exact alias and domain
commands do not operate environment settings, and no environment-related
change was visible in inspected project/domain metadata; environment values
were not independently verified. No credential or environment value was read
or persisted, and `.env.local` was absent.

Rollback was ready but not required. Immediate traffic rollback is:

```text
vercel alias set h2-sentinel-hxrbu0wan-dwwww.vercel.app 204421.xyz --scope dwwww --non-interactive
```

After fresh inspection, complete restoration is old alias, exact ProjectDomain
transfer back to `dashboard`, then old alias again:

```text
vercel alias set h2-sentinel-hxrbu0wan-dwwww.vercel.app 204421.xyz --scope dwwww --non-interactive
vercel domains add 204421.xyz dashboard --force --scope dwwww --non-interactive
vercel alias set h2-sentinel-hxrbu0wan-dwwww.vercel.app 204421.xyz --scope dwwww --non-interactive
```

Rollback is exact-apex-only and leaves DNS and `full.204421.xyz` untouched.

### Epoch 6 decision matrix

| Decision | Status | Evidence boundary |
| --- | --- | --- |
| Static Fixture production default | `GO` | Path A, stage gate, final provider identity, anonymous apex/full transport, artifact hashes, DNS/TLS, refs, and rollback readiness passed. |
| Live/Local analytics | `NOT_EXPOSED` | Public API is 404; CSV analytics remains literal-loopback-only. |
| Visual and interaction verification | `UNKNOWN-HOLD` | The user prohibited browser/computer control; CLI, HTTP, hashes, DNS, and TLS are not visual evidence. |
| Registration/submission | `UNKNOWN-HOLD` | No organizer action evidence exists. |
| Receipt/acceptance | `UNKNOWN-HOLD` | No organizer receipt or acceptance evidence exists. |
| Official score | `UNKNOWN-HOLD` | Fixture and technical metrics are not an official score. |
| Final submission archive | `UNKNOWN-HOLD` | No final organizer archive identity is established. |

## Epoch 7 dashboard shutdown HOLD handoff

Epoch 7 attempted a reversible pause of exact Vercel project `dashboard`
(`prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql`). It did not authorize project deletion or
any replacement routing mutation.

### Attempt result and current state

The narrow live alias registry bound the project's two provider-owned
`*.vercel.app` aliases to deployment
`dpl_5qSx6duyyumiPz1iktqgdou9KhnT`. The same deployment retained immutable URL
`dashboard-4gdp8qvoe-dwwww.vercel.app`. The ProjectDomain list was empty, and
no custom alias connected this project to `204421.xyz` or
`full.204421.xyz`.

One exact pause request ran:

```text
POST /v1/projects/prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql/pause
HTTP 400; client exit code 1
Active production deployment does not exist
```

The request caused no mutation. Fresh checks found the same two aliases,
immutable deployment URL, and deployment relationships. All three origins
still returned HTTP 200 at `/login`. `dashboard` therefore remains active and
its shutdown status is `UNKNOWN-HOLD`, not `GO`.

The provider control state conflicts with the live registry: the application
is served from an existing deployment, but the pause operation cannot find an
active production deployment. Vercel support or control-plane repair is the
next prerequisite. After it is repaired, repeat a fresh narrow preflight and
retry only the exact pause POST. Do not retry blindly.

### Unchanged public production and prohibited substitutes

`204421.xyz` and `full.204421.xyz` remained on `h2-sentinel-full` project
`prj_KvPLDryNckM3lSaHVDG3YeMJyiCj`, production deployment
`dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU`. Their root redirect, Fixture routes, API
404, JavaScript hash
`02ccb27f97ce0bc6098307e8ed8506577699a83ec5088ebed1a7b4b41610066d`,
and CSS hash
`6ec8757d71b6518408ac83a8a0ddb4a8bdc1e3c0a4c41a7572ee404561a169b2`
showed no drift.

No source or application code, deployment, promotion, alias, ProjectDomain,
custom domain, DNS record, or protected branch changed. Do not delete the
project, promote or redeploy an artifact, remove its remaining aliases, or
move a domain to simulate shutdown. Those actions are destructive or prove
only routing removal, not the required reversible project pause.

### Security correction

One delegated read-only preflight used a broad project GET and saw encrypted
environment metadata and provider ciphertext. No plaintext secret was
observed, used, copied, or persisted. Broad project reads stopped immediately.
All follow-up and future attempts must use only narrow identity, domain, alias,
deployment, and pause-state endpoints; environment and credential payloads
remain out of scope.

### Epoch 7 decision matrix

| Decision | Status | Evidence boundary |
| --- | --- | --- |
| `dashboard` project shutdown | `UNKNOWN-HOLD` | Exact pause failed with HTTP 400; the application remained available through both aliases and the immutable deployment URL. |
| Provider remediation | `REQUIRED` | Control-plane state must be repaired before a fresh exact-pause attempt. |
| Static Fixture production default | `GO` (unchanged) | Apex/full deployment identity, routes, and artifact hashes showed no drift. |
| Delete, promote, redeploy, alias/domain/DNS mutation | `PROHIBITED` | These operations cannot serve as proof of a reversible pause. |
| Visual and interaction verification | `UNKNOWN-HOLD` | No browser/computer control was used; transport evidence is not visual proof. |
| Organizer submission, receipt, acceptance, score, or final archive | `UNKNOWN-HOLD` | Epoch 7 performed none of these actions. |

## Epoch 7 dashboard permanent-deletion handoff

The user explicitly authorized permanent deletion on 2026-08-24. Exact target
`dashboard` (`prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql`) passed a bounded preflight of
24 deployments, two aliases, and zero domains. The sorted LF-delimited UTF-8
set digests were
`1755cf715f07dc07f0498c816d5326cd23d6268b39058ebfce3d3acb4e147ac2`
for deployments and
`fdfa7fb5f0916126680e6e6a8e22df1e7993359e3d947a3c17b5f4745aba0cfc`
for aliases.

One no-body
`DELETE /v9/projects/prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql` targeted the immutable
project ID in the exact team scope and exited 0. This was attempt 1 of 1, with
no retry and no rollback. Post-delete identity checks found the name and ID
missing and zero exact project-list rows. All 24 frozen deployment IDs returned `Can't find`; both alias lookups returned HTTP 404
`Project not found`; both alias origins returned HTTP 404
`DEPLOYMENT_NOT_FOUND`; and immutable origin
`dashboard-4gdp8qvoe-dwwww.vercel.app` returned HTTP 410 `GONE`.

The project and its accepted project-scoped configuration were permanently
removed; the external Git repository was preserved. During this authorized
deletion run, no environment endpoint, value, metadata record, or provider
ciphertext was read or persisted.

`h2-sentinel-full` stayed at four aliases and three domains on `Ready`
production `dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU`; rollback deployment
`dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf` remained `Ready`. Both public origins kept
root HTTP 307 with exact `Location: /h2-sentinel/?mode=fixture`, both
Fixture-form 200 results, API 404, JavaScript identity
935,880 bytes / SHA-256
`02ccb27f97ce0bc6098307e8ed8506577699a83ec5088ebed1a7b4b41610066d`,
CSS identity 49,826 bytes / SHA-256
`6ec8757d71b6518408ac83a8a0ddb4a8bdc1e3c0a4c41a7572ee404561a169b2`,
TLS, HSTS, and DNS values. Remote refs `main@7889feb274dac77753fdd323df352c9c1335aebf`,
`competition/h2-sentinel@39a599285cbd39b2575564d5dc79d078964c5bd7`,
Epoch 6 `@1da8918e8f0735ac96c5289009234d042aa1c61d`, and the pre-Epoch-7
receipt branch `@ee1f2c55236884c02a0093dacb26eee010740e3c` were unchanged
during deletion.

Deletion is `GO`; Static Fixture production remains `GO`; Live/Local analytics
remains `NOT_EXPOSED`. Visual/interaction and every organizer outcome remain
independent `UNKNOWN-HOLD` statuses.
