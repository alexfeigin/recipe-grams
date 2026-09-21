import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import playwrightConfig from "../playwright.config.mjs";
import { acquireCheckoutOperationLock } from "./checkout-operation-lock.mjs";
import { runCommand } from "./command-lifecycle.mjs";
import { withPreview } from "./preview-server.mjs";

export const browserSuites = {
  calculator: "scripts/verify-calculator-browser.spec.mjs",
  contrast: "scripts/verify-control-contrast-browser.spec.mjs",
  navigation: "scripts/verify-navigation-browser.spec.mjs",
  "pizza-links": "scripts/verify-pizza-links-browser.spec.mjs",
  "recipe-flows": "scripts/verify-recipe-flows-browser.spec.mjs",
  search: "scripts/verify-search-browser.spec.mjs",
  "search-content": "scripts/verify-search-content-browser.spec.mjs",
};

const usage = [
  "Usage: npm run verify:focused -- --suite <name> [--grep <test name>]",
  `Suites: ${Object.keys(browserSuites).join(", ")}`,
  "Development feedback only; finish the work with npm run verify.",
].join("\n");

const failureArtifacts = `${playwrightConfig.outputDir}/`;
const defaultCheckoutRoot = fileURLToPath(new URL("../", import.meta.url));
const valueFlags = new Set(["--suite", "--grep"]);

class UsageError extends Error {
  constructor(problem) {
    super(`${problem}\n${usage}`);
    this.name = "UsageError";
  }
}

export function parseFocusedSelection(argv) {
  const given = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const assignment = argument.indexOf("=");
    const flag = assignment === -1 ? argument : argument.slice(0, assignment);
    if (!valueFlags.has(flag))
      throw new UsageError(`Unknown argument "${argument}".`);
    if (given.has(flag)) throw new UsageError(`Repeated ${flag}.`);

    let value;
    if (assignment === -1) {
      value = argv[index + 1];
      if (value === undefined) throw new UsageError(`${flag} needs a value.`);
      if (value.startsWith("--"))
        throw new UsageError(
          `${flag} needs a value, but "${value}" reads as a flag. ` +
            `To match text starting with "--", write ${flag}="${value}".`,
        );
      index += 1;
    } else {
      value = argument.slice(assignment + 1);
    }
    if (!value.trim()) throw new UsageError(`${flag} needs a value.`);
    given.set(flag, value);
  }

  const suite = given.get("--suite");
  if (suite === undefined) throw new UsageError("Choose a suite with --suite.");
  if (!Object.hasOwn(browserSuites, suite))
    throw new UsageError(`Unknown suite "${suite}".`);

  const grep = given.get("--grep");
  if (grep !== undefined) {
    try {
      new RegExp(grep);
    } catch (error) {
      throw new UsageError(
        `--grep "${grep}" is not a valid test name pattern: ${error.message}`,
      );
    }
  }

  return { suite, grep };
}

export async function runFocusedVerification(
  argv,
  {
    checkoutRoot = defaultCheckoutRoot,
    signal,
    run = runCommand,
    preview = withPreview,
    inheritedLockToken = process.env.RECIPE_GRAMS_CHECKOUT_LOCK,
    log = console.log,
  } = {},
) {
  const { suite, grep } = parseFocusedSelection(argv);
  const lock = await acquireCheckoutOperationLock(checkoutRoot, {
    purpose: `focused ${suite} verification`,
    inheritedToken: inheritedLockToken,
  });

  try {
    await rm(path.join(checkoutRoot, "dist"), { recursive: true, force: true });
    await run("npm", ["run", "build"], {
      cwd: checkoutRoot,
      env: { RECIPE_GRAMS_CHECKOUT_LOCK: lock.token },
      signal,
      label: "build",
    });
    signal?.throwIfAborted();

    await preview(async (baseUrl) => {
      log(`Checking ${suite} at ${baseUrl}`);
      const filter = grep === undefined ? [] : ["--grep", grep];
      try {
        await run("playwright", ["test", browserSuites[suite], ...filter], {
          cwd: checkoutRoot,
          env: { SITE_BASE_URL: baseUrl },
          signal,
          label: `${suite} tests`,
        });
      } catch (error) {
        if (signal?.aborted) throw error;
        throw new Error(
          `${error.message}. Any failure screenshots and traces are in ${failureArtifacts}`,
          { cause: error },
        );
      }
    });
    signal?.throwIfAborted();

    log(
      `Focused check passed: ${suite}. This is development feedback, not the final gate; finish with npm run verify.`,
    );
  } finally {
    await lock.release();
  }
}
