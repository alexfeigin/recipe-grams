# Recipe-Grams

A bilingual personal recipe collection, read both as Markdown and through a
browsing site. The same recipe can have localized text and several ways to reach it.

## Language

**Localized Recipe**:
One language-specific version of a recipe.
_Avoid_: Translation file, language variant

**Recipe Pair**:
The English and Hebrew localized recipes representing the same recipe.
_Avoid_: Duplicate recipes

**Recipe Slug**:
The stable name identifying a recipe across its localizations, independent of its
display title.
_Avoid_: Title, permalink text

**Published Recipe**:
A localized recipe available on the site, whether or not it appears in browsing.
_Avoid_: Featured recipe, blog post

**Site Recipe Page**:
The site's readable presentation of a localized recipe.
_Avoid_: Replacement recipe, generated Markdown

**Featured Recipe**:
A published recipe selected for landing-page browsing, with a category and order.
_Avoid_: Published recipe, indexed recipe

**Unlisted Recipe**:
A published recipe deliberately omitted from landing-page browsing, with a recorded
reason; it remains searchable.
_Avoid_: Uncategorized recipe, hidden recipe, missing metadata

**Recipe Catalog**:
The collection's browsing and preview metadata, including each recipe's listing
intent, localized display copy, markers, and selected images.
_Avoid_: Parsed index, frontmatter

**Featured Category**:
A named grouping of featured recipes for browsing.
_Avoid_: Icon section, Markdown table section

**Recipe Marker**:
A semantic recipe attribute, such as favorite or vegan, presented as a label or symbol.
_Avoid_: Emoji source data, freeform badge

**Localized Landing Page**:
The home and browse experience for one language.
_Avoid_: Marketing page, table of contents

**Recipe Index**:
A navigable collection view; qualify it as the Markdown index or site browsing
when the distinction matters.
_Avoid_: Menu

**Search Index**:
The recipe search data used to find published recipes by their content.
_Avoid_: Database, recipe catalog

**Social Image**:
An explicitly selected image representing a recipe in sharing previews.
_Avoid_: First body image, inferred card image

**Metadata Warning**:
A notice that catalog metadata is incomplete or inconsistent with the recipe
collection; distinct from an error that prevents publication.
_Avoid_: Build failure, inferred metadata

**Legacy Markdown Recipe**:
The still-supported recipe source that readers can open directly on GitHub.
_Avoid_: Obsolete recipe, raw recipe

**Recipe Source Tree**:
The preserved collection of localized recipe sources and original images.
_Avoid_: Migrated content, Astro content folder

**Legacy Back Link**:
A link from a readable recipe source back to the Markdown recipe index.
_Avoid_: Site navigation, recipe metadata
