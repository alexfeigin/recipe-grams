# Use language and filename for site recipe URLs

Site recipe pages will use URLs shaped like `/en/{recipe-slug}/` and `/he/{recipe-slug}/`, where the recipe slug comes from the existing Markdown filename. This mirrors the repository's language folders, keeps URLs stable across title changes, and makes link breakage an explicit consequence of renaming recipe files.
