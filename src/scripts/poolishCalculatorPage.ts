// Browser behavior for the poolish calculator page, the counterpart to
// ./siteHeader for the one other surface with interactive markup (ADR 0029).
// The page hands the rendered calculator to initializePoolishCalculator once
// and everything else is internal: every element the behavior needs is resolved
// from that root up front and named in a type, so markup the behavior depends
// on cannot go missing quietly. Arithmetic and rejection rules stay in
// ../lib/poolishCalculator, and every word stays in ../i18n/calculator; this
// module only reads the form, runs the calculation, and writes what it
// returns.
import { calculatePoolish } from "../lib/poolishCalculator";
import type {
  CalculatorFields,
  CalculatorMode,
  CalculatorResult,
} from "../lib/poolishCalculator";
import { calculatorLabels } from "../i18n/calculator";
import type { CalculatorLabels } from "../i18n/calculator";
import { isRecipeLanguage } from "../lib/site";
import { setLanguageSwitchQuery } from "./languageSwitch";

// One element per field the calculation reads and one per weight it returns.
// Naming the weights after CalculatorResult is what keeps a misspelled output
// — `totalFluor` for `totalFlour` — a type error instead of a blank quantity.
type CalculatorInputs = Record<keyof CalculatorFields, HTMLInputElement>;
type CalculatorOutputs = Record<keyof CalculatorResult, HTMLElement>;

// Salt is the only weight fine enough to be worth a decimal.
const outputDigits: Record<keyof CalculatorResult, number> = {
  targetDough: 0,
  totalFlour: 0,
  totalWater: 0,
  poolishFlour: 0,
  poolishWater: 0,
  poolishYeast: 0,
  restFlour: 0,
  restWater: 0,
  restYeast: 0,
  salt: 1,
};

const noQuantity = "—";

function requireElement<T extends Element>(
  root: ParentNode,
  selector: string,
): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`The poolish calculator is missing ${selector}.`);
  }
  return element;
}

function requireLabels(root: HTMLElement): CalculatorLabels {
  const { language } = root.dataset;
  if (!isRecipeLanguage(language)) {
    throw new Error("The poolish calculator needs a data-language attribute.");
  }
  return calculatorLabels[language];
}

function requireInput(root: ParentNode, name: keyof CalculatorFields) {
  return requireElement<HTMLInputElement>(root, `[data-field="${name}"]`);
}

function requireInputs(form: HTMLFormElement): CalculatorInputs {
  return {
    pizzaCount: requireInput(form, "pizzaCount"),
    desiredDough: requireInput(form, "desiredDough"),
    hydration: requireInput(form, "hydration"),
    poolishShare: requireInput(form, "poolishShare"),
    poolishHydration: requireInput(form, "poolishHydration"),
    poolishYeast: requireInput(form, "poolishYeast"),
    restYeast: requireInput(form, "restYeast"),
    salt: requireInput(form, "salt"),
  };
}

function requireOutput(root: ParentNode, name: keyof CalculatorResult) {
  return requireElement<HTMLElement>(root, `[data-output="${name}"]`);
}

function requireOutputs(root: HTMLElement): CalculatorOutputs {
  return {
    targetDough: requireOutput(root, "targetDough"),
    totalFlour: requireOutput(root, "totalFlour"),
    totalWater: requireOutput(root, "totalWater"),
    poolishFlour: requireOutput(root, "poolishFlour"),
    poolishWater: requireOutput(root, "poolishWater"),
    poolishYeast: requireOutput(root, "poolishYeast"),
    restFlour: requireOutput(root, "restFlour"),
    restWater: requireOutput(root, "restWater"),
    restYeast: requireOutput(root, "restYeast"),
    salt: requireOutput(root, "salt"),
  };
}

function requireModeInput(form: HTMLFormElement, mode: CalculatorMode) {
  return requireElement<HTMLInputElement>(
    form,
    `[data-mode-input][value="${mode}"]`,
  );
}

function requireModeInputs(form: HTMLFormElement) {
  return {
    generic: requireModeInput(form, "generic"),
    pizza: requireModeInput(form, "pizza"),
  };
}

/**
 * Wire up one rendered poolish calculator. The root element carries the
 * language the messages need, so a page only has to hand over the element.
 */
