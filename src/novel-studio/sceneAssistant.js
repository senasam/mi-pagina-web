import { requestOllamaSuggestion } from "./aiProviders.js";

export async function requestSceneSuggestion({ task, prose, metadata, settings }) {
  if (settings?.provider === "ollama") return requestOllamaSuggestion({ task, prose, metadata, settings });
  const response = await fetch("/api/novel-studio/scene-assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      task,
      prose,
      title: metadata?.title || "",
      summary: metadata?.summary || "",
      beats: metadata?.beats || [],
      apiKey: settings?.apiKey || "",
      model: settings?.model || "",
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "No se pudo generar la sugerencia.");
  return payload.suggestion;
}
