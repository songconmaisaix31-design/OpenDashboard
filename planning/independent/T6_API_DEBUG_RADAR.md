# T6 — API Debug Radar Boundary

Status: contract proposal complete; planning only; no implementation

## Decision

Version 1 accepts one closed-schema, pre-normalized, pre-redacted fixture bundle
for one failed HTTP request and returns either one evidence-bounded diagnostic
finding, a deliberate no-finding result, or a stable validation error. The
contract is provider-neutral because it admits no provider-specific fields or
free-form payloads. It does not establish root cause and cannot trigger any
state change.

This proposal is self-contained. It does not modify the competition demo
contract, define mappings to another task model, or make another planning task
a dependency.

## Completion criteria

The planning task is complete when this document defines:

- a closed input and output contract with mandatory fixture provenance;
- deterministic request-to-evidence correlation and confidence rules;
- allowlist-based redaction and non-echoing rejection behavior;
- representative deterministic 500, 502, 503, and 504 fixture cases;
- stable success, limited, no-finding, and error states;
- contract acceptance checks, assumptions, risks, and deferred decisions; and
- explicit boundaries excluding interception, transport, actions, UI, and
  cross-model mappings.

## Scope and trust boundary

In scope:

- diagnostic analysis of already-normalized HTTP, trace, and log fixture
  records;
- correlation of those records to exactly one normalized failed request;
- evidence-supported classification, confidence, limitations, and provenance;
- deterministic fixture and contract-test definitions.

Out of scope:

- request interception, proxying, capture, replay, or generation;
- live tracing, provider SDKs, network access, or transport design;
- raw headers, query values, bodies, log messages, stack traces, credentials,
  private machine data, or external files;
- incident creation, runtime or process control, remediation, approvals,
  actions, persistence, export, or UI;
- mappings to incident, inventory, action, plugin, or any other task-owned
  model.

The diagnostic operation is pure: equal accepted input produces byte-equivalent
semantic output after canonical serialization. It has no persistent state and
no side effects.

## Normative contract

The TypeScript notation below defines data shape only; it is not an
implementation commitment.

```ts
type HttpMethod =
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'OTHER'

type EvidenceKind = 'http' | 'trace' | 'log'

type SignalCode =
  | 'handler_exception'
  | 'upstream_bad_gateway'
  | 'upstream_connection_reset'
  | 'service_unavailable'
  | 'dependency_timeout'

type LimitationCode =
  | 'fixture_only'
  | 'causality_not_established'
  | 'headers_and_bodies_omitted'
  | 'provider_normalization_not_assessed'
  | 'context_only_correlation'
  | 'partial_evidence'
  | 'conflicting_evidence'
  | 'clock_alignment_not_assessed'

interface RedactionReceipt {
  policy: 'api-diagnostic-redaction-v1'
  status: 'verified'
  removedFieldClasses: Array<
    | 'authorization'
    | 'cookie'
    | 'query_value'
    | 'body'
    | 'raw_log'
    | 'stack_trace'
    | 'machine_identifier'
    | 'local_path'
  >
}

interface FixtureProvenance {
  mode: 'fixture'
  mocked: true
  sourceId: string
  fixtureSetId: string
  fixtureVersion: string
}

interface NormalizedFailedRequest {
  id: string
  observedAt: string
  method: HttpMethod
  routeTemplate: string
  statusCode: number
  durationMs: number
  traceId?: string
  redaction: RedactionReceipt
  provenance: FixtureProvenance
}

interface EvidenceCorrelationKeys {
  requestId?: string
  traceId?: string
  method?: HttpMethod
  routeTemplate?: string
}

interface NormalizedEvidence {
  id: string
  kind: EvidenceKind
  observedAt: string
  correlation: EvidenceCorrelationKeys
  signal: SignalCode
  statusCode?: number
  durationMs?: number
  redaction: RedactionReceipt
  provenance: FixtureProvenance
}

interface ApiDiagnosticInput {
  schemaVersion: 1
  diagnosticId: string
  request: NormalizedFailedRequest
  evidenceCompleteness: 'complete' | 'partial'
  evidence: NormalizedEvidence[]
}

type CorrelationStrength = 'direct' | 'trace' | 'contextual'
type EvidenceConfidence = 'high' | 'medium' | 'low'

type FindingCode =
  | 'handler_exception_observed'
  | 'upstream_gateway_failure_observed'
  | 'service_unavailable_observed'
  | 'upstream_timeout_observed'
  | 'multiple_failure_signals_observed'

interface SupportedFinding {
  state: 'finding_ready' | 'finding_limited'
  findingId: string
  code: FindingCode
  statement: string
  confidence: EvidenceConfidence
  causality: 'not_established'
  supportingEvidenceIds: string[]
  excludedEvidenceIds: string[]
  strongestCorrelation: CorrelationStrength
  limitations: LimitationCode[]
  provenance: FixtureProvenance
}

interface NoSupportedFinding {
  state: 'no_supported_finding'
  observedStatusCode: number
  supportingEvidenceIds: []
  excludedEvidenceIds: string[]
  confidence: 'insufficient'
  causality: 'not_established'
  limitations: LimitationCode[]
  provenance: FixtureProvenance
}

type DiagnosticErrorCode =
  | 'unsupported_schema_version'
  | 'unsafe_input_rejected'
  | 'invalid_diagnostic_input'
  | 'duplicate_evidence_id'
  | 'unsupported_http_status'
  | 'unsupported_signal_code'
  | 'correlation_conflict'

type ApiDiagnosticResult =
  | {
      ok: true
      diagnosticId: string
      value: SupportedFinding | NoSupportedFinding
    }
  | {
      ok: false
      diagnosticId: null
      error: {
        code: DiagnosticErrorCode
        fieldPaths: string[]
        retryable: false
      }
    }
```

