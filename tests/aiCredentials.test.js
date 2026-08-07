import test from "node:test";
import assert from "node:assert/strict";
import { executeAiTask } from "../src/platform/ai/aiClient.js";
import {
  clearSessionCredentials, hasSessionCredential, removeSessionCredential, saveSessionCredential, sessionCredentialStatus,
} from "../src/platform/ai/credentialClient.js";

test("separates session credentials by tool and provider without exposing them in status", () => {
  clearSessionCredentials();
  const ref = saveSessionCredential({ toolId: "novel-studio", provider: "openai", secret: "secret-a" });
  saveSessionCredential({ toolId: "other-tool", provider: "openai", secret: "secret-b" });
  assert.equal(hasSessionCredential({ toolId: "novel-studio", provider: "openai", credentialRef: ref }), true);
  assert.equal(sessionCredentialStatus({ toolId: "novel-studio", provider: "openai", credentialRef: ref }).configured, true);
  assert.equal(JSON.stringify(sessionCredentialStatus({ toolId: "novel-studio", provider: "openai", credentialRef: ref })).includes("secret-a"), false);
  removeSessionCredential({ toolId: "novel-studio", provider: "openai", credentialRef: ref });
  assert.equal(hasSessionCredential({ toolId: "novel-studio", provider: "openai", credentialRef: ref }), false);
  assert.equal(hasSessionCredential({ toolId: "other-tool", provider: "openai" }), true);
});

test("sends a session credential only in the authorization header", async () => {
  clearSessionCredentials();
  const credentialRef = saveSessionCredential({ toolId: "novel-studio", provider: "openai", secret: "header-only-secret" });
  let captured;
  const result = await executeAiTask({
    toolId: "novel-studio", capability: "scene-assistant", provider: "openai", credentialRef,
    input: { task: "title", prose: "Una escena" },
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return new Response(JSON.stringify({ suggestion: "Título" }), { status: 200 });
    },
  });
  assert.equal(result.suggestion, "Título");
  assert.equal(captured.options.headers.Authorization, "Bearer header-only-secret");
  assert.equal(captured.options.body.includes("header-only-secret"), false);
});
