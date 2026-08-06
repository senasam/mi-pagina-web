import test from "node:test";
import assert from "node:assert/strict";
import { generateSceneSuggestion, SceneAssistantError } from "../api/novel-studio/scene-assistant.js";

function openAiResponse(text, status = 200) {
  return new Response(JSON.stringify({
    output: [{ type: "message", content: [{ type: "output_text", text }] }],
  }), { status, headers: { "Content-Type": "application/json" } });
}

test("genera un título usando Responses API sin incluir la clave en el cuerpo", async () => {
  let captured;
  const result = await generateSceneSuggestion({
    task: "title",
    prose: "Elena descubre la carta bajo la puerta y decide marcharse.",
    apiKey: "server-secret",
    fetchImpl: async (url, options) => { captured = { url, options }; return openAiResponse("“La carta bajo la puerta”"); },
  });
  assert.equal(result.suggestion, "La carta bajo la puerta");
  assert.equal(captured.url, "https://api.openai.com/v1/responses");
  assert.equal(captured.options.headers.Authorization, "Bearer server-secret");
  assert.equal(JSON.parse(captured.options.body).model, "gpt-5.6-luna");
  assert.equal(captured.options.body.includes("server-secret"), false);
});

test("genera un resumen y conserva el texto devuelto", async () => {
  const result = await generateSceneSuggestion({
    task: "summary",
    prose: "Tomás cruza el puente. La tormenta destruye el camino de regreso.",
    apiKey: "test-key",
    fetchImpl: async () => openAiResponse("Tomás cruza el puente antes de que la tormenta destruya su única ruta de regreso."),
  });
  assert.match(result.suggestion, /Tomás cruza/);
  assert.equal(result.task, "summary");
});

test("genera un título de capítulo con una instrucción específica", async () => {
  let body;
  const result = await generateSceneSuggestion({
    task: "chapter-title",
    prose: "Novela: El umbral\nActo: La partida\nEscenas: Elena encuentra la carta y abandona la casa.",
    title: "Capítulo 1",
    apiKey: "test-key",
    fetchImpl: async (url, options) => { body = JSON.parse(options.body); return openAiResponse("“La carta del umbral”"); },
  });
  assert.equal(result.suggestion, "La carta del umbral");
  assert.equal(result.task, "chapter-title");
  assert.match(body.input[1].content, /título evocador y específico para este capítulo/i);
});

test("rechaza escenas vacías antes de llamar a OpenAI", async () => {
  let called = false;
  await assert.rejects(
    generateSceneSuggestion({ task: "summary", prose: "   ", apiKey: "test-key", fetchImpl: async () => { called = true; } }),
    (error) => error instanceof SceneAssistantError && error.code === "EMPTY_SCENE" && error.status === 400,
  );
  assert.equal(called, false);
});

test("explica cuando falta la configuración del servidor", async () => {
  await assert.rejects(
    generateSceneSuggestion({ task: "title", prose: "Una escena", apiKey: "" }),
    (error) => error instanceof SceneAssistantError && error.code === "AI_NOT_CONFIGURED" && error.status === 503,
  );
});

test("no expone el detalle del proveedor cuando OpenAI falla", async () => {
  await assert.rejects(
    generateSceneSuggestion({ task: "summary", prose: "Una escena", apiKey: "test-key", fetchImpl: async () => new Response("private provider detail", { status: 500 }) }),
    (error) => error instanceof SceneAssistantError && error.code === "AI_RESPONSE_ERROR" && !error.message.includes("private"),
  );
});
