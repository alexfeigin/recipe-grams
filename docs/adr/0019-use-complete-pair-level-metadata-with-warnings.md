# Use complete pair-level metadata with warnings

Recipe metadata will be keyed by recipe slug and contain localized title and description fields, language-neutral category IDs, semantic markers, featured/navigation data, and an optional explicit social image. Missing title, description, or category should produce a build warning so agents can fix the catalog, while uncataloged recipes still build as pages and remain searchable.

Refined by [0030 — Model featured and intentionally unfeatured recipes explicitly](0030-model-featured-and-unlisted-recipes-explicitly.md): browsing intent is now stated by the entry itself rather than inferred from a missing category, and incomplete metadata on a featured recipe is a build error instead of a warning. Uncataloged recipes still build and stay searchable.
