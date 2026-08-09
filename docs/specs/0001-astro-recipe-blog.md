# Build Astro Recipe Blog From Legacy Markdown Recipes

## Problem Statement

Recipe-Grams has grown from a simple Markdown recipe repository into something that needs a modern reading and browsing experience. Friends and family already have direct GitHub Markdown links to localized recipes, so the upgrade must not move or break the existing recipe files. At the same time, the repository should build a fully static Astro site for GitHub Pages with responsive navigation, localized landing pages, and full-recipe search without introducing a backend.

## Solution

Build an Astro project at the repository root that treats the existing localized Markdown recipe files as the recipe body source and generates a static recipe site into `dist/`. The existing root-level recipe and image source tree stays in place so direct GitHub Markdown links remain readable. The generated site provides an English root landing page, a Hebrew landing page, language-specific recipe pages, a responsive navigation drawer, and Pagefind-powered search over all generated recipe pages in the current language.

Astro project code owns site metadata that is not part of the recipe body: localized titles, descriptions, category placement, featured navigation, semantic markers, and optional social images. All localized Markdown recipe files generate pages and are included in search, even when metadata is incomplete or the recipe is not featured on the landing page. Missing important metadata should produce build warnings so future agents can fix it before committing.

## User Stories

1. As a recipe reader with an old GitHub Markdown link, I want the linked recipe file to stay in its current location, so that a link I already received still opens readable content.
2. As a recipe reader on GitHub, I want each Markdown recipe to remain readable without Astro, so that direct repository browsing still works.
3. As a recipe reader, I want a modern static site around the same recipes, so that browsing recipes feels easier than reading raw Markdown tables.
4. As a recipe reader, I want the site to work on desktop, tablet, and phone viewports, so that I can use it while cooking on any device.
5. As a phone user, I want navigation in a hamburger drawer, so that language, search, and category controls do not feel cramped.
6. As an English reader, I want the site root to show the English experience, so that the default shared site URL is predictable.
7. As a Hebrew reader, I want a Hebrew landing page, so that I can browse the recipe collection in Hebrew.
8. As a Hebrew reader, I want the full Hebrew page experience to be right-to-left, so that navigation, cards, search, and recipe content align naturally.
9. As a bilingual reader, I want a language picker in the navigation, so that I can switch between English and Hebrew.
10. As a recipe reader on a recipe page, I want language switching to take me to the matching localized recipe, so that I can move between the recipe pair directly.
11. As a recipe reader, I want stable generated recipe URLs based on language and filename, so that shared site links remain stable unless the file itself is intentionally renamed.
12. As a maintainer, I want recipe filenames to remain the URL identity, so that link stability is explicit and easy to reason about.
13. As a recipe reader, I want every localized Markdown recipe to generate a site page, so that helper recipes and unfeatured recipes are still reachable.
14. As a recipe reader, I want recipes not shown on the landing page to still appear in search, so that I can find helper recipes such as salts, creams, or vinaigrettes.
15. As a recipe reader, I want existing internal recipe links to work on the generated site, so that links between recipes remain useful after rendering.
16. As a recipe reader, I want existing Markdown images to appear in the generated site, so that the site preserves visual recipe content already present in the recipes.
17. As a maintainer, I want images to remain in the root image source directory, so that GitHub Markdown compatibility is preserved.
18. As a maintainer, I want Astro public assets to use the existing image source without maintaining duplicate copies, so that image changes are not copied by hand.
19. As a recipe browser, I want modern category sections instead of a raw Markdown table of contents, so that I can scan the collection more easily.
20. As a recipe browser, I want recipe cards with title, category, markers, and explicit image when available, so that I can choose recipes quickly.
21. As a recipe browser, I want featured recipes and categories to be managed by site metadata, so that the landing page can be maintained intentionally.
22. As a recipe searcher, I want a global nav search popup, so that I can search without navigating to a separate search page.
23. As a recipe searcher, I want to search for any word in the recipe body, so that searching for an ingredient like onion finds every matching recipe.
24. As a recipe searcher, I want search results to appear while typing, so that search feels fast and wiki-like.
25. As a recipe searcher, I want results to show title, snippet, category, and markers, so that I can recognize the right recipe before opening it.
26. As an English reader, I want English search to search English pages, so that results match the language I am using.
27. As a Hebrew reader, I want Hebrew search to search Hebrew pages, so that results match the language I am using.
28. As a maintainer, I want Pagefind or another established static search library used where appropriate, so that the repo does not maintain a custom search engine.
29. As a maintainer, I want site metadata stored in readable typed Astro project code, so that metadata is easy for agents and humans to update.
30. As a maintainer, I want Markdown recipe files to own only recipe body content, so that metadata and page framing are not mixed into the recipe text.
31. As a maintainer, I want missing metadata warnings instead of build failures, so that every recipe still gets a page while agents are alerted to fix incomplete catalog data.
32. As a maintainer, I want no runtime metadata inference from recipe bodies, so that page metadata is intentional and reviewable.
33. As a maintainer, I want semantic recipe markers such as favorite and vegan, so that the UI can render localized labels or symbols consistently.
34. As a maintainer, I want language-neutral category IDs with localized labels, so that category navigation is stable and translatable.
35. As a maintainer, I want optional explicit social images, so that social previews use intentional images rather than arbitrary first images from Markdown.
36. As a maintainer, I want regular title, description, canonical, and social metadata for pages, so that shared links have good previews where metadata exists.
37. As a maintainer, I want Recipe JSON-LD deferred, so that the MVP does not fabricate structured recipe data from inconsistent Markdown.
38. As a maintainer, I want Markdown rendered as-is for recipe content, so that the MVP does not depend on brittle ingredient or instruction parsing.
39. As a maintainer, I want the local build to output `dist/`, so that manual GitHub Pages publishing is possible for the first version.
40. As a future recipe-adding agent, I want `AGENTS.md` updated with site metadata instructions, so that new recipes are ready for the Astro site from the start.
41. As a future recipe-adding agent, I want the existing conversational recipe workflow preserved, so that adding recipes still means adding localized Markdown files first.
42. As a future recipe-adding agent, I want build warnings to identify missing metadata, so that I can fix catalog omissions before committing.
43. As a maintainer, I want established libraries used when they materially reduce maintenance burden, so that the repo avoids reinventing common functionality.
44. As a maintainer, I want simple local implementation where a library would replace only trivial logic, so that dependencies remain purposeful.
45. As a maintainer reviewing the upgrade branch, I want legacy-back-link removal considered as part of implementation planning, so that the Markdown and site navigation model stay coherent.

