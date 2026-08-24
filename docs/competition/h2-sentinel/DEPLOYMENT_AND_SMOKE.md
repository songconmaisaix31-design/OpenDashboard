# H2 Sentinel 离线部署冒烟与端口说明（Track D，D4）

> 唯一事实源为协调方的 `docs/plans/` 任务书；本文件只记录 D 轨实测结果与排查指引。
> 所有路径为仓库内相对路径，官方数据包（`$PACK`）只读、不入库。

## 1. 一键启动

```bash
npm ci                 # 干净环境复现（D4 前置步骤，安装根依赖与锁文件）
node scripts/h2-sentinel/launch.mjs --mode local
# 或使用仓库根的一键脚本：start-h2-sentinel.bat / .sh
```

launcher 负责：校验环境 → 启动 loopback analytics 进程（uv 托管）→ 启动 Vite
Web → 轮询 `/health` 与页面就绪 → 打印 READY → 优雅停机。

## 2. 端口说明

| 端口 | 角色 | 说明 |
| --- | --- | --- |
| `5173` | Web（默认） | Vite dev server，仅绑定 `127.0.0.1`；`--web-port` 可改，`--strictPort` 冲突即失败 |
| `8765` | Analytics（默认） | FastAPI 服务，仅绑定 `127.0.0.1`；`--analytics-port` 可改 |
| 任意空闲端口 | 自动分配 | 测试脚本（`validation/evaluate.mjs`、`offline-deploy-smoke.mjs`）用 `freeLoopbackPort()` 动态分配，互不冲突 |

端口占用时报错示例（launcher 实测行为）：

```
[H2 Sentinel] Web port 5173 is already in use on 127.0.0.1. Choose another web port.
[H2 Sentinel] Analytics port 8765 is already in use on 127.0.0.1. Choose another analytics port.
```

## 3. Historical offline smoke and Epoch 4 technical evidence

The 2026-08-22 offline-smoke entry that reported 566 predicted events and an
`affected_equipment` format blocker is historical. It is not a current
Epoch 4 blocker, a current official-run result, or a deployment verdict.

The sanitized attempt-6 technical record is bound to executable SHA
`58090bc1747d621bc87d698259319a70c34e75f2` and records:

- raw input: 77,865,257 bytes, 172,800 rows, 69 fields, SHA-256
  `88f3a5c15fb5c42d265475f2998fe9f6c271dcef16f43daee7626f6704504cd9`;
- normalized input: 78,038,054 bytes, SHA-256
  `4407495ad75299f2f8f06112f6d3209eb93b2773ff3f0c797c47874159853169`;
- 104 events, a 104-by-16 submission, 21 series with 172,800 points each,
  and a passed cleanup status;
- report SHA-256
  `8796dd1f9e9baca3dad0711c6fb74ccca40485874527a5ef0e2323a9111bf27f` and
  attempt-6 `submission.csv` SHA-256
  `af8814d3e428ef1470a43e0a07d4d6dcdc79585846841a15778fff8c91d60326`.

That evidence is technical only. It does not establish organizer submission,
receipt, acceptance, official score, deployment code-SHA binding, or visual
verification. This document intentionally contains no command that reruns the
official CSV.

## 4. 故障排查

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `Vite is unavailable. Run npm ci before starting H2 Sentinel.` | 根目录 `node_modules` 缺失 | `npm ci` |
| `uv is required for local mode; install uv and sync the locked dev environment.` | 未安装 uv 或 `services/h2-analytics` 未 sync | 安装 uv（0.6+）；launcher 自动 `uv run --locked --extra dev` |
| `Analytics health check timed out` | 服务未在时限内返回规范健康包；端口被占用/环境损坏 | 检查端口占用；确认 `/health` 返回规范 envelope；调大 `--health-timeout-ms` |
| `Web readiness timed out` | Vite 未在时限内就绪 | 确认 `npm ci` 完成；`--web-runtime preview` 需先 `npm run h2:build` |
| 端口被占用 | 残留进程 | `taskkill /PID <pid> /T /F`（Windows）或换端口；launcher 停机时已做进程树清理 |
| `datasets:import` 409 `quality.blocked` | 列不齐 69 官方字段 / 时间戳未规范化 / 重复时间戳 / 越限数值 | 先跑 `validation/evaluate.mjs` 的规范化路径（`normalizeOfficialCsv`）；检查表头与 `fields.json` 无差集 |
| 提交文件格式校验失败 | Inspect the current validator result and its exact artifact hash | Do not overwrite historical attempt evidence; route any code defect to its owner |

