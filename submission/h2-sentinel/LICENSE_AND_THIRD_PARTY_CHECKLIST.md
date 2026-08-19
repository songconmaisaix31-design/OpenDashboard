# License and Third-Party Checklist

## Current truth

The root [NOTICE](../../NOTICE) says OpenDashboard uses third-party dependencies under their respective licenses and that no reviewed upstream source file was copied into the 2026-08-17 plugin-runtime baseline. No H2-specific `THIRD_PARTY_NOTICES.md` exists at this frozen gate, and this package adds no dependency or copied source.

The H2 PRD lists intended P0 boundaries — Apache ECharts, FastAPI, Pydantic, LightGBM, pandas, scikit-learn, and Jinja — but this is not proof that they are present in an assembled H2 runtime. Evidently and PyRCA are optional; Merlion and broad orchestration/dashboard platforms are rejected. This document is an attribution input, not a complete notice.

## H6 completion checklist

| Check | Required evidence | Status at frozen gate |
| --- | --- | --- |
| Inventory actual shipped dependencies | Candidate lockfiles/manifests | Pending; H2 runtime not assembled |
| Inventory copied code/assets/snippets | Path, source URL, license, attribution decision | Pending |
| Confirm license compatibility | License/version and distribution obligations | Pending |
| Create/update H2 notice | Reviewed `THIRD_PARTY_NOTICES.md` or approved notice mechanism | Pending; file absent |
| Preserve root NOTICE accuracy | Review against actual candidate dependencies | Pending |
| Exclude rejected code | Diff and inventory review | Pending |
| Authorize dataset inclusion | Organizer terms/license and inclusion decision | Pending; official data absent |
| Verify report/screenshot assets | Asset origin, permission, attribution | Pending; no assets captured |

## Required attribution record

```text
name | version/commit | purpose | source URL | license | copied? | notice location | reviewer/date
```

Do not say an intended library is used until the record and assembled candidate confirm it. Do not include private data, credentials, or unlicensed assets in a submission archive.

## Source basis

- [H2 PRD](../../docs/competition/h2-sentinel/PRD.md)
- [Root NOTICE](../../NOTICE)
- [H2 contracts](../../packages/h2-contracts/README.md)
