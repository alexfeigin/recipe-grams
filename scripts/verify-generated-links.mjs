import { verifyGeneratedLinks } from "./generated-links.mjs";

const { pages, references } = verifyGeneratedLinks("dist");
console.log(
  `Generated links passed: ${references} local references across ${pages} pages.`,
);
