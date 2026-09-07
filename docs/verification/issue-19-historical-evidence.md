# Issue 19: historical evidence separated from current instruction

> Historical record. See [the evidence index](README.md) for what this directory is; run `npm run verify` for current verification.

Verified 2026-09-07 against a local production build at revision e0847f1.

A contributor reading `docs/` could not tell instructions from evidence: the
migration spec, ten verification notes, and a Word guide all read as if current.
Every historical claim below was checked against Git before being described.

## What changed

| Document                               | Change                                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------ |
| `docs/verification/README.md`          | New index: what the directory is, a record table, checkpoint counts, unavailable artifacts |
| Ten `docs/verification/issue-*.md`     | One header line marking the record historical and pointing at `npm run verify`             |
| `issue-4`, `issue-5`, `issue-6`        | A closing section naming unavailable artifacts and placing their counts at a revision      |
| `docs/specs/0001-astro-recipe-blog.md` | Header marking it the historical migration spec, with links to current guidance            |
| `docs/adding-a-recipe.he.md`           | New concise Hebrew guide covering source, catalog, index, verification, and publishing     |
| `docs/history/`                        | The Word guide moved here with a README recording what it said and what it omitted         |
| `README.md`, `AGENTS.md`, `PRODUCT.md` | Links to the Hebrew guide and to the three historical locations, marked as not instruction |

## Evidence

- **Counts are checkpoint counts, and stand.** `1d82c68` (issue-5, 77 pages) and
  `dbaebbf` (issue-6, 78 pages) each hold 38 `en/*.MD` and 38 `he/*.MD` against
  41 of each today: 76 recipe pages plus one and then two landing pages. Today 41 pairs and the two poolish pages build 86 pages, matching the
  count recorded for issue 17. No historical count was rewritten.
- **Unavailable artifacts are named, not glossed.** `.gitignore` ignores
  `.impeccable/screenshots/`, and `git log --all` over that path and over
  `.agents/skills/impeccable` returns nothing, so neither the issue-4
  screenshots nor the `detect.mjs` tool ever entered the repository. The
  `/private/tmp/recipe-grams-*.png` paths were temporary files on that machine.
  Ports 4322 and 4326 were ad-hoc previews; verification now assigns its own.
- **Commands that still exist are separated from those that do not.**
  `format:check`, `build`, and `typecheck` remain. `scripts/verify-issue-5.mjs`
  and `scripts/verify-issue-6.mjs` were renamed in `0d5ffa9` to
  `verify-recipe-pages.mjs` and `verify-catalog.mjs`, and `verify:issue5`,
  `verify:issue6`, `verify:issue7` remain aliases in `package.json`.
- **Issues 7 and 8 have screenshots and no note.** `git log --diff-filter=A`
  shows `issue-7-screenshots/` added in `7fde72b` and `issue-8-screenshots/` in
  `5dfa97f`, with no `.md` file ever added for either. The index says so rather
  than implying a missing file.
- **The issue-6 warnings were not overstated.** A build today still warns for
  `pastry_cream`, `salt`, and `simple_vinaigrette`, now as a missing category,
  so the added note says the warnings persist instead of claiming they were
  fixed.
- **Screenshots are immutable and distinct.** No PNG appears in this change.
  `playwright.config.mjs` writes run artifacts to the ignored
  `.astro/verification/browser/`, so a run cannot overwrite this directory.
- **The Word guide is described from its own contents.** The archive README
  records its six steps — sync, add a `.MD` file, format the text, paste the
  translation, update `index.MD`, commit and sync — and the three things it
  predates: catalog metadata, `npm run verify`, and separate site publishing.
  It moved with `git mv`, so its history follows it.

## Preserved

`index.MD`, `en/`, `he/`, `images/`, `AGENTS.md`, and the `recipe-grams-*`
skills are unchanged. The historical notes keep their original wording; every
addition is an appended, dated section or a single header line.

## Checks

Documentation-only change; no source, asset, or generated output was touched.

- `npm run verify` passed end to end: Astro check, TypeScript, a clean rebuild
  with the Pagefind index, the static recipe, catalog, link and image checks,
  and 74/74 browser cases against the owned preview.
- `npx prettier --check .` passed.
- Every relative link in the added and edited documents resolves.
