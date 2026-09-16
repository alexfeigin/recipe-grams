---
status: accepted
---

# Build a static site and publish manually

The collection needs portable hosting without a backend. Keep Astro at the
repository root, build a fully static site into `dist/`, and publish it manually
through the separate GitHub Pages checkout. This keeps the release process small
and independent of a deployment service or CI workflow.

## Consequences

Pagefind indexes the generated HTML after Astro builds. The deployment checkout
is `~/sources/alexfeigin.github.io/`; its `recipe-grams/` directory receives
the site build. The generated `robots.txt` is published at the host root because
crawlers do not read one under `/recipe-grams/`. It advertises this site's
sitemap and allows crawling without adding restrictions to the shared host.
Committing source and deploying the site are separate steps;
the [publishing workflow](../../.agents/skills/recipe-grams-publishing/SKILL.md)
owns the procedure.

Automatic deployment remains deferred. It can be introduced if manual releases
become a burden.

Consolidates historical ADRs 0002, 0010; see the
[original records](../history/decisions.md#topic-index).
