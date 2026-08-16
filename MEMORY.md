# OpenDashboard Memory

## Project context

- Created: 2026-08-16
- At the start of the Codex MCP repair task, the repository contained only Git metadata.
- The repository now contains a planning baseline but still has no application source, package manager lockfile, runtime, or deployment target.
- The Codex MCP repair objective was superseded by the OpenDashboard competition planning request on 2026-08-16; its durable non-secret findings remain below for reference.

## Current objective

- Review the supplied long-term OpenDashboard plan without executing it.
- Define a sharply reduced competition demo, explicit mock fallbacks, and isolated task worktrees.
- Keep all secret values out of this repository and this file.

## Decisions and findings

- The active Orca Codex runtime configuration is stored under the Orca-managed Codex home, not only the default user Codex home.
- The latest runtime startup initialized `node_repl`, `codegraph`, `open-design`, and `codex_apps` successfully.
- `chatcut` and `vercel` remained optional but not ready because their remote MCP endpoints required OAuth; no credential values were inspected.
- The default user Codex home reports an OAuth state for `chatcut`, while `vercel` is not logged in. The Orca runtime reports both as not logged in.
- Do not copy credential files between Codex homes. Resolve the remaining startup warning by either authorizing the affected remote MCPs in the active runtime or explicitly disabling them where they are not needed.
- A temporary `codegraph` command-path change was tested and fully reverted after current runtime logs showed that `codegraph` already initialized successfully.

## Competition planning decisions

- Git uses `main` as the protected release baseline; Orca's repository base ref is `main`.
- Competition implementation will merge through the separate `competition-integration` worktree, with T1, T2, and T3 worktrees created just in time from an explicit immutable T0 commit.
- The competition baseline is one deterministic incident-to-recovery journey with all external providers explicitly mocked.
- Real Cordis, LocalOps, AUM, Radar, Hardware, Orca, and AgentTeams integration is deferred beyond P0.
- Three top-level read-only review worktrees were created: `review-product-scope`, `review-architecture-mocks`, and `review-coordination-git`.
- The supplied source pack has extensive filename/content mismatches. `AGENT_COORDINATION_RULES (1).md` and `OpenDashboard_MASTER_PLAN.md` share SHA-256 `6110D7BB2011503BF5811BFB9D4527913A427799CFEC3A97B27F4664EAAE44EC`; several `.yaml`, `.json`, and Agent packet names contain different document types.
- Never automate against the supplied pack until filenames, content types, hashes, and missing Agent packets are repaired.
- The execution plan is organized as five independent task blocks:
  T0 foundation; T1 demo engine; T2 web demo; T3 submission package; and T4
  CodeGraph-backed integration and QA.
- T1, T2, and T3 must use separate worktrees from the same immutable T0 commit.
  Their write paths are disjoint, and only T4 may merge their local commits
  into `competition-integration`.
- `planning/codegraph/integration-graph.ts` is a planning-only dependency
  sentinel. It must never be imported or cited as proof that application
  integration works.
- While T0-T4 are active, future planning is isolated on the
  `independent-planning` branch. T5-T10 are planning-only modules with separate
  files and records; none may consume another T5-T10 output.
- The independent modules cover observability incidents, API diagnostics,
  runtime/hardware inventory, action policy, and a plugin SDK contract. Their
  reconciliation and any implementation are deferred until after the active
  competition work freezes.
- Their CodeGraph sentinel is isolated under
  `planning/independent/codegraph/**` so it does not overlap T4's active
  `planning/codegraph/**` ownership.
- T10 covers frontend design recovery as an independent visual-contract plan,
  not as UI implementation. It may consume one immutable visual reference
  package supplied at dispatch, never another task's output, and it cannot
  block T0-T9.
- Figma's connector passed a read-only identity check with a View seat on
  2026-08-16. Treat it as read-first until write access is separately verified.
  The configured `open-design` STDIO command passed a direct MCP initialization
  check, and a fresh agent completed a read-only tool call successfully. The
  original in-process transport remained stale, but this is not a server
  readiness failure. No credential values were inspected.
- The official MotionSites MCP endpoint was verified from
  `https://motionsites.ai/mcp` on 2026-08-16. Per the user-supplied Codex setup,
  the default Codex home and this branch's project-scoped `.codex/config.toml`
  register the public endpoint through `npx -y mcp-remote`; OAuth remains
  pending user sign-in. Do not force-edit the shared Orca runtime config or copy
  credential stores.
- The machine-local `ui-ux-pro-max` skill was reversibly quarantined at
  `C:\Users\DW\.agents\skills-disabled\OpenDashboard-20260816\ui-ux-pro-max`.
  Existing sessions may retain cached instructions; new sessions should no
  longer discover it from the active local skill root.
