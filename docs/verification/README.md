# Verification evidence (historical)

Every file in this directory is a dated record of what was checked at one past
checkpoint. Records are kept as written and are not rewritten to match later
behavior, so read them as evidence of the past, not as instructions. "Recorded
in" below is the commit that added the record.

**To verify the site today, run `npm run verify`.** [README.md](../../README.md)
has the full command list, [AGENTS.md](../../AGENTS.md) and the skills under
[`.agents/skills/`](../../.agents/skills/) own the authoring and publishing
workflow, and [docs/adr/](../adr/README.md) records why the architecture is what
it is.

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
| [issue-19](issue-19-historical-evidence.md)   | 2026-09-07 | this change | Historical evidence separated from current instruction          |

## Page counts are checkpoint counts

The August 2026 records count a smaller site than the one that builds today, and
those counts were correct when written:

- issue-5 reports 77 pages and issue-6 reports 78, both against 38 English and
  38 Hebrew recipes: 76 recipe pages plus the English landing page, and plus the
  Hebrew landing page once it existed.
- A build today generates 86 pages: 41 pairs, so 82 recipe pages, plus two
  landing pages and the two localized poolish calculator pages.

Counts in later records (82 recipes, 86 pages) match the current build.

## Artifacts that are no longer available

Some commands and paths in the August 2026 records cannot be re-run from a
checkout, and no copy of them is kept in this repository:

- `.impeccable/screenshots/` was always ignored by Git (see `.gitignore`), so
  the screenshots issue-4 reviewed exist only on the machine that made them.
- `/private/tmp/recipe-grams-*.png` were temporary files on that same machine.
- `node .agents/skills/impeccable/scripts/detect.mjs` came from a locally
  installed skill. `.agents/skills/` tracks only the `recipe-grams-*` skills, so
  this tool is not in the repository and its output was not recorded.
- Fixed preview ports such as `4322` and `4326` were ad-hoc local servers.
  Verification now starts its own preview on an OS-assigned port.

The commands that still exist are `npm run format:check`, `npm run build`,
`npm run typecheck`, and the `verify:issue5`/`verify:issue6`/`verify:issue7`
aliases, which now run the behavior-named checks described in
[README.md](../../README.md).

## Screenshots

The PNG files here are historical evidence and stay as they are; nothing
regenerates or overwrites them. Screenshots, traces, and reports from a current
run are written to the ignored `.astro/verification/browser/` directory instead,
so a verification run never touches this directory.
