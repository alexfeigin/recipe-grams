import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const publicFile = fileURLToPath(
  new URL("../public/google897e637a154db3cd.html", import.meta.url),
);
const verificationFile = fileURLToPath(
  new URL("../dist/google897e637a154db3cd.html", import.meta.url),
);

const suppliedContent = Buffer.from(
  "google-site-verification: google897e637a154db3cd.html",
);
assert.deepEqual(readFileSync(publicFile), suppliedContent);
assert.deepEqual(readFileSync(verificationFile), suppliedContent);

console.log("Google Search Console verification file passed.");
