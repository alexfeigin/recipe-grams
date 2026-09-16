# Development and verification

[README](../README.md#work-locally) covers installation and dev/build/preview.
[package.json](../package.json) lists every command; use `npm run` to list them locally.

## Full verification

```bash
npm run verify
```

The runner performs Astro checks and TypeScript checking, source/fixture tests,
a clean rebuild including Pagefind, generated-output checks, preview-server tests,
and all maintained Chromium suites, in that order. Source failures stop the run
before spending time on a build. Each kind of assertion has one owner.

The runner starts and identifies its own preview on an OS-assigned loopback port.
It closes that preview after success, failure, or interruption and never reuses or
stops another server. Startup and check failures exit nonzero. Run one full
verification at a time per checkout because builds share `dist/`.

Verification does not format or edit tracked files. Failure screenshots, traces,
and output go to ignored `.astro/verification/browser/`; historical screenshots
are never overwritten. Passing screenshots are not assertions and are not saved
as routine evidence. Check touched-file formatting separately with
`npx prettier --check <files>`; use `--write` when needed.

## Choose a focused check

| Changed concern                                               | Command / ownership                                                                               |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Catalog eligibility and diagnostics                           | `npm run test:catalog-intent`                                                                     |
| Markdown links and images                                     | `npm run test:recipe-links`                                                                       |
| Poolish formula and rejections                                | `npm run test:poolish-calculation`                                                                |
| Generated link resolver                                       | `npm run test:links`                                                                              |
| Preview lifecycle                                             | `npm run test:preview`                                                                            |
| All source/fixture checks in the pre-build group              | `npm run verify:pure`                                                                             |
| Built pages, catalog, navigation, links, and search artifacts | `npm run verify:generated` (needs a build)                                                        |
| Images published only under `/images/`                        | `npm run verify:static-assets` (needs a build)                                                    |
| Google Search Console verification file                       | `npm run verify:search-console` (needs a build)                                                   |
| Generated sitemap and page coverage                           | `npm run verify:sitemap` (needs a build)                                                          |
| Reader interactions                                           | `verify:*:browser` commands in `package.json` (need an explicit target outside full verification) |

The pure checks need no build, browser, or `SITE_BASE_URL`. `test:preview` exercises
the preview lifecycle separately. Generated checks split responsibilities:
`verify:recipes` owns source-to-page coverage and landing card destinations;
`verify:catalog` owns card membership/order; `verify:navigation` owns expected
destinations; `verify:links` owns destination existence; `verify:static-assets`
owns image placement; `verify:search-index`
owns Pagefind artifacts; `verify:search-console` owns the exact verification file;
`verify:sitemap` checks that every built page except the static Search Console
verification file appears in the sitemap.

The build creates `sitemap-index.xml` and a numbered sitemap under `dist/`.
After publishing the build, submit
`https://alexfeigin.github.io/recipe-grams/sitemap-index.xml` in Google Search
Console. The page head also links to the sitemap index for crawlers.

The link checker resolves local references as a browser does, including the site
base, queries, and HTML/SVG fragments. External resources, CSS URLs, and `srcset`
candidates are outside its scope. The navigation check separately rejects local
`.MD` destinations while allowing external GitHub Markdown links.

Search browser tests separately own interaction (`verify:search:browser`) and
language-specific content (`verify:search-content:browser`). Calculator browser
tests own visible validation, recovery, clipboard behavior, localized units, and
mode switching; arithmetic cases belong to the pure suite.

To check a running preview or published site, provide its URL with a trailing slash:

```bash
SITE_BASE_URL=https://alexfeigin.github.io/recipe-grams/ npm run verify:browser
```

The same variable works for focused browser commands. Retired `verify:issue*`
aliases and per-suite URL variables in historical notes are not current commands.

## Keep documentation current

Update the document that owns a changed rule, using the [README map](../README.md#read-only-what-your-task-needs).
For architectural choices, follow [decision maintenance](adr/README.md#maintaining-decisions):
clarify the relevant ADR, or record a qualifying changed decision with the next
number and an explicit supersession link.

Keep counts, command inventories, and literal theme values in their existing
source rather than copying them into prose.
