---
status: accepted
---

# Keep static search and language controls in the header

Unlisted recipes depend on search for discovery, including on phones. Use
Pagefind over built recipe HTML to search both languages from any page, with
search and language controls in the header at every width and only navigation
links in the drawer. This avoids a custom search engine or backend and removes an
extra mobile step from a frequent task.

## Consequences

Recipe pages supply `data-pagefind-body`, a language filter, and category/marker
metadata. There is no separate results route. Header interactions live in
`siteHeader.ts`.

Pagefind by default builds one index per `<html lang>` and searches only the
index of the page it runs on, which is why search was first limited to the
current language. The build instead passes `--force-language en` for one shared
index: English keeps its stemming, and Hebrew loses nothing because Pagefind has
no Hebrew stemmer. The language filter now orders results rather than hiding
them, so the page's language comes first and a result in the other language
opens that language's page. Merging the second index at runtime was rejected:
Pagefind refuses to merge its own bundle and would search it with the wrong
stemmer.

[Product](../../PRODUCT.md) and [Design](../../DESIGN.md) own the interaction and
layout details. The drawer contains category links on landing pages and Home on
recipe/calculator pages; search and language controls stay outside it.

Consolidates historical ADRs 0003, 0014, 0021, 0027; see the
[original records](../history/decisions.md#topic-index).
