# T8 — Action and Approval Policy

Status: independent future contract; planning only; no implementation

## 1. Purpose

This document defines a future, generic, deny-by-default contract for deciding
whether a bounded action request is denied, requires approval, or receives a
time-limited authorization. It covers request and decision states, approval
binding, expiry, idempotency, audit evidence, deterministic fixtures, and
contract checks.

This contract is independent of the competition demo. It does not reinterpret
the demo state machine, change its API contract, create a T0-T4 gate, or claim
that any live policy or action capability exists.

## 2. Completion boundary

This planning task is complete when the contract:

- makes denial the result for every unrecognized, invalid, ambiguous, expired,
  or unevaluable request;
- separates approval from authorization and authorization from execution;
- binds every approval and authorization to one immutable request fingerprint;
- defines deterministic state, expiry, idempotency, concurrency, and audit
  behavior;
- provides safe fixtures that evaluate decisions without performing actions;
- records assumptions, risks, and decisions intentionally left for later.

The following are outside this task:

- an executor, workflow engine, scheduler, shell, process control, file
  mutation, network request, plugin execution, or live policy runtime;
- application-specific remediation behavior or action-to-provider mappings;
- authentication, policy administration, durable storage, notification, or UI
  implementation;
- integration with, or changes to, the current competition demo.

## 3. Security invariants

1. **Deny by default.** Only an explicit, valid policy match can produce
   `approval_pending` or `authorized`. Missing data, evaluation errors, and
   policy conflicts deny.
2. **Immutable intent.** Action kind, target, parameters, requester, and scope
   are bound into a server-derived request fingerprint. Changing any bound
   field requires a new request.
3. **Approval is not authorization.** An approval satisfies only the named
   requirement. Policy must re-evaluate the unchanged request before issuing
   an authorization.
4. **Authorization is not execution.** `authorized` means only that the policy
   contract issued a bounded grant. It is not evidence that an action ran or
   succeeded.
5. **No scope expansion.** An approval or grant cannot add targets,
   capabilities, parameter ranges, duration, or identity scopes that were not
   in the request and matched policy.
6. **Time is restrictive.** Requests, approval requirements, approval records,
   and authorizations are invalid at or after their expiry. No grace period or
   resurrection is implicit.
7. **Replay is harmless.** Repeating an accepted operation with the same
   idempotency identity and fingerprint returns the existing result without a
   second transition or duplicate audit event.
8. **Audit does not confer authority.** Audit records describe decisions; they
   can never be replayed as approvals or grants.

## 4. Contract vocabulary

- **Action request:** immutable intent submitted by one authenticated subject.
- **Request fingerprint:** server-derived digest of all security-relevant
  request fields using a versioned canonicalization scheme.
- **Policy decision:** one of deny, require approval, or authorize.
- **Approval requirement:** exact approver constraints that must be satisfied
  before re-evaluation.
- **Approval record:** immutable approve or reject response bound to one
  requirement and request fingerprint.
- **Authorization grant:** short-lived, bounded policy output. It is not an
  execution token until a later runtime defines secure redemption.
- **Stable reason code:** machine-readable explanation that does not expose
  sensitive input.

## 5. Normative data contract

The following TypeScript is a design contract, not application source.

