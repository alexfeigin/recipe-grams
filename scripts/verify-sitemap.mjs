import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import config from "../astro.config.mjs";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const siteRoot = new URL(`${config.base.replace(/\/$/, "")}/`, config.site);

function locations(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

const index = readFileSync(join(dist, "sitemap-index.xml"), "utf8");
const sitemapUrls = locations(index);
assert.ok(sitemapUrls.length > 0, "Sitemap index has no sitemap files");

const pages = sitemapUrls.flatMap((sitemapUrl) => {
  assert.ok(sitemapUrl.startsWith(siteRoot.href), sitemapUrl);
  const filename = sitemapUrl.slice(siteRoot.href.length);
  assert.match(filename, /^sitemap-\d+\.xml$/);
  return locations(readFileSync(join(dist, filename), "utf8"));
});

const expectedPages = readdirSync(dist, { recursive: true })
  .filter((file) => file.endsWith(".html"))
  .filter((file) => file !== "google897e637a154db3cd.html")
  .map((file) => {
    const route = file === "index.html" ? "" : file.replace(/index\.html$/, "");
    return new URL(route, siteRoot).href;
  });

assert.equal(new Set(pages).size, pages.length, "Duplicate sitemap URLs");
assert.deepEqual(pages.toSorted(), expectedPages.toSorted());

console.log(`Sitemap covers ${pages.length} built pages.`);
