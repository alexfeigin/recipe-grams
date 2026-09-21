import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runCommand } from "./command-lifecycle.mjs";
import {
  browserSuites,
  parseFocusedSelection,
  runFocusedVerification,
} from "./focused-verification.mjs";

const checkoutRoot = fileURLToPath(new URL("../", import.meta.url));
const playwrightCommand = path.join(
  checkoutRoot,
  "node_modules",
  ".bin",
  "playwright",
);
const suiteNames = Object.keys(browserSuites).join(", ");

async function sandbox(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "focused-verification-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

function lockPath(root) {
  return path.join(root, ".astro", "checkout-operation.lock");
}

function recordingRunner(failures = {}) {
  const calls = [];
  return {
    calls,
    async run(command, args, options) {
      calls.push({ command, args, options });
      if (failures[command]) throw new Error(failures[command]);
    },
  };
}

function countingPreview(baseUrl = "http://127.0.0.1:4321/recipe-grams/") {
  const state = { baseUrl, started: 0, closed: 0 };
  return {
    state,
    async preview(check) {
      state.started += 1;
      try {
        return await check(baseUrl);
      } finally {
        state.closed += 1;
      }
    },
  };
}

function focusedRun(root, argv, overrides = {}) {
  return runFocusedVerification(argv, {
    checkoutRoot: root,
    inheritedLockToken: undefined,
    log: () => {},
    ...overrides,
  });
}

test("requires one suite from the allowlist and reports the choices", () => {
  assert.throws(() => parseFocusedSelection([]), /Choose a suite with --suite/);
  assert.throws(
    () => parseFocusedSelection(["--suite", "navigaton"]),
    new RegExp(`Unknown suite "navigaton"[\\s\\S]*${suiteNames}`),
  );
  assert.throws(
    () => parseFocusedSelection(["--suite", "constructor"]),
    /Unknown suite "constructor"/,
  );
});

test("rejects unknown arguments, missing values, and repeated flags", () => {
  assert.throws(
    () => parseFocusedSelection(["navigation"]),
    /Unknown argument "navigation"/,
  );
  assert.throws(
    () => parseFocusedSelection(["--suite", "navigation", "--headed"]),
    /Unknown argument "--headed"/,
  );
  assert.throws(
    () => parseFocusedSelection(["--suite"]),
    /--suite needs a value/,
  );
  assert.throws(
    () => parseFocusedSelection(["--suite", "navigation", "--grep"]),
    /--grep needs a value/,
  );
  assert.throws(
    () => parseFocusedSelection(["--suite", "navigation", "--grep", "--suite"]),
    /--grep needs a value/,
  );
  assert.throws(
    () => parseFocusedSelection(["--suite", "navigation", "--grep=  "]),
    /--grep needs a value/,
  );
  assert.throws(
    () => parseFocusedSelection(["--suite", "search", "--suite", "navigation"]),
    /Repeated --suite/,
  );
  assert.throws(
    () => parseFocusedSelection(["--suite", "navigation", "--grep", "opens ("]),
    /not a valid test name pattern/,
  );
});

test("keeps the selected suite and the filter text intact", () => {
  assert.deepEqual(parseFocusedSelection(["--suite", "navigation"]), {
    suite: "navigation",
    grep: undefined,
  });
  assert.deepEqual(
    parseFocusedSelection([
      "--suite",
      "navigation",
      "--grep",
      "keyboard opens",
    ]),
    { suite: "navigation", grep: "keyboard opens" },
  );
  assert.deepEqual(
    parseFocusedSelection(["--suite=pizza-links", "--grep=calculator stays"]),
    { suite: "pizza-links", grep: "calculator stays" },
  );
});

test("the allowlist matches the maintained per-suite browser commands", async () => {
  const { scripts } = JSON.parse(
    await readFile(path.join(checkoutRoot, "package.json"), "utf8"),
  );
  const perSuiteCommands = Object.entries(scripts)
    .map(([name, command]) => [/^verify:(.+):browser$/.exec(name), command])
    .filter(([match]) => match)
    .map(([match, command]) => [
      match[1],
      command.replace("playwright test ", ""),
    ]);

  assert.deepEqual(Object.fromEntries(perSuiteCommands), browserSuites);
  for (const spec of Object.values(browserSuites))
    assert.ok(existsSync(path.join(checkoutRoot, spec)), `missing ${spec}`);
});

test("rebuilds cleanly and runs only the selected suite against its own preview", async (t) => {
  const root = await sandbox(t);
  await mkdir(path.join(root, "dist"), { recursive: true });
  await writeFile(path.join(root, "dist", "stale.html"), "stale\n");
  const runner = recordingRunner();
  const preview = countingPreview();
  const messages = [];

  await focusedRun(
    root,
    ["--suite", "navigation", "--grep", "keyboard opens"],
    {
      run: runner.run,
      preview: preview.preview,
      log: (message) => messages.push(message),
    },
  );

  assert.equal(existsSync(path.join(root, "dist")), false);
  assert.deepEqual(
    runner.calls.map(({ command, args }) => [command, ...args]),
    [
      ["npm", "run", "build"],
      [
        "playwright",
        "test",
        browserSuites.navigation,
        "--grep",
        "keyboard opens",
      ],
    ],
  );
  assert.equal(
    runner.calls[1].options.env.SITE_BASE_URL,
    preview.state.baseUrl,
  );
  assert.ok(runner.calls[0].options.env.RECIPE_GRAMS_CHECKOUT_LOCK);
  assert.equal(preview.state.closed, 1);
  assert.equal(existsSync(lockPath(root)), false);
  assert.match(
    messages.at(-1),
    /Focused check passed: navigation\..*npm run verify/,
  );
});

test("omits the filter when no test name is requested", async (t) => {
  const root = await sandbox(t);
  const runner = recordingRunner();

  await focusedRun(root, ["--suite", "search-content"], {
    run: runner.run,
    preview: countingPreview().preview,
  });

  assert.deepEqual(runner.calls[1].args, [
    "test",
    browserSuites["search-content"],
  ]);
});

test("the owned preview URL overrides an inherited SITE_BASE_URL", async (t) => {
  const root = await sandbox(t);
  const child = path.join(root, "record.cjs");
  const record = path.join(root, "child.json");
  await writeFile(
    child,
    "require('node:fs').writeFileSync(process.argv[2], JSON.stringify({ target: process.env.SITE_BASE_URL, args: process.argv.slice(3) }));\n",
  );
  process.env.SITE_BASE_URL = "https://example.invalid/somewhere-else/";
  t.after(() => delete process.env.SITE_BASE_URL);

  await runCommand(
    process.execPath,
    [child, record, "--grep", "keyboard opens"],
    {
      cwd: root,
      env: { SITE_BASE_URL: "http://127.0.0.1:4321/recipe-grams/" },
    },
  );

  assert.deepEqual(JSON.parse(await readFile(record, "utf8")), {
    target: "http://127.0.0.1:4321/recipe-grams/",
    args: ["--grep", "keyboard opens"],
  });
});

test("a failed build starts no preview and runs no browser tests", async (t) => {
  const root = await sandbox(t);
  const runner = recordingRunner({ npm: "build failed (1)" });
  const preview = countingPreview();

  await assert.rejects(
    focusedRun(root, ["--suite", "calculator"], {
      run: runner.run,
      preview: preview.preview,
    }),
    /build failed \(1\)/,
  );

  assert.deepEqual(
    runner.calls.map(({ command }) => command),
    ["npm"],
  );
  assert.equal(preview.state.started, 0);
  assert.equal(existsSync(lockPath(root)), false);
});

test("a failing suite closes the preview and names the failure artifacts", async (t) => {
  const root = await sandbox(t);
  const runner = recordingRunner({ playwright: "contrast tests failed (1)" });
  const preview = countingPreview();

  await assert.rejects(
    focusedRun(root, ["--suite", "contrast"], {
      run: runner.run,
      preview: preview.preview,
    }),
    /contrast tests failed \(1\)\. Any failure screenshots and traces are in \.astro\/verification\/browser\//,
  );

  assert.equal(preview.state.closed, 1);
  assert.equal(existsSync(lockPath(root)), false);
});

test("a filter matching nothing fails instead of reporting success", () => {
  const result = spawnSync(
    playwrightCommand,
    ["test", browserSuites.navigation, "--grep", "no such scenario exists"],
    {
      cwd: checkoutRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        SITE_BASE_URL: "http://127.0.0.1:9/recipe-grams/",
      },
    },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /No tests found/);
});

test("interruption stops child work and closes the owned preview", async (t) => {
  const root = await sandbox(t);
  const child = path.join(root, "sleep.cjs");
  await writeFile(child, "setTimeout(() => {}, 60_000);\n");
  const controller = new AbortController();
  const preview = countingPreview();

  const run = async (command, args, options) => {
    if (command === "npm") return;
    setTimeout(() => controller.abort(), 100);
    await runCommand(process.execPath, [child], options);
  };

  await assert.rejects(
    focusedRun(root, ["--suite", "recipe-flows"], {
      run,
      preview: preview.preview,
      signal: controller.signal,
    }),
    (error) => {
      assert.match(error.message, /recipe-flows tests failed \(SIGTERM\)/);
      assert.doesNotMatch(error.message, /Failure screenshots/);
      return true;
    },
  );

  assert.equal(preview.state.closed, 1);
  assert.equal(existsSync(lockPath(root)), false);
});