```ts
type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonValue[] | { readonly [key: string]: JsonValue }

type RequestState =
  | 'submitted'
  | 'approval_pending'
  | 'authorized'
  | 'denied'
  | 'rejected'
  | 'expired'
  | 'cancelled'
  | 'revoked'

type DecisionOutcome = 'deny' | 'require_approval' | 'authorize'

type ReasonCode =
  | 'explicit_policy_match'
  | 'approval_required'
  | 'approval_satisfied'
  | 'approval_rejected'
  | 'approval_invalid'
  | 'approval_expired'
  | 'request_expired'
  | 'request_cancelled'
  | 'authorization_revoked'
  | 'invalid_request'
  | 'invalid_action_parameters'
  | 'unknown_action'
  | 'target_out_of_scope'
  | 'no_policy_match'
  | 'explicit_deny'
  | 'policy_conflict'
  | 'policy_context_unavailable'
  | 'policy_evaluation_failed'
  | 'idempotency_conflict'
  | 'request_fingerprint_mismatch'
  | 'request_closed'

interface SubjectRef {
  subjectId: string
  tenantId: string | null
}

interface ActionDescriptor {
  actionKind: string
  targetType: string
  targetId: string
  parameters: Readonly<Record<string, JsonValue>>
}

interface ActionRequestInput {
  schemaVersion: 1
  idempotencyKey: string
  requestedBy: SubjectRef
  action: ActionDescriptor
  purpose: string
  requestedAt: string
  expiresAt: string
  policyContextId: string
}

interface ActionRequestRecord extends ActionRequestInput {
  requestId: string
  requestFingerprint: string
  fingerprintVersion: 1
  state: RequestState
  stateVersion: number
}

interface ApprovalRequirement {
  requirementId: string
  requestId: string
  requestFingerprint: string
  policyVersion: string
  requiredApproverScopes: readonly string[]
  minimumDistinctApprovers: number
  requesterMayApprove: false
  expiresAt: string
}

interface ApprovalInput {
  schemaVersion: 1
  approvalIdempotencyKey: string
  requestId: string
  requestFingerprint: string
  requirementId: string
  decidedBy: SubjectRef
  verdict: 'approve' | 'reject'
  decidedAt: string
  expiresAt: string
}

interface ApprovalRecord extends ApprovalInput {
  approvalId: string
  approverAuthoritySnapshotId: string
  recordedAt: string
}

interface AuthorizationGrant {
  authorizationId: string
  requestId: string
  requestFingerprint: string
  policyVersion: string
  issuedAt: string
  expiresAt: string
  action: ActionDescriptor
  singleUse: true
}

interface PolicyDecision {
  decisionId: string
  requestId: string
  requestFingerprint: string
  policyVersion: string
  evaluatedAt: string
  outcome: DecisionOutcome
  state: RequestState
  reasonCodes: readonly ReasonCode[]
  approvalRequirement: ApprovalRequirement | null
  authorization: AuthorizationGrant | null
}
```

### 5.1 Required validation

Before policy matching, the trust boundary must validate:

- supported schema and fingerprint versions;
- authenticated requester identity and tenant boundary, when applicable;
- non-empty, registered `actionKind`, `targetType`, and opaque `targetId`;
- action parameters against an allowlisted schema for that action kind;
- a non-secret idempotency key within size and character limits;
- parseable UTC timestamps with `requestedAt < expiresAt` and a lifetime no
  longer than the policy maximum;
- an available, trustworthy evaluation time and policy context snapshot.

Invalid input never becomes approval-pending. It returns `deny` with a stable
reason and records only a redacted audit event.

### 5.2 Fingerprint binding

The server derives the request fingerprint from this canonical tuple:

```text
fingerprintVersion
schemaVersion
tenantId
requestedBy.subjectId
action.actionKind
action.targetType
action.targetId
canonical(action.parameters)
purpose
requestedAt
expiresAt
policyContextId
```

Canonicalization and digest algorithms must be versioned. Callers cannot
supply or override the resulting fingerprint. Audit may store the fingerprint
but not raw sensitive parameters.

## 6. Decision precedence

Evaluation follows this restrictive order:

| Priority | Condition | Outcome | State | Reason |
|---:|---|---|---|---|
| 1 | Request is invalid or its trusted context is unavailable | `deny` | `denied` | Specific validation or context reason |
| 2 | Trusted time is at or after `expiresAt` | `deny` | `expired` | `request_expired` |
| 3 | An explicit deny rule matches | `deny` | `denied` | `explicit_deny` |
| 4 | Matching rules are ambiguous or contradictory | `deny` | `denied` | `policy_conflict` |
| 5 | No rule explicitly matches | `deny` | `denied` | `no_policy_match` |
| 6 | One valid rule requires approval | `require_approval` | `approval_pending` | `approval_required` |
| 7 | One valid rule explicitly permits without approval | `authorize` | `authorized` | `explicit_policy_match` |

An evaluator crash, timeout, unsupported policy version, or inability to
obtain required attributes is a denial, never an implicit retry-to-allow.

## 7. Request state model

```text
submitted
  -> denied
  -> approval_pending
  -> authorized
  -> expired
  -> cancelled

approval_pending
  -> authorized
  -> rejected
  -> denied
  -> expired
  -> cancelled

authorized
  -> expired
  -> revoked
```

Rules:

