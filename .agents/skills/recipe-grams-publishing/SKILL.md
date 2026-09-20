---
name: recipe-grams-publishing
description: Verify and publish Recipe-Grams recipe or Astro site changes. Use for formatting, checks, release commits and pushes, GitHub Pages deployment, and final recipe links.
---

# Recipe-Grams Publishing

Use `$recipe-grams-safety` before changing files, carrying its preparation across
phase handoffs and rechecking status against the task record. Verification alone
does not imply a release; follow the user's requested scope and the authoring
workflow's completion rule for new recipes.

## Verify

Follow [Development's verification selection policy](../../../docs/development.md#select-verification)
and task-to-source/check table. Review affected recipe image links as part of the
authoring obligations. Retain meaningful existing tests; a passing final gate
already includes checking, building, generated checks, and browser tests. Carry
that evidence forward while its inputs remain current.

For recipe publishing, commit and push the current Recipe-Grams branch after
verification passes. Commit source changes before deploying them.

## Deploy GitHub Pages

The deployment checkout is `~/sources/alexfeigin.github.io/` on every workstation.

1. Inspect its `git status --short --branch` before syncing or copying. Preserve
   unfinished work and resolve its disposition with the user, then synchronize
   the clean branch using `git pull --ff-only`. Confirm this is the publishing
   `master` branch. Resolve divergence explicitly; do not erase local commits or
   edits to match origin.
2. Publish only verified current output from the Recipe-Grams checkout being
   released, following the [release evidence policy](../../../docs/development.md#select-verification).
   Reuse the clean `dist/` produced by its successful final gate. If relevant
   inputs changed or the output is missing, overwritten, or cannot be tied to
   that run, run the gate before copying. A commit or handoff alone does not
   invalidate verification; do not rebuild unchanged verified output.

3. From the verified Recipe-Grams checkout, replace only the published site in
   the synchronized deployment checkout, then commit and push there:

   ```bash
   rsync -av --delete dist/ ~/sources/alexfeigin.github.io/recipe-grams/
   git -C ~/sources/alexfeigin.github.io add recipe-grams
   git -C ~/sources/alexfeigin.github.io diff --cached --stat
   git -C ~/sources/alexfeigin.github.io commit -m "{short commit message}"
   git -C ~/sources/alexfeigin.github.io push
   ```

   Inspect the staged scope before committing. If the build produces no changes,
   report that the published files already match; an empty commit is unnecessary.

4. If syncing or pushing discovers remote changes, integrate them carefully;
   involve the user only for a decision or conflict requiring their input.
5. Stop after a successful push. Report the deployment and that Pages may take
   time to update; do not poll or run post-push tests.

Finish in the user's language. Link a new recipe's Hebrew and English pages and
index; link the main site for a broad site change, or the affected pages otherwise.
