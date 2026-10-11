import { fileURLToPath } from "node:url";
import { acquireCheckoutOperationLock } from "./checkout-operation-lock.mjs";
import { runCommand, runInterruptible } from "./command-lifecycle.mjs";

const checkoutRoot = fileURLToPath(new URL("../", import.meta.url));

await runInterruptible(async (signal) => {
  const lock = await acquireCheckoutOperationLock(checkoutRoot, {
    purpose: "site build",
    inheritedToken: process.env.RECIPE_GRAMS_CHECKOUT_LOCK,
  });
  try {
    await runCommand("astro", ["build"], { cwd: checkoutRoot, signal });
    // Pagefind otherwise builds one index per language and searches only the
    // page's own. A single index lets any page find recipes in either language;
    // English names it because Pagefind has no Hebrew stemmer to lose.
    await runCommand("pagefind", ["--site", "dist", "--force-language", "en"], {
      cwd: checkoutRoot,
      signal,
    });
  } finally {
    await lock.release();
  }
});
