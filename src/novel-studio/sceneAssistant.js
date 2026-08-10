import { requestOllamaSuggestion } from "./aiProviders.js";
import { executeAiTask } from "../platform/ai/aiClient.js";
import { AI_TOOL_IDS } from "../platform/ai/contracts.js";

const MIN_CHUNK_CHARS = 12000;
const CHARS_PER_TOKEN_ESTIMATE = 3;
export const SCENE_SUMMARY_MAX_CHARS = 140;
export const SCENE_BEAT_MAX_CHARS = 80;

const OOTGR_CONTEXT_FIELDS = [
  ["Objetivo", "objetivo"],
  ["Oposición", "oposicion"],
  ["Tácticas", "tacticas"],
  ["Giro", "giro"],
  ["Resultado", "resultado"],
  ["Consecuencia", "consecuencia"],
];

export function buildSceneDesignFieldContext({ targetLabel, instruction, currentValue, design = {}, metadata = {}, prose = "", participants = [] }) {
  const beats = Array.isArray(metadata.beats) ? metadata.beats.filter(Boolean) : [];
  const characterContext = participants.length
    ? participants.map((character) => `- ${character.name || "Personaje sin nombre"}: ${String(character.description || "").trim() || "Sin descripción disponible"}`)
    : ["- No hay personajes participantes identificados en la escena."];
  return [
    `CAMPO OOTGR QUE DEBES REDACTAR: ${targetLabel}`,
    `INSTRUCCIÓN DEL CAMPO QUE DEBES RESPONDER: ${instruction}`,
    `VALOR ACTUAL: ${currentValue || "Vacío"}`,
    "RESUMEN DE LA ESCENA:",
    metadata.summary || "Sin resumen disponible",
    "MOMENTOS CLAVE DE LA ESCENA:",
    beats.length ? beats.map((beat) => `- ${beat}`).join("\n") : "- Sin momentos clave disponibles",
    "PERSONAJES QUE INTERVIENEN EN LA ESCENA:",
    ...characterContext,
    "DISEÑO OOTGR ACTUAL:",
    ...OOTGR_CONTEXT_FIELDS.map(([label, key]) => `${label}: ${design[key] || "Sin definir"}`),
    "PROSA DE LA ESCENA:",
    String(prose || "").trim() || "La escena todavía no tiene prosa; utiliza solamente el resto del contexto disponible.",
  ].join("\n");
}

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
    inputTokenLimit: settings?.inputTokenLimit,
    outputTokenLimit: settings?.outputTokenLimit,
    input: { task, prose, title: metadata.title, summary: metadata.summary, beats: metadata.beats },
    fetchImpl,
  });
  return payload.suggestion;
}

async function requestManaged(params, depth = 0, chunkChars = null) {
  const metadata = compactMetadata(params.metadata);
  const prose = String(params.prose || "");
  const configuredChunkChars = Math.max(MIN_CHUNK_CHARS, Math.min(393216, (Number(params.settings?.inputTokenLimit) || 12000) * CHARS_PER_TOKEN_ESTIMATE));
  chunkChars ||= configuredChunkChars;
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
  try {
    return normalizeSceneAiResult(task, await requestManaged({ task, prose, metadata, settings, fetchImpl }));
  } catch (error) {
    if (error?.code !== "AI_OUTPUT_LIMIT" && !/límite de salida/i.test(error?.message || "")) throw error;
    const current = Math.max(64, Math.min(16384, Number(settings?.outputTokenLimit) || 2200));
    const recommended = Math.min(16384, 2 ** Math.ceil(Math.log2(Math.max(current + 1, current * 1.5))));
    const message = current >= 16384
      ? `La respuesta agotó el máximo de salida permitido (${current.toLocaleString("es")} tokens). La solicitud requiere una respuesta más breve o dividirse en partes.`
      : `La respuesta alcanzó tu límite de salida actual de ${current.toLocaleString("es")} tokens. En Configuración → IA aumenta «Máximo de salida» a ${recommended.toLocaleString("es")} tokens y vuelve a intentarlo. No necesitas modificar «Máximo de entrada».`;
    const guidedError = new Error(message);
    guidedError.code = "AI_OUTPUT_LIMIT";
    guidedError.currentLimit = current;
    guidedError.recommendedLimit = recommended;
    throw guidedError;
  }
}
