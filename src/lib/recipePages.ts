// Build-time recipe pages: discovering the localized recipes in the recipe
// source tree, assembling landing page data from the catalog, and rendering a
// recipe's Markdown body into site HTML. Everything here runs at build time and
// touches the filesystem; shared labels and URLs live in ./site and recipe
// metadata lives in ./recipeCatalog.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";
import { getCatalogEntry, getRecipeMetadata } from "./recipeCatalog";
import {
  isRecipeLanguage,
  labelsByLanguage,
  languages,
  sitePath,
  type RecipeCategoryId,
  type RecipeIdentity,
  type RecipeLanguage,
  type RecipeMarkerId,
} from "./site";

export type LocalizedRecipe = RecipeIdentity & {
  sourcePath: string;
};

export type RecipeCard = {
  slug: string;
  title: string;
  description: string;
  href: string;
  categoryId: RecipeCategoryId;
  markerIds: RecipeMarkerId[];
  image?: string;
  featuredOrder: number;
};

export type CategorySection = {
  id: RecipeCategoryId;
  label: string;
  description: string;
  recipes: RecipeCard[];
};

const repoRoot = process.cwd();

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

export function listRecipePairs(): string[] {
  const localizedRecipes = listLocalizedRecipes();
  const slugsByLanguage = new Map<RecipeLanguage, Set<string>>();

  for (const language of languages) {
    slugsByLanguage.set(language, new Set());
  }

  for (const recipe of localizedRecipes) {
    slugsByLanguage.get(recipe.language)?.add(recipe.slug);
  }

  return Array.from(slugsByLanguage.get("en") ?? [])
    .filter((slug) => slugsByLanguage.get("he")?.has(slug))
    .sort();
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

export function getLandingPageData(language: RecipeLanguage, basePath: string) {
  const labels = labelsByLanguage[language];
  const pairedSlugs = new Set(listRecipePairs());
  const cards: RecipeCard[] = listLocalizedRecipes()
    .filter((recipe) => recipe.language === language)
    .filter((recipe) => pairedSlugs.has(recipe.slug))
    .flatMap((recipe) => {
      const entry = getCatalogEntry(recipe.slug);
      const metadata = getRecipeMetadata(recipe);

      if (!entry?.categoryId || entry.featuredOrder === undefined) {
        return [];
      }

      return [
        {
          slug: recipe.slug,
          title: metadata.title,
          description: metadata.description,
          href: sitePath(basePath, `${language}/${recipe.slug}/`),
          categoryId: entry.categoryId,
          markerIds: entry.markerIds,
          image: metadata.image,
          featuredOrder: entry.featuredOrder,
        },
      ];
    })
    .sort((a, b) => a.featuredOrder - b.featuredOrder);

  const categorySections: CategorySection[] = (
    Object.keys(labels.categoryLabels) as RecipeCategoryId[]
  )
    .map((categoryId) => ({
      id: categoryId,
      label: labels.categoryLabels[categoryId],
      description: labels.categoryDescriptions[categoryId],
      recipes: cards.filter((recipe) => recipe.categoryId === categoryId),
    }))
    .filter((section) => section.recipes.length > 0);

  return {
    labels,
    direction: language === "he" ? "rtl" : "ltr",
    language,
    alternateHref:
      language === "he" ? sitePath(basePath, "") : sitePath(basePath, "he/"),
    recipePairCount: pairedSlugs.size,
    categoryCount: categorySections.length,
    categorySections,
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
  const siteMarkdown = rewriteMarkdownLinks(rawMarkdown, recipe, basePath);
  const rendered = await markdownRenderer.render(siteMarkdown, {
    fileURL: new URL(`file://${recipe.sourcePath}`),
    frontmatter: {},
  });

  return rendered.code;
}

function rewriteMarkdownLinks(
  markdown: string,
  recipe: LocalizedRecipe,
  basePath: string,
): string {
  return rewriteMarkdownRecipeLinks(
    rewriteMarkdownImageLinks(markdown, basePath),
    recipe,
    basePath,
  );
}

function rewriteMarkdownImageLinks(markdown: string, basePath: string): string {
  return markdown.replace(
    /(!\[[^\]]*\]\()\.\.\/images\/([^)]+)(\))/g,
    (_match, prefix: string, imagePath: string, suffix: string) =>
      `${prefix}${sitePath(basePath, imagePath)}${suffix}`,
  );
}

function rewriteMarkdownRecipeLinks(
  markdown: string,
  recipe: LocalizedRecipe,
  basePath: string,
): string {
  return markdown.replace(
    /(?<!!)(\[[^\]]+\]\()([^)\s]+\.MD)(#[^)]+)?(\))/g,
    (
      match,
      prefix: string,
      recipePath: string,
      hash: string | undefined,
      suffix: string,
    ) => {
      const target = parseRecipeLinkTarget(recipePath, recipe.language);

      if (!target) {
        return match;
      }

      return `${prefix}${sitePath(
        basePath,
        `${target.language}/${target.slug}/${hash ?? ""}`,
      )}${suffix}`;
    },
  );
}

function parseRecipeLinkTarget(
  recipePath: string,
  fallbackLanguage: RecipeLanguage,
): { language: RecipeLanguage; slug: string } | undefined {
  const parsed = path.posix.parse(recipePath);

  if (parsed.ext !== ".MD" || parsed.name === "index") {
    return undefined;
  }

  const pathLanguage = recipePath
    .split("/")
    .find((segment): segment is RecipeLanguage => isRecipeLanguage(segment));

  return {
    language: pathLanguage ?? fallbackLanguage,
    slug: parsed.name,
  };
}

function stripLegacyBackLink(markdown: string): string {
  return markdown.replace(
    /^\[(?:Back to (?:Menu|index)|חזרה לתפריט)\]\(\.\.\/index\.MD\)\r?\n+/,
    "",
  );
}
