# OpenDashboard Competition Demo PRD

- Status: implemented local fixture candidate; Chinese release integration in progress
- Date: 2026-08-16
- Hard delivery target: draft uploaded by 22:15 Asia/Shanghai

## Product decision

The competition deliverable will prove one understandable and trustworthy incident-response workflow. It will not attempt to build the long-term local observability platform or integrate every named upstream project.

The user value is simple: a developer can see why a local API is failing, inspect the evidence, approve a bounded recovery step, verify the result, and export an honest audit record without switching between multiple tools.

The competition website and demonstration video use Simplified Chinese. Stable
technical identifiers remain unchanged so the evidence stays auditable.

## Primary user

A solo AI-native developer running several local services who needs a fast, safe explanation of an API failure and a reproducible recovery record.

## Golden path

The complete demo should take no more than 90 seconds:

1. Open the dashboard in `Fixture Demo` mode.
2. See `order-api` in a degraded state and an open `api-error-burst` incident caused by a fixture-owned transient runtime latch.
3. Open the incident and inspect normalized HTTP, trace, log, and resource evidence.
4. Run the read-only `api-500-triage` workflow.
5. Request a simulated managed-runtime restart and see an approval gate.
6. Approve the simulated restart, which confirms only a fixture action, and see the ordered audit events.
7. Run recovery verification, which clears the fixture-owned latch and transitions the API from failing to healthy.
8. Export a redacted evidence report that identifies every mocked source.

## Scope

### Must ship

- One deterministic fixture dataset for the complete golden path.
- One guided dashboard experience; separate production-style pages are not required.
- Visible `Fixture`, `Mocked`, `Degraded`, and `Planned` provenance labels.
- Incident, evidence, approval, action, verification, and audit state transitions.
- At least three Agent role descriptions and six Skill descriptors for the competition narrative.
- A downloadable or inspectable redacted evidence artifact.
- A repeatable reset that restores the initial demo state.
- A buildable artifact and one automated golden-path check once implementation exists.
- A claim audit that distinguishes implemented, mocked, designed, and deferred capabilities.
- Simplified Chinese human-facing copy across the production entry, with no
  hidden English fallback in the golden path.
- One locally exported, editable, approximately 90-second demonstration video
  based on the verified production entry.

### Should ship only after the must-have flow is green

- Lightweight animation between demo phases.
- Responsive presentation at 1280 px and 1440 px widths.
- A single optional read-only loopback health probe behind an explicit opt-in boundary.
- A short recorded fallback demo.

### Explicitly mocked in the competition build

- Cordis plugin lifecycle and service composition.
- LocalOps discovery and managed-runtime restart.
- Agent Usage Manager process/resource observations.
- FastAPI Radar traces and exceptions.
- Hardware telemetry.
- Orca workspace/session data.
- AgentTeams execution and inter-agent messaging.

Every mocked object must carry machine-readable provenance and a visible UI badge. Mocked behavior must never be described as a live integration.

The demo fault is not a code defect. It is an explicit fixture-owned transient latch designed to clear only during fixture recovery verification, after approval confirms the simulated action. This prevents the story from implying that approval itself repaired code or controlled a real process.

### Cut from the competition build

- Real sidecars, Docker/WSL topology, SQLite, retention, reconciliation, and provider handshakes.
- A plugin loader, marketplace, signing, sandbox, or arbitrary plugin execution.
- A general automation engine or visual workflow editor.
- Real process control, shell execution, request replay, dependency installation, commit, push, or destructive actions.
- A twelve-page dashboard, live log streaming, trace waterfall, or broad charts.
- Multi-user authentication, remote access, or production deployment claims.

## Acceptance criteria

- A fresh user can complete the golden path without external credentials or services.
- The same inputs produce the same state transitions and evidence IDs.
- No step reads secrets, credential stores, private keys, or `.env` files.
- No demo action controls a real process or sends a non-loopback request.
- The UI never presents a fixture observation as live data.
- Approval is required before the simulated recovery action.
- The final evidence artifact records before/after state, provenance, action, approval, and verification.
- Submission copy states that the restart and recovered state belong to the deterministic fixture, not a real managed process.
- Available build, type, lint, test, and formatting checks pass; unavailable checks are listed as not configured rather than reported as passed.
- Desktop and mobile Chinese copy has no overflow, overlap, clipping, or hidden
  primary action in the golden path.
- The video visibly discloses fixture/mock provenance and does not imply live
  provider execution.

## Success metric

The demo succeeds when a reviewer can accurately describe the workflow and its trust boundary after one run. Breadth of integrations is not a success metric for this timebox.

## Remaining product risks

- The original submission pack has filename/content mismatches and cannot be used for automated dispatch.
- The long-term story names many unverified upstream integrations; claims must remain design-level.
- A visually polished fixture can be mistaken for a live platform unless provenance is persistent and prominent.
- Starting real provider work before the deterministic flow is complete would likely prevent delivery.
