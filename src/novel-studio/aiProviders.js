import {
  OLLAMA_MODEL_PRESETS, chooseOllamaModel, listOllamaModels, normalizeOllamaUrl, ollamaOriginCommand,
  pullOllamaModel, requestOllamaGeneration,
} from "../platform/ai/providers/ollama.js";

export { OLLAMA_MODEL_PRESETS, chooseOllamaModel, listOllamaModels, normalizeOllamaUrl, ollamaOriginCommand, pullOllamaModel };

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
  const instruction = task === "codex-field"
    ? "Redacta en español el contenido del atributo objetivo de esta ficha del Codex usando todos los datos disponibles. Si el atributo ya tiene contenido, mejóralo y complétalo sin perder hechos. No contradigas la ficha ni repitas innecesariamente otros apartados. Puedes desarrollar detalles narrativos coherentes, pero no presentes como comprobado aquello que la ficha deja incierto. Devuelve únicamente el contenido listo para pegar, con párrafos o listas cuando ayuden."
    : task === "codex-name"
    ? "Propón un nombre y apellido coherentes con toda la ficha del personaje, su contexto cultural, época y atributos. Si ya existen, consérvalos o mejóralos solo cuando la ficha lo justifique. Devuelve exclusivamente JSON válido: {\"firstName\":\"Nombre\",\"lastName\":\"Apellido o apellidos\"}."
    : task === "codex-relationship"
    ? "Analiza las fichas de ambos personajes y sugiere la relación más coherente. El tipo debe ser exactamente uno de: family, friendship, romance, alliance, rivalry, conflict, mentor, professional, other. La intensidad debe ser un entero de 1 a 5. Devuelve exclusivamente JSON válido: {\"type\":\"friendship\",\"strength\":3}."
    : task === "codex-import-classification"
    ? "Clasifica únicamente las secciones personalizadas importadas en uno de los atributos estándar disponibles cuando la correspondencia sea clara por su título y contenido. No inventes, resumas ni reescribas contenido. Omite las secciones ambiguas para conservarlas como personalizadas. Devuelve exclusivamente JSON válido con esta forma exacta: {\"assignments\":[{\"source\":\"título personalizado exacto\",\"target\":\"atributo estándar exacto\"}]}. Usa solamente títulos source y target incluidos en el material."
    : task === "codex-categories"
    ? "Sugiere entre 3 y 6 categorías breves y útiles para clasificar esta ficha del Codex. Considera su tipo, nombre, alias, descripción y las categorías ya usadas. No repitas categorías existentes. Devuelve únicamente las categorías separadas por comas, sin explicación."
    : task === "chapter-title"
    ? "Propón un título evocador y específico para este capítulo a partir del contexto y sus escenas. Devuelve únicamente el título, sin comillas, explicación ni punto final."
    : task === "beats"
    ? "Extrae entre 3 y 6 momentos clave de esta escena, en orden narrativo. Cada momento debe tener 80 caracteres o menos, ser concreto y describir una acción, revelación, decisión o giro presente en la prosa. No inventes hechos. Devuelve únicamente los momentos separados por punto y coma, sin viñetas ni explicación."
    : task === "title"
      ? "Propón un título evocador y específico para esta escena. Devuelve únicamente el título, sin comillas, explicación ni punto final."
      : "Resume esta escena en español en una sola frase de 140 caracteres o menos. Conserva únicamente personajes, conflicto o giro y resultado esenciales; no inventes hechos.";
  const context = [
    metadata.title ? `Título actual: ${metadata.title}` : "",
    metadata.summary ? `Resumen actual: ${metadata.summary}` : "",
    metadata.beats?.length ? `Beats: ${metadata.beats.join("; ")}` : "",
  ].filter(Boolean).join("\n");
  return `${instruction}\n\n${context}\n\n<escena>\n${String(prose || "").slice(0, 60000)}\n</escena>`;
}

export async function requestOllamaSuggestion({ task, prose, metadata, settings, fetchImpl = fetch }) {
  if (!settings?.ollamaModel) throw new Error("Selecciona primero un modelo local de Ollama.");
  const result = await requestOllamaGeneration({
    baseUrl: settings.ollamaUrl,
    model: settings.ollamaModel,
    fetchImpl,
    request: {
      prompt: buildScenePrompt(task, prose, metadata),
      system: "Eres un asistente editorial para ficción. Responde en el idioma de la escena y cumple exactamente el formato solicitado.",
      think: false,
      ...(task === "codex-import-classification" ? { format: { type: "object", properties: { assignments: { type: "array", items: { type: "object", properties: { source: { type: "string" }, target: { type: "string" } }, required: ["source", "target"] } } }, required: ["assignments"] } }
        : task === "codex-name" ? { format: { type: "object", properties: { firstName: { type: "string" }, lastName: { type: "string" } }, required: ["firstName", "lastName"] } }
        : task === "codex-relationship" ? { format: { type: "object", properties: { type: { type: "string", enum: ["family", "friendship", "romance", "alliance", "rivalry", "conflict", "mentor", "professional", "other"] }, strength: { type: "integer", minimum: 1, maximum: 5 } }, required: ["type", "strength"] } } : {}),
      options: { temperature: ["codex-import-classification", "codex-name", "codex-relationship"].includes(task) ? 0 : ["summary", "beats"].includes(task) ? 0.3 : 0.7, num_predict: task === "summary" ? 80 : task === "beats" ? 140 : task === "codex-field" ? 900 : task === "codex-import-classification" ? 1600 : task === "codex-categories" ? 140 : ["codex-name", "codex-relationship"].includes(task) ? 180 : 80 },
    },
  });
  return task !== "summary" && !["codex-import-classification", "codex-name", "codex-relationship"].includes(task) ? result.replace(/^[“”"']+|[“”"'.]+$/g, "").trim() : result;
}

export function buildChatGptManualPrompt(task, prose, metadata) {
  return `${buildScenePrompt(task, prose, metadata)}\n\nResponde solamente con el resultado solicitado para poder pegarlo de vuelta en mi estudio de novela.`;
}
