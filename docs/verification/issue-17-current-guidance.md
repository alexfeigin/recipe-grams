# Issue 17: product, design, and development guidance brought up to date

Verified 2026-09-07 against the production build at revision 0d5ffa9.

Every claim below was read out of current source or the generated build before
it was written down. Where old guidance disagreed with accepted UI behavior,
the guidance was corrected, not the behavior.

## What each document now records

| Document                | Change                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `PRODUCT.md`            | Shipped browse, search, and calculator behavior, including the calculator's intentional hidden/`noindex` status |
| `DESIGN.md`             | Palette, type, and the independent 880/820/640 breakpoints; search and language stay outside the drawer         |
| `README.md`             | Install, dev, build/preview with Pagefind, `npm run verify`, and links to the owning workflow documents         |
| `AGENTS.md`             | A guidance section linking the product, design, vocabulary, decision, and command documents                     |
| `docs/adr/0027`, `0014` | New record for search and language in the header; 0014 keeps its wording and gains a closing line               |

## Evidence

- **Search.** `src/components/SiteHeader.astro` renders the search field in the
  header markup, outside `#main-navigation`. It queries Pagefind with
  `filters: { language }`, ignores queries shorter than two characters, and
  renders at most eight results with title, category, markers, and excerpt.
  The index is a build artifact under `dist/pagefind/`, so a dev server has none.
- **Calculator.** `dist/poolish/index.html` and `dist/he/poolish/index.html`
  both carry `<meta name="robots" content="noindex">`, and their only navigation
  link is Home, so the page is reachable only from the pizza dough recipes or a
  shared link. `calculatePoolish` in `src/lib/poolishCalculator.ts` computes both
  modes, pizza mode deriving 850/3 g of dough per pizza at 70% hydration.
  The page keeps the mode in `?mode=` and copies it onto the language link.
- **Breakpoints.** Five media queries exist, each owned by one surface:
  `880px` moves the header to brand, search, language, and hamburger while the
  category links become the drawer; `820px` stacks the calculator grids;
  `640px` makes the landing hero, recipe grid, and calculator field and results
  grids single-column; `1080px` and `380px` tighten header spacing only.
- **Palette and type.** `src/styles/design-tokens.css` owns `color-scheme: light`,
  the paper/ink/tomato/olive/steel base, the system sans stack, and the
  `--control-*` accent `#487889` whose white labels measure 4.86:1. Pages declare
  only what they vary: their `--shadow`, the landing per-category chip colors,
  and the calculator's page-only accents.
- **Counts.** 41 `en/*.MD` and 41 `he/*.MD` recipes; a build generates 86 pages.

## Corrected guidance

- `PRODUCT.md` had described search as something the site would "eventually"
  provide and did not mention the calculator at all.
- `DESIGN.md` described only the first English home page and named no
  breakpoints beyond `640px`, so an agent could have read the header and
  calculator behavior as accidents.
- ADR 0014 justified the drawer as the place for "search, language switching,
  and category navigation". The drawer holds category navigation only, so 0027
  records the accepted split and 0014 keeps its original text with a closing
  line pointing at it.

## Checks

Documentation-only change; no source, asset, or generated output was touched.

- `npm run verify` passed end to end before and after the change: Astro check,
  TypeScript, a clean rebuild with the Pagefind index, the static recipe,
  catalog, link, and image checks, and 74/74 browser cases against the owned
  preview.
- `npx prettier --check .` passed.
- All relative links in the edited documents resolve.
