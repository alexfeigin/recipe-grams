# Design

Recipe-Grams uses a practical recipe-browse interface rather than a marketing page. The visual system should feel like a clean kitchen work surface: bright, readable, tactile, and direct.

## Current Surface

The first Astro English home page uses a restrained light palette with warm paper, ink, tomato, olive, and steel accents. Recipe cards are compact browsing units with real food photos, metadata, and direct recipe links. Navigation is simple on desktop and collapses to a small drawer on phones.

## Durable Rules

- Lead with browsing controls and recipe content in the first viewport.
- Use real recipe imagery from `images/` whenever a card shows food.
- Keep cards shallow and scannable; avoid marketing sections.
- Keep interactive targets stable and readable on small phones.
- Keep shared selected-toggle and primary utility-button colors in `src/styles/design-tokens.css`; consumers use the semantic `--control-*` tokens instead of hard-coded color copies.

## Supported Viewports

- Desktop/tablet browse: use the full navigation and multi-column content layout for widths above `640px`.
- Modern phone browse: use the compact hamburger navigation and single-column card layout at `640px` and below.
- Do not add tablet-only visual modes unless real content or controls break in the shared desktop/tablet layout.
