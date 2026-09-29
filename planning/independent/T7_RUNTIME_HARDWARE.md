# T7 — Runtime and Hardware Snapshot Contract

Status: independent planning proposal; no implementation

## Decision

Define one immutable, read-only snapshot from one provider at a caller-supplied
evaluation time. Every required datum is present as one of four explicit
states: `known`, `stale`, `unknown`, or `unsupported`.

This contract is provider-neutral because providers normalize into the same
allowlisted shape. It does not define collection, transport, persistence, UI,
monitoring, runtime control, or relationships to any other domain model. It is
not part of the competition `DemoSnapshot` or a gate for T0-T4; adoption would
require a separate post-competition decision.

## User value and trust boundary

The contract answers a narrow question: "What can this provider safely say
about one runtime and its aggregate hardware at a specific time?" A consumer
can distinguish a current observation from a cached value, a failed
observation from a provider limitation, and a known absent capability from an
unobservable one.

The proposal never enumerates processes or sessions and never identifies a
machine or person. It permits only coarse runtime identity, aggregate resource
values, and coarse capability presence. A snapshot is evidence supplied by a
provider, not proof that the provider controls the runtime or that values are
still current after `evaluatedAt`.

## Scope

The v1 snapshot contains only:

- coarse runtime platform, CPU architecture, and execution environment;
- aggregate logical CPU and memory capacity;
- point-in-time aggregate CPU and available-memory observations;
- coarse graphics, compute-acceleration, and virtualization capability
  presence;
- provider provenance, freshness policy, and redaction evidence.

The v1 snapshot intentionally excludes:

- process, service, container, session, user, and workspace inventories;
- host names, device names, serial numbers, stable device identifiers, network
  addresses, mount points, and absolute paths;
- command lines, environment variables, request data, raw provider payloads,
  logs, traces, and secrets;
- actions, approvals, incidents, diagnostics, plugins, provider discovery, and
  cross-model identifiers;
- streaming, polling, subscriptions, alerts, storage, export, transport, and
  UI behavior.

## Proposed v1 contract

The TypeScript below specifies data shape only. It is not application code or
an implementation commitment.

```ts
type IsoUtcTimestamp = string

type PlatformFamily = 'windows' | 'linux' | 'macos' | 'other'
type CpuArchitecture = 'x86_32' | 'x86_64' | 'arm64' | 'riscv64' | 'other'
type EnvironmentKind =
  | 'host'
  | 'virtual_machine'
  | 'container'
  | 'subsystem'
  | 'managed'
  | 'other'

type CapabilityPresence = 'present' | 'absent'
type FreshnessClass = 'identity' | 'capacity' | 'utilization' | 'capability'

type UnknownReason =
  | 'not_reported'
  | 'temporarily_unavailable'
  | 'permission_denied'
  | 'collection_failed'
  | 'invalid_source_value'
  | 'redacted_by_policy'

type UnsupportedReason =
  | 'provider_not_capable'
  | 'platform_not_applicable'
  | 'contract_scope_excluded'

type Observation<T> =
  | {
      state: 'known'
      value: T
      observedAt: IsoUtcTimestamp
      freshnessClass: FreshnessClass
    }
  | {
      state: 'stale'
      value: T
      observedAt: IsoUtcTimestamp
      staleSince: IsoUtcTimestamp
      freshnessClass: FreshnessClass
    }
  | {
      state: 'unknown'
      reason: UnknownReason
      attemptedAt: IsoUtcTimestamp
    }
  | {
      state: 'unsupported'
      reason: UnsupportedReason
      declaredAt: IsoUtcTimestamp
    }

type SourceLimitation =
  | 'fixture_only'
  | 'cached_observations'
  | 'partial_inventory'
  | 'coarse_identity_only'

interface SnapshotProvenance {
  providerId: string
  providerVersion: string
  mode: 'fixture' | 'live'
  mocked: boolean
  fixtureId: string | null
  collectedAt: IsoUtcTimestamp
  limitations: SourceLimitation[]
  redactionPolicyId: 'runtime-hardware-redaction-v1'
  rawPayloadRetained: false
}

interface FreshnessPolicyV1 {
  policyId: 'runtime-hardware-freshness-v1'
  maxAgeMs: {
    identity: 300_000
    capacity: 300_000
    utilization: 30_000
    capability: 300_000
  }
}

interface RuntimeHardwareSnapshotV1 {
  schemaVersion: 1
  snapshotId: string
  evaluatedAt: IsoUtcTimestamp
  provenance: SnapshotProvenance
  freshnessPolicy: FreshnessPolicyV1
  runtime: {
    platformFamily: Observation<PlatformFamily>
    cpuArchitecture: Observation<CpuArchitecture>
    environmentKind: Observation<EnvironmentKind>
  }
  resources: {
    logicalProcessorCount: Observation<number>
    cpuUtilizationPercent: Observation<number>
    memoryTotalBytes: Observation<number>
    memoryAvailableBytes: Observation<number>
  }
  capabilities: {
    graphicsAcceleration: Observation<CapabilityPresence>
    computeAcceleration: Observation<CapabilityPresence>
    hardwareVirtualization: Observation<CapabilityPresence>
  }
  redaction: {
    applied: true
    policyId: 'runtime-hardware-redaction-v1'
    removedCategories: RedactedCategory[]
  }
}

type RedactedCategory =
  | 'credentials'
  | 'user_identity'
  | 'machine_identity'
  | 'network_identity'
  | 'filesystem_location'
  | 'process_detail'
  | 'provider_raw_data'
```