## 5. Historical cross-track defect record

The earlier 566-row `affected_equipment` export finding is retained as a
point-in-time diagnostic record only. It must not be presented as an active
Epoch 4 blocker. The current attempt-6 record instead describes a 104-by-16
submission and a passed cleanup status. Track D does not re-evaluate or modify
the frozen implementation that produced either record.

## 6. Current non-official verification boundaries

```bash
npm ci
npm run h2:check
npm run h2:smoke
powershell.exe -NoProfile -ExecutionPolicy Bypass -File submission/h2-sentinel/scripts/validate-submission.ps1
```

Observed deployment transport evidence is origin-specific for deployment
`dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf`:

- On `https://204421.xyz`, all eight probes returned an HTTP 200 SPA shell:
  `/`, `/?mode=fixture`, both slash forms of H2 fixture, local, and invalid
  routes. This is same-origin transport evidence only.
- On `https://h2-sentinel-hxrbu0wan-dwwww.vercel.app`, direct `/` and
  `/?mode=fixture` each returned HTTP 302 to the Vercel SSO endpoint. Those
  direct probes are `AUTH-REDIRECT/UNKNOWN-HOLD`, not H2 shell evidence.
- The custom-domain asset `/assets/index-C2wmhv_n.js` was HTTP 200, 935,592
  bytes, SHA-256
  `b26ab9a88167f6b587732d52a4ae9461d8d2edfa4b17847e3f815ec81ef6d4b6`.
  It contains `H2 Sentinel` and `氢哨`; the literal `invalid-mode` is absent.

The matching local production asset establishes a static-asset-only binding to
the frozen executable SHA. It is neither desktop/mobile visual verification nor
interactive smoke proof, and it does not establish organizer submission,
receipt, acceptance, or score.

## 7. Epoch 5 isolated full-Fixture deployment receipt

Epoch 5 reused the complete six-page deterministic Fixture application from the
canonical H2 branch without changing the existing deployment. The deployed
implementation candidate is
`f546a6aedaefa66f5634b20008a20cab41db26ed`, on
`songconmaisaix31-design/h2-full-deploy-e5`, descended linearly from frozen
base `39a599285cbd39b2575564d5dc79d078964c5bd7`.

### 7.1 Isolated project and publication workflow

The new deployment is isolated from the existing `h2-sentinel` project:

| Field | Recorded value |
| --- | --- |
| Project | `h2-sentinel-full` |
| Project ID | `prj_KvPLDryNckM3lSaHVDG3YeMJyiCj` |
| Deployment ID | `dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU` |
| Generated deployment URL | `https://h2-sentinel-full-87jzhi1zh-dwwww.vercel.app` |
| Provider state | `Ready`, production target |
| Public custom domain | `https://full.204421.xyz` |
| Deployed Git candidate | `f546a6aedaefa66f5634b20008a20cab41db26ed` |

The candidate was first created with the sanitized staged-production command
`vercel --prod --skip-domain` in the independently verified
`h2-sentinel-full` context. It was qualified before domain binding, then the
same deployment was targeted by exactly one sanitized
`vercel promote <deployment>` invocation. No second promotion or separate
alias assignment occurred. Immediately before promotion, the only custom
domain was `full.204421.xyz`; the provider-generated
`h2-sentinel-full.vercel.app` hostname is not a custom domain. The new project
never contained the apex `204421.xyz` or another custom domain.

