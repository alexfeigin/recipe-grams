import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const verificationFile = fileURLToPath(
  new URL("../dist/google897e637a154db3cd.html", import.meta.url),
);

assert.equal(
  readFileSync(verificationFile, "utf8"),
  "google-site-verification: google897e637a154db3cd.html",
);

console.log("Google Search Console verification file passed.");
