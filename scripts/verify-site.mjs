import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { withPreview } from "./preview-server.mjs";

process.chdir(fileURLToPath(new URL("../", import.meta.url)));
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

try {
  await run("check");
  await run("typecheck");
  // Arithmetic, catalog and link fixtures need no build, so a failure in them
  // stops the run before it spends a build and a browser on it (ADR 0033).
  await run("verify:pure");
  // Remove stale routes and index fragments before producing the tested build.
  await rm("dist", { recursive: true, force: true });
  await run("build");
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
  process.removeListener("SIGINT", interrupt);
  process.removeListener("SIGTERM", interrupt);
}
