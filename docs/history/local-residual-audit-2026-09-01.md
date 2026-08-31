# Local Residual Audit — 2026-09-01

This is a public-safe, read-only classification of local Git state. It records branch names and commit IDs, but no absolute paths, secret values, credential locations, or agent logs. The audit changed no pre-existing worktree, branch, commit, or untracked file.

## Cleanup baseline

- Live remote `main`: `7889feb274dac77753fdd323df352c9c1335aebf`
- Immutable pre-cleanup tag: `pre-cleanup-2026-08-31@7889feb274dac77753fdd323df352c9c1335aebf`
- Cleanup branch at audit start: `cleanup/OpenDashboard-20260831@7889feb274dac77753fdd323df352c9c1335aebf`
- Inventory: 80 pre-existing worktrees were inspected; the isolated cleanup worktree made 81 total during the audit.

## Dirty worktrees retained

Six pre-existing worktrees were dirty and were left untouched:

- `OpenDashboard` (`main@6b9fb7e`): modified `MEMORY.md`.
- `h2-track-a-detect@cdcff49`, `h2-track-b-evidence@0ecaa63`, `h2-track-c-web@f1ba8de`, `h2-track-d-qa@bde9136`, and `H2_Sentinel@f564648`: each contains an untracked `.opencode/` directory.

These are protected local residuals, not cleanup candidates.

## Commits not reachable from remote refs

Seventeen commits were reachable from local refs but not from any `origin/*` ref at audit time. They were retained without cherry-pick, merge, push, or deletion.

### H2-only fixes — keep separate

- `0902f01` on `songconmaisaix31-design/h2-full-ui-e5`
- `514cf3d` on `songconmaisaix31-design/h2-full-route-e5`
- `1cf780c` on `songconmaisaix31-design/h2-track-tune`
- `7b7f67f` on `songconmaisaix31-design/h2-plugin-event-id-uniqueness`
- `7b06988` on `fix/h2-web-run-identity`
- `6d5ba64` on `fix/h2-web-provenance`

Classification: unpublished H2 implementation residuals. They are not imported into OpenDashboard cleanup or represented as current product capability.

### Local console and T5–T10 plans — preserve for later decision

- `9853ed0` on `songconmaisaix31-design/local-console-planning`
- `837065b` on `plan-plugin-sdk`
- `fb7d4cb` on `plan-frontend-design-recovery`
- `9658117` on `plan-action-policy`
- `14fb47c` on `plan-observability-incidents`
- `c4041f1` on `plan-api-debug-radar`
- `3b5bbe7` on `plan-runtime-hardware`

Classification: unpublished planning residuals. They remain outside the maintained branch and do not expand the single PF3 candidate milestone.

### Independent planning chain — preserve as one local lineage

- `880c0b5`, `d29afdb`, `9317236`, and `53f24cc` on `independent-planning`

Classification: unpublished independent planning/tooling lineage. It was not imported, rewritten, or deleted.

## H2 separation

Sixty-two pre-existing worktrees are H2-named worktrees, including one detached checkout. H2 tags `h2-sentinel-competition-2026-08-20@e435705` and `h2-affected-equipment-fix-20260822@c289ea9` are not ancestors of `origin/main`; they remain historical H2 refs, not OpenDashboard `main` implementation evidence.

No H2 branch or commit was merged, no local H2 fix was imported, and no H2 worktree was modified or removed by this cleanup.
