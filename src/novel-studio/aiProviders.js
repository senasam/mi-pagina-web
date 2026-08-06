const OLLAMA_TIMEOUT_MS = 120000;

export const OLLAMA_MODEL_PRESETS = Object.freeze([
  { id: "qwen3:4b", label: "Ligero", download: "2,5 GB", ram: "8 GB de RAM aprox.", detail: "Buena opción para portátiles y resúmenes breves." },
  { id: "qwen3:8b", label: "Equilibrado", download: "5,2 GB", ram: "12 GB de RAM aprox.", detail: "Mejor redacción y comprensión manteniendo una carga moderada." },
  { id: "qwen3:14b", label: "Calidad", download: "9,3 GB", ram: "20 GB de RAM aprox.", detail: "Más calidad si el equipo tiene memoria suficiente." },
  { id: "qwen3:30b", label: "Avanzado", download: "19 GB", ram: "32 GB de RAM aprox.", detail: "Para equipos potentes; descarga y carga considerablemente mayores." },
]);

export function chooseOllamaModel(models = [], currentModel = "") {
  const available = models.map((model) => model?.name).filter(Boolean);
  if (currentModel && available.includes(currentModel)) return currentModel;
  return available[0] || currentModel || OLLAMA_MODEL_PRESETS[0].id;
}

export function normalizeOllamaUrl(value = "http://localhost:11434") {
  let url;
  try { url = new URL(value); }
  catch { throw new Error("La dirección de Ollama no es válida."); }
  if (url.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new Error("Por seguridad, el estudio solo se conecta a Ollama en este mismo PC.");
  }
  return url.origin;
}

export function normalizeChatGptUrl(value = "https://chatgpt.com/") {
  let url;
  try { url = new URL(String(value || "").trim()); }
  catch { throw new Error("La URL de ChatGPT no es válida."); }
  if (url.protocol !== "https:" || url.hostname !== "chatgpt.com" || url.username || url.password) {
    throw new Error("Usa una URL HTTPS de chatgpt.com, ya sea la página principal o un proyecto.");
  }
  url.hash = "";
  return url.href;
}

export function buildScenePrompt(task, prose, metadata = {}) {
  const instruction = task === "codex-categories"
    ? "Sugiere entre 3 y 6 categorías breves y útiles para clasificar esta ficha del Codex. Considera su tipo, nombre, alias, descripción y las categorías ya usadas. No repitas categorías existentes. Devuelve únicamente las categorías separadas por comas, sin explicación."
    : task === "chapter-title"
    ? "Propón un título evocador y específico para este capítulo a partir del contexto y sus escenas. Devuelve únicamente el título, sin comillas, explicación ni punto final."
    : task === "title"
      ? "Propón un título evocador y específico para esta escena. Devuelve únicamente el título, sin comillas, explicación ni punto final."
      : "Resume esta escena en español en un párrafo de 2 a 4 frases. Conserva personajes, giro, conflicto y resultado; no inventes hechos.";
  const context = [
    metadata.title ? `Título actual: ${metadata.title}` : "",
    metadata.summary ? `Resumen actual: ${metadata.summary}` : "",
    metadata.beats?.length ? `Beats: ${metadata.beats.join("; ")}` : "",
  ].filter(Boolean).join("\n");
  return `${instruction}\n\n${context}\n\n<escena>\n${String(prose || "").slice(0, 60000)}\n</escena>`;
}

async function ollamaFetch(path, { baseUrl, fetchImpl = fetch, ...options }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
  try {
    return await fetchImpl(`${normalizeOllamaUrl(baseUrl)}${path}`, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("Ollama tardó demasiado en responder.");
    throw new Error("No se pudo acceder a Ollama. Comprueba que esté abierto y que permita el origen de este sitio.");
  } finally { clearTimeout(timeout); }
}

export async function listOllamaModels(baseUrl, fetchImpl = fetch) {
  const response = await ollamaFetch("/api/tags", { baseUrl, fetchImpl, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Ollama respondió con estado ${response.status}.`);
  const payload = await response.json();
  return (Array.isArray(payload.models) ? payload.models : []).map((item) => ({
    name: item.name || item.model,
    size: Number(item.size) || 0,
    parameterSize: item.details?.parameter_size || "",
  })).filter((item) => item.name);
}

export async function pullOllamaModel({ baseUrl, model, onProgress = () => {}, signal, fetchImpl = fetch }) {
  if (!model) throw new Error("Selecciona el modelo que quieres instalar.");
  let response;
  try {
    response = await fetchImpl(`${normalizeOllamaUrl(baseUrl)}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/x-ndjson" },
      body: JSON.stringify({ model, stream: true }),
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new Error("No se pudo iniciar la descarga. Comprueba que Ollama esté abierto y permita este sitio.");
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Ollama respondió con estado ${response.status}.`);
  }
  if (!response.body) throw new Error("Ollama no entregó información de progreso.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let last = { status: "Iniciando descarga", completed: 0, total: 0, percent: 0 };
  const consume = (line) => {
    if (!line.trim()) return;
    const update = JSON.parse(line);
    if (update.error) throw new Error(update.error);
    const completed = Number(update.completed) || 0;
    const total = Number(update.total) || 0;
    last = { status: update.status || last.status, completed, total, percent: total ? Math.min(100, Math.round((completed / total) * 100)) : last.percent };
    onProgress(last);
  };
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";
    for (const line of lines) consume(line);
    if (done) break;
  }
  consume(buffer);
  return { ...last, percent: 100, status: "success" };
}

export async function requestOllamaSuggestion({ task, prose, metadata, settings, fetchImpl = fetch }) {
  if (!settings?.ollamaModel) throw new Error("Selecciona primero un modelo local de Ollama.");
  const response = await ollamaFetch("/api/generate", {
    baseUrl: settings.ollamaUrl,
    fetchImpl,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: settings.ollamaModel,
      prompt: buildScenePrompt(task, prose, metadata),
      system: "Eres un asistente editorial para ficción. Responde en el idioma de la escena y cumple exactamente el formato solicitado.",
      stream: false,
      think: false,
      options: { temperature: task === "summary" ? 0.3 : 0.7, num_predict: task === "summary" ? 350 : task === "codex-categories" ? 140 : 80 },
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 404) throw new Error(`El modelo ${settings.ollamaModel} no está instalado en Ollama.`);
    throw new Error(payload.error || "Ollama no pudo generar la sugerencia.");
  }
  const result = String(payload.response || "").trim();
  if (!result) throw new Error("Ollama no devolvió una sugerencia utilizable.");
  return task !== "summary" ? result.replace(/^[“”"']+|[“”"'.]+$/g, "").trim() : result;
}

export function buildChatGptManualPrompt(task, prose, metadata) {
  return `${buildScenePrompt(task, prose, metadata)}\n\nResponde solamente con el resultado solicitado para poder pegarlo de vuelta en mi estudio de novela.`;
}

export function ollamaOriginCommand(origin) {
  const safeOrigin = String(origin || "").replace(/'/g, "''");
  return `$studioOrigin='${safeOrigin}'; $current=[Environment]::GetEnvironmentVariable('OLLAMA_ORIGINS','User'); $items=@($current -split ',' | Where-Object { $_ }) + $studioOrigin | Select-Object -Unique; [Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS',($items -join ','),'User')`;
}
