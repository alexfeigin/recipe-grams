# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static Astro site. The [decision index](docs/adr/README.md) routes to implementation rules and rationale.

## Users

Friends and family reading recipes in English or Hebrew while cooking, planning
meals, or following a shared link, including existing GitHub Markdown links.

## Product Purpose

Keep recipes readable on GitHub while making the same collection easier to browse,
search, and read on desktop and phone. The voice is practical and family-oriented;
the confirmed name is Recipe-Grams.

## Operating Context

No backend. Browsing, search, and dough calculations use static files and browser
code. Recipe Markdown remains independently readable.

## Capabilities and Constraints

- **Browse:** English and Hebrew landing pages group featured recipe cards by
  category, with titles, descriptions, markers, and explicitly selected images.
  Every localized recipe has a page even if it has no landing card. A recipe's
  language switch opens its counterpart, or the other language's home when no
  counterpart exists.
- **Search:** available in the header on every page and at every width. It searches
  recipe bodies in the current language, starts at two characters, and shows up to
  eight results with title, snippet, category and markers when available.
- **Poolish calculator:** generic mode accepts dough and ratio inputs; pizza mode
  uses a pizza count and preset ratios. Results separate poolish and final dough.
  Invalid inputs replace quantities with an explanation and disable copying;
  valid results can be copied as localized text. `?mode=` preserves the selected
  mode across language switching. The calculator is intentionally `noindex`,
  excluded from search and global navigation, and reached from pizza recipes
  (in pizza mode) or shared links. `poolish_calc.sh` remains the CLI counterpart.

Semantic ingredient, method, timing, and nutrition parsing, Recipe JSON-LD,
cross-language search, and a dedicated search results page remain out of scope.

## Brand Commitments

Recipe content and useful browsing controls lead the page. Use real food imagery
and plain language; avoid marketing sections and long editorial introductions.

## Evidence on Hand

The source recipes, catalog, and maintained checks describe the collection as it
changes. Historical page counts and screenshots belong to their recorded checkpoints.

## Product Principles

- Preserve shared recipe links and readable source files.
- Make browsing quicker than scanning a Markdown table.
- Choose recipe identity and metadata explicitly.
- Keep reading, searching, and calculating usable without a backend.
