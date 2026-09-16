---
status: accepted
---

# Serve static assets from Astro's public directory

Recipes must remain readable on GitHub while their images and site assets publish
at predictable URLs. Astro's root `images/` public-directory override prevented
other static files from using the conventional `public/` directory. Keep one
tracked image source in `public/images/` and let Astro publish it only under
`/images/`. This supersedes ADR 0036 and the image-hosting progression in
historical ADRs 0016 and 0024; it preserves the single-source and readable-recipe
reasons behind those decisions without a symlink or manually duplicated files.

## Consequences

Localized `en/*.MD` and `he/*.MD` files remain the recipe sources without
frontmatter or RTL wrappers. Their first-line link to `index.MD` serves GitHub
readers and is stripped from site pages. The hand-maintained bilingual `index.MD`
continues to serve GitHub readers; the site uses its separate typed catalog for
titles, descriptions, browsing intent, markers, and selected card/social images.
Every localized Markdown file generates a searchable site page, even without a
catalog entry. Body images do not select preview images.

Markdown recipes link images through `../public/images/`, and `index.MD` uses
`public/images/`, so GitHub resolves the same tracked files. Site rendering
rewrites recipe and image destinations to site URLs, preserving queries and
fragments. The site uses `/recipe-grams/images/...` for cards, recipe bodies,
shared assets, and social previews. Keep unreferenced source images under
`public/images/` unless positive evidence supports removal. The retained title
icons and pattern reference are explained in historical ADR 0028.

The Search Console verification file lives at `public/google897e637a154db3cd.html`.
Its built root URL and exact bytes are checked after each build. Recipe bodies
remain Markdown; semantic recipe parsing and Recipe JSON-LD remain deferred.
