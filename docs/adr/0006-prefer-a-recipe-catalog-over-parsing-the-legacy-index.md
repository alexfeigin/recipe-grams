# Prefer a recipe catalog over parsing the legacy index

Recipe metadata for the Astro site should come from structured catalog code instead of parsing `index.MD`. The Markdown index was designed for direct GitHub reading, and parsing it would make site behavior depend on presentation details rather than intentional metadata; an agent may read `index.MD` during initial migration, but the running build should not.

Still in force, and clarified by [0025 — Keep the legacy index for Markdown readers and the catalog for generated browsing](0025-keep-the-legacy-index-for-markdown-readers-and-the-catalog-for-generated-browsing.md), which records the lasting role of each index after the migration.
