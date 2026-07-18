import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { brokeragePresets, brokerageQuestions, brokerageServices, brokerageTemplates } from "../src/brokerageContent.js";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("ofrece presets editables, servicios, preguntas y plantillas originales", () => {
  assert.equal(brokeragePresets.length, 6);
  assert.equal(brokerageServices.length, 18);
  assert.equal(brokerageQuestions.length, 20);
  assert.deepEqual(Object.keys(brokerageTemplates).sort(), ["dual", "final", "fixed", "percentage"]);
});

test("integra controles accesibles y estados tributarios sin una tarifa obligatoria", async () => {
  const module = await source("../src/BrokerageModule.jsx");
  for (const token of [
    "<fieldset", "<legend>Comisión de corretaje", "Escenarios de comparación, no tarifas obligatorias",
    "Monto personalizado", "Tratamiento tributario", "aria-describedby", "aria-live", "data-private",
    "Servicios documentados", "Comisión del vendedor", "Reiniciar solo corretaje",
    "Comparación local de corretaje",
  ]) assert.ok(module.includes(token), `Falta: ${token}`);
  assert.doesNotMatch(module, /tarifa (legal|obligatoria) de 2%/i);
});

test("incluye corretaje en escenarios, resumen copiable e impresión", async () => {
  const calculator = await source("../src/MortgageCalculatorPage.jsx");
  for (const token of [
    "BrokerageInputSection", "BrokerageComparisonTool", "BrokerageResultCard",
    "Corretaje del comprador", "Servicios documentados", "Hito de corretaje", "Efectivo inicial",
    "Copiar resumen", "window.print()", "resetBrokerage", "brokerageConfig",
  ]) assert.ok(calculator.includes(token), `Falta: ${token}`);
  assert.doesNotMatch(calculator, /BrokeragePreparationAid|Prepara la conversación sobre corretaje/);
});

test("la guía incorpora pedagogía, tabla y alternativa móvil", async () => {
  const [guide, css] = await Promise.all([source("../src/MortgageLearningPage.jsx"), source("../src/index.css")]);
  assert.match(guide, /Cómo evaluar una comisión de corretaje/);
  assert.match(guide, /brokerage-learning-grid/);
  assert.match(guide, /brokerage-example-cards/);
  assert.match(guide, /Preguntas para llevar a la conversación/);
  assert.match(guide, /Copiar lista/);
  assert.match(guide, /2% \+ IVA equivale a 2,38% final y 119 UF/);
  assert.match(guide, /12\.000 UF/);
  assert.match(css, /\.brokerage-example-cards/);
  assert.match(css, /@media \(max-width: (?:760|780)px\)/);
});

test("la analítica de corretaje usa solo dimensiones categóricas", async () => {
  const [module, guide] = await Promise.all([source("../src/BrokerageModule.jsx"), source("../src/MortgageLearningPage.jsx")]);
  const calls = `${module}\n${guide}`.match(/trackEvent\("brokerage_[^"]+",\s*\{[^}]*\}\)/g) || [];
  assert.ok(calls.length >= 3);
  for (const call of calls) assert.doesNotMatch(call, /amount|rate|price|commission|service|milestone|difference|cash/i);
  assert.doesNotMatch(`${module}\n${guide}`, /localStorage|sessionStorage|URLSearchParams|console\.log/);
});
