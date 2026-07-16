import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { communicationLessons, communicationPath, communicationResources, communicationScenarios } from "../src/communicationContent.js";
import { buildAudienceMap, buildCommunicationPurpose, buildInsight, buildListeningPractice, buildMeetingPlan, buildMessageStructure, buildNarrative, buildPresentationPlan } from "../src/communicationTools.js";
import { tools, topicGroups } from "../src/contentData.js";

test("publica nueve módulos sustantivos y un caso integrador",()=>{
 assert.equal(communicationLessons.length,9);assert.equal(communicationPath.status,"published");assert.equal(communicationLessons.at(-1).slug,"caso-integrador");
 assert.ok(communicationLessons.every((item)=>item.status==="published"&&item.sections.length>=6&&item.outcomes.length>=3));
});

test("incluye todos los marcos originales y distinciones centrales",()=>{
 const text=JSON.stringify(communicationLessons);["MAREA","CAPTA","FIN","DICA","NÚCLEO","CAMBIO","VIVA","AFO","Dato","Información","Hallazgo","Insight","Recomendación","Resumen","Síntesis"].forEach((term)=>assert.match(text,new RegExp(term,"i")));
});

test("publica quince escenarios ficticios completos",()=>{
 assert.equal(communicationScenarios.length,15);assert.equal(new Set(communicationScenarios.map((item)=>item.slug)).size,15);
 assert.ok(communicationScenarios.every((item)=>item.fictional&&item.audience.length&&item.purpose&&item.evidence.length&&item.constraints.length&&item.modelResponse&&item.explanation.length));
});

test("publica quince recursos y resuelve todas las relaciones",()=>{
 assert.equal(communicationResources.length,15);const ids=new Set(communicationResources.map((item)=>item.id));
 assert.ok(communicationResources.every((item)=>item.status==="published"));assert.ok(communicationLessons.every((item)=>item.relatedResources.every((id)=>ids.has(id))));
});

test("Learn y el catálogo publican la ruta y ocho herramientas",()=>{
 const topic=topicGroups.flatMap((group)=>group.topics).find((item)=>item.slug==="comunicacion-profesional");assert.equal(topic.status,"published");
 const slugs=["mapa-audiencia","practica-escucha-activa","definir-proposito-comunicacion","convertir-datos-en-insight","estructurar-mensaje","constructor-narrativa-profesional","preparar-presentacion","planificar-reunion"];
 assert.ok(slugs.every((slug)=>tools.some((item)=>item.slug===slug&&item.status==="published")));
});

test("mapa de audiencia valida y evita perfil psicológico",()=>{
 assert.ok(buildAudienceMap({}).errors.topic);const value=buildAudienceMap({topic:"cambio de fecha",role:"ventas",knowledge:"Medio",position:"requiere claridad",interests:"informar clientes",authority:"influye",channel:"Videollamada",assumptions:"conoce la dependencia"});
 assert.match(value.output,/PREGUNTAS CLAVE/);assert.match(value.output,/No confundas rol/);
});

test("práctica CAPTA genera autoevaluación sin puntuación",()=>{
 assert.ok(buildListeningPractice({}).errors.scenario);const value=buildListeningPractice({scenario:"Cambio de alcance",response:"¿Qué cambió y qué efecto tuvo?"});assert.match(value.output,/CAPTA/);assert.match(value.output,/No existe una respuesta universalmente empática/);
});

test("FIN define finalidad, relevancia y siguiente paso",()=>{
 const value=buildCommunicationPurpose({topic:"piloto",audience:"equipo",time:"30 minutos",objective:"elegir alcance",audienceNeed:"proteger capacidad",action:"acordar una opción"});assert.deepEqual(value.errors,{});assert.match(value.output,/PROPÓSITO FIN/);assert.match(value.output,/AGENDA SUGERIDA/);
});

test("DICA separa evidencia e interpretación",()=>{
 const value=buildInsight({purpose:"decidir piloto",audience:"dirección",facts:"subió el primer uso",pattern:"el cambio se concentra en cuentas nuevas",explanation:"la orientación inicial puede ayudar",consequence:"conviene probar antes de escalar"});assert.match(value.output,/DICA/);assert.match(value.output,/interpretación no es un hecho/i);
});

test("NÚCLEO genera versiones por canal",()=>{
 const value=buildMessageStructure({channel:"Correo",audience:"dirección",purpose:"cerrar alcance",message:"Recomendamos un piloto",reasons:"reduce riesgo y carga",evidence:"dos cohortes comparables",action:"aprobar dos cuentas"});assert.match(value.output,/ESTRUCTURA NÚCLEO/);assert.match(value.output,/VERSIÓN BREVE/);assert.match(value.output,/VERSIÓN AMPLIADA/);
});

test("CAMBIO y VIVA mantienen cautelas factuales y de accesibilidad",()=>{
 const narrative=buildNarrative({audience:"cliente",context:"prueba inicial",change:"aumentó soporte",importance:"limita escala",insight:"la ayuda manual explica parte del efecto",response:"simplificar",outcome:"validar capacidad",channel:"Presentación"});assert.match(narrative.output,/NARRATIVA CAMBIO/);assert.match(narrative.output,/resultado garantizado/);
 const presentation=buildPresentationPlan({audience:"equipo",purpose:"decidir",duration:"10 minutos",message:"probar primero",points:"evidencia y riesgo",opening:"Hoy decidiremos",closing:"Acordemos responsable",channel:"Videollamada"});assert.match(presentation.output,/VIVA/);assert.match(presentation.output,/no es obligatorio/i);assert.match(presentation.output,/universalmente correcto/i);
});

test("AFO genera apertura, participación y registro",()=>{
 const value=buildMeetingPlan({topic:"prioridad",participants:"producto y ventas",time:"40 minutos",outcome:"elegir piloto",owner:"dirección",scope:"dos opciones",questions:"¿qué criterio domina?",actions:"asignar piloto"});assert.match(value.output,/PLAN AFO/);assert.match(value.output,/REGISTRO/);assert.match(value.output,/reflexión individual/);
});

test("routing, sitemap, accesibilidad y privacidad están declarados",()=>{
 const app=readFileSync(new URL("../src/App.jsx",import.meta.url),"utf8");const sitemap=readFileSync(new URL("../public/sitemap.xml",import.meta.url),"utf8");const page=readFileSync(new URL("../src/CommunicationToolsPage.jsx",import.meta.url),"utf8");
 assert.match(app,/CommunicationHubPage/);communicationLessons.forEach((item)=>assert.match(sitemap,new RegExp(item.href)));assert.match(page,/aria-live/);assert.match(page,/aria-describedby/);assert.doesNotMatch(page,/fetch\(|XMLHttpRequest|localStorage|sessionStorage|sendBeacon/);
});
