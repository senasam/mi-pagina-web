import test from "node:test";
import assert from "node:assert/strict";
import { AiExecuteError, bearerCredential, executeAiRequest } from "../api/ai/execute.js";

function openAiResponse(text) {
  return new Response(JSON.stringify({ output: [{ type: "message", content: [{ type: "output_text", text }] }] }), { status: 200 });
}

test("validates the shared AI route and bearer credential", () => {
  assert.equal(bearerCredential("Bearer session-secret"), "session-secret");
  assert.throws(() => bearerCredential(""), (error) => error instanceof AiExecuteError && error.code === "AI_CREDENTIAL_REQUIRED");
});

test("routes a Novel Studio task through the provider adapter", async () => {
  let authorization;
  const result = await executeAiRequest({
    authorization: "Bearer provider-secret",
    body: {
      toolId: "novel-studio",
      capability: "scene-assistant",
      provider: "openai",
      model: "test-model",
      input: { task: "title", prose: "Elena encuentra una carta." },
    },
    fetchImpl: async (url, options) => {
      authorization = options.headers.Authorization;
      assert.equal(options.body.includes("provider-secret"), false);
      return openAiResponse("La carta de Elena");
    },
  });
  assert.equal(authorization, "Bearer provider-secret");
  assert.equal(result.suggestion, "La carta de Elena");
});

test("rejects unregistered tool and provider combinations", async () => {
  await assert.rejects(
    executeAiRequest({ authorization: "Bearer secret", body: { toolId: "unknown", capability: "scene-assistant", provider: "openai", input: {} } }),
    (error) => error instanceof AiExecuteError && error.code === "UNSUPPORTED_AI_ROUTE",
  );
});
