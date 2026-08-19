# AGENTS.md — Recipe-Grams

Recipe-Grams is a bilingual Markdown recipe collection with a static Astro site built around the same source files. Treat recipe Markdown as the human-readable source, and keep site catalog metadata in sync when a change affects browsing, cards, search, or social previews.

## Repo Map

- `en/*.MD` — English recipe bodies, one file per recipe.
- `he/*.MD` — Hebrew recipe bodies, same basename as the English recipe.
- `images/` — source images used by Markdown and the generated site.
- `index.MD` — legacy GitHub-readable index, still maintained for published recipes.
- `src/lib/recipePages.ts` — site recipe catalog, localized metadata, category placement, markers, card images, and social images.

## Shared Repo Safety

This repo is used from more than one Mac/account. Protect existing work automatically, and keep Git details away from non-technical users:

- At the start of any change request, check the current local state.
- If there are no active local changes, quietly sync with the current `origin` branch before editing.
- If there are active local changes, pause before editing. In plain language, summarize what looks unfinished and ask whether to delete those changes forever, publish them to GitHub first, or continue the new work on top. Recommend the safest option.
- When active local changes include recipe Markdown or image files, inspect them as a possible recipe add/change even if the user did not describe them. Infer needed image sanitation, Markdown links, catalog metadata, paired localization, and `index.MD` updates from the changed files.
- Do not use `git stash`; hidden saved changes are too easy to forget in this workflow.
- Preserve unrelated edits. Only discard local changes with destructive git commands when the user explicitly asks for that exact operation.
- If syncing or pushing finds remote changes, integrate them carefully and explain only when a decision or conflict resolution is needed.

## Source Ownership

- Markdown owns recipe body content: ingredients, method, notes, and body images.
- Site catalog metadata owns generated-site behavior: localized titles, descriptions, category placement, featured order, favorite/vegan markers, card images, social images, and search metadata.
- `index.MD` owns the legacy GitHub index. The generated landing page does not parse `index.MD`; this repo's catalog code reads `src/lib/recipePages.ts`.
- Every localized `en/*.MD` and `he/*.MD` file generates a site recipe page and can appear in search, even if it is not featured on the landing page.
- A Markdown image renders inside the recipe page, but it does not automatically become the card image or social preview image. Promote it through `localizedMetadata(..., imageFilename)` in `src/lib/recipePages.ts`.
- This repo's Markdown rendering code strips the first-line back-to-index link from generated recipe pages. Keep that line in Markdown so direct GitHub recipe views remain navigable.
- Do not add recipe frontmatter for site metadata. Use the catalog in `src/lib/recipePages.ts`.

## Markdown Conventions

- First line in Hebrew recipes: `[חזרה לתפריט](../index.MD)`.
- First line in English recipes: `[Back to Menu](../index.MD)`.
- Use gram measurements, not volume cups. Convert volume measurements when reasonable; note assumptions in the recipe text when uncertain.
- Recipe image paths are relative from recipe files: `../images/file-name.ext`.
- Internal recipe links should point to peer Markdown files, for example `./grill_rub.MD`; this repo's rendering code rewrites them to site URLs.
- Hebrew recipes use normal Markdown only; page direction is handled by Astro.

## Adding A Recipe

When the user supplies a recipe in English or Hebrew and asks to add it, publish it end to end unless they explicitly say not to publish it:

1. Work in the user’s language. Ask a follow-up only when a missing detail blocks a usable recipe.
2. Create both localized files under `en/` and `he/` with the same snake-style basename and `.MD` extension.
3. Preserve the recipe while normalizing structure, grammar, and gram measurements.
4. Translate naturally into the missing language.
5. Add or update images:
   - Put site-ready recipe images in `images/` with clear filenames, regardless of where the user-provided source image starts.
   - Sanitize each new image before linking it: make a web-ready copy with dimensions large enough for recipe pages, cards, and social previews, while resizing/compressing oversized originals so the static site stays fast.
   - Link useful body images from both localized Markdown files with the Markdown path `../images/file-name.ext`.
   - If an image should appear on the landing card and social preview, pass only the image filename, such as `"file-name.ext"`, as the third argument to each localized `localizedMetadata(...)` call in `src/lib/recipePages.ts`.
6. Add a `recipeCatalog` entry in `src/lib/recipePages.ts` with category, markers, featured order, localized titles, localized descriptions, and optional image filename.
7. Add the recipe to `index.MD` in the most appropriate existing category unless the user explicitly says not to publish it there. Include both Hebrew and English links in the same row.
8. Pick existing markers consistently: add `🅥` / `vegan` only when the recipe is vegan, and `★` / `favorite` only when the user says it is a favorite.
9. Run formatting and verification, then commit and push so the recipe is visible on GitHub.
10. Finish in the user’s language with links to the Hebrew recipe, English recipe, and index.

## Changing A Recipe

When changing an existing recipe, update every source that owns the changed behavior:

- Body-only change: edit the relevant `en/*.MD` and/or `he/*.MD`; update the paired translation when the recipe content should stay aligned.
- New or changed body image: sanitize the image, store the site-ready copy in `images/`, link it from the Markdown recipe body as `../images/file-name.ext`, and verify the path exists.
- Card/social image change: update the recipe’s `localizedMetadata(...)` image argument in `src/lib/recipePages.ts` with only `file-name.ext`; body images alone are not enough.
- Title, description, category, featured order, favorite, or vegan state: update `src/lib/recipePages.ts`; also update `index.MD` markers/category row when the legacy index should match.
- New localized Markdown file for an existing slug: make sure the paired language exists, metadata has both localizations, and the generated language switch will have a target.

Before finalizing, check the rendered site behavior when the change touches metadata, images, navigation, search, or generated pages.

## Verification

- Run Prettier on touched Markdown, Astro, and TypeScript files before staging. Use `npx prettier --check {files}` and, if needed, `npx prettier --write {files}`.
- Verify Markdown image links point to real files under `images/`.
- For catalog or Astro changes, run the relevant project checks from `package.json`; at minimum prefer `npm run typecheck` and `npm run build` when site generation could be affected.
- For recipe publishing work, commit and push the current branch after checks pass.