## Implementation Decisions

- Build an Astro project at the repository root using the existing package as the project package.
- Preserve the root-level localized recipe directories and image directory. Do not move recipe Markdown or source images.
- Generate static output into `dist/`; GitHub Pages publishing remains manual for the MVP.
- Configure the site for the repository GitHub Pages base path initially, while keeping future custom-domain support possible.
- Generate recipe pages at language-and-filename URLs such as `/en/{recipe-slug}/` and `/he/{recipe-slug}/`.
- Treat the Markdown filename basename as the stable recipe slug and identity for a recipe pair.
- Generate a page for every localized Markdown recipe file, regardless of whether it appears in landing-page navigation.
- Keep Markdown files as recipe body source. Do not move recipes into Astro content collections in a way that breaks direct GitHub Markdown links.
- Store site metadata in typed Astro project code rather than parsing the legacy Markdown index at build time.
- The metadata model should be pair-level and keyed by recipe slug, with localized English and Hebrew fields for title and description.
- The metadata model should support language-neutral category IDs, featured/navigation settings, semantic markers, ordering, and optional explicit social image.
- Missing localized title, description, or category should warn during build. Missing social image is acceptable.
- Do not infer page metadata from recipe body content at build time. Empty or incomplete metadata is allowed with warnings.
- Use semantic marker keys such as favorite and vegan rather than treating emoji as source data.
- Use stable category IDs with localized labels. Initial categories should include Basics, Doughs & Starches, Mains, Salads & Pickles, Sweets, and Snacks.
- Build localized landing pages: English at the site root and Hebrew at the Hebrew root.
- Landing pages should be useful browse surfaces with responsive navigation, search access, category sections, recipe cards, markers, and explicit images when metadata points to one.
- Use page-level RTL for Hebrew site pages. Do not add RTL wrappers inside raw Hebrew Markdown files.
- Use a hamburger navigation drawer on small screens.
- Use Pagefind for static search if it integrates cleanly with the Astro build. The search index should be generated from the built static pages.
- MVP search should be a global nav popup, not a dedicated search page or results route.
- Search should operate over the current language by default.
- Search results should appear while typing after a small threshold and include title, snippet, category, and markers.
- Recipe content should render Markdown as-is for the MVP. Do not parse ingredients, instructions, timing, nutrition, or servings into structured UI sections.
- Rewrite internal Markdown links to localized recipe site URLs during Astro rendering when they target `.MD` recipe files.
- Preserve Markdown image references in rendered recipe content and expose source images through the built static site without maintaining duplicate copies.
- Prefer a public asset link to the source image directory if it works reliably for local builds and GitHub Pages output.
- Add regular SEO and social preview metadata from the catalog where available.
- Defer Recipe JSON-LD structured data until recipe metadata and body structure are reliable enough to support it honestly.
- Update the repository agent instructions so future recipe additions include site metadata alongside localized Markdown files.
- Use established, maintained libraries for Astro, static search, Markdown processing, and link transformation where they meaningfully reduce maintenance cost.