- `denied`, `rejected`, `expired`, `cancelled`, and `revoked` are terminal for
  that request ID and idempotency key.
- `authorized` is usable only before its grant expiry and while it has not been
  revoked. This contract defines no execution or completion state.
- A transition not listed above returns `request_closed` or an equivalent
  stable state error and causes no mutation.
- Cancellation is valid only for the requester or an explicitly authorized
  policy administrator. Cancellation never creates authorization.
- Policy invalidation of a pending request produces `denied`; invalidation of
  an issued grant produces `revoked`.
- Every accepted transition compares an expected `stateVersion` and increments
  it exactly once. A later runtime must serialize competing transitions so one
  logical request cannot have two winning outcomes.

## 8. Approval contract

1. A requirement is created only by an explicit matching policy rule and is
   bound to the request ID, fingerprint, policy version, and expiry.
2. Approvers must be authenticated and possess every required approval scope
   at recording time. The authority snapshot is referenced, not copied from
   untrusted request input.
3. The requester cannot approve its own request. Any future exception requires
   an explicit policy feature and is deferred; the v1 contract fixes
   `requesterMayApprove` to `false`.
4. Distinctness is by stable subject identity. Repeated approvals from one
   subject count once.
5. Approval records are immutable. An approve/reject change is a new decision
   attempt and cannot reuse the prior approval idempotency key.
6. A valid rejection recorded while the request is `approval_pending` moves it
   to terminal `rejected`. Rejection wins over approvals that have not already
   produced an atomic authorization transition.
7. Invalid, self, out-of-scope, expired, late, or fingerprint-mismatched
   approval attempts do not advance the request. They return a stable denial
   and create a redacted security audit event.
8. Reaching the approval threshold does not directly authorize. Policy
   re-evaluates the unchanged request against trusted time, current context,
   and active policy. Only a successful re-evaluation creates a grant.
9. The grant expiry cannot exceed the earliest of request expiry, requirement
   expiry, applicable approval expiry, and the policy's authorization maximum.
10. Approval cannot authorize an action kind, target, parameters, or duration
    different from the bound request.

Late approval withdrawal, delegation, substitution, escalation, and quorum
changes are not implicit v1 behavior; they are deferred decisions.

## 9. Expiry rules

- All times use UTC and a trusted clock. Fixture tests inject a fixed clock.
- The boundary is exclusive: an object is invalid when `now >= expiresAt`.
- Missing or unparsable expiry denies the request or approval attempt.
- Expiry is checked before initial evaluation, before recording an approval,
  before re-evaluation, and before treating a grant as valid.
- An expired request cannot be reopened or extended. New intent requires a new
  request ID and idempotency key.
- Clock unavailability or unacceptable skew produces
  `policy_context_unavailable` and fails closed.
- No background expiry worker is required by this contract. A conforming
  implementation may materialize expiry on the next trusted read or decision,
  provided the object is never treated as valid after the boundary.

## 10. Idempotency and concurrency

### 10.1 Request submission

The request idempotency scope is `(tenantId, requestedBy.subjectId,
idempotencyKey)`. Within that scope:

- same key plus same derived fingerprint returns the existing request and
  current decision;
- same key plus different fingerprint returns `idempotency_conflict`, creates
  no second request, and does not alter the first;
- replay after terminal state returns that terminal result; it never reopens
  the request;
- the key must be opaque, non-secret, and unique for new intent.

### 10.2 Approval submission

The approval idempotency scope is `(requestId, requirementId,
decidedBy.subjectId, approvalIdempotencyKey)`. Within that scope:

- an exact replay returns the existing approval record;
- a changed verdict, fingerprint, expiry, or approver identity returns
  `idempotency_conflict` and records no second approval;
- a duplicate approval never increments quorum or emits a second accepted
  audit event.

### 10.3 Transition races

- State transitions are conditional on the current `stateVersion`.
- Exactly one competing terminal or authorization transition may succeed.
- A stale caller receives the existing result or a stable conflict and must
  not infer authorization.
- Audit emission and the accepted state change share one logical transaction;
  neither may be observed as successful without the other.

Storage, locking, and distributed-consensus mechanisms are implementation
choices intentionally outside this plan.

## 11. Audit contract

