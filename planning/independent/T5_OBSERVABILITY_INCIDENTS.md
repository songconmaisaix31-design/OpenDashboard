# T5 — Observability and Incident Contract Proposal

Status: complete planning proposal; no implementation

## Decision

Define a small, provider-neutral contract that turns already normalized,
redacted observations and evidence into deterministic incident episodes. The
contract keeps service condition, observation availability, and incident
lifecycle separate so that missing or untrustworthy telemetry can never be
misreported as recovery.

This proposal is independent future planning. It does not change
`API_CONTRACT.md`, authorize implementation, or create an acceptance gate for
the competition build.

## User and reliability value

A developer must be able to answer three different questions without hidden
inference:

1. What condition was observed for a subject?
2. Can the supporting evidence be trusted and is it still fresh?
3. Did a deterministic incident rule open, recover, or resolve an episode?

Separating those answers prevents the most harmful observability failure:
treating absent, stale, malformed, or fixture-owned data as a healthy system.
Deterministic identifiers and transitions also make fixture runs reproducible
and exported evidence auditable.

## Scope and boundaries

This plan owns only:

- normalized observation and evidence records;
- provenance invariants;
- incident rules, grouping, deduplication, severity, and lifecycle;
- stable `unknown`, `stale`, and `error` evaluation states;
- deterministic fixture cases and contract-level acceptance checks.

This plan does not define collectors, provider adapters, payload mappings,
storage, retention, transport, network access, streaming, reconciliation, UI,
notifications, actions, approvals, process control, plugin behavior, or any
mapping to another domain model. Free-form log text and provider payloads are
never decision inputs.

The words **MUST**, **MUST NOT**, **SHOULD**, and **MAY** describe proposed
contract requirements, not implemented behavior.

## Contract vocabulary

- **Observation**: one normalized claim about one subject and signal at a
  specific event time.
- **Evidence**: one redacted, integrity-addressed set of facts supporting one
  observation.
- **Rule**: a versioned, deterministic policy that selects observations,
  groups them, and defines trigger and recovery thresholds.
- **Evaluation scope**: the exact source, mode, subject, and grouping
  dimensions being evaluated at an explicit time.
- **Incident group**: observations sharing one rule and one grouping
  fingerprint.
- **Incident episode**: one non-reopenable lifecycle from trigger to
  resolution within an incident group.
- **Condition**: the subject claim `healthy`, `degraded`, or `failed`.
- **Evaluation state**: whether a trustworthy current condition is `known`,
  `unknown`, `stale`, or `error`.

`error` is reserved for contract or evidence-integrity failure. A service
failure is represented by condition `failed`, never by evaluation state
`error`.

## Proposed v1 data contract

The following TypeScript-like declarations are normative data shapes only;
they are not an implementation or transport API.

