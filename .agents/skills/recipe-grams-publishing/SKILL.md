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

For an authorized site release, finish focused checks, commit and push source
changes, then let the publication command run the one final gate. For covered
site-source work without a release, finish with `npm run verify`.

## Publish GitHub Pages

**Trigger:** Run a live publication only when the user has authorized a release.
Ordinary verification, review, and report work ends without invoking the
publication command. Commit and push the source branch first.

**Command:** From the committed, pushed source checkout being released, run:

```bash
npm run publish:site -- --message "{short commit message}"
```

This one command works from any clone or worktree, including a fresh one. By
default the helper publishes through this checkout's ignored
`.pages/alexfeigin.github.io/` clone, creating it on first use and recreating it
after it is removed; there is no manual clone or setup step.
`--destination <checkout>` instead names an existing checkout of the same Pages
repository. The helper runs the final gate once, owns that run's output,
replaces only `recipe-grams/`, and pushes the deployment commit.

**Success:** Carry forward the helper's source revision, destination, deployment
revision or no-change result, and site link. Stop after a successful push; Pages
may take time to update, and publication does not include live-site polling or a
post-push browser audit.

**Exceptions:** The helper preserves dirty or staged destination work and stops
on source-state problems, an invalid occupant at the managed Pages path,
unexpected identity or branch, divergence, a remote that advanced during
verification, concurrent verification, scoped-copy violations, and failed Git
operations, including a failed first clone. Report its
actionable error and leave recovery state visible. Resolve exceptional state
explicitly, preserving unrelated work; a rejected push is not retried through
reset, rebase, stash, or force-push.

Finish in the user's language. Link a new recipe's Hebrew and English pages and
index; link the main site for a broad site change, or the affected pages otherwise.
