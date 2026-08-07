import { AI_PROVIDERS, assertAiIdentifier } from "./contracts.js";
import { hydrateDeviceCredential, resolveSessionCredential } from "./credentialClient.js";

export class AiClientError extends Error {
  constructor(message, code = "AI_REQUEST_FAILED", status = 0) {
    super(message);
    this.name = "AiClientError";
    this.code = code;
    this.status = status;
  }
}

export async function executeAiTask({
  toolId,
  capability,
  provider,
  model = "",
  credentialRef = null,
  input,
  fetchImpl = fetch,
  endpoint = "/api/ai/execute",
} = {}) {
  const cleanToolId = assertAiIdentifier(toolId, "La herramienta");
  const cleanCapability = assertAiIdentifier(capability, "La capacidad");
  const cleanProvider = assertAiIdentifier(provider, "El proveedor");
  if (cleanProvider !== AI_PROVIDERS.OPENAI) throw new AiClientError("El proveedor no está disponible mediante la API común.", "UNSUPPORTED_PROVIDER", 400);

  await hydrateDeviceCredential({ toolId: cleanToolId, provider: cleanProvider, credentialRef });
  const secret = resolveSessionCredential({ toolId: cleanToolId, provider: cleanProvider, credentialRef });
  if (!secret) throw new AiClientError("Introduce una clave de OpenAI para esta sesión.", "AI_CREDENTIAL_REQUIRED", 503);

  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ toolId: cleanToolId, capability: cleanCapability, provider: cleanProvider, model, input }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new AiClientError(payload.error || "No se pudo ejecutar la tarea de IA.", payload.code, response.status);
  return payload;
}
