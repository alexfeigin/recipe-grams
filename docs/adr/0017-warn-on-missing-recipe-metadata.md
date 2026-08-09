# Warn on missing recipe metadata

Every localized Markdown recipe should still generate a page and be searchable, even when catalog metadata is incomplete. The build should warn on missing metadata so recipe-adding agents can fix it before commit, but the site should not infer metadata by scanning recipe bodies or fail the build solely because a recipe is uncategorized.
