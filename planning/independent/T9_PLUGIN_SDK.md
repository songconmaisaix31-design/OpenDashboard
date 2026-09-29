# T9 — Plugin SDK Metadata and Compatibility Contract

Status: independent planning proposal; no implementation

Date: 2026-08-16

## Decision summary

Define a strict, inert JSON manifest for plugin identity, SDK compatibility,
capability declarations, and provenance. A future host may validate and
negotiate this metadata before initialization, but this proposal does not
define how code is found, loaded, installed, executed, isolated, or trusted.

The contract deliberately keys compatibility to the SDK API rather than the
OpenDashboard product version. This avoids unnecessary host-version coupling:
a plugin remains compatible when the host changes without changing the SDK
surface it consumes.

This task is complete when the manifest fields, compatibility algorithm,
lifecycle states, stable failure codes, static examples, trust boundary, and
contract checks below can be reviewed without another planning task.

## Scope and non-goals

This proposal owns only:

- plugin identity and descriptive metadata;
- SDK API and capability compatibility declarations;
- self-declared provenance and static fixture integrity metadata;
- an abstract initialization lifecycle and stable, sanitized failures; and
- deterministic contract checks over inert data.

It does not define a loader, entrypoint, dynamic import, executable hook,
provider adapter, package format, dependency resolver, installation flow,
marketplace, remote registry, signature, publisher identity, trust store,
sandbox, permission grant, secret/configuration flow, or cross-task model
mapping. No field in this contract authorizes an operation.

## Terms

- **Manifest**: an untrusted JSON declaration. Successful validation proves
  only that the declaration conforms to this contract.
- **Host**: a future consumer that publishes supported manifest, SDK API, and
  capability versions. No host implementation exists in this task.
- **Capability**: a namespaced feature claim that the host knows how to
  consume. It is neither permission nor proof of behavior.
- **Fixture payload**: immutable, non-secret bytes referenced by a fixture
  manifest. Static examples are data and must never be executed.
- **Initialization attempt**: one abstract lifecycle instance for one
  validated manifest. Runtime mechanics are intentionally unspecified.

Normative terms `MUST`, `MUST NOT`, `SHOULD`, and `MAY` apply to a future
implementation of this proposal, not to the current competition build.

## Manifest contract

The v1 logical shape is JSON-compatible and language-neutral. The TypeScript
notation below is descriptive; it is not application source.

```ts
interface PluginManifestV1 {
  manifestVersion: 1
  id: string
  displayName: string
  pluginVersion: string
  description: string
  compatibility: {
    sdkApi: {
      min: string
      maxExclusive: string
    }
  }
  capabilities: Array<{
    id: string
    version: number
    required: boolean
  }>
  provenance: {
    declaredMode: 'fixture' | 'live'
    mocked: boolean
    sourceId: string
    fixture: {
      contentType: 'application/json'
      sha256: string
    } | null
    limitations: string[]
  }
}
```

### Field rules

| Field | Normative rule | Why it matters |
|---|---|---|
| Entire document | Strict UTF-8 JSON object, at most 64 KiB before parsing; duplicate keys and unknown fields are rejected | Bounds untrusted input and prevents ignored fields from looking effective |
| `manifestVersion` | Positive integer; this contract defines version `1` and a v1 host rejects any other value as unsupported | Separates serialization evolution from SDK API evolution |
| `id` | 3-128 characters matching `^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$` | Provides stable, namespaced identity without a registry |
| `displayName` | 1-80 characters; control characters rejected | Keeps display metadata bounded; consumers still escape it as untrusted text |
| `pluginVersion` | Canonical stable SemVer `MAJOR.MINOR.PATCH`; no prerelease or build suffix in v1 | Makes identity comparisons deterministic |
| `description` | 1-240 characters; control characters rejected | Allows concise explanation without turning metadata into an arbitrary document |
| `compatibility.sdkApi.min` | Inclusive canonical stable SemVer | Declares the oldest SDK API the plugin expects |
| `compatibility.sdkApi.maxExclusive` | Exclusive canonical stable SemVer and greater than `min` | Creates a bounded range and prevents accidental compatibility with a breaking major |
| `capabilities` | 1-32 entries; one entry per capability ID | Keeps negotiation bounded and unambiguous |
| Capability `id` | Same namespaced pattern and length bound as plugin `id` | Avoids a global unqualified-name collision |
| Capability `version` | Integer from 1 through 65,535 | Uses exact, inexpensive protocol-version negotiation |
| Capability `required` | Boolean | Distinguishes a hard dependency from optional enhancement |
| `provenance.declaredMode` | `fixture` or `live` | Records the author's declared data mode without claiming host verification |
| `provenance.mocked` | Must be `true` for `fixture` and `false` for `live` | Prevents internally contradictory provenance |
| `provenance.sourceId` | 1-160 printable characters; opaque and never dereferenced | Gives evidence a stable label without introducing a URL, path, or loader |
| `provenance.fixture` | Required for `fixture`, `null` for `live` | Keeps fixture integrity data explicit and mode-specific |
| Fixture `contentType` | Exactly `application/json` in v1 | Avoids content sniffing and executable formats |
| Fixture `sha256` | Exactly 64 lowercase hexadecimal characters | Identifies exact fixture bytes; it does not authenticate an author |
| `provenance.limitations` | 1-16 non-empty entries, each at most 200 characters | Makes omitted behavior visible rather than implied |

