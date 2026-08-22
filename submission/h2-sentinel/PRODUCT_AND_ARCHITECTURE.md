# H2 Sentinel: Product and Architecture Narrative

## Product positioning and safety boundary

H2 Sentinel / 氢哨 is a local-first H2 EMS anomaly-diagnosis and decision-support application. It makes timing, evidence, impact, safety checks, provenance, and an advisory next step reviewable. It does not replace an EMS, issue equipment commands, dispatch power, or permit generated text to select a control action. Every recommendation requires human confirmation.

The explicit H2 modes are `fixture` and `local`. Fixture data is sanitized synthetic evidence. Local mode is a same-origin path to a validated loopback analytics target; it is not a remote-host interface, arbitrary shell surface, or general plugin runtime.

## Attempt-6 technical evidence

The technical E2E run is bound to executable SHA `58090bc1747d621bc87d698259319a70c34e75f2`. It processed a raw 69-field, 172,800-row input (77,865,257 bytes, SHA-256 `88f3a5c15fb5c42d265475f2998fe9f6c271dcef16f43daee7626f6704504cd9`) and normalized it to 78,038,054 bytes (SHA-256 `4407495ad75299f2f8f06112f6d3209eb93b2773ff3f0c797c47874159853169`). The run recorded 104 events, a 104-row by 16-column export, 21 variables by 172,800 points, and passed cleanup. Its sanitized report is `validation/reports/epoch-2/run_f2bc8c0433f8/attempt-6/official-csv-e2e.json` with SHA-256 `8796dd1f9e9baca3dad0711c6fb74ccca40485874527a5ef0e2323a9111bf27f`.

This evidence replaces prior incorrect descriptions of the input shape and export result. It is not an accuracy, organizer acceptance, ranking, or score claim. Internal reports mentioning 0.2168 or 0.9517 lack immutable `testedCodeSha` binding and are historical/unbound; they are not current F1, precision, recall, or accuracy results.

## Deployment and release boundary

Deployment `dpl_CNFKRWQcgtjepBJnbh3J6mSqpJAf` served 200 SPA shells from `h2-sentinel-hxrbu0wan-dwwww.vercel.app`, with explicit alias `204421.xyz`, on the tested root and H2 mode URLs. Inspected remote JavaScript contained the H2 title, invalid-mode, and Chinese-brand markers. That proves route/shell service only: it is not a desktop/mobile visual or interactive-flow pass.

Three GitHub Actions runs are green for exact SHA `58090bc`: push H2 `32591314579`, PR H2 `32591315711`, and generic PR `32591315735`. They do not verify later documentation commits.

## Taxonomy boundary

C01-C07 are the shared anomaly vocabulary. Internal/API contracts use English severity enum values. External submission material uses the Chinese taxonomy values `高` and `中`; these are distinct representations and must not be interchanged by presentation code or CSV generation.

## Organizer and visual holds

The reviewed organizer rule requires one leader submission before the stated 2026-08-21 online-work deadline, with team information, a 100-character one-line description, a 500-character introduction, a ten-page-or-fewer Feishu project document, and assessable demo/product material. Video is recommended and a repository is optional. On 2026-08-23, this package has no admissible registration, form, submission, receipt, acceptance, approval, score, or rank evidence. All of those remain `UNKNOWN-HOLD`.

Desktop/mobile visual verification and interactive deep-link verification are also `UNKNOWN-HOLD`: computer control was prohibited, and an HTTP shell is not a visual or interaction result.

## Source package boundary

The organizer package has a documentation-integrity discrepancy described in the license checklist. It does not alter the separately recorded official-test CSV SHA-256 above. A requirement document references Section 8 D01-D13 and Section 13 scoring, but those sections are absent from the supplied body; no deliverable or scoring rule is invented from the missing text.
