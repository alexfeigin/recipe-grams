import type { SatteriMarkdownProcessorOptions } from "@astrojs/markdown-satteri";
import path from "node:path";
import { isRecipeLanguage, sitePath, type RecipeLanguage } from "./site.ts";

type MarkdownPlugin = NonNullable<
  SatteriMarkdownProcessorOptions["mdastPlugins"]
>[number];

const imagesDirectory = "images";
const recipeExtension = ".MD";

export function resolveSiteDestination(
  destination: string,
  language: RecipeLanguage,
  basePath: string,
): string | undefined {
  const [, target = "", suffix = ""] =
    /^([^?#]*)([?#].*)?$/s.exec(destination) ?? [];

  if (!target || target.startsWith("/") || /^[a-z][a-z\d+.-]*:/i.test(target)) {
    return undefined;
  }

  const sourcePath = path.posix.join(language, target);
  if (sourcePath.startsWith("../")) {
    return undefined;
  }

  const segments = sourcePath.split("/");
  if (segments[0] === imagesDirectory && segments.length > 1) {
    return `${sitePath(basePath, segments.slice(1).join("/"))}${suffix}`;
  }

  const [recipeLanguage, recipeFile, ...rest] = segments;
  if (
    rest.length === 0 &&
    isRecipeLanguage(recipeLanguage) &&
    recipeFile?.endsWith(recipeExtension)
  ) {
    const slug = recipeFile.slice(0, -recipeExtension.length);
    return slug
      ? `${sitePath(basePath, `${recipeLanguage}/${slug}/`)}${suffix}`
      : undefined;
  }

  return undefined;
}

export function createSiteDestinationPlugin(
  language: RecipeLanguage,
  basePath: string,
): MarkdownPlugin {
  const published = (destination: string) =>
    resolveSiteDestination(destination, language, basePath);

  const plugin: MarkdownPlugin = {
    name: "recipe-grams-site-destinations",
    link(node, context) {
      const destination = published(node.url);
      if (destination !== undefined)
        context.setProperty(node, "url", destination);
    },
    image(node, context) {
      const destination = published(node.url);
      if (destination !== undefined)
        context.setProperty(node, "url", destination);
    },
    definition(node, context) {
      const destination = published(node.url);
      if (destination !== undefined)
        context.setProperty(node, "url", destination);
    },
  };

  return plugin;
}