Direct anonymous requests to both the generated deployment URL and the default
`h2-sentinel-full.vercel.app` hostname returned HTTP 302 under Vercel Standard
Protection. They are classified as `AUTH-REDIRECT`, were not followed, and are
not public-delivery evidence. The authenticated staged qualification used the
CLI's normal credential handling; no credential or private response was
recorded.

### 7.2 DNS, TLS, routes, and asset identity

The exact-host DNS record created for Epoch 5 is record ID
`2091551737541830656`, host `full`, type `CNAME`, target
`063cc3c97d7335db.vercel-dns-017.com`, and TTL 600. Provider verification
reported `configured_correctly`, verified ownership, CNAME configuration, and
no issue or conflict. External DNS-over-HTTPS returned the same CNAME. TLS
validation succeeded for `full.204421.xyz`, and the HTTPS response includes
HSTS.

Anonymous requests without cookies or authorization produced:

| Request | Result | Evidence boundary |
| --- | --- | --- |
| `/` | HTTP 307, exact `Location: /h2-sentinel/?mode=fixture` | One-hop temporary entry redirect |
| `/h2-sentinel?mode=fixture` | HTTP 200 HTML | SPA document transport |
| `/h2-sentinel/?mode=fixture` | HTTP 200 HTML | SPA document transport |
| `#h2/overview` | HTTP 200 HTML | Document transport only; fragment not sent to server |
| `#h2/events` | HTTP 200 HTML | Document transport only; fragment not sent to server |
| `#h2/diagnosis` | HTTP 200 HTML | Document transport only; fragment not sent to server |
| `#h2/analysis` | HTTP 200 HTML | Document transport only; fragment not sent to server |
| `#h2/assistant` | HTTP 200 HTML | Document transport only; fragment not sent to server |
| `#h2/reports` | HTTP 200 HTML | Document transport only; fragment not sent to server |
| `/api/v1/h2-sentinel/mode` | HTTP 404 | No successful public analytics API |

The local build, authenticated staged fetch, and final anonymous custom-domain
fetch matched byte-for-byte:

| Asset | Bytes | SHA-256 |
| --- | ---: | --- |
| `/assets/index-CG2awVBj.js` | 935,880 | `02ccb27f97ce0bc6098307e8ed8506577699a83ec5088ebed1a7b4b41610066d` |
| `/assets/index-DPHGouYO.css` | 49,826 | `6ec8757d71b6518408ac83a8a0ddb4a8bdc1e3c0a4c41a7572ee404561a169b2` |

The JavaScript contains the static markers `H2 Sentinel`, `氢哨`,
`演示数据 Fixture`, and `不接收或上传用户文件`. Marker and hash matches bind
the static artifact only. Semantic tests separately prove that Fixture mode
has no actionable CSV input while Live mode retains the local-only import
flow.

### 7.3 Existing-site and protected-ref controls

The `https://204421.xyz` before/after control remained unchanged:

- deployment ID `dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf`;
- `/`, both H2 Fixture slash forms, and their static shell routes returned HTTP
  200, while `/api/v1/h2-sentinel/mode` returned HTTP 404;
- `/assets/index-C2wmhv_n.js` remained 935,592 bytes with SHA-256
  `b26ab9a88167f6b587732d52a4ae9461d8d2edfa4b17847e3f815ec81ef6d4b6`;
- `/assets/index-DPHGouYO.css` remained 49,826 bytes with SHA-256
  `6ec8757d71b6518408ac83a8a0ddb4a8bdc1e3c0a4c41a7572ee404561a169b2`;
  and
- the apex DNS A result remained `216.198.79.1`.

The live remote protected refs also remained unchanged:

- `refs/heads/main`:
  `7889feb274dac77753fdd323df352c9c1335aebf`;
- `refs/heads/competition/h2-sentinel`:
  `39a599285cbd39b2575564d5dc79d078964c5bd7`.

### 7.4 Exact-candidate verification and exceptions

The recorded exact-candidate gates passed:

- `npm ci`, `npm run typecheck`, `npm run build`, and `npm run check`;
- `npm run test`: 110/110;
- H2 tests: 78/78; contract tests: 39/39; QA: 5/5; assembled QA:
  5/5; launcher tests: 13/13;