```ts
type ContractVersion = 1
type Timestamp = string
type Scalar = string | number | boolean | null

type SourceMode = 'fixture' | 'live'
type Condition = 'healthy' | 'degraded' | 'failed'
type Severity = 'critical' | 'high' | 'medium' | 'low'
type IncidentStatus = 'open' | 'recovering' | 'resolved'

type EvidenceKind =
  | 'http'
  | 'trace'
  | 'log'
  | 'metric'
  | 'resource'
  | 'assertion'

interface Provenance {
  source: string
  mode: SourceMode
  mocked: boolean
  observedAt: Timestamp
  limitations: string[]
}

interface ObservationRecord {
  schemaVersion: ContractVersion
  observationId: string
  sourceRecordKey: string | null
  subjectKey: string
  signal: string
  condition: Condition
  observedAt: Timestamp
  dimensions: Record<string, string>
  provenance: Provenance
}

interface EvidenceRecord {
  schemaVersion: ContractVersion
  evidenceId: string
  sourceRecordKey: string | null
  observationId: string
  kind: EvidenceKind
  capturedAt: Timestamp
  summaryCode: string
  summary: string
  facts: Record<string, Scalar>
  redacted: true
  redactionProfile: string
  contentDigest: string
  provenance: Provenance
}

interface IncidentRule {
  ruleId: string
  ruleVersion: number
  signal: string
  groupBy: string[]
  severity: Severity
  trigger: {
    conditions: Array<'degraded' | 'failed'>
    minimumCount: number
    windowMs: number
  }
  recovery: {
    condition: 'healthy'
    minimumCount: number
    windowMs: number
  }
  freshnessMs: number
}

interface EvaluationScope {
  source: string
  mode: SourceMode
  mocked: boolean
  subjectKey: string
  dimensions: Record<string, string>
}

type ContractErrorCode =
  | 'unsupported_schema'
  | 'invalid_rule'
  | 'invalid_scope'
  | 'invalid_observation'
  | 'invalid_evidence'
  | 'invalid_provenance'
  | 'observation_dedupe_conflict'
  | 'evidence_dedupe_conflict'
  | 'missing_evidence'
  | 'invalid_evidence_digest'

type EvaluationState =
  | { state: 'known'; condition: Condition }
  | { state: 'unknown'; reason: 'no_observation' }
  | {
      state: 'stale'
      reason: 'freshness_expired'
      lastObservedAt: Timestamp
    }
  | {
      state: 'error'
      reason: ContractErrorCode
      recordIds: string[]
    }

interface LifecycleTransition {
  transitionId: string
  from: IncidentStatus | null
  to: IncidentStatus
  occurredAt: Timestamp
  causeObservationIds: string[]
}

interface IncidentProvenance {
  source: string
  mode: SourceMode
  mocked: boolean
  limitations: string[]
}

interface IncidentRecord {
  schemaVersion: ContractVersion
  incidentId: string
  groupFingerprint: string
  ruleId: string
  ruleVersion: number
  subjectKey: string
  groupDimensions: Record<string, string>
  severity: Severity
  status: IncidentStatus
  openedAt: Timestamp
  recoveringAt: Timestamp | null
  resolvedAt: Timestamp | null
  lastObservedAt: Timestamp
  observationIds: string[]
  evidenceIds: string[]
  transitions: LifecycleTransition[]
  provenance: IncidentProvenance
}

interface IncidentEvaluation {
  schemaVersion: ContractVersion
  evaluatedAt: Timestamp
  groupFingerprint: string | null
  state: EvaluationState
  currentIncident: IncidentRecord | null
  completedIncidents: IncidentRecord[]
}
```

### Field invariants

- All timestamps MUST be UTC RFC 3339 strings with millisecond precision, for
  example `2026-08-16T12:00:00.000Z`.
- Identifiers, signal codes, rule IDs, dimension names, source names,
  `summaryCode`, and `redactionProfile` MUST use the ASCII pattern
  `[a-z0-9][a-z0-9._:/-]{0,127}`.
- IDs present in records MUST exactly match the values derived by this
  contract. A supplied ID is never trusted as an alternate identity.
- Rule versions, threshold counts, threshold windows, and freshness windows
  MUST be positive integers. `contentDigest` MUST be 64 lowercase hexadecimal
  characters.
- Dimension values MUST be non-secret, already normalized Unicode NFC strings.
  The aggregator MUST NOT trim, case-fold, parse, or infer meaning from them.
- Object keys, ID arrays, error `recordIds`, transition causes, and
  `limitations` MUST be unique and sorted by Unicode code point in serialized
  output. Rule `groupBy` and trigger conditions are treated as sets and MUST
  also be unique and sorted.
- `observedAt` on provenance MUST equal the observation's `observedAt` or the
  evidence's `capturedAt`.
- `mode: 'fixture'` requires `mocked: true` and at least one limitation.
  `mode: 'live'` requires `mocked: false`; this shape does not authorize a live
  integration.
- Every observation eligible for evaluation MUST have at least one valid
  evidence record. Evidence points to exactly one observation, making that
  association a single source of truth.
- Evidence MUST be redacted before it crosses this boundary. Facts and
  summaries MUST NOT contain credentials, authorization material, request
  bodies, raw headers, host usernames, absolute local paths, private keys,
  tokens, or secrets.
- `summary` and `limitations` are explanatory only. Grouping, severity,
  lifecycle, and deduplication MUST NOT inspect free-form text.
- Numeric values MUST be finite JSON numbers. Unknown or unavailable values
  are represented by `null`, not `NaN`, infinity, or a magic string.

## Canonicalization and identity

All hashes use SHA-256 over UTF-8 JSON Canonicalization Scheme bytes and are
serialized as 64 lowercase hexadecimal characters. This is a contract rule;
no hashing utility or dependency is selected here.

### Observation identity and deduplication

Build an authoritative observation value from:

```text
schemaVersion, source, mode, mocked, sourceRecordKey, subjectKey, signal,
condition, observedAt, sorted dimensions
```

`provenance.limitations` is excluded from identity and merged as a sorted set.
If `sourceRecordKey` is present, derive `observationId` from:

```text
["observation-source-key", 1, source, mode, sourceRecordKey]
```

Otherwise derive it from the complete authoritative observation value. Prefix
the digest with `obs_`.

