import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  checkoutRoot,
  filterContext,
  maintenanceRoute,
  readDeclaration,
  readProjectRoute,
} from "./dev-environment.mjs";

// Project wrapper for Impeccable's context loader, named in the installed
// SKILL.md. Maintenance never runs the loader; design work gets its context
// without directives that claim authority or authorize subagents.

const usage =
  "Usage: node scripts/impeccable-context.mjs --route <maintenance|design> " +
  "[--skill-dir <dir>] [--target <path>]";
const skillDirectories = [
  ".claude/skills/impeccable",
  ".agents/skills/impeccable",
];

function parse(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!["--route", "--skill-dir", "--target"].includes(flag))
      throw new Error(`Unknown argument "${flag}".`);
    if (value === undefined || value.startsWith("--"))
      throw new Error(`${flag} needs a value.`);
    options[flag.slice(2)] = value;
  }
  if (!["maintenance", "design"].includes(options.route))
    throw new Error("Choose --route maintenance or --route design.");
  return options;
}

function launcherFor(skillDirectory) {
  const candidates = skillDirectory
    ? [path.resolve(skillDirectory)]
    : skillDirectories.map((directory) => path.join(checkoutRoot, directory));
  const found = candidates
    .map((directory) => path.join(directory, "scripts", "impeccable"))
    .find((launcher) => existsSync(launcher));
  if (!found)
    throw new Error(
      "Impeccable is not installed here; run ./scripts/init.sh --check.",
    );
  return found;
}

let options;
try {
  options = parse(process.argv.slice(2));
} catch (error) {
  console.error(`${error.message}\n${usage}`);
  process.exit(2);
}

const route = readProjectRoute(checkoutRoot, readDeclaration(checkoutRoot));
if (options.route === "maintenance") {
  process.stdout.write(maintenanceRoute(route));
} else {
  let launcher;
  try {
    launcher = launcherFor(options["skill-dir"]);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
  const args = [
    "context",
    ...(options.target ? ["--target", options.target] : []),
  ];
  const result = spawnSync(launcher, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  if (result.status !== 0) {
    console.error(
      `Impeccable context loading failed (${result.error?.message ?? `exit ${result.status}`}).`,
    );
    process.exit(result.status || 1);
  }
  process.stdout.write(filterContext(result.stdout).text);
}
