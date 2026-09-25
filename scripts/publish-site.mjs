import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { acquireCheckoutOperationLock } from "./checkout-operation-lock.mjs";

// The default destination is a command-owned clone inside the active checkout.
const managedPagesDirectory = ".pages";
const managedCheckoutName = "alexfeigin.github.io";
const cloneStagingPrefix = ".clone-";
const cloneStagingMarker = ".recipe-grams-publish-site-staging";
const expectedDestinationRemote =
  "git@github.com:alexfeigin/alexfeigin.github.io.git";
const publishedSubtree = "recipe-grams";
const publishingBranch = "master";
const siteUrl = "https://alexfeigin.github.io/recipe-grams/";

function commandText(command, args) {
  return [command, ...args].join(" ");
}

export function runProcess(
  command,
  args,
  { cwd, env = process.env, inherit = false } = {},
) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: inherit ? "inherit" : ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    if (!inherit) {
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => (stdout += chunk));
      child.stderr.on("data", (chunk) => (stderr += chunk));
    }
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (code === 0) return resolve({ stdout, stderr });
      const detail = stderr.trim() || stdout.trim();
      reject(
        new Error(
          `${commandText(command, args)} failed (${signal ?? code})${detail ? `: ${detail}` : ""}`,
        ),
      );
    });
  });
}

async function git(root, args, options) {
  return runProcess("git", ["-C", root, ...args], options);
}

function cleanOutput(result) {
  return result.stdout.trim();
}

async function optionalGitOutput(root, args) {
  try {
    return cleanOutput(await git(root, args));
  } catch {
    return "";
  }
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return (
    relative !== "" &&
    !relative.startsWith(`..${path.sep}`) &&
    relative !== ".."
  );
}

function normalizeRemote(value, repositoryRoot) {
  const remote = value
    .trim()
    .replace(/\/+$/, "")
    .replace(/\.git$/, "");
  const scp = remote.match(/^(?:[^@]+@)?([^:]+):(.+)$/);
  if (scp && !remote.includes("://")) {
    return `${scp[1].toLowerCase()}/${scp[2].replace(/^\/+/, "")}`;
  }
  try {
    const url = new URL(remote);
    if (url.protocol !== "file:") {
      return `${url.hostname.toLowerCase()}/${url.pathname.replace(/^\/+/, "")}`;
    }
    return path.resolve(fileURLToPath(url));
  } catch {
    return path.resolve(repositoryRoot, remote);
  }
}

async function requireRepositoryRoot(candidate, label) {
  let resolved;
  try {
    resolved = await realpath(candidate);
  } catch (error) {
    throw new Error(
      `${label} does not exist or cannot be resolved: ${candidate}`,
      {
        cause: error,
      },
    );
  }
  let reported;
  try {
    reported = cleanOutput(
      await git(resolved, ["rev-parse", "--show-toplevel"], { cwd: resolved }),
    );
  } catch (error) {
    throw new Error(`${label} is not a Git repository root: ${resolved}`, {
      cause: error,
    });
  }
  if ((await realpath(reported)) !== resolved) {
    throw new Error(`${label} must be the Git repository root: ${resolved}`);
  }
  return resolved;
}

async function requireClean(root, label) {
  const status = cleanOutput(
    await git(root, ["status", "--porcelain=v1", "--untracked-files=all"]),
  );
  if (status) {
    throw new Error(`${label} has uncommitted or staged work:\n${status}`);
  }
}