### Input invariants

- Object shapes are closed. Unknown fields are rejected; there is no generic
  `metadata`, `attributes`, or provider extension bag.
- IDs, including provenance IDs and versions, use
  `^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$`. They are opaque and must not encode
  usernames, hosts, file paths, tokens, or request values.
- Timestamps are fixed RFC 3339 UTC values. The operation never reads the
  current clock.
- `statusCode` on the failed request is an integer from 500 through 599.
- `durationMs` is a finite non-negative integer. An input contains at most 64
  evidence records, and evidence IDs are unique.
- Optional evidence `statusCode` values are integers from 100 through 599, and
  optional evidence `durationMs` values are finite non-negative integers.
- `routeTemplate` is at most 256 characters, begins with `/`, has no scheme,
  authority, query, fragment, or literal user-controlled value, and uses
  placeholders such as `{orderId}` for dynamic segments.
- Every request and evidence record carries fixture provenance and a verified
  redaction receipt. All records use the request's `fixtureSetId` and
  `fixtureVersion`; `sourceId` may differ. Version 1 does not admit `live` mode.
- `statement` is selected from controlled output templates. Input text is
  never interpolated into it.

Result provenance uses the controlled `sourceId` value `api-debug-radar` and
copies the accepted request's `fixtureSetId` and `fixtureVersion`. It does not
claim to be the source of the input observations.

## Request and evidence correlation

Correlation is evaluated per evidence record in the following order:

1. If an explicit `requestId` or `traceId` matches while another supplied
   explicit identifier contradicts the request, the entire operation returns
   `correlation_conflict`.
2. With no conflict, equal `requestId` produces `direct` correlation.
3. Otherwise, equal non-empty `traceId` produces `trace` correlation.
4. An evidence record with no explicit identifiers is `contextual` only when
   `method` and `routeTemplate` both equal the request and its timestamp is
   within 2,000 ms, inclusive, of the request timestamp.
5. Every other record is uncorrelated and appears only in
   `excludedEvidenceIds`.

An explicitly mismatched identifier can never fall back to contextual
correlation. No clock-skew correction, fuzzy route comparison, substring log
matching, or provider-specific heuristic is allowed. Before classification,
correlated records are sorted by `id`; excluded IDs and limitation codes are
also lexicographically sorted. Input evidence order therefore cannot affect
the result.

Correlation supports co-occurrence only. Even `direct` correlation does not
prove that a signal caused the HTTP response.

For `strongestCorrelation`, the fixed ordering is `direct`, then `trace`, then
`contextual`.

## Finding classification and confidence

Signal families are fixed:

| Signal family | Accepted signals | Finding code |
|---|---|---|
| Handler exception | `handler_exception` | `handler_exception_observed` |
| Upstream gateway failure | `upstream_bad_gateway`, `upstream_connection_reset` | `upstream_gateway_failure_observed` |
| Service unavailable | `service_unavailable` | `service_unavailable_observed` |
| Upstream timeout | `dependency_timeout` | `upstream_timeout_observed` |

