import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { parse } from "parse5";

function elements(node) {
  return [
    ...(node.tagName ? [node] : []),
    ...(node.childNodes ?? []).flatMap(elements),
  ];
}

function listHtmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory()
      ? listHtmlFiles(target)
      : entry.name.endsWith(".html")
        ? [target]
        : [];
  });
}

const referenceAttributes = {
  a: ["href"],
  area: ["href"],
  link: ["href"],
  img: ["src"],
  script: ["src"],
  iframe: ["src"],
  source: ["src"],
  audio: ["src"],
  video: ["src", "poster"],
  object: ["data"],
};

export function verifyGeneratedLinks(
  directory,
  siteUrl = "https://alexfeigin.github.io/recipe-grams/",
) {
  const root = path.resolve(directory);
  const site = new URL(siteUrl);
  assert.ok(site.pathname.endsWith("/"), "Site URL must end with a slash");
  const documents = new Map();
  function readElements(file) {
    if (!documents.has(file)) {
      documents.set(file, elements(parse(readFileSync(file, "utf8"))));
    }
    return documents.get(file);
  }

  const pages = listHtmlFiles(root);
  assert.ok(pages.length > 0, `No generated HTML pages in ${root}`);
  let references = 0;
  for (const page of pages) {
    const pageName = path.relative(root, page).split(path.sep).join("/");
    const pageUrl = new URL(pageName.replace(/(^|\/)index\.html$/, "$1"), site);
    const nodes = readElements(page);
    const baseHref = nodes
      .find((node) => node.tagName === "base")
      ?.attrs.find((attr) => attr.name === "href")?.value;
    const base = baseHref === undefined ? pageUrl : new URL(baseHref, pageUrl);

    for (const node of nodes) {
      for (const { name, value } of node.attrs) {
        if (!referenceAttributes[node.tagName]?.includes(name)) continue;
        const context = `${pageName}: ${node.tagName}[${name}]="${value}"`;
        const url = new URL(value, base);
        if (url.origin !== site.origin) continue;
        assert.ok(
          url.pathname === site.pathname.slice(0, -1) ||
            url.pathname.startsWith(site.pathname),
          `${context} escapes the published base ${site.pathname}`,
        );

        const relative = decodeURIComponent(
          url.pathname.slice(site.pathname.length),
        );
        let target = path.resolve(root, relative);
        assert.ok(
          target === root || target.startsWith(`${root}${path.sep}`),
          `${context} escapes the build directory`,
        );
        if (statSync(target, { throwIfNoEntry: false })?.isDirectory()) {
          target = path.join(target, "index.html");
        }
        assert.ok(
          statSync(target, { throwIfNoEntry: false })?.isFile(),
          `${context} resolves to missing ${path.relative(root, target)}`,
        );
        references++;

        // HTML/SVG fragments name elements. Other assets (e.g. PDF #page=2)
        // have format-specific fragment semantics; their file is checked above.
        const fragment = decodeURIComponent(url.hash.slice(1).split(":~:")[0]);
        if (!fragment || !/\.(html|svg)$/i.test(target)) continue;
        if (fragment.toLowerCase() === "top" && /\.html$/i.test(target))
          continue;
        assert.ok(
          readElements(target).some((element) =>
            element.attrs.some(
              (attr) =>
                (attr.name === "id" ||
                  (element.tagName === "a" && attr.name === "name")) &&
                attr.value === fragment,
            ),
          ),
          `${context} resolves to missing fragment #${fragment} in ${path.relative(root, target)}`,
        );
      }
    }
  }
  return { pages: pages.length, references };
}
