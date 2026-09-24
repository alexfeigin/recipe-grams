import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  appendFile,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runCommand } from "./command-lifecycle.mjs";
import {
  agentSkillDirectories,
  applyProjectRoute,
  checkoutRoot,
  compareVersions,
  declarationFile,
  filterContext,
  formatInspection,
  hashTree,
  hostPlatform,
  impeccableHookFiles,
  inspectEnvironment,
  inspectImpeccableEntry,
  isAdaptedSkillFile,
  isReady,
  knownHostsFile,
  knowsGitHub,
  originUrl,
  parseGitHubRemote,
  readDeclaration,
  readProjectRoute,
  setupCommand,
  skillVersion,
  systemPaths,
  upgradeCommand,
} from "./dev-environment.mjs";

// Setup installs the pins in dev-environment.json and package-lock.json and
// never upgrades tools already on the Mac (Node, npm); only upgrade picks newer
// versions. Upgrade resolves newer
// upstream releases, proves them in staging, and only then records them.
// Installers always run in a temporary staging project, so a failed download
// or install never leaves a partial tree in the checkout.

export function defaultCacheDirectory(env = process.env) {
  return (
    env.RECIPE_GRAMS_CACHE ||
    path.join(os.homedir(), "Library", "Caches", "recipe-grams")
  );
}