Only correlated evidence participates. If correlated records support more
than one family, the result is `finding_limited` with
`multiple_failure_signals_observed`, `low` confidence, and
`conflicting_evidence`. No tie-breaking hypothesis is selected.

For one signal family, confidence is deterministic:

| Evidence support | Confidence | State |
|---|---|---|
| Two or more distinct evidence kinds, each `direct` or `trace` correlated | `high` | `finding_ready` |
| One `direct` or `trace` record | `medium` | `finding_ready` |
| Two or more distinct contextual evidence kinds without stronger support | `medium` | `finding_limited` |
| Exactly one contextual record without stronger support | `low` | `finding_limited` |
| No correlated record | `insufficient` | `no_supported_finding` |

`evidenceCompleteness: 'partial'` adds `partial_evidence` and caps confidence at
`medium`; for a supported finding, it also sets the state to
`finding_limited`. A no-finding result remains `no_supported_finding`.
Contextual-only support adds `context_only_correlation` and
`clock_alignment_not_assessed`. Every successful result includes
`fixture_only`, `causality_not_established`,
`headers_and_bodies_omitted`, and `provider_normalization_not_assessed`.

Confidence measures support for the controlled observation statement, not the
probability that the statement is a root cause. A finding must never use
language such as “caused by,” “root cause,” “fixed by,” or “recommended
action.”

`findingId` is deterministic:
`finding:<diagnosticId>:<findingCode>`. The controlled statements are:

| Finding code | Statement |
|---|---|
| `handler_exception_observed` | `Correlated fixture evidence reports a handler exception during the failed request.` |
| `upstream_gateway_failure_observed` | `Correlated fixture evidence reports an upstream gateway failure during the failed request.` |
| `service_unavailable_observed` | `Correlated fixture evidence reports service unavailability during the failed request.` |
| `upstream_timeout_observed` | `Correlated fixture evidence reports an upstream timeout during the failed request.` |
| `multiple_failure_signals_observed` | `Correlated fixture evidence reports multiple failure signals; no single explanation is selected.` |

## Redaction contract

Redaction is allowlist-based, not a best-effort denylist. Only fields declared
in the normative contract may cross the boundary. A recursive pre-validation
scan rejects prohibited key classes before ordinary shape validation so unsafe
input always returns `unsafe_input_rejected`. Prohibited-key comparisons are
ASCII case-insensitive and treat `-` and `_` as equivalent.

Prohibited material includes:

- authorization, proxy-authorization, API-key, cookie, and set-cookie fields;
- raw or decoded tokens, credentials, secrets, and session identifiers;
- raw request or response headers and bodies;
- full URLs, query keys or values, and form or multipart values;
- raw log messages, exception messages, and stack traces;
- hostnames, IP addresses, OS usernames, machine IDs, and absolute local paths;
- arbitrary free-form metadata or provider payloads.

Rejection output contains only stable error codes and sorted JSON-style field
paths. It never echoes a rejected key's value, nearby content, or a serialized
input fragment. Successful output copies only opaque IDs, controlled enums,
bounded numbers, fixed timestamps, fixture provenance, and controlled
statements.

Error paths use a JSONPath-like form rooted at `$`, with dot-delimited object
fields and zero-based array indexes; for example,
`$.evidence[0].correlation.traceId`.

A redaction receipt is evidence that normalization asserted the policy; it is
not proof that upstream data was safe. That limitation is why
`provider_normalization_not_assessed` is mandatory.

## Stable result and failure states

Successful states are terminal values, not workflow transitions:

- `finding_ready`: one signal family has medium or high support from at least
  one direct or trace correlation and is not marked partial.
- `finding_limited`: support is contextual, partial, or conflicting.
- `no_supported_finding`: the request is known to be 5xx, but no correlated
  evidence supports a diagnostic statement.

Validation stops at the first category below. Within a category,
`fieldPaths` are sorted, making multi-error fixtures stable.

| Order | Error code | Trigger |
|---:|---|---|
| 1 | `unsupported_schema_version` | `schemaVersion` is absent or not `1` |
| 2 | `unsafe_input_rejected` | A prohibited key or value class is present |
| 3 | `invalid_diagnostic_input` | Closed shape, ID, timestamp, route, bound, provenance, completeness, or receipt validation fails, excluding the dedicated checks below |
| 4 | `duplicate_evidence_id` | Two evidence records share an ID |
| 5 | `unsupported_http_status` | The request status is outside 500–599 |
| 6 | `unsupported_signal_code` | An evidence signal is outside the fixed vocabulary |
| 7 | `correlation_conflict` | Explicit request and trace identifiers disagree as defined above |

