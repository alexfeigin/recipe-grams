# Archived documents

Superseded documents are kept here rather than deleted, so the earlier way of
working stays readable. Nothing in this directory is current instruction.

## `איך לעלות מתכון לגיטהאב.docx`

A Hebrew Word guide to adding a recipe, written before the Astro site existed
(added in commit `8983e22`, last touched in `41b5f58`). It described six steps:
sync in the editor, add a `.MD` file under the right language directory, format
the text with a chatbot including the back-to-menu link, paste a translation
under the other language with the same filename, add the new rows to `index.MD`,
then commit and sync.

Those steps still describe the recipe source correctly, but the guide predates
three things the site now requires: catalog metadata in
`src/lib/recipeCatalog.ts`, verification with `npm run verify`, and publishing
the built site to the separate `alexfeigin.github.io` repository. It was
replaced by [docs/adding-a-recipe.he.md](../adding-a-recipe.he.md), the concise
Hebrew guide, with [AGENTS.md](../../AGENTS.md) and the skills under
[`.agents/skills/`](../../.agents/skills/) owning the full workflow.
