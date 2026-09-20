import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { test } from "node:test";
import { publishSite, replacePublishedSubtree } from "./publish-site.mjs";

const exec = promisify(execFile);

async function git(root, ...args) {
  return exec("git", ["-C", root, ...args], { encoding: "utf8" });
}

async function initializeRepository(root) {
  await mkdir(root, { recursive: true });
  await git(root, "init", "--initial-branch=master");
  await git(root, "config", "user.name", "Recipe-Grams Test");
  await git(root, "config", "user.email", "recipe-grams@example.test");
}

async function commitAll(root, message) {
  await git(root, "add", "--all");
  await git(root, "commit", "-m", message);
}

async function setupRepositories(t, { published = "old\n" } = {}) {
  const base = await mkdtemp(path.join(os.tmpdir(), "publish-site-test-"));
  t.after(() => rm(base, { recursive: true, force: true }));
  const source = path.join(base, "source");
  const sourceRemote = path.join(base, "source-remote.git");
  const destination = path.join(base, "destination");
  const destinationRemote = path.join(base, "destination-remote.git");

  await exec("git", [
    "init",
    "--bare",
    "--initial-branch=master",
    sourceRemote,
  ]);
  await initializeRepository(source);
  await writeFile(path.join(source, ".gitignore"), ".astro/\ndist/\n");
  await writeFile(path.join(source, "source.txt"), "committed source\n");
  await commitAll(source, "Initial source");
  await git(source, "remote", "add", "origin", sourceRemote);
  await git(source, "push", "--set-upstream", "origin", "master");

  await exec("git", [
    "init",
    "--bare",
    "--initial-branch=master",
    destinationRemote,
  ]);
  await initializeRepository(destination);
  await mkdir(path.join(destination, "recipe-grams"));
  await writeFile(
    path.join(destination, "recipe-grams", "index.html"),
    published,
  );
  await writeFile(
    path.join(destination, "recipe-grams", "obsolete.txt"),
    "remove me\n",
  );
  await writeFile(path.join(destination, "unrelated.txt"), "preserve me\n");
  await commitAll(destination, "Initial publication");
  await git(destination, "remote", "add", "origin", destinationRemote);
  await git(destination, "push", "--set-upstream", "origin", "master");

  return { base, source, sourceRemote, destination, destinationRemote };
}

function publicationOptions(repositories, overrides = {}) {
  return {
    sourceRoot: repositories.source,
    destination: repositories.destination,
    expectedRemote: repositories.destinationRemote,
    message: "Publish test output",
    log: () => {},
    verify: async ({ sourceRoot }) => {
      await rm(path.join(sourceRoot, "dist"), { recursive: true, force: true });
      await mkdir(path.join(sourceRoot, "dist"));
      await writeFile(path.join(sourceRoot, "dist", "index.html"), "new\n");
    },
    ...overrides,
  };
}

test("publishes the verified active checkout and replaces only the site subtree", async (t) => {
  const repositories = await setupRepositories(t);
  const beforeUnrelated = await readFile(
    path.join(repositories.destination, "unrelated.txt"),
  );

  const result = await publishSite(publicationOptions(repositories));

  assert.equal(result.status, "published");
  assert.equal(
    await readFile(
      path.join(repositories.destination, "recipe-grams", "index.html"),
      "utf8",
    ),
    "new\n",
  );
  await assert.rejects(
    readFile(
      path.join(repositories.destination, "recipe-grams", "obsolete.txt"),
    ),
    { code: "ENOENT" },
  );
  assert.deepEqual(
    await readFile(path.join(repositories.destination, "unrelated.txt")),
    beforeUnrelated,
  );
  assert.equal(
    (await git(repositories.destination, "rev-parse", "HEAD")).stdout.trim(),
    (
      await git(repositories.destinationRemote, "rev-parse", "master")
    ).stdout.trim(),
  );
});

test("does not commit or push when published content already matches", async (t) => {
  const repositories = await setupRepositories(t, { published: "new\n" });
  await rm(path.join(repositories.destination, "recipe-grams", "obsolete.txt"));
  await commitAll(repositories.destination, "Remove obsolete output");
  await git(repositories.destination, "push");
  const before = (
    await git(repositories.destination, "rev-parse", "HEAD")
  ).stdout.trim();

  const result = await publishSite(publicationOptions(repositories));

  assert.equal(result.status, "unchanged");
  assert.equal(
    (await git(repositories.destination, "rev-parse", "HEAD")).stdout.trim(),
    before,
  );
});

