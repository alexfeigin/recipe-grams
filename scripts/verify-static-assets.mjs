import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const images = path.join(root, "public", "images");
const dist = path.join(root, "dist");

assert.ok(!existsSync(path.join(root, "images")), "Images have one source");

function imageFiles(directory, prefix = "") {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(prefix, entry.name);
    assert.ok(!entry.isSymbolicLink(), `${relative} must be a real asset`);
    return entry.isDirectory()
      ? imageFiles(path.join(directory, entry.name), relative)
      : [relative];
  });
}

const files = imageFiles(images);
assert.ok(files.length > 0, "Expected recipe images");

for (const file of files) {
  const source = readFileSync(path.join(images, file));
  assert.deepEqual(readFileSync(path.join(dist, "images", file)), source);
  assert.ok(
    !existsSync(path.join(dist, file)),
    `${file} should publish only under images/`,
  );
}

console.log(`${files.length} images publish only under images/.`);
