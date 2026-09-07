# Issue 21: catalog, shared labels, and build-time rendering separated

> Historical record. See [the evidence index](README.md) for what this directory is; run `npm run verify` for current verification.

Verified 2026-09-07 against a local production build at revision cd71119.

## What changed

`src/lib/recipePages.ts` was a single 1000-line module holding four unrelated
responsibilities: the published languages and the `sitePath` URL helper, the
localized interface labels, the recipe catalog, and the build-time discovery
and Markdown rendering. It is now three modules that depend in one direction:

- `src/lib/site.ts` — shared vocabulary: `languages`, the `RecipeLanguage` and
  `RecipeIdentity` types, `RecipeCategoryId`, `RecipeMarkerId`,
  `isRecipeLanguage`, `sitePath`, and `labelsByLanguage`. It imports nothing
  and touches no files, so components can depend on it alone.
- `src/lib/recipeCatalog.ts` — the catalog data plus `getCatalogEntry`,
  `getRecipeMetadata`, `getRecipeSearchMetadata`, and the missing-metadata
  warning. It imports only `./site`.
- `src/lib/recipePages.ts` — build-time only: `listLocalizedRecipes`,
  `listRecipePairs`, `findLocalizedRecipe`, `getLandingPageData`,
  `renderRecipeBody`, and the Markdown link rewriting.

Function bodies were moved, not rewritten. The one signature change is that the
catalog lookups now accept the `RecipeIdentity` shape (`{ language, slug }`)
instead of the build-time `LocalizedRecipe` type, so the catalog no longer
depends on filesystem discovery. `LocalizedRecipe` is now `RecipeIdentity &
{ sourcePath }`, so every existing call site passes unchanged. No new
abstraction, controller, or plugin seam was added, and the exported surface is
otherwise the same set of functions as before, minus the internal
`LocalizedLabels` type that stays module-private.

Consumers import from the module that owns what they use:
`FaviconLinks.astro`, `SiteHeader.astro`, and `PoolishCalculatorPage.astro`
now take `sitePath`, `labelsByLanguage`, and `RecipeLanguage` from `./site`;
`LandingPage.astro` takes `getLandingPageData` from `recipePages` and the rest
from `site`; `[language]/[slug].astro` splits its one import across the three
modules; `src/lib/i18n.ts` takes `RecipeLanguage` from `site`.

## Equivalence to the pre-change baseline

The baseline was built from the clean `cd71119` tree before any edit and kept
for comparison, then the changed tree was built the same way.

- `diff -r` over the entire `dist/` tree reports **no differences**: all 86
  generated pages, the Pagefind index, and every asset are byte-identical.
  That covers routes, generated links, catalog metadata, social metadata, and
  search eligibility, so no separate appearance check is needed — the served
  bytes are the same bytes.
- An intermediate build differed only in the key order of
  `dist/pagefind/pagefind-entry.json` (`en` before `he` versus the reverse,
  with identical hashes and page counts). Two consecutive builds of identical
  source reproduce that same flip, so it is Pagefind ordering noise, not an
  effect of this change. The same noise is recorded in
  `issue-18-architecture-records.md`.
- Build-time metadata warnings are unchanged: the same six
  `[recipe metadata] Missing category` lines for `pastry_cream`, `salt`, and
  `simple_vinaigrette` in both languages.

## Site checks

- `npm run check`: 0 errors, 0 warnings, 0 hints across 30 files.
- `npm run typecheck`, `npm run format:check`, `npm run build`: passed.
- `npm run test:links`: 10 passed, 0 failed.
- `npm run verify:links`: 975 local references passed across 86 pages.
- `npm run verify:issue5`, `verify:issue6`, `verify:issue7`: passed.
- Browser specs against the changed build: calculator 33 passed, search 6
  passed, navigation 12 passed, control contrast 12 passed, pizza links 2
  passed.
- `verify-issue-7-browser` and `verify-issue-8-browser` each still have one
  failing case, unchanged from the pre-existing failures recorded in
  `issue-20-shared-theme.md`: the issue-7 case hits a strict-mode locator clash
  between the drawer link and the category rail link, and the issue-8 case
  asserts a search overlay alignment the current header no longer satisfies.
  Both specs hard-code port 4321, so they were run against a copy pointed at
  the preview port used here.

## Records updated

- `docs/adr/0026-separate-site-vocabulary-catalog-and-build-time-modules.md`
  records the module boundaries, listed in `docs/adr/README.md`.
- `.agents/skills/recipe-grams-authoring/SKILL.md` now names
  `src/lib/recipeCatalog.ts` as the owner of recipe site metadata.
- Dated verification records from earlier issues keep their original wording,
  including their references to the pre-split `src/lib/recipePages.ts`.

## Reproducing

```sh
npm run build                       # then diff -r this dist against a build
                                    # of the previous revision in a worktree
npx astro preview --port 4419       # a port no other local checkout uses
CALCULATOR_BASE_URL=http://127.0.0.1:4419/recipe-grams/ \
  npm run verify:calculator:browser # same for SEARCH_, NAVIGATION_,
                                    # CONTRAST_, and PIZZA_LINKS_BASE_URL
```

The browser specs take their base URL from those environment variables, so
pointing them at a dedicated port keeps the run honest when another checkout
of this repository is serving a preview on the default ports. `verify-issue-7-`
and `verify-issue-8-browser` hard-code port 4321 and were run from copies
pointed at 4419; both also overwrite tracked screenshots under
`docs/verification/`, which were restored after the run.