test("rejects a destination with the wrong repository identity", async (t) => {
  const repositories = await setupRepositories(t);
  let verified = false;
  await assert.rejects(
    publishSite(
      publicationOptions(repositories, {
        expectedRemote: path.join(repositories.base, "not-the-remote.git"),
        verify: async () => (verified = true),
      }),
    ),
    /Destination origin .* expected/,
  );
  assert.equal(verified, false);
});

test("rejects a destination on the wrong branch", async (t) => {
  const repositories = await setupRepositories(t);
  await git(repositories.destination, "switch", "-c", "preview");
  await assert.rejects(
    publishSite(publicationOptions(repositories)),
    /Destination must be on master; found preview/,
  );
});

for (const staged of [false, true]) {
  test(`preserves ${staged ? "staged" : "unstaged"} destination work`, async (t) => {
    const repositories = await setupRepositories(t);
    await writeFile(
      path.join(repositories.destination, "unrelated.txt"),
      "unfinished\n",
    );
    if (staged) await git(repositories.destination, "add", "unrelated.txt");

    await assert.rejects(
      publishSite(publicationOptions(repositories)),
      /Destination checkout has uncommitted or staged work/,
    );
    assert.equal(
      await readFile(
        path.join(repositories.destination, "unrelated.txt"),
        "utf8",
      ),
      "unfinished\n",
    );
  });
}

test("stops when the destination cannot fast-forward", async (t) => {
  const repositories = await setupRepositories(t);
  await writeFile(path.join(repositories.destination, "local.txt"), "local\n");
  await commitAll(repositories.destination, "Local destination commit");

  const other = path.join(repositories.base, "other-destination");
  await exec("git", ["clone", repositories.destinationRemote, other]);
  await git(other, "config", "user.name", "Recipe-Grams Test");
  await git(other, "config", "user.email", "recipe-grams@example.test");
  await writeFile(path.join(other, "remote.txt"), "remote\n");
  await commitAll(other, "Remote destination commit");
  await git(other, "push");

  await assert.rejects(
    publishSite(publicationOptions(repositories)),
    /could not fast-forward/,
  );
  assert.equal(
    await readFile(path.join(repositories.destination, "local.txt"), "utf8"),
    "local\n",
  );
});

test("requires clean, pushed source state", async (t) => {
  const repositories = await setupRepositories(t);
  await writeFile(path.join(repositories.source, "source.txt"), "dirty\n");
  await assert.rejects(
    publishSite(publicationOptions(repositories)),
    /Source checkout has uncommitted or staged work/,
  );

  await git(repositories.source, "restore", "source.txt");
  await writeFile(path.join(repositories.source, "source.txt"), "unpushed\n");
  await commitAll(repositories.source, "Unpushed source");
  await assert.rejects(
    publishSite(publicationOptions(repositories)),
    /not exactly at its upstream revision/,
  );
});

test("source changes during verification prevent copying", async (t) => {
  const repositories = await setupRepositories(t);
  await assert.rejects(
    publishSite(
      publicationOptions(repositories, {
        verify: async ({ sourceRoot }) => {
          await mkdir(path.join(sourceRoot, "dist"));
          await writeFile(path.join(sourceRoot, "dist", "index.html"), "new\n");
          await writeFile(path.join(sourceRoot, "source.txt"), "changed\n");
        },
      }),
    ),
    /Source checkout has uncommitted or staged work/,
  );
  assert.equal(
    await readFile(
      path.join(repositories.destination, "recipe-grams", "index.html"),
      "utf8",
    ),
    "old\n",
  );
});

