---
status: accepted
---

# Keep static search and language controls in the header

Unlisted recipes depend on search for discovery, including on phones. Use
Pagefind over built recipe HTML for current-language search, with search and
language controls in the header at every width and only navigation links in the
drawer. This avoids a custom search engine or backend and removes an extra mobile
step from a frequent task.

## Consequences

Recipe pages supply `data-pagefind-body`, a language filter, and category/marker
metadata. Search results stay in the current language; there is no separate
results route. Header interactions live in `siteHeader.ts`.

[Product](../../PRODUCT.md) and [Design](../../DESIGN.md) own the interaction and
layout details. The drawer contains category links on landing pages and Home on
recipe/calculator pages; search and language controls stay outside it.

Consolidates historical ADRs 0003, 0014, 0021, 0027; see the
[original records](../history/decisions.md#topic-index).
