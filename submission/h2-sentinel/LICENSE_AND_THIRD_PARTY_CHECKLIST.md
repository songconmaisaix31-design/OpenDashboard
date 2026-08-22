# License and Third-Party Checklist

## Source-package integrity boundary

Three organizer-package ZIP copies from Desktop/Downloads are byte-identical: 68,574,329 bytes, SHA-256 `27dd2d096e0eb002cf50feb68f33fd1b586b46e4daddf97398390dc6394a5072`. Their checksum manifest exactly matches 20 data/material entries. This is not a whole-package verification: five actual top-level documents do not use the manifest paths. The XLSX is renamed only and its content hash matches the manifest, while the DOCX and two Markdown files differ in content and size from the manifest. `00_赛题包说明.pdf` is present but not listed in the manifest.

Record this as an organizer-package documentation-integrity discrepancy. It does not change the separately recorded official-test CSV hash `88f3a5c15fb5c42d265475f2998fe9f6c271dcef16f43daee7626f6704504cd9`.

The supplied requirement text also references Section 8 D01-D13 and Section 13 scoring, although those sections are absent from the body. Do not infer license scope, deliverables, scoring, or organizer acceptance terms from missing text.

## Source and archive review

| Check | Status | Boundary |
| --- | --- | --- |
| Locked package dependency notices | Source-level record | Review root notice files for the actual distribution. |
| Copied H2 source/assets | No copied upstream material asserted | Re-review every future imported asset or snippet. |
| Official CSV data | Not included | Do not distribute it through this package. |
| Screenshots and visual assets | Not included | No desktop/mobile visual pass is claimed. |
| Organizer package manifest | Discrepancy recorded | Do not call the whole package checksum-verified. |
| Final distribution | Not certified | Review the final archive, organizer terms, origin, authorization, and redaction. |

## Submission safeguards

- Do not include private data, credentials, or unlicensed assets.
- Preserve Fixture labeling; synthetic evidence is not official data.
- Keep technical E2E evidence distinct from registration, receipt, acceptance, approval, score, and rank.
- A visual asset needs capture context, origin, and redaction review before use.
