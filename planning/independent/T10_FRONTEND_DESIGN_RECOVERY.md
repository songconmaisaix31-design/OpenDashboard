# T10 — Frontend Design Recovery

Status: independent planning task; no implementation

## Goal

Define an evidence-backed visual recovery contract for the current frontend
without changing or blocking T0-T9.

## Verified starting point

- The Figma connector passed a read-only identity check with a View seat on
  2026-08-16. Treat it as read-first until write access is separately verified,
  and do not add a duplicate local registration merely because it is absent
  from `codex mcp list`.
- The configured Open Design STDIO command returned a valid MCP initialization
  response, and a fresh agent completed a read-only tool call successfully. Its
  `active: false` result means no project is currently active, not a connection
  failure.
- The official MotionSites MCP endpoint was verified from
  `https://motionsites.ai/mcp`. It is registered through the user-supplied
  `npx -y mcp-remote` STDIO adapter in the default Codex home and this branch's
  project-scoped `.codex/config.toml`; OAuth remains pending user sign-in.
- The machine-local `ui-ux-pro-max` skill is quarantined. It must not be used as
  a visual source or implementation authority.

## Task blocks

1. Freeze one immutable reference package for the current UI or record it as
   unavailable. The manifest includes exact paths, content types, states,
   viewports, and SHA-256 values.
2. Define one visual source of truth in Figma or Open Design using deterministic
   fixture data, explicit tokens/assets, desktop and mobile states, and visible
   mock provenance.
3. Define screenshot acceptance, handoff evidence, and a fallback that keeps
   the last known green demo candidate when the recovery path is not ready.

## MCP and fallback policy

- Prefer the already-authenticated Figma connector for design inspection and
  the verified Open Design local MCP for artifact retrieval or generation in a
  later, separately authorized implementation task.
- Use MotionSites only for curated prompt retrieval after both registration and
  OAuth checks pass in the active Codex home. It never becomes the visual source
  of truth by itself.
- Do not duplicate registrations or copy credential stores between Codex homes.
- If one design surface is unavailable, use the other. If both are unavailable,
  use the immutable local reference package and a fixture-backed static mock.
- Missing MCP access, assets, tokens, or references is a labelled limitation,
  not permission to invent a live integration or block another task.
- MotionSites references are optional inspiration only and never a readiness
  gate. Before OAuth completes, a manually frozen reference with source and
  license provenance is the fallback.

## Boundaries

- Do not read or change application code, T0-T9 outputs, active worktrees,
  configuration, dependencies, submission files, or external state.
- Do not authenticate, install, create, edit, export, upload, deploy, or invoke
  design generation during this planning task.
- Do not redefine product behavior, API contracts, fixture semantics, or
  another independent model.
- A standalone PNG or JPEG is not a complete design handoff. The future source
  package must include assets, tokens, interaction states, and provenance.

## Suggested execution timebox

| Elapsed time | Block | Exit condition |
|---|---|---|
| 00:00-00:20 | Readiness and reference freeze | One immutable manifest or `UNAVAILABLE`; MCP status recorded truthfully |
| 00:20-01:20 | Static visual direction | One source-of-truth concept with fixture data and fallback states |
| 01:20-02:00 | Screenshot QA and handoff | Desktop/mobile evidence and a go/no-go decision |

The timebox starts only after a separate implementation authorization. A failed
visual or golden-path gate ends the attempt; it does not consume the stable
demo fallback.

## Acceptance

- Exactly one visual source of truth and one immutable input manifest are named.
- MCP readiness is supported by an executed check, not configuration presence.
- Desktop and mobile screenshots cover the source-declared key states.
- Evidence checks overflow, overlap, clipping, cropping, hidden primary actions,
  reduced-motion behavior, and visible mock provenance.
- The plan remains a CodeGraph leaf and can be postponed or discarded without
  changing T0-T9.

## Result

A self-contained visual recovery contract, MCP readiness record, mock fallback,
screenshot gate, assumptions, and deferred-decision list. Record the planning
outcome in `reports/planning/T10.md`.
