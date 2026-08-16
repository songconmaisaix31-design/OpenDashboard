# OpenDashboard Memory

## Project context

- Created: 2026-08-16
- At the start of the Codex MCP repair task, the repository contained only Git metadata.
- The `competition-integration` branch now contains a runnable local fixture
  application, npm lockfile, deterministic engine, guided React interface,
  submission package, and T4 verification record. There is still no deployment
  target or live provider.
- The Codex MCP repair objective was superseded by the OpenDashboard competition planning request on 2026-08-16; its durable non-secret findings remain below for reference.

## Current objective

- Deliver a verified Simplified Chinese competition candidate and a local,
  editable 90-second demonstration video from the deterministic fixture flow.
- Optimize for reviewer clarity and truthful evidence; winning is an objective,
  not a claim the project can verify.
- Keep all secret values out of this repository and this file.

## Decisions and findings

- The active Orca Codex runtime configuration is stored under the Orca-managed Codex home, not only the default user Codex home.
- The latest runtime startup initialized `node_repl`, `codegraph`, `open-design`, and `codex_apps` successfully.
- The default user Codex home reports an OAuth state for `chatcut`, while the
  Orca runtime home reports ChatCut as not logged in. An isolated Codex TUI
  launched with `CODEX_HOME=C:\Users\DW\.codex` exposed the full ChatCut tool
  manifest and completed a read-only `list_projects` call. ChatCut manifest
  loading and authentication are therefore no longer the video blocker.
- `vercel` remains not logged in and is outside the local release scope.
- Do not copy credential files between Codex homes. Reuse the authenticated
  user-level Codex home only in a bounded isolated video session; never record
  credential values in the repository.
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

## Implemented competition baseline

- T0-T4 are implemented or integrated in the local candidate recorded by
  `reports/tasks/T4.md`. The current source candidate before Chinese release
  work is `df32f6800b2fe65d8b86e7046e3d07ce0c4031fb`.
- T5-T10 are independent planning-only branches. Their completion does not
  authorize or prove runtime integration.
- The Chinese release uses direct in-repository copy because only one locale is
  required. No localization dependency or speculative multilingual framework
  is justified for the timebox.
- Product/provider names, opaque IDs, HTTP paths, JSON keys, and contract enum
  values may remain English; all human-facing application explanations and
  controls must be Chinese.
- Release changes are isolated in the `chinese-release-integration` child
  worktree and merge only into `competition-integration` after verification.
- Chinese video source frames come from the production entry after completing
  the real fixture flow in Chrome. A third-party translation extension overlay
  was removed only from the browser capture DOM through a temporary CDP action;
  application source and product content were not altered.
- The accelerated 2026-08-16 handoff prioritizes a smooth local demonstration
  and a usable captioned video over additional narration or visual-polish
  passes.
- ChatCut project `OpenDashboard GOAI Chinese Demo 2026-08-16` has project ID
  `c3aee252-8e03-4e2a-b9ab-89f27c9d1dbd` and timeline ID
  `5b3cab4d-48c4-4f2f-99f0-66ffe0d67b12`. Render
  `944df8bb-42d6-4fcc-af86-f82c3a8fa635` completed locally as
  `artifacts/demo/OpenDashboard-GOAI-ZH-90s.mp4`; no upload or public share was
  performed.
