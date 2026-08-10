import test from "node:test";
import assert from "node:assert/strict";

import { isTerminalJob, normalizePercentage } from "../src/platform/local-agent/contracts.js";
import { parseEventBlock } from "../src/platform/local-agent/events.js";
import {
  AGENT_TOKEN_KEY,
  AGENT_SESSION_KEY,
  AgentClient,
  LEGACY_AGENT_TOKEN_KEYS,
  agentFetch,
} from "../src/platform/local-agent/client.js";
import { createInstagramClient } from "../src/platform/local-agent/capabilities/instagram.js";
import { createMusicClient } from "../src/platform/local-agent/capabilities/music.js";

test("local agent parses SSE blocks and ignores heartbeats", () => {
  const parsed = parseEventBlock('id: 4\nevent: progress\ndata: {"percentage":42}\n');
  assert.equal(parsed.id, "4");
  assert.equal(parsed.type, "progress");
  assert.deepEqual(parsed.data, { percentage: 42 });
  assert.equal(parseEventBlock(": heartbeat"), null);
});

test("local agent normalizes state and progress", () => {
  assert.equal(isTerminalJob({ state: "completed" }), true);
  assert.equal(isTerminalJob({ state: "separating" }), false);
  assert.equal(normalizePercentage(120), 100);
  assert.equal(normalizePercentage(-2), 0);
  assert.equal(normalizePercentage("bad"), 0);
});

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("AgentClient migrates the legacy pairing token once", () => {
  const storage = memoryStorage({ [LEGACY_AGENT_TOKEN_KEYS[0]]: "legacy-token" });
  const client = new AgentClient({ storage, fetchImpl: async () => jsonResponse({}) });

  assert.equal(client.token, "legacy-token");
  assert.equal(storage.getItem(AGENT_TOKEN_KEY), "legacy-token");
  assert.equal(storage.getItem(LEGACY_AGENT_TOKEN_KEYS[0]), null);
});

test("AgentClient owns health, pairing and capability discovery", async () => {
  const calls = [];
  const storage = memoryStorage();
  const fetchImpl = async (url, options) => {
    const path = new URL(url).pathname;
    calls.push({ path, authorization: options.headers.get("Authorization") });
    if (path === "/health") return jsonResponse({ status: "ok", version: "1.0.0" });
    if (path === "/pairing") return jsonResponse({ token: "paired-token" });
    if (path === "/v1/agent") return jsonResponse({
      name: "Felipe Local Agent",
      agentVersion: "1.0.0",
      protocolVersions: ["1"],
      activeProtocolVersion: "1",
    });
    if (path === "/v1/capabilities") return jsonResponse({
      capabilities: [{ id: "instagram-exporter" }, { id: "music-analyzer" }],
    });
    if (path === "/v1/health") return jsonResponse({ music: { available: true } });
    return jsonResponse({ error: { code: "NOT_FOUND", message: "Not found" } }, 404);
  };
  const client = new AgentClient({ baseUrl: "http://127.0.0.1:8765", storage, fetchImpl });

  const state = await client.connect();

  assert.equal(state.connected, true);
  assert.equal(state.token, "paired-token");
  assert.equal(state.capabilities.length, 2);
  assert.equal(storage.getItem(AGENT_TOKEN_KEY), "paired-token");
  assert.deepEqual(calls.map(({ path }) => path), [
    "/health", "/pairing", "/v1/agent", "/v1/capabilities", "/v1/health",
  ]);
  assert.equal(calls.find(({ path }) => path === "/v1/capabilities").authorization, "Bearer paired-token");
});

