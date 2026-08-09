# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro at the repository root, delegated by the project spec in `docs/specs/0001-astro-recipe-blog.md`.

## Users

Recipe-Grams serves friends and family browsing a bilingual personal recipe collection while cooking, planning meals, or following a shared recipe link. Users may read in English or Hebrew and may arrive through existing GitHub Markdown links.

## Product Purpose

Recipe-Grams preserves readable Markdown recipes and adds a static browsing site around the same source tree. Success means recipes remain stable in GitHub while the generated site makes browsing, scanning, and opening recipes easier on desktop and phone.

## Operating Context

The source of truth remains the root-level `en/`, `he/`, and `images/` directories. The generated site is static, intended for GitHub Pages, and must work without a backend.

## Capabilities and Constraints

The MVP must generate static pages, keep existing recipe and image source directories in place, support localized landing pages and recipe URLs, and eventually provide same-language static search. Recipe body parsing, backend behavior, and automatic Markdown-index parsing are out of scope.

## Brand Commitments

The confirmed product name is Recipe-Grams. The voice should stay practical, family-oriented, and recipe-first.

## Evidence on Hand

Real recipe Markdown exists under `en/` and `he/`. Real recipe images exist under `images/`. The project spec and ADRs under `docs/` define the Astro migration.

## Product Principles

- Preserve existing readable recipe sources.
- Make browsing faster than scanning a raw Markdown table.
- Favor clear, stable recipe identity over inferred metadata.
- Keep the static site useful before the full catalog pipeline exists.
