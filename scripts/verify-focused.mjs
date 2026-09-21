import { runInterruptible } from "./command-lifecycle.mjs";
import { runFocusedVerification } from "./focused-verification.mjs";

await runInterruptible((signal) =>
  runFocusedVerification(process.argv.slice(2), { signal }),
);