Every error is non-retryable within the same input, returns no partial finding,
and performs no mutation. Correcting and resubmitting input is outside this
contract; there is no internal retry behavior.

## Deterministic fixture matrix

All fixture timestamps are fixed UTC values, every record has verified
redaction and fixture provenance, and omitted IDs below are intentionally
absent.

Unless a row overrides a value, its `diagnosticId` equals the case ID; the
request uses `GET /fixture/{caseId}`, `durationMs: 1000`, and
`observedAt: '2026-08-16T00:00:00.000Z'`; evidence uses the same timestamp;
`evidenceCompleteness` is `complete`; the fixture set is
`t6-api-debug-radar` version `v1`; and the redaction receipt has an empty,
verified `removedFieldClasses` list. The request source ID is `fixture-http`;
evidence source IDs are `fixture-http`, `fixture-trace`, or `fixture-log`
according to record kind.

Expected limitation sets use these exact sorted shorthands:

- `BASE`: `causality_not_established`, `fixture_only`,
  `headers_and_bodies_omitted`, `provider_normalization_not_assessed`.
- `CONTEXT`: `causality_not_established`, `clock_alignment_not_assessed`,
  `context_only_correlation`, `fixture_only`,
  `headers_and_bodies_omitted`, `provider_normalization_not_assessed`.
- `CONFLICT`: `causality_not_established`, `conflicting_evidence`,
  `fixture_only`, `headers_and_bodies_omitted`,
  `provider_normalization_not_assessed`.

| Case | Request and evidence | Expected result |
|---|---|---|
| `fx-500-handler` | Request `req-500`, status 500, trace `tr-500`; trace `ev-500-trace` uses `tr-500` and signal `handler_exception`; log `ev-500-log` uses `req-500` and the same signal | `finding_ready`; `handler_exception_observed`; `high`; support IDs `ev-500-log`, `ev-500-trace`; limitations `BASE` |
| `fx-502-reset` | Request `req-502`, status 502, trace `tr-502`; HTTP `ev-502-http` uses `req-502` and signal `upstream_bad_gateway`; trace `ev-502-trace` uses `tr-502` and signal `upstream_connection_reset` | `finding_ready`; `upstream_gateway_failure_observed`; `high`; support IDs `ev-502-http`, `ev-502-trace`; limitations `BASE` |
| `fx-503-unavailable` | Request `req-503`, status 503, trace `tr-503`; HTTP `ev-503-http` uses `req-503` and signal `service_unavailable`; log `ev-503-log` uses `req-503` and the same signal | `finding_ready`; `service_unavailable_observed`; `high`; support IDs `ev-503-http`, `ev-503-log`; limitations `BASE` |
| `fx-504-timeout` | Request `req-504`, status 504, trace `tr-504`; HTTP `ev-504-http` uses `req-504` and signal `dependency_timeout`; trace `ev-504-trace` uses `tr-504` and the same signal | `finding_ready`; `upstream_timeout_observed`; `high`; support IDs `ev-504-http`, `ev-504-trace`; limitations `BASE` |
| `fx-500-context-only` | Request `req-context`, status 500; log `ev-context-log` has equal method and route, is exactly +2,000 ms, and has signal `handler_exception` | `finding_limited`; `handler_exception_observed`; `low`; support ID `ev-context-log`; limitations `CONTEXT` |
| `fx-500-no-match` | Request `req-none`, status 500; log `ev-none-log` has explicit request ID `req-other` and signal `handler_exception` | `no_supported_finding`; `insufficient`; excluded ID `ev-none-log`; limitations `BASE` |
| `fx-500-multi-signal` | Request `req-multi`, status 500, trace `tr-multi`; trace `ev-multi-trace` uses `tr-multi` and signal `handler_exception`; log `ev-multi-log` uses `req-multi` and signal `dependency_timeout` | `finding_limited`; `multiple_failure_signals_observed`; `low`; support IDs `ev-multi-log`, `ev-multi-trace`; limitations `CONFLICT` |
| `fx-500-id-conflict` | Request `req-conflict`, status 500, trace `tr-conflict`; trace `ev-conflict` uses `req-conflict` and `tr-other` | Error `correlation_conflict`; `fieldPaths` contains only `$.evidence[0].correlation.traceId`; no finding |
| `fx-500-sensitive` | Otherwise valid request `req-sensitive`, status 500, with a raw `authorization` field | Error `unsafe_input_rejected`; `fieldPaths` contains only `$.request.authorization`; no value echo |

