# Preserve recipe back links in source and strip them in the site

Supersedes [0008 — Remove legacy back links from recipes](0008-remove-legacy-back-links-from-recipes.md).

The first-line `[Back to Menu](../index.MD)` link stays in every localized Markdown recipe, because GitHub readers still open recipes directly and need a way back to [`index.MD`](../../index.MD). Removing it would have broken the reading path that [0001 — Preserve Markdown recipes as the source of truth](0001-preserve-markdown-recipes-as-source.md) exists to protect. The generated site instead strips that first line while rendering the recipe body, so site pages navigate through the layout as originally intended and never show a link into raw Markdown. Recipe authoring keeps writing the back link; only site rendering removes it.
