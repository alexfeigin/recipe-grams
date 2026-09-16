---
name: recipe-grams-publishing
description: Verify and publish Recipe-Grams recipe or Astro site changes. Use for formatting, checks, release commits and pushes, GitHub Pages deployment, and final recipe links.
---

# Recipe-Grams Publishing

Use `$recipe-grams-safety` before changing files. Verification alone does not
imply a release; follow the user's requested scope and the authoring workflow's
completion rule for new recipes.

## Verify

1. Check touched Markdown, Astro, and TypeScript formatting with
   `npx prettier --check <files>`; apply `--write` where needed.
2. Check touched Markdown image links resolve under `images/`.
3. Run `npm run check`; finish with no new Astro errors or warnings.
4. Choose relevant checks from [Development](../../../docs/development.md).
   When site generation could change, run at least `npm run typecheck` and
   `npm run build`, then inspect the affected rendered behavior. `npm run verify`
   runs the complete maintained suite.

For recipe publishing, commit and push the current Recipe-Grams branch after
verification passes. Commit source changes before deploying them.

## Deploy GitHub Pages

The deployment checkout is `~/sources/alexfeigin.github.io/` on every workstation.

1. Inspect its `git status --short --branch` before syncing or copying. Preserve
   unfinished work and resolve its disposition with the user, then synchronize
   the clean branch using `git pull --ff-only`. Confirm this is the publishing
   `master` branch. Resolve divergence explicitly; do not erase local commits or
   edits to match origin.
2. In `~/sources/recipe-grams/`, produce a clean build:

   ```bash
   rm -rf dist/
   npm run build
   ```

3. In the synchronized deployment checkout, replace only the published site:

   ```bash
   rsync -av --delete ~/sources/recipe-grams/dist/ ~/sources/alexfeigin.github.io/recipe-grams/
   git add recipe-grams
   git diff --cached --stat
   git commit -m "{short commit message}"
   git push
   ```

   Inspect the staged scope before committing. If the build produces no changes,
   report that the published files already match; an empty commit is unnecessary.
4. If syncing or pushing discovers remote changes, integrate them carefully;
   involve the user only for a decision or conflict requiring their input.
5. Stop after a successful push. Report the deployment and that Pages may take
   time to update; do not poll or run post-push tests.

Finish in the user's language. Link a new recipe's Hebrew and English pages and
index; link the main site for a broad site change, or the affected pages otherwise.