export function defaultTools(signal, env = process.env) {
  return {
    run: (command, args, options = {}) =>
      runCommand(command, args, { stdin: "ignore", signal, ...options }),
    capture: (command, args, options = {}) =>
      spawnSync(command, args, { encoding: "utf8", ...options }),
    fetch: (url, options = {}) => fetch(url, { signal, ...options }),
    log: (message) => console.log(message),
    env,
    signal,
  };
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

function githubRepository(source) {
  const url = new URL(source);
  if (url.hostname !== "github.com")
    throw new Error(`${source} is not a GitHub repository.`);
  return url.pathname.replace(/^\/|\.git$|\/$/g, "");
}

async function request(tools, url) {
  const headers = {};
  const token = tools.env.GH_TOKEN || tools.env.GITHUB_TOKEN;
  if (new URL(url).hostname === "api.github.com") {
    headers.accept = "application/vnd.github+json";
    if (token) headers.authorization = `Bearer ${token}`;
  }
  const response = await tools.fetch(url, { headers, redirect: "follow" });
  if (!response.ok) {
    const error = new Error(
      `${url} returned ${response.status} ${response.statusText}.`,
    );
    error.status = response.status;
    throw error;
  }
  return response;
}

async function download(tools, url) {
  return Buffer.from(await (await request(tools, url)).arrayBuffer());
}

async function getJson(tools, url) {
  return (await request(tools, url)).json();
}

async function writeAtomically(file, content) {
  await mkdir(path.dirname(file), { recursive: true });
  const partial = `${file}.${process.pid}.part`;
  await writeFile(partial, content);
  await rename(partial, file);
}

async function withStaging(prefix, task) {
  const staging = await mkdtemp(path.join(os.tmpdir(), `${prefix}-`));
  try {
    return await task(staging);
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

// Files an installer wrote, grouped as whole skill directories or single files.
async function stagedEntries(staging) {
  const entries = new Set();
  for (const item of await readdir(staging, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (item.isDirectory()) continue;
    const relative = path
      .relative(staging, path.join(item.parentPath, item.name))
      .split(path.sep)
      .join("/");
    if (relative.startsWith(".git/") || relative === "skills-lock.json")
      continue;
    entries.add(/^(.*?\/skills\/[^/]+)\//.exec(relative)?.[1] ?? relative);
  }
  return [...entries].sort();
}

async function replaceEntries(root, staging, entries) {
  for (const entry of entries) {
    const target = path.join(root, entry);
    await rm(target, { recursive: true, force: true });
    await mkdir(path.dirname(target), { recursive: true });
    await cp(path.join(staging, entry), target, { recursive: true });
  }
}

function describeDifferences(expected, actual) {
  const names = new Set([...Object.keys(expected), ...Object.keys(actual)]);
  return [...names]
    .filter((name) => expected[name] !== actual[name])
    .map((name) =>
      !actual[name]
        ? `${name} was not installed`
        : !expected[name]
          ? `${name} is not declared`
          : `${name} has different contents`,
    )
    .join("; ");
}

// --- Impeccable -------------------------------------------------------------

function bundleCacheFile(cacheDirectory, version, digest) {
  return path.join(
    cacheDirectory,
    "impeccable",
    `universal-${version}-${digest.slice(0, 12)}.zip`,
  );
}

async function cachedImpeccableBundle(spec, cacheDirectory, tools) {
  const file = bundleCacheFile(
    cacheDirectory,
    spec.version,
    spec.bundle.sha256,
  );
  try {
    if (sha256(await readFile(file)) === spec.bundle.sha256) return file;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  tools.log(`Downloading Impeccable ${spec.version} from ${spec.bundle.url}`);
  const bundle = await download(tools, spec.bundle.url);
  const digest = sha256(bundle);
  if (digest !== spec.bundle.sha256)
    throw new Error(
      `The Impeccable ${spec.version} bundle has SHA-256 ${digest}, but ${declarationFile} pins ${spec.bundle.sha256}.`,
    );
  await writeAtomically(file, bundle);
  return file;
}

async function installImpeccableInto(staging, tools, spec, bundle) {
  await tools.run("git", ["init", "-q"], { cwd: staging });
  await tools.run(
    "npx",
    [
      "--yes",
      spec.installer,
      "install",
      "-y",
      `--providers=${spec.providers.join(",")}`,
      "--scope=project",
      "--no-hooks",
    ],
    {
      cwd: staging,
      env: { IMPECCABLE_BUNDLE_PATH: bundle, DO_NOT_TRACK: "1" },
      label: `${spec.installer} install`,
    },
  );
  await rm(path.join(staging, ".git"), { recursive: true, force: true });
  const entries = await stagedEntries(staging);
  const hooks = entries.filter((entry) => impeccableHookFiles.includes(entry));
  if (hooks.length)
    throw new Error(
      `${spec.installer} wrote hook manifests despite --no-hooks: ${hooks.join(", ")}.`,
    );
  if (!entries.some((entry) => /\/skills\/impeccable$/.test(entry)))
    throw new Error(`${spec.installer} installed no Impeccable skill.`);
  return entries;
}

async function adaptStagedImpeccable(staging, entries, route) {
  for (const entry of entries) {
    if (!isAdaptedSkillFile(entry, "SKILL.md")) continue;
    const file = path.join(staging, entry, "SKILL.md");
    await writeFile(
      file,
      applyProjectRoute(await readFile(file, "utf8"), route),
    );
  }
  const files = {};
  for (const entry of entries) {
    const inspected = inspectImpeccableEntry(staging, entry, route);
    if (
      inspected.adaptation !== "current" &&
      isAdaptedSkillFile(entry, "SKILL.md")
    )
      throw new Error(`The project route did not apply to ${entry}/SKILL.md.`);
    files[entry] = inspected.hash;
  }
  return files;
}

export async function installImpeccable({
  root,
  declaration,
  platform,
  tools,
  cacheDirectory,
}) {
  const spec = declaration.impeccable;
  const expected = spec.files[platform];
  const route = readProjectRoute(root, declaration);
  const bundle = await cachedImpeccableBundle(spec, cacheDirectory, tools);
  await withStaging("recipe-grams-impeccable", async (staging) => {
    const entries = await installImpeccableInto(staging, tools, spec, bundle);
    const files = await adaptStagedImpeccable(staging, entries, route);
    const differences = describeDifferences(expected, files);
    if (differences)
      throw new Error(
        `Impeccable ${spec.version} from the pinned bundle does not match ${declarationFile} (${differences}); the checkout was not changed.`,
      );
    await replaceEntries(root, staging, Object.keys(expected));
  });
  tools.log(`Installed Impeccable ${spec.version} with the project route.`);
}

// --- Matt Pocock skills -----------------------------------------------------

function assertManagedSkillName(name) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name) || name.startsWith("recipe-grams-"))
    throw new Error(`"${name}" cannot be managed as an external skill.`);
}

async function installSkillsInto(staging, tools, spec, revision, names) {
  names.forEach(assertManagedSkillName);
  await tools.run("git", ["init", "-q"], { cwd: staging });
  await tools.run(
    "npx",
    [
      "--yes",
      spec.installer,
      "add",
      `${spec.source}/tree/${revision}`,
      "--skill",
      ...names,
      "--agent",
      spec.agent,
      "--copy",
      "--yes",
    ],
    {
      cwd: staging,
      env: { DISABLE_TELEMETRY: "1", DO_NOT_TRACK: "1" },
      label: `${spec.installer} add`,
    },
  );
  const directory = agentSkillDirectories[spec.agent];
  let lock = {};
  try {
    lock = JSON.parse(
      await readFile(path.join(staging, "skills-lock.json"), "utf8"),
    ).skills;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const installed = {};
  for (const name of names) {
    const sha = hashTree(path.join(staging, directory, name));
    if (sha === null)
      throw new Error(
        `${spec.source} at ${revision} did not provide the skill "${name}".`,
      );
    const skillPath = lock[name]?.skillPath?.replace(/\/SKILL\.md$/, "");
    installed[name] = { path: skillPath ?? null, sha256: sha };
  }
  return { directory, installed };
}

export async function installMattpocockSkills({
  root,
  declaration,
  names,
  tools,
}) {
  const spec = declaration.mattpocockSkills;
  await withStaging("recipe-grams-skills", async (staging) => {
    const { directory, installed } = await installSkillsInto(
      staging,
      tools,
      spec,
      spec.revision,
      names,
    );
    const differences = names
      .filter((name) => installed[name].sha256 !== spec.skills[name].sha256)
      .join(", ");
    if (differences)
      throw new Error(
        `${spec.source} at ${spec.revision} does not match ${declarationFile} for ${differences}; the checkout was not changed.`,
      );
    await replaceEntries(
      root,
      staging,
      names.map((name) => `${directory}/${name}`),
    );
  });
  tools.log(`Installed ${names.length} mattpocock/skills (${spec.release}).`);
}

// --- GitHub access ----------------------------------------------------------

// Plain-language reasons, since the agent relays them to the person at the Mac.
export function explainGitHubFailure(output, repository) {
  if (/Permission denied \(publickey/.test(output))
    return (
      "This Mac cannot sign in to GitHub with an SSH key. That is a minimum " +
      "requirement for saving and sharing recipes: someone needs to create an " +
      "SSH key on this Mac and add it to the user's GitHub account " +
      "(https://github.com/settings/keys). Then run setup again."
    );
  const denied = /Permission to \S+ denied to ([\w-]+)/.exec(output);
  if (denied)
    return (
      `GitHub account ${denied[1]} cannot save changes to ${repository}. Push ` +
      `access is a minimum requirement: ask the repository owner to add ` +
      `${denied[1]} as a collaborator, then run setup again.`
    );
  if (/Repository not found/.test(output))
    return (
      `The GitHub account on this Mac cannot see ${repository}. Push access is ` +
      "a minimum requirement: ask the repository owner for access, then run " +
      "setup again."
    );
  return (
    `Could not reach GitHub to confirm access (${output.trim() || "no response"}). ` +
    "Check the internet connection and run setup again."
  );
}

// Confirms push access without pushing: GitHub only advertises refs to
// receive-pack for accounts that may write, and nothing is sent.
export async function ensureGitHubAccess({ root, declaration, tools }) {
  const { remote } = declaration.github;
  const { home } = systemPaths(declaration, tools.env);
  const url = originUrl(root, remote);
  const parsed = url && parseGitHubRemote(url);
  if (!parsed)
    throw new Error(
      `GitHub access: ${remote} ${url ? `is ${url}, not a GitHub repository` : "is not configured"}.`,
    );

  if (!knowsGitHub(home)) {
    const { ssh_keys: keys } = await getJson(
      tools,
      "https://api.github.com/meta",
    );
    const file = knownHostsFile(home);
    await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
    await appendFile(file, keys.map((key) => `github.com ${key}\n`).join(""), {
      mode: 0o600,
    });
    tools.log(`Added GitHub's published SSH host keys to ${file}.`);
  }

  const probe = tools.capture(
    "ssh",
    [
      "-o",
      "BatchMode=yes",
      "-o",
      "ConnectTimeout=20",
      "git@github.com",
      `git-receive-pack '${parsed.repository}.git'`,
    ],
    { input: "" },
  );
  if (probe.status !== 0)
    throw new Error(
      `GitHub access: ${explainGitHubFailure(
        `${probe.stderr ?? ""}${probe.error?.message ?? ""}`,
        parsed.repository,
      )}`,
    );

  if (!parsed.ssh) {
    await tools.run(
      "git",
      ["-C", root, "remote", "set-url", remote, parsed.sshUrl],
      { label: "git remote set-url" },
    );
    tools.log(`Switched ${remote} to ${parsed.sshUrl} so pushes use SSH.`);
  }
  tools.log(
    `GitHub access confirmed: this Mac can push to ${parsed.repository}.`,
  );
}

// --- Setup ------------------------------------------------------------------

function minimumMajor(range) {
  return /(\d+)\.\d+\.\d+/.exec(range)?.[1];
}

export async function setupEnvironment({
  root = checkoutRoot,
  tools,
  cacheDirectory = defaultCacheDirectory(tools.env),
  platform = hostPlatform(),
  inspect = (declaration) =>
    inspectEnvironment({ root, declaration, platform, env: tools.env }),
}) {
  const declaration = readDeclaration(root);
  let before = inspect(declaration);
  const report = () => {
    const after = inspect(declaration);
    tools.log(formatInspection(after));
    return isReady(after);
  };
  if (!before.supported) return report();

  const has = (component, statuses) =>
    before.required.some(
      (item) =>
        item.component === component &&
        (!statuses || statuses.includes(item.status)),
    );
  try {
    if (has("system"))
      throw new Error(
        "Apple's Command Line Tools or Homebrew are missing; run ./scripts/init.sh, which installs them first.",
      );
    if (before.required.length)
      await ensureGitHubAccess({ root, declaration, tools });
    if (has("npm"))
      throw new Error(
        `npm does not satisfy package.json engines. Setup does not upgrade tools already on this Mac; ${upgradeCommand} upgrades npm.`,
      );
    if (has("node"))
      throw new Error(
        `The selected Node does not satisfy package.json engines. Setup does not upgrade tools already on this Mac; ${upgradeCommand} upgrades Node.`,
      );
    if (has("dependencies")) {
      await tools.run("npm", ["ci"], { cwd: root, label: "npm ci" });
      // The lockfile may pin a different Playwright browser revision.
      before = inspect(declaration);
    }
    if (has("browsers"))
      await tools.run(
        path.join(root, "node_modules", ".bin", "playwright"),
        ["install", "chromium"],
        { cwd: root, label: "playwright install chromium" },
      );
    if (has("impeccable", ["undeclared"]))
      throw new Error(
        `${declarationFile} does not pin Impeccable for ${platform}; run ./scripts/init.sh --upgrade to resolve and record a version.`,
      );
    if (has("impeccable"))
      await installImpeccable({
        root,
        declaration,
        platform,
        tools,
        cacheDirectory,
      });
  } catch (error) {
    if (tools.signal?.aborted) throw error;
    tools.log(`Setup stopped: ${error.message}`);
    report();
    return false;
  }

  const names = before.optional
    .filter((item) => ["missing", "stale"].includes(item.status))
    .flatMap((item) => item.names);
  if (names.length)
    await installMattpocockSkills({ root, declaration, names, tools }).catch(
      (error) => {
        if (tools.signal?.aborted) throw error;
        tools.log(`Optional skills were not installed: ${error.message}`);
      },
    );
  return report();
}

// --- Upgrade ----------------------------------------------------------------

export async function resolveLatest(tools, declaration) {
  const impeccableRepository = githubRepository(declaration.impeccable.source);
  const releases = await getJson(
    tools,
    `https://api.github.com/repos/${impeccableRepository}/releases?per_page=100`,
  );
  const versions = releases
    .filter((release) => !release.draft && !release.prerelease)
    .map((release) => /^skill-v(\d+\.\d+\.\d+)$/.exec(release.tag_name)?.[1])
    .filter(Boolean)
    .sort(compareVersions);
  if (!versions.length)
    throw new Error(`${impeccableRepository} lists no skill-v* release.`);

  const skillsRepository = githubRepository(
    declaration.mattpocockSkills.source,
  );
  let release = null;
  try {
    release = (
      await getJson(
        tools,
        `https://api.github.com/repos/${skillsRepository}/releases/latest`,
      )
    ).tag_name;
  } catch (error) {
    if (error.status !== 404) throw error;
  }
  const ref =
    release ??
    (await getJson(tools, `https://api.github.com/repos/${skillsRepository}`))
      .default_branch;
  const revision = (
    await getJson(
      tools,
      `https://api.github.com/repos/${skillsRepository}/commits/${encodeURIComponent(ref)}`,
    )
  ).sha;

  const npmLatest = async (name) =>
    (await getJson(tools, `https://registry.npmjs.org/${name}/latest`)).version;
  return {
    impeccable: {
      version: versions.at(-1),
      installer: `impeccable@${await npmLatest("impeccable")}`,
    },
    mattpocockSkills: {
      release: release ?? ref,
      revision,
      installer: `skills@${await npmLatest("skills")}`,
    },
  };
}

async function contextProbe(tools, root, staging, entries) {
  const skill = entries.find((entry) =>
    /^\.claude\/skills\/impeccable$/.test(entry),
  );
  const launcher = path.join(
    staging,
    skill ?? entries[0],
    "scripts",
    "impeccable",
  );
  const result = tools.capture(launcher, ["context"], { cwd: root });
  if (result.status !== 0)
    throw new Error(
      `The new Impeccable context loader failed: ${result.stderr || result.error?.message}`,
    );
  const { withheld } = filterContext(result.stdout);
  const unreviewed = withheld.filter((item) =>
    /not reviewed/.test(item.reason),
  );
  if (unreviewed.length)
    throw new Error(
      `The new Impeccable context loader emits unreviewed directives (${unreviewed
        .map((item) => item.name)
        .join(
          ", ",
        )}); classify them in scripts/dev-environment.mjs before upgrading.`,
    );
}

async function upgradeImpeccable({
  root,
  declaration,
  latest,
  platform,
  tools,
  cacheDirectory,
}) {
  const spec = { ...declaration.impeccable, installer: latest.installer };
  const route = readProjectRoute(root, declaration);
  const repository = githubRepository(spec.source);

  // The installer's own download verifies Impeccable's release signature.
  return withStaging("recipe-grams-impeccable-signed", async (signed) => {
    const signedEntries = await installImpeccableInto(
      signed,
      tools,
      spec,
      undefined,
    );
    for (const entry of signedEntries.filter((item) =>
      isAdaptedSkillFile(item, "SKILL.md"),
    )) {
      const version = skillVersion(
        await readFile(path.join(signed, entry, "SKILL.md"), "utf8"),
      );
      if (version !== latest.version)
        throw new Error(
          `${spec.installer} installed Impeccable ${version}, but the newest skill release is ${latest.version}; retry later.`,
        );
    }

    // Pin the same release as a bundle, and prove it installs identically.
    const url = `https://github.com/${repository}/releases/download/skill-v${latest.version}/universal.zip`;
    const bundle = await download(tools, url);
    const signature = JSON.parse(
      (await download(tools, `${url}.sig.json`)).toString("utf8"),
    );
    const digest = sha256(bundle);
    if (signature.sha256 !== digest || signature.version !== latest.version)
      throw new Error(`${url} does not match its published signature record.`);
    const file = bundleCacheFile(cacheDirectory, latest.version, digest);
    await writeAtomically(file, bundle);

    return withStaging("recipe-grams-impeccable-pinned", async (pinned) => {
      const entries = await installImpeccableInto(pinned, tools, spec, file);
      const hashEntries = (base, list) =>
        Object.fromEntries(
          list.map((entry) => [entry, hashTree(path.join(base, entry))]),
        );
      const differences = describeDifferences(
        hashEntries(signed, signedEntries),
        hashEntries(pinned, entries),
      );
      if (differences)
        throw new Error(
          `The skill-v${latest.version} bundle installs differently from the signed install (${differences}).`,
        );
      const files = await adaptStagedImpeccable(pinned, entries, route);
      await contextProbe(tools, root, pinned, entries);
      return {
        ...spec,
        version: latest.version,
        bundle: { url, sha256: digest },
        files: { [platform]: files },
      };
    });
  });
}

async function upgradeMattpocockSkills({ declaration, latest, tools }) {
  const spec = { ...declaration.mattpocockSkills, installer: latest.installer };
  const names = Object.keys(spec.skills);
  return withStaging("recipe-grams-skills", async (staging) => {
    const { installed } = await installSkillsInto(
      staging,
      tools,
      spec,
      latest.revision,
      names,
    );
    return {
      ...spec,
      release: latest.release,
      revision: latest.revision,
      skills: installed,
    };
  });
}

// Matches Prettier's JSON output, which keeps short arrays of scalars on one
// line, without requiring dependencies to be installed before an upgrade.
export function formatDeclaration(declaration) {
  const text = JSON.stringify(declaration, null, 2);
  return `${text.replace(
    /\[\n(\s*)([^[\]{}]*?)\n\s*\]/g,
    (array, _, body, offset) => {
      const inline = `[${body.split(/,\n\s*/).join(", ")}]`;
      const column = offset - text.lastIndexOf("\n", offset) - 1;
      const rest = text.slice(offset + array.length).match(/^,?/)[0].length;
      return column + inline.length + rest <= 80 ? inline : array;
    },
  )}\n`;
}

async function upgradeNpm({ root, tools }) {
  const engines = JSON.parse(
    await readFile(path.join(root, "package.json"), "utf8"),
  ).engines;
  await tools.run(
    "npm",
    ["install", "--global", `npm@${minimumMajor(engines.npm)}`],
    { cwd: root, label: "npm upgrade" },
  );
}

export async function upgradeEnvironment({
  root = checkoutRoot,
  tools,
  cacheDirectory = defaultCacheDirectory(tools.env),
  platform = hostPlatform(),
  inspect = (declaration) =>
    inspectEnvironment({ root, declaration, platform, env: tools.env }),
  setup = () =>
    setupEnvironment({ root, tools, cacheDirectory, platform, inspect }),
}) {
  const declaration = readDeclaration(root);
  if (!declaration.platforms.includes(platform))
    throw new Error(
      `${platform} is not a supported host (${declaration.platforms.join(", ")}); nothing was changed.`,
    );
  // init.sh has already upgraded an old Node; npm is upgraded here.
  if (inspect(declaration).required.some((item) => item.component === "npm"))
    await upgradeNpm({ root, tools });

  const latest = await resolveLatest(tools, declaration);
  const impeccable = declaration.impeccable;
  const skills = declaration.mattpocockSkills;
  const impeccableCurrent =
    impeccable.version === latest.impeccable.version &&
    impeccable.installer === latest.impeccable.installer &&
    Object.keys(impeccable.files?.[platform] ?? {}).length > 0;
  const skillsCurrent =
    skills.revision === latest.mattpocockSkills.revision &&
    skills.installer === latest.mattpocockSkills.installer &&
    Object.values(skills.skills).every((pin) => pin?.sha256);
  const summary =
    `Impeccable ${latest.impeccable.version} (${latest.impeccable.installer}); ` +
    `mattpocock/skills ${latest.mattpocockSkills.release} ` +
    `(${latest.mattpocockSkills.revision.slice(0, 7)}, ${latest.mattpocockSkills.installer})`;

  if (impeccableCurrent && skillsCurrent) {
    tools.log(
      `Already at the newest upstream versions: ${summary}. Nothing was downloaded or reinstalled.`,
    );
    return setup();
  }

  tools.log(`Upgrading to ${summary}.`);
  const next = structuredClone(declaration);
  try {
    if (!impeccableCurrent)
      next.impeccable = await upgradeImpeccable({
        root,
        declaration,
        latest: latest.impeccable,
        platform,
        tools,
        cacheDirectory,
      });
    if (!skillsCurrent)
      next.mattpocockSkills = await upgradeMattpocockSkills({
        declaration,
        latest: latest.mattpocockSkills,
        tools,
      });
  } catch (error) {
    throw new Error(
      `Upgrade stopped: ${error.message}\n${declarationFile} and the installed skills are unchanged.`,
    );
  }

  await writeAtomically(
    path.join(root, declarationFile),
    formatDeclaration(next),
  );
  tools.log(`Recorded ${summary} in ${declarationFile}.`);

  const ready = await setup();
  if (ready) {
    const kept = new Set(Object.keys(next.impeccable.files[platform]));
    const obsolete = Object.keys(impeccable.files?.[platform] ?? {}).filter(
      (entry) => !kept.has(entry),
    );
    for (const entry of obsolete)
      await rm(path.join(root, entry), { recursive: true, force: true });
  } else {
    tools.log(
      `${declarationFile} records the new versions, but the environment is not ready. ` +
        `Retry with ${setupCommand}, or restore the previous pins with ` +
        `\`git checkout -- ${declarationFile}\` and run ${setupCommand}.`,
    );
  }
  return ready;
}