```ts
type PolicyAuditEventType =
  | 'request.submitted'
  | 'request.denied'
  | 'approval.required'
  | 'approval.recorded'
  | 'approval.rejected'
  | 'approval.attempt_denied'
  | 'authorization.issued'
  | 'request.expired'
  | 'request.cancelled'
  | 'authorization.revoked'
  | 'idempotency.conflict'

interface PolicyAuditEvent {
  schemaVersion: 1
  eventId: string
  requestId: string
  requestFingerprint: string
  requestSequence: number
  stateBefore: RequestState | null
  stateAfter: RequestState
  eventType: PolicyAuditEventType
  actor: SubjectRef | { subjectId: 'policy-system'; tenantId: string | null }
  occurredAt: string
  policyVersion: string
  reasonCodes: readonly ReasonCode[]
  actionKind: string
  targetType: string
  targetId: string
  fixture: boolean
}
```

Audit rules:

- Events are append-only in the logical contract and strictly sequenced per
  request. Accepted transitions emit exactly one state event.
- Denials, invalid approval attempts, expiry, cancellation, revocation, and
  idempotency conflicts are auditable even when state does not advance.
- The audit allowlist excludes credentials, tokens, private keys, raw headers,
  request bodies, arbitrary parameter values, local absolute paths, and
  credential-store identifiers.
- Actor and target identifiers must be opaque and bounded. Human-readable
  purpose text is not copied into audit without a separate redaction rule.
- Every event identifies the policy version and stable reason codes used.
- Fixture events set `fixture: true` visibly and machine-readably.
- Append-only semantics do not by themselves prove durable, immutable, or
  tamper-evident storage. Those claims require a later storage design and
  verification.

## 12. Safe deterministic fixtures

Fixtures test only policy decisions and audit output. They stop at
`authorized`; they do not execute, mutate, invoke a provider, access a file or
process, or send a request.

### 12.1 Fixed fixture inputs

- Clock: `2030-01-01T00:00:00.000Z`
- Policy version: `fixture-policy-v1`
- Requester: `fixture-requester` in tenant `fixture-tenant`
- Reviewer: `fixture-reviewer` with scope `fixture.approve.change`
- Unauthorized subject: `fixture-outsider`
- Target: type `fixture-record`, ID `fixture-alpha`
- Directly permitted action: `fixture.read_summary`
- Approval-gated action: `fixture.simulate_change`
- Explicitly denied action: `fixture.forbidden`
- Default for every other action: deny

All fixture IDs, timestamps, fingerprints, decision IDs, and audit event IDs
are derived deterministically from the case seed. No fixture contains a secret
or machine-specific value.

### 12.2 Fixture cases

| Case | Input or event | Expected result |
|---|---|---|
| F01 | Valid `fixture.read_summary` request | `authorized`; `explicit_policy_match`; one grant; no approval |
| F02 | Valid `fixture.simulate_change` request | `approval_pending`; exact requirement created; no grant |
| F03 | F02 plus one valid distinct reviewer approval | Re-evaluates unchanged fingerprint; `authorized`; one grant |
| F04 | Requester attempts to approve F02 | Attempt denied as `approval_invalid`; request remains pending |
| F05 | Reviewer rejects F02 before authorization | Request becomes terminal `rejected`; no grant |
| F06 | Unknown action kind | Terminal `denied`; `unknown_action`; no requirement or grant |
| F07 | Explicitly denied action | Terminal `denied`; `explicit_deny` wins over any broader match |
| F08 | Evaluate at exactly request expiry | Terminal `expired`; `request_expired`; no requirement or grant |
| F09 | Replay request key with identical fingerprint | Same request, decision, and audit sequence; no duplicate transition |
| F10 | Replay request key with changed target or parameters | `idempotency_conflict`; original request unchanged |
| F11 | Approval carries a different request fingerprint | Attempt denied as `request_fingerprint_mismatch`; request remains pending |
| F12 | Policy context or trusted clock unavailable | Terminal `denied`; `policy_context_unavailable`; no grant |
| F13 | Action parameters fail the registered schema | Terminal `denied`; `invalid_action_parameters`; raw values absent from audit |
| F14 | Two callers race valid approval and rejection | One state-version transition wins; result and audit order are deterministic |

## 13. Acceptance checks

A future implementation conforms only if all checks below pass with fixed,
representative inputs:

### 13.1 Positive checks