Records with the same derived ID and identical authoritative values are one
observation. Records with the same derived ID but different authoritative
values produce `error: observation_dedupe_conflict`; there is no first-writer
or last-writer winner. Arrival time and input order are never considered.

### Evidence identity, integrity, and deduplication

`contentDigest` is the SHA-256 digest of canonical `facts`. A mismatched digest
produces `error: invalid_evidence_digest`.

If `sourceRecordKey` is present, derive `evidenceId` from:

```text
["evidence-source-key", 1, source, mode, sourceRecordKey]
```

Otherwise derive it from:

```text
["evidence-content", 1, observationId, kind, capturedAt, summaryCode,
 redactionProfile, contentDigest]
```

Prefix the digest with `ev_`. Equal IDs with identical authoritative evidence
are one record. Equal IDs with any different authoritative field produce
`error: evidence_dedupe_conflict`. Explanatory limitations are merged as a
sorted set; no other conflict is silently merged.

### Group and incident identity

An observation is eligible for a rule only when its signal matches exactly. A
record in the selected source, mode, subject, and signal that lacks any rule
`groupBy` dimension produces `error: invalid_observation`; it is not silently
discarded. The group fingerprint is derived from:

```text
["incident-group", 1, ruleId, ruleVersion, source, mode, mocked, subjectKey,
 signal, sorted selected dimension pairs]
```

Prefix the digest with `grp_`. Including source and trust mode prevents fixture
and live claims, or separate providers, from being silently combined. Future
cross-source correlation is deferred.

An evaluation scope MUST contain exactly the dimensions named by `groupBy`.
Extra or missing grouping dimensions produce `error: invalid_scope` rather
than being silently ignored. `groupFingerprint` is `null` only when invalid
rule or scope data prevents deriving it.

Within a group, deduplicated observations are sorted by `(observedAt,
observationId)`. An episode opens on the first observation for which the
trigger threshold becomes true. Its seed is the ordered set of observations
forming that first qualifying run. Derive the incident ID from:

```text
["incident-episode", 1, groupFingerprint, seed observation IDs]
```

Prefix the digest with `inc_`. A transition ID uses the incident ID, target
status, transition time, and sorted cause observation IDs, with prefix `tr_`.
These rules make result IDs and ordering independent of input order.

## Deterministic rule evaluation

An evaluation MUST receive an explicit `evaluatedAt`; it MUST NOT read the
machine clock. It evaluates a bounded record set for one explicit scope and
one immutable rule version.

1. Validate the rule, scope, records, provenance, timestamps, redaction flags,
   evidence references, and evidence digests.
2. Canonicalize, derive IDs, detect conflicts, and deduplicate before counting.
3. Filter exact source, mode, mocked flag, subject, signal, and group
   dimensions; never match free-form text.
4. Sort observations by `(observedAt, observationId)` and replay the lifecycle
   rules in that order.
5. Sort every emitted collection canonically before producing the evaluation.

A trigger or recovery threshold is true only when `minimumCount` consecutive
matching observations fit within its inclusive window ending at the newest
member. A non-matching known condition breaks the run. Duplicate records never
increase a count.

The current known condition is the newest valid, fresh observation after the
same deterministic sort. It is separate from the incident status: one failed
observation may be a known failure while remaining below the incident trigger
threshold.

## Stable availability states

State precedence for an evaluation scope is deterministic:

1. `error` when an integrity or contract issue prevents trusting the scope;
2. `unknown` when there is no eligible valid observation at or before
   `evaluatedAt`;
3. `stale` when the newest eligible observation is older than its freshness
   boundary;
4. `known` otherwise.

An observation is fresh while:

```text
evaluatedAt <= observedAt + freshnessMs
```

It becomes stale one millisecond after that boundary. Future-dated
observations are invalid rather than fresh.

`unknown`, `stale`, and `error` MUST NOT open, recover, or resolve an incident.
If an episode already exists, its last trusted lifecycle state is preserved.
If none exists, `currentIncident` remains `null`. This fail-visible behavior
prevents telemetry loss from becoming a false recovery.

Error records use only the stable codes in `ContractErrorCode`; explanatory
details may accompany diagnostics later but never change output identity or
behavior. If multiple error codes apply, select the lexically first code and
include the sorted union of affected record IDs, so repeated evaluation has one
stable result.

## Incident severity and lifecycle

Severity is declared by the immutable rule version and copied to the incident
episode. It is not inferred from log text, record count, source name, or UI
state. Severity is fixed for an episode in v1; dynamic escalation is deferred.

