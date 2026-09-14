# Architecture decisions

Read the accepted ADRs that match the work; a task can require several. Each has a
short context/decision/reason paragraph, with consequences where needed. ADRs
0036–0042 consolidate existing decisions; archived 0001–0035 retain their original
identities and wording. The archive is only for investigating earlier choices.

| When working on                                                                                     | Read                                                                                           |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Recipe source files, Markdown rendering or links, `index.MD`, image paths or retention              | [0036 — Sources and publication](0036-preserve-readable-recipe-sources.md)                     |
| Catalog entries, landing cards/order, categories, markers, preview metadata, or catalog diagnostics | [0037 — Catalog](0037-model-catalog-browsing-intent-explicitly.md)                             |
| Routes, slugs, language switching, interface translations, RTL, or adding a localized page          | [0038 — URLs and languages](0038-use-explicit-localized-routes-and-copy.md)                    |
| Module boundaries, shared page shell/context, browser script interfaces, or calculator logic        | [0039 — Module responsibilities](0039-separate-page-assembly-and-feature-modules.md)           |
| Pagefind, search behavior, header controls, or the navigation drawer                                | [0040 — Search and navigation](0040-keep-static-search-and-language-controls-in-the-header.md) |
| Test coverage, check ownership/order, or preview-server lifecycle                                   | [0041 — Verification](0041-verify-at-the-owning-layer-before-expensive-checks.md)              |
| Astro hosting configuration, build output, GitHub Pages, or deployment                              | [0042 — Build and release](0042-build-a-static-site-and-publish-manually.md)                   |

For example, changing a recipe's category needs Catalog; adding a side page needs
URLs and languages plus Module responsibilities; changing search interactions needs Search
and navigation plus Verification. Routine tasks do not require reading every topic.

[Product](../../PRODUCT.md) owns reader behavior, [Design](../../DESIGN.md) owns
visual rules, and [Development](../development.md) owns commands. The repository
skills own authoring and publishing procedures.

## Maintaining decisions

Use `$domain-modeling` for ADRs and glossary changes. Its ADR format is a short
title plus 1–3 sentences of context, decision, and reason; optional status,
alternatives, or consequences belong only where they help. Add a new ADR only
when the decision is hard to reverse, surprising without context, and the result
of a real tradeoff.

- Keep files in `docs/adr/` as `NNNN-descriptive-slug.md`. Scan for the highest
  number and increment it. Keep existing IDs stable, including those preserved
  in the archive.
- Clarifications update the relevant ADR. For a qualifying changed decision,
  create the next numbered record, identify what it replaces, and mark the old
  status `superseded by ADR-NNNN`. Preserve the earlier rationale.
- Route each task to its accepted ADRs in this table; keep superseded records out
  of the normal reading path. Flag proposals that contradict an accepted ADR by
  its number and explain why the choice should be revisited.
- Group related decisions by topic. Add a separate file when an independent
  decision meets the skill's criteria, rather than for every implementation edit.
