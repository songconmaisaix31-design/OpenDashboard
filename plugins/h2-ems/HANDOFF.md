# H2 EMS plugin handoff

## Scope

- Branch: `songconmaisaix31-design/h2-plugin`.
- Immutable Wave 1 gate: `f9dd7df83a81da57fdaa2b03cd67470c8c7a22c4`.
- Owned paths: `plugins/h2-ems/**` only.

## Integration surface

The integration track should register `h2EmsPlugin` for Fixture mode, or call
`createH2EmsPlugin({ enabled: true, baseUrl: 'http://127.0.0.1:<port>/' })`
for explicit local mode. The factory validates the literal loopback URL before
creating a plugin definition; it does not modify the static plugin runtime.

The exported `H2_EMS_LIVE_ROUTES` constants use the required
`/api/v1/h2-sentinel` namespace. Analytics and QA must keep endpoint parity with
these constants; no arbitrary route is accepted by this adapter.

## Boundaries and limitations

- The plugin is trusted Tier 1 code; manifest capabilities are audit metadata,
  not sandbox enforcement.
- Fixture mode performs no request and cannot import external CSV data.
- Live mode is opt-in, loopback-only, timeout/cancellation aware, and returns
  stable redacted errors rather than raw server details.
- This track does not wire `main.tsx`, start the analytics service, or control
  equipment/processes.

## Verification evidence

- `npm ci` completed from the locked root dependencies.
- `npm run typecheck` passed.
- `npm run test` passed: 54 tests, including Fixture, static registration,
  invalid URL, malformed response/redaction, timeout/cancellation, local-mode
  factory, provenance, and report artifact assertions.
- `npm run build` passed through `npm run check`.
- `git diff --check` passed before the implementation archive commit.

## Archive commits

- `4829318 feat(h2-plugin): add validated H2 EMS adapters`

The final documentation commit and both commits' pushed remote head are recorded
in the worker completion report after push succeeds.
