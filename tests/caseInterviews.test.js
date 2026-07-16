import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { caseInterviewPath, caseLessons, caseResources, practiceCases } from "../src/caseInterviewContent.js";
import { buildCaseStructure, buildExperiment, nextSizingPrompt, sizingPrompts } from "../src/caseTools.js";
import { consultingModules } from "../src/consultingContent.js";
import { tools } from "../src/contentData.js";

test("la ruta de entrevistas contiene doce capítulos publicados y únicos", () => {
  assert.equal(caseLessons.length, 12);
  assert.equal(caseInterviewPath.status, "published");
  assert.equal(new Set(caseLessons.map((item) => item.title)).size, 12);
  assert.equal(new Set(caseLessons.map((item) => item.description)).size, 12);
  assert.ok(caseLessons.every((item) => item.sections.length >= 6 && item.outcomes.length >= 3));
  assert.ok(caseLessons.every((item) => item.href.startsWith("/aprende/consultoria/entrevistas-de-caso/")));
});

test("la ruta preserva el enlace del módulo general de Consultoría", () => {
  const module = consultingModules.find((item) => item.slug === "entrevistas-de-caso");
  assert.equal(module.href, "/aprende/consultoria/entrevistas-de-caso");
});

test("cada recurso relacionado existe y hay una biblioteca completa", () => {
  const ids = new Set(caseResources.map((item) => item.id));
  assert.ok(caseResources.length >= 12);
  assert.ok(caseResources.every((item) => item.status === "published"));
  assert.ok(caseLessons.every((item) => item.relatedResources.every((id) => ids.has(id))));
});

test("publica al menos doce casos originales, ficticios y estructurados", () => {
  assert.ok(practiceCases.length >= 12);
  assert.equal(new Set(practiceCases.map((item) => item.slug)).size, practiceCases.length);
  practiceCases.forEach((item) => {
    assert.equal(item.fictional, true);
    assert.ok(item.client && item.objective && item.prompt);
    assert.ok(item.clarifyingFacts.length);
    assert.ok(item.possibleStructures[0].length >= 4);
    assert.ok(item.exhibits.length >= 1 && item.exhibits[0].summary);
    assert.ok(item.calculations[0].answer && item.calculations[0].explanation);
    assert.ok(item.brainstormingPrompts.length && item.recommendationPrompt);
    assert.ok(item.interviewerGuide && item.modelInsights.length && item.skills.length);
  });
});

test("los casos cubren las doce categorías requeridas y cuatro de experimentación", () => {
  const categories = new Set(practiceCases.map((item) => item.category));
  ["Rentabilidad", "Crecimiento", "Entrada a mercado", "Inversión", "Operaciones", "Pricing", "Retención", "Tecnología", "Experimentación", "Sector público/social", "Capacidad", "M&A o alianza"].forEach((category) => assert.ok(categories.has(category)));
  assert.ok(practiceCases.filter((item) => item.category === "Experimentación").length >= 4);
});

test("la lección cuantitativa contiene fórmulas y diez drills", () => {
  const lesson = caseLessons.find((item) => item.slug === "exhibits-y-calculos");
  assert.ok(lesson.sections.find((section) => section.formulas)?.formulas.length >= 10);
  assert.equal(lesson.sections.find((section) => section.calculationDrills).calculationDrills.length, 10);
});

test("market sizing ofrece ocho ejercicios y tres soluciones completas", () => {
  const lesson = caseLessons.find((item) => item.slug === "market-sizing");
  assert.equal(lesson.sections.find((section) => section.title.includes("Ocho ejercicios")).examples.length, 8);
  assert.equal(lesson.sections.find((section) => section.modelAnswers).modelAnswers.length, 3);
});

test("los cuatro tools de casos están publicados", () => {
  const slugs = ["practica-market-sizing", "disenador-experimentos-negocio", "constructor-estructuras-caso", "seguimiento-practica-casos"];
  assert.ok(slugs.every((slug) => tools.some((item) => item.slug === slug && item.status === "published")));
});

test("la práctica de market sizing genera prompts originales por categoría", () => {
  assert.ok(sizingPrompts.length >= 5);
  const first = nextSizingPrompt("Todas", 0);
  const second = nextSizingPrompt("Todas", 1);
  assert.ok(first.prompt && first.structure);
  assert.notEqual(first.prompt, second.prompt);
});

test("el diseñador de experimentos valida y genera un brief determinista", () => {
  assert.ok(buildExperiment({}).errors.decision);
  const values = { decision: "escalar un piloto", population: "clientes nuevos", hypothesis: "mejorará activación", treatment: "onboarding breve", control: "flujo actual", kpi: "primera transacción", guardrails: "fraude", duration: "cuatro semanas", cost: "$10", benefit: "$20", constraints: "capacidad" };
  const result = buildExperiment(values);
  assert.deepEqual(result.errors, {});
  assert.match(result.output, /escalar un piloto/);
  assert.match(result.output, /primera transacción/);
});

test("el constructor de estructuras valida y ofrece preguntas sin respuesta automática", () => {
  assert.ok(buildCaseStructure({}).errors.client);
  const result = buildCaseStructure({ type: "Rentabilidad", client: "Empresa ficticia", objective: "recuperar margen", metric: "margen operativo" });
  assert.equal(result.branches.length, 4);
  assert.ok(result.questions.length >= 4);
});

test("routing, sitemap, privacidad y navegación están declarados", () => {
  const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  const toolPage = readFileSync(new URL("../src/CaseToolsPage.jsx", import.meta.url), "utf8");
  caseLessons.forEach((item) => assert.match(sitemap, new RegExp(item.href)));
  assert.match(app, /CaseInterviewHubPage/);
  assert.match(app, /CaseInterviewLessonPage/);
  assert.match(toolPage, /aria-live/);
  assert.doesNotMatch(toolPage, /fetch\(|XMLHttpRequest|localStorage|sessionStorage/);
});

