import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { adaptabilityLessons, adaptabilityPath, adaptabilityResources, adaptabilityScenarios } from "../src/adaptabilityContent.js";
import { buildAdaptabilityPlan, buildHabitPlan, buildJournalEntry, buildLearningIntention, buildReframe } from "../src/adaptabilityTools.js";
import { tools, topicGroups } from "../src/contentData.js";

test("publica una ruta original de seis módulos sustantivos", () => {
  assert.equal(adaptabilityLessons.length, 6);
  assert.equal(adaptabilityPath.status, "published");
  assert.equal(new Set(adaptabilityLessons.map((item) => item.title)).size, 6);
  assert.equal(new Set(adaptabilityLessons.map((item) => item.description)).size, 6);
  assert.ok(adaptabilityLessons.every((item) => item.status === "published" && item.sections.length >= 6 && item.outcomes.length >= 3));
});

test("la ruta contiene OPA, HECA, hábitos e intenciones", () => {
  const text = JSON.stringify(adaptabilityLessons);
  assert.match(text, /OPA: Observar, Pausar, Ajustar/);
  assert.match(text, /HECA: Hecho, Explicación, Consecuencia, Ajuste/);
  assert.match(text, /Intención de aprendizaje/);
  assert.match(text, /Disparador, Acción y Refuerzo/);
  assert.match(text, /Cuatro semanas/);
});

test("incluye doce escenarios ficticios con acción, pregunta y restricción", () => {
  assert.ok(adaptabilityScenarios.length >= 10);
  assert.equal(new Set(adaptabilityScenarios.map((item) => item.id)).size, adaptabilityScenarios.length);
  assert.ok(adaptabilityScenarios.every((item) => item.person && item.organization && item.situation && item.question && item.action && item.constraint));
});

test("todos los recursos relacionados resuelven y la biblioteca está completa", () => {
  const ids = new Set(adaptabilityResources.map((item) => item.id));
  assert.ok(adaptabilityResources.length >= 11);
  assert.ok(adaptabilityResources.every((item) => item.status === "published"));
  assert.ok(adaptabilityLessons.every((item) => item.relatedResources.every((id) => ids.has(id))));
});

test("Learn contiene una tarjeta publicada para la ruta", () => {
  const topic = topicGroups.flatMap((group) => group.topics).find((item) => item.slug === "adaptabilidad-resiliencia");
  assert.equal(topic.status, "published");
  assert.equal(topic.href, "/aprende/adaptabilidad-resiliencia");
});

test("las cinco herramientas solicitadas están publicadas", () => {
  const slugs = ["constructor-intenciones-aprendizaje", "reencuadrar-desafio", "planificador-habitos-aprendizaje", "plan-adaptabilidad", "diario-aprendizaje"];
  assert.ok(slugs.every((slug) => tools.some((item) => item.slug === slug && item.status === "published")));
});

test("el constructor de intención valida y genera un plan", () => {
  assert.ok(buildLearningIntention({}).errors.skill);
  const result = buildLearningIntention({ skill: "dar feedback", situation: "reuniones de equipo", meaning: "resolver problemas antes", practice: "preparar una pregunta", frequency: "semanal", feedback: "una colega", review: "fin de mes" });
  assert.deepEqual(result.errors, {});
  assert.match(result.output, /dar feedback/);
  assert.match(result.output, /PREGUNTAS/);
});

test("OPA separa hechos, interpretación y acción", () => {
  assert.ok(buildReframe({}).errors.happened);
  const result = buildReframe({ happened: "cambió el alcance", interpretation: "todo el trabajo se perdió", facts: "se añadió una región", next: "comparar opciones", boundary: "renegociar plazo" });
  assert.match(result.output, /OBSERVAR/);
  assert.match(result.output, /renegociar plazo/);
});

test("el planificador de hábitos genera recuperación y checklist", () => {
  assert.ok(buildHabitPlan({}).errors.habit);
  const result = buildHabitPlan({ habit: "revisar un error", meaning: "ajustar la práctica", trigger: "viernes", action: "anotar una lección", recovery: "retomar el lunes" });
  assert.match(result.output, /CHECKLIST SEMANAL/);
  assert.match(result.output, /retomar el lunes/);
});

test("el plan de adaptabilidad genera las cuatro semanas", () => {
  const result = buildAdaptabilityPlan({ context: "rol nuevo", challenge: "responsabilidad ambigua", intention: "practicar síntesis", practice: "resumir una decisión", support: "mi jefatura" });
  assert.deepEqual(result.errors, {});
  ["SEMANA 1", "SEMANA 2", "SEMANA 3", "SEMANA 4"].forEach((week) => assert.match(result.output, new RegExp(week)));
});

test("el diario genera HECA sin persistencia", () => {
  const result = buildJournalEntry({ situation: "presentación", fact: "hubo tres preguntas", action: "respondí", result: "faltó una decisión", lesson: "abrir con la decisión", next: "probar un resumen" });
  assert.deepEqual(result.errors, {});
  assert.match(result.output, /REGISTRO HECA/);
});

test("routing, sitemap y privacidad están declarados", () => {
  const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  const toolPage = readFileSync(new URL("../src/AdaptabilityToolsPage.jsx", import.meta.url), "utf8");
  assert.match(app, /AdaptabilityHubPage/);
  adaptabilityLessons.forEach((item) => assert.match(sitemap, new RegExp(item.href)));
  assert.match(toolPage, /aria-live/);
  assert.doesNotMatch(toolPage, /fetch\(|XMLHttpRequest|localStorage|sessionStorage|sendBeacon/);
});
