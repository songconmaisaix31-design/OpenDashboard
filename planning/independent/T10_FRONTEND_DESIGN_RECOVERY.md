# T10 — Frontend Design Recovery

- Status: planning complete; visual artifact not materialized
- Date: 2026-08-16
- Scope: independent planning only; no application or design mutation
- Frozen baseline: `880c0b5e3b7ceee807c59294ba56a1b6e4277403`
- Worktree: `C:\Users\DW\orca\workspaces\OpenDashboard\plan-frontend-design-recovery`
- Branch: `plan-frontend-design-recovery`

## Decision

T10 defines the contract for a truthful, fixture-only static fidelity pass. It
does not create a UI, approve a design, or change any T0-T9 contract.

The immutable visual reference package declared at dispatch is `UNAVAILABLE`.
There is therefore no evidence-backed legacy appearance to recover and no
screenshot that may be called an approved reference. The deterministic
`Fixture Recovery Board v1` specification in this document is the fallback. It
is intentionally narrow: one guided incident-to-recovery surface, five fixed
states, persistent mock provenance, and no external assets or live data.

The future sole visual source of truth is named `OpenDashboard Static Fidelity
Package v1`. It becomes authoritative only after a separately authorized task
materializes its manifest, tokens, assets, state inventory, and approved
screenshots with hashes. Until that promotion gate passes, this file is the
planning authority and the fallback remains an unimplemented candidate, not a
design approval.

This decision matters because a polished but unaudited screen could make
fixture behavior look live. A single frozen package and visible provenance let
reviewers understand the trust boundary and let implementers detect visual
drift without depending on a connector session.

## Completion boundary

T10 planning is complete when this contract and its planning record are
committed from the frozen baseline, the allowed readiness checks are recorded,
and the diff contains only the two T10-owned files.

The following are explicitly not completed by T10:

- No Figma file, Open Design project, source package, application screen, or
  screenshot baseline was created or edited.
- No real data source, controller, workflow, export, deployment, or network
  integration was exercised.
- No visual direction is approved for implementation.
- No T0-T9 task is blocked, changed, or accepted by this plan.

## Immutable input manifest

| Field | Recorded value |
|---|---|
| Package identifier | `UNAVAILABLE` |
| Path or URL | `UNAVAILABLE` |
| Content type | `UNAVAILABLE` |
| Declared states | `UNAVAILABLE` |
| Declared viewports | `UNAVAILABLE` |
| Asset and token inventory | `UNAVAILABLE` |
| License provenance | `UNAVAILABLE` |
| SHA-256 | `UNAVAILABLE` |
| Dispatch date | `2026-08-16` |

No visual files, screenshots, or T0-T9 outputs were inspected. Missing input
does not authorize invention of a legacy design and does not block completion
of this independent planning task.

## Read-only readiness record

The checks below were bounded to existing registrations and identity or active
context. They did not authenticate, reconfigure, install, generate, create,
edit, export, upload, or deploy anything. No credential value was inspected or
recorded.

| Surface | Check executed in this dispatch | Observed result | Readiness decision |
|---|---|---|---|
| Figma connector | Read-only identity check | Connector responded with an authenticated identity and one `View` seat | Ready only for bounded read-only inspection when a specific authorized file reference exists; not ready for authoring and not design approval |
| Open Design | Read-only active-context check | MCP call succeeded; `active: false` reported no currently active project | Transport is responsive, but there is no active design context and no visual artifact to approve |
| MotionSites | Read-only `codex mcp list` registration/auth status | Registration is enabled through an existing STDIO adapter; the CLI reports auth as `Unsupported`, so OAuth presence was not proven | Not ready. Both registration and OAuth evidence are required; use the manual-reference fallback without blocking |
| Immutable visual package | Dispatch manifest check | `UNAVAILABLE` | Use `Fixture Recovery Board v1`; do not claim recovery fidelity |
| `ui-ux-pro-max` | Not invoked | Prohibited by task contract | Not a source, fallback, or approval authority |

Connector availability is operational evidence only. It cannot promote a file,
screen, prompt, or generated result into the visual source of truth.

## Visual source-of-truth contract

### Authority

`OpenDashboard Static Fidelity Package v1` is the only package that may become
visual authority. A host application is not authority by itself. The package
must remain usable without connector access and must contain all of the
following:

- A manifest with package version, contract commit, source revision, state and
  viewport inventory, deterministic environment, and approval status.
