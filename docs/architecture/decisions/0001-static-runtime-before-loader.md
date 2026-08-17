# ADR 0001: Static Runtime Before a Plugin Loader

- Status: accepted
- Date: 2026-08-17

## Context

The product vision includes trusted plugins, sidecars, and a community ecosystem. The current repository has one deterministic in-process provider and no security boundary for unknown code.

## Decision

PF1 implements a compile-time TypeScript registry for reviewed Tier 0/1 definitions. It validates manifest metadata, orders dependencies, owns service lifetimes, rolls back failed activation, and rejects Tier 2 execution. PF2 adds the Fixture provider and PF7 composes it. No stage loads files, packages, YAML, URLs, or subprocesses.

## Why it matters

This proves the extension seam without exposing a developer's machine to arbitrary code. Contributors get a stable contract and tests; users keep deterministic startup and truthful provenance.

## Consequences

- Adding a plugin requires a source change and review.
- Capability declarations remain audit metadata, not sandbox permissions.
- Marketplace, hot reload, sidecars, and WASM are deferred.
- A future loader must use a separate threat model and cannot silently replace this trust decision.