- An explicitly matched, valid no-approval request produces one bounded grant.
- An approval-gated request produces no grant until all distinct approver
  constraints are satisfied and re-evaluation succeeds.
- The grant reproduces the exact request fingerprint, action descriptor, and
  policy version, with a strictly bounded expiry.
- Exact request and approval replays return their original records without
  additional state transitions, quorum, grants, or accepted audit events.
- Every accepted state transition has one ordered, redacted audit event.
- Resetting the fixture clock and case seed reproduces byte-equivalent logical
  decisions and event IDs.

### 13.2 Mandatory denial checks

The contract must deny and issue no grant when any of these conditions holds:

- unsupported schema or fingerprint version;
- missing or unauthenticated requester identity;
- unknown action kind, invalid parameter schema, or out-of-scope target;
- no matching rule, explicit deny, ambiguous match, or policy evaluation
  failure;
- missing policy context, trusted time, or required authorization attribute;
- request or approval at or beyond expiry;
- missing approval, insufficient distinct approvers, self-approval,
  unauthorized approver, or explicit rejection;
- request, approval, requirement, or policy-version fingerprint mismatch;
- idempotency key reuse with changed intent or verdict;
- request in a terminal state, stale `stateVersion`, cancellation, or
  revocation.

Each denial must return a stable reason code, preserve existing accepted state,
emit only redacted audit evidence, and remain deterministic for the same
inputs.

## 14. Assumptions

- A future trust boundary can provide authenticated stable subject IDs and
  authorization attributes without exposing credential material.
- Each action kind has a versioned, allowlisted parameter schema before it can
  appear in policy. Unregistered actions remain denied.
- A trusted UTC clock, versioned policy bundle, and atomic state boundary will
  be selected before implementation.
- Canonicalization is deterministic across supported runtimes and preserves
  the meaning of numeric, string, array, and object values.
- Tenant identity is required in multi-tenant use and is `null` only for an
  explicitly single-tenant deployment.
- The policy service decides authority only. A separate future design must
  prove how any action consumer validates and redeems a grant.

## 15. Risks and controls

| Risk | User or system impact | Contract control |
|---|---|---|
| Default-allow fallback | Unrecognized actions gain authority | No match, error, timeout, and ambiguity all deny |
| Confused deputy or scope drift | Approval is reused for a different target or action | Fingerprint binds actor, action, target, parameters, context, and time |
| Replay or duplicate delivery | Duplicate grants or approval quorum | Scoped idempotency plus immutable records and state versions |
| Stale approval | Old consent authorizes changed or late intent | Exact fingerprint binding, expiry, and re-evaluation |
| Race between approval and rejection | Contradictory outcomes | One conditional state transition and ordered audit sequence |
| Approval fatigue or social bypass | Reviewer approves unsafe intent | Explicit scopes, separate requester/reviewer, bounded purpose and duration |
| Policy or identity drift | A formerly valid request escapes new restrictions | Re-evaluation before grant and explicit revocation state |
| Audit data leakage | Sensitive request content appears in evidence | Allowlisted audit fields and omission of raw parameters |
| False execution claim | UI or operator treats authorization as success | No execution state; grant and audit explicitly describe policy only |
| Clock failure or skew | Expired authority remains usable | Trusted-time checks fail closed at every authority boundary |

## 16. Deferred decisions

The following require separate product, security, and implementation review:

- policy authoring language, precedence compiler, validation, rollout, and
  administrator authorization;
- identity provider, tenant model, group membership freshness, delegation,
  quorum variants, separation-of-duty rules, and emergency access;
- concrete action catalog, provider mappings, executor interface, redemption,
  outcome reporting, retries, compensation, and partial-failure semantics;
- authorization token format, signing, key rotation, revocation propagation,
  and protection against token theft;
- canonicalization and digest algorithms plus cross-language compatibility;
- durable storage, transaction model, distributed concurrency, retention,
  export, legal holds, and tamper-evidence guarantees;
- trusted-time source, skew tolerance, and multi-region behavior;
- approval withdrawal, delegation, escalation, notification, appeal, and user
  experience;
- policy simulation, migration, backwards compatibility, and safe rollback;
- any reconciliation with the competition demo or another independent plan.

Until those decisions are made and verified, this document remains a planning
contract and must not be described as a live policy system.
