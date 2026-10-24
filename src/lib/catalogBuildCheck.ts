import type { AstroIntegration } from "astro";
import { collectCatalogDiagnostics } from "./recipeCatalog.ts";
import { listLocalizedRecipeSources } from "./recipeSources.ts";

export function checkRecipeCatalog(root: string = process.cwd()): void {
  const diagnostics = collectCatalogDiagnostics(
    listLocalizedRecipeSources(root),
  );

  for (const diagnostic of diagnostics) {
    if (diagnostic.severity === "warning") {
      console.warn(`[recipe catalog] ${diagnostic.message}`);
    }
  }

  const errors = diagnostics.filter(
    (diagnostic) => diagnostic.severity === "error",
  );

  if (errors.length > 0) {
    throw new Error(
      [
        "Incomplete recipe catalog metadata:",
        ...errors.map((error) => `  - ${error.message}`),
      ].join("\n"),
    );
  }
}

/** Runs the catalog diagnostics once per build, failing it on errors. */
export function recipeCatalogCheck(): AstroIntegration {
  return {
    name: "recipe-catalog-check",
    hooks: {
      "astro:build:start": () => checkRecipeCatalog(),
    },
  };
}
