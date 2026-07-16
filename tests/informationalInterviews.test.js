import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { informationalCases, informationalLessons, informationalResources, informationalToolLinks } from "../src/informationalInterviewContent.js";
import { classifyQuestion, decideFollowup, informationalToolConfigs, reviewPressure } from "../src/informationalInterviewTools.js";

const content = JSON.stringify(informationalLessons);
const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const data = readFileSync(new URL("../src/contentData.js", import.meta.url), "utf8");
const pages = readFileSync(new URL("../src/InformationalInterviewPages.jsx", import.meta.url), "utf8");
const toolSource = readFileSync(new URL("../src/informationalInterviewTools.js", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");

test("publica diez módulos sustantivos y revisados", () => {
  assert.equal(informationalLessons.length, 10);
  assert.equal(new Set(informationalLessons.map((item) => item.slug)).size, 10);
  assert.ok(informationalLessons.every((item) => item.status === "published" && item.lastReviewed === "2026-07-16" && item.sections.length >= 4));
});

test("distingue aprendizaje, selección y solicitud de empleo", () => {
  assert.match(content, /No es una entrevista de selección ni una solicitud indirecta de empleo/i);
  assert.match(content, /perspectiva para decidir|conversación para aprender/i);
  assert.match(content, /no delega la decisión/i);
});

test("incluye los dos modelos originales y sus avisos", () => {
  for (const term of ["Mapa de conversación con propósito", "Aprendizaje buscado", "Perspectiva adecuada", "Preparación suficiente", "Conversación útil", "Próximo paso razonado", "Escala de profundidad", "Público", "Contextual", "Experiencial", "Reflexivo"]) assert.match(content, new RegExp(term, "i"));
  assert.match(content, /no es un estándar, una certificación ni una garantía/i);
});

test("publica caso integrado, 24 casos breves y 12 recursos", () => {
  assert.match(JSON.stringify(informationalLessons[8]), /Proyecto Umbral/);
  assert.equal(informationalCases.length, 24);
  assert.ok(informationalCases.every((item) => item.fictional && item.label === "Caso ficticio creado con fines educativos." && item.actions.length >= 3 && item.feedback));
  assert.equal(informationalResources.length, 12);
});

test("cubre invitación, escucha, eventos, registro y seguimiento", () => {
  for (const term of ["Contexto, motivo y salida fácil", "Preguntas que conviene reformular", "Necesito aprender", "Conviene comparar", "Valor inesperado", "Separa lo dicho", "No continúes después de una negativa"]) assert.match(content, new RegExp(term, "i"));
});

test("registra diez herramientas funcionales y locales", () => {
  assert.equal(Object.keys(informationalToolLinks).length, 10);
  assert.equal(Object.keys(informationalToolConfigs).length, 10);
  assert.ok(Object.values(informationalToolConfigs).every((item) => item.path && item.fields.length && typeof item.build === "function"));
  assert.doesNotMatch(toolSource, /fetch\(|XMLHttpRequest|axios|WebSocket|localStorage|sessionStorage/);
});

test("las herramientas validan vacío, longitud y determinismo", () => {
  for (const config of Object.values(informationalToolConfigs)) assert.ok(Object.keys(config.build({}).errors).length > 0);
  const long = informationalToolConfigs.objective.build({ decision: "x".repeat(2001), hypothesis: "a", available: "b", missing: "c", nextDecision: "d" });
  assert.ok(long.errors.decision);
  const values = { decision: "elegir una transición", hypothesis: "necesito otra credencial", available: "descripciones públicas", missing: "trabajo cotidiano", nextDecision: "probar una tarea" };
  assert.deepEqual(informationalToolConfigs.objective.build(values), informationalToolConfigs.objective.build(values));
});

test("clasifica preguntas por reglas y advierte límites", () => {
  assert.match(classifyQuestion({ question: "¿Cuál es el requisito oficial?", purpose: "preparar investigación" }).output, /Público/);
  assert.match(classifyQuestion({ question: "¿Qué te sorprendió al comenzar?", purpose: "comprender experiencia" }).output, /Experiencial/);
  assert.match(classifyQuestion({ question: "¿Cómo ves las tensiones futuras?", purpose: "interpretar cambios" }).output, /Reflexivo/);
  assert.match(classifyQuestion({ question: "¿Cuál es el salario exacto de otra persona?", purpose: "comparar" }).output, /eliminarla/i);
});

test("el revisor detecta presión sin prometer comprensión perfecta", () => {
  const checked = reviewPressure({ draft: "Urgente: necesito que revises mi CV y me consigas trabajo. Insistiré hasta que respondas." });
  assert.match(checked.output, /empleo|urgencia|seguimiento repetido/i);
  assert.match(checked.warnings.join(" "), /no comprende perfectamente/i);
});

test("el decisor permite agradecer, esperar, actualizar y cerrar", () => {
  const base = { context: "contacto profesional", outcome: "conversación útil", acted: "sin cambios", elapsed: "dos semanas", reason: "sin novedad", previous: "un agradecimiento" };
  assert.match(decideFollowup(base).output, /ESPERAR/);
  assert.match(decideFollowup({ ...base, outcome: "la persona rechazó continuar" }).output, /NO VOLVER A CONTACTAR/);
  assert.match(decideFollowup({ ...base, acted: "apliqué el consejo y completé una prueba", reason: "compartir avance" }).output, /ACTUALIZACIÓN/);
});

test("integra hub, bibliotecas, módulos, herramientas y Aprende", () => {
  for (const term of ["InformationalHubPage", "InformationalLessonPage", "InformationalCasesPage", "InformationalResourcesPage", "InformationalToolsPage"]) assert.match(app, new RegExp(term));
  assert.match(data, /Entrevistas informativas.*published/);
  assert.match(pages, /LearningResource/);
  assert.match(pages, /WebApplication/);
});

test("incluye todas las rutas en sitemap con metadata y fecha", () => {
  for (const item of informationalLessons) assert.ok(sitemap.includes(`https://masanes.cl${item.href}`));
  for (const item of Object.values(informationalToolLinks)) assert.ok(sitemap.includes(`https://masanes.cl${item.href}`));
  assert.ok(sitemap.includes("https://masanes.cl/aprende/entrevistas-informativas/casos"));
  assert.ok(sitemap.includes("https://masanes.cl/aprende/entrevistas-informativas/recursos"));
  assert.match(pages, /16 de julio de 2026/);
});

test("formularios anuncian resultados y asocian errores", () => {
  for (const term of ["aria-live", "aria-invalid", "aria-describedby", "role=\"alert\"", "resetStatus", "htmlFor"]) assert.match(pages, new RegExp(term));
  assert.match(pages, /window\.print/);
  assert.match(pages, /CopyToClipboard/);
});

test("no promete contratación, referencias o resultados", () => {
  assert.doesNotMatch(content, /garantiza (empleo|entrevistas|referencias|contratación|éxito)/i);
  assert.match(content, /no es una entrevista de selección/i);
  assert.match(content, /no continúes después de una negativa/i);
});
