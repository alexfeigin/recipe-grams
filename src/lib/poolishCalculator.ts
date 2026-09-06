type Formula = {
  desiredDough: number;
  hydration: number;
  poolishShare: number;
  poolishHydration: number;
  poolishYeast: number;
  restYeast: number;
  salt: number;
};

export type CalculatorFields = Record<keyof Formula | "pizzaCount", string>;
export type CalculatorMode = "generic" | "pizza";
export type CalculatorError =
  "invalidInputs" | "invalidSplit" | "invalidPizzaCount";

function calculateRecipe(inputs: Formula) {
  // The target is flour plus water; salt and yeast are added to that base.
  const totalFlour = Math.round(inputs.desiredDough / (1 + inputs.hydration));
  const totalWater = Math.round(inputs.desiredDough - totalFlour);
  const poolishFlour = Math.round(totalFlour * inputs.poolishShare);
  const poolishWater = Math.round(poolishFlour * inputs.poolishHydration);
  const poolishYeast = Math.max(
    Math.round(poolishFlour * inputs.poolishYeast),
    3,
  );
  return {
    targetDough: inputs.desiredDough,
    totalFlour,
    totalWater,
    poolishFlour,
    poolishWater,
    poolishYeast,
    restFlour: Math.round(totalFlour - poolishFlour),
    restWater: Math.round(totalWater - poolishWater),
    restYeast: Math.round(totalFlour * inputs.restYeast),
    salt: Number((totalFlour * inputs.salt).toFixed(1)),
  };
}

export type CalculatorResult = ReturnType<typeof calculateRecipe>;
type Calculation =
  | { ok: true; result: CalculatorResult }
  | { ok: false; error: CalculatorError };

function parse(value: string): number {
  return value.trim() === "" ? Number.NaN : Number(value);
}

export function calculatePoolish(
  mode: CalculatorMode,
  fields: CalculatorFields,
): Calculation {
  let inputs: Formula;
  if (mode === "pizza") {
    const count = parse(fields.pizzaCount);
    if (!Number.isSafeInteger(count) || count < 1) {
      return { ok: false, error: "invalidPizzaCount" };
    }
    inputs = {
      desiredDough: Math.round((850 / 3) * count),
      hydration: 0.7,
      poolishShare: 2 / 3,
      poolishHydration: 1,
      poolishYeast: 0.013,
      restYeast: 0,
      salt: 0.027,
    };
  } else {
    inputs = {
      desiredDough: parse(fields.desiredDough),
      hydration: parse(fields.hydration),
      poolishShare: parse(fields.poolishShare),
      poolishHydration: parse(fields.poolishHydration),
      poolishYeast: parse(fields.poolishYeast),
      restYeast: parse(fields.restYeast),
      salt: parse(fields.salt),
    };
  }

  if (
    Object.values(inputs).some(
      (value) => !Number.isFinite(value) || value < 0,
    ) ||
    inputs.desiredDough < 1 ||
    inputs.poolishShare > 1
  ) {
    return { ok: false, error: "invalidInputs" };
  }
  if (inputs.poolishShare * inputs.poolishHydration > inputs.hydration) {
    return { ok: false, error: "invalidSplit" };
  }
  const result = calculateRecipe(inputs);
  // Rounded phase weights must also fit the batch, even at very small sizes.
  if (result.restWater < 0 || result.restFlour < 0) {
    return { ok: false, error: "invalidSplit" };
  }
  if (
    Object.values(result).some((value) => !Number.isFinite(value) || value < 0)
  ) {
    return { ok: false, error: "invalidInputs" };
  }
  return { ok: true, result };
}