All object members are required. A provider must emit an explicit state rather
than omit, use `null`, use a sentinel number, or infer support from an empty
array. `other` is a closed coarse value; no provider-specific label accompanies
it in v1.

## Field semantics and validation

| Field | Freshness class | Valid known/stale value |
|---|---|---|
| `runtime.platformFamily` | `identity` | One `PlatformFamily` value |
| `runtime.cpuArchitecture` | `identity` | One `CpuArchitecture` value |
| `runtime.environmentKind` | `identity` | One `EnvironmentKind` value |
| `resources.logicalProcessorCount` | `capacity` | Positive safe integer |
| `resources.cpuUtilizationPercent` | `utilization` | Finite number from 0 through 100 |
| `resources.memoryTotalBytes` | `capacity` | Positive safe integer bytes |
| `resources.memoryAvailableBytes` | `utilization` | Non-negative safe integer bytes, not greater than a known or stale total |
| Each `capabilities.*` field | `capability` | `present` or `absent` |

`present` and `absent` describe a known capability result. `unsupported` means
the provider cannot make that determination; it never means the capability is
absent. `unknown` means the provider claims the field is in scope but could not
produce a valid value for this snapshot.

If `memoryTotalBytes` has neither a `known` nor `stale` value,
`memoryAvailableBytes` is validated only as a non-negative safe integer. A
provider must not synthesize a total from the available value. Percentages use
one normalized 0-to-100 scale across all logical processors; a provider unable
to normalize safely returns `unknown` with `invalid_source_value`.

## Freshness rules

1. `evaluatedAt`, `collectedAt`, and every observation timestamp are RFC 3339
   UTC timestamps with a `Z` suffix. Fixture evaluation time is injected; no
   fixture reads the ambient clock.
2. A `known` or `stale` value uses the threshold for its declared
   `freshnessClass`. It is `known` while
   `evaluatedAt <= observedAt + maxAgeMs`; it is `stale` only after that exact
   boundary.
3. `staleSince` equals `observedAt + maxAgeMs`. A stale value is preserved as
   last-known evidence and must not be silently replaced with `unknown`.
4. `unknown` has no value. `attemptedAt` records the safe collection-attempt
   time, not the time of a fabricated observation.
5. `unsupported` has no value and no freshness. `declaredAt` records when the
   provider made its capability declaration. A new snapshot must repeat the
   declaration rather than rely on prior state.
6. A timestamp later than `evaluatedAt`, an incorrect freshness class, or a
   mismatched `staleSince` is a contract violation. Clock skew handling is not
   guessed in v1.
7. A snapshot is immutable. Its classifications are assertions at
   `evaluatedAt`; the contract creates no polling or automatic refresh
   behavior.

The short utilization threshold prevents cached activity data from appearing
current. The five-minute thresholds are conservative planning defaults for
identity, capacity, and capability. Any future threshold change must use a new
policy ID so existing snapshots retain their meaning.

## Provenance rules

- V1 represents exactly one provider per snapshot and does not merge or rank
  sources. Multi-source reconciliation is deferred.
- `providerId` identifies an adapter contract, not a machine, endpoint, local
  executable, file path, account, or provider instance.
- `providerVersion` is the adapter contract version. It must not copy a full OS
  build string, device firmware identifier, or another machine fingerprint.
- `mode: 'fixture'` requires `mocked: true`, a non-null stable `fixtureId`, and
  the `fixture_only` limitation. `mode: 'live'` requires `mocked: false` and a
  null `fixtureId`. This proposal does not claim a live provider exists.
- `collectedAt` records when the provider assembled its safe response. Each
  field keeps its own evidence time because cached fields may be older.
- `limitations` contains only the stable allowlisted codes above. Free-form
  provider messages are prohibited.
- `snapshotId` is opaque. A fixture uses a fixed ID; a future live provider
  must not derive it from hardware values, a host identifier, or a user
  identifier.