- One token file, an asset inventory, asset license provenance, and SHA-256 for
  every included file.
- Approved reference screenshots for every required state and viewport.
- Interaction notes for focus, approval, reset, export, loading, empty, and
  error behavior that appear in the approved scope.
- The exact fixture/schema revision used for screenshots and a visible
  `Fixture`/`Mocked` provenance rule.
- Known limitations and a statement that simulated restart is not real process
  control or source-code repair.

A PNG or JPEG preview without the manifest, tokens, assets, states, hashes, and
provenance is not a valid handoff. Figma, Open Design, and MotionSites may be
inputs in a later authorized task; none is an additional visual authority.

### Promotion and replacement

1. Materialize one static candidate from the fallback contract with fixed data
   and no real data integration.
2. Freeze the candidate package and compute all manifest hashes.
3. Pass the static screenshot gate in this document.
4. Record explicit reviewer approval in the manifest.
5. Promote that immutable revision as `OpenDashboard Static Fidelity Package
   v1`.
6. Integrate the real in-process fixture contract only after static fidelity is
   green, then rerun the same screenshots.

A newer candidate never overwrites the last approved package. It receives a
new revision and replaces the previous package only after the complete gate.
At present there is no last-known-green visual package.

## Deterministic mock fallback: `Fixture Recovery Board v1`

This fallback is a static design specification, not a runnable artifact. A
future implementation task may materialize it only after separate
authorization.

### Product promise

A reviewer should understand, in one guided surface, that `order-api` has a
fixture-owned transient failure, evidence is mocked, a simulated restart needs
approval, and recovery is verified before export. The interface must never
suggest that a real service was restarted.

### Fixed display data

The values below are visual fixture seed data only. They do not modify the API
contract or any T0-T9 fixture.

| Field | Fixed value |
|---|---|
| Mode | `Fixture Demo` |
| Run ID | `demo-run-001` |
| Target | `order-api` |
| Initial health | `Degraded` |
| Incident | `api-error-burst` |
| Severity | `High` |
| Triage workflow | `api-500-triage` |
| Evidence kinds | `HTTP`, `Trace`, `Log`, `Resource` |
| Action | `Simulated managed-runtime restart` |
| Initial observed time | `2026-08-16T12:00:00Z` |
| Provenance | `mode: fixture`, `mocked: true`, source `fixture-provider` |

Audit times advance by one fixed minute per accepted transition. Replaying the
same accepted transition keeps the same IDs, times, and entries. No display
value depends on the local clock, locale, user identity, network, random data,
or machine path.

### State and action inventory

| Phase | Primary content | Persistent status | Primary action |
|---|---|---|---|
| `incident_open` | Incident summary and fixture fault explanation | `Degraded`, `Fixture`, `Mocked` | `Collect evidence` |
| `evidence_collected` | Four redacted evidence cards and completed triage step | `Degraded`, `Fixture`, `Mocked` | `Request simulated restart` |
| `approval_pending` | Approval panel naming scope, simulation, and no real side effect | `Approval required`, `Simulated action` | `Approve simulated restart` |
| `action_confirmed` | Immutable audit entry; health remains unverified | `Action confirmed`, `Verification pending` | `Verify recovery` |
| `recovered` | Healthy target, recovered incident, before/after evidence summary | `Recovered`, `Fixture`, `Mocked` | `Export redacted evidence` |

`Reset demo` is always available as a secondary action and returns to
`incident_open`. It must not be visually stronger than the phase's primary
action. Invalid or duplicate transitions display the stable contract result
without adding audit rows.

### Exact trust-boundary copy

The following English copy is fixed for the static candidate:

- Global banner: `Fixture data · No live providers · Simulated actions only`
- Fault explanation: `A fixture-owned transient runtime latch is producing a
  deterministic API error burst.`
- Approval warning: `This approval changes fixture state only. It does not
  restart a real process or repair source code.`
- Verification note: `Recovery is not complete until the fixture health check
  passes.`
- Export note: `The report contains redacted fixture evidence and mock
  provenance.`

No label may shorten `simulated restart` to `restart`, and no evidence source
may be labelled `Live`.

### Layout contract

- Use a system UI font stack only. Do not load remote fonts.
- Use a 4 px base spacing unit, 8 px corner radius, and 1 px borders. Avoid
  gradients, photography, decorative illustrations, charts, and remote assets.
