# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro at the repository root. The historical migration spec in `docs/specs/0001-astro-recipe-blog.md` records how it was introduced; this document describes what ships today.

## Users

Recipe-Grams serves friends and family browsing a bilingual personal recipe collection while cooking, planning meals, or following a shared recipe link. Users may read in English or Hebrew and may arrive through existing GitHub Markdown links.

## Product Purpose

Recipe-Grams preserves readable Markdown recipes and adds a static browsing site around the same source tree. Success means recipes remain stable in GitHub while the generated site makes browsing, scanning, and opening recipes easier on desktop and phone.

## Operating Context

The source of truth remains the root-level `en/`, `he/`, and `images/` directories. The generated site is static, intended for GitHub Pages, and must work without a backend. Everything a reader does — browsing, search, and dough calculations — runs in the browser against files produced by the build.

## Capabilities and Constraints

Shipped today:

- **Browse.** Localized landing pages — English at the site root, Hebrew at `/he/` — list catalog category sections of recipe cards with title, description, category, markers, and an explicit image where the catalog names one. Every localized Markdown recipe also gets its own site page, whether or not it is featured.
- **Search.** A Pagefind field lives in the site header on every page, at every width. It searches pages in the current language only, shows results while typing from the second character, and lists up to eight results with title, category, markers, and a snippet. Search needs the built index, so it works against `npm run build` output and the published site, not `npm run dev`.
- **Poolish calculator.** `/en/poolish/` and `/he/poolish/` compute dough weights in the browser: a generic mode with editable dough, hydration, poolish, yeast, and salt values, and a pizza-preset mode driven by a pizza count. Invalid input replaces the numbers with an explanation and disables copying; valid input enables a button that copies the poolish and final-dough weights as text. The chosen mode is kept in a `?mode=` query parameter and carried across the language switch. The calculator is deliberately hidden: it is `noindex`, absent from site navigation, and reached from the pizza dough recipes — which link straight to `?mode=pizza` — or a shared link. It is a port of `poolish_calc.sh`, which stays the command-line equivalent.

Constraints that still hold: static generation only, existing recipe and image source directories stay in place, and localized landing pages and recipe URLs stay derived from language and filename. Recipe body parsing, backend behavior, and automatic Markdown-index parsing remain out of scope.

## Brand Commitments

The confirmed product name is Recipe-Grams. The voice should stay practical, family-oriented, and recipe-first.

## Evidence on Hand

Real recipe Markdown exists under `en/` and `he/` — 41 localized files each. Real recipe images exist under `images/`. A build generates 86 pages plus the Pagefind index. The project spec and ADRs under `docs/` define the Astro migration and the decisions that followed it.

## Product Principles

- Preserve existing readable recipe sources.
- Make browsing faster than scanning a raw Markdown table.
- Favor clear, stable recipe identity over inferred metadata.
- Keep reading, searching, and calculating usable without a backend.
- Keep accepted UI behavior authoritative when older written guidance disagrees.
