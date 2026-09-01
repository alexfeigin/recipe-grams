---
name: recipe-grams-authoring
description: Add or change Recipe-Grams recipes end to end. Use for bilingual recipe Markdown, gram conversion, recipe images, catalog metadata, categories, markers, search or social previews, and index entries.
---

# Recipe-Grams Authoring

Work in the user's language and ask a follow-up only when a missing detail blocks a usable recipe. Preserve the recipe while normalizing structure and grammar.

## Source Model

- `en/*.MD` and `he/*.MD` own ingredients, method, notes, and body images. Paired localizations share a snake-style basename and `.MD` extension.
- `src/lib/recipePages.ts` owns localized titles and descriptions, category placement, featured order, favorite and vegan markers, card images, social images, and search metadata.
- `index.MD` owns the legacy GitHub-readable index. The generated landing page reads the catalog, not this file.
- Every localized Markdown file generates a site page and can appear in search even when it is not featured.

Keep site metadata in the catalog; recipe Markdown has no frontmatter.

## Author or Edit

1. For a new recipe, create both localizations with matching basenames and translate the supplied language naturally into the other. For an existing recipe, update the paired translation whenever the changed content should remain aligned.
2. Keep the first line as `[Back to Menu](../index.MD)` in English and `[חזרה לתפריט](../index.MD)` in Hebrew. Generated pages strip this line, while direct GitHub views retain it.
3. Use gram measurements rather than volume cups. Convert volume measurements when reasonable and record uncertain assumptions in the recipe text.
4. Link peer recipes as Markdown peers such as `./grill_rub.MD`; the site renderer rewrites them. Use ordinary Markdown in Hebrew because Astro controls page direction.
5. Put every new site-ready image in `images/` with a clear filename. Make a web-ready copy large enough for recipe pages, cards, and social previews while resizing or compressing oversized originals.
6. Link useful body images from both localizations as `../images/file-name.ext`, at the bottom after the recipe text unless the surrounding recipe establishes a more specific layout. Confirm every link resolves to a real file.
7. Promote a card or social image explicitly by passing only its filename as the third argument to each localized `localizedMetadata(...)` call. A Markdown body image does not promote itself.
8. For a new published recipe, add a complete `recipeCatalog` entry and a row in the most suitable `index.MD` category with both language links. For edits, update every owner affected by the changed title, description, category, featured order, marker, image, or localization. When adding one localization to an existing slug, ensure its paired language and catalog localization exist so the generated language switch has a target.
9. Apply `vegan` / `🅥` only when the recipe is vegan. Apply `favorite` / `★` only when the user calls it a favorite.

Unless the user explicitly excludes publication, finish a new recipe through `$recipe-grams-publishing`. Completion requires usable paired localizations, synchronized owned metadata and index entries, valid image paths, and consistent markers.