- Desktop uses a centered 1280 px maximum content area. The main evidence and
  incident column occupies two thirds; workflow and audit occupy one third.
- At widths below 768 px, use one column in this order: provenance banner,
  target/incident, phase action, evidence, workflow, audit.
- Reserve space for the mobile action region so it never covers content. Do
  not rely on hover, horizontal scrolling, or off-screen controls.
- The provenance banner remains visible in every state and viewport. Evidence
  cards repeat a `Mocked` badge locally so provenance is not dependent on color
  or scroll position.
- The approval warning and primary approval action must be visible together at
  100% zoom. The recovered state must show both healthy status and the export
  action without hiding the fixture banner.

### Token contract

| Token | Value | Use |
|---|---|---|
| `canvas` | `#0B1020` | Page background |
| `surface` | `#121A2B` | Primary panels |
| `surfaceRaised` | `#18233A` | Evidence and audit cards |
| `border` | `#2A3854` | Dividers and outlines |
| `textPrimary` | `#F4F7FB` | Primary text |
| `textMuted` | `#A7B1C2` | Secondary text |
| `danger` | `#FF6B6B` | Degraded and high severity |
| `warning` | `#F4B740` | Fixture, mocked, approval |
| `success` | `#3DDC97` | Recovered status |
| `info` | `#72A7FF` | Focus and neutral action emphasis |

Status meaning must include text or an icon plus text; color alone is never the
signal. Text contrast must meet WCAG AA for its actual background before a
token set can be frozen.

## Static-fidelity-first delivery sequence

1. **Input gate:** record the authorized output path, contract commit, fixture
   revision, browser/runtime version, fonts, asset licenses, and every hash.
2. **Static composition:** render all five states from the fixed display data.
   Use a visual QA harness or equivalent fixed-state entry point; do not connect
   `DemoController`, providers, local time, random IDs, or network data.
3. **Static screenshot gate:** capture and review the required matrix. Fix
   layout, copy, token, asset, and accessibility defects before integration.
4. **Fixture integration:** connect only the in-process `FixtureDataSource` and
   preserve the approved visual states and trust-boundary copy.
5. **Integrated screenshot gate:** rerun the identical matrix and the golden
   incident-to-recovery journey.
6. **Refactor gate:** componentize or generalize only after both screenshot
   gates pass; rerun them after any structural change.

This order isolates visual defects from state and provider defects. It protects
the 90-second demo from late styling changes and prevents live-looking data
from entering screenshots before provenance is proven.

## Screenshot QA gate

### Deterministic capture environment

- Locale: `en-US`; timezone: `UTC`; color scheme: dark.
- Device scale factor: `1`; browser zoom: `100%`.
- Motion: `prefers-reduced-motion: reduce`; transitions and caret blinking
  disabled for capture.
- Network: blocked after the local artifact loads; no remote fonts or assets.
- Viewports: `1440x900`, `1280x800`, and `390x844`.
- States: all five phases in the state inventory.
- File pattern: `<phase>--<width>x<height>.png`, producing exactly 15 required
  images.

The manifest must pin the browser engine/version, operating environment, font
stack, fixture revision, contract commit, and screenshot SHA-256 values. Pixel
comparison is valid only within that pinned environment.

### Automated acceptance

- All 15 files exist with exact dimensions and no unexpected transparency.
- After the first baseline is explicitly approved, each candidate has a
  `maxDiffPixelRatio` of at most `0.005` against that baseline.
- Any difference touching provenance, target health, incident status, approval
  warning, primary action, or export note fails regardless of total ratio.
- Semantic assertions find exactly one visible phase primary action, the global
  fixture banner, and the correct phase status.
- The page has no horizontal overflow at any viewport and no console or failed
  network errors in the capture run.

The first screenshot set cannot auto-approve itself. It becomes the baseline
only after explicit visual review and manifest sign-off.

### Visual acceptance

Every screenshot must pass all of the following:

- No text truncation, overlap, clipped focus ring, cropped critical icon, or
  content hidden beneath a sticky region.
- Long evidence summaries and the approval warning wrap without moving the
  primary action off-screen or obscuring its label.
- `Fixture`, `Mocked`, and `Simulated action` provenance remains readable and
  cannot be mistaken for a provider-health success state.
- The mobile order preserves incident context before the action and evidence
  before audit detail.
