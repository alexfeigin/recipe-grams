# Verification evidence

These are historical checkpoints, not a test plan. For current checks and failure
artifacts, read [Development](../development.md). Records and screenshots stay as
written; a new run never overwrites them. “Recorded in” names the commit that added
the record.

## Records

| Record                                        | Date       | Recorded in | Subject                                                         |
| --------------------------------------------- | ---------- | ----------- | --------------------------------------------------------------- |
| [issue-4](issue-4-static-english-home.md)     | 2026-08-09 | `1205cb2`   | First static English home page                                  |
| [issue-5](issue-5-generated-recipe-pages.md)  | 2026-08-09 | `1d82c68`   | Generated localized recipe pages                                |
| [issue-6](issue-6-real-catalog.md)            | 2026-08-09 | `dbaebbf`   | Real catalog landing pages                                      |
| `issue-7-screenshots/`                        | 2026-08-09 | `7fde72b`   | Recipe navigation flows — screenshots only, no note was written |
| `issue-8-screenshots/`                        | 2026-08-09 | `5dfa97f`   | Search results — screenshots only, no note was written          |
| [issue-10](issue-10-calculator-validation.md) | 2026-09-06 | `a2cd60a`   | Poolish calculator input validation                             |
| [issue-13](issue-13-control-contrast.md)      | 2026-09-07 | `8739d0b`   | Shared control contrast                                         |
| [issue-14](issue-14-pizza-links.md)           | 2026-09-07 | `6f75aa2`   | Pizza calculator resources and generated links                  |
| [issue-18](issue-18-architecture-records.md)  | 2026-09-07 | `6eb6a5a`   | Architecture records reconciled with the implementation         |
| [issue-20](issue-20-shared-theme.md)          | 2026-09-07 | `cd71119`   | Shared theme ownership                                          |
| [issue-21](issue-21-module-boundaries.md)     | 2026-09-07 | `38233e1`   | Catalog, labels, and rendering separated                        |
| [issue-17](issue-17-current-guidance.md)      | 2026-09-07 | `e0847f1`   | Product, design, and development guidance                       |
| [issue-19](issue-19-historical-evidence.md)   | 2026-09-07 | `134e624`   | Historical evidence separated from current instruction          |
| [issue-22](issue-22-unreferenced-assets.md)   | 2026-09-07 | this change | Disposition of three unreferenced published images              |

## Interpret checkpoint evidence

August's 77/78-page counts came from 38 recipe pairs and one/two landing pages;
September records counted 41 pairs and two additional calculator pages (86 pages).
These are revision-specific counts, not a maintained inventory. Old warnings for
helper recipes predate explicit unlisted intent. Old `/poolish/` URLs, module
paths, `verify:issue*` aliases, and per-suite URL variables also belong to those
checkpoints; the [decision map](../history/decisions.md#replacements-and-clarifications) explains subsequent changes.

## Unavailable artifacts

Some evidence cannot be reproduced from this checkout:

- `.impeccable/screenshots/` was ignored; issue-4 screenshots existed only on the
  original machine, as did `/private/tmp/recipe-grams-*.png`.
- `detect.mjs` came from an untracked local skill; its output was not recorded.
- Fixed preview ports were ad-hoc servers, not retained environments.
- Issues 7 and 8 have tracked screenshots but never had Markdown notes.

Tracked PNGs are retained evidence, not visual-regression baselines. The original
notes identify other unavailable comparison harnesses and checkpoint limitations.
