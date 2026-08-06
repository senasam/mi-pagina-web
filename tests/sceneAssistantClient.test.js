import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSceneAiResult, parseSceneBeats, requestSceneSuggestion, splitAiRequestText } from "../src/novel-studio/sceneAssistant.js";

test("normaliza momentos clave separados por punto y coma, viñetas o números", () => {
  assert.deepEqual(parseSceneBeats("1. Encuentra el compás\n- Comprende el error; • Decide regresar"), [
    "Encuentra el compás", "Comprende el error", "Decide regresar",
  ]);
});

test("limita los resúmenes a 140 caracteres y cada momento clave a 80", () => {
  const summary = normalizeSceneAiResult("summary", "Rainiero descubre que el carruaje está mal equilibrado y decide regresar para corregirlo antes de que el problema provoque un accidente durante el largo viaje de vuelta a Madrid.");
  const beats = parseSceneBeats(`Rainiero examina cuidadosamente cada pieza del carruaje para descubrir por qué se inclina peligrosamente hacia un lado; ${"Tomás propone redistribuir todo el equipaje antes de continuar el viaje ".repeat(2)}`);
  assert.ok(summary.length <= 140);
  assert.ok(beats.every((beat) => beat.length <= 80));
});

test("divide cualquier solicitud extensa y sintetiza sus resultados parciales", async () => {
  const bodies = [];
  const suggestion = await requestSceneSuggestion({
    task: "codex-field",
    prose: Array.from({ length: 80 }, (_, index) => `Apartado ${index + 1}\n${"contenido ".repeat(180)}`).join("\n\n"),
    metadata: { title: "Descripción", summary: "Ficha extensa" },
    settings: { provider: "openai", apiKey: "test-key", model: "test-model" },
    fetchImpl: async (url, options) => { bodies.push(options.body); return new Response(JSON.stringify({ suggestion: `Resultado parcial ${bodies.length}` }), { status: 200 }); },
  });
  assert.match(suggestion, /Resultado parcial/);
  assert.ok(bodies.length > 2);
  assert.ok(bodies.every((body) => body.length < 75000));
});

test("reintenta en fragmentos menores si el servidor responde 413", async () => {
  let calls = 0;
  const prose = "x".repeat(30000);
  await requestSceneSuggestion({
    task: "summary", prose, metadata: {}, settings: { provider: "openai", apiKey: "test-key" },
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) return new Response(JSON.stringify({ error: "Demasiado grande", code: "PAYLOAD_TOO_LARGE" }), { status: 413 });
      return new Response(JSON.stringify({ suggestion: "Resumen parcial" }), { status: 200 });
    },
  });
  assert.ok(calls >= 4);
  assert.equal(splitAiRequestText(prose, 20000).length, 2);
});
