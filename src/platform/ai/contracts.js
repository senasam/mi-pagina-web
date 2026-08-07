export const AI_PROVIDERS = Object.freeze({
  OPENAI: "openai",
  OLLAMA: "ollama",
  CHATGPT_MANUAL: "chatgpt-manual",
});

export const AI_TOOL_IDS = Object.freeze({
  NOVEL_STUDIO: "novel-studio",
});

export const AI_CREDENTIAL_SCOPES = Object.freeze({
  SESSION: "session",
  USER: "user",
  DEVICE: "device",
});

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,99}$/i;

export function assertAiIdentifier(value, label) {
  const clean = String(value || "").trim();
  if (!SAFE_ID.test(clean)) throw new Error(`${label} no es válido.`);
  return clean;
}

export function defaultCredentialId(toolId, provider) {
  return `${assertAiIdentifier(toolId, "La herramienta")}:${assertAiIdentifier(provider, "El proveedor")}`;
}

export function createCredentialRef({ id, toolId, provider, scope = AI_CREDENTIAL_SCOPES.SESSION }) {
  const cleanToolId = assertAiIdentifier(toolId, "La herramienta");
  const cleanProvider = assertAiIdentifier(provider, "El proveedor");
  const cleanScope = Object.values(AI_CREDENTIAL_SCOPES).includes(scope) ? scope : AI_CREDENTIAL_SCOPES.SESSION;
  return Object.freeze({
    id: assertAiIdentifier(id || defaultCredentialId(cleanToolId, cleanProvider), "La credencial"),
    toolId: cleanToolId,
    provider: cleanProvider,
    scope: cleanScope,
  });
}

export function normalizeCredentialRef(value, fallback = {}) {
  if (!value || typeof value !== "object") return null;
  try {
    return createCredentialRef({
      id: value.id,
      toolId: value.toolId || fallback.toolId,
      provider: value.provider || fallback.provider,
      scope: value.scope,
    });
  } catch {
    return null;
  }
}
