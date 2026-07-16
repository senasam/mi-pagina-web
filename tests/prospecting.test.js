import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { prospectingLessons, prospectingResources, prospectingScenarios, prospectingToolLinks } from "../src/prospectingContent.js";
import { buildDashboard, calculateProspecting, prospectingMetricDefinitions, toolConfigs } from "../src/prospectingTools.js";

const content = JSON.stringify(prospectingLessons);
const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const data = readFileSync(new URL("../src/contentData.js", import.meta.url), "utf8");
const pages = readFileSync(new URL("../src/ProspectingPages.jsx", import.meta.url), "utf8");
const toolsSource = readFileSync(new URL("../src/prospectingTools.js", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");

test("publica el hub y catorce módulos sustantivos", () => {
  assert.equal(prospectingLessons.length, 14);
  assert.equal(new Set(prospectingLessons.map((item) => item.slug)).size, 14);
  assert.ok(prospectingLessons.every((item) => item.status === "published" && item.lastReviewed === "2026-07-16" && item.sections.length >= 4));
});

test("cubre marcos, distinciones y límites éticos", () => {
  for (const term of ["REUNIÓN", "FOCO", "PISTA", "CAMBIO", "CLAVE", "RITMO", "ESCUCHA", "PUERTA", "DATOS", "Prospectar no es cerrar", "rechazo claro", "No existe un número universal"]) assert.match(content, new RegExp(term, "i"));
  assert.match(content, /comprador económico|responsable del problema/i);
  assert.match(content, /extracci|automatiz/i);
});

test("presenta correo, teléfono y LinkedIn de forma responsable", () => {
  assert.match(content, /asuntos engañosos/i);
  assert.match(content, /Identifícate con claridad/i);
  assert.match(content, /LinkedIn no es solo una bandeja de mensajes/i);
  assert.match(content, /no constituye asesoría legal/i);
});

test("incluye caso, escenarios y recursos originales", () => {
  const integrated = prospectingLessons.find((item) => item.slug === "caso-integrador");
  assert.match(JSON.stringify(integrated), /Caso ficticio creado con fines educativos/);
  assert.equal(prospectingScenarios.length, 35);
  assert.ok(prospectingScenarios.every((item) => item.fictional && item.modelReasoning && item.recommendedNextStep && item.constraint));
  assert.equal(prospectingResources.length, 28);
  assert.equal(prospectingLessons[0].sections.find((section) => section.scenarios)?.scenarios.length, 6);
  assert.equal(prospectingLessons[4].sections.find((section) => section.scenarios)?.scenarios.length, 12);
  assert.equal(prospectingLessons[10].sections.find((section) => section.scenarios)?.scenarios.length, 16);
});

test("registra ocho herramientas completas y locales", () => {
  assert.equal(Object.keys(prospectingToolLinks).length, 8);
  assert.equal(Object.keys(toolConfigs).length, 8);
  for (const config of Object.values(toolConfigs)) assert.ok(config.path && config.fields.length >= 6 && typeof config.build === "function");
  assert.doesNotMatch(toolsSource, /fetch\(|XMLHttpRequest|axios|localStorage|sessionStorage|WebSocket/);
});

test("todas las herramientas validan y permiten cierre", () => {
  for (const config of Object.values(toolConfigs)) assert.ok(Object.keys(config.build({}).errors).length > 0);
  const complete = Object.fromEntries(toolConfigs.objection.fields.map(([name]) => [name, name === "decision" ? "Cerrar" : "caso ficticio"]));
  const output = toolConfigs.objection.build(complete);
  assert.deepEqual(output.errors, {});
  assert.match(output.output, /Aceptar el no|negativa es clara/i);
});

test("la calculadora explica supuestos y rechaza tasas cero", () => {
  const valid = calculateProspecting({ revenue: "120000", dealValue: "20000", winRate: "25", opportunityMeetingRate: "40", meetingContactRate: "10", period: "trimestre" });
  assert.deepEqual(valid.errors, {});
  assert.match(valid.output, /Acuerdos requeridos: 6/);
  assert.match(valid.output, /no una promesa/i);
  const invalid = calculateProspecting({ revenue: "120000", dealValue: "0", winRate: "0", opportunityMeetingRate: "40", meetingContactRate: "10", period: "trimestre" });
  assert.ok(invalid.errors.dealValue && invalid.errors.winRate);
});

test("el tablero maneja denominadores cero y valida el embudo", () => {
  const zero = buildDashboard({ accounts: "10", attempts: "0", responses: "0", positive: "0", booked: "0", held: "0", opportunities: "0", wins: "0", period: "semana" });
  assert.deepEqual(zero.errors, {});
  assert.match(zero.output, /denominador cero/i);
  const invalid = buildDashboard({ accounts: "10", attempts: "2", responses: "3", positive: "0", booked: "0", held: "0", opportunities: "0", wins: "0", period: "semana" });
  assert.ok(invalid.errors.responses);
  assert.ok(Object.values(prospectingMetricDefinitions).every((metric) => metric.numerator && metric.denominator && metric.formula && metric.limitation));
});

test("integra rutas, Aprende, herramientas, SEO y sitemap", () => {
  assert.match(app, /ProspectingHubPage/);
  assert.match(app, /ProspectingLessonPage/);
  assert.match(app, /ProspectingToolsPage/);
  assert.match(data, /Prospección B2B/);
  assert.match(pages, /LearningResource/);
  assert.match(pages, /WebApplication/);
  for (const item of prospectingLessons) assert.ok(sitemap.includes(`https://masanes.cl${item.href}`));
  for (const item of Object.values(prospectingToolLinks)) assert.ok(sitemap.includes(`https://masanes.cl${item.href}`));
});

test("no promete resultados ni prescribe una cadencia universal", () => {
  assert.doesNotMatch(content, /garantiza (reuniones|ventas|ingresos|oportunidades)/i);
  assert.doesNotMatch(content, /siempre debes contactar|exactamente [0-9]+ contactos/i);
  assert.match(content, /silencio no es consentimiento/i);
});

test("las páginas temporales registran la revisión editorial", () => {
  const temporal = prospectingLessons.filter((item) => item.timeSensitive);
  assert.ok(temporal.length >= 4);
  assert.ok(temporal.every((item) => item.lastReviewed === "2026-07-16"));
  assert.match(pages, /16 de julio de 2026/);
});
