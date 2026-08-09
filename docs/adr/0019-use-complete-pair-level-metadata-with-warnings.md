# Use complete pair-level metadata with warnings

Recipe metadata will be keyed by recipe slug and contain localized title and description fields, language-neutral category IDs, semantic markers, featured/navigation data, and an optional explicit social image. Missing title, description, or category should produce a build warning so agents can fix the catalog, while uncataloged recipes still build as pages and remain searchable.