- `npm run h2:smoke`: 9/9;
- `uv lock --check` and `uv sync --locked --extra dev`;
- locked Python tests: 50/50; and
- production dependency audit against the official npm registry: zero
  vulnerabilities.

The following exceptions are preserved rather than hidden:

- the first `npm run h2:check` attempt had a transient Local readiness failure;
  after no code change, a dedicated-port launcher check released both ports and
  the complete `h2:check` rerun passed;
- the configured npmmirror audit endpoint returned HTTP 404, so the
  process-scoped rerun used the official npm registry and reported zero
  vulnerabilities;
- local `vercel build` stopped with `project_settings_required` because an
  environment pull was intentionally prohibited; the provider cloud build and
  deployment completed successfully;
- `vercel link` created `.env.local` and changed `.gitignore`; the environment
  file was not read and was deleted immediately, the ignore-file change was
  restored, and no environment value was persisted;
- Vite retains the greater-than-500-kB JavaScript bundle warning; and
- the Python suite retains one upstream Starlette/httpx deprecation warning.

### 7.5 Independent delivery decisions

| Decision | Status | Evidence boundary |
| --- | --- | --- |
| Static Fixture delivery | `GO` | Isolated project, staged qualification, exact single promotion, anonymous custom-domain routes, DNS/TLS, matching assets, unchanged existing site, refs, and local gates passed. |
| Live/Local analytics | `NOT_EXPOSED` | Public delivery is the complete six-page deterministic Fixture; the CSV analytics sidecar remains loopback-only and no public API is exposed. |
| Visual verification | `UNKNOWN-HOLD` | No browser control, screenshots, desktop/mobile rendering, or interaction verification was authorized. |
| Organizer submission/receipt/acceptance | `UNKNOWN-HOLD` | Epoch 5 contains no organizer action or receipt evidence. |
| Official score | `UNKNOWN-HOLD` | Fixture and technical outputs are not an official score. |
| Final submission archive | `UNKNOWN-HOLD` | Epoch 5 did not create or verify an organizer submission archive. |

HTTP status, hash-route transport, matching static assets, Fixture output, and
test success must not be restated as visual quality, Live analytics, organizer
acceptance, an official score, or final-archive verification.

Rollback authority remains limited to the exact Epoch 5 custom-domain binding
and DNS record above after a fresh target inspection. It does not authorize a
second promotion, apex/wildcard mutation, project or deployment deletion,
protected-ref movement, or history rewriting.

## 8. Epoch 6 apex production-default switch receipt

Epoch 6 changed only the exact `204421.xyz` alias and ProjectDomain assignment
so the already-qualified six-page Fixture became the production default. It
did not build or deploy a new artifact, run a promotion, change DNS, expose
Local analytics, or rewrite the Epoch 5 receipt above.

### 8.1 Authority, time window, and preflight identities

The switch ran on 2026-08-24 under the accepted plan commits, in order:

- `2bf604fb5efb2439552d57702675551b620e8205`;
- `78e966f6d839ef7dce7416c7c77132b29409826a`.

Fresh preflight established three separate provider roles:

| Role | Project and identity | Recorded state before mutation |
| --- | --- | --- |
| ProjectDomain owner | `dashboard` / `prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql` | Owned exact `204421.xyz` |
| Old alias traffic target | `h2-sentinel` / `prj_6pRMaPgh3YXvgibdHBYnM9RoysUQ` | No custom domain; `Ready` production `dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf` at `h2-sentinel-hxrbu0wan-dwwww.vercel.app` served the apex |
| Target owner and traffic target | `h2-sentinel-full` / `prj_KvPLDryNckM3lSaHVDG3YeMJyiCj` | `Ready` production `dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU` at `h2-sentinel-full-87jzhi1zh-dwwww.vercel.app`; `full.204421.xyz` already qualified |

Before mutation, the apex root returned HTTP 200 and served
`/assets/index-C2wmhv_n.js`, 935,592 bytes, SHA-256
`b26ab9a88167f6b587732d52a4ae9461d8d2edfa4b17847e3f815ec81ef6d4b6`.
The full subdomain returned its existing HTTP 307 Fixture redirect and the
Epoch 5 full asset hashes.

