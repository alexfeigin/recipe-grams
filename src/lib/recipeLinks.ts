// Site destinations for generated recipe pages. A Legacy Markdown Recipe keeps
// the repository-relative destinations that make it readable on GitHub, while a
// Site Recipe Page needs published URLs. The rewrite runs as a Markdown AST
// plugin so only real link, image, and reference destinations change; code,
// labels, and prose are never touched. Nothing here parses recipe semantics.
import type { SatteriMarkdownProcessorOptions } from "@astrojs/markdown-satteri";
import path from "node:path";
// The explicit extension keeps this module loadable by `node --test` directly,
// so the destination fixtures run without a build.
import { isRecipeLanguage, sitePath, type RecipeLanguage } from "./site.ts";

type MarkdownPlugin = NonNullable<
  SatteriMarkdownProcessorOptions["mdastPlugins"]
>[number];

// The recipe source tree publishes `images/` at the site root (Astro's
// `publicDir`), and each localized recipe as `<language>/<slug>/`.
const imagesDirectory = "images";
const recipeExtension = ".MD";

/**
 * Rewrite one Markdown destination written in a localized recipe under
 * `language/` into its published URL, or return `undefined` to leave the
 * destination exactly as the author wrote it.
 */
export function resolveSiteDestination(
  destination: string,
  language: RecipeLanguage,
  basePath: string,
): string | undefined {
  const [, target = "", suffix = ""] =
    /^([^?#]*)([?#].*)?$/s.exec(destination) ?? [];

  // Same-page fragments, site-absolute paths, and anything with a scheme or
  // authority (`https:`, `mailto:`, `//host/x.MD`) address something other than
  // a file in this repository.
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

/**
 * A Markdown AST plugin rewriting the destinations of inline links and images
 * and of the definitions that reference-style links and images point at.
 */
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