All strings MUST be normalized to Unicode NFC before semantic comparison.
Normalization is not permission to rewrite or silently repair a manifest; a
non-canonical input is rejected. Serialized object-key order and capability
array order have no semantic meaning.

The manifest intentionally contains no `entrypoint`, command, module path,
download URL, dependency, permission, secret, environment, signature, or
publisher field. Adding one would cross the trust boundary and requires a new
reviewed contract version.

## Compatibility contract

A future host exposes these inputs to the metadata check:

```ts
interface HostPluginContractSupport {
  manifestVersions: number[]
  sdkApiVersion: string
  capabilities: Array<{ id: string; versions: number[] }>
}
```

Compatibility is evaluated in this fixed order:

1. Validate document size, UTF-8, JSON object form, duplicate keys, and the
   presence of a positive-integer `manifestVersion` envelope field.
2. Require `manifestVersion` to be present in the host's supported set, then
   validate that version's strict shape, field bounds, normalization, and
   semantic invariants.
3. For fixture mode, compute SHA-256 over the referenced payload's exact bytes
   before parsing or re-serialization and compare it in constant time with the
   declared digest.
4. Parse versions using SemVer rules, never lexical string comparison. Require
   `min <= host.sdkApiVersion < maxExclusive`.
5. Match each capability by exact `(id, version)`. An unsupported required
   capability fails compatibility. An unsupported optional capability is
   reported as unavailable and does not fail compatibility.
6. Sort enabled and unavailable capability results by `id`, then `version`, so
   equivalent inputs produce identical output.

The plugin's own `pluginVersion` identifies the declaration but is not a host
compatibility range. Host product version, operating system, runtime language,
and other plugins are excluded from v1 because no corresponding runtime
contract exists.

A successful result means only **metadata-compatible**. It does not mean the
plugin is installed, authentic, authorized, initialized, healthy, or safe to
execute.

## Lifecycle contract

The lifecycle is an abstract state machine for a future host. The first three
states are metadata-only and MUST NOT load or execute plugin content.

| State | Meaning | Allowed next state |
|---|---|---|
| `declared` | Untrusted manifest input is present | `validated`, `failed` |
| `validated` | Shape, invariants, and applicable fixture digest passed | `compatible`, `failed` |
| `compatible` | SDK API and required capabilities are supported | `initializing` |
| `initializing` | A future runtime has begun one initialization attempt | `ready`, `failed` |
| `ready` | The future runtime reported successful initialization | `stopped` |
| `failed` | The attempt ended with one stable sanitized error | None in v1 |
| `stopped` | The ready instance completed an explicit stop | None in v1 |

Any transition not listed above returns
`plugin_lifecycle_transition_invalid` and leaves the current state unchanged.
Retry, restart, hot reload, concurrent initialize/stop, degraded operation, and
failure recovery are deferred. Treating `failed` and `stopped` as terminal in
v1 avoids unsafe implicit retries and duplicate side effects.

## Stable initialization failures

Only `code`, `stage`, `pluginId`, and `retryable` are stable API fields.
`message` is concise English display text and MAY improve without a contract
version. `safeDetails` is optional and may contain only a validated JSON field
name, validated capability ID/version, or supported version list.

```ts
interface PluginInitializationFailure {
  code: PluginInitializationErrorCode
  stage: 'manifest' | 'compatibility' | 'initialization' | 'lifecycle'
  pluginId: string | null
  retryable: false
  message: string
  safeDetails?: {
    field?: string
    capabilityId?: string
    capabilityVersion?: number
    supportedVersions?: Array<string | number>
  }
}
```

