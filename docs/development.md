# Development and verification

[README](../README.md#work-locally) covers installation and dev/build/preview.
[package.json](../package.json) lists every command; use `npm run` to list them locally.

## Select verification

- **Documentation or reports only:** review content, source, links, and the diff;
  check touched-document formatting where useful. Disposable HTML reports need
  no application tests, site build, browser, screenshots, or implementation of
  their recommendations. Recipe Markdown is site source and belongs in the next
  category.
- **Application logic, interaction, and recipe/site-source changes covered by the
  gate:** use the narrowest relevant existing check from the table below during
  implementation, then run `npm run verify` on the finished work. Preserve
  meaningful existing coverage; add assertions for behavior contracts worth
  protecting, not tests that merely mirror implementation.
- **Release:** invoke the publication helper from committed, pushed source. It
  runs and owns one final gate, then publishes that invocation's exact output.
  Do not run a separate final gate immediately before it. An earlier verification
  remains evidence for unchanged source, but its output cannot establish the
  helper's exclusive ownership and is not reused for publication.
  Verification alone does not authorize a release;
  follow the [publishing workflow](../.agents/skills/recipe-grams-publishing/SKILL.md)
  within the user's delivery scope and publication exclusions.

A successful final gate already checks, builds, verifies generated output, and
runs browser tests. Do not manually replay its stages immediately before or
after it without a specific reason. Stop when the applicable evidence passes.
A failure or subsequent relevant change invalidates the affected evidence;
resolve it and reverify before completion. A specific uncovered concern can
justify an additional check; record what it addresses.

Routine UI maintenance uses existing interaction assertions, including keyboard
focus tests, without a mandatory visual audit. Substantial new UI with unsettled
coverage can warrant visual exploration; capture testable expectations in
automated assertions and end the visual loop once the behavior is satisfactory.

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

This is the task-to-source/check map. Read the matching topics in the
[decision index](adr/README.md) for ownership rules. The checks below provide
focused feedback; they do not replace the completion policy above. Generated
checks need a current build. `verify:focused` builds and owns a preview for one
browser suite; the per-suite `verify:*:browser` commands need an explicit target
instead (see below).

| Changed concern                                               | Source owners and companion obligations                                                                                                                                                                                                                                                            | Focused feedback                                                                                                                                                                                                                                 |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Documentation or disposable reports                           | Use the [README map](../README.md#read-only-what-your-task-needs) to find relevant guidance; edit only the requested artifact.                                                                                                                                                                     | Content/source/diff review only; formatting where useful.                                                                                                                                                                                        |
| Recipes, catalog, index, or images                            | `en/*.MD`, `he/*.MD`, `src/lib/recipeCatalog.ts`, `index.MD`, `public/images/`; `recipeSources.ts` discovers and `recipePages.ts` renders. Follow [authoring](../.agents/skills/recipe-grams-authoring/SKILL.md) for paired sources and companion updates.                                         | Review affected companions and image paths; `npm run test:catalog-intent` and `npm run test:recipe-links` test rules with fixtures. `verify:recipes` and `verify:catalog` check actual built pages and cards.                                    |
| Catalog eligibility and diagnostics                           | `src/lib/recipeSources.ts`, `src/lib/recipeCatalog.ts`, `scripts/catalog-source-verifier.mjs`, `scripts/catalog-source-verifier.test.mjs`, `scripts/catalog-intent.test.mjs`; preserve uppercase `.MD` discovery, intentional featured/unlisted status, and localized metadata.                    | `npm run verify:catalog-source` checks the real sources and catalog without a build; `npm run test:catalog-intent` covers diagnostic rules with fixtures.                                                                                        |
| Markdown destinations and images                              | `src/lib/recipeLinks.ts`, consumed by `src/lib/recipePages.ts`; fixtures in `scripts/recipe-links.test.mjs`. Preserve readable `.MD` source links while transforming site destinations.                                                                                                            | `npm run test:recipe-links`; `verify:pizza-links:browser` covers the existing pizza link regression.                                                                                                                                             |
| Header, drawer, or search                                     | `src/components/SiteHeader.astro`, `src/scripts/siteHeader.ts`, `src/i18n/ui.ts`, `src/scripts/languageSwitch.ts`; keep language/RTL copy and scoped header behavior aligned.                                                                                                                      | `verify:navigation:browser` owns drawer keyboard focus; `verify:search:browser` owns search interactions, and `verify:search-content:browser` owns localized results. Assertions live in the matching `scripts/verify-*-browser.spec.mjs` files. |
| Landing scrolling and back to top                             | `src/components/LandingPage.astro`, `src/scripts/backToTop.ts`, `src/scripts/languageSwitch.ts`; preserve the focus destination and fragment/language behavior.                                                                                                                                    | `verify:navigation:browser` includes back-to-top fragment clearing and language switching; `verify:recipe-flows:browser` covers browsing flows.                                                                                                  |
| Poolish formula and rejections                                | `src/lib/poolishCalculator.ts`; independent expected quantities and rejection cases in `scripts/poolish-calculation.test.mjs`. Keep arithmetic coverage here.                                                                                                                                      | `npm run test:poolish-calculation`                                                                                                                                                                                                               |
| Calculator interaction and localized copy                     | `src/components/PoolishCalculatorPage.astro`, `src/scripts/poolishCalculatorPage.ts`, `src/i18n/calculator.ts`; keep modes, validation, clipboard output, and language/query state aligned.                                                                                                        | `verify:calculator:browser` owns visible feedback and recovery, not arithmetic cases.                                                                                                                                                            |
| Shared shell, metadata, or theme                              | `src/layouts/SitePage.astro`, `src/lib/pageContext.ts`, `src/components/SocialMeta.astro`, `src/components/FaviconLinks.astro`, `src/styles/design-tokens.css`; pages retain their own content/styles. Follow [Design](../DESIGN.md) for visual changes and ADR 0039 for shell/context boundaries. | `verify:contrast:browser` for control contrast; existing navigation, recipe-flow, and calculator browser suites for affected surfaces.                                                                                                           |
| Generated link resolver                                       | `scripts/generated-links.mjs`, `scripts/generated-links.test.mjs`; keep destination existence separate from expected navigation.                                                                                                                                                                   | `npm run test:links`                                                                                                                                                                                                                             |
| Preview lifecycle                                             | `scripts/preview-server.mjs`, `scripts/preview-server.test.mjs`; preserve preview ownership, identity, and cleanup.                                                                                                                                                                                | `npm run test:preview`                                                                                                                                                                                                                           |
| Focused browser dispatch and command lifecycle                | `scripts/focused-verification.mjs`, `scripts/verify-focused.mjs`, `scripts/command-lifecycle.mjs`; keep the suite allowlist aligned with the `verify:*:browser` commands, reuse `withPreview` instead of arranging a server, and keep interruption closing child work.                             | `npm run test:focused`                                                                                                                                                                                                                           |
| Build/publication checkout exclusion and manual publication   | `scripts/build-site.mjs`, `scripts/publish-site.mjs`, `scripts/checkout-operation-lock.mjs`, `scripts/verify-site.mjs`; keep release authorization separate from verification and publish only the verified active checkout through the fixed deployment subtree.                                  | `npm run test:publish-site`                                                                                                                                                                                                                      |
| All source/fixture checks in the pre-build group              | The pure suites selected by `package.json`.                                                                                                                                                                                                                                                        | `npm run verify:pure`                                                                                                                                                                                                                            |
| Built pages, catalog, navigation, links, and search artifacts | `scripts/verify-*.mjs`; generated assertion responsibilities are listed below.                                                                                                                                                                                                                     | `npm run verify:generated`                                                                                                                                                                                                                       |
| Images published only under `/images/`                        | `public/images/`, `scripts/verify-static-assets.mjs`; retain existing assets according to ADR 0043.                                                                                                                                                                                                | `npm run verify:static-assets`                                                                                                                                                                                                                   |
| Google Search Console verification file                       | `public/google*.html`, `scripts/verify-search-console.mjs`; preserve the exact verification content.                                                                                                                                                                                               | `npm run verify:search-console`                                                                                                                                                                                                                  |
| Generated sitemap and page coverage                           | `astro.config.mjs`, `src/layouts/SitePage.astro`, `scripts/verify-sitemap.mjs`; keep hosting/base URLs aligned.                                                                                                                                                                                    | `npm run verify:sitemap`                                                                                                                                                                                                                         |
| Other reader interactions                                     | Existing `scripts/verify-*-browser.spec.mjs` assertions and their feature owners.                                                                                                                                                                                                                  | `npm run verify:focused -- --suite <name>`, or the matching `verify:*:browser` command against an explicit target.                                                                                                                               |

Recipe sources use uppercase `.MD`; include them when searching, for example
`rg --files -g '*.md' -g '*.MD'`. Modules executed directly by Node need explicit
`.ts` extensions in TypeScript imports, including transitive imports (see the
pure calculation tests); Astro's extensionless imports are not a Node template.

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

### Run one browser suite

`npm run verify:focused` builds the current site, starts and identifies its own
preview, runs one suite against it, and closes that preview after success,
failure, or interruption:

```bash
npm run verify:focused -- --suite navigation
npm run verify:focused -- --suite navigation --grep 'keyboard opens'
```

`--suite` takes one maintained suite, listed in `package.json` as the
`verify:*:browser` commands; the optional `--grep` uses Playwright's test-name
matching. Unknown suites, unknown arguments, missing values, and invalid filters
fail with the usage before anything is built or started, and a filter matching
nothing fails instead of reporting success. Every run rebuilds from scratch
including Pagefind, and the owned preview replaces any `SITE_BASE_URL` already
in the environment. This is development feedback; it does not replace
`npm run verify`.

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
