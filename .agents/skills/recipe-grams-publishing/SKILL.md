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

## Publish GitHub Pages

**Trigger:** Run a live publication only when the user has authorized a release.
Ordinary verification, review, and report work ends without invoking the
publication command. Commit and push the source branch first.

**Command:** From the committed, pushed source checkout being released, run:

```bash
npm run publish:site -- --message "{short commit message}"
```

The destination defaults to `~/sources/alexfeigin.github.io/`; use
`--destination <checkout>` for the same repository at another path. The helper
runs the final gate once, owns that run's output, replaces only
`recipe-grams/`, and pushes the deployment commit. Do not run a separate final
gate immediately before it.

**Success:** Carry forward the helper's source revision, destination, deployment
revision or no-change result, and site link. Stop after a successful push; Pages
may take time to update, and publication does not include live-site polling or a
post-push browser audit.

**Exceptions:** The helper preserves dirty or staged destination work and stops
on source-state problems, unexpected identity or branch, divergence, concurrent
verification, scoped-copy violations, and failed Git operations. Report its
actionable error and leave recovery state visible. Resolve exceptional state
explicitly, preserving unrelated work; a rejected push is not retried through
reset, rebase, stash, or force-push.

Finish in the user's language. Link a new recipe's Hebrew and English pages and
index; link the main site for a broad site change, or the affected pages otherwise.
