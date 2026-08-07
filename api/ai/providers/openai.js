const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const REQUEST_TIMEOUT_MS = 45000;

export class OpenAiProviderError extends Error {
  constructor(message, status = 502, code = "AI_PROVIDER_ERROR") {
    super(message);
    this.name = "OpenAiProviderError";
    this.status = status;
    this.code = code;
  }
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === "string") return payload.output_text;
  return (payload?.output || [])
    .filter((item) => item?.type === "message")
    .flatMap((item) => item.content || [])
    .filter((item) => item?.type === "output_text")
    .map((item) => item.text || "")
    .join("\n");
}

export async function generateOpenAiText({ apiKey, model, developerPrompt, userPrompt, maxOutputTokens, fetchImpl = fetch } = {}) {
  const cleanApiKey = String(apiKey || "").trim().slice(0, 512);
  const cleanModel = String(model || "").trim().slice(0, 100);
  if (!cleanApiKey) throw new OpenAiProviderError("Falta una credencial de OpenAI.", 503, "AI_CREDENTIAL_REQUIRED");
  if (/[\r\n]/.test(cleanApiKey) || !/^[a-zA-Z0-9._:-]+$/.test(cleanModel)) {
    throw new OpenAiProviderError("La configuración de OpenAI no es válida.", 400, "INVALID_AI_CONFIG");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetchImpl(OPENAI_RESPONSES_URL, {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${cleanApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: cleanModel,
        reasoning: { effort: "low" },
        max_output_tokens: maxOutputTokens,
        input: [
          { role: "developer", content: developerPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
  } catch (error) {
    if (error?.name === "AbortError") throw new OpenAiProviderError("La IA tardó demasiado en responder.", 504, "AI_TIMEOUT");
    throw new OpenAiProviderError("No se pudo conectar con el servicio de IA.", 502, "AI_UNAVAILABLE");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    if (response.status === 429) throw new OpenAiProviderError("Se alcanzó el límite temporal de la IA. Intenta de nuevo en un momento.", 429, "AI_RATE_LIMIT");
    throw new OpenAiProviderError("El servicio de IA no pudo generar la respuesta.", 502, "AI_RESPONSE_ERROR");
  }
  return extractOutputText(await response.json()).trim();
}
