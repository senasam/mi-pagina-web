import { generateSceneSuggestion, SceneAssistantError } from "../novel-studio/scene-assistant.js";

export class AiExecuteError extends Error {
  constructor(message, status = 500, code = "AI_EXECUTION_ERROR") {
    super(message);
    this.name = "AiExecuteError";
    this.status = status;
    this.code = code;
  }
}

export function bearerCredential(authorization = "") {
  const match = String(authorization).match(/^Bearer\s+([^\s]+)$/i);
  if (!match || /[\r\n]/.test(match[1])) throw new AiExecuteError("Introduce una clave válida para esta sesión.", 503, "AI_CREDENTIAL_REQUIRED");
  return match[1];
}

export async function executeAiRequest({ body = {}, authorization = "", fetchImpl = fetch } = {}) {
  if (body.toolId !== "novel-studio" || body.capability !== "scene-assistant" || body.provider !== "openai") {
    throw new AiExecuteError("La combinación de herramienta, capacidad y proveedor no está disponible.", 400, "UNSUPPORTED_AI_ROUTE");
  }
  if (!body.input || typeof body.input !== "object" || Array.isArray(body.input)) {
    throw new AiExecuteError("La entrada de IA no es válida.", 400, "INVALID_AI_INPUT");
  }
  return generateSceneSuggestion({ ...body.input, model: body.model, apiKey: bearerCredential(authorization), fetchImpl });
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Método no permitido", code: "METHOD_NOT_ALLOWED" });
  }
  try {
    const body = typeof request.body === "string" ? JSON.parse(request.body) : (request.body || {});
    return response.status(200).json(await executeAiRequest({ body, authorization: request.headers.authorization }));
  } catch (error) {
    const known = error instanceof AiExecuteError || error instanceof SceneAssistantError;
    const invalidJson = error instanceof SyntaxError;
    const status = known ? error.status : invalidJson ? 400 : 500;
    return response.status(status).json({
      error: known ? error.message : invalidJson ? "Solicitud JSON no válida." : "No se pudo ejecutar la tarea de IA.",
      code: error.code || (invalidJson ? "INVALID_JSON" : "AI_EXECUTION_ERROR"),
    });
  }
}
