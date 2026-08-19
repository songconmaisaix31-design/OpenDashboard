# H2 Sentinel Integration Specification

## Scope

H6 composes the accepted H0-H5 modules without changing worker-owned source.
The generic Fixture Demo remains the default application. H2 Sentinel is
available only from the two explicit, equivalent `/h2-sentinel` and
`/h2-sentinel/` path literals with a closed `mode=fixture|local` query value.

## Acceptance criteria

- Fixture mode registers `h2EmsPlugin`, starts no Python process, resolves
  `H2_EMS_DATA_SOURCE`, and renders `H2SentinelApp`.
- Local mode registers `createH2EmsPlugin({ enabled: true, baseUrl:
  window.location.origin })` and reaches analytics only through the fixed
  same-origin `/api/v1/h2-sentinel` proxy.
- Web development and preview listeners bind to `127.0.0.1` with strict ports.
  The proxy target is constructed only from a validated analytics port and is
  always `http://127.0.0.1:<port>`.
- The launcher owns foreground child processes, waits for the canonical health
  success envelope, emits one machine-readable ready record, and cleans its
  complete child process trees on failure or shutdown.
- Fixture launch does not require `uv`, Python, an analytics listener, or an LLM
  credential. Local launch uses the committed `uv.lock` environment.
- No launcher option accepts a command, executable path, filesystem path,
  hostname, or arbitrary URL. The optional external sidecar URL accepts only
  `http://127.0.0.1:<port>/` and is never treated as an owned process.

## Risks and controls

- **Network exposure:** fixed loopback bind, strict ports, closed proxy target,
  and literal-loopback validation.
- **Process leaks:** platform-specific process-group or Windows PID-tree cleanup
  with focused shutdown and failure smoke tests.
- **Configuration injection:** argument arrays only; no shell command strings,
  `.env` loading, dynamic imports, or user-selected process commands.
- **Claim drift:** Fixture and Live provenance remain supplied by the accepted
  data sources; generated artifacts are test evidence and stay ignored.

## Verification

Run root npm checks, H2 checks, locked `uv` checks, 24 Python tests, golden and
submission validation, launcher fixture/local/failure/shutdown smokes, visual
checks at desktop and narrow widths, `git diff --check`, and the H6 write-set
audit before handoff.