async function sourceState(sourceRoot, { fetch = false } = {}) {
  await requireClean(sourceRoot, "Source checkout");
  let branch;
  try {
    branch = cleanOutput(
      await git(sourceRoot, ["symbolic-ref", "--quiet", "--short", "HEAD"]),
    );
  } catch (error) {
    throw new Error("Source checkout must be on a branch, not detached HEAD.", {
      cause: error,
    });
  }
  const remote = await optionalGitOutput(sourceRoot, [
    "config",
    "--get",
    `branch.${branch}.remote`,
  ]);
  const mergeRef = await optionalGitOutput(sourceRoot, [
    "config",
    "--get",
    `branch.${branch}.merge`,
  ]);
  if (!remote || !mergeRef || remote === ".") {
    throw new Error(
      `Source branch ${branch} must track a pushed remote branch before publication.`,
    );
  }
  if (fetch) {
    // Fetch the actual branch: a normal fetch can leave a deleted upstream cached.
    await git(sourceRoot, ["fetch", "--quiet", remote, mergeRef]);
    const fetched = cleanOutput(
      await git(sourceRoot, ["rev-parse", "FETCH_HEAD"]),
    );
    const head = cleanOutput(await git(sourceRoot, ["rev-parse", "HEAD"]));
    if (head !== fetched) {
      throw new Error(
        `Source branch ${branch} is not exactly at its upstream revision. Push committed source changes and resolve remote differences first.`,
      );
    }
  }
  let upstreamRevision;
  try {
    upstreamRevision = cleanOutput(
      await git(sourceRoot, ["rev-parse", "--verify", "@{upstream}"]),
    );
  } catch (error) {
    throw new Error(
      `Source branch ${branch} has no resolvable upstream. Push it before publication.`,
      { cause: error },
    );
  }
  const revision = cleanOutput(await git(sourceRoot, ["rev-parse", "HEAD"]));
  if (revision !== upstreamRevision) {
    throw new Error(
      `Source branch ${branch} is not exactly at its upstream revision. Push committed source changes and resolve remote differences first.`,
    );
  }
  return { branch, remote, revision };
}

export function managedDestinationPath(sourceRoot) {
  return path.join(sourceRoot, managedPagesDirectory, managedCheckoutName);
}

// Offer both GitHub transports for the expected repository, starting with the
// one the source checkout already uses. A local remote has only itself.
export function pagesCloneUrls(expectedRemote, sourceRemoteUrl = "") {
  const normalized = normalizeRemote(expectedRemote, process.cwd());
  if (path.isAbsolute(normalized)) return [expectedRemote];
  const separator = normalized.indexOf("/");
  const host = normalized.slice(0, separator);
  const repository = normalized.slice(separator + 1);
  const ssh = `git@${host}:${repository}.git`;
  const https = `https://${host}/${repository}.git`;
  return /^https?:\/\//i.test(sourceRemoteUrl.trim())
    ? [https, ssh]
    : [ssh, https];
}

