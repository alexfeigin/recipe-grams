import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import config from "../astro.config.mjs";

const robotsFile = fileURLToPath(
  new URL("../dist/robots.txt", import.meta.url),
);
const robots = readFileSync(robotsFile, "utf8");
const siteRoot = new URL(`${config.base.replace(/\/$/, "")}/`, config.site);
const sitemapUrl = new URL("sitemap-index.xml", siteRoot).href;

assert.match(robots, /^User-agent: \*$/m);
assert.match(robots, /^Allow: \/$/m);
assert.ok(robots.split(/\r?\n/).includes(`Sitemap: ${sitemapUrl}`));
assert.doesNotMatch(robots, /^Disallow:/m);

console.log("robots.txt points to the published sitemap.");
