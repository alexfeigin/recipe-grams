---
status: accepted
---

# Build a static site and publish manually

The collection needs portable hosting without a backend. Keep Astro at the
repository root, build a fully static site into `dist/`, and publish it manually
through the separate GitHub Pages checkout. This keeps the release process small
and independent of a deployment service or CI workflow.

## Consequences

Pagefind indexes the generated HTML after Astro builds. The publication command
owns its deployment checkout: an ignored shallow clone of the Pages repository at
`.pages/alexfeigin.github.io/` inside the active source checkout, created on the
first release. Any clone at any path can therefore publish without a separately
provisioned sibling checkout. Only the clone's `recipe-grams/` directory receives
the built output. Committing source and deploying the site are separate steps;
the [publishing workflow](../../.agents/skills/recipe-grams-publishing/SKILL.md)
owns the procedure.

Automatic deployment remains deferred. It can be introduced if manual releases
become a burden.

Consolidates historical ADRs 0002, 0010; see the
[original records](../history/decisions.md#topic-index).
