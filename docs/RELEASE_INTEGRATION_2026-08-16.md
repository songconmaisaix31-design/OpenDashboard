# Chinese Competition Release Integration

- Status: complete for local recording handoff
- Date: 2026-08-16
- Source candidate: `df32f6800b2fe65d8b86e7046e3d07ce0c4031fb`
- Working branch: `chinese-release-integration`
- Isolated worktree: `C:\Users\DW\orca\workspaces\OpenDashboard\chinese-release-integration`

## Outcome

Produce one locally verifiable Chinese competition candidate and one Chinese
90-second demonstration video. The release must make the fixture boundary,
approval gate, recovery verification, and redacted audit trail understandable
without implying that mocked providers are live.

Winning the competition is an objective, not a verifiable acceptance claim.
The controllable release qualities are clarity, deterministic execution,
visual legibility, truthful evidence, and fallback readiness.

## Verified starting state

| Block | Current state | Release meaning |
|---|---|---|
| T0 | Implemented | Buildable React/TypeScript/Vite foundation and frozen contract |
| T1 | Implemented | Deterministic fixture engine and evidence export |
| T2 | Implemented | Guided web interface and presentation tests |
| T3 | Implemented documentation | Submission descriptors, claim ledger, and demo script |
| T4 | Integrated and verified | T1-T3 composed in the local fixture candidate |
| T5-T10 | Planning complete only | Independent plans; no runtime module is integrated or claimed |

The phrase “T0-T10 complete” therefore means all assigned stage deliverables
exist. It does not mean that the six post-P0 planning modules are implemented.

## Release scope

- Make all human-facing application copy Chinese. Product names, provider
  names, opaque IDs, HTTP paths, JSON field names, and contract enum values may
  remain unchanged where translation would break the technical evidence.
- Set document language and metadata to Simplified Chinese.
- Preserve the exact five-phase fixture state machine and approval boundary.
- Align tests, submission claims, demo script, README, and project memory with
  the integrated implementation.
- Use CodeGraph to re-index the localized candidate and inspect the production
  composition path. CodeGraph is supporting integration evidence, not a
  replacement for tests or browser QA.
- Build a 16:9, 1080p, 30 fps, approximately 90-second Chinese demo from the
  verified local website. Keep the editing project editable. No upload or
  public submission is authorized by this task.

## Exclusions

- No live Cordis, LocalOps, Agent Usage Manager, FastAPI Radar, Hardware, Orca,
  or AgentTeams adapter.
- No real restart, process control, arbitrary shell, external request, secret
  access, executable plugin, deployment, upload, push, or `main` update.
- No new UI framework, localization dependency, server, database, or broad
  redesign.

## Acceptance criteria

1. `npm run check` passes from the lockfile-backed candidate.
2. The production entry renders the real fixture adapter, not the preview data
   source.
3. Desktop and mobile browser QA complete the golden path without overflow,
   overlap, clipped primary actions, console errors, or hidden fixture labels.
4. A focused source/test scan finds no unintended English human-facing copy.
5. The claim ledger promotes only behavior proven by the current checks and
   keeps all provider behavior explicitly mocked or deferred.
6. CodeGraph reports a synchronized index and confirms
   `createFixtureDataSource` is called from the production entry.
7. The video shows the actual Chinese candidate, includes persistent mock
   disclosure, follows the five phases, and ends on the redacted report.
8. The final report records the candidate commit, exact checks, video path or
   blocker, and remaining risks.

## Verification sequence

1. Baseline check on `competition-integration`.
2. Localize and align documentation in this isolated worktree.
3. Run type checks, tests, build, source scans, and CodeGraph sync.
4. Serve only on loopback and perform desktop/mobile golden-path QA.
5. Capture source material and build the editable video project.
6. Export and inspect the video, then commit the verified candidate on the
   isolated `chinese-release-integration` branch. Keep
   `competition-integration` and `main` unchanged during this accelerated
   recording handoff.

## Final local handoff

- Website: `http://127.0.0.1:4173/`
- Video: `artifacts/demo/OpenDashboard-GOAI-ZH-90s.mp4`
- ChatCut project ID: `c3aee252-8e03-4e2a-b9ab-89f27c9d1dbd`
- ChatCut timeline ID: `5b3cab4d-48c4-4f2f-99f0-66ffe0d67b12`
- ChatCut render ID: `944df8bb-42d6-4fcc-af86-f82c3a8fa635`

The timeboxed handoff uses Chinese on-screen captions and the verified fixture
journey. Additional narration, deployment, upload, and public submission are
outside this local recording scope.
