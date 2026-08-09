# Issue #5 Generated Recipe Pages Verification

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
