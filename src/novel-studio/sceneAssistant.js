import { requestOllamaSuggestion } from "./aiProviders.js";

const SAFE_PROSE_CHARS = 40000;
const MIN_CHUNK_CHARS = 12000;

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
  const response = await fetchImpl("/api/novel-studio/scene-assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, prose, title: metadata.title, summary: metadata.summary, beats: metadata.beats, apiKey: settings?.apiKey || "", model: settings?.model || "" }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "No se pudo generar la sugerencia.");
    error.code = payload.code || "AI_REQUEST_FAILED"; error.status = response.status;
    throw error;
  }
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
  return requestManaged({ task, prose, metadata, settings, fetchImpl });
}
