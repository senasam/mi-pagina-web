import test from "node:test";
import assert from "node:assert/strict";
import { consultingLessonContent, consultingModules, consultingPath, consultingResources } from "../src/consultingContent.js";
import { generateImpactBullets, validateImpactBullet } from "../src/impactBulletGenerator.js";
import { tools, topicGroups } from "../src/contentData.js";

const valid = {
  context: "un proceso mensual fragmentado",
  action: "Automaticé la consolidación de cuatro fuentes",
  method: "consultas reproducibles",
  result: "reduje el tiempo de preparación",
  metric: "de dos días a cuatro horas",
  skill: "análisis y mejora de procesos",
  target: "acelerar la revisión comercial",
};

test("publica una ruta de ocho módulos sustantivos y con SEO único", () => {
  assert.equal(consultingModules.length, 8);
  assert.equal(consultingPath.status, "published");
  assert.ok(consultingModules.every((module) => module.status === "published"));
  assert.equal(new Set(consultingModules.map((module) => consultingLessonContent[module.slug].seoTitle)).size, 8);
  consultingModules.forEach((module) => {
    const lesson = consultingLessonContent[module.slug];
    assert.ok(lesson.sections.length >= 7);
    assert.ok(lesson.outcomes.length >= 3);
    assert.match(lesson.readingTime, /minutos/);
  });
});

test("todos los recursos relacionados resuelven y hay al menos doce", () => {
  const ids = new Set(consultingResources.map((resource) => resource.id));
  assert.ok(consultingResources.length >= 12);
  assert.ok(consultingResources.every((resource) => resource.status === "published"));
  assert.ok(consultingModules.every((module) => module.relatedResources.every((id) => ids.has(id))));
  assert.ok(["consulting-fit", "target-firm-matrix", "application-timeline", "experience-inventory", "impact-bullet-tool", "cv-checklist", "behavioral-story-bank", "case-practice-tracker", "market-sizing-worksheet", "consulting-networking-templates", "recruiting-question-bank", "readiness-diagnostic"].every((id) => ids.has(id)));
});

test("Consultoría y su herramienta aparecen publicadas en la arquitectura", () => {
  const topic = topicGroups.flatMap((group) => group.topics).find((item) => item.slug === "consultoria");
  const tool = tools.find((item) => item.slug === "constructor-bullets-consultoria");
  assert.equal(topic.href, "/aprende/consultoria");
  assert.equal(topic.status, "published");
  assert.equal(tool.status, "published");
  assert.equal(tool.href, "/herramientas/constructor-bullets-consultoria");
});

test("el constructor exige contexto, acción y resultado", () => {
  const errors = validateImpactBullet({});
  assert.ok(errors.context);
  assert.ok(errors.action);
  assert.ok(errors.result);
});

test("genera tres bullets y conserva la métrica proporcionada", () => {
  const { bullets, errors } = generateImpactBullets(valid);
  assert.deepEqual(errors, {});
  assert.equal(bullets.length, 3);
  assert.ok(bullets.every((bullet) => bullet.length > 40));
  assert.ok(bullets.some((bullet) => bullet.includes("de dos días a cuatro horas")));
});

test("no inventa métricas cuando el campo está vacío", () => {
  const { bullets } = generateImpactBullets({ ...valid, metric: "" });
  const combined = bullets.join(" ");
  assert.doesNotMatch(combined, /\d|%|por ciento/i);
  assert.match(combined, /reduje el tiempo de preparación/i);
});

test("otra generación cambia la redacción sin cambiar la evidencia", () => {
  const first = generateImpactBullets(valid, 0).bullets;
  const second = generateImpactBullets(valid, 1).bullets;
  assert.notDeepEqual(first, second);
  assert.ok(second.some((bullet) => bullet.includes("dos días a cuatro horas")));
});

test("los módulos conectan recursos propios y las rutas complementarias", () => {
  const cv = consultingLessonContent["cv-consultoria"];
  const networking = consultingLessonContent.networking;
  assert.ok(cv.sections.some((section) => section.links?.some((link) => link.href === "/herramientas/constructor-bullets-consultoria")));
  assert.ok(networking.sections.some((section) => section.links?.some((link) => link.href === "/aprende/networking")));
});
