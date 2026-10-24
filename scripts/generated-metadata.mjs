import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "parse5";

export function verifyGeneratedMetadata(directory, siteRoot) {
  const pages = readdirSync(directory, { recursive: true })
    .filter((file) => /(^|\/)index\.html$/.test(file))
    .map((file) => file.replace(/index\.html$/, ""));
  const calculatorRoutes = new Set(["en/poolish/", "he/poolish/"]);
  for (const route of ["", "he/", ...calculatorRoutes]) {
    assert.ok(pages.includes(route), `Missing metadata page: ${route || "/"}`);
  }

  function counterpart(route) {
    if (route === "") return "he/";
    if (route === "he/") return "";
    const [language, ...rest] = route.split("/");
    assert.ok(
      ["en", "he"].includes(language),
      `Unknown page language: ${route}`,
    );
    const other = language === "en" ? "he" : "en";
    const candidate = [other, ...rest].join("/");
    return pages.includes(candidate) ? candidate : undefined;
  }

  let paired = 0;
  let unpaired = 0;
  for (const route of pages) {
    const document = parse(
      readFileSync(join(directory, route, "index.html"), "utf8"),
    );
    const head = document.childNodes
      .find((node) => node.tagName === "html")
      ?.childNodes.find((node) => node.tagName === "head");
    const elements = (head?.childNodes ?? [])
      .filter((node) => node.tagName)
      .map((node) => ({
        tag: node.tagName,
        attributes: Object.fromEntries(
          node.attrs.map(({ name, value }) => [name, value]),
        ),
      }));
    const links = (rel) =>
      elements
        .filter(
          ({ tag, attributes }) =>
            tag === "link" && attributes.rel?.split(/\s+/).includes(rel),
        )
        .map(({ attributes }) => attributes);
    const self = new URL(route, siteRoot).href;
    const language = route.startsWith("he/") ? "he" : "en";
    const other = language === "en" ? "he" : "en";
    const pairRoute = counterpart(route);
    const alternates = links("alternate").map(({ hreflang, href }) => ({
      hreflang,
      href,
    }));

    if (pairRoute === undefined) {
      unpaired++;
      assert.deepEqual(
        alternates,
        [],
        `${route} claims a counterpart it lacks`,
      );
    } else {
      paired++;
      assert.deepEqual(
        alternates.toSorted((a, b) => a.hreflang?.localeCompare(b.hreflang)),
        [
          { hreflang: language, href: self },
          { hreflang: other, href: new URL(pairRoute, siteRoot).href },
        ].toSorted((a, b) => a.hreflang.localeCompare(b.hreflang)),
        `${route} hreflang alternates`,
      );
    }

    const isCalculator = calculatorRoutes.has(route);
    const robots = elements
      .filter(
        ({ tag, attributes }) =>
          tag === "meta" && attributes.name?.toLowerCase() === "robots",
      )
      .map(({ attributes }) => attributes.content?.toLowerCase());
    assert.deepEqual(
      robots,
      isCalculator ? ["noindex"] : [],
      `${route || "/"} indexing policy`,
    );
    assert.deepEqual(
      links("canonical").map(({ href }) => href),
      isCalculator ? [] : [self],
      `${route || "/"} canonical`,
    );
  }

  const robots = readFileSync(join(directory, "robots.txt"), "utf8");
  assert.ok(
    robots
      .split(/\r?\n/)
      .some(
        (line) =>
          line.trim() ===
          `Sitemap: ${new URL("sitemap-index.xml", siteRoot).href}`,
      ),
    "robots.txt must point at the sitemap index",
  );
  return { paired, unpaired };
}