export function initializePoolishCalculator(root: HTMLElement): void {
  const labels = requireLabels(root);
  const form = requireElement<HTMLFormElement>(root, "[data-calculator-form]");
  const inputs = requireInputs(form);
  const outputs = requireOutputs(root);
  const modeInputs = requireModeInputs(form);
  const genericControls = requireElement<HTMLElement>(
    form,
    "[data-generic-controls]",
  );
  const pizzaControls = requireElement<HTMLElement>(
    form,
    "[data-pizza-controls]",
  );
  const presetList = requireElement<HTMLElement>(form, "[data-preset-list]");
  const copyButton = requireElement<HTMLButtonElement>(
    root,
    "[data-copy-button]",
  );
  const copyStatus = requireElement<HTMLElement>(root, "[data-copy-status]");
  const validationMessage = requireElement<HTMLElement>(
    root,
    "[data-validation-message]",
  );

  // The weights the copy button would put on the clipboard, and the count of
  // renders behind them: a copy that resolves after an edit belongs to a batch
  // the reader has already moved on from, so its feedback is dropped.
  let currentResult: CalculatorResult | null = null;
  let revision = 0;

  function currentMode(): CalculatorMode {
    return modeInputs.pizza.checked ? "pizza" : "generic";
  }

  function urlMode(): CalculatorMode | null {
    const mode = new URLSearchParams(window.location.search).get("mode");
    return mode === "pizza" || mode === "generic" ? mode : null;
  }

  function syncUrlMode() {
    const url = new URL(window.location.href);
    url.searchParams.set("mode", currentMode());
    window.history.replaceState({}, "", url);
  }

  // The header renders a language-switch link in both its desktop and its
  // mobile layout. Both carry the selected mode so the reader lands on the
  // same calculator in the other language.
  function syncLanguageSwitch() {
    const mode = urlMode();
    const query = new URLSearchParams();
    if (mode) {
      query.set("mode", mode);
    }
    setLanguageSwitchQuery(query);
  }

  function readFields(): CalculatorFields {
    return {
      pizzaCount: inputs.pizzaCount.value,
      desiredDough: inputs.desiredDough.value,
      hydration: inputs.hydration.value,
      poolishShare: inputs.poolishShare.value,
      poolishHydration: inputs.poolishHydration.value,
      poolishYeast: inputs.poolishYeast.value,
      restYeast: inputs.restYeast.value,
      salt: inputs.salt.value,
    };
  }

  function grams(value: number, digits: number) {
    return `${value.toFixed(digits)}${labels.gramUnit}`;
  }

  function weight(result: CalculatorResult, name: keyof CalculatorResult) {
    return grams(result[name], outputDigits[name]);
  }

  function showModeControls(mode: CalculatorMode) {
    const isPizza = mode === "pizza";
    genericControls.hidden = isPizza;
    pizzaControls.hidden = !isPizza;
    presetList.hidden = !isPizza;
  }

  function render() {
    revision += 1;
    currentResult = null;
    copyStatus.textContent = "";
    copyButton.disabled = true;
    const mode = currentMode();
    showModeControls(mode);
    const calculation = calculatePoolish(mode, readFields());

    if (!calculation.ok) {
      for (const output of Object.values(outputs)) {
        output.textContent = noQuantity;
      }
      validationMessage.textContent = labels.validation[calculation.error];
      return;
    }

    currentResult = calculation.result;
    copyButton.disabled = false;
    for (const name of Object.keys(outputs) as (keyof CalculatorResult)[]) {
      outputs[name].textContent = weight(calculation.result, name);
    }
    validationMessage.textContent = "";
  }

  async function copyWeights() {
    if (!currentResult || copyButton.disabled) return;
    const result = currentResult;
    const copyRevision = revision;
    const text = [
      labels.copyText.poolish,
      `${labels.copyText.flour}: ${weight(result, "poolishFlour")}`,
      `${labels.copyText.water}: ${weight(result, "poolishWater")}`,
      `${labels.copyText.yeast}: ${weight(result, "poolishYeast")}`,
      "",
      labels.copyText.finalDough,
      `${labels.copyText.flour}: ${weight(result, "restFlour")}`,
      `${labels.copyText.water}: ${weight(result, "restWater")}`,
      `${labels.copyText.yeast}: ${weight(result, "restYeast")}`,
      `${labels.copyText.salt}: ${weight(result, "salt")}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      if (revision === copyRevision) copyStatus.textContent = labels.copied;
    } catch {
      if (revision === copyRevision) copyStatus.textContent = labels.copyFailed;
    }
  }

  form.addEventListener("submit", (event) => event.preventDefault());
  form.addEventListener("input", render);
  form.addEventListener("change", () => {
    syncUrlMode();
    syncLanguageSwitch();
    render();
  });
  copyButton.addEventListener("click", copyWeights);

  // A reader can arrive on a mode, from the other language or a shared link.
  const requestedMode = urlMode();
  if (requestedMode) {
    modeInputs[requestedMode].checked = true;
  }
  syncLanguageSwitch();
  render();
}