### 8.2 Selected Path A and sanitized mutation receipt

Vercel CLI `56.3.1` confirmed that `domains add --force` is a sequential,
non-atomic DELETE of the existing exact ProjectDomain followed by a POST to
the new project with target `PRODUCTION`. It does not change DNS, another
domain, or a deployment. Path A therefore moved and qualified traffic before
transferring metadata.

Stage 1 ran exactly:

```text
vercel alias set h2-sentinel-full-87jzhi1zh-dwwww.vercel.app 204421.xyz --scope dwwww --non-interactive
```

The command succeeded. The immediate anonymous gate proved, while
`dashboard` still owned the ProjectDomain:

- apex `/` returned HTTP 307 with exact relative
  `Location: /h2-sentinel/?mode=fixture`;
- both Fixture slash forms returned HTTP 200;
- `/api/v1/h2-sentinel/mode` returned HTTP 404;
- JavaScript and CSS bytes and hashes matched the qualified full artifact;
- all four static JavaScript markers were present;
- HSTS was present and TLS validated; and
- apex A and full-subdomain CNAME results were unchanged.

Only after that gate passed, Stage 2 ran exactly:

```text
vercel domains add 204421.xyz h2-sentinel-full --force --scope dwwww --non-interactive
```

The command succeeded. Its sanitized CLI result showed removal of exact
`204421.xyz` from `prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql`, followed by addition
to `h2-sentinel-full`. Alias-first sequencing preserved qualified traffic
across the non-atomic metadata transfer.

### 8.3 Final provider and protection state

The final provider observations were:

- `dashboard` ProjectDomains: empty;
- `h2-sentinel` ProjectDomains: only platform hostname
  `h2-sentinel.vercel.app`;
- `h2-sentinel-full` ProjectDomains: exact `204421.xyz`,
  `full.204421.xyz`, and platform hostname
  `h2-sentinel-full.vercel.app`;
- every listed `h2-sentinel-full` ProjectDomain was verified, with no redirect
  or Git branch binding;
- both `204421.xyz` and `full.204421.xyz` inspected to
  `dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU`, state `Ready`, target `production`;
- the old `dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf` remained `Ready`, target
  `production`, and retained for rollback;
- both custom domains verified as `configured_correctly`, attached and
  verified, with empty issue and conflict results; and
- protection remained observed as `all_except_custom_domains`, with
  `gitForkProtection=true`.

No new deployment was created, and no promotion command or promotion result
occurred in Epoch 6. DNS was not mutated. Environment values were deliberately
not queried. The two exact commands do not operate environment settings, and
no environment-related change was visible in the inspected project/domain
metadata; this is not an independent verification of environment values.

### 8.4 Final anonymous HTTP and artifact window

The final anonymous evidence window was 2026-08-24 00:15:13 through 00:16:17
`+08:00`. Both `https://204421.xyz` and `https://full.204421.xyz` produced:

| Request or artifact | Result |
| --- | --- |
| `/` | HTTP 307; exact `Location: /h2-sentinel/?mode=fixture` |
| `/h2-sentinel?mode=fixture` | HTTP 200 HTML, 528 bytes |
| `/h2-sentinel/?mode=fixture` | HTTP 200 HTML, 528 bytes |
| `/api/v1/h2-sentinel/mode` | HTTP 404, 79 bytes |
| `/assets/index-CG2awVBj.js` | HTTP 200, 935,880 bytes, SHA-256 `02ccb27f97ce0bc6098307e8ed8506577699a83ec5088ebed1a7b4b41610066d` |
| `/assets/index-DPHGouYO.css` | HTTP 200, 49,826 bytes, SHA-256 `6ec8757d71b6518408ac83a8a0ddb4a8bdc1e3c0a4c41a7572ee404561a169b2` |
| JavaScript markers | `H2 Sentinel`, `氢哨`, `演示数据 Fixture`, and `不接收或上传用户文件`: all present |
| TLS and HSTS | Valid exact-host TLS and HSTS present |

