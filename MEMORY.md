# OpenDashboard Memory

## Project context

- Created: 2026-08-16
- At the start of the Codex MCP repair task, the repository contained only Git metadata.
- The repository now contains a planning baseline but still has no application source, package manager lockfile, runtime, or deployment target.
- The Codex MCP repair objective was superseded by the OpenDashboard competition planning request on 2026-08-16; its durable non-secret findings remain below for reference.

## Current objective

- Review the supplied long-term OpenDashboard plan without executing it.
- Define a sharply reduced competition demo, explicit mock fallbacks, and isolated Agent worktrees.
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
- Competition implementation will merge through a separate Integrator-owned `competition-integration` worktree, with builder worktrees created just in time from an explicit immutable Gate commit.
- The competition baseline is one deterministic incident-to-recovery journey with all external providers explicitly mocked.
- Real Cordis, LocalOps, AUM, Radar, Hardware, Orca, and AgentTeams integration is deferred beyond P0.
- The proposed implementation team is one Integrator, three path-isolated builders, and one read-only claim reviewer rather than eight parallel builders.
- Three top-level read-only review worktrees were created: `review-product-scope`, `review-architecture-mocks`, and `review-coordination-git`.
- The supplied source pack has extensive filename/content mismatches. `AGENT_COORDINATION_RULES (1).md` and `OpenDashboard_MASTER_PLAN.md` share SHA-256 `6110D7BB2011503BF5811BFB9D4527913A427799CFEC3A97B27F4664EAAE44EC`; several `.yaml`, `.json`, and Agent packet names contain different document types.
- Never automate against the supplied pack until filenames, content types, hashes, and missing Agent packets are repaired.
