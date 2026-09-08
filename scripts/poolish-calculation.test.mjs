import assert from "node:assert/strict";
import { test } from "node:test";
import { calculatePoolish } from "../src/lib/poolishCalculator.ts";

const defaults = {
  desiredDough: "1700",
  hydration: "0.7",
  poolishShare: "0.667",
  poolishHydration: "1",
  poolishYeast: "0.013",
  restYeast: "0",
  salt: "0.027",
  pizzaCount: "3",
};

const formulaFields = Object.keys(defaults).filter(
  (field) => field !== "pizzaCount",
);

function generic(overrides = {}) {
  return calculatePoolish("generic", { ...defaults, ...overrides });
}

function pizza(pizzaCount) {
  return calculatePoolish("pizza", { ...defaults, pizzaCount });
}

function expectResult(calculation, expected, message) {
  assert.equal(calculation.ok, true, `${message}: ${calculation.error ?? ""}`);
  assert.deepEqual(calculation.result, expected, message);
}

function expectError(calculation, error, message) {
  assert.deepEqual(
    calculation.ok ? { ok: true, result: calculation.result } : calculation,
    { ok: false, error },
    message,
  );
}

test("keeps the default quantities", () => {
  expectResult(
    generic(),
    {
      targetDough: 1700,
      totalFlour: 1000,
      totalWater: 700,
      poolishFlour: 667,
      poolishWater: 667,
      poolishYeast: 9,
      restFlour: 333,
      restWater: 33,
      restYeast: 0,
      salt: 27,
    },
    "defaults",
  );
});

test("keeps the pizza preset quantities", () => {
  expectResult(
    pizza("3"),
    {
      targetDough: 850,
      totalFlour: 500,
      totalWater: 350,
      poolishFlour: 333,
      poolishWater: 333,
      poolishYeast: 4,
      restFlour: 167,
      restWater: 17,
      restYeast: 0,
      salt: 13.5,
    },
    "three pizzas",
  );
  // The 3g yeast floor reflects the minimum a kitchen scale can weigh.
  expectResult(
    pizza("1"),
    {
      targetDough: 283,
      totalFlour: 166,
      totalWater: 117,
      poolishFlour: 111,
      poolishWater: 111,
      poolishYeast: 3,
      restFlour: 55,
      restWater: 6,
      restYeast: 0,
      salt: 4.5,
    },
    "one pizza",
  );
});

test("keeps zero ratios and the minimum yeast", () => {
  const calculation = generic({ poolishYeast: "0", restYeast: "0", salt: "0" });
  assert.equal(calculation.ok, true);
  assert.equal(calculation.result.poolishYeast, 3);
  assert.equal(calculation.result.restYeast, 0);
  assert.equal(calculation.result.salt, 0);
});

test("rejects empty, nonfinite, negative, and overflowing fields", () => {
  for (const field of formulaFields) {
    for (const value of [
      "",
      " ",
      "NaN",
      "abc",
      "Infinity",
      "-Infinity",
      "1e309",
      "-0.01",
    ]) {
      expectError(
        generic({ [field]: value }),
        "invalidInputs",
        `${field}=${value}`,
      );
    }
  }
  expectError(generic({ desiredDough: "0" }), "invalidInputs", "no dough");
  expectError(generic({ poolishShare: "1.01" }), "invalidInputs", "over share");
  expectError(
    generic({ desiredDough: "1e308", salt: "1e308" }),
    "invalidInputs",
    "overflowing salt",
  );
});

test("rejects water splits the poolish cannot leave room for", () => {
  expectError(
    generic({ hydration: "0.5", poolishShare: "1" }),
    "invalidSplit",
    "poolish water exceeds the dough",
  );
  expectError(
    generic({ desiredDough: "1", hydration: "0.5", poolishShare: "0.5" }),
    "invalidSplit",
    "impossible rounded split",
  );
  assert.equal(generic({ poolishShare: "0.7" }).ok, true);
});

test("rejects pizza counts that are not whole batches", () => {
  for (const count of [
    "",
    " ",
    "0",
    "-1",
    "1.5",
    "NaN",
    "abc",
    "Infinity",
    "1e309",
    String(Number.MAX_SAFE_INTEGER + 2),
  ]) {
    expectError(pizza(count), "invalidPizzaCount", `pizzaCount=${count}`);
  }
});

test("ignores the formula fields while the pizza preset is selected", () => {
  const calculation = calculatePoolish("pizza", {
    ...Object.fromEntries(formulaFields.map((field) => [field, ""])),
    pizzaCount: "3",
  });
  assert.equal(calculation.ok, true);
  assert.equal(calculation.result.targetDough, 850);
});
