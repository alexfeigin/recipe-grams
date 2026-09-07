# Issue #5 Generated Recipe Pages Verification

> Historical record. See [the evidence index](README.md) for what this directory is; run `npm run verify` for current verification.

## Commands

- `npm run build`
- `npm run typecheck`
- `npm run verify:issue5`
- `npx prettier --check package.json package-lock.json src/lib/recipePages.ts src/pages/[language]/[slug].astro src/pages/index.astro scripts/verify-issue-5.mjs`

## Coverage

- Build generated 77 pages: one landing page plus 76 localized recipe pages from `en/*.MD` and `he/*.MD`.
- `scripts/verify-issue-5.mjs` checks that every localized Markdown recipe has a generated `dist/{language}/{slug}/index.html` page.
- The verification script checks representative English and Hebrew `pizza_dough` body content, page language/direction, image URLs, generated landing-page sample links, and removal of first-line legacy back links from generated site output.
- `npm run build` emits non-failing warnings for localized recipe pages that do not yet have explicit page title and description metadata.
- Browser screenshots were captured for English and Hebrew `pizza_dough` pages at desktop and phone widths.

## Screenshots

- `docs/verification/issue-5-screenshots/en-pizza-desktop.png`
- `docs/verification/issue-5-screenshots/en-pizza-phone.png`
- `docs/verification/issue-5-screenshots/he-pizza-desktop.png`
- `docs/verification/issue-5-screenshots/he-pizza-phone.png`

## Checkpoint context (added 2026-09-07)

The 77 pages counted here are the site at revision `1d82c68`, which held 38
English and 38 Hebrew recipes: 76 recipe pages plus the English landing page. A
build today generates 86 pages from 41 pairs. `scripts/verify-issue-5.mjs` was
renamed to `scripts/verify-recipe-pages.mjs`, with `verify:issue5` kept as an
alias. The screenshots listed above are preserved in this directory.
