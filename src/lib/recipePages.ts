import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";

export const languages = ["en", "he"] as const;
export type RecipeLanguage = (typeof languages)[number];

export type LocalizedRecipe = {
  language: RecipeLanguage;
  slug: string;
  sourcePath: string;
};

type RecipeMetadata = {
  title: string;
  description: string;
  image?: string;
};

const repoRoot = process.cwd();

const recipeMetadata: Partial<
  Record<string, Partial<Record<RecipeLanguage, RecipeMetadata>>>
> = {
  choclatechip_vegan: {
    en: {
      title: "Vegan Chocolate Chip Cookies",
      description:
        "A plant-based cookie with familiar crisp edges and soft centers.",
      image: "Veganchoc.jpeg",
    },
  },
  grilled_chicken_thighs: {
    en: {
      title: "Grilled Chicken Thighs",
      description:
        "A high-heat chicken thigh recipe for repeatable seasoning and juicy results.",
      image: "grilledchicken.jpeg",
    },
  },
  pizza_dough: {
    en: {
      title: "Pizza Dough Recipe",
      description:
        "A gram-based overnight poolish pizza dough for two 12-inch pizzas.",
      image: "pizza.jpg",
    },
    he: {
      title: "מתכון לבצק פיצה",
      description:
        "בצק פיצה בשיטת פוליש לילה, עם כמויות מדויקות בגרמים לשתי פיצות.",
      image: "pizza.jpg",
    },
  },
  quinoa: {
    en: {
      title: "Delicious Quinoa with Sweet Potato",
      description:
        "A simple quinoa and sweet potato base recipe measured in grams.",
      image: "quinoa.jpg",
    },
  },
};

const warnedMissingMetadata = new Set<string>();

let markdownRenderer:
  Awaited<ReturnType<typeof createSatteriMarkdownProcessor>> | undefined;

export function listLocalizedRecipes(): LocalizedRecipe[] {
  return languages.flatMap((language) => {
    const directory = path.join(repoRoot, language);

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

export function findLocalizedRecipe(
  language: string | undefined,
  slug: string | undefined,
): LocalizedRecipe | undefined {
  if (!isRecipeLanguage(language) || !slug) {
    return undefined;
  }

  const sourcePath = path.join(repoRoot, language, `${slug}.MD`);
  if (!existsSync(sourcePath)) {
    return undefined;
  }

  return { language, slug, sourcePath };
}

export function getRecipeMetadata(recipe: LocalizedRecipe): RecipeMetadata {
  const metadata = recipeMetadata[recipe.slug]?.[recipe.language];
  if (metadata) {
    return metadata;
  }

  const warningKey = `${recipe.language}/${recipe.slug}`;
  if (!warnedMissingMetadata.has(warningKey)) {
    warnedMissingMetadata.add(warningKey);
    console.warn(
      `[recipe metadata] Missing page title and description metadata for ${warningKey}.MD`,
    );
  }

  return {
    title: "Recipe-Grams Recipe",
    description:
      "A Recipe-Grams page rendered from the localized Markdown recipe source.",
  };
}

export async function renderRecipeBody(
  recipe: LocalizedRecipe,
  basePath: string,
): Promise<string> {
  markdownRenderer ??= await createSatteriMarkdownProcessor();

  const rawMarkdown = stripLegacyBackLink(
    readFileSync(recipe.sourcePath, "utf8"),
  );
  const siteMarkdown = rewriteMarkdownAssetLinks(rawMarkdown, basePath);
  const rendered = await markdownRenderer.render(siteMarkdown, {
    fileURL: new URL(`file://${recipe.sourcePath}`),
    frontmatter: {},
  });

  return rendered.code;
}

export function sitePath(basePath: string, pathName: string): string {
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return `${normalizedBase}${pathName.replace(/^\/+/, "")}`;
}

function rewriteMarkdownAssetLinks(markdown: string, basePath: string): string {
  return markdown.replace(
    /(!\[[^\]]*\]\()\.\.\/images\/([^)]+)(\))/g,
    (_match, prefix: string, imagePath: string, suffix: string) =>
      `${prefix}${sitePath(basePath, imagePath)}${suffix}`,
  );
}

function stripLegacyBackLink(markdown: string): string {
  return markdown.replace(
    /^\[(?:Back to (?:Menu|index)|חזרה לתפריט)\]\(\.\.\/index\.MD\)\r?\n+/,
    "",
  );
}

function isRecipeLanguage(
  language: string | undefined,
): language is RecipeLanguage {
  return languages.includes(language as RecipeLanguage);
}
