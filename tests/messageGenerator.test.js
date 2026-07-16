import test from "node:test";
import assert from "node:assert/strict";
import { generateNetworkingMessage, validateMessageForm } from "../src/messageGenerator.js";
import { CONTENT_TYPES, networkingModules, networkingResources, networkingPath } from "../src/contentData.js";
import { networkingLessonContent } from "../src/networkingContent.js";

const valid = {
  userName: "Camila", currentSituation: "estoy explorando una transición hacia producto",
  contactName: "Andrea", contactContext: "líder de producto", organization: "tecnología educativa",
  objective: "entender el desarrollo profesional en producto", specificReason: "tu trayectoria conecta educación y tecnología",
  sharedConnection: "estudiamos en la misma universidad", duration: "20", channel: "linkedin", tone: "profesional",
};

test("valida todos los campos obligatorios", () => {
  const errors = validateMessageForm({ duration: "", channel: "", tone: "" });
  assert.ok(errors.userName);
  assert.ok(errors.specificReason);
  assert.ok(errors.channel);
});

test("genera un mensaje español no vacío con la duración", () => {
  const { message, errors } = generateNetworkingMessage(valid, 0);
  assert.deepEqual(errors, {});
  assert.match(message, /20 minutos/);
  assert.match(message, /Andrea/);
});

test("adapta el formato al email", () => {
  const { message } = generateNetworkingMessage({ ...valid, channel: "email" });
  assert.match(message, /^Asunto:/);
});

test("el tono cambia la solicitud", () => {
  const professional = generateNetworkingMessage(valid).message;
  const direct = generateNetworkingMessage({ ...valid, tone: "directo" }).message;
  assert.notEqual(professional, direct);
  assert.match(direct, /¿Podríamos conversar/);
});

test("otra versión cambia el texto sin cambiar los datos", () => {
  const first = generateNetworkingMessage(valid, 0).message;
  const second = generateNetworkingMessage(valid, 1).message;
  assert.notEqual(first, second);
  assert.match(second, /Camila/);
  assert.match(second, /Andrea/);
});

test("la arquitectura incluye cinco lecciones publicadas y recursos activos", () => {
  assert.equal(networkingModules.length, 5);
  assert.equal(networkingPath.status, "published");
  assert.ok(networkingModules.every((module) => module.status === "published"));
  assert.equal(networkingResources.length, 12);
  assert.ok(networkingResources.every((resource) => resource.status === "published"));
  assert.ok(["guide", "lesson", "framework", "template", "checklist", "case", "exercise", "tool", "glossary-entry", "learning-path"].every((type) => CONTENT_TYPES.includes(type)));
});

test("cada lección contiene contenido sustantivo y metadatos únicos", () => {
  const descriptions = new Set();
  networkingModules.forEach((module) => {
    const content = networkingLessonContent[module.slug];
    assert.ok(content.sections.length >= 5);
    assert.ok(content.sections.some((section) => section.paragraphs?.length));
    assert.match(module.readingTime, /minutos/);
    assert.notEqual(content.description, "");
    descriptions.add(content.description);
  });
  assert.equal(descriptions.size, 5);
});

test("el generador mantiene un objetivo de aprendizaje y no pide empleo", () => {
  for (const channel of ["linkedin", "email", "mensaje"]) {
    const { message } = generateNetworkingMessage({ ...valid, channel }, 2);
    assert.match(message, /entender|orientación|perspectiva/i);
    assert.doesNotMatch(message, /dame un trabajo|contrátame|vacante para mí/i);
    assert.match(message, /20 minutos/);
  }
});

test("el generador incorpora una contribución solo cuando se proporciona", () => {
  const withoutContribution = generateNetworkingMessage(valid, 0).message;
  const withContribution = generateNetworkingMessage({ ...valid, contribution: "un recurso sobre el mercado local" }, 0).message;
  assert.doesNotMatch(withoutContribution, /también puedo compartir/i);
  assert.match(withContribution, /también puedo compartir un recurso sobre el mercado local/i);
});

test("la lección de barreras incluye diagnóstico, casos y plan de siete días", () => {
  const lesson = networkingLessonContent.barreras;
  const cases = lesson.sections.filter((section) => section.caseStudy);
  const diagnostic = lesson.sections.find((section) => section.diagnostic)?.diagnostic;
  const plan = lesson.sections.find((section) => section.timeline?.some((item) => item.time === "Día 7"))?.timeline;
  assert.ok(lesson.sections.length >= 12);
  assert.ok(cases.length >= 2);
  assert.equal(diagnostic.length, 9);
  assert.ok(diagnostic.every((item) => item.barrier && item.action));
  assert.equal(plan.length, 7);
  assert.equal(lesson.readingTime, "14 minutos");
});

test("los recursos de barreras existen y sus enlaces internos resuelven", () => {
  const lesson = networkingLessonContent.barreras;
  const resourceIds = new Set(networkingResources.map((resource) => resource.id));
  assert.ok(["barrier-self-assessment", "seven-day-plan", "reciprocity-worksheet", "low-risk-action"].every((id) => resourceIds.has(id)));
  assert.ok(lesson.relatedResources.every((id) => resourceIds.has(id)));
  const assessment = networkingResources.find((resource) => resource.id === "barrier-self-assessment");
  assert.ok(assessment.options.every((option) => option.label && option.action));
});
