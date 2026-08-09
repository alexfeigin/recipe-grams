# Recipe-Grams

Recipe-Grams is a bilingual personal recipe collection. The repository preserves readable Markdown recipes for direct GitHub viewing while also generating a static recipe site from the same source files.

## Language

**Legacy Markdown Recipe**:
A recipe file under `en/` or `he/` that remains readable directly in GitHub and keeps its existing repository path stable.
_Avoid_: Old recipe, raw recipe

**Localized Recipe**:
One language-specific Markdown version of a recipe, either Hebrew or English.
_Avoid_: Translation file, page source

**Recipe Pair**:
The Hebrew and English localized recipes that share the same basename and represent the same recipe.
_Avoid_: Duplicate recipe, language variants

**Published Recipe**:
A legacy Markdown recipe that is included in the generated static site, whether or not it is featured in site navigation.
_Avoid_: Blog post, article

**Featured Recipe**:
A published recipe that appears in primary navigation, category browsing, or curated index surfaces.
_Avoid_: Published recipe, indexed recipe

**Recipe Index**:
The navigable collection view that helps readers browse published recipes by language, category, and markers.
_Avoid_: Menu, table of contents

**Recipe Catalog**:
Structured metadata for recipes that does not belong in the readable Markdown recipe body, such as category labels, featured navigation data, SEO metadata, and social sharing metadata.
_Avoid_: Parsed index, frontmatter

**Recipe Source Tree**:
The root-level `en/`, `he/`, and `images/` directories that remain in place to preserve existing GitHub Markdown links.
_Avoid_: Astro content folder, migrated content

**Search Index**:
The static client-side search data generated from the built recipe pages.
_Avoid_: Database, backend search

**Site Recipe Page**:
The GitHub Pages HTML rendering of a localized recipe, with a stable URL derived from its language and basename.
_Avoid_: Replacement recipe, generated Markdown

**Localized Landing Page**:
The language-specific home and browse experience for the generated site.
_Avoid_: Marketing page, table of contents

**Recipe Slug**:
The filename basename of a localized recipe, used as the stable identity and URL segment for generated site pages.
_Avoid_: Title, permalink text

**Featured Category**:
A named grouping used by the Astro site landing page and browse UI.
_Avoid_: Icon section, Markdown table section

**Recipe Marker**:
A semantic recipe attribute such as `favorite` or `vegan` that the UI renders as localized labels or symbols.
_Avoid_: Emoji source data, freeform badge

**Legacy Back Link**:
The first-line Markdown link from a localized recipe back to `index.MD`.
_Avoid_: Site navigation, recipe metadata

**MVP**:
The first Astro site version that publishes static localized recipe pages, localized landing pages, responsive navigation, and static recipe search without semantic recipe parsing or recipe-specific structured data.
_Avoid_: Final site, full SEO implementation

**Metadata Warning**:
A build-time warning that a published recipe page exists without complete catalog metadata.
_Avoid_: Build failure, inferred metadata

**Social Image**:
An explicitly selected image used for social previews of a site recipe page.
_Avoid_: First Markdown image, inferred card image
