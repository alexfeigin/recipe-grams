import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import config from "../astro.config.mjs";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const siteRoot = new URL(`${config.base.replace(/\/$/, "")}/`, config.site);

const pages = readdirSync(dist, { recursive: true })
  .filter((file) => file.endsWith("index.html"))
  .map((file) => file.replace(/index\.html$/, ""));

function linkHrefs(html, rel, attribute) {
  return [...html.matchAll(/<link\b[^>]*>/g)]
    .map((match) => match[0])
    .filter((tag) => new RegExp(`\\brel="${rel}"`).test(tag))
    .map((tag) => ({
      key: tag.match(new RegExp(`\\b${attribute}="([^"]*)"`))?.[1],
      href: tag.match(/\bhref="([^"]*)"/)?.[1],
    }));
}

function counterpart(route) {
  if (route === "") return "he/";
  if (route === "he/") return "";
  const [language, ...rest] = route.split("/");
  const other = language === "en" ? "he" : "en";
  const candidate = [other, ...rest].join("/");
  return pages.includes(candidate) ? candidate : undefined;
}

let alternates = 0;
let unpaired = 0;
for (const route of pages) {
  const html = readFileSync(join(dist, route, "index.html"), "utf8");
  const self = new URL(route, siteRoot).href;
  const language = route.startsWith("he/") ? "he" : "en";
  const other = language === "en" ? "he" : "en";
  const pairRoute = counterpart(route);
  const found = linkHrefs(html, "alternate", "hreflang");
  const noindex = /<meta name="robots" content="noindex"/.test(html);
  const canonical = linkHrefs(html, "canonical", "rel");

  if (pairRoute === undefined) {
    unpaired += 1;
    assert.deepEqual(found, [], `${route} claims a counterpart it lacks`);
  } else {
    alternates += 1;
    assert.deepEqual(
      found,
      [
        { key: language, href: self },
        { key: other, href: new URL(pairRoute, siteRoot).href },
      ],
      `${route} hreflang alternates`,
    );
  }

  if (noindex) {
    assert.deepEqual(canonical, [], `${route} is noindex yet canonical`);
  } else {
    assert.deepEqual(
      canonical.map(({ href }) => href),
      [self],
      `${route} canonical`,
    );
  }
}
assert.ok(
  pages.includes("en/poolish/") &&
    /name="robots" content="noindex"/.test(
      readFileSync(join(dist, "en/poolish/index.html"), "utf8"),
    ),
  "Poolish calculator should stay noindex",
);

const robotsFile = join(dist, "robots.txt");
assert.ok(existsSync(robotsFile), "Missing robots.txt");
assert.match(
  readFileSync(robotsFile, "utf8"),
  new RegExp(
    `^Sitemap: ${new URL("sitemap-index.xml", siteRoot).href.replaceAll(".", "\\.")}$`,
    "m",
  ),
  "robots.txt must point at the sitemap index",
);

console.log(
  `Metadata passed: ${alternates} paired and ${unpaired} unpaired pages.`,
);