- Reduced motion removes nonessential animation without hiding state changes,
  approval feedback, or recovery confirmation.
- Keyboard focus order follows the visual order; every interactive control has
  a visible focus state and an accessible name.
- Primary and secondary actions remain visually distinct; destructive-looking
  styling is not used for a simulated action.
- Desktop and mobile show the same state semantics, IDs, timestamps, and audit
  count.

Any failure is a no-go. The candidate remains separate from the last approved
package; if no approved package exists, the deterministic fallback contract
remains the only planning baseline.

## Handoff record required for future implementation

The future manifest must record:

- Package name and version, source host, source project/file identifier, and
  immutable source revision.
- This contract's commit SHA and the fixture/API schema revision.
- Token file hash; asset filenames, MIME types, hashes, and licenses.
- Every phase, viewport, screenshot filename, dimensions, and hash.
- Browser engine/version, operating environment, locale, timezone, device
  scale factor, font stack, and reduced-motion setting.
- Screenshot automation result, human review result, reviewer role, review
  time, and accepted limitations.
- A truthful statement of whether the artifact is static, fixture-integrated,
  or live. `Fixture Recovery Board v1` may only be `static` or
  `fixture-integrated`.

## Acceptance checks

### T10 planning acceptance

- [x] One frozen Git baseline, branch, and top-level Orca worktree are named.
- [x] The immutable visual input is recorded as `UNAVAILABLE` without reading
  another task's output.
- [x] One future visual source-of-truth package is named with an explicit
  promotion gate.
- [x] Bounded Figma, Open Design, and MotionSites readiness evidence is
  recorded without authentication or mutation.
- [x] The deterministic fallback defines fixed data, state, copy, layout,
  tokens, viewports, and provenance.
- [x] Static fidelity precedes fixture integration and refactoring.
- [x] Screenshot acceptance covers overflow, overlap, clipping, cropping,
  hidden actions, reduced motion, accessibility, and mock provenance.
- [x] T10 remains independent and non-blocking for T0-T9.

### Future visual implementation acceptance

- [ ] `OpenDashboard Static Fidelity Package v1` is materialized with all
  required hashes and licenses.
- [ ] The static candidate passes all 15 screenshot captures and visual review.
- [ ] Explicit approval promotes exactly one immutable visual revision.
- [ ] Fixture integration passes the same screenshot matrix and deterministic
  golden path.
- [ ] Build, type, lint, test, and format commands are discovered from the
  future lockfile and pass; unavailable commands are not claimed.

## Assumptions

- `PRD.md`, `Tech-Spec.md`, and `API_CONTRACT.md` at the frozen baseline remain
  the product and behavior authority for this independent plan.
- The repository has no application source, lockfile, runnable UI, or approved
  visual asset at this stage.
- The unavailable package is a real missing input, not permission to inspect
  screenshots or other task outputs.
- A future authorized task can choose a storage path without changing the
  source-of-truth, provenance, or screenshot rules defined here.

## Risks and mitigations

| Risk | User impact | Mitigation |
|---|---|---|
| A text contract cannot prove visual quality | The first rendered screen may still look poor | Require human review before the first golden baseline is promoted |
| System font rendering varies by environment | Pixel diffs may be noisy or misleading | Pin the capture environment and compare only like-for-like runs |
| Mock provenance disappears on small screens | Reviewers may believe the data or action is live | Use a persistent global banner plus local `Mocked` badges and mobile semantic assertions |
| A connector session is mistaken for design readiness | Implementation may start from an incomplete or mutable file | Require the independent immutable package and manifest promotion gate |
| MotionSites OAuth cannot be proven from current status | Optional references may be unavailable | Mark it not ready and use the local deterministic fallback without blocking |
| A candidate overwrites a stable demo | A failed recovery attempt could break presentation | Keep candidates revisioned and retain the last approved package until the new full gate passes |

## Deferred decisions

- Authorized storage path and repository ownership for the future package.
- Open Design project/file identity or other authoring host used to materialize
  the package.
- Final asset set, logo treatment, and license approval.
- Screenshot runner and browser version after a technology stack and lockfile
  exist.
- Reviewer role and approval workflow for the first golden baseline.
- Optional animation after the must-have deterministic flow is green.
- Any reconciliation with T0-T9, which requires a separate post-competition
  decision and cannot be inferred from this plan.

None of these deferred decisions blocks T0-T9 or changes the competition
contract.
