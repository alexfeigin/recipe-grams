# Prefer a recipe catalog over parsing the legacy index

Recipe metadata for the Astro site should come from structured catalog code instead of parsing `index.MD`. The Markdown index was designed for direct GitHub reading, and parsing it would make site behavior depend on presentation details rather than intentional metadata; an agent may read `index.MD` during initial migration, but the running build should not.
