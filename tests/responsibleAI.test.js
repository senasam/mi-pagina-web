import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { responsibleAICases, responsibleAILessons, responsibleAIPath, responsibleAIResources } from "../src/responsibleAIContent.js";
import { assessImpact, buildInventory, buildTransparency, designGovernance, designOversight, mapImpact, planProtection, reviewFairness, reviewInclusion, reviewVendor, screenSensitive } from "../src/responsibleAITools.js";
import { tools, topicGroups } from "../src/contentData.js";

const fill = (keys, value = "Evidencia ficticia") => Object.fromEntries(keys.map((key) => [key, value]));

test("publica la ruta completa y once modulos revisados", () => {
  assert.equal(responsibleAIPath.title, "IA responsable y gobernanza");
  assert.equal(responsibleAILessons.length, 11);
  assert.equal(responsibleAILessons.at(-1).slug, "caso-integrador");
  assert.ok(responsibleAILessons.every((lesson) => lesson.status === "published" && lesson.lastReviewed === "2026-07-16" && lesson.timeSensitive));
});

test("incluye los nueve marcos originales y evita presentarlos como certificacion", () => {
  const content = JSON.stringify(responsibleAILessons);
  ["CUIDADO", "ALERTA", "PARES", "ESCUDO", "ABARCA", "VISIBLE", "RESPALDO", "HUELLA", "TRAMA"].forEach((name) => assert.match(content, new RegExp(name)));
  assert.match(content, /no (es|equivale a|certifica)|no prescribe/i);
});

test("cubre usos sensibles, equidad contextual y la opcion de no desplegar", () => {
  const content = JSON.stringify(responsibleAILessons);
  ["No proceder", "datos sensibles", "poblaciones vulnerables", "No existe un umbral universal", "impugnacion", "reparacion"].forEach((phrase) => assert.match(content.normalize("NFD").replace(/\p{Diacritic}/gu, ""), new RegExp(phrase, "i")));
});

test("publica veinticuatro escenarios ficticios y veintidos recursos", () => {
  assert.equal(responsibleAICases.length, 24);
  assert.ok(responsibleAICases.every((item) => item.fictional && item.oversight && item.contestability && item.remediation));
  assert.equal(responsibleAIResources.length, 22);
  assert.equal(new Set(responsibleAIResources.map((item) => item.id)).size, 22);
});

test("Learn y las once herramientas estan publicados", () => {
  const topic = topicGroups.flatMap((group) => group.topics).find((item) => item.slug === "ia-responsable-y-gobernanza");
  assert.equal(topic?.status, "published");
  const slugs = ["mapa-impacto-ia", "evaluar-uso-sensible-ia", "revision-equidad-ia", "plan-proteccion-ia", "evaluacion-impacto-ia", "disenar-supervision-humana-ia", "disenar-modelo-gobernanza-ia", "inventario-gobernanza-ia", "revision-inclusion-ia", "crear-nota-transparencia-ia", "evaluar-proveedor-ia"];
  assert.ok(slugs.every((slug) => tools.some((item) => item.slug === slug && item.status === "published")));
});

test("el mapa y el cribado sensible validan y pueden recomendar no avanzar", () => {
  assert.ok(mapImpact({}).errors.purpose);
  const impact = mapImpact(fill(["purpose", "users", "affected", "benefits", "burdens", "exclusions", "harms", "secondary", "owner", "evidence"]));
  assert.match(impact.output, /CUIDADO/);
  const sensitive = screenSensitive({ ...fill(["useCase", "affected", "data", "scale", "review", "action", "alternative"]), consequence: "Alta", vulnerable: "Si", reversibility: "Baja", challenge: "No" });
  assert.match(sensitive.output, /revision especializada|restringido/i);
  assert.ok(sensitive.warnings.length > 0);
});

test("equidad, proteccion, inclusion y transparencia generan planes cualitativos", () => {
  assert.match(reviewFairness(fill(["decision", "population", "coverage", "outcome", "errors", "groups", "workflow", "appeal", "monitoring", "alternative"])).output, /PARES/);
  assert.match(planProtection(fill(["useCase", "data", "users", "permissions", "integrations", "failures", "misuse", "monitoring", "fallback", "incidentOwner", "retention"])).output, /ESCUDO/);
  assert.match(reviewInclusion(fill(["users", "languages", "devices", "needs", "connectivity", "literacy", "alternative", "participants", "feedback", "exclusions"])).output, /ABARCA/);
  assert.match(buildTransparency(fill(["audience", "purpose", "data", "role", "uncertainty", "review", "limits", "challenge", "contact"])).output, /VISIBLE/);
});

test("impacto, supervision y gobierno conservan autoridad humana", () => {
  const assessment = assessImpact({ ...fill(["purpose", "affected", "benefits", "data", "fairness", "accessibility", "privacy", "security", "monitoring", "alternative"]), harms: "Grave", oversight: "Sin autoridad", challenge: "Sin canal" });
  assert.match(assessment.output, /no proceder|redisenar/i);
  assert.ok(assessment.warnings.length);
  assert.match(designOversight(fill(["decision", "finalOwner", "evidence", "timing", "authority", "alternative", "records", "challenge", "repair"])).output, /RESPALDO/);
  assert.match(designGovernance(fill(["scope", "decisions", "rules", "intake", "distributed", "monitoring", "incidents", "learning"])).output, /TRAMA/);
});

test("inventario y proveedor documentan ciclo de vida y salida", () => {
  assert.match(buildInventory(fill(["purpose", "owners", "capability", "users", "affected", "data", "review", "oversight", "assessment", "monitoring", "retirement"])).output, /INVENTARIO/);
  assert.match(reviewVendor(fill(["category", "purpose", "data", "changes", "testing", "accessibility", "incidents", "subprocessors", "deletion", "portability", "exit"])).output, /PROVEEDOR/);
});

test("rutas, SEO, privacidad y accesibilidad estan integrados", () => {
  const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  const page = readFileSync(new URL("../src/ResponsibleAIPages.jsx", import.meta.url), "utf8");
  const toolPage = readFileSync(new URL("../src/ResponsibleAIToolsPage.jsx", import.meta.url), "utf8");
  const logic = readFileSync(new URL("../src/responsibleAITools.js", import.meta.url), "utf8");
  assert.match(app, /ResponsibleAIHubPage/);
  responsibleAILessons.forEach((lesson) => assert.match(sitemap, new RegExp(lesson.href)));
  assert.match(page, /LearningResource/);
  assert.match(toolPage, /WebApplication/);
  assert.match(toolPage, /aria-live/);
  assert.match(toolPage, /aria-describedby/);
  assert.doesNotMatch(toolPage + logic, /fetch\(|XMLHttpRequest|localStorage|sessionStorage|sendBeacon/);
});