| Code | Stage | Condition |
|---|---|---|
| `plugin_manifest_invalid` | `manifest` | Invalid JSON, bounds, type, format, normalization, duplicate key/capability ID, unknown field, or cross-field invariant outside provenance |
| `plugin_manifest_version_unsupported` | `manifest` | Well-formed `manifestVersion` is not supported |
| `plugin_provenance_invalid` | `manifest` | Fixture/live, mocked, fixture object, content type, source ID, or limitations are inconsistent or invalid |
| `plugin_fixture_integrity_mismatch` | `manifest` | Exact fixture payload bytes do not match the declared SHA-256 |
| `plugin_sdk_api_incompatible` | `compatibility` | Host SDK API is outside the declared half-open range |
| `plugin_required_capability_unsupported` | `compatibility` | A required exact capability ID/version is unsupported |
| `plugin_lifecycle_transition_invalid` | `lifecycle` | Requested transition is not present in the lifecycle table |
| `plugin_initialization_timeout` | `initialization` | A future runtime reaches its configured initialization deadline |
| `plugin_initialization_failed` | `initialization` | A future runtime fails initialization for another sanitized reason |

All v1 failures are `retryable: false`. A timeout does not prove that future
plugin code stopped, so an automatic retry could duplicate side effects. Retry
semantics require a later lifecycle decision.

When more than one issue exists, the compatibility algorithm's earlier step
wins. Within one step, fields are checked in the fixed contract order listed
in the shape above, and unsupported required capabilities are sorted by
ID/version before selecting the first error. `pluginId` is `null` until `id`
validates.

Failures MUST NOT include raw manifest content, fixture payloads, absolute
paths, URLs, credentials, environment values, stack traces, or underlying
exception text.

## Static contract fixtures

These examples are inert documentation fixtures. They define no file import,
loader, provider, or executable behavior.

### Host support used by the examples

```json
{
  "manifestVersions": [1],
  "sdkApiVersion": "1.2.0",
  "capabilities": [
    { "id": "example.value.read", "versions": [1] }
  ]
}
```

### Compatible fixture manifest

The referenced payload is the exact UTF-8 byte sequence
`{"value":"fixture"}` with no byte-order mark and no trailing newline. Its
SHA-256 is
`bc2674594440583782c17d5cf875c88037498d39f5661b6a5962dcf6089752c0`.

```json
{
  "manifestVersion": 1,
  "id": "dev.opendashboard.example-fixture",
  "displayName": "Example Fixture Plugin",
  "pluginVersion": "1.0.0",
  "description": "Static metadata-contract fixture; not executable.",
  "compatibility": {
    "sdkApi": {
      "min": "1.0.0",
      "maxExclusive": "2.0.0"
    }
  },
  "capabilities": [
    { "id": "example.value.read", "version": 1, "required": true },
    { "id": "example.note.read", "version": 1, "required": false }
  ],
  "provenance": {
    "declaredMode": "fixture",
    "mocked": true,
    "sourceId": "fixture:plugin-sdk/example-value/v1",
    "fixture": {
      "contentType": "application/json",
      "sha256": "bc2674594440583782c17d5cf875c88037498d39f5661b6a5962dcf6089752c0"
    },
    "limitations": [
      "Static fixture only; no external system is contacted."
    ]
  }
}
```

Expected result: metadata-compatible; `example.value.read@1` enabled and
`example.note.read@1` explicitly unavailable.

### SDK-incompatible fixture manifest

```json
{
  "manifestVersion": 1,
  "id": "dev.opendashboard.future-fixture",
  "displayName": "Future SDK Fixture",
  "pluginVersion": "1.0.0",
  "description": "Static fixture requiring a future SDK API.",
  "compatibility": {
    "sdkApi": {
      "min": "2.0.0",
      "maxExclusive": "3.0.0"
    }
  },
  "capabilities": [
    { "id": "example.value.read", "version": 1, "required": true }
  ],
  "provenance": {
    "declaredMode": "fixture",
    "mocked": true,
    "sourceId": "fixture:plugin-sdk/example-value/v1",
    "fixture": {
      "contentType": "application/json",
      "sha256": "bc2674594440583782c17d5cf875c88037498d39f5661b6a5962dcf6089752c0"
    },
    "limitations": [
      "Static fixture only; no external system is contacted."
    ]
  }
}
```

Expected result against the example host:
`plugin_sdk_api_incompatible`; state becomes `failed`; no initialization is
attempted.

## Trust boundary

- Every manifest field, including `displayName`, `description`, `sourceId`,
  mode, and limitations, is untrusted self-declaration and must be safely
  escaped when displayed.
- `declaredMode: "live"` is not proof of a live integration. Until a separate
  trust design exists, consumers must present it as an unverified declaration.
- SHA-256 detects a change in exact fixture bytes. It does not identify a
  publisher, prove authorship, make content safe, or authorize execution.
- Manifest validation, compatibility, and lifecycle state do not grant file,
  process, shell, network, environment, credential, or secret access.
- Static fixture JSON is data only. No string from a manifest or fixture may be
  interpreted as code, a module path, a command, a URL to fetch, or an import
  instruction.
