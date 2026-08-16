# OpenDashboard Agent Guide

## Project status

- The repository currently has no application source, detected technology stack, or package manager.
- The current scope is local Codex MCP startup diagnosis and repair.
- Do not invent application architecture, dependencies, or runtime commands until source files exist.

## Working rules

- Prefer the smallest change that fixes the reproduced root cause.
- Preserve unrelated user changes and existing MCP entries.
- Use project-scoped `.codex/config.toml` only for project-specific MCP configuration.
- Treat user-level Codex configuration as shared state and inspect it with secret values redacted.
- Never read, print, copy, or persist `.env` files, private keys, tokens, passwords, or credential stores.
- Use English for code, comments, file names, commit messages, README files, technical documentation, and UI copy unless the product explicitly targets Chinese users.

## Diagnosis and verification

- Record the exact startup failure before changing configuration when reproducible.
- Use `codex --version`, `codex mcp list`, and `codex mcp get <server>` for read-only inspection.
- Validate configuration parsing and perform a bounded initialization check for the affected MCP server.
- Do not claim success from configuration parsing alone when the server process or endpoint can be tested.

## Project memory

- Store durable decisions and non-secret operational notes in `MEMORY.md`.
- Do not duplicate facts that are already obvious from source or configuration.

