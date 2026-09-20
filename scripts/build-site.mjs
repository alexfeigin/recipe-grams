import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { acquireCheckoutOperationLock } from "./checkout-operation-lock.mjs";

const checkoutRoot = fileURLToPath(new URL("../", import.meta.url));
const controller = new AbortController();
const interrupt = () => controller.abort();
process.once("SIGINT", interrupt);
process.once("SIGTERM", interrupt);

function run(command, args) {
  controller.signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: checkoutRoot,
      stdio: "inherit",
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
      else reject(new Error(`${command} failed (${signal ?? code})`));
    });
  });
}

let lock;
try {
  lock = await acquireCheckoutOperationLock(checkoutRoot, {
    purpose: "site build",
    inheritedToken: process.env.RECIPE_GRAMS_CHECKOUT_LOCK,
  });
  await run("astro", ["build"]);
  await run("pagefind", ["--site", "dist"]);
} catch (error) {
  console.error(error.message);
  process.exitCode = controller.signal.aborted ? 130 : 1;
} finally {
  await lock?.release();
  process.removeListener("SIGINT", interrupt);
  process.removeListener("SIGTERM", interrupt);
}