| Current status | Input | Next status | Required result |
|---|---|---|---|
| none | Trigger threshold first becomes true | `open` | Create one episode and an `open` transition. |
| `open` | First valid `healthy` observation after the latest trigger | `recovering` | Record the observation; do not claim resolution. |
| `open` | Triggering or other non-healthy observation | `open` | Attach the unique observation; do not duplicate transitions. |
| `recovering` | Triggering or other non-healthy observation | `open` | Reset the recovery run and record one transition back to `open`. |
| `recovering` | Recovery threshold becomes true | `resolved` | Set `resolvedAt` from the threshold-crossing observation. |
| `recovering` | Additional healthy observation below threshold | `recovering` | Extend the unique recovery run without another transition. |
| any active status | Evaluation is `unknown`, `stale`, or `error` | unchanged | Preserve the last trusted lifecycle state. |
| `resolved` | Any later observation | `resolved` | Keep that episode terminal; evaluate a later qualifying trigger as a new episode. |

`recoveringAt` is the time of the first observation in the current qualifying
recovery run and resets to `null` if the episode returns to `open`.
`resolvedAt` is immutable once set.

A later qualifying trigger after resolution creates a new episode with a new
incident ID under the same group fingerprint. This keeps historical recovery
truth intact and avoids ambiguous reopen semantics.

Incident `observationIds` contain the opening trigger run and every unique
eligible observation through resolution. `evidenceIds` are derived from those
observations. Both lists and lifecycle transitions are emitted in canonical
order. Incident provenance copies the common source, mode, and mocked flag and
uses the sorted union of underlying limitations.

`currentIncident` contains only an `open` or `recovering` episode. A resolved
episode moves to `completedIncidents`, which is sorted by `(openedAt,
incidentId)`. An evaluation with no active episode uses `currentIncident: null`.

## Deterministic fixture contract

All cases use rule `api-error-burst@1`:

```text
signal: api.response
groupBy: [route]
severity: high
trigger: degraded or failed, 2 consecutive observations within 30,000 ms
recovery: healthy, 2 consecutive observations within 30,000 ms
freshness: 60,000 ms
```

The primary scope is:

```text
source: fixture.open-dashboard
mode: fixture
mocked: true
subject: application/order-api
route: /orders
limitation: No live request, trace, log, or process was observed.
```

Every fixture observation has one redacted evidence record with a verified
digest. Fixture source keys shown below are stable inputs to the ID rules.

| Case | Ordered normalized inputs | Evaluation time | Expected result |
|---|---|---|---|
| F1 golden path | `fail-a` at `2026-08-16T12:00:00.000Z`, exact retry of `fail-a`, `fail-b` at `2026-08-16T12:00:10.000Z`, `healthy-a` at `2026-08-16T12:00:30.000Z`, `healthy-b` at `2026-08-16T12:00:40.000Z` | `2026-08-16T12:00:40.000Z` | Retry dedupes; one high-severity episode transitions `open -> recovering -> resolved`; four observation IDs and four evidence IDs appear once. |
| F2 shuffled replay | Exact F1 records in reverse order | `2026-08-16T12:00:40.000Z` | Byte-equivalent canonical evaluation, IDs, collections, and transitions to F1. |
| F3 group separation | F1 plus two failures for route `/health` | `2026-08-16T12:00:40.000Z` | `/orders` and `/health` have different group fingerprints and incident IDs; neither consumes the other's counts. |
| F4 unknown | No observations for the explicit primary scope | `2026-08-16T12:00:00.000Z` | `unknown: no_observation`, no incident, and no implied healthy state. |
| F5 stale open episode | Only `fail-a` and `fail-b`; evaluate at `2026-08-16T12:01:10.001Z` | `2026-08-16T12:01:10.001Z` | `stale: freshness_expired`; the previously opened episode remains `open` and does not resolve. |
| F6 observation conflict | Two records reuse source key `fail-a` with `failed` and `healthy` conditions | `2026-08-16T12:00:10.000Z` | `error: observation_dedupe_conflict`; no record wins and no lifecycle transition is derived from the conflict. |
| F7 evidence failure | `fail-a` references valid evidence and `fail-b` has no evidence | `2026-08-16T12:00:10.000Z` | `error: missing_evidence`; no incident opens from an unverifiable threshold. |
| F8 recurrence | F1 resolves, then `fail-c` and `fail-d` satisfy the trigger later | time of `fail-d` | Original episode stays `resolved`; a second incident ID opens under the same group fingerprint. |
| F9 trust separation | F1 fixture records plus otherwise identical `live` records | `2026-08-16T12:00:40.000Z` | Fixture and live records cannot share a group fingerprint or episode. |
| F10 freshness boundary | Newest record at `2026-08-16T12:00:00.000Z` | `2026-08-16T12:01:00.000Z` then `2026-08-16T12:01:00.001Z` | First evaluation is not stale; second is `stale: freshness_expired`. |

