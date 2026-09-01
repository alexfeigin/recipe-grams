---
name: recipe-grams-publishing
description: Verify and publish Recipe-Grams recipe or Astro site changes. Use for formatting, checks, release commits and pushes, GitHub Pages deployment, and final recipe links.
---

# Recipe-Grams Publishing

## Verify

1. Run Prettier on touched Markdown, Astro, and TypeScript files. Check first with `npx prettier --check {files}` and use `npx prettier --write {files}` when needed.
2. Confirm every touched Markdown image link resolves to a file under `images/`.
3. Run `npm run check`; finish with no new Astro errors or warnings.
4. When catalog data, navigation, search, generated pages, images, or Astro code changed, run the relevant `package.json` checks. At minimum run `npm run typecheck` and `npm run build` when site generation could be affected, then inspect the relevant rendered behavior.

For recipe publishing, commit and push the current Recipe-Grams branch after verification passes.

## Deploy GitHub Pages

After committing Recipe-Grams changes, use the deployment checkout at `~/sources/alexfeigin.github.io/`; every workstation must keep that repository there.

1. Build from `~/sources/recipe-grams/`:

   ```bash
   rm -rf dist/ && npm run build
   ```

2. Publish from `~/sources/alexfeigin.github.io/`:

   ```bash
   git fetch origin && git reset --hard origin/master
   rsync -av --delete ~/sources/recipe-grams/dist/ ~/sources/alexfeigin.github.io/recipe-grams/
   git add recipe-grams
   git commit -m "{short commit message}"
   git push
   ```

3. If syncing or pushing discovers remote changes, integrate them carefully and involve the user only when a decision or conflict resolution is required.
4. Stop after the push: report that deployment is complete and GitHub Pages may take a little time to update. Do not poll or run post-push tests.

Finish in the user's language. For a newly published recipe, link the Hebrew recipe, English recipe, and index. For a broad site change, link the main site; otherwise link the pages that changed.
