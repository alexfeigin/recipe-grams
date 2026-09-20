---
name: recipe-grams-safety
description: Prepare the shared Recipe-Grams working tree before any file-changing task. Use for every requested edit, addition, deletion, refactor, or release in this repository.
---

# Recipe-Grams Safety

Protect work shared across Macs and accounts before editing. Prepare once per
task, and carry that preparation through authoring, verification, and publishing.

1. Run `git status --short --branch`. Record the branch, initial changes, and the
   user's chosen disposition and publication exclusions in the task context.
2. When the tree has no active changes, quietly synchronize the current branch with origin using a fast-forward-only pull. If the remote cannot fast-forward cleanly, inspect the divergence and involve the user only when a decision or conflict resolution is required.
3. When active changes exist, stop before editing. Summarize the unfinished work in plain language and ask whether to publish it to GitHub first, continue the new work on top, or delete it forever. Recommend publishing first as the safest choice.
4. If active changes include recipe Markdown or images, inspect them as a possible recipe addition or edit and use `$recipe-grams-authoring` to account for paired localization, sanitized images, Markdown links, catalog metadata, and `index.MD`.

Keep existing work visible: preserve unrelated edits and leave changes in the working tree rather than hiding them. Never use `git stash`. Discard local work only when the user explicitly authorizes deleting those exact changes.

The preparation is complete when the clean branch is synchronized, or the user has chosen how to handle every active change and that choice has been carried out without disturbing unrelated work.

At phase handoffs, recheck status against that record. Known edits belonging to
this task and previously accounted-for work do not trigger the initial dirty-tree
question or another pull. Newly discovered or unaccounted-for changes follow the
same disposition process before further edits. Preserve publication exclusions
when staging, committing, pushing, or deploying.
