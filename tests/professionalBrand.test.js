import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { brandBase, brandCases, brandLessons, brandResources, brandToolLinks } from "../src/professionalBrandContent.js";
import { professionalBrandToolConfigs, runProfessionalBrandTool } from "../src/professionalBrandTools.js";

const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const pages = fs.readFileSync(new URL("../src/ProfessionalBrandPages.jsx", import.meta.url), "utf8");
const contentData = fs.readFileSync(new URL("../src/contentData.js", import.meta.url), "utf8");
const sitemap = fs.readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
const allContent = JSON.stringify(brandLessons);

test("publica diez módulos sustantivos y revisados", () => {
  assert.equal(brandLessons.length, 10);
  assert.equal(new Set(brandLessons.map((x) => x.slug)).size, 10);
  for (const item of brandLessons) { assert.ok(item.sections.length >= 4); assert.equal(item.lastReviewed, "2026-07-16"); assert.match(item.href, /^\/aprende\/marca-profesional\//); }
});

test("distingue identidad reputación posicionamiento narrativa evidencia y visibilidad", () => {
  for (const term of ["identidad", "reputación", "posicionamiento", "narrativa", "evidencia", "visibilidad"]) assert.match(allContent, new RegExp(term, "i"));
  assert.match(allContent, /Lo que una marca profesional no es/i);
  assert.match(allContent, /no es un logotipo|logo/i);
});

test("incluye modelos originales y cautelas", () => {
  for (const term of ["Sistema de señales profesionales", "Cadena afirmación–prueba–contexto", "Origen, patrón, aporte y dirección", "Mapa de coherencia", "Capturar"]) assert.match(allContent, new RegExp(term, "i"));
  assert.match(allContent, /no es un estándar, una certificación ni una garantía/i);
});

test("cubre CV perfil público LinkedIn canales revisión y mantenimiento", () => {
  for (const term of ["CV", "perfil público", "LinkedIn", "revisión", "mantenimiento", "privacidad"]) assert.match(allContent, new RegExp(term, "i"));
  assert.match(allContent, /no existe una regla universal de una página/i);
  assert.match(allContent, /no afirma que completar campos, publicar o repetir palabras clave mejore/i);
});

test("publica 26 casos ficticios completos", () => {
  assert.equal(brandCases.length, 26);
  for (const item of brandCases) { assert.equal(item.label, "Caso ficticio creado con fines educativos."); assert.ok(item.evidence.length); assert.ok(item.actions.length); assert.ok(item.risks.length); assert.equal(item.fictional, true); }
});

test("publica caso integrado y catorce recursos editables", () => {
  assert.match(allContent, /Proyecto Trama/); assert.match(allContent, /Quince decisiones del caso/);
  assert.equal(brandResources.length, 14); for (const item of brandResources) { assert.equal(item.contentType, "worksheet"); assert.ok(item.fields.length >= 5); assert.match(item.reminder, /anónimas/i); }
});

test("registra diez herramientas funcionales y locales", () => {
  assert.equal(Object.keys(brandToolLinks).length, 10); assert.equal(Object.keys(professionalBrandToolConfigs).length, 10);
  for (const tool of Object.values(professionalBrandToolConfigs)) { assert.match(tool.path, /^\/herramientas\//); assert.equal(typeof tool.build, "function"); assert.ok(tool.fields.length); }
});

test("valida vacío longitud y produce resultados deterministas", () => {
  for (const [kind, tool] of Object.entries(professionalBrandToolConfigs)) {
    const empty=runProfessionalBrandTool(kind,{}); assert.ok(Object.keys(empty.errors).length);
    const values=Object.fromEntries(tool.fields.map(([name,,type,options])=>[name,type==="select"?options[0]:"Contexto profesional ficticio con evidencia"]));
    const first=runProfessionalBrandTool(kind,values); const second=runProfessionalBrandTool(kind,values); assert.deepEqual(first,second); assert.ok(first.output.length>30);
    const firstName=tool.fields[0][0]; const long=runProfessionalBrandTool(kind,{...values,[firstName]:"x".repeat(2001)}); assert.ok(long.errors[firstName]);
  }
});

test("el revisor de lenguaje usa reglas y declara límites", () => {
  const result=runProfessionalBrandTool("language",{text:"Profesional estratégico, innovador, experto y orientado a resultados"});
  assert.match(result.output,/prueba|evidencia/i); assert.match(result.warnings.join(" "),/no comprenden intención|reglas/i);
});

test("el comparador separa coincidencias de comprobación humana", () => {
  const result=runProfessionalBrandTool("compare",{cv:"Coordino proyectos de operaciones",profile:"Coordino proyectos y analizo operaciones",spoken:"Coordino proyectos con equipos de operaciones"});
  assert.match(result.output,/SEÑALES COMPARTIDAS/); assert.match(result.output,/COMPROBACIÓN HUMANA/); assert.match(result.warnings.join(" "),/no demuestra coherencia/i);
});

test("integra rutas catálogo y 404 heredado", () => {
  assert.match(app,/ProfessionalBrandHubPage/); assert.match(app,/ProfessionalBrandCasesPage/); assert.match(app,/professionalBrandTools/); assert.match(app,/NotFoundPage/);
  assert.match(contentData,/Marca profesional/); assert.match(contentData,/\/aprende\/marca-profesional/);
});

test("incluye todas las rutas en sitemap sin duplicados", () => {
  const required=[brandBase,...brandLessons.map((x)=>x.href),`${brandBase}/casos`,`${brandBase}/recursos`,...Object.values(brandToolLinks).map((x)=>x.href)];
  for (const path of required) assert.match(sitemap,new RegExp(`https://masanes\\.cl${path.replaceAll("/","\\/")}`));
  const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((x)=>x[1]); assert.equal(new Set(urls).size,urls.length);
});

test("formularios asocian errores y anuncian resultados", () => {
  assert.match(pages,/aria-live="polite"/); assert.match(pages,/aria-invalid/); assert.match(pages,/aria-describedby/); assert.match(pages,/role="alert"/); assert.match(pages,/maxLength="2000"/);
  assert.match(pages,/CopyToClipboard/); assert.match(pages,/window\.print/); assert.match(pages,/Formulario y resultado reiniciados/);
});

test("no usa red persistencia ni afirmaciones prohibidas", () => {
  const files=[fs.readFileSync(new URL("../src/professionalBrandContent.js",import.meta.url),"utf8"),fs.readFileSync(new URL("../src/professionalBrandTools.js",import.meta.url),"utf8"),pages].join("\n");
  assert.doesNotMatch(files,/fetch\(|XMLHttpRequest|axios|WebSocket|localStorage|sessionStorage/);
  assert.doesNotMatch(files,/garantiza (empleo|contratación|entrevistas|visibilidad)|domina el algoritmo/i);
  assert.match(files,/no (evalúa|predice).*empleabilidad|no evalúa reputación/i);
});
