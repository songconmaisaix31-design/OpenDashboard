# H2 Sentinel QA Acceptance Matrix

## Scope and invocation

This black-box QA lane owns only `tests/h2-sentinel/**`. It validates the
frozen H2 contract assets on H0 without changing or importing analytics,
plugin, Web, root scripts, or runtime configuration.

Run the contract gate from the repository root:

```bash
node tests/h2-sentinel/run-contract-qa.mjs
```

The command deliberately prints `SKIP` for each assembly-dependent scenario.
`SKIP` means the required implementation is absent from H0; it is neither a
passing acceptance result nor a defect in the frozen contract package.

## Completion criteria

- Every `C` row below passes with the frozen H2 contract package.
- Every `A` row remains `SKIP` until its named assembly dependency exists.
- A later H6 runner may invoke this file directly before and after assembly;
only an implemented dependency may change a row from `SKIP` to `PASS`.
- Defects are recorded in `DEFECT_LOG.md` with a runnable reproduction command.

| ID | Acceptance focus | Contract-only command and expected result | Assembly dependency | H0 result |
| --- | --- | --- | --- | --- |
| C01 | Dataset fingerprint, row count, and deterministic fixture identity | `node tests/h2-sentinel/run-contract-qa.mjs` prints `PASS C01` | None | PASS |
| C02 | C03 command-versus-BESS evidence, provenance, and human confirmation | Same command prints `PASS C02` | None | PASS |
| C03 | C04 PCC-limit impact can be recomputed from sanitized minute samples | Same command prints `PASS C03` against corrected gate `4f2a8a3156a96a7670f4ee9830ff1c560faf1c94` | None | FAIL on archived H0; PASS required on corrected gate |
| C04 | Report/submission surface and fixture redaction boundary | Same command prints `PASS C04`; public API test asserts exact C03/C04 submission values | None | PASS |
| A01 | CSV import, quality warning/blocking result, and API success/error envelope | Invoke analytics API contract test after adapter assembly | H2 analytics API | SKIP |
| A02 | Adapter activation, port implementation, and no hidden I/O in Fixture mode | Invoke plugin-runtime integration test after adapter assembly | H2 plugin adapter | SKIP |
| A03 | Offline golden journey: open Fixture, inspect C03/C04, answer deterministically | Run browser journey with network disabled | Analytics + plugin + Web | SKIP |
| A04 | Live sidecar binds only to `127.0.0.1`; reject non-loopback and invalid Host/Origin | Start sidecar and probe its listener policy | Local analytics sidecar | SKIP |
| A05 | HTML, JSON, CSV, validation, and quality artifacts are serializable, deterministic, and path-free | Export a fixed run twice and compare documented fields | Report exporter | SKIP |
| A06 | Fixture/Live provenance is visible in overview, event, diagnosis, report, and export views | Desktop and mobile screenshot assertions | Web composition | SKIP |
| A07 | Import/analysis/export failures expose stable redacted errors, no secrets, stack traces, or absolute paths | Force bounded failure through public API | API + Web error handling | SKIP |
| A08 | Desktop and mobile smoke: six views, no overflow, C03/C04 reachable, primary actions visible | Run production Web entry at desktop and mobile widths | Web composition | SKIP |

## Assembly test inputs and assertions

The frozen inputs are deliberately small, deterministic, synthetic, and
explicitly Fixture-provenanced. Assembly tests must use only the package-owned
sanitized CSV and C03/C04 JSON fixtures unless their own track adds a separately
reviewed, sanitized fixture.

| Suite | Required assertion |
| --- | --- |
| Analytics API | `importCsv({ filename, text })` accepts text only, reports quality, and never accepts filesystem paths. |
| Plugin adapter | The adapter exposes `H2SentinelDataSource` and Fixture activation performs no network, process, persistence, or filesystem operation. |
| Offline golden | With network disabled, C03 and C04 retain stable IDs, evidence, impact, recommendation, and `FIXTURE` provenance. |
| Loopback | The sidecar binds exactly to loopback; Host/Origin validation and bounded timeout failures are observable and redacted. |
| Reports | Exports include provenance, fingerprint, versions, safety disclaimer, and no absolute local path or credential-like material. |
| UI provenance | Every fixture display uses an explicit Fixture label; Live Analysis is never shown for precomputed fixture data. |
| Failure/redaction | Public error codes and retryability are stable; stack traces, request bodies, credentials, and absolute paths are absent. |
| Responsive smoke | Desktop and mobile show primary navigation and C03/C04 without clipping, overlap, or horizontal overflow. |
