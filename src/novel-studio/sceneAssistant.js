import { requestOllamaSuggestion } from "./aiProviders.js";
import { executeAiTask } from "../platform/ai/aiClient.js";
import { AI_TOOL_IDS } from "../platform/ai/contracts.js";

const SAFE_PROSE_CHARS = 40000;
const MIN_CHUNK_CHARS = 12000;
export const SCENE_SUMMARY_MAX_CHARS = 140;
export const SCENE_BEAT_MAX_CHARS = 80;

function shortenAtWord(value, maxChars) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return clean;
  const available = clean.slice(0, maxChars - 1);
  const boundary = available.lastIndexOf(" ");
  return `${(boundary >= Math.floor(maxChars * .6) ? available.slice(0, boundary) : available).trimEnd()}…`;
}

export function parseSceneBeats(value) {
  return String(value || "")
    .split(/;|\r?\n/)
    .map((beat) => beat.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 6)
    .map((beat) => shortenAtWord(beat, SCENE_BEAT_MAX_CHARS));
}

export function normalizeSceneAiResult(task, value) {
  if (task === "summary") return shortenAtWord(value, SCENE_SUMMARY_MAX_CHARS);
  if (task === "beats") return parseSceneBeats(value).join("; ");
  return String(value || "").trim();
}

export function splitAiRequestText(value, maxChars = SAFE_PROSE_CHARS) {
  const source = String(value || "");
  if (source.length <= maxChars) return source ? [source] : [];
  const chunks = [];
  let current = "";
  const append = (part) => {
    if (current && current.length + part.length + 2 > maxChars) { chunks.push(current); current = ""; }
    if (part.length <= maxChars) current = current ? `${current}\n\n${part}` : part;
    else {
      if (current) { chunks.push(current); current = ""; }
      for (let offset = 0; offset < part.length; offset += maxChars) chunks.push(part.slice(offset, offset + maxChars));
    }
  };
  source.split(/\n{2,}/).forEach(append);
  if (current) chunks.push(current);
  return chunks.filter(Boolean);
}

function compactMetadata(metadata = {}) {
  return {
    title: String(metadata.title || "").slice(0, 300),
    summary: String(metadata.summary || "").slice(0, 2500),
    beats: (Array.isArray(metadata.beats) ? metadata.beats : []).slice(0, 20).map((beat) => String(beat).slice(0, 220)),
  };
}

async function requestSingle({ task, prose, metadata, settings, fetchImpl }) {
  if (settings?.provider === "ollama") return requestOllamaSuggestion({ task, prose, metadata, settings, fetchImpl });
  const payload = await executeAiTask({
    toolId: AI_TOOL_IDS.NOVEL_STUDIO,
    capability: "scene-assistant",
    provider: settings?.provider || "openai",
    model: settings?.model || "",
    credentialRef: settings?.credentialRef,
    input: { task, prose, title: metadata.title, summary: metadata.summary, beats: metadata.beats },
    fetchImpl,
  });
  return payload.suggestion;
}

async function requestManaged(params, depth = 0, chunkChars = SAFE_PROSE_CHARS) {
  const metadata = compactMetadata(params.metadata);
  const prose = String(params.prose || "");
  if (prose.length <= chunkChars) {
    try { return await requestSingle({ ...params, prose, metadata }); }
    catch (error) {
      if (error.status !== 413 || prose.length <= MIN_CHUNK_CHARS) throw error;
      return requestManaged(params, depth, Math.max(MIN_CHUNK_CHARS, Math.floor(chunkChars / 2)));
    }
  }
  const chunks = splitAiRequestText(prose, chunkChars);
  const partials = [];
  for (let index = 0; index < chunks.length; index += 1) {
    partials.push(await requestSingle({
      ...params,
      prose: `PARTE ${index + 1} DE ${chunks.length}:\n\n${chunks[index]}`,
      metadata: { ...metadata, title: `${metadata.title || "Solicitud"} · parte ${index + 1} de ${chunks.length}` },
    }));
  }
  if (params.task === "codex-import-classification") {
    const assignments = partials.flatMap((partial) => {
      try { const parsed = JSON.parse(partial); return Array.isArray(parsed) ? parsed : parsed.assignments || []; }
      catch { return []; }
    });
    return JSON.stringify({ assignments });
  }
  const combined = `RESULTADOS PARCIALES QUE DEBES INTEGRAR EN UNA ÚNICA RESPUESTA FINAL:\n\n${partials.map((partial, index) => `PARTE ${index + 1}:\n${partial}`).join("\n\n")}`;
  if (depth >= 3 && combined.length > chunkChars) return requestSingle({ ...params, prose: combined.slice(0, chunkChars), metadata });
  return requestManaged({ ...params, prose: combined, metadata }, depth + 1, chunkChars);
}

export async function requestSceneSuggestion({ task, prose, metadata, settings, fetchImpl = fetch }) {
  return normalizeSceneAiResult(task, await requestManaged({ task, prose, metadata, settings, fetchImpl }));
}
