import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
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

test("rejects an unexpected effective push destination before verification", async (t) => {
  const repositories = await setupRepositories(t);
  await git(
    repositories.destination,
    "config",
    "remote.origin.pushurl",
    repositories.sourceRemote,
  );
  let verified = false;
  await assert.rejects(
    publishSite(
      publicationOptions(repositories, {
        verify: async () => {
          verified = true;
        },
      }),
    ),
    /Destination .*push.*expected/,
  );
  assert.equal(verified, false);
});

test("preserves ignored local work inside the published subtree", async (t) => {
  const repositories = await setupRepositories(t);
  await writeFile(
    path.join(repositories.destination, ".git", "info", "exclude"),
    "recipe-grams/local.txt\n",
  );
  await writeFile(
    path.join(repositories.destination, "recipe-grams", "local.txt"),
    "keep my work\n",
  );
  await assert.rejects(
    publishSite(publicationOptions(repositories)),
    /ignored.*recipe-grams\/local.txt/s,
  );
  assert.equal(
    await readFile(
      path.join(repositories.destination, "recipe-grams", "local.txt"),
      "utf8",
    ),
    "keep my work\n",
  );
});

test("includes verified output even when destination ignore rules match it", async (t) => {
  const repositories = await setupRepositories(t);
  await writeFile(
    path.join(repositories.destination, ".git", "info", "exclude"),
    "recipe-grams/new.html\n",
  );
  await publishSite(
    publicationOptions(repositories, {
      verify: async ({ sourceRoot }) => {
        await mkdir(path.join(sourceRoot, "dist"));
        await writeFile(
          path.join(sourceRoot, "dist", "new.html"),
          "verified\n",
        );
      },
    }),
  );
  assert.equal(
    (
      await git(
        repositories.destinationRemote,
        "show",
        "master:recipe-grams/new.html",
      )
    ).stdout,
    "verified\n",
  );
});

test("rejects Git filters that change the verified bytes during staging", async (t) => {
  const repositories = await setupRepositories(t, { published: "OLD\n" });
  await writeFile(
    path.join(repositories.destination, ".gitattributes"),
    "recipe-grams/index.html filter=alter\n",
  );
  await commitAll(repositories.destination, "Configure publication attributes");
  await git(repositories.destination, "push");
  await git(
    repositories.destination,
    "config",
    "filter.alter.clean",
    "tr a-z A-Z",
  );
  const initial = (
    await git(repositories.destinationRemote, "rev-parse", "master")
  ).stdout.trim();
  await assert.rejects(
    publishSite(publicationOptions(repositories)),
    /Staged site does not exactly match/,
  );
  assert.equal(
    (
      await git(repositories.destinationRemote, "rev-parse", "master")
    ).stdout.trim(),
    initial,
  );
});

test("publishes a linked source worktree with binary files and executable modes intact", async (t) => {
  const repositories = await setupRepositories(t);
  const worktree = path.join(repositories.base, "linked-source");
  await git(repositories.source, "worktree", "add", "-b", "release", worktree);
  await git(worktree, "push", "--set-upstream", "origin", "release");
  await mkdir(path.join(repositories.source, "dist"));
  await writeFile(
    path.join(repositories.source, "dist", "index.html"),
    "primary checkout\n",
  );
  const binary = Buffer.from([0, 255, 128, 10]);
  const result = await publishSite(
    publicationOptions(repositories, {
      sourceRoot: worktree,
      verify: async ({ sourceRoot }) => {
        assert.equal(sourceRoot, await realpath(worktree));
        await mkdir(path.join(sourceRoot, "dist", "nested"), {
          recursive: true,
        });
        await writeFile(
          path.join(sourceRoot, "dist", "nested", "image.bin"),
          binary,
        );
        await writeFile(
          path.join(sourceRoot, "dist", "run me.sh"),
          "#!/bin/sh\nexit 0\n",
          { mode: 0o755 },
        );
      },
    }),
  );
  assert.equal(result.status, "published");
  assert.equal(
    await readFile(
      path.join(repositories.source, "dist", "index.html"),
      "utf8",
    ),
    "primary checkout\n",
  );
  const committed = await exec(
    "git",
    [
      "-C",
      repositories.destinationRemote,
      "show",
      "master:recipe-grams/nested/image.bin",
    ],
    { encoding: "buffer" },
  );
  assert.deepEqual(committed.stdout, binary);
  assert.match(
    (
      await git(
        repositories.destinationRemote,
        "ls-tree",
        "master",
        "recipe-grams/run me.sh",
      )
    ).stdout,
    /^100755 blob/,
  );
});

