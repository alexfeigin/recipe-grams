---
status: accepted
---

# Use explicit localized routes and interface copy

Shared URLs need stable identities, and both English and Hebrew must be complete
reading experiences. Keep English at the landing root without language redirects,
use language-and-filename recipe URLs and language-prefixed side pages, and require
complete typed interface translations with document-level Hebrew RTL. This keeps
links independent of display titles and catches missing interface copy instead of
silently falling back to English.

## Consequences

Paths below are relative to the configured `/recipe-grams/` site base. Use
`sitePath` for base-aware links.

| Surface    | English        | Hebrew         |
| ---------- | -------------- | -------------- |
| Landing    | `/`            | `/he/`         |
| Recipe     | `/en/{slug}/`  | `/he/{slug}/`  |
| Calculator | `/en/poolish/` | `/he/poolish/` |

The root defaults to English without a browser-language redirect. Only landing
pages have that asymmetry; recipe and side-page URLs name their language.
Slugs come from filenames, so renaming a recipe changes shared URLs. Side pages
use `src/pages/[language]/<name>.astro` and generate paths from `languages`.
Reserve side-page names: `poolish.MD` would collide with the calculator, and
`verify:recipes` rejects a recipe URL that renders a side page.

The former English `/poolish/` route was removed without a redirect in ADR 0035.
Known recipe links were updated; old shared links are a known compatibility loss.
A redirect remains an option if one is reported.

Hebrew direction is set on the document. `src/i18n/` owns interface translations,
one module per surface (`ui.ts` for shared chrome, `calculator.ts` for calculator
copy). Export `<surface>Labels: Record<RecipeLanguage, <Surface>Labels>` so missing
translations fail type checking. There is no English fallback for interface
strings: both languages are first-class, and untranslated English inside an RTL
interface is a defect. `languageNames` holds language-picker endonyms. Recipe
body text and catalog copy stay with their source owners.

Consolidates historical ADRs 0004, 0009, 0013, 0022, 0035; see the
[original records](../history/decisions.md#topic-index).
