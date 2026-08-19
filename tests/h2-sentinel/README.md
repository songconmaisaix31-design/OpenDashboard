# H2 Sentinel Independent QA

This directory is the independent H2 Sentinel black-box QA lane. Its tests
consume the frozen contract package and public runtime boundaries; they do not
modify analytics, plugin, Web, integration, or submission code.

## H0 contract gate

Run from the repository root:

```bash
node tests/h2-sentinel/run-contract-qa.mjs
node --test "tests/h2-sentinel/contract/*.test.mjs"
git diff --check
```

The first two commands are dependency-free and validate the frozen JSON/CSV
contracts plus deliberate assembly `SKIP` rows. The repository's TypeScript
contract-owner suite can be run separately after the integration environment
installs its existing lockfile dependencies; this QA lane does not mutate root
dependencies to make that optional command available.

## Assembly-required commands

The following commands are executable now but intentionally return `SKIP` until
H1/H2/H3/H6 assemble the matching public endpoint. They require no root script
or dependency change.

```bash
node tests/h2-sentinel/api/run-api-safety.mjs
node tests/h2-sentinel/golden-path/run-offline-golden-path.mjs
```

Set `H2_ANALYTICS_URL` only to a loopback URL when running the API health and
redaction probe. Set `H2_WEB_URL` only to a locally assembled Web entry when
running the offline entry smoke probe. These scripts fail on an explicitly
non-loopback configuration rather than connecting to a remote host.

See `ACCEPTANCE_MATRIX.md` for the complete H0/assembly separation and
`DEFECT_LOG.md` for the mandatory defect record format.