async function lstatIfPresent(candidate) {
  try {
    return await lstat(candidate);
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

function requireRealDirectory(stats, candidate, label) {
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new Error(
      `${label} must be a real directory, not a file or symbolic link: ${candidate}. Move it aside, then retry to recreate it.`,
    );
  }
}

// Commit as the source repository's configured identity when the new clone has
// none of its own, without touching global Git configuration.
async function inheritCommitIdentity(sourceRoot, checkout) {
  for (const key of ["user.name", "user.email"]) {
    if (await optionalGitOutput(checkout, ["config", "--get", key])) continue;
    const value = await optionalGitOutput(sourceRoot, ["config", "--get", key]);
    if (value) await git(checkout, ["config", "--local", key, value]);
  }
}

async function cloneManagedDestination({
  sourceRoot,
  sourceRemoteUrl,
  expectedRemote,
  parent,
  checkout,
}) {
  const relative = path
    .relative(sourceRoot, checkout)
    .split(path.sep)
    .join("/");
  try {
    await git(sourceRoot, ["check-ignore", "--quiet", "--", `${relative}/`]);
  } catch (error) {
    throw new Error(
      `Source checkout does not ignore ${relative}/; publish from a revision whose .gitignore excludes ${managedPagesDirectory}/.`,
      { cause: error },
    );
  }
  try {
    await mkdir(parent);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  requireRealDirectory(await lstat(parent), parent, "Managed Pages directory");
  // The source lock excludes another publication, but ignored .pages/ may also
  // contain unrelated work. Remove only staging that this helper marked.
  for (const entry of await readdir(parent)) {
    if (entry.startsWith(cloneStagingPrefix)) {
      const candidate = path.join(parent, entry);
      const candidateStats = await lstatIfPresent(candidate);
      if (!candidateStats?.isDirectory() || candidateStats.isSymbolicLink()) {
        continue;
      }
      const marker = path.join(candidate, cloneStagingMarker);
      const markerStats = await lstatIfPresent(marker);
      if (
        markerStats?.isFile() &&
        !markerStats.isSymbolicLink() &&
        (await readFile(marker, "utf8")) ===
          "recipe-grams publish-site staging\n"
      ) {
        await rm(candidate, { recursive: true, force: true });
      }
    }
  }
  const staging = await mkdtemp(path.join(parent, cloneStagingPrefix));
  try {
    await writeFile(
      path.join(staging, cloneStagingMarker),
      "recipe-grams publish-site staging\n",
    );
    const cloned = path.join(staging, managedCheckoutName);
    const failures = [];
    let clonedUrl;
    for (const url of pagesCloneUrls(expectedRemote, sourceRemoteUrl)) {
      try {
        await runProcess(
          "git",
          [
            "clone",
            "--quiet",
            "--depth",
            "1",
            "--single-branch",
            "--branch",
            publishingBranch,
            "--",
            url,
            cloned,
          ],
          { env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } },
        );
        clonedUrl = url;
        break;
      } catch (error) {
        failures.push(error.message);
        await rm(cloned, { recursive: true, force: true });
      }
    }
    if (!clonedUrl) {
      throw new Error(
        `Could not clone the Pages repository; no managed checkout was created. Check GitHub access for ${expectedRemote}, then retry.\n${failures.join("\n")}`,
      );
    }
    await inheritCommitIdentity(sourceRoot, cloned);
    if (await lstatIfPresent(checkout)) {
      throw new Error(
        `Managed Pages checkout appeared during cloning: ${checkout}`,
      );
    }
    await rename(cloned, checkout);
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

// Reuse the managed checkout when present; otherwise create it. An existing
// occupant is never replaced, and later checks validate its repository state.
async function prepareManagedDestination({
  sourceRoot,
  sourceRemoteUrl,
  expectedRemote,
  log,
}) {
  const checkout = managedDestinationPath(sourceRoot);
  const parent = path.dirname(checkout);
  const parentStats = await lstatIfPresent(parent);
  if (parentStats) {
    requireRealDirectory(parentStats, parent, "Managed Pages directory");
    const checkoutStats = await lstatIfPresent(checkout);
    if (checkoutStats) {
      requireRealDirectory(checkoutStats, checkout, "Managed Pages checkout");
      return checkout;
    }
  }
  log(`Creating managed Pages checkout at ${checkout}...`);
  await cloneManagedDestination({
    sourceRoot,
    sourceRemoteUrl,
    expectedRemote,
    parent,
    checkout,
  });
  return checkout;
}

async function validatePublishedSubtree(destinationRoot) {
  const target = path.resolve(destinationRoot, publishedSubtree);
  if (!isInside(destinationRoot, target) || target === destinationRoot) {
    throw new Error(`Invalid published subtree: ${target}`);
  }
  try {
    const stats = await lstat(target);
    if (stats.isSymbolicLink() || !stats.isDirectory()) {
      throw new Error(
        `Published subtree must be a real directory when it exists: ${target}`,
      );
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const ignored = (
    await git(destinationRoot, [
      "ls-files",
      "--others",
      "--ignored",
      "--exclude-standard",
      "-z",
      "--",
      publishedSubtree,
    ])
  ).stdout
    .split("\0")
    .filter(Boolean);
  if (ignored.length) {
    throw new Error(
      `Published subtree contains ignored local work; move or account for it before publication:\n${ignored.join("\n")}`,
    );
  }
  return target;
}

async function destinationState(
  destinationRoot,
  expectedRemote,
  { requireSynchronized = false } = {},
) {
  const branch = await optionalGitOutput(destinationRoot, [
    "symbolic-ref",
    "--quiet",
    "--short",
    "HEAD",
  ]);
  if (branch !== publishingBranch) {
    throw new Error(
      `Destination must be on ${publishingBranch}; found ${branch || "detached HEAD"}.`,
    );
  }
  for (const direction of ["fetch", "push"]) {
    const urls = await optionalGitOutput(destinationRoot, [
      "remote",
      "get-url",
      ...(direction === "push" ? ["--push"] : []),
      "--all",
      "origin",
    ]);
    const remotes = urls.split("\n").filter(Boolean);
    if (
      !remotes.length ||
      remotes.some(
        (remote) =>
          normalizeRemote(remote, destinationRoot) !==
          normalizeRemote(expectedRemote, destinationRoot),
      )
    ) {
      throw new Error(
        `Destination origin ${direction} URL is ${urls || "missing"}; expected ${expectedRemote}.`,
      );
    }
  }
  const upstream = await optionalGitOutput(destinationRoot, [
    "rev-parse",
    "--abbrev-ref",
    "@{upstream}",
  ]);
  if (upstream !== `origin/${publishingBranch}`) {
    throw new Error(
      `Destination ${publishingBranch} must track origin/${publishingBranch}; found ${upstream || "no upstream"}.`,
    );
  }
  await requireClean(destinationRoot, "Destination checkout");
  await validatePublishedSubtree(destinationRoot);
  const revision = cleanOutput(
    await git(destinationRoot, ["rev-parse", "HEAD"]),
  );
  const upstreamRevision = cleanOutput(
    await git(destinationRoot, ["rev-parse", "@{upstream}"]),
  );
  if (requireSynchronized && revision !== upstreamRevision) {
    throw new Error(
      `Destination ${publishingBranch} is not exactly at origin/${publishingBranch}. Resolve local or remote commits before publication.`,
    );
  }
  return {
    branch,
    revision,
  };
}

// Another checkout may publish while this one verifies; never report or commit
// against a stale view of the remote.
async function requireRemoteUnchanged(destinationRoot, revision) {
  await git(destinationRoot, ["fetch", "--quiet", "origin", publishingBranch]);
  const remoteRevision = cleanOutput(
    await git(destinationRoot, ["rev-parse", "FETCH_HEAD"]),
  );
  if (remoteRevision !== revision) {
    throw new Error(
      `Destination origin/${publishingBranch} advanced from ${revision} to ${remoteRevision} during verification, probably through another publication; nothing was copied or committed. Rerun publication to verify against the new destination state.`,
    );
  }
}

async function changedDestinationPaths(destinationRoot) {
  const results = await Promise.all([
    git(destinationRoot, ["diff", "--name-only", "-z"]),
    git(destinationRoot, ["diff", "--cached", "--name-only", "-z"]),
    git(destinationRoot, ["ls-files", "--others", "--exclude-standard", "-z"]),
  ]);
  return new Set(
    results.flatMap(({ stdout }) => stdout.split("\0").filter(Boolean)),
  );
}

function pathsOutsidePublishedSubtree(paths) {
  return [...paths].filter(
    (entry) =>
      entry !== publishedSubtree && !entry.startsWith(`${publishedSubtree}/`),
  );
}

async function hashTreeEntry(hash, root, entryPath) {
  const relative = path.relative(root, entryPath).split(path.sep).join("/");
  const stats = await lstat(entryPath);
  if (stats.isSymbolicLink()) {
    throw new Error(
      `Generated output contains an unsupported symbolic link: ${relative}`,
    );
  }
  if (stats.isDirectory()) {
    hash.update(`d\0${relative}\0`);
    const entries = await readdir(entryPath);
    entries.sort();
    for (const entry of entries) {
      await hashTreeEntry(hash, root, path.join(entryPath, entry));
    }
    return;
  }
  if (!stats.isFile()) {
    throw new Error(
      `Generated output contains an unsupported file type: ${relative}`,
    );
  }
  hash.update(`f\0${relative}\0${stats.mode & 0o111}\0`);
  hash.update(await readFile(entryPath));
}

export async function digestTree(root) {
  const stats = await lstat(root);
  if (!stats.isDirectory() || stats.isSymbolicLink()) {
    throw new Error(`Expected a real output directory: ${root}`);
  }
  const hash = createHash("sha256");
  await hashTreeEntry(hash, root, root);
  return hash.digest("hex");
}

async function requireStagedOutput(destinationRoot, output) {
  const files = (
    await readdir(output, { recursive: true, withFileTypes: true })
  )
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name))
    .sort();
  const hashes = files.length
    ? cleanOutput(
        await git(destinationRoot, [
          "hash-object",
          "--no-filters",
          "--",
          ...files,
        ]),
      ).split("\n")
    : [];
  const expected = await Promise.all(
    files.map(async (file, index) => {
      const mode = (await lstat(file)).mode & 0o111 ? "100755" : "100644";
      const relative = path.relative(output, file).split(path.sep).join("/");
      return `${mode} ${hashes[index]} 0\t${publishedSubtree}/${relative}`;
    }),
  );
  const actual = (
    await git(destinationRoot, [
      "ls-files",
      "--stage",
      "-z",
      "--",
      publishedSubtree,
    ])
  ).stdout
    .split("\0")
    .filter(Boolean)
    .sort();
  expected.sort();
  if (
    actual.length !== expected.length ||
    actual.some((entry, index) => entry !== expected[index])
  ) {
    throw new Error(
      "Staged site does not exactly match the verified output. Check destination Git attributes, filters, and file modes; staged work remains available.",
    );
  }
}

export async function replacePublishedSubtree({
  sourceOutput,
  destinationRoot,
  targetSubtree,
}) {
  const gitDirectoryValue = cleanOutput(
    await git(destinationRoot, [
      "rev-parse",
      "--path-format=absolute",
      "--git-dir",
    ]),
  );
  const gitDirectory = path.resolve(destinationRoot, gitDirectoryValue);
  const temporaryRoot = await mkdtemp(path.join(gitDirectory, "publish-site-"));
  const prepared = path.join(temporaryRoot, "prepared");
  const previous = path.join(temporaryRoot, "previous");
  let movedPrevious = false;
  let preserveRecovery = false;
  try {
    await cp(sourceOutput, prepared, {
      recursive: true,
      preserveTimestamps: true,
      verbatimSymlinks: true,
    });
    try {
      await rename(targetSubtree, previous);
      movedPrevious = true;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    try {
      await rename(prepared, targetSubtree);
    } catch (error) {
      if (movedPrevious) {
        try {
          await rename(previous, targetSubtree);
        } catch (rollbackError) {
          preserveRecovery = true;
          throw new Error(
            `Could not install the prepared site or restore the previous subtree. Recovery files remain at ${temporaryRoot}.`,
            { cause: rollbackError },
          );
        }
      }
      throw error;
    }
  } finally {
    if (!preserveRecovery) {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  }
}

async function defaultVerify({ sourceRoot, lockToken }) {
  await runProcess("npm", ["run", "verify"], {
    cwd: sourceRoot,
    env: { ...process.env, RECIPE_GRAMS_CHECKOUT_LOCK: lockToken },
    inherit: true,
  });
}

async function resolveDestination({
  sourceRoot,
  sourceRemote,
  destination,
  expectedRemote,
  log,
}) {
  if (destination !== undefined) {
    return requireRepositoryRoot(destination, "Destination checkout");
  }
  const checkout = await prepareManagedDestination({
    sourceRoot,
    sourceRemoteUrl: await optionalGitOutput(sourceRoot, [
      "remote",
      "get-url",
      sourceRemote,
    ]),
    expectedRemote,
    log,
  });
  try {
    return await requireRepositoryRoot(checkout, "Managed Pages checkout");
  } catch (error) {
    throw new Error(
      `${error.message}\nIt is not a complete Pages checkout. Move it aside, then retry to recreate it.`,
      { cause: error.cause },
    );
  }
}

export async function publishSite({
  sourceRoot,
  destination,
  message,
  expectedRemote = expectedDestinationRemote,
  verify = defaultVerify,
  copy = replacePublishedSubtree,
  log = console.log,
}) {
  if (!message?.trim())
    throw new Error("Publication requires a non-empty --message.");
  const resolvedSource = await requireRepositoryRoot(
    sourceRoot,
    "Source checkout",
  );
  const output = path.resolve(resolvedSource, "dist");
  if (!isInside(resolvedSource, output)) {
    throw new Error(`Invalid generated output path: ${output}`);
  }
  // Hold the source lock before inspecting or creating the managed checkout.
  const lock = await acquireCheckoutOperationLock(resolvedSource, {
    purpose: "site publication",
  });

  let destinationLock;
  try {
    const initialSource = await sourceState(resolvedSource, { fetch: true });
    const resolvedDestination = await resolveDestination({
      sourceRoot: resolvedSource,
      sourceRemote: initialSource.remote,
      destination,
      expectedRemote,
      log,
    });
    // Only the managed checkout may be nested inside the source checkout.
    if (
      resolvedSource === resolvedDestination ||
      isInside(resolvedDestination, resolvedSource) ||
      (isInside(resolvedSource, resolvedDestination) &&
        resolvedDestination !== managedDestinationPath(resolvedSource))
    ) {
      throw new Error(
        "Source and destination repositories must be separate paths.",
      );
    }
    const target = await validatePublishedSubtree(resolvedDestination);
    const gitDirectory = cleanOutput(
      await git(resolvedDestination, [
        "rev-parse",
        "--path-format=absolute",
        "--git-dir",
      ]),
    );
    destinationLock = await acquireCheckoutOperationLock(resolvedDestination, {
      purpose: "destination publication",
      lockDirectory: gitDirectory,
    });
    await destinationState(resolvedDestination, expectedRemote);
    try {
      await git(resolvedDestination, [
        "pull",
        "--ff-only",
        "origin",
        publishingBranch,
      ]);
    } catch (error) {
      throw new Error(
        "Destination could not fast-forward from origin/master. Resolve its divergence without reset, rebase, stash, or force-push, then retry.",
        { cause: error },
      );
    }
    const synchronizedDestination = await destinationState(
      resolvedDestination,
      expectedRemote,
      { requireSynchronized: true },
    );

    log(`Verifying source revision ${initialSource.revision}...`);
    await verify({ sourceRoot: resolvedSource, lockToken: lock.token });

    const verifiedSource = await sourceState(resolvedSource);
    if (verifiedSource.revision !== initialSource.revision) {
      throw new Error(
        "Source revision changed during verification; nothing was copied.",
      );
    }
    const currentDestination = await destinationState(
      resolvedDestination,
      expectedRemote,
      { requireSynchronized: true },
    );
    if (currentDestination.revision !== synchronizedDestination.revision) {
      throw new Error(
        "Destination revision changed during verification; nothing was copied.",
      );
    }
    await requireRemoteUnchanged(
      resolvedDestination,
      synchronizedDestination.revision,
    );

    const outputDigest = await digestTree(output);
    await copy({
      sourceOutput: output,
      destinationRoot: resolvedDestination,
      targetSubtree: target,
    });
    if ((await digestTree(output)) !== outputDigest) {
      throw new Error(
        "Generated output changed while it was being copied; publication stopped.",
      );
    }
    if ((await digestTree(target)) !== outputDigest) {
      throw new Error(
        "Published subtree does not exactly match the verified output.",
      );
    }
    const finalSource = await sourceState(resolvedSource);
    if (finalSource.revision !== initialSource.revision) {
      throw new Error(
        "Source revision changed before publication commit; publication stopped.",
      );
    }

    const changedPaths = await changedDestinationPaths(resolvedDestination);
    const unexpectedChanges = pathsOutsidePublishedSubtree(changedPaths);
    if (unexpectedChanges.length) {
      throw new Error(
        `Destination gained changes outside ${publishedSubtree}/; refusing to stage or commit:\n${unexpectedChanges.join("\n")}`,
      );
    }

    await git(resolvedDestination, [
      "add",
      "--force",
      "--all",
      "--",
      publishedSubtree,
    ]);
    const staged = (
      await git(resolvedDestination, ["diff", "--cached", "--name-only", "-z"])
    ).stdout
      .split("\0")
      .filter(Boolean);
    const outside = pathsOutsidePublishedSubtree(staged);
    if (outside.length) {
      throw new Error(
        `Refusing to commit staged paths outside ${publishedSubtree}/:\n${outside.join("\n")}`,
      );
    }
    await requireStagedOutput(resolvedDestination, output);
    const stagedTree = cleanOutput(
      await git(resolvedDestination, ["write-tree"]),
    );

    log(`Source revision: ${initialSource.revision}`);
    log(`Destination: ${resolvedDestination} (${publishedSubtree}/)`);
    if (staged.length === 0) {
      await requireRemoteUnchanged(
        resolvedDestination,
        synchronizedDestination.revision,
      );
      log(
        "Publication result: published content already matches; no commit or push was needed.",
      );
      log(`Site: ${siteUrl}`);
      return { status: "unchanged", sourceRevision: initialSource.revision };
    }

    await git(resolvedDestination, ["commit", "-m", message]);
    const publicationRevision = cleanOutput(
      await git(resolvedDestination, ["rev-parse", "HEAD"]),
    );
    if (
      cleanOutput(
        await git(resolvedDestination, ["rev-parse", "HEAD^{tree}"]),
      ) !== stagedTree
    ) {
      throw new Error(
        "Publication commit differs from the verified staged tree (a commit hook may have changed it). The local commit was preserved; nothing was pushed.",
      );
    }
    await git(resolvedDestination, ["push", "origin", publishingBranch]);
    log(`Publication commit: ${publicationRevision}`);
    log(`Publication result: pushed origin/${publishingBranch}.`);
    log(`Site: ${siteUrl}`);
    return {
      status: "published",
      sourceRevision: initialSource.revision,
      publicationRevision,
    };
  } finally {
    try {
      await destinationLock?.release();
    } finally {
      await lock.release();
    }
  }
}

function usage() {
  return `Usage: npm run publish:site -- [--destination <checkout>] --message <message>

This performs a live publication after running the full verification gate.
Without --destination, it uses this checkout's ignored ${managedPagesDirectory}/${managedCheckoutName}/
clone of the Pages repository, creating it on first use. --destination names an
existing Pages checkout instead and is never created.`;
}

export function parseArguments(args) {
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === "--help" || argument === "-h") return { help: true };
    if (argument === "--destination" || argument === "--message") {
      const value = args[++index];
      if (!value) throw new Error(`${argument} requires a value.\n${usage()}`);
      options[argument.slice(2)] = value;
      continue;
    }
    if (argument.startsWith("--destination=")) {
      options.destination = argument.slice("--destination=".length);
      continue;
    }
    if (argument.startsWith("--message=")) {
      options.message = argument.slice("--message=".length);
      continue;
    }
    throw new Error(`Unknown argument: ${argument}\n${usage()}`);
  }
  return options;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) console.log(usage());
    else {
      await publishSite({
        sourceRoot: fileURLToPath(new URL("../", import.meta.url)),
        ...options,
      });
    }
  } catch (error) {
    console.error(`Publication failed: ${error.message}`);
    if (error.cause?.message) console.error(`Cause: ${error.cause.message}`);
    process.exitCode = 1;
  }
}
