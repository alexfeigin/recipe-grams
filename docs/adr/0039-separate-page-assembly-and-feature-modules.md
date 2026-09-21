---
status: accepted
---

# Separate page assembly and feature modules

Separate source discovery, catalog rules, shared vocabulary, and browser behavior
so changing one concern does not require loading the others. Share document
assembly and language defaults to avoid keeping three page shells in sync, while
pages retain their own content and styling.

## Consequences

| Module                       | Owns                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/lib/site.ts`            | Languages, identity/category/marker types, and `sitePath`; no filesystem work or interface copy. |
| `src/lib/recipeCatalog.ts`   | Catalog data, lookups, eligibility, diagnostics; depends on site vocabulary.                     |
| `src/lib/recipeSources.ts`   | Lightweight build-time discovery of localized Markdown recipe sources.                           |
| `src/lib/recipePages.ts`     | Landing data, catalog reporting, and Markdown rendering; consumes source discovery and catalog.  |
| `src/lib/recipeLinks.ts`     | Markdown destination transformation, independently testable with fixtures.                       |
| `src/lib/pageContext.ts`     | Language-derived direction, social locale, labels, and current/alternate home URLs.              |
| `src/layouts/SitePage.astro` | Shared document shell, common metadata, theme import, and header.                                |
| `src/scripts/`               | Typed browser behavior, separate from build-time modules.                                        |

Pages supply their own title, description, published path, social image, canonical
and indexing choices, and header links. They keep their `<main>` and local styles;
extra head content (such as Pagefind metadata) uses the layout's `head` slot.
Add language-wide defaults to `pageContext`, not to each surface.

`initializeSiteHeader(header)` receives the rendered header and reads its data
attributes. Lookups are scoped to it and fail loudly on markup mismatches. Search
receives a navigation controller exposing `close()`, rather than reaching into a
global script. `backToTop.ts` receives its focus destination. Pages preserving
query state use `setLanguageSwitchQuery` to update all `data-language-switch`
links. These boundaries keep small static scripts independently understandable.

`src/lib/poolishCalculator.ts` owns pure parsing, validation, and arithmetic;
`src/scripts/poolishCalculatorPage.ts` owns browser interaction. The target dough
means flour plus water, with salt and yeast added on top. Preserve whole-gram
rounding (salt to one decimal), the 3 g minimum poolish yeast, and validation of
impossible water splits both before and after rounding. Independent expected
quantities and rejection cases live in the pure calculation tests; browser tests
cover localized feedback, copying, and mode/language switching.

Consolidates historical ADRs 0026, 0029, 0032, 0034; see the
[original records](../history/decisions.md#topic-index).
