import test from "node:test";
import assert from "node:assert/strict";
import { normalizePreferences } from "../src/novel-studio/LocalWorkspaceRepository.js";

test("workspace preferences keep local AI configuration with safe defaults", () => {
  const preferences = normalizePreferences({ ai: { enabled: true, apiKey: "sk-local-test", model: "gpt-5.6-terra" } });
  assert.deepEqual(preferences.ai, { provider: "openai", enabled: true, apiKey: "sk-local-test", model: "gpt-5.6-terra", ollamaUrl: "http://localhost:11434", ollamaModel: "qwen3:4b", manualUrl: "https://chatgpt.com/" });
  assert.equal(normalizePreferences().ai.model, "gpt-5.6-luna");
});

test("workspace preferences preserve Ollama and manual providers", () => {
  const local = normalizePreferences({ ai: { provider: "ollama", enabled: true, ollamaUrl: "http://127.0.0.1:11434", ollamaModel: "qwen3:8b" } });
  assert.equal(local.ai.provider, "ollama");
  assert.equal(local.ai.ollamaModel, "qwen3:8b");
  assert.equal(normalizePreferences({ ai: { provider: "chatgpt-manual" } }).ai.provider, "chatgpt-manual");
  assert.equal(normalizePreferences({ ai: { provider: "chatgpt-manual", manualUrl: "https://chatgpt.com/g/g-p-example/project" } }).ai.manualUrl, "https://chatgpt.com/g/g-p-example/project");
});
