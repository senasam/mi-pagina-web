import test from "node:test";
import assert from "node:assert/strict";
import { buildSceneDesignFieldContext, normalizeSceneAiResult, parseSceneBeats, requestSceneSuggestion, splitAiRequestText } from "../src/novel-studio/sceneAssistant.js";
import { clearSessionCredentials, saveSessionCredential } from "../src/platform/ai/credentialClient.js";

function openAiSettings(model = "test-model") {
  clearSessionCredentials();
  const credentialRef = saveSessionCredential({ toolId: "novel-studio", provider: "openai", secret: "test-key" });
  return { provider: "openai", credentialRef, model };
}

test("construye el contexto OOTGR con la instrucción y la información circundante", () => {
  const context = buildSceneDesignFieldContext({
    targetLabel: "Objetivo",
    instruction: "¿Qué se intenta conseguir aquí?",
    currentValue: "",
    design: { oposicion: "La puerta está cerrada" },
    metadata: { summary: "Elena intenta entrar al archivo.", beats: ["Encuentra la puerta cerrada", "Busca otra entrada"] },
    prose: "Elena fuerza la cerradura sin éxito.",
    participants: [{ name: "Elena", description: "Archivera persistente que protege a su hermana." }],
  });
  assert.match(context, /INSTRUCCIÓN DEL CAMPO QUE DEBES RESPONDER: ¿Qué se intenta conseguir aquí\?/);
  assert.match(context, /Elena intenta entrar al archivo/);
  assert.match(context, /Encuentra la puerta cerrada/);
  assert.match(context, /Elena: Archivera persistente/);
  assert.match(context, /Elena fuerza la cerradura sin éxito/);
  assert.match(context, /Oposición: La puerta está cerrada/);
});

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
    settings: openAiSettings(),
    fetchImpl: async (url, options) => {
      assert.equal(url, "/api/ai/execute");
      assert.equal(options.headers.Authorization, "Bearer test-key");
      bodies.push(options.body);
      return new Response(JSON.stringify({ suggestion: `Resultado parcial ${bodies.length}` }), { status: 200 });
    },
  });
  assert.match(suggestion, /Resultado parcial/);
  assert.ok(bodies.length > 2);
  assert.ok(bodies.every((body) => body.length < 75000 && !body.includes("test-key")));
});

test("reintenta en fragmentos menores si el servidor responde 413", async () => {
  let calls = 0;
  const prose = "x".repeat(30000);
  await requestSceneSuggestion({
    task: "summary", prose, metadata: {}, settings: openAiSettings(),
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) return new Response(JSON.stringify({ error: "Demasiado grande", code: "PAYLOAD_TOO_LARGE" }), { status: 413 });
      return new Response(JSON.stringify({ suggestion: "Resumen parcial" }), { status: 200 });
    },
  });
  assert.ok(calls >= 4);
  assert.equal(splitAiRequestText(prose, 20000).length, 2);
});

test("explica qué límite ampliar y recomienda un nuevo valor", async () => {
  await assert.rejects(
    requestSceneSuggestion({
      task: "summary",
      prose: "Una escena que necesita resumen.",
      metadata: {},
      settings: { ...openAiSettings(), outputTokenLimit: 2200 },
      fetchImpl: async () => new Response(JSON.stringify({ error: "La respuesta alcanzó el límite de salida.", code: "AI_OUTPUT_LIMIT" }), { status: 422 }),
    }),
    (error) => {
      assert.equal(error.code, "AI_OUTPUT_LIMIT");
      assert.match(error.message, /límite de salida actual de 2200 tokens/i);
      assert.match(error.message, /Máximo de salida.*4096 tokens/i);
      assert.match(error.message, /No necesitas modificar.*Máximo de entrada/i);
      return true;
    },
  );
});
