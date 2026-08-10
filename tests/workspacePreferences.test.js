import test from "node:test";
import assert from "node:assert/strict";
import { normalizePreferences } from "../src/novel-studio/LocalWorkspaceRepository.js";

test("workspace preferences preserve the explicitly stored OpenAI key", () => {
  const preferences = normalizePreferences({ ai: { enabled: true, apiKey: "sk-local-test", model: "gpt-5.6-terra" } });
  assert.deepEqual(preferences.ai, { provider: "openai", enabled: true, credentialRef: null, model: "gpt-5.6-terra", ollamaUrl: "http://localhost:11434", ollamaModel: "qwen3:4b", manualUrl: "https://chatgpt.com/", inputTokenLimit: 12000, outputTokenLimit: 2200, apiKey: "sk-local-test" });
  assert.equal(preferences.schemaVersion, 2);
  assert.equal(JSON.stringify(preferences).includes("sk-local-test"), true);
  assert.equal(normalizePreferences().ai.model, "gpt-5.6-luna");
});

test("workspace preferences normalize configurable AI length limits", () => {
  assert.deepEqual(normalizePreferences({ ai: { inputTokenLimit: 8192, outputTokenLimit: 4096 } }).ai.inputTokenLimit, 8192);
  assert.equal(normalizePreferences({ ai: { inputTokenLimit: 1, outputTokenLimit: 999999 } }).ai.inputTokenLimit, 512);
  assert.equal(normalizePreferences({ ai: { inputTokenLimit: 1, outputTokenLimit: 999999 } }).ai.outputTokenLimit, 16384);
});

test("workspace preferences preserve Ollama and manual providers", () => {
  const local = normalizePreferences({ ai: { provider: "ollama", enabled: true, ollamaUrl: "http://127.0.0.1:11434", ollamaModel: "qwen3:8b" } });
  assert.equal(local.ai.provider, "ollama");
  assert.equal(local.ai.ollamaModel, "qwen3:8b");
  assert.equal(normalizePreferences({ ai: { provider: "chatgpt-manual" } }).ai.provider, "chatgpt-manual");
  assert.equal(normalizePreferences({ ai: { provider: "chatgpt-manual", manualUrl: "https://chatgpt.com/g/g-p-example/project" } }).ai.manualUrl, "https://chatgpt.com/g/g-p-example/project");
});

test("workspace preferences retain legacy device references and an empty file key", () => {
  const credentialRef = { id: "novel-studio:openai", toolId: "novel-studio", provider: "openai", scope: "device" };
  const preferences = normalizePreferences({ ai: { provider: "openai", enabled: true, credentialRef } });
  assert.deepEqual(preferences.ai.credentialRef, credentialRef);
  assert.equal(preferences.ai.apiKey, "");
});