test("does not push output changed by a commit hook", async (t) => {
  const repositories = await setupRepositories(t);
  const hook = path.join(
    repositories.destination,
    ".git",
    "hooks",
    "pre-commit",
  );
  await writeFile(
    hook,
    "#!/bin/sh\nprintf 'hook changed output\\n' > recipe-grams/index.html\ngit add recipe-grams/index.html\n",
  );
  await chmod(hook, 0o755);
  const initial = (
    await git(repositories.destinationRemote, "rev-parse", "master")
  ).stdout.trim();
  await assert.rejects(
    publishSite(publicationOptions(repositories)),
    /Publication commit differs from the verified staged tree/,
  );
  assert.equal(
    (
      await git(repositories.destinationRemote, "rev-parse", "master")
    ).stdout.trim(),
    initial,
  );
  assert.notEqual(
    (await git(repositories.destination, "rev-parse", "HEAD")).stdout.trim(),
    initial,
  );
});

test("rejects a deleted source upstream despite its cached tracking reference", async (t) => {
  const repositories = await setupRepositories(t);
  await git(repositories.sourceRemote, "update-ref", "-d", "refs/heads/master");
  let verified = false;
  await assert.rejects(
    publishSite(
      publicationOptions(repositories, {
        verify: async () => {
          verified = true;
        },
      }),
    ),
    /fetch .*failed/,
  );
  assert.equal(verified, false);
});

test("rejects a staged rename that deletes a file outside the site subtree", async (t) => {
  const repositories = await setupRepositories(t);
  const initial = (
    await git(repositories.destination, "rev-parse", "HEAD")
  ).stdout.trim();
  await assert.rejects(
    publishSite(
      publicationOptions(repositories, {
        verify: async ({ sourceRoot }) => {
          await mkdir(path.join(sourceRoot, "dist"));
          await writeFile(
            path.join(sourceRoot, "dist", "index.html"),
            "preserve me\n",
          );
        },
        copy: async (options) => {
          await replacePublishedSubtree(options);
          await rename(
            path.join(repositories.destination, "unrelated.txt"),
            path.join(repositories.destination, "recipe-grams", "index.html"),
          );
          await git(repositories.destination, "add", "--all");
        },
      }),
    ),
    /outside recipe-grams\/.*unrelated.txt/s,
  );
  assert.equal(
    (await git(repositories.destination, "rev-parse", "HEAD")).stdout.trim(),
    initial,
  );
});

test("serializes publication from different source checkouts into one destination", async (t) => {
  const repositories = await setupRepositories(t);
  const otherSource = path.join(repositories.base, "other-source");
  await exec("git", ["clone", repositories.sourceRemote, otherSource]);
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  let started;
  const ready = new Promise((resolve) => {
    started = resolve;
  });
  const options = publicationOptions(repositories);
  const first = publishSite({
    ...options,
    verify: async (context) => {
      started();
      await held;
      await options.verify(context);
    },
  });
  await ready;
  try {
    await assert.rejects(
      publishSite({ ...options, sourceRoot: otherSource }),
      /Another .*owns this checkout/,
    );
  } finally {
    release();
    await first;
  }
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
