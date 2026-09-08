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