- A future ingestion design must independently validate filename, extension,
  declared content type, actual content type, byte length, and digest before
  dispatch or import. That ingestion design is outside T9.
- Error and audit surfaces retain only validated identifiers and stable codes;
  they never echo raw untrusted or sensitive content.

## Acceptance checks

These are contract-level cases for a future validator. The repository has no
validator or runtime, so this task does not claim that executable tests ran.

| ID | Check | Expected result |
|---|---|---|
| `T9-C01` | Validate the compatible fixture and exact payload against the example host | Compatible; required capability enabled; optional unknown capability unavailable |
| `T9-C02` | Use 64 KiB exactly, then 64 KiB plus one byte; add an unknown field or duplicate JSON key | Boundary accepted only if all other rules pass; oversized/unknown/duplicate input returns `plugin_manifest_invalid` |
| `T9-C03` | Mutate ID, stable SemVer, range ordering, string bounds, or duplicate a capability ID | `plugin_manifest_invalid`; no compatibility or initialization step |
| `T9-C04` | Set fixture mode with `mocked: false`, `fixture: null`, empty limitations, or a non-JSON content type | `plugin_provenance_invalid` |
| `T9-C05` | Change one payload byte without changing the digest | `plugin_fixture_integrity_mismatch` before payload parsing |
| `T9-C06` | Test SDK API at `min`, immediately below `maxExclusive`, and exactly at `maxExclusive` | First two compatible; exclusive maximum returns `plugin_sdk_api_incompatible` |
| `T9-C07` | Make an unsupported capability required, then optional | Required returns `plugin_required_capability_unsupported`; optional remains compatible and is reported unavailable |
| `T9-C08` | Supply multiple independent faults in different input orders | Same primary error follows the fixed precedence and sort rules |
| `T9-C09` | Walk `declared -> validated -> compatible -> initializing -> ready -> stopped` | Every transition succeeds exactly once |
| `T9-C10` | Attempt initialization from `declared`, stop from `compatible`, or any transition from a terminal state | `plugin_lifecycle_transition_invalid`; current state unchanged |
| `T9-C11` | Inject a path, URL, control character, token-like value, or exception text into rejected input | Failure exposes none of it; only the stable sanitized envelope remains |
| `T9-C12` | Inspect the contract and examples for executable/import/install fields or cross-task mappings | None present |

## Assumptions

- A future host can provide one canonical SDK API version and a bounded table
  of supported capability versions.
- Stable SemVer parsing and SHA-256 are available through the eventual
  platform or an already approved dependency; no dependency is selected here.
- Fixture payloads are deterministic, non-secret, and small enough to hash
  before parsing.
- Manifest validation occurs before any runtime action, and the future host
  preserves the failure envelope without leaking underlying errors.
- No source, runtime, package manager, plugin artifact, or live provider exists
  in this planning task.

## Risks and bounded mitigations

| Risk | Impact | Contract mitigation |
|---|---|---|
| Self-declared provenance is mistaken for verification | Users may trust mocked or unverified data | Names the field `declaredMode`, requires limitations, and states that compatibility is not trust |
| Capability namespaces collide or are misleading | Hosts may bind the wrong semantics | Requires namespaced IDs and exact versions; a governed catalog is deferred |
| SemVer range passes while behavior is incompatible | Initialization may still fail | Compatibility is explicitly metadata-only and initialization has stable failure codes |
| Digest is treated as identity or safety proof | Malicious but unchanged content may appear trusted | Limits the digest claim to byte integrity and prohibits execution |
| Timeout followed by automatic retry duplicates effects | Future runtime state may become inconsistent | All v1 failures are non-retryable and failed attempts are terminal |
| Strict v1 schema makes evolution deliberate | New metadata requires versioned work | Rejects unknown fields instead of silently ignoring them |

## Deferred decisions

- Runtime language, SDK packaging, loader, entrypoint, and executable hooks.
- Plugin discovery, installation, upgrade, removal, dependency resolution,
  marketplace, and registry behavior.
- Publisher identity, signing, attestations, revocation, trust store, and supply
  chain policy.
- Sandbox, permissions, authorization, configuration, secrets, and resource
  quotas.
- Canonical capability catalog, namespace governance, and capability behavior.
- Provider-specific adapters and all mappings to other domain models.
- Retry, cancellation, cleanup, shutdown failure, hot reload, concurrency, and
  crash recovery.
- Host-owned provenance verification beyond fixture byte integrity.
- Manifest transport, filename conventions, storage, indexing, telemetry, and
  audit persistence.
- Compatibility behavior for prerelease SDKs, multiple simultaneous SDK API
  versions, operating systems, runtime languages, or host product versions.

These decisions require separate post-competition reconciliation. None changes
or blocks the active competition plan.