## Testing Decisions

- The highest-value test seam is the generated static site: build the project and verify the resulting pages, links, search assets, responsive layout, and localized experiences from the outside.
- Browser-level checks should cover the English landing page, Hebrew landing page, at least one English recipe page, at least one Hebrew recipe page, the mobile navigation drawer, and the search popup.
- Build-level checks should verify that every localized Markdown recipe produces a page and is eligible for search indexing.
- Link checks should verify that rendered internal `.MD` recipe links point to generated localized site URLs instead of broken nested Markdown paths.
- Asset checks should verify that Markdown-referenced images render from the generated site under the expected site base path.
- Metadata checks should verify that missing title, description, or category produces a warning rather than a build failure.
- Search checks should verify that current-language recipe body terms appear in Pagefind results and that cross-language results are not shown in the MVP popup.
- RTL checks should verify that Hebrew pages set direction at the page level and that Hebrew navigation, cards, search UI, and content do not overlap or render left-to-right by accident.
- Responsive checks should verify desktop, tablet, and small phone viewports, with special attention to nav behavior and text fitting.
- Tests should assert external behavior rather than implementation details: generated URLs, visible UI, warnings, search behavior, and working links matter more than internal component structure.
- Since the current repository has no existing Astro test seam, introduce the fewest new seams practical: one build/browser verification seam plus narrow unit tests only for metadata validation and Markdown link rewriting if those are factored as pure utilities.
- Prettier should continue to check touched Markdown and project files before committing.

## Out of Scope

- Moving existing recipe Markdown files out of the root-level language directories.
- Breaking or redirecting existing direct GitHub Markdown recipe links.
- Backend search, server-side rendering, databases, or any dynamic server dependency.
- Automatic GitHub Pages deployment workflow. The MVP builds `dist/`; publishing is manual.
- Recipe JSON-LD structured data.
- Parsing ingredients, instructions, timings, servings, nutrition, or recipe steps into semantic data.
- A dedicated search page or search results route.
- Omnisearch across both localizations in the MVP.
- Automatically choosing social images from Markdown body images.
- Runtime metadata inference from recipe body content.
- Parsing the legacy Markdown index as part of the Astro build.
- A marketing-style blog shell, long editorial landing page, or influencer-style recipe article format.

## Further Notes

The branch for this work is `astro-recipe-blog`. The current domain glossary and ADRs were started before this spec and should guide implementation vocabulary and architecture. The old Markdown index may be read once by a person or agent during migration to seed the initial metadata, but the built site should not depend on parsing it.

The implementation should respect the repository's existing recipe workflow: future recipes are added through localized Markdown files, and agent instructions should be updated so metadata is added at the same time. Existing direct Markdown links stay readable, while future generated site links should be treated as stable once shared.
