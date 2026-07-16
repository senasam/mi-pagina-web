import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { marketingLessons, marketingResources, marketingScenarios, marketingToolLinks } from "../src/marketingContent.js";
import { marketingMetricDefinitions, toolConfigs } from "../src/marketingTools.js";

const content = JSON.stringify(marketingLessons);
const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const data = readFileSync(new URL("../src/contentData.js", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
const toolsSource = readFileSync(new URL("../src/marketingTools.js", import.meta.url), "utf8");

test("publica el hub y diecisiete módulos únicos", () => {
  assert.equal(marketingLessons.length, 17);
  assert.equal(new Set(marketingLessons.map((item) => item.slug)).size, 17);
  assert.ok(marketingLessons.every((item) => item.status === "published" && item.lastReviewed === "2026-07-16" && item.sections.length >= 3));
});

test("incluye marcos, distinciones y límites centrales", () => {
  for (const term of ["CONECTA", "META", "CANAL", "BRIEF", "CRUZA", "Propios", "Ganados", "Compartidos", "Pagados", "ROAS", "no equivale a beneficio", "no garantiza"]) assert.match(content, new RegExp(term, "i"));
});

test("cubre clientes, evidencia, recorrido, permiso y accesibilidad", () => {
  for (const term of ["evidencia", "estereotipos", "Detonante", "Descubrimiento", "Evaluación", "Decisión", "Uso", "Continuidad", "permiso", "accesibilidad"]) assert.match(content, new RegExp(term, "i"));
});

test("publica caso integrador, escenarios y recursos originales", () => {
  const integrated = marketingLessons.find((item) => item.slug === "caso-integrador");
  assert.match(JSON.stringify(integrated), /Caso ficticio creado con fines educativos/);
  assert.equal(marketingScenarios.length, 32);
  assert.ok(marketingScenarios.every((item) => item.fictional && item.modelReasoning && item.nextAction));
  assert.equal(marketingResources.length, 31);
});

test("registra ocho herramientas completas", () => {
  assert.equal(Object.keys(marketingToolLinks).length, 8);
  assert.equal(Object.keys(toolConfigs).length, 8);
  for (const config of Object.values(toolConfigs)) assert.ok(config.path && config.fields.length >= 4 && typeof config.build === "function");
});

test("las herramientas validan y generan resultados locales", () => {
  const strategy = toolConfigs.strategy.build(Object.fromEntries(toolConfigs.strategy.fields.map(([name]) => [name, "ejemplo ficticio"])));
  assert.deepEqual(strategy.errors, {});
  assert.match(strategy.output, /Brief CONECTA y META/);
  const invalid = toolConfigs.audit.build({});
  assert.ok(Object.keys(invalid.errors).length > 0);
  assert.doesNotMatch(toolsSource, /fetch\(|localStorage|sessionStorage|XMLHttpRequest|axios/);
});

test("la calculadora explica denominadores y rechaza división por cero", () => {
  const valid = toolConfigs.metrics.build({ metric: "ctr", numerator: "25", denominator: "1000", period: "julio" });
  assert.deepEqual(valid.errors, {});
  assert.match(valid.output, /2\.50 %/);
  const invalid = toolConfigs.metrics.build({ metric: "ctr", numerator: "25", denominator: "0", period: "julio" });
  assert.ok(invalid.errors.denominator);
  const clv = toolConfigs.metrics.build({ metric: "clv", numerator: "40", frequency: "3", cycles: "2", margin: "40", period: "dos años" });
  assert.deepEqual(clv.errors, {});
  assert.match(clv.output, /96\.00/);
  assert.match(marketingMetricDefinitions.roas.limitation, /No equivale a beneficio/i);
});

test("las fórmulas declaran unidad, numerador, denominador y límite", () => {
  assert.ok(Object.keys(marketingMetricDefinitions).length >= 17);
  assert.ok(Object.values(marketingMetricDefinitions).every((item) => item.formula && item.numerator && item.denominator && item.unit && item.period && item.interpretation && item.limitation && item.example));
});

test("integra rutas, Aprende, herramientas y sitemap", () => {
  assert.match(app, /MarketingHubPage/);
  assert.match(app, /MarketingLessonPage/);
  assert.match(app, /MarketingToolsPage/);
  assert.match(data, /Marketing digital/);
  for (const item of marketingLessons) assert.ok(sitemap.includes(`https://masanes.cl${item.href}`));
  for (const item of Object.values(marketingToolLinks)) assert.ok(sitemap.includes(`https://masanes.cl${item.href}`));
});

test("no promete resultados ni presenta ROAS como rentabilidad", () => {
  assert.doesNotMatch(content, /garantiza (ventas|crecimiento|posiciones|rentabilidad)/i);
  assert.match(content, /ROAS.*no equivale a beneficio/is);
  assert.match(content, /no toda prueba identifica causalidad/i);
});
