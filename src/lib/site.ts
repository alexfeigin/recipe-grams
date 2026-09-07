// Shared site vocabulary: the languages the site publishes, the identity of a
// localized recipe, and the URL helper every page uses to build site-relative
// links. This module holds no recipe data, no translated copy, and reads no
// files, so pages and components can import it directly. Interface
// translations live in src/i18n (ADR 0034).
export const languages = ["en", "he"] as const;
export type RecipeLanguage = (typeof languages)[number];

export type RecipeIdentity = {
  language: RecipeLanguage;
  slug: string;
};

export type RecipeCategoryId =
  | "basics"
  | "doughs_starches"
  | "mains"
  | "salads_pickles"
  | "sweets"
  | "snacks";

export type RecipeMarkerId = "favorite" | "vegan";

export function sitePath(basePath: string, pathName: string): string {
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return `${normalizedBase}${pathName.replace(/^\/+/, "")}`;
}

export function isRecipeLanguage(
  language: string | undefined,
): language is RecipeLanguage {
  return languages.includes(language as RecipeLanguage);
}