- `rawPayloadRetained` is always `false`. The normalized contract is the only
  snapshot artifact permitted by this proposal.

## Redaction rules

Normalization is allowlist-first. Only the fields and enum values declared in
v1 may cross the snapshot boundary. Redaction occurs before a successful
result is exposed or retained.

The following data is always removed rather than hashed or pseudonymized:

- credentials, tokens, environment variables, request contents, and secret
  material;
- usernames, account IDs, security IDs, session IDs, and home directories;
- host names, serial numbers, device UUIDs, stable OS installation IDs, and
  provider instance IDs;
- IP addresses, MAC addresses, interface names, and remote endpoints;
- absolute paths, mount paths, volume labels, and file names;
- process IDs, process names, command lines, window titles, and session data;
- raw provider payloads, stack traces, and unbounded provider error strings.

Hashing a prohibited identifier does not make it allowed because the result is
still linkable. `removedCategories` reports only stable categories, never raw
field names or values. If the normalizer cannot prove that output conforms to
the allowlist, it returns `snapshot_redaction_failed` and no partial snapshot.
A permitted field intentionally withheld by policy is `unknown` with
`redacted_by_policy`.

## Stable result and error contract

```ts
type SnapshotErrorCode =
  | 'invalid_snapshot_request'
  | 'unsupported_snapshot_schema'
  | 'snapshot_source_unavailable'
  | 'snapshot_contract_violation'
  | 'snapshot_redaction_failed'

type SnapshotFieldId =
  | 'runtime.platformFamily'
  | 'runtime.cpuArchitecture'
  | 'runtime.environmentKind'
  | 'resources.logicalProcessorCount'
  | 'resources.cpuUtilizationPercent'
  | 'resources.memoryTotalBytes'
  | 'resources.memoryAvailableBytes'
  | 'capabilities.graphicsAcceleration'
  | 'capabilities.computeAcceleration'
  | 'capabilities.hardwareVirtualization'

interface SnapshotErrorV1 {
  schemaVersion: 1
  code: SnapshotErrorCode
  retryable: boolean
  occurredAt: IsoUtcTimestamp
  safeMessage: string
  fieldIds: SnapshotFieldId[]
}

type SnapshotResultV1 =
  | { ok: true; snapshot: RuntimeHardwareSnapshotV1 }
  | { ok: false; error: SnapshotErrorV1 }
```

| Error code | Retryable | Meaning |
|---|---:|---|
| `invalid_snapshot_request` | No | The requested schema, evaluation time, or declared policy input is malformed. |
| `unsupported_snapshot_schema` | No | The provider does not support the requested schema version. |
| `snapshot_source_unavailable` | Yes | No safe envelope or cached snapshot can be produced. |
| `snapshot_contract_violation` | No | Source output violates a type, range, timestamp, state, or provenance invariant. |
| `snapshot_redaction_failed` | No | Allowlist enforcement cannot prove that the output is safe. |

`safeMessage` is explanatory only and is not a branching contract. It contains
no raw provider text. `fieldIds` may contain only the required v1 field paths.
Unknown, stale, and unsupported fields are successful snapshot states, not
top-level errors. A top-level error is used only when no safe, valid snapshot
can be returned.

## Deterministic fixture cases

All fixtures use policy `runtime-hardware-freshness-v1`, fixed UTC times, fixed
IDs, and synthetic values. Successful fixtures use provider ID
`fixture.runtime-hardware`, provider version `1.0.0`, their table ID as
`fixtureId`, `collectedAt` equal to `evaluatedAt`, `fixture_only` as their first
limitation, `mode: 'fixture'`, and `mocked: true`. Their `snapshotId` is the
fixed string `snapshot/<fixtureId>`. A fixture contains no real machine
observation.

| Fixture ID | `evaluatedAt` | Required expectation |
|---|---|---|
| `runtime-hardware/fresh-v1` | `2026-01-01T00:05:00Z` | All fields are `known` and observed at `00:04:50Z`; the result is deeply equal across repeated loads. |
| `runtime-hardware/mixed-v1` | `2026-01-01T00:05:00Z` | CPU utilization is `stale` from an observation at `00:04:00Z` with `staleSince: 00:04:30Z`; available memory is `unknown` with `temporarily_unavailable` attempted at `00:04:58Z`; compute acceleration is `unsupported` with `provider_not_capable` declared at `00:04:58Z`; all other fields are `known` and observed at `00:04:50Z`. |
| `runtime-hardware/all-unknown-v1` | `2026-01-01T00:05:00Z` | Every required field is `unknown` with `not_reported`; the result remains `ok: true` and contains complete fixture provenance. |
| `runtime-hardware/redaction-v1` | `2026-01-01T00:05:00Z` | Synthetic forbidden input categories are absent from output; `removedCategories` lists their stable categories; `rawPayloadRetained` is `false`. |
| `runtime-hardware/source-unavailable-v1` | `2026-01-01T00:05:00Z` | Returns only `snapshot_source_unavailable` with `retryable: true`; no snapshot is present. |
| `runtime-hardware/future-time-v1` | `2026-01-01T00:05:00Z` | An observation at `00:05:01Z` returns only `snapshot_contract_violation`; no snapshot is present. |
| `runtime-hardware/redaction-failure-v1` | `2026-01-01T00:05:00Z` | An unclassifiable synthetic raw field returns only `snapshot_redaction_failed`; no snapshot is present. |

