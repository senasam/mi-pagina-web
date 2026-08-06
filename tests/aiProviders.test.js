import test from "node:test";
import assert from "node:assert/strict";
import {
  buildChatGptManualPrompt, chooseOllamaModel, listOllamaModels, normalizeChatGptUrl, normalizeOllamaUrl,
  ollamaOriginCommand, pullOllamaModel, requestOllamaSuggestion,
} from "../src/novel-studio/aiProviders.js";

test("selects an installed Ollama model automatically", () => {
  const models = [{ name: "qwen3:8b" }, { name: "llama3.2:3b" }];
  assert.equal(chooseOllamaModel(models, "qwen3:4b"), "qwen3:8b");
  assert.equal(chooseOllamaModel(models, "llama3.2:3b"), "llama3.2:3b");
  assert.equal(chooseOllamaModel([], ""), "qwen3:4b");
});

test("Ollama connections are restricted to the local computer", () => {
  assert.equal(normalizeOllamaUrl("http://localhost:11434/"), "http://localhost:11434");
  assert.throws(() => normalizeOllamaUrl("https://example.com"), /mismo PC/);
  assert.throws(() => normalizeOllamaUrl("http://192.168.1.10:11434"), /mismo PC/);
});

test("lists locally installed Ollama models", async () => {
  const models = await listOllamaModels("http://localhost:11434", async () => new Response(JSON.stringify({ models: [{ name: "qwen3:8b", size: 5200000000, details: { parameter_size: "8B" } }] }), { status: 200 }));
  assert.deepEqual(models, [{ name: "qwen3:8b", size: 5200000000, parameterSize: "8B" }]);
});

test("generates a local suggestion without contacting the hosted API", async () => {
  let request;
  const suggestion = await requestOllamaSuggestion({
    task: "title", prose: "Elena encuentra una carta.", metadata: {},
    settings: { ollamaUrl: "http://localhost:11434", ollamaModel: "qwen3:4b" },
    fetchImpl: async (url, options) => { request = { url, body: JSON.parse(options.body) }; return new Response(JSON.stringify({ response: "“La carta de Elena”" }), { status: 200 }); },
  });
  assert.equal(suggestion, "La carta de Elena");
  assert.equal(request.url, "http://localhost:11434/api/generate");
  assert.equal(request.body.stream, false);
  assert.equal(request.body.model, "qwen3:4b");
});

test("reports streamed Ollama model installation progress", async () => {
  const updates = [];
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('{"status":"pulling manifest"}\n{"status":"downloading","completed":50,"total":100}\n'));
      controller.enqueue(new TextEncoder().encode('{"status":"success"}\n'));
      controller.close();
    },
  });
  const result = await pullOllamaModel({
    baseUrl: "http://localhost:11434", model: "qwen3:4b", onProgress: (update) => updates.push(update),
    fetchImpl: async (url, options) => {
      assert.equal(url, "http://localhost:11434/api/pull");
      assert.deepEqual(JSON.parse(options.body), { model: "qwen3:4b", stream: true });
      return new Response(stream, { status: 200 });
    },
  });
  assert.equal(updates[1].percent, 50);
  assert.equal(result.percent, 100);
});

test("manual ChatGPT prompt contains the scene and no hidden credentials", () => {
  const prompt = buildChatGptManualPrompt("summary", "La escena de prueba.", { title: "Prueba" });
  assert.match(prompt, /La escena de prueba/);
  assert.match(prompt, /Resume esta escena/);
});

test("manual ChatGPT URL accepts projects and rejects unsafe destinations", () => {
  assert.equal(normalizeChatGptUrl(" https://chatgpt.com/g/g-p-example/project "), "https://chatgpt.com/g/g-p-example/project");
  assert.throws(() => normalizeChatGptUrl("http://chatgpt.com/project"), /HTTPS/);
  assert.throws(() => normalizeChatGptUrl("https://chatgpt.com.example/project"), /chatgpt.com/);
  assert.throws(() => normalizeChatGptUrl("javascript:alert(1)"), /chatgpt.com/);
});

test("origin command allows only the current site without wildcard", () => {
  const command = ollamaOriginCommand("https://novelas.example");
  assert.match(command, /https:\/\/novelas\.example/);
  assert.doesNotMatch(command, /OLLAMA_ORIGINS=\*/);
});
