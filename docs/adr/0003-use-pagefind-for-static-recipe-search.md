# Use Pagefind for static recipe search

Recipe-Grams will use Pagefind for site search rather than maintaining a custom search index by hand. Pagefind indexes the generated static HTML after the Astro build and emits static search assets, which matches the requirement for full-recipe word search without a backend.
