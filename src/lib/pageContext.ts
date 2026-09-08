import { uiLabels, type UiLabels } from "../i18n/ui";
import { sitePath, type RecipeLanguage } from "./site";

export type PageDirection = "ltr" | "rtl";

export type NavItem = {
  label: string;
  href: string;
};

export type PageContext = {
  language: RecipeLanguage;
  direction: PageDirection;
  locale: string;
  labels: UiLabels;
  basePath: string;
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
    labels: uiLabels[language],
    basePath,
    homeHref: homeHref(basePath, language),
    alternateLanguage: alternate,
    alternateHomeHref: homeHref(basePath, alternate),
  };
}

function directionFor(language: RecipeLanguage): PageDirection {
  return language === "he" ? "rtl" : "ltr";
}

function localeFor(language: RecipeLanguage): string {
  return language === "he" ? "he_IL" : "en_US";
}

function alternateLanguage(language: RecipeLanguage): RecipeLanguage {
  return language === "he" ? "en" : "he";
}

function homeHref(basePath: string, language: RecipeLanguage): string {
  return sitePath(basePath, language === "he" ? "he/" : "");
}
