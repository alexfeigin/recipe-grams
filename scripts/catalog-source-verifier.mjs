import {
  collectCatalogDiagnostics,
  recipeCatalog,
} from "../src/lib/recipeCatalog.ts";
import { listLocalizedRecipeSources } from "../src/lib/recipeSources.ts";

export function verifyCatalogSource({
  root = process.cwd(),
  catalog = recipeCatalog,
  write = console.log,
  writeError = console.error,
} = {}) {
  try {
    const recipes = listLocalizedRecipeSources(root);
    const diagnostics = collectCatalogDiagnostics(recipes, catalog);

    for (const diagnostic of diagnostics) {
      const affected = diagnostic.language
        ? `${diagnostic.language}/${diagnostic.slug}`
        : diagnostic.slug;
      write(
        `[recipe catalog ${diagnostic.severity}] ${affected}: ${diagnostic.message}`,
      );
    }

    const errorCount = diagnostics.filter(
      ({ severity }) => severity === "error",
    ).length;
    const warningCount = diagnostics.length - errorCount;
    write(
      `Catalog source verification: ${errorCount} error(s), ${warningCount} warning(s), ${recipes.length} localized source(s).`,
    );

    return errorCount > 0 ? 1 : 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeError(`[recipe catalog error] Source verification failed: ${message}`);
    return 1;
  }
}
