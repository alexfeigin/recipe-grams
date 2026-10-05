import { runInterruptible } from "./command-lifecycle.mjs";
import {
  formatInspection,
  inspectEnvironment,
  isReady,
} from "./dev-environment.mjs";
import {
  defaultTools,
  setupEnvironment,
  upgradeEnvironment,
} from "./dev-environment-setup.mjs";

// Invoked by ./scripts/init.sh after it has checked the host and Node.
const mode = process.argv[2];

if (mode === "check" || mode === "audit") {
  const inspection = inspectEnvironment({
    audit: mode === "audit",
  });
  console.log(formatInspection(inspection));
  process.exitCode = isReady(inspection) ? 0 : 1;
} else if (mode === "setup" || mode === "upgrade") {
  await runInterruptible(async (signal) => {
    const run = mode === "setup" ? setupEnvironment : upgradeEnvironment;
    try {
      if (!(await run({ tools: defaultTools(signal) }))) process.exitCode = 1;
    } catch (error) {
      if (/^(Upgrade|Setup) (failed|stopped):/.test(error.message)) throw error;
      const action = mode === "upgrade" ? "Upgrade" : "Setup";
      throw new Error(`${action} failed: ${error.message}`, { cause: error });
    }
  });
} else {
  console.error("Usage: ./scripts/init.sh [--check | --audit | --upgrade]");
  process.exitCode = 2;
}