The overview, events, diagnosis, analysis, assistant, and reports hash URLs
each returned HTTP 200 document transport on both origins. Fragments are not
sent to the server, so these results do not prove rendered navigation or
interaction. The old JavaScript hash no longer appeared at the apex, while
the full subdomain remained byte-for-byte unchanged.

### 8.5 DNS, hostname drift, refs, and security controls

External DNS-over-HTTPS remained unchanged:

- apex A: `216.198.79.1`;
- `full.204421.xyz` CNAME:
  `063cc3c97d7335db.vercel-dns-017.com`;
- authoritative name servers: `dns31.hichina.com` and `dns32.hichina.com`.

Observed TTL variation was resolver cache behavior, not configuration drift.

Epoch 6 also recorded a fresh current hostname classification without
rewriting the Epoch 5 historical observation:

| Hostname class | Current result |
| --- | --- |
| Old immutable automatic URL `h2-sentinel-hxrbu0wan-dwwww.vercel.app` | HTTP 302 `AUTH-REDIRECT` |
| New immutable automatic URL `h2-sentinel-full-87jzhi1zh-dwwww.vercel.app` | HTTP 302 `AUTH-REDIRECT` |
| Old project-default `h2-sentinel.vercel.app` | HTTP 200 `DIRECT` |
| New project-default `h2-sentinel-full.vercel.app` | HTTP 307 `DIRECT-APP-REDIRECT` |

Hostname access behavior is drift-prone and must be rechecked rather than
inferred from an earlier Epoch.

The live remote refs remained unchanged:

- `refs/heads/main`:
  `7889feb274dac77753fdd323df352c9c1335aebf`;
- `refs/heads/competition/h2-sentinel`:
  `39a599285cbd39b2575564d5dc79d078964c5bd7`;
- `refs/heads/songconmaisaix31-design/h2-full-deploy-e5`:
  `da5ae929e67168a57dc4f7229bcee47e8047049f`.

No credential or environment value was read, printed, or persisted.
`.env.local` was absent in the Epoch 6 worktree.

### 8.6 Rollback readiness and independent decisions

Rollback was not required. Immediate traffic rollback remains:

```text
vercel alias set h2-sentinel-hxrbu0wan-dwwww.vercel.app 204421.xyz --scope dwwww --non-interactive
```

A complete pre-state rollback requires fresh inspection, then this exact
sequence, limited to the apex:

```text
vercel alias set h2-sentinel-hxrbu0wan-dwwww.vercel.app 204421.xyz --scope dwwww --non-interactive
vercel domains add 204421.xyz dashboard --force --scope dwwww --non-interactive
vercel alias set h2-sentinel-hxrbu0wan-dwwww.vercel.app 204421.xyz --scope dwwww --non-interactive
```

It does not mutate DNS or `full.204421.xyz`.

| Decision | Status | Evidence boundary |
| --- | --- | --- |
| Static Fixture production default | `GO` | Selected Path A, both stage gates, final provider identity, anonymous apex/full HTTP, matching artifacts, DNS/TLS, refs, and rollback readiness passed. |
| Live/Local analytics | `NOT_EXPOSED` | The public API remains 404; CSV analytics remains literal-loopback-only. |
| Visual and interaction verification | `UNKNOWN-HOLD` | The user prohibited browser/computer control; CLI, HTTP, DNS, TLS, and hashes are not visual or interaction proof. |
| Organizer submission/receipt/acceptance | `UNKNOWN-HOLD` | Epoch 6 performed no organizer action. |
| Official score | `UNKNOWN-HOLD` | Fixture and technical outputs are not an official score. |
| Final submission archive | `UNKNOWN-HOLD` | No organizer archive was created or verified. |

## 9. Epoch 7 dashboard shutdown HOLD receipt

