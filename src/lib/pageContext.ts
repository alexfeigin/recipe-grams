// What a localized page derives from its language, so no surface re-derives it:
// the document direction and social locale, the interface labels the page and
// its header share, and the home URLs of this language and the other one. A
// page asks for its context once and keeps only the decisions that are its own
// — its title, description, social card, and the links its header points at.
// This module reads no files and holds no recipe data; the vocabulary it builds
// on lives in ./site.
import {
  labelsByLanguage,
  sitePath,
  type LocalizedLabels,
  type RecipeLanguage,
} from "./site";

export type PageDirection = "ltr" | "rtl";

// One entry in the header's navigation, in the order the page wants it shown.
export type NavItem = {
  label: string;
  href: string;
};

export type PageContext = {
  language: RecipeLanguage;
  direction: PageDirection;
  // The Open Graph locale for this language.
  locale: string;
  labels: LocalizedLabels;
  basePath: string;
  // Where this language's landing page lives, and where the other language's
  // does, for pages whose language switch has no better destination.
  homeHref: string;
  alternateLanguage: RecipeLanguage;
  alternateHomeHref: string;
};

export function getPageContext(
  language: RecipeLanguage,
  basePath: string,
): PageContext {
  const alternate = alternateLanguage(language);

  return {
    language,
    direction: directionFor(language),
    locale: localeFor(language),
    labels: labelsByLanguage[language],
    basePath,
    homeHref: homeHref(basePath, language),
    alternateLanguage: alternate,
    alternateHomeHref: homeHref(basePath, alternate),
  };
}

// Hebrew is written right to left; see ADR 0022 for why the whole page turns.
export function directionFor(language: RecipeLanguage): PageDirection {
  return language === "he" ? "rtl" : "ltr";
}

export function localeFor(language: RecipeLanguage): string {
  return language === "he" ? "he_IL" : "en_US";
}

export function alternateLanguage(language: RecipeLanguage): RecipeLanguage {
  return language === "he" ? "en" : "he";
}

// English is published at the site root and Hebrew under `he/`; see ADR 0009.
export function homeHref(basePath: string, language: RecipeLanguage): string {
  return sitePath(basePath, language === "he" ? "he/" : "");
}
