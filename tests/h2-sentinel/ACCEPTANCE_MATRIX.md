# H2 Sentinel QA Acceptance Matrix

## Scope and invocation

This black-box QA lane owns only `tests/h2-sentinel/**`. It validates frozen
contract assets and starts the assembled product only through the public H6
launcher contract. It never changes analytics, plugin, Web, root scripts, or
runtime configuration.

Run the contract gate from the repository root:

```bash
npm run h2:qa
```

`run-contract-qa.mjs` first executes the dependency-free C01-C04 contract
gate, then invokes `assembled/run-assembled-qa.mjs`. The latter allocates its
own loopback ports and starts only:

```text
node scripts/h2-sentinel/launch.mjs --mode fixture|local --web-port ... --analytics-port ... --ready-json
```

It parses the `READY` record, verifies owned PID exit and loopback rebind after
shutdown, and emits one redacted JSON evidence summary to stdout. It does not
persist generated reports, PIDs, raw startup output, absolute paths, or secrets.

## Completion criteria

- Every `C` row below passes with the frozen H2 contract package.
- Every `A` row runs against the assembled public launcher/API or an explicitly
  identified source-level entry contract. A failed assertion is a defect, not a
  `SKIP`.
- Visual rendering is intentionally separate: no browser automation dependency
  is added. The runner provides reachability and source-level route evidence;
  desktop and 390 px screenshot review remains a required manual gate.
- Defects are recorded in `DEFECT_LOG.md` with a runnable reproduction command.

| ID | Acceptance focus | Contract-only command and expected result | Assembly dependency | H0 result |
| --- | --- | --- | --- | --- |
| C01 | Dataset fingerprint, row count, and deterministic fixture identity | `node tests/h2-sentinel/run-contract-qa.mjs` prints `PASS C01` | None | PASS |
| C02 | C03 command-versus-BESS evidence, provenance, and human confirmation | Same command prints `PASS C02` | None | PASS |
| C03 | C04 PCC-limit impact can be recomputed from sanitized minute samples | Same command prints `PASS C03` against corrected gate `4f2a8a3156a96a7670f4ee9830ff1c560faf1c94` | None | FAIL on archived H0; PASS required on corrected gate |
| C04 | Report/submission surface and fixture redaction boundary | Same command prints `PASS C04`; public API test asserts exact C03/C04 submission values | None | PASS |
| A01 | CSV import, analysis, C03/C04 events, canonical success envelope | Local launcher then public `datasets:import`, `datasets:analyze`, and `runs/events` requests | Local analytics API | PASS on 2026-08-19 baseline |
| A02 | Fixture mode starts no Python sidecar and its owned Web PID exits | Fixture launcher `READY` record plus shutdown/rebind assertion | H6 launcher + H2 Fixture plugin | PASS after `92f7b78027b9492a5a5fe8ced2e851ed4199aeaa` |
| A03 | Assembled Local C03/C04 golden data traverses import, analysis, event list, assistant, report, and CSV public APIs | Local launcher and public API requests only | H6 launcher + analytics + proxy | PASS on 2026-08-19 baseline |
| A04 | Local sidecar uses literal `127.0.0.1`; external Host is 400, external Origin is 403; occupied ports and redirect health fail | Direct raw HTTP boundary requests and launcher failure probes | H6 launcher + analytics API | PASS on 2026-08-19 baseline |
| A05 | C03 HTML report has matching SHA-256 descriptor and safe filename; `submission.csv` has exact 16 columns | Fixture public adapter probe and Local public report/export APIs | H2 Fixture plugin + analytics exporter | PASS after `92f7b78027b9492a5a5fe8ced2e851ed4199aeaa` |
| A06 | Fixture/Live provenance is visible in all views | Manual desktop and 390 px screenshot review; source-level labels are supplementary only | Web composition | MANUAL REQUIRED |
| A07 | Unknown run exposes stable redacted error; error body contains no path, secret, auth, or stack material | Local public API failure request | Analytics API | PASS on 2026-08-19 baseline |
| A08 | Generic entry, H2 entry, closed invalid-mode alert, and all six navigation route declarations exist | Fixture launcher HTTP reachability plus source-level entry/navigation gate | H6 + Web composition | PASS (source/HTTP); MANUAL REQUIRED for layout |

## Assembly test inputs and assertions

The frozen inputs are deliberately small, deterministic, synthetic, and
explicitly Fixture-provenanced. Assembly tests must use only the package-owned
sanitized CSV and C03/C04 JSON fixtures unless their own track adds a separately
reviewed, sanitized fixture.

| Suite | Required assertion |
| --- | --- |
| Analytics API | Public `datasets:import` accepts `filename` and text only, then yields an analyzed C03/C04 run through canonical envelopes. |
| Plugin adapter | The adapter exposes `H2SentinelDataSource` and Fixture activation performs no network, process, persistence, or filesystem operation. |
| Fixture golden | Fixture `READY` has null analytics fields; the public Fixture adapter must export C03 as an HTML report and retain a matching content hash. |
| Loopback | The sidecar binds exactly to loopback; Host/Origin validation and bounded timeout failures are observable and redacted. |
| Reports | The C03 HTML descriptor hash equals the content SHA-256; filename is safe; exact CSV header/value order and public-text redaction are checked. |
| UI provenance | Every fixture display uses an explicit Fixture label; Live Analysis is never shown for precomputed fixture data. |
| Failure/redaction | Public error codes and retryability are stable; stack traces, request bodies, credentials, and absolute paths are absent. |
| Responsive smoke | The runner verifies entry/nav declarations only. Manual desktop and 390 px review must confirm primary navigation, C03/C04, clipping, overlap, and horizontal overflow. |
