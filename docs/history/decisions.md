# Original architecture decisions

Historical reference only. The [decision index](../adr/README.md) routes current
work to accepted ADRs 0036–0042, consolidated by topic. This archive preserves the
original ADR identities 0001–0035; read it only for an earlier rationale or the
exact wording of a superseded choice. The consolidation changes the documentation,
not the site's behavior.

The records below preserve the text at source revision
`8c8ade4a52f57c2f96c810004cd29b516613f053`. Headings identify the original numbers;
internal links now point within this archive. Old commands, file locations, and
claims about “today” still describe their original checkpoints.

## Topic index

- [Sources and publication](../adr/0036-preserve-readable-recipe-sources.md): [0001](#adr-0001), [0005](#adr-0005), [0006](#adr-0006), [0007](#adr-0007), [0008](#adr-0008), [0011](#adr-0011), [0012](#adr-0012), [0015](#adr-0015), [0016](#adr-0016), [0018](#adr-0018), [0023](#adr-0023), [0024](#adr-0024), [0025](#adr-0025), [0028](#adr-0028).
- [Catalog intent and validation](../adr/0037-model-catalog-browsing-intent-explicitly.md): [0017](#adr-0017), [0019](#adr-0019), [0020](#adr-0020), [0030](#adr-0030).
- [URLs and languages](../adr/0038-use-explicit-localized-routes-and-copy.md): [0004](#adr-0004), [0009](#adr-0009), [0013](#adr-0013), [0022](#adr-0022), [0035](#adr-0035).
- [Code boundaries](../adr/0039-separate-page-assembly-and-feature-modules.md): [0026](#adr-0026), [0029](#adr-0029), [0032](#adr-0032), [0034](#adr-0034).
- [Search and header](../adr/0040-keep-static-search-and-language-controls-in-the-header.md): [0003](#adr-0003), [0014](#adr-0014), [0021](#adr-0021), [0027](#adr-0027).
- [Verification](../adr/0041-verify-at-the-owning-layer-before-expensive-checks.md): [0031](#adr-0031), [0033](#adr-0033).
- [Build and release](../adr/0042-build-a-static-site-and-publish-manually.md): [0002](#adr-0002), [0010](#adr-0010).

## Replacements and clarifications

- **0008 → 0023:** keep Markdown back links; strip them only in site rendering.
- **0016 → 0024:** serve the image directory directly instead of maintaining a symlink.
- **0006 → 0025:** clarify that the Markdown index and site catalog both remain maintained.
- **0014 → 0027:** keep search and language controls outside the mobile drawer.
- **0017/0019 → 0030:** replace optional browsing intent with featured/unlisted entries;
  missing featured metadata becomes an error, while uncataloged recipes still publish.
- **0026/0032 → 0034:** move interface copy into `src/i18n/`; keep the other module boundaries.
- **0031 → 0033:** correct the claimed test ordering; pure checks actually run before the build.
- **0009 → 0035:** limit the English-root convention to landing pages; side pages name their language.

Other records establish or extend decisions without reversing them. The source
and metadata records mostly describe parts of one model; separate records for
project placement, the two indexes, and metadata ownership need not be loaded
individually to understand it.

## ADR 0001

### Preserve Markdown recipes as the source of truth

Recipe-Grams will keep the existing `en/*.MD`, `he/*.MD`, and `index.MD` files as the authoring source for recipes, and the Astro site will build from those files. This preserves already-shared GitHub Markdown URLs and keeps the existing recipe-add workflow intact instead of moving recipes into Astro-only content files.

## ADR 0002

### Build a static Astro site for GitHub Pages

The recipe blog will be a fully static Astro site hosted on GitHub Pages, with no backend service. This fits the repository's content-first model and keeps the published site cheap, portable, and suitable for family and friends on any viewport.

## ADR 0003

### Use Pagefind for static recipe search

Recipe-Grams will use Pagefind for site search rather than maintaining a custom search index by hand. Pagefind indexes the generated static HTML after the Astro build and emits static search assets, which matches the requirement for full-recipe word search without a backend.

## ADR 0004

### Use language and filename for site recipe URLs

Site recipe pages will use URLs shaped like `/en/{recipe-slug}/` and `/he/{recipe-slug}/`, where the recipe slug comes from the existing Markdown filename. This mirrors the repository's language folders, keeps URLs stable across title changes, and makes link breakage an explicit consequence of renaming recipe files.

## ADR 0005

### Publish all localized recipe files

The generated site will publish every localized Markdown recipe under `en/` and `he/`, even when a recipe is not linked from the legacy `index.MD`. Some unfeatured recipes are reachable from internal recipe links or search, so the legacy index is not the publication boundary.

## ADR 0006

### Prefer a recipe catalog over parsing the legacy index

Recipe metadata for the Astro site should come from structured catalog code instead of parsing `index.MD`. The Markdown index was designed for direct GitHub reading, and parsing it would make site behavior depend on presentation details rather than intentional metadata; an agent may read `index.MD` during initial migration, but the running build should not.

Still in force, and clarified by [0025 — Keep the legacy index for Markdown readers and the catalog for generated browsing](#adr-0025), which records the lasting role of each index after the migration.

## ADR 0007

### Store site metadata in Astro code

The Astro project will own recipe metadata that is not part of recipe body content, including category placement, featured navigation, localized display titles, SEO descriptions, and social sharing data. Storing this as typed project code keeps the site self-contained, readable, and aligned with Astro conventions while leaving Markdown files responsible for recipe content.

## ADR 0008

### Remove legacy back links from recipes

The first-line recipe links back to `index.MD` will be removed from the Markdown recipes during the Astro upgrade. Direct GitHub recipe URLs will still show readable recipe content, and the generated site will provide navigation through its layout instead of preserving the old per-file back link.

Superseded by [0023 — Preserve recipe back links in source and strip them in the site](#adr-0023). The back links were kept in the Markdown source for GitHub readers, and the site strips them during rendering instead.

## ADR 0009

### Use English as the site root language

The site root will present the English experience by default, with language switching available in the navigation. This avoids browser-language redirects and gives shared root links a stable, predictable landing page.

Still in force for the landing pages, and clarified by [0035 — Route side pages under their language](#adr-0035), which records that a page nobody lands on by default names its language in its URL instead.

## ADR 0010

### Build locally to dist before manual Pages publishing

The initial Astro workflow will build the static site into `dist/` and leave GitHub Pages publishing manual. Astro's default static output writes to `dist/`, which keeps the first version simple while leaving room to add the official GitHub Pages Action later.

## ADR 0011

### Render Markdown as recipe body content for MVP

The MVP will render each recipe's Markdown as page body content without parsing ingredients, instructions, timing, or nutrition into structured recipe fields. This keeps the first static site faithful to the existing recipe files and avoids a brittle migration across inconsistent Markdown formats.

## ADR 0012

### Defer Recipe JSON-LD

Recipe-specific JSON-LD structured data is a future SEO improvement, not part of the MVP. The MVP can include normal page titles, descriptions, canonical URLs, and social sharing metadata, but should not fabricate structured recipe fields that are not reliably represented in the Markdown or catalog.

## ADR 0013

### Provide localized landing pages

The generated site will have an English landing page at `/` and a Hebrew landing page at `/he/`. Each landing page will provide the same core browse experience in its language: responsive navigation, search access, category sections, recipe cards, and language switching.

## ADR 0014

### Use a mobile navigation drawer

Small screens will use a hamburger-triggered navigation drawer rather than forcing all navigation controls into the top bar. This gives the localized landing pages room for search, language switching, and category navigation without cramped controls.

Superseded in part by [0027 — Keep search and language switching in the header at every width](#adr-0027). The drawer holds category navigation only; search and the language toggle stay in the header bar at every width.

## ADR 0015

### Place Astro project at repo root

The Astro project will live at the repository root while preserving the existing root-level `en/`, `he/`, and `images/` directories. This follows normal Astro project structure without moving recipe sources that already have shared GitHub URLs.

## ADR 0016

### Link public images to root images

The Astro project should expose existing recipe images through the site without maintaining duplicate image copies. A link from Astro's public asset path to the root `images/` directory is preferred so Markdown compatibility and built site assets share the same source files.

Superseded by [0024 — Serve site images directly from the root image directory](#adr-0024). No link is maintained; Astro's public asset directory is configured as the root `images/` directory itself.

## ADR 0017

### Warn on missing recipe metadata

Every localized Markdown recipe should still generate a page and be searchable, even when catalog metadata is incomplete. The build should warn on missing metadata so recipe-adding agents can fix it before commit, but the site should not infer metadata by scanning recipe bodies or fail the build solely because a recipe is uncategorized.

## ADR 0018

### Update agent recipe workflow for site metadata

The existing conversational recipe-adding workflow will remain, but `AGENTS.md` should be updated so future agents add or update Astro recipe metadata alongside the localized Markdown recipe files. This keeps new recipes ready for the generated site from the start instead of relying on later cleanup.

## ADR 0019

### Use complete pair-level metadata with warnings

Recipe metadata will be keyed by recipe slug and contain localized title and description fields, language-neutral category IDs, semantic markers, featured/navigation data, and an optional explicit social image. Missing title, description, or category should produce a build warning so agents can fix the catalog, while uncataloged recipes still build as pages and remain searchable.

Refined by [0030 — Model featured and intentionally unfeatured recipes explicitly](#adr-0030): browsing intent is now stated by the entry itself rather than inferred from a missing category, and incomplete metadata on a featured recipe is a build error instead of a warning. Uncataloged recipes still build and stay searchable.

## ADR 0020

### Use semantic markers and localized categories

The Astro site will store category and marker data as stable semantic keys rather than presentation text or emoji. The UI will localize category labels and render markers such as favorite and vegan in the appropriate language and visual style.

## ADR 0021

### Search current language pages in the nav popup

The MVP search UI will be a global navigation popup that searches pages in the current language only and shows clickable results while typing after a small threshold. Each result should show the recipe title, Pagefind snippet, category, and markers.

## ADR 0022

### Use page-level RTL for Hebrew

Hebrew site pages will set right-to-left direction at the page or document level so navigation, cards, search UI, and recipe content all align with the localized experience. The raw Hebrew Markdown files should not contain their own RTL wrapper.

## ADR 0023

### Preserve recipe back links in source and strip them in the site

Supersedes [0008 — Remove legacy back links from recipes](#adr-0008).

The first-line `[Back to Menu](../index.MD)` link stays in every localized Markdown recipe, because GitHub readers still open recipes directly and need a way back to [`index.MD`](../../index.MD). Removing it would have broken the reading path that [0001 — Preserve Markdown recipes as the source of truth](#adr-0001) exists to protect. The generated site instead strips that first line while rendering the recipe body, so site pages navigate through the layout as originally intended and never show a link into raw Markdown. Recipe authoring keeps writing the back link; only site rendering removes it.

## ADR 0024

### Serve site images directly from the root image directory

Supersedes [0016 — Link public images to root images](#adr-0016).

Astro points its public asset directory at the existing root `images/` directory through `publicDir: "./images"` in `astro.config.mjs`, instead of maintaining a `public/` directory that links to it. The configured directory is the implementation of the single-source image principle: Markdown recipes on GitHub and the generated site read the same files, no image is duplicated or copied by hand, and there is no link for a checkout, a fresh clone, or a non-POSIX workstation to lose. Images stay at the repository root, as [0001 — Preserve Markdown recipes as the source of truth](#adr-0001) requires.

## ADR 0025

### Keep the legacy index for Markdown readers and the catalog for generated browsing

Clarifies [0006 — Prefer a recipe catalog over parsing the legacy index](#adr-0006), which remains in force.

The two indexes are permanent and serve different readers, so neither replaces the other. [`index.MD`](../../index.MD) is the table of contents for people reading recipes as Markdown on GitHub: it is hand-maintained, keeps its bilingual table and emoji markers, and is updated whenever a recipe is added, renamed, or recategorized. The recipe catalog in Astro code is the source for generated browsing: landing pages, categories, cards, markers, featured order, and social previews all come from it, as [0007 — Store site metadata in Astro code](#adr-0007) established. Adding a recipe therefore means updating both owners.

The build never parses `index.MD`; the allowance in 0006 for an agent to read it applied to the initial migration only. The two indexes are also separate at read time: the generated site does not link to `index.MD`, and Markdown readers reach it through GitHub and through the recipe back links that [0023 — Preserve recipe back links in source and strip them in the site](#adr-0023) preserves.

## ADR 0026

### Separate site vocabulary, recipe catalog, and build-time page modules

The site code that was gathered in `src/lib/recipePages.ts` is split into three modules with one responsibility each. `src/lib/site.ts` holds the shared vocabulary every page needs: the published languages, a recipe's language and slug identity, the category and marker identifiers, the `sitePath` URL helper, and the localized interface labels. `src/lib/recipeCatalog.ts` holds the recipe catalog itself — category placement, markers, featured order, and localized titles, descriptions, and images — together with the metadata lookups and the missing-metadata warning. `src/lib/recipePages.ts` keeps only the build-time work: discovering localized recipes on disk, assembling landing page data, and rendering a recipe's Markdown body into site HTML.

The modules depend in one direction, `site` to `recipeCatalog` to `recipePages`, so a maintainer editing a label, a catalog entry, or the build-time rendering opens exactly one file and components import from the module that owns what they use. The public functions and their call shapes are unchanged; this is a file boundary decision, not a new runtime architecture.

## ADR 0027

### Keep search and language switching in the header at every width

Supersedes [0014 — Use a mobile navigation drawer](#adr-0014) in part.

The hamburger drawer stays, but it holds category navigation only. The search field and the language toggle remain in the header bar itself at every width, so a phone reader can search a recipe or switch language without opening the drawer first. Search is the primary way to reach an unfeatured recipe, and hiding it behind a trigger cost a step on exactly the device where readers use it most; the compact header proved to have room for both controls beside the brand.

The drawer's original purpose is unchanged: category navigation would crowd the top bar on small screens, so it collapses at the header breakpoint of `880px`. `DESIGN.md` records the supported viewports and the breakpoint each surface owns.

## ADR 0028

### Retain published images unless evidence supports removal

`images/` has three audiences at once. [0024 — Serve site images directly from the root image directory](#adr-0024) makes the whole directory the site's public directory, so every file in it is published under `https://alexfeigin.github.io/recipe-grams/`, and every file has also been readable through GitHub since it was committed. The generated site links only the images the catalog and recipe Markdown name; [`index.MD`](../../index.MD) links the title icons under `images/titles_for_index/` for the Markdown readers that [0025 — Keep the legacy index for Markdown readers and the catalog for generated browsing](#adr-0025) keeps serving; and a contribution may leave a working reference image behind that neither one links.

An image that no tracked text references is therefore not a leftover by that fact alone. Its published and raw GitHub URLs are still live and still linkable, and this project has no analytics on either host, so nothing in the repository can show whether a URL is in use elsewhere. Absence of a reference is absence of evidence, not evidence that removal is safe.

So an unreferenced image is retained by default. Removing one needs positive evidence — a superseded file whose replacement is committed, a duplicate, or an owner saying it is unwanted — and not merely a search that found no links. Retention is the cheap side of the trade: the three files this rule was written for are about 143 KB together, while a wrong removal breaks a public URL that cannot be audited. When a file's purpose is unclear, record the uncertainty rather than resolving it by deleting.

The dispositions resolved under this rule, all **retained in place**:

- `images/titles_for_index/cookie.png` and `images/titles_for_index/doughnut.png` — two of the nine emoji title icons added together in `ef2f0a7` for the legacy index's category headers. Seven are in use; these two are the unused spares of a coherent set, and they stay with their siblings as the palette for a future index category.
- `images/leopard_expm.jpeg` — a leopard-spot pattern reference committed in `c638897` beside the leopard cookies recipe and its photographs. It is a pattern reference rather than a photograph of the food, which is why no recipe links it, and it is kept as part of that contribution's material.

None of the three has ever been referenced from tracked text. See [the issue 22 record](../verification/issue-22-unreferenced-assets.md) for the evidence behind these dispositions.

## ADR 0029

### Own header behavior in typed browser modules

The header's navigation drawer, search field, and back-to-top button were three responsibilities spread across two inline scripts in `SiteHeader.astro`. Search reached the drawer by calling `setNavigationOpen`, a function the other script happened to leave on the global scope, and both scripts queried the whole document for elements the component itself renders.

Header behavior now lives in `src/scripts/`, the browser counterpart to the build-time modules that [ADR 0026](#adr-0026) separated. `siteHeader.ts` exports one function, `initializeSiteHeader(header)`; the component hands it the rendered `<header>` and it reads the language and base path from that element's data attributes. Inside, navigation and search are built separately and search receives a navigation controller whose only member is `close()`, so the one thing they share is stated in a type instead of found at runtime. Element lookups are scoped to the header that was passed in and fail loudly when the markup and the behavior disagree. `backToTop.ts` owns the floating button, including the element to focus after scrolling, which it is given rather than looking up.

The header also marks each language-switch link with `data-language-switch` — one in the desktop picker, one in the mobile actions. A page that keeps state in the query string calls `setLanguageSwitchQuery` from `languageSwitch.ts` to put that state on every variant. The poolish calculator uses it for its mode parameter instead of comparing every anchor on the page against a URL it expects to find.

This is a boundary decision, not a runtime architecture change: the pages stay static Astro, the scripts stay small, and no framework or client-side router is introduced. Accepted behavior — the drawer, the search interactions of [ADR 0021](#adr-0021), and the header layout of [ADR 0027](#adr-0027) — is unchanged.

## ADR 0030

### Model featured and intentionally unfeatured recipes explicitly

Refines [0019 — Use complete pair-level metadata with warnings](#adr-0019) and [0017 — Warn on missing recipe metadata](#adr-0017), which remain in force for everything this record does not change. The two-index policy of [0025](#adr-0025) is unaffected: the catalog still owns generated browsing, and `index.MD` stays hand-maintained for Markdown readers.

A catalog entry used to carry an optional category and an optional featured order, so one shape said two different things. A helper recipe kept off the landing page on purpose looked exactly like a recipe whose category someone forgot, and both produced the same missing-metadata warning. Verification then had to name `pastry_cream`, `salt`, and `simple_vinaigrette` in a whitelist so the warning-shaped intent would not fail the build.

A catalog entry now states its browsing intent. `featuredRecipe(categoryId, markerIds, featuredOrder, localizations)` carries the category and order a card needs; `unlistedRecipe(reason, markerIds, localizations)` records a published recipe deliberately kept out of browsing, and the reason is written for the next maintainer. There is no third state, so an omission cannot pass for a decision: leaving out a category is not expressible, and leaving out an intent does not compile.

The catalog is checked against the recipe source tree once per set of discovered recipes, in `collectCatalogDiagnostics`, rather than lazily while pages render. It reports uncataloged recipes, orphan catalog entries, catalog localizations the source tree does not have, featured recipes that are not complete Recipe Pairs, and two featured recipes competing for one position inside a category.

Severity follows what the reader would see. A **warning** is printed and the build continues: the site is correct, but a maintainer probably wants to know. An uncataloged recipe stays a warning, so a new recipe still publishes and stays searchable exactly as 0019 intended. An **error** fails the build, and there is one: a featured recipe whose catalog entry has no localized title or description in a language whose Markdown source exists. That is the accident the old warning could not distinguish, and it would publish a landing page missing a card it claims to have.

Eligibility rules are verified with small fixture catalogs in `scripts/catalog-intent.test.mjs` — featured, intentionally unfeatured, uncataloged, incomplete featured, and missing-localization cases — so the rules are stated independently of the published data. `scripts/verify-catalog.mjs` then compares the built landing pages against the catalog those fixtures validate: the cards each page renders must be exactly the featured recipes, in category order and featured order. No slug is named in verification, so adding an intentionally unfeatured recipe needs no test exception.

## ADR 0031

### Check poolish arithmetic without a browser

The poolish calculator's formula is pure: `calculatePoolish` in `src/lib/poolishCalculator.ts` maps a mode and seven string fields to rounded gram weights or a rejection code. Its checks nevertheless lived in `scripts/verify-calculator-browser.spec.mjs`, which imports the browser target. Test discovery therefore demanded `SITE_BASE_URL`, so verifying rounding or a rejection rule meant a build, a Pagefind index, a preview server, and an installed Chromium — none of which the arithmetic touches.

Pure cases now live in `scripts/poolish-calculation.test.mjs` and run under `npm run test:poolish-calculation`, the same shape as the fixture suites of [ADR 0030](#adr-0030) for the catalog and of the recipe link transformation: `node --test`, importing the module directly, needing no build, preview server, browser, or `SITE_BASE_URL`. They state the default and pizza quantities as independent hand-computed tables, and cover the minimum yeast, zero ratios, empty and nonfinite and negative fields, overflow, rejected pizza counts, and the splits a poolish leaves no water for — including the ones that only become impossible once phase weights are rounded to whole grams. Because they assert the error code, they distinguish `invalidInputs`, `invalidSplit`, and `invalidPizzaCount`, which a reader watching one validation message cannot.

The browser suite keeps what a reader sees: the validation message and recovery, copying disabled while results are invalid, clipboard success and failure and delayed feedback, localized units and decimals in both languages, the mode switch, and the language switch carrying the mode. It checks representative quantities rather than every arithmetic case, so a change to the formula fails in one place, close to the formula.

The pure suite runs inside `verify:static`, before any browser work, so `npm run verify` still verifies the whole site in one command and fails on arithmetic before it spends a build and a browser on it. No calculation policy changed: the formula, the rounding, the default and preset quantities, and the 3g minimum yeast are the same weights a cook read before.

## ADR 0032

### Share one document shell across localized pages

The landing, recipe, and calculator surfaces each assembled their own `<html>`, `<head>`, and `<body>`, and each re-derived what its language implies: the text direction, the Open Graph locale, the interface labels, and the URL of that language's home page. The header then took those derived values back as props — its accessible home name and navigation-toggle name were the language's labels, and its brand link was the language's home page — so a change to any of them meant editing three pages in step.

`src/layouts/SitePage.astro` now owns the document. It renders the shell, the metadata every page publishes, and `SiteHeader` above the page's content, and it takes only what a surface alone knows: its title, description, published path, social card, whether it publishes a canonical link, whether it is `noindex`, and the header's brand line, language-switch destination, and navigation items. Each page keeps its own `<main>` and its own styles, so the landing grid, the recipe column, and the calculator layout stay with their owners, as do the independent breakpoints of [ADR 0027](#adr-0027). A page that needs extra head elements — the recipe pages' Pagefind filter and metadata — passes them in the layout's `head` slot rather than growing the layout's interface.

`src/lib/pageContext.ts` holds what a page derives from its language: the direction of [ADR 0022](#adr-0022), the social locale, the labels from `site.ts`, and the English-root/Hebrew-`he/` home URLs of [ADR 0009](#adr-0009), for this language and the other one. `SiteHeader` reads its own context, so its props are down to the language, the brand line, the language-switch href, and the navigation items — the header no longer accepts labels it can derive. `getLandingPageData` correspondingly returns only what the landing page lists, keeping the build-time module boundaries of [ADR 0026](#adr-0026) intact.

This is a page-assembly decision, not a runtime change. The site stays static Astro over readable Markdown, no page-builder or configuration-driven page system is introduced, and the generated pages are byte-identical to the previous build apart from the name of the shared stylesheet bundle.

## ADR 0033

### Fail before the build and give each check one owner

`npm run verify` ran `check`, `typecheck`, a full Astro build and a Pagefind index, and only then the pure fixture suites for the poolish arithmetic, the catalog rules and the Markdown link transformation. [ADR 0031](#adr-0031) describes those suites as failing before the run spends a build and a browser on them, which the ordering did not actually do. The package commands now name what a check needs rather than how it is written: `verify:pure` runs everything that reads only source and fixtures, before `dist/` is removed and rebuilt, and `verify:generated` runs everything that reads the build. `npm run verify` remains the one entry point, and the preview it owns still starts, is identified, and closes after success, failure or interruption.

Checks that walked the same build twice now have one owner each. `scripts/generated-links.mjs` parses every published page and resolves every reference the way a browser would, so it owns whether a destination exists; `scripts/verify-navigation.mjs` keeps only what a page is expected to link to, and no longer re-walks the build to re-check image destinations. `scripts/verify-recipe-pages.mjs` stays the owner of complete source-to-page coverage, and states the landing card destination contract — every card opens a generated recipe page in its own language — in place of an assertion against a branch that no longer exists, which had also banned legitimate external GitHub links. The whole-site ban on Markdown hrefs now applies to local destinations only, for the same reason. Search splits the same way: `scripts/verify-search-browser.spec.mjs` owns interaction, `scripts/verify-search-content-browser.spec.mjs` owns what search finds in each language, and the Pagefind artifacts moved to `scripts/verify-search-index.mjs`, so the content suite no longer needs a local build to run against a published site.

Two habits of the browser suites went with it. Width was sampled immediately after a click and compared against the settled width, which asserts that the runner happened to observe the animation mid-flight rather than that the header animates; the suite now reads the declared `grid-template-columns` transition and keeps the settled expanded and collapsed geometry. Screenshots saved on success were never compared against a baseline, so they were evidence, not assertions; `playwright.config.mjs` still keeps screenshots and traces on failure, where they are read.

The setup that runs all of this is now stated once. The commands import TypeScript modules directly, which Node executes without a flag from 24 onward, and `"type": "module"` records what this package already was — so the repeated `--disable-warning=MODULE_TYPELESS_PACKAGE_JSON` suppression is gone rather than silenced. `engines` and `.nvmrc` name Node 24.20.0, the version full verification was run on, and the README prerequisite says the same thing instead of repeating Astro's own lower bound, which was never executed here.

## ADR 0034

### Store interface translations in src/i18n

Interface copy had no single home. Shared labels lived in `src/lib/site.ts` alongside the site vocabulary, the poolish calculator's copy lived in `src/lib/i18n.ts` and then `src/lib/poolishCalculatorLabels.ts`, and two of the header's own strings were inline ternaries — `language === "he" ? "ניווט ראשי" : "Main navigation"` — which nothing could check. Three shapes and no rule meant the next side page had no obvious place to put its words, and the header's inline pair showed what happens without one.

Interface translations now live in `src/i18n/`, one module per surface. `ui.ts` holds the shared chrome every localized page reads; `calculator.ts` holds the poolish calculator's copy. Each module exports `<surface>Labels: Record<RecipeLanguage, <Surface>Labels>`. Adding a side page means adding `src/i18n/<page>.ts` in that shape and importing it from the page — nothing else. The layout and the `src/i18n/` name come from [Astro's i18n recipe](https://docs.astro.build/en/recipes/i18n/) rather than from a convention invented here.

The one deliberate divergence from that recipe is the value shape. Astro's version stores flat dotted keys and resolves them through a `useTranslations(lang)` helper that falls back to the default language when a key is missing, so an untranslated string renders in English. `Record<RecipeLanguage, Shape>` requires every language instead: omitting the Hebrew `copyButton` is `TS2741: Property 'copyButton' is missing`, and `npm run verify` stops. That matches how the rest of the project already treats missing translations — a featured recipe without a localized title fails the build under [ADR 0030](#adr-0030) — and it matters more here than on a site with a long tail of locales, because Hebrew is a first-class language of this one, rendered right to left under [ADR 0022](#adr-0022). English text appearing inside an RTL page is a defect, not a graceful degradation. The recipe's `getLangFromUrl` is also unused: a page already receives its language explicitly and derives the rest through `getPageContext` ([ADR 0032](#adr-0032)), which is a stronger guarantee than sniffing the URL.

This covers the interface only. Recipe bodies stay in `en/` and `he/` as readable Markdown ([ADR 0001](#adr-0001)), and per-recipe titles, descriptions and images stay in `src/lib/recipeCatalog.ts` as `Partial<Record<RecipeLanguage, …>>` — deliberately partial, because a recipe may legitimately exist in one language while a side page may not ship half translated. `src/lib/site.ts` keeps the vocabulary that is not copy: the languages, the recipe identity and category and marker ids, and `sitePath`. Language endonyms — the `EN` and `עב` of the language picker — are `languageNames` in `ui.ts`, the one map that reads the same whatever language the surrounding page is written in.

Astro 7 also ships locale routing whose `routing.prefixDefaultLocale: false` describes the English-root and Hebrew-`he/` layout of [ADR 0009](#adr-0009), and `astro:i18n` helpers that could replace `sitePath` and the home URLs in `pageContext.ts`. That was left alone: this decision is about where words live, the existing URL helpers are small and covered by `verify:links` and `verify:navigation`, and changing both at once would have made the rendered comparison meaningless. It remains available if the URL logic ever grows.

This is a placement and typing decision, not a runtime change: no dependency was added and no framework introduced. Every built HTML page and all CSS are byte-identical before and after. The one build output that moves is the client bundle: the label table used to sit in the shared `site` chunk because it lived in `site.ts`, and now that `ui.ts` is imported only by `siteHeader.ts` the bundler inlines it into the header script instead. The browser is sent the same words either way.

## ADR 0035

### Route side pages under their language

The poolish calculator shipped as two page files, `src/pages/poolish.astro` and `src/pages/he/poolish.astro`, each a single line handing a hardcoded language to `PoolishCalculatorPage`. Their URLs copied the landing pages: English at `/poolish/`, Hebrew at `/he/poolish/`. That copied the shape of [ADR 0009](#adr-0009) without copying its reason. English sits at the root because the site root has to land somewhere and a browser-language redirect was rejected; the root is the URL people share and type. Nobody arrives at the calculator by default — it is `noindex` and out of navigation, reached from the pizza dough recipes or a shared link — so it has no root to default, and the language-free `/poolish/` said "English" only by convention borrowed from a page with a different problem.

The calculator now builds from one `src/pages/[language]/poolish.astro`, whose `getStaticPaths` maps `languages` from `src/lib/site.ts`, and serves `/en/poolish/` and `/he/poolish/`. Both pages come from one file, adding a language means adding it to `languages`, and the URL names its language the way recipe URLs already do under [ADR 0004](#adr-0004). `PoolishCalculatorPage` builds its canonical and language-switch hrefs from the language rather than from a ternary per href, and the English pizza recipe links to `/en/poolish/?mode=pizza` where it used to link to `/poolish/?mode=pizza`, so each recipe points at the calculator in its own language. [ADR 0009](#adr-0009) still stands for the landing pages, which keep the English root and the Hebrew `/he/`; this record says it does not extend to side pages.

`/poolish/` stops resolving. The only published link to it was the English pizza recipe, changed in the same commit, and the page has always been `noindex`, so nothing indexed or navigable breaks; an old shared link is the loss, and Astro's `redirects` remains available if one turns up. This is the first side page under `[language]/`, so it sets the pattern: a side page is `src/pages/[language]/<name>.astro` with the same `getStaticPaths`, and its words go in `src/i18n/<name>.ts` under [ADR 0034](#adr-0034).

`[language]/poolish.astro` now sits beside `[language]/[slug].astro`, and Astro ranks the static `poolish` segment above the dynamic slug, so a recipe file named `poolish.MD` would build a page the calculator then overwrites. `verify:recipes` already demands a built page for every localized Markdown recipe; it now also demands that page carry `data-pagefind-body`, which every recipe page renders and no side page does, so a side page silently taking a recipe's URL fails the build instead of quietly replacing it.