The `fresh-v1` value set is fixed for future contract tests: Linux, `x86_64`,
`host`, 8 logical processors, 42.5% CPU utilization, 17,179,869,184 total
memory bytes, 8,589,934,592 available memory bytes, graphics present, compute
acceleration absent, and hardware virtualization present. These are fixture
facts only.

## Acceptance checks

A future v1 implementation is acceptable only when all of these focused checks
pass:

1. Schema validation requires every v1 field and rejects extra output fields,
   `null`, sentinel numbers, non-finite numbers, and unrecognized enums.
2. State validation enforces exactly one branch: only `known` and `stale`
   contain a value; `unknown` and `unsupported` contain their respective stable
   reason and timestamp.
3. Range validation enforces processor, percentage, and byte constraints,
   including the available-memory relationship when total memory is known.
4. Freshness tests cover one millisecond before, exactly at, and one
   millisecond after each threshold, plus mismatched `staleSince` and future
   timestamps.
5. Provenance tests enforce fixture/live invariants, stable limitation codes,
   opaque IDs, a catalog-safe provider ID, and `rawPayloadRetained: false`.
6. Redaction tests inject only synthetic markers for every prohibited category
   and confirm that neither values nor raw field names occur anywhere in the
   successful JSON or stable error object.
7. Every fixture result is deeply equal across repeated evaluation and does
   not depend on the system clock, host, locale, process list, user session, or
   hardware APIs.
8. The mixed and all-unknown fixtures remain successful snapshots. Known
   absence, unknown, unsupported, and stale are asserted as distinct outcomes.
9. Every top-level error has the specified code and retryability, excludes a
   snapshot, and contains no raw provider details.
10. A static boundary review confirms that the contract adds no OS command,
    hardware API call, process/session enumeration, action, transport,
    persistence, monitoring, UI, or dependency.

## Assumptions

- One snapshot describes one logical runtime view from one provider.
- Provider collection occurs outside this contract; v1 specifies only the
  normalized result and validation boundary.
- UTC timestamps are available to a future caller and provider. V1 rejects
  clock contradictions instead of correcting them.
- Aggregate local resource values are useful without exposing stable machine
  identity.
- Fixture mode is the only mode relevant to the current competition baseline;
  `live` is a reserved contract value, not an implemented capability.

## Risks and mitigations

| Risk | Bounded mitigation in this proposal |
|---|---|
| Aggregate values can still contribute to machine fingerprinting. | Minimize fields, prohibit stable identifiers, forbid derived IDs, and defer any sharing/export profile. |
| Providers may use incompatible utilization or memory semantics. | Define normalized units and ranges; return `unknown` rather than guess. |
| A stale value may be mistaken for current truth. | Preserve the `stale` discriminator, evidence time, threshold, and evaluation time. |
| `unsupported` may be confused with known absence. | Use separate state and presence enums; test the distinction explicitly. |
| Free-form limitations or errors may leak provider data. | Use stable allowlisted codes and safe messages only. |
| Fixed freshness thresholds may not fit every live provider. | Version the policy and defer live-provider calibration. |
| Coarse enums may not represent future runtime or accelerator types. | Use `other` without raw labels and require schema review before adding values. |

## Deferred decisions

- Whether a live provider should exist, how it is authorized, and which safe
  collection APIs it may use.
- Multi-provider composition, source precedence, conflict resolution, and
  confidence scoring.
- Multi-runtime, multi-device, NUMA, storage, battery, thermal, network, and
  detailed accelerator models.
- Live-provider freshness calibration, clock-skew tolerance, refresh triggers,
  and caching behavior.
- Persistence, retention, export, external-sharing redaction profiles, access
  control, transport, and UI presentation.
- Platform-specific normalization tables and conformance suites.
- Reconciliation with application contracts or any other independent planning
  model after the competition freeze.

None of these deferred decisions is required to review, postpone, discard, or
later implement this standalone snapshot proposal.
