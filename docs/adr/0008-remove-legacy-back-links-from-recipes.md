# Remove legacy back links from recipes

The first-line recipe links back to `index.MD` will be removed from the Markdown recipes during the Astro upgrade. Direct GitHub recipe URLs will still show readable recipe content, and the generated site will provide navigation through its layout instead of preserving the old per-file back link.

Superseded by [0023 — Preserve recipe back links in source and strip them in the site](0023-preserve-recipe-back-links-in-source-and-strip-them-in-the-site.md). The back links were kept in the Markdown source for GitHub readers, and the site strips them during rendering instead.
