import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import playwrightConfig from "../playwright.config.mjs";
import { acquireCheckoutOperationLock } from "./checkout-operation-lock.mjs";
import { runCommand, runInterruptible } from "./command-lifecycle.mjs";
import { withPreview } from "./preview-server.mjs";

const checkoutRoot = fileURLToPath(new URL("../", import.meta.url));
process.chdir(checkoutRoot);

await runInterruptible(async (signal) => {
  const run = (script, env) =>
    runCommand("npm", ["run", script], {
      cwd: checkoutRoot,
      env,
      signal,
      label: script,
    });

  const lock = await acquireCheckoutOperationLock(checkoutRoot, {
    purpose: "site verification",
    inheritedToken: process.env.RECIPE_GRAMS_CHECKOUT_LOCK,
  });
  try {
    await run("check");
    await run("typecheck");
    await run("verify:catalog-source");
    await run("verify:pure");
    await rm("dist", { recursive: true, force: true });
    await run("build", { RECIPE_GRAMS_CHECKOUT_LOCK: lock.token });
    await run("verify:generated");
    await withPreview(async (baseUrl) => {
      console.log(`Checking this build at ${baseUrl}`);
      await run("verify:browser", { SITE_BASE_URL: baseUrl });
    });
    console.log(
      `Site verification passed. Artifacts: ${playwrightConfig.outputDir}/`,
    );
  } finally {
    await lock.release();
  }
});
