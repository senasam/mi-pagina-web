import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { practiceProblems, problemSolvingLessons, problemSolvingPath, problemSolvingResources } from "../src/problemSolvingContent.js";
import { buildBiasReview, buildLogicTree, buildProblemDefinition, buildRecommendation, buildWorkPlan, diagnoseProblemType, prioritizeAnalysis } from "../src/problemSolvingTools.js";
import { tools, topicGroups } from "../src/contentData.js";

test("publica ocho módulos sustantivos y un caso integrador",()=>{
  assert.equal(problemSolvingLessons.length,8); assert.equal(problemSolvingPath.status,"published");
  assert.ok(problemSolvingLessons.every((item)=>item.status==="published"&&item.sections.length>=6&&item.outcomes.length>=3));
  assert.equal(problemSolvingLessons.at(-1).slug,"caso-integrador");
});

test("incluye marcos, hipótesis, evidencia y colaboración",()=>{
  const text=JSON.stringify(problemSolvingLessons); ["CLARO","VERA","HIA","DECIR","hipótesis","árbol","Pensamiento grupal","Incógnita"].forEach((term)=>assert.match(text,new RegExp(term,"i")));
});

test("incluye doce problemas ficticios completos",()=>{
  assert.equal(practiceProblems.length,12); assert.equal(new Set(practiceProblems.map((item)=>item.slug)).size,12);
  assert.ok(practiceProblems.every((item)=>item.fictional&&item.decision&&item.constraints.length&&item.possibleHypotheses.length>=2&&item.modelInsights.length));
});

test("publica catorce recursos y resuelve sus relaciones",()=>{
  assert.ok(problemSolvingResources.length>=14); const ids=new Set(problemSolvingResources.map((item)=>item.id));
  assert.ok(problemSolvingResources.every((item)=>item.status==="published"));
  assert.ok(problemSolvingLessons.every((item)=>item.relatedResources.every((id)=>ids.has(id))));
});

test("Learn y herramientas registran las nuevas rutas",()=>{
  const topic=topicGroups.flatMap((group)=>group.topics).find((item)=>item.slug==="resolucion-de-problemas"); assert.equal(topic.status,"published");
  const slugs=["diagnostico-tipo-problema","definir-problema","constructor-arbol-problemas","priorizar-analisis","plan-trabajo-problema","constructor-recomendaciones","revision-sesgos-decision"];
  assert.ok(slugs.every((slug)=>tools.some((item)=>item.slug===slug&&item.status==="published")));
});

test("diagnóstico valida y ofrece una orientación cauta",()=>{
  assert.ok(diagnoseProblemType({}).errors.urgency); const result=diagnoseProblemType({urgency:"Alto",consequence:"Alto",data:"Bajo",stakeholders:"Alto",reversibility:"Baja",uncertainty:"Alto",creativity:"Medio",duration:"Alto"});
  assert.match(result.output,/extendida/); assert.match(result.output,/no es un diagnóstico/i); assert.ok(result.warnings.length);
});

test("definición genera pregunta y revisión CLARO",()=>{
  assert.ok(buildProblemDefinition({}).errors.situation); const result=buildProblemDefinition({situation:"bajó el uso",decision:"la intervención inicial",outcome:"mejorar adopción",horizon:"este trimestre"});
  assert.match(result.output,/REVISIÓN CLARO/); assert.match(result.output,/mejorar adopción/);
});

test("árbol detecta ramas insuficientes y produce checklist",()=>{
  const result=buildLogicTree({question:"¿Qué explica la demora?",type:"Causas",branches:"capacidad",evidence:"tiempos por etapa"}); assert.match(result.output,/ÁRBOL LÓGICO/); assert.ok(result.warnings.length);
});

test("VERA agrupa sin presentar precisión falsa",()=>{
  const result=prioritizeAnalysis({question:"Validar medición",value:"Alto",evidence:"Alto",risk:"Alto",effort:"Bajo",urgency:"Medio"}); assert.match(result.output,/Primero/); assert.match(result.output,/orientación cualitativa/);
});

test("plan y recomendación validan y generan salidas",()=>{
  assert.ok(buildWorkPlan({}).errors.workstream); const plan=buildWorkPlan({workstream:"Medición",question:"¿Está bien medida?",hypothesis:"hay un cambio",analysis:"auditoría",owner:"Analista",due:"viernes"}); assert.match(plan.output,/CONTROL DE EVIDENCIA/);
  const rec=buildRecommendation({question:"¿Qué hacer?",decision:"probar una mejora",findings:"la fricción se concentra al inicio",evidence:"cohortes y entrevistas",next:"piloto acotado",owner:"Producto"}); assert.match(rec.output,/HIA/); assert.match(rec.output,/DECIR/);
});

test("revisión de decisión incluye evidencia contraria",()=>{
  const result=buildBiasReview({decision:"lanzar piloto",preferred:"hay demanda",alternatives:"esperar",supporting:"entrevistas",contradicting:"uso bajo",assumptions:"capacidad disponible",review:"fin de mes"}); assert.match(result.output,/Evidencia en contra/); assert.match(result.output,/no diagnostica/i);
});

test("routing, sitemap, accesibilidad y privacidad están declarados",()=>{
  const app=readFileSync(new URL("../src/App.jsx",import.meta.url),"utf8"); const sitemap=readFileSync(new URL("../public/sitemap.xml",import.meta.url),"utf8"); const page=readFileSync(new URL("../src/ProblemSolvingToolsPage.jsx",import.meta.url),"utf8");
  assert.match(app,/ProblemSolvingHubPage/); problemSolvingLessons.forEach((item)=>assert.match(sitemap,new RegExp(item.href))); assert.match(page,/aria-live/); assert.doesNotMatch(page,/fetch\(|XMLHttpRequest|localStorage|sessionStorage|sendBeacon/);
});
