# Recipes in grams

A list of recipes adapted from the internet or from experience for reproducibility, where available, the recipes are in grams.

Get yourself a good kitchen scale and start cooking!

## now in a website

- https://alexfeigin.github.io/recipe-grams/

## available recipes

- [An index of all recipes](index.MD)

## Working on the site

Prerequisites: Node.js 24.20.0 or newer and the npm 11 it ships with. That is
the version `npm run verify` is run on and the one `.nvmrc` and the `engines`
field name; `nvm use` picks it up. The package commands import TypeScript
modules directly, which Node runs without a flag from 24 onward.

```bash
npm ci                             # install
npx playwright install chromium    # test browser, once per machine
```

Linux machines may also need `npx playwright install-deps chromium`.

- `npm run dev` serves the site with hot reload. Search is intentionally empty
  here: the Pagefind index is a build artifact, so a dev server has none.
- `npm run build` writes the static site to `dist/` and then builds the Pagefind
  index over those pages.
- `npm run preview` serves the built `dist/`. Use the build-and-preview pair
  whenever you need to try search, social previews, or the published URLs.

Where things live: recipe text in `en/` and `he/`, images in `images/`, site
metadata in `src/lib/recipeCatalog.ts`, shared interface labels in
`src/lib/site.ts`, the published destinations for recipe Markdown links and
images in `src/lib/recipeLinks.ts`, the browser behavior of the header, the
back-to-top button and the language-switch links in `src/scripts/`, and the
shared theme in `src/styles/design-tokens.css`.

The landing, recipe, and calculator pages share one document. The
`<html>`/`<head>`/`<body>` shell, the metadata every page publishes, and the
header above the content belong to `src/layouts/SitePage.astro`; what a page
alone knows — its title, description, published path, social card, and header
links — stays with that page, along with its `<main>` and its styles. What a
page derives from its language — direction, social locale, interface labels,
and the home URL of each language — comes from `src/lib/pageContext.ts`, so add
a language-wide default there rather than in one surface. See
[ADR 0032](docs/adr/0032-share-one-document-shell-across-localized-pages.md). All of `images/` is published, including files
the site itself does not link, so keep an unreferenced image unless there is
evidence it can go — see
[ADR 0028](docs/adr/0028-retain-published-images-unless-evidence-supports-removal.md).
[PRODUCT.md](PRODUCT.md) describes what the site does today,
[DESIGN.md](DESIGN.md) the visual rules and breakpoints, [CONTEXT.md](CONTEXT.md)
the vocabulary, and [docs/adr/](docs/adr/README.md) why the architecture is what
it is.

Adding or changing a recipe, and publishing to GitHub Pages, are owned by the
repository workflows in [AGENTS.md](AGENTS.md) and the skills it names under
[`.agents/skills/`](.agents/skills/) — follow those rather than a copy here.
[docs/adding-a-recipe.he.md](docs/adding-a-recipe.he.md) summarizes the same
workflow in Hebrew.

Historical documents are kept separately and are not instructions: past
verification evidence in [docs/verification/](docs/verification/README.md), the
2026 migration spec in [docs/specs/](docs/specs/0001-astro-recipe-blog.md), and
superseded guides in [docs/history/](docs/history/README.md).

## Verify the site

Run **`npm run verify`** from the installed checkout. It checks Astro and
TypeScript, runs the checks that read only source and fixtures, then clears and
rebuilds `dist/` including the Pagefind search index, runs the checks that read
that build, and runs every maintained browser suite in Chromium against it.
Nothing is built until the source-only checks pass, so a wrong formula or a
broken link rule fails in seconds; see
[ADR 0033](docs/adr/0033-fail-before-the-build-and-give-each-check-one-owner.md).

Verification starts its own Astro preview on an OS-assigned loopback port and
checks that server's identity before running browser tests. It never reuses or
stops another preview. Startup/readiness failures and failed checks exit nonzero;
the owned preview closes after success, failure, or interruption. Run one full
verification at a time per checkout because builds share `dist/`.

Failure screenshots, traces and test output live under the ignored
`.astro/verification/browser/` directory. Passing browser checks assert what
they check rather than saving a screenshot nothing compares. Historical evidence under
[`docs/verification/`](docs/verification/README.md) is preserved and never
overwritten by a run. Verification does not format or edit tracked files.

`npm run test:catalog-intent` is the focused check for which recipes earn a
landing page card and what the build reports when the catalog and the recipe
files disagree. It runs small fixture catalogs through the real rules and needs
no build. Run it while editing `src/lib/recipeCatalog.ts`, and see
[ADR 0030](docs/adr/0030-model-featured-and-unlisted-recipes-explicitly.md) for
the featured-versus-unlisted choice and the warning-versus-error policy.

`npm run test:recipe-links` is the focused regression for the links and images
in generated recipe pages. It renders Markdown fixtures through the real
transformation and needs no build, preview server, browser, or `SITE_BASE_URL`,
so run it while editing `src/lib/recipeLinks.ts`.

`npm run test:poolish-calculation` is the focused check for the poolish
arithmetic: the default and pizza quantities, rounding, the minimum yeast, and
every rejected input. It calls `src/lib/poolishCalculator.ts` directly and needs
no build, preview server, browser, or `SITE_BASE_URL`, so run it while editing
the formula. What a reader sees — validation messages, copying, localized
units — stays in `verify:calculator:browser`; see
[ADR 0031](docs/adr/0031-check-poolish-arithmetic-without-a-browser.md).

`npm run verify:pure` is every check that needs no build:
`test:links`, `test:recipe-links`, `test:catalog-intent`, and
`test:poolish-calculation`. `npm run verify:generated` is every check that reads
`dist/`: `verify:recipes` for complete source-to-page coverage,
`verify:catalog`, `verify:navigation` for the destinations a page is expected to
link to, `verify:links` for whether every destination exists, and
`verify:search-index` for the Pagefind artifacts. Each is also runnable on its
own. Existence is checked in one place: `verify:links` parses every published
page and resolves every reference the way a browser would. To explicitly test a running preview or the
published site, supply its URL, including the trailing slash:

```bash
SITE_BASE_URL=https://alexfeigin.github.io/recipe-grams/ npm run verify:browser
```

Browser suites also have focused commands: `verify:recipe-flows:browser`,
`verify:search-content:browser`, `verify:search:browser`,
`verify:navigation:browser`, `verify:calculator:browser`,
`verify:contrast:browser`, and `verify:pizza-links:browser`. All require an
explicit `SITE_BASE_URL` outside the full verification command, and all run
against a published site as well as a local preview. `verify:search:browser`
owns how search behaves — expansion, short queries, dismissal, keyboard focus,
failure and retry — and `verify:search-content:browser` owns what search finds
in each language. The retired `verify:issue*` aliases named the issues that
introduced these checks; the behavior-named commands above replace them, and the
[historical evidence](docs/verification/README.md) that cites the old names is
kept as written.
