import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { isRecipeLanguage, languages, type RecipeIdentity } from "./site.ts";

export type LocalizedRecipe = RecipeIdentity & {
  sourcePath: string;
};

export function listLocalizedRecipeSources(
  root: string = process.cwd(),
): LocalizedRecipe[] {
  return languages.flatMap((language) => {
    const directory = path.join(root, language);

    return readdirSync(directory)
      .filter((file) => file.endsWith(".MD"))
      .sort()
      .map((file) => ({
        language,
        slug: file.replace(/\.MD$/, ""),
        sourcePath: path.join(directory, file),
      }));
  });
}

export function findLocalizedRecipeSource(
  language: string | undefined,
  slug: string | undefined,
  root: string = process.cwd(),
): LocalizedRecipe | undefined {
  if (!isRecipeLanguage(language) || !slug) {
    return undefined;
  }

  const sourcePath = path.join(root, language, `${slug}.MD`);
  if (!existsSync(sourcePath)) {
    return undefined;
  }

  return { language, slug, sourcePath };
}
