import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { acquireCheckoutOperationLock } from "./checkout-operation-lock.mjs";
import { withPreview } from "./preview-server.mjs";

const checkoutRoot = fileURLToPath(new URL("../", import.meta.url));
process.chdir(checkoutRoot);
const controller = new AbortController();
const interrupt = () => controller.abort();
process.once("SIGINT", interrupt);
process.once("SIGTERM", interrupt);

function run(script, extraEnv = {}) {
  controller.signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", script], {
      stdio: "inherit",
      env: { ...process.env, ...extraEnv },
      detached: process.platform !== "win32",
    });
    const stop = () => {
      if (!child.pid) return;
      try {
        if (process.platform === "win32") child.kill("SIGTERM");
        else process.kill(-child.pid, "SIGTERM");
      } catch (error) {
        if (error.code !== "ESRCH") throw error;
      }
    };
    controller.signal.addEventListener("abort", stop, { once: true });
    child.once("error", reject);
    child.once("close", (code, signal) => {
      controller.signal.removeEventListener("abort", stop);
      if (code === 0) resolve();
      else reject(new Error(`${script} failed (${signal ?? code})`));
    });
  });
}

let lock;
try {
  lock = await acquireCheckoutOperationLock(checkoutRoot, {
    purpose: "site verification",
    inheritedToken: process.env.RECIPE_GRAMS_CHECKOUT_LOCK,
  });
  await run("check");
  await run("typecheck");
  await run("verify:catalog-source");
  await run("verify:pure");
  await rm("dist", { recursive: true, force: true });
  await run("build", { RECIPE_GRAMS_CHECKOUT_LOCK: lock.token });
  await run("verify:generated");
  await run("test:preview");
  await withPreview(async (baseUrl) => {
    console.log(`Checking this build at ${baseUrl}`);
    await run("verify:browser", { SITE_BASE_URL: baseUrl });
  });
  console.log(
    "Site verification passed. Artifacts: .astro/verification/browser/",
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = controller.signal.aborted ? 130 : 1;
} finally {
  await lock?.release();
  process.removeListener("SIGINT", interrupt);
  process.removeListener("SIGTERM", interrupt);
}
