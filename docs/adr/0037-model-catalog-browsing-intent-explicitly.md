---
status: accepted
---

# Model catalog browsing intent explicitly

Optional category metadata made an intentionally unlisted helper recipe look like
an accidental omission. Give every catalog entry explicit featured or unlisted
intent, and fail the build when missing featured metadata would drop a promised
card. Keep uncataloged sources publishable and searchable with warnings, preserving
access while making incomplete browsing metadata visible.

## Consequences

- `featuredRecipe(categoryId, markerIds, featuredOrder, localizations)` supplies a
  landing card's category and order.
- `unlistedRecipe(reason, markerIds, localizations)` records intentional omission
  from landing browsing. Unlisted recipes remain published and searchable.

Category IDs and marker IDs are semantic, language-neutral keys; interface copy
localizes their presentation. A missing category cannot stand in for unlisted
intent. Catalog localizations are partial because the build supports a source
existing in only one language; the authoring workflow creates complete pairs.

`collectCatalogDiagnostics` checks the catalog against discovered sources once
per discovered set. Severity is explicit:

| Condition                                                                                                                       | Result                                                        |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Featured entry lacks title or description for an existing localized source                                                      | **Error:** stop the build; its promised card would disappear. |
| Source has no catalog entry                                                                                                     | Warning; publish/search it without a landing card.            |
| Unlisted entry lacks localized title or description                                                                             | Warning; use generic page metadata.                           |
| Orphan entry, catalog localization without a source, incomplete featured pair, or duplicate featured position within a category | Warning; build continues.                                     |

Landing cards require a complete source pair, even when the available language has
complete metadata. Intentional unlisted entries with complete metadata do not warn.
Catalog fixture tests cover eligibility and severity; generated checks compare
actual landing cards with the catalog without maintaining a helper-recipe whitelist.

Consolidates historical ADRs 0017, 0019, 0020, 0030; see the
[original records](../history/decisions.md#topic-index).
