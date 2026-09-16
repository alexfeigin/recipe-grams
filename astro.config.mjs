// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { cpSync, readdirSync } from "node:fs";

const images = new URL("./public/images/", import.meta.url);

/** @returns {import("astro").AstroIntegration} */
function legacyImageUrls() {
  return {
    name: "legacy-image-urls",
    hooks: {
      "astro:build:done": ({ dir }) => {
        for (const entry of readdirSync(images, { withFileTypes: true })) {
          cpSync(new URL(entry.name, images), new URL(entry.name, dir), {
            recursive: true,
          });
        }
      },
    },
  };
}

export default defineConfig({
  site: "https://alexfeigin.github.io",
  base: "/recipe-grams",
  output: "static",
  integrations: [
    legacyImageUrls(),
    sitemap({
      filter: (page) => !page.endsWith("/google897e637a154db3cd.html"),
    }),
  ],
});
