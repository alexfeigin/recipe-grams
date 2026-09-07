# Recipes in grams

A list of recipes adapted from the internet or from experience for reproducibility, where available, the recipes are in grams.

Get yourself a good kitchen scale and start cooking!

## now in a website

- https://alexfeigin.github.io/recipe-grams/

## available recipes

- [An index of all recipes](index.MD)

## local site

- Run the Astro site locally: `npm run dev`
- Build the static site into `dist/`: `npm run build`
- Preview the static build: `npm run preview`

## Verify the site

Prerequisites: Node.js 22.12 or newer and npm 9.6.5 or newer. Run `npm ci`,
then install the test browser with `npx playwright install chromium`.
Linux machines may also need `npx playwright install-deps chromium`.

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
`docs/verification/` is preserved. Verification does not format or edit tracked
files.

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