test("AgentClient pairs once and signs requests for an explicit device session", async () => {
  const calls = [];
  const storage = memoryStorage();
  const session = {
    id: "session-id",
    secret: "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY",
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
  };
  const fetchImpl = async (url, options) => {
    const path = new URL(url).pathname;
    calls.push({ path, options });
    if (path === "/health") return jsonResponse({ status: "ok", pairing: "explicit" });
    if (path === "/v1/pairing/requests") return jsonResponse({ session }, 201);
    if (path === "/v1/agent") return jsonResponse({
      protocolVersions: ["1"], activeProtocolVersion: "1", securityVersion: 2,
    });
    if (path === "/v1/capabilities") return jsonResponse({ capabilities: [] });
    if (path === "/v1/health") return jsonResponse({ status: "ok" });
    return jsonResponse({}, 404);
  };
  const client = new AgentClient({ storage, fetchImpl });

  await client.connect();

  assert.equal(client.session.id, "session-id");
  assert.ok(storage.getItem(AGENT_SESSION_KEY));
  const protectedCall = calls.find(({ path }) => path === "/v1/agent");
  assert.equal(protectedCall.options.headers.get("X-Agent-Session"), "session-id");
  assert.match(protectedCall.options.headers.get("X-Agent-Nonce"), /^[A-Za-z0-9_-]+$/);
  assert.match(protectedCall.options.headers.get("X-Agent-Signature"), /^[a-f0-9]{64}$/);

  calls.length = 0;
  const reloaded = new AgentClient({ storage, fetchImpl });
  await reloaded.connect();
  assert.equal(calls.some(({ path }) => path === "/v1/pairing/requests"), false);
});

test("AgentClient rejects an incompatible protocol", async () => {
  const storage = memoryStorage({ [AGENT_TOKEN_KEY]: "paired-token" });
  const fetchImpl = async (url) => {
    const path = new URL(url).pathname;
    if (path === "/health") return jsonResponse({ status: "ok" });
    if (path === "/v1/agent") return jsonResponse({ protocolVersions: ["99"] });
    if (path === "/v1/capabilities") return jsonResponse({ capabilities: [] });
    return jsonResponse({}, 404);
  };
  const client = new AgentClient({ storage, fetchImpl });

  await assert.rejects(client.connect(), { code: "AGENT_PROTOCOL_INCOMPATIBLE" });
  assert.equal(client.getSnapshot().status, "incompatible");
});

test("local agent transport preserves the structured error contract", async () => {
  const fetchImpl = async () => jsonResponse({
    error: {
      code: "CAPABILITY_INPUT_INVALID",
      message: "Invalid input",
      details: { field: "profile" },
      requestId: "request-7",
    },
  }, 422);

  await assert.rejects(
    agentFetch("/operation", { fetchImpl }),
    {
      code: "CAPABILITY_INPUT_INVALID",
      status: 422,
      requestId: "request-7",
    },
  );
});

test("capability clients expose declared operations instead of arbitrary commands", async () => {
  const calls = [];
  const agent = {
    baseUrl: "http://127.0.0.1:8765",
    request: async (path, options = {}) => { calls.push({ path, options }); return {}; },
    requestRaw: async () => jsonResponse({}),
    stream: async () => {},
  };
  const instagram = createInstagramClient(agent);
  const music = createMusicClient(agent);

  await instagram.exportAccount({ profile: "example" });
  await music.createJob({ sourceId: "source-1" });

  assert.deepEqual(calls.map(({ path }) => path), ["/exports", "/v1/music/jobs"]);
  assert.equal("runCommand" in instagram, false);
  assert.equal("runCommand" in music, false);
});

test("AgentClient exposes the common task API", async () => {
  const paths = [];
  const client = new AgentClient({
    storage: memoryStorage({ [AGENT_TOKEN_KEY]: "legacy-token" }),
    fetchImpl: async (url) => {
      paths.push(new URL(url).pathname + new URL(url).search);
      return jsonResponse({});
    },
  });

  await client.listTasks({ capability: "instagram-exporter", status: "running", limit: 10 });
  await client.getTask("task-1");
  await client.cancelTask("task-1");

  assert.deepEqual(paths, [
    "/v1/tasks?capability=instagram-exporter&status=running&limit=10",
    "/v1/tasks/task-1",
    "/v1/tasks/task-1/cancel",
  ]);
});