Epoch 7 attempted only the planned reversible pause of the obsolete Vercel
project `dashboard`. The exact pause request was rejected by the provider, no
shutdown occurred, and the result is `UNKNOWN-HOLD`. Project deletion,
deployment promotion, alias removal, ProjectDomain changes, and DNS changes
were not authorized as substitutes for a successful pause.

### 9.1 Exact target and dependency boundary

The shutdown target was bound to:

- project name: `dashboard`;
- project ID: `prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql`;
- deployment targeted by the narrow live alias registry:
  `dpl_5qSx6duyyumiPz1iktqgdou9KhnT`; and
- immutable deployment URL:
  `dashboard-4gdp8qvoe-dwwww.vercel.app`.

The live registry listed two provider-owned `*.vercel.app` aliases for
`dashboard`, both targeting that deployment. The same deployment retained the
immutable URL above. The registry listed no custom alias for the project, and
the `dashboard` ProjectDomain list remained empty. In particular, neither
`204421.xyz` nor `full.204421.xyz` depended on this project.

The two public H2 origins remained assigned to `h2-sentinel-full`, project
`prj_KvPLDryNckM3lSaHVDG3YeMJyiCj`, production deployment
`dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU`.

### 9.2 Exact pause attempt and failed result

The single bounded mutation attempt targeted only the exact project:

```text
POST /v1/projects/prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql/pause
HTTP 400; client exit code 1
Active production deployment does not exist
```

The provider did not accept the pause. No automatic retry was made. Fresh
narrow checks found the same deployment, two aliases, and immutable deployment
URL. `/login` still returned HTTP 200 through all three origins. The
application therefore remained active; neither an HTTP error nor the attempted
request is shutdown proof.

The observed state is internally inconsistent: the live alias registry exposes
an active application deployment, while the pause control reports no active
production deployment. This requires a Vercel support or control-plane repair.
After that repair, a new execution must repeat the complete narrow preflight
and then retry only the same exact project pause. A blind retry is prohibited.

### 9.3 Public no-drift and mutation boundary

Post-failure checks found no drift at `https://204421.xyz` or
`https://full.204421.xyz`:

- root remained HTTP 307 with exact
  `Location: /h2-sentinel/?mode=fixture`;
- both Fixture slash forms remained HTTP 200;
- `/api/v1/h2-sentinel/mode` remained HTTP 404;
- JavaScript remained 935,880 bytes with SHA-256
  `02ccb27f97ce0bc6098307e8ed8506577699a83ec5088ebed1a7b4b41610066d`;
- CSS remained 49,826 bytes with SHA-256
  `6ec8757d71b6518408ac83a8a0ddb4a8bdc1e3c0a4c41a7572ee404561a169b2`;
  and
- both origins remained bound to
  `dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU`.

The rejected POST caused no provider mutation. Epoch 7 changed no source or
application code, deployment, promotion, alias, ProjectDomain, custom domain,
DNS record, or protected branch.

Removing the remaining aliases would only make individual origins unrouted;
it would not prove a paused project. Deleting the project would destroy the
reversible recovery path. Promoting or redeploying would create a new
production state instead of shutting down the exact retained project. All
three alternatives remain prohibited.

### 9.4 Security boundary learned during preflight

One delegated read-only preflight used a broader project GET than the minimum
required scope. Its response exposed encrypted environment metadata and
provider ciphertext. No plaintext secret was observed, used, copied into the
receipt, or persisted. Subsequent broad project reads were stopped.

Future work must use narrow project-identity, ProjectDomain, alias, deployment,
and pause-state endpoints only. It must not retrieve broad project payloads,
environment records, credential material, or ciphertext. This control applies
even when an endpoint is nominally read-only.

### 9.5 Independent decisions

