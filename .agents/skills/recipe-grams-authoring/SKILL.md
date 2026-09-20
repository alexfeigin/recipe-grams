---
name: recipe-grams-authoring
description: Add or change Recipe-Grams recipes end to end. Use for bilingual recipe Markdown, gram conversion, recipe images, catalog metadata, categories, markers, search or social previews, and index entries.
---

# Recipe-Grams Authoring

Use `$recipe-grams-safety` before editing, retaining its preparation across phase
handoffs. Work in the user's language; clarify only missing details that block a
usable recipe. Preserve the recipe while
normalizing grammar and structure.

## Author or edit

1. Create matching `en/<slug>.MD` and `he/<slug>.MD` files for a new recipe. Use a
   lowercase snake-style basename without spaces. For edits, update the paired
   translation wherever content should stay aligned. Preserve existing filenames
   because they are shared URL identities.
2. Keep `[Back to Menu](../index.MD)` as the first English line and
   `[חזרה לתפריט](../index.MD)` as the first Hebrew line. Use ordinary Markdown,
   without frontmatter or Hebrew RTL wrappers. Link peer recipes as `./grill_rub.MD`.
3. Use grams rather than cups; convert volume measurements when reasonable and
   put uncertain assumptions in the recipe text.
4. Put web-ready images in `public/images/` with clear filenames, compressing/resizing
   oversized originals while retaining enough detail for pages and previews.
   Link useful body images from both localizations as `../public/images/file.ext`, after
   the recipe unless its existing layout suggests otherwise. Confirm paths resolve.
   Existing unreferenced images stay unless positive evidence supports removal;
   see [image ownership and retention](../../../docs/adr/0043-serve-static-assets-from-public.md).
5. Update `src/lib/recipeCatalog.ts` with localized titles and descriptions,
   markers, and explicit preview images. Use `featuredRecipe(category, markers,
order, localizations)` with a unique order within its category, or
   `unlistedRecipe(reason, markers, localizations)` for a helper the user wants
   omitted from landing browsing. Pass an image filename as the third argument
   of each `localizedMetadata(...)` call to select a card/social image; body
   images do not select themselves. For eligibility and build diagnostics, read
   [catalog intent](../../../docs/adr/0037-model-catalog-browsing-intent-explicitly.md).
6. Add or update the `index.MD` row in the appropriate category, with both
   language links and markers. It serves GitHub readers independently of the
   catalog. Keep every affected owner aligned when changing a title, category,
   order, marker, image, or localization. Adding a localization also requires
   its paired source and catalog localization.
7. Apply `vegan` / 🅥 only to vegan recipes, and `favorite` / ★ only when the user
   calls the recipe a favorite.

Complete when paired recipes are usable, catalog/index changes agree, image links
resolve, and markers are consistent. Unless the user excludes publication, finish
a new recipe through `$recipe-grams-publishing`. Use the shared
[verification selection policy](../../../docs/development.md#select-verification)
for development feedback and completion; carry passing evidence into publishing.