test("overlapping publication cannot take ownership of one checkout", async (t) => {
  const repositories = await setupRepositories(t);
  let verificationStarted;
  const started = new Promise((resolve) => (verificationStarted = resolve));
  let finishVerification;
  const finish = new Promise((resolve) => (finishVerification = resolve));
  const first = publishSite(
    publicationOptions(repositories, {
      verify: async ({ sourceRoot }) => {
        verificationStarted();
        await finish;
        await mkdir(path.join(sourceRoot, "dist"));
        await writeFile(path.join(sourceRoot, "dist", "index.html"), "new\n");
      },
    }),
  );
  await started;

  await assert.rejects(
    publishSite(publicationOptions(repositories)),
    /Another verification or publication owns this checkout/,
  );
  finishVerification();
  assert.equal((await first).status, "published");
});

test("rejects staging outside the published subtree", async (t) => {
  const repositories = await setupRepositories(t);
  await assert.rejects(
    publishSite(
      publicationOptions(repositories, {
        copy: async (options) => {
          await replacePublishedSubtree(options);
          await writeFile(
            path.join(repositories.destination, "unrelated.txt"),
            "intruding change\n",
          );
          await git(repositories.destination, "add", "unrelated.txt");
        },
      }),
    ),
    /changes outside recipe-grams\/.*unrelated\.txt/s,
  );
  assert.match(
    (await git(repositories.destination, "status", "--short")).stdout,
    /unrelated\.txt/,
  );
});

test("verification and copy failures stop before commit", async (t) => {
  const repositories = await setupRepositories(t);
  const initial = (
    await git(repositories.destination, "rev-parse", "HEAD")
  ).stdout.trim();
  await assert.rejects(
    publishSite(
      publicationOptions(repositories, {
        verify: async () => {
          throw new Error("verification exploded");
        },
      }),
    ),
    /verification exploded/,
  );
  assert.equal(
    (await git(repositories.destination, "rev-parse", "HEAD")).stdout.trim(),
    initial,
  );

  await assert.rejects(
    publishSite(
      publicationOptions(repositories, {
        copy: async () => {
          throw new Error("copy exploded");
        },
      }),
    ),
    /copy exploded/,
  );
  assert.equal(
    (await git(repositories.destination, "rev-parse", "HEAD")).stdout.trim(),
    initial,
  );
});

test("a failed commit leaves recoverable staged site work", async (t) => {
  const repositories = await setupRepositories(t);
  const hook = path.join(
    repositories.destination,
    ".git",
    "hooks",
    "pre-commit",
  );
  await writeFile(hook, "#!/bin/sh\nexit 1\n");
  await chmod(hook, 0o755);

  await assert.rejects(
    publishSite(publicationOptions(repositories)),
    /git .* commit .* failed/,
  );
  assert.match(
    (await git(repositories.destination, "diff", "--cached", "--name-only"))
      .stdout,
    /recipe-grams\/index\.html/,
  );
});

test("a rejected push leaves the publication commit visible and does not retry", async (t) => {
  const repositories = await setupRepositories(t);
  const hook = path.join(
    repositories.destinationRemote,
    "hooks",
    "pre-receive",
  );
  await writeFile(hook, "#!/bin/sh\nexit 1\n");
  await chmod(hook, 0o755);
  const remoteBefore = (
    await git(repositories.destinationRemote, "rev-parse", "master")
  ).stdout.trim();

  await assert.rejects(
    publishSite(publicationOptions(repositories)),
    /git .* push .* failed/,
  );
  const localAfter = (
    await git(repositories.destination, "rev-parse", "HEAD")
  ).stdout.trim();
  assert.notEqual(localAfter, remoteBefore);
  assert.equal(
    (
      await git(repositories.destinationRemote, "rev-parse", "master")
    ).stdout.trim(),
    remoteBefore,
  );
});

test("rejects source/destination overlap and a symlinked published subtree", async (t) => {
  const repositories = await setupRepositories(t);
  await assert.rejects(
    publishSite(
      publicationOptions(repositories, { destination: repositories.source }),
    ),
    /Source and destination repositories must be separate paths/,
  );

  await rm(path.join(repositories.destination, "recipe-grams"), {
    recursive: true,
  });
  await symlink(
    "unrelated.txt",
    path.join(repositories.destination, "recipe-grams"),
  );
  await commitAll(repositories.destination, "Malformed subtree");
  await git(repositories.destination, "push");
  await assert.rejects(
    publishSite(publicationOptions(repositories)),
    /Published subtree must be a real directory/,
  );
});