| Decision | Status | Evidence boundary |
| --- | --- | --- |
| `dashboard` project shutdown | `UNKNOWN-HOLD` | Exact pause POST returned HTTP 400 and the aliases continued serving the application. Provider repair and a fresh exact-pause run are required. |
| Static Fixture production default | `GO` (unchanged) | Apex and full routes, artifacts, and deployment identity showed no drift after the rejected request. |
| Alternative destructive or routing mutations | `PROHIBITED` | Delete, promotion, redeploy, alias removal, domain transfer, and DNS changes cannot substitute for reversible pause. |
| Live/Local analytics | `NOT_EXPOSED` | The public API remained 404; no public analytics sidecar was introduced. |
| Visual and interaction verification | `UNKNOWN-HOLD` | The user prohibited browser/computer control; HTTP and hashes are transport evidence only. |
| Organizer submission/receipt/acceptance | `UNKNOWN-HOLD` | Epoch 7 performed no organizer action. |
| Official score and final submission archive | `UNKNOWN-HOLD` | The shutdown attempt establishes neither an official score nor an organizer archive. |

## 10. Epoch 7 dashboard permanent-deletion receipt

On 2026-08-24, the user explicitly authorized permanent deletion of exact
Vercel project `dashboard` (`prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql`). The bounded
preflight found 24 deployments, two provider-owned aliases, and zero domains.
The sorted LF-delimited UTF-8 deployment-ID set had SHA-256
`1755cf715f07dc07f0498c816d5326cd23d6268b39058ebfce3d3acb4e147ac2`;
the equivalently canonicalized alias set had SHA-256
`fdfa7fb5f0916126680e6e6a8e22df1e7993359e3d947a3c17b5f4745aba0cfc`.

Exactly one no-body request targeted the immutable ID through
`DELETE /v9/projects/prj_iz4lkFju3j7MNjyigA2HF4oHR7Ql` in the exact team
scope. It completed with client exit code 0 as attempt 1 of 1. There was no
retry, compensating mutation, or rollback.

Post-delete checks established:

- exact name and ID lookups were missing, and the complete project list had
  zero exact matching rows;
- all 24 frozen deployment IDs returned `Can't find`;
- both frozen alias lookups returned HTTP 404 `Project not found`;
- both alias origins returned HTTP 404 `DEPLOYMENT_NOT_FOUND`; and
- immutable origin `dashboard-4gdp8qvoe-dwwww.vercel.app` returned HTTP 410
  `GONE`.

The project and its accepted project-scoped configuration were permanently
removed. The external Git repository and its history were preserved. No
During this authorized deletion run, no environment endpoint, value, metadata
record, or provider ciphertext was read, printed, copied, or persisted.

Both H2 origins remained on `h2-sentinel-full`
(`prj_KvPLDryNckM3lSaHVDG3YeMJyiCj`) deployment
`dpl_a65AW4vXf9CHHkcmK2NxVgS1xiTU`, `Ready`, target `production`; rollback
deployment `dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf` remained `Ready`. The
`h2-sentinel-full` inventory stayed at four aliases and three domains. On both
origins, root remained HTTP 307 with exact
`Location: /h2-sentinel/?mode=fixture`, both Fixture slash forms remained HTTP
200, the public API remained HTTP 404, JavaScript remained
935,880 bytes with SHA-256
`02ccb27f97ce0bc6098307e8ed8506577699a83ec5088ebed1a7b4b41610066d`,
and CSS remained 49,826 bytes with SHA-256
`6ec8757d71b6518408ac83a8a0ddb4a8bdc1e3c0a4c41a7572ee404561a169b2`.
TLS, HSTS, apex A, full-subdomain CNAME, and authoritative name-server values
were unchanged.

Remote refs remained unchanged during the provider mutation:

- `main`: `7889feb274dac77753fdd323df352c9c1335aebf`;
- `competition/h2-sentinel`:
  `39a599285cbd39b2575564d5dc79d078964c5bd7`;
- Epoch 6 branch: `1da8918e8f0735ac96c5289009234d042aa1c61d`;
  and
- pre-Epoch-7 receipt branch:
  `ee1f2c55236884c02a0093dacb26eee010740e3c`.

Permanent deletion is `GO`; Static Fixture production remains `GO`; Live/Local
analytics remains `NOT_EXPOSED`. Visual/interaction verification, organizer
submission/receipt/acceptance, official score, and final archive remain
independent `UNKNOWN-HOLD` outcomes. HTTP and hashes remain static-transport
evidence only.
