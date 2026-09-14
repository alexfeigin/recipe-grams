---
status: accepted
---

# Preserve readable recipe sources alongside the site

Recipes are read both on GitHub and on the generated site, so moving the sources
or making them depend on Astro would break an established reading path. Keep the
localized Markdown and images in place, with a hand-maintained Markdown index and
a separate typed site catalog. Transform links and page framing at build time so
both reading experiences share the same recipe content.

## Consequences

The site has no backend, client router, or UI framework runtime.

| Owner                      | Responsibility                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `en/*.MD`, `he/*.MD`       | Ingredients, method, notes, and body images; no frontmatter or RTL wrappers.                                                          |
| `index.MD`                 | Hand-maintained bilingual index and emoji markers for GitHub readers.                                                                 |
| `images/`                  | One source for Markdown images and all public site assets.                                                                            |
| `src/lib/recipeCatalog.ts` | Pair-level metadata keyed by slug: localized titles/descriptions, browsing intent, semantic markers, and explicit card/social images. |

Every localized Markdown file generates a recipe page eligible for search.
A recipe need not appear in the catalog or index to get a page. The build never parses
`index.MD`, and the generated site does not link to it. Recipe changes update all
affected owners through the [authoring workflow](../../.agents/skills/recipe-grams-authoring/SKILL.md).
Keeping two indexes is intentional: GitHub readers need a readable table, while
the site needs typed metadata independent of that table's presentation.

Markdown keeps its first-line back link for GitHub readers. Rendering strips that
line and rewrites peer `.MD` links to site recipe URLs and `../images/` references
to public asset URLs, preserving query strings and fragments. Recipe bodies stay
Markdown content: semantic recipe parsing and Recipe JSON-LD are deferred because
the sources do not reliably supply structured fields. Ordinary page and social
metadata come from explicit catalog data, with generic fallbacks when absent.
Body images never select their own card or social preview.

`astro.config.mjs` sets `publicDir: "./images"`; there is no public-directory
symlink. Thus `images/pizza.jpg` publishes as `/recipe-grams/pizza.jpg`, and **every
file in `images/` is public**, including unreferenced files. Keep those files unless
positive evidence supports removal (a committed replacement, a duplicate, or the
owner's decision). Repository searches cannot establish whether a public URL is
used elsewhere. The spare `cookie.png` and `doughnut.png` title icons and
`leopard_expm.jpeg` pattern reference are deliberately retained; their evidence is
in [ADR 0028](../history/decisions.md#adr-0028).

Consolidates historical ADRs 0001, 0005, 0006, 0007, 0008, 0011, 0012, 0015, 0016, 0018, 0023, 0024, 0025, 0028; see the
[original records](../history/decisions.md#topic-index).
