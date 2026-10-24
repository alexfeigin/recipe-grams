import { fileURLToPath } from "node:url";
import config from "../astro.config.mjs";
import { verifyGeneratedMetadata } from "./generated-metadata.mjs";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const siteRoot = new URL(`${config.base.replace(/\/$/, "")}/`, config.site);
const { paired, unpaired } = verifyGeneratedMetadata(dist, siteRoot);

console.log(
  `Metadata passed: ${paired} paired and ${unpaired} unpaired pages.`,
);
