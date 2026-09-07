# Issue 18: architecture records reconciled with implementation

> Historical record. See [the evidence index](README.md) for what this directory is; run `npm run verify` for current verification.

Verified 2026-09-07 against the production build at revision 6f75aa2.

Three architecture decisions no longer described the implementation. Each was
checked against current source and generated output before being amended, so
the records now match behavior rather than the other way round.

## Findings and records

| Decision                               | Reviewed behavior                                                                 | Record                     |
| -------------------------------------- | --------------------------------------------------------------------------------- | -------------------------- |
| 0008 Remove legacy back links          | Back links present in all 82 recipes; stripped only while rendering               | Superseded by 0023         |
| 0016 Link public images to root images | No `public/` directory and no link; `publicDir: "./images"` in `astro.config.mjs` | Superseded by 0024         |
| 0006 Prefer a catalog over the index   | Build never parses `index.MD`; both indexes are permanently maintained            | Current, clarified by 0025 |

The superseded records keep their original wording and gain one closing line
naming the record that replaced them, so the earlier reasoning stays readable.
`docs/adr/README.md` lists all 25 decisions with the same status information.

## Evidence

- Back links: `[Back to Menu](../index.MD)` in 41/41 `en/*.MD` and
  `[חזרה לתפריט](../index.MD)` in 41/41 `he/*.MD`, each as the exact first line.
  `stripLegacyBackLink` in `src/lib/recipePages.ts` removes it during rendering;
  zero occurrences of either phrase appear anywhere in `dist/`.
- Images: `publicDir: "./images"` serves the root image directory directly.
  No `public/` directory and no symlink exists in the tree. Root `images/`
  holds 58 files, and recipe images resolve from the generated site, for
  example `/recipe-grams/pizza.jpg` for the English pizza dough page.
- Indexes: `index.MD` appears in no build code path. The catalog in
  `src/lib/recipePages.ts` supplies landing pages, categories, cards, markers,
  featured order, and social previews. The generated site links to no
  `index.MD` URL, so the two indexes are separate at read time as well.

## Unchanged behavior

Rebuilding after the documentation change produced a site identical to the
deployed copy at `alexfeigin.github.io` commit 361e67b. The only difference
across the whole tree was the key ordering inside
`pagefind/pagefind-entry.json`, whose values match, so no recipe content,
asset, or accepted UI changed.

## Checks

- `npm run check`: 28 files, zero errors, warnings, or hints.
- `npm run typecheck`, clean `npm run build`, and `npx prettier --check .` passed.
- `npm run test:links`: 10 passed, 0 failed.
- `npm run verify:links`: 975 local references across 86 pages passed.
- `npm run verify:issue5`, `verify:issue6`, and `verify:issue7` passed.
