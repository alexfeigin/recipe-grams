# Design

A bright, readable kitchen work surface: compact recipe cards on landing pages,
a single reading column for recipes, and form/results panels for the calculator.
[Product](PRODUCT.md) owns behavior; this file owns visual rules.

## Shared theme

[src/styles/design-tokens.css](src/styles/design-tokens.css) is the source of
palette values, light color scheme, system sans font stack, and semantic
`--control-*` tokens. Use those tokens in consumers. There are no web fonts.

Warm paper and pale cards support dark ink and muted secondary text. Tomato,
olive, and steel are content and edge accents. Interactive controls use the shared
blue accent, darkened to `#487889` to give white labels about 4.86:1 contrast;
preserve readable contrast in hover and focus states too.

Pages own heading scales (`clamp()`), spacing, shadow depth, and genuine local
variants: landing category-chip colors and calculator-specific accent shades.

## Layout and interaction

- Put browsing controls and recipe content in the first viewport.
- Use real recipe photos for food cards; keep cards shallow and easy to scan.
- Keep targets stable and readable on small phones, in both LTR and RTL.
- Search and the language toggle stay in the header bar at every width.
  The hamburger drawer holds navigation links, not those controls: category
  links on landing pages and Home on recipe/calculator pages.

## Responsive boundaries

Each surface owns its breakpoint. At and below the listed width:

| Width             | Effect                                                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `880px`           | Header navigation becomes a hamburger drawer beside brand, search, and language controls.                                               |
| `820px`           | Calculator and phase grids stack into one column.                                                                                       |
| `640px`           | Landing hero and recipe grid, calculator field/results grids become single-column; landing and recipe content use narrow phone margins. |
| `1080px`, `380px` | Header spacing and control sizes tighten without a structural layout change.                                                            |

Desktop and tablet share the larger layout. Introduce another mode only when real
content or controls require it; do not merge the independent surface breakpoints.
