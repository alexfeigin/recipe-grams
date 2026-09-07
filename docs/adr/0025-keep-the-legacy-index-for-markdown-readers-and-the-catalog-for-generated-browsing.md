# Keep the legacy index for Markdown readers and the catalog for generated browsing

Clarifies [0006 — Prefer a recipe catalog over parsing the legacy index](0006-prefer-a-recipe-catalog-over-parsing-the-legacy-index.md), which remains in force.

The two indexes are permanent and serve different readers, so neither replaces the other. [`index.MD`](../../index.MD) is the table of contents for people reading recipes as Markdown on GitHub: it is hand-maintained, keeps its bilingual table and emoji markers, and is updated whenever a recipe is added, renamed, or recategorized. The recipe catalog in Astro code is the source for generated browsing: landing pages, categories, cards, markers, featured order, and social previews all come from it, as [0007 — Store site metadata in Astro code](0007-store-site-metadata-in-astro-code.md) established. Adding a recipe therefore means updating both owners.

The build never parses `index.MD`; the allowance in 0006 for an agent to read it applied to the initial migration only. The two indexes are also separate at read time: the generated site does not link to `index.MD`, and Markdown readers reach it through GitHub and through the recipe back links that [0023 — Preserve recipe back links in source and strip them in the site](0023-preserve-recipe-back-links-in-source-and-strip-them-in-the-site.md) preserves.
