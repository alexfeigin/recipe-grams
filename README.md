# Recipes in grams

A list of recipes adapted from the internet or from experience for reproducibility, where available, the recipes are in grams.

Get yourself a good kitchen scale and start cooking!

## now in a website

- https://alexfeigin.github.io/recipe-grams/

## available recipes

- [An index of all recipes](index.MD)

## Working on the site

Prerequisites: Node.js 22.12 or newer and npm 9.6.5 or newer.

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
shared theme in `src/styles/design-tokens.css`. All of `images/` is published, including files
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
TypeScript, clears and rebuilds `dist/` including the Pagefind search index,
runs the generated recipe, catalog, image and link checks, and runs every
maintained browser suite in Chromium against that build.

Verification starts its own Astro preview on an OS-assigned loopback port and
checks that server's identity before running browser tests. It never reuses or
stops another preview. Startup/readiness failures and failed checks exit nonzero;
the owned preview closes after success, failure, or interruption. Run one full
verification at a time per checkout because builds share `dist/`.

Screenshots, failure traces and test output live under the ignored
`.astro/verification/browser/` directory. Historical evidence under
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

For focused checks after a build, use `npm run verify:recipes`,
`npm run verify:catalog`, or `npm run verify:navigation` (which also checks
generated links and image assets). To explicitly test a running preview or the
published site, supply its URL, including the trailing slash:

```bash
SITE_BASE_URL=https://alexfeigin.github.io/recipe-grams/ npm run verify:browser
```

Browser suites also have focused commands: `verify:recipe-flows:browser`,
`verify:search-content:browser`, `verify:search:browser`,
`verify:navigation:browser`, `verify:calculator:browser`,
`verify:contrast:browser`, and `verify:pizza-links:browser`. All require an
explicit `SITE_BASE_URL` outside the full verification command. The Pagefind
content suite also checks the local `dist/pagefind/` files. The older
`verify:issue*` commands remain compatibility aliases to the behavior-named
checks; they do not manage a server or build.