## Contract acceptance checks

These are future contract tests, not claims of an existing runnable system.

| Check | Acceptance condition |
|---|---|
| `AC-T6-01-schema` | A minimal valid fixture bundle is accepted; unknown fields, malformed IDs, non-UTC timestamps, unsafe routes, and more than 64 evidence records are rejected with the specified stable code. |
| `AC-T6-02-redaction` | Each prohibited material class returns `unsafe_input_rejected`; serialized output contains neither the test secret nor adjacent raw content. |
| `AC-T6-03-correlation` | Direct, trace, inclusive ±2,000 ms contextual, just-outside-window, explicit-mismatch, and identifier-conflict fixtures match the correlation rules exactly. |
| `AC-T6-04-permutation` | Every permutation of one accepted evidence array produces the same canonical result and sorted ID lists. |
| `AC-T6-05-confidence` | The five support rows in the confidence table produce the specified state and `high`, `medium`, `low`, or `insufficient` value exactly; partial evidence never produces `high` or `finding_ready`. |
| `AC-T6-06-fixtures` | Every fixture in the deterministic matrix matches its exact state, finding or error code, confidence, support IDs, and limitation set. |
| `AC-T6-07-non-causality` | Every successful result has `causality: 'not_established'`; controlled statements contain no causal or remediation claim. |
| `AC-T6-08-stability` | Repeating an accepted or rejected input produces the same semantic result, stable error code, and sorted paths without reading time or external state. |
| `AC-T6-09-provenance` | Every accepted request, evidence record, and result is machine-readably marked `mode: 'fixture'` and `mocked: true`. |
| `AC-T6-10-boundary` | Contract review finds no interception, proxy, replay, live trace, network, action, UI, persistence, or cross-model mapping surface. |

## Assumptions

- A trusted upstream fixture builder supplies normalized, bounded, redacted
  objects; defining or implementing that builder is not part of T6.
- One input bundle describes exactly one failed HTTP request.
- Fixture clocks are UTC and intentionally aligned; real clock skew is not
  represented.
- Route templates have already replaced dynamic values with placeholders.
- The fixed signal vocabulary is sufficient for the listed fixtures, not for
  general production diagnosis.
- Canonical serialization sorts object keys and the arrays explicitly called
  out above; a serialization format is not selected here.

## Risks and mitigations

| Risk | User impact | Bounded mitigation in this contract |
|---|---|---|
| High confidence is mistaken for root-cause certainty | A user may act on an explanation that the evidence does not prove. | Confidence is explicitly evidence support, causality is always not established, and statements are controlled. |
| Correlation IDs are reused or normalized incorrectly | Evidence may be attached to the wrong request. | Conflicting explicit IDs fail closed; contextual evidence is limited and at most medium confidence. |
| A route template or opaque ID still contains private data | Sensitive data could appear in a finding or test artifact. | Strict formats, route rules, closed shapes, and non-echoing rejection reduce exposure; upstream correctness remains a stated limitation. |
| Fixture determinism hides live-system ambiguity | Reviewers may infer production readiness from polished outputs. | Fixture provenance and `fixture_only` are mandatory on every accepted object and result. |
| The fixed signal vocabulary over-simplifies mixed failures | A finding may omit a plausible explanation. | Multiple families produce a limited finding; no precedence guesses a winner. |
| Redaction rules drift as future fields are added | New fields may bypass current assumptions. | Versioned closed schemas require a deliberate contract and threat review before expansion. |

## Deferred decisions

- Any live-provider admission criteria, normalizer, SDK, or threat model.
- Clock-skew handling, distributed trace topology, sampling, and causal graph
  analysis.
- Confidence calibration against empirical production data.
- Non-5xx requests, batch diagnosis, streaming, retention, persistence, and
  export formats.
- Expansion or localization of controlled finding statements and signal codes.
- Automated redaction tooling, secret-scanner selection, and policy governance.
- Transport, API endpoints, UI presentation, actions, and every mapping to
  another domain model.
- Whether this proposal should be reconciled with any active or future product
  contract after the competition freeze.