Fixture generation, file layout, and executable tests are intentionally not
specified. The table is the immutable behavioral input/output contract for a
future implementation task.

## Contract-level acceptance checks

1. Every proposed type, state, and transition can be understood without a
   provider payload or another independent planning document.
2. The same validated record set, rule version, scope, and `evaluatedAt`
   produce byte-equivalent canonical output regardless of input order.
3. Exact duplicate observations and evidence appear once and never increase
   thresholds; conflicting duplicates produce stable errors.
4. Fixture and live provenance cannot be omitted, contradicted, or grouped
   together.
5. Every incident observation has at least one valid redacted evidence record,
   and all references resolve without dangling IDs.
6. Grouping uses only exact normalized fields declared by the rule; free-form
   summaries and limitations cannot affect grouping or severity.
7. Severity is fixed by `ruleId@ruleVersion` for the complete episode.
8. `unknown`, `stale`, and `error` never become `healthy`, never satisfy a
   recovery threshold, and never erase the last trusted incident state.
9. A resolved episode is immutable; a recurrence creates a distinct incident
   ID under the same group fingerprint.
10. F1-F10 produce their stated outcomes, including the exact freshness
    boundary and shuffled replay equivalence.
11. Evidence facts and summaries contain none of the prohibited sensitive
    fields, and every content digest matches the canonical redacted facts.
12. The plan introduces no collector, adapter, storage, UI, action, network,
    live behavior, dependency, or cross-model mapping.

## Assumptions

- Records have already been normalized and redacted at a trust boundary that
  is outside this plan.
- A caller supplies one complete bounded record set, explicit evaluation
  scope, immutable rule version, and explicit evaluation time.
- Source, subject, source-record, signal, and dimension keys are stable within
  a rule version.
- Event timestamps are trustworthy for deterministic fixtures. Clock-skew and
  malicious timestamp handling are not solved by this contract.
- V1 intentionally keeps one provider source and one trust mode per group.
- Rule distribution, authorization, and persistence are outside this model.

## Risks and mitigations

| Risk | User impact | Bounded mitigation in this proposal |
|---|---|---|
| Unstable source or subject keys fragment one problem into multiple groups. | Duplicate or missing incidents reduce trust. | Make keys explicit contract inputs and cover replay stability in acceptance checks. |
| Canonicalization differs between future runtimes. | Identical evidence receives different IDs. | Specify timestamp form, ordering, canonical JSON, UTF-8, and SHA-256 precisely. |
| Telemetry loss freezes an old open incident. | The dashboard may remain pessimistic. | Prefer visible `unknown` or `stale` over a false recovery; defer policy-based expiry. |
| Fixed severity lacks contextual impact. | Some incidents may be over- or under-prioritized. | Keep severity honest and reproducible in v1; defer dynamic scoring. |
| Redaction fails before the contract boundary. | Evidence could expose sensitive data. | Require pre-redaction, prohibited fields, a named redaction profile, and digest validation; implementation security review remains required. |
| Late or corrected events change a previously evaluated history. | Historical IDs or transitions could appear unstable. | Limit v1 to a complete bounded set and defer streaming reconciliation and corrections. |
| Cross-source signals describe the same real event. | Users may see parallel incidents. | Keep trust boundaries separate rather than perform unverified correlation. |

## Deferred decisions

- Collector, provider-adapter, and normalization mappings
- Live ingestion, polling, streaming, backpressure, and transport
- Storage schema, retention, compaction, querying, and migration
- Late-event reconciliation, corrections, tombstones, and clock-skew policy
- Cross-source correlation, topology-aware grouping, and merge/split behavior
- Dynamic severity, blast-radius calculation, suppression, and maintenance
  windows
- Manual acknowledgement, assignment, escalation, notification, and action
  policy
- Multi-tenant ownership, authorization, privacy enforcement, and audit
  retention
- Raw-evidence custody, attachment formats, size limits, and cryptographic
  signatures
- Numeric metric thresholds, histograms, anomaly detection, and learned rules
- UI presentation, export format, and mappings to diagnostics, inventory,
  actions, plugins, or any other domain model

Any of these requires a separate decision and reconciliation after the active
competition work freezes.
