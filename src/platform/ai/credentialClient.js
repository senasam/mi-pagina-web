import { createCredentialRef, defaultCredentialId } from "./contracts.js";

// Los secretos viven exclusivamente en la memoria de esta pestaña. Esta interfaz
// podrá reemplazarse por un almacén de usuario o del sistema operativo sin cambiar
// las herramientas consumidoras.
const sessionSecrets = new Map();

export function saveSessionCredential({ toolId, provider, secret, id }) {
  const cleanSecret = String(secret || "").trim();
  if (!cleanSecret || /[\r\n]/.test(cleanSecret)) throw new Error("La credencial no es válida.");
  const ref = createCredentialRef({ id, toolId, provider, scope: "session" });
  sessionSecrets.set(ref.id, cleanSecret);
  return ref;
}

export function resolveSessionCredential({ toolId, provider, credentialRef } = {}) {
  const id = credentialRef?.id || defaultCredentialId(toolId, provider);
  return sessionSecrets.get(id) || "";
}

export function hasSessionCredential(options = {}) {
  return Boolean(resolveSessionCredential(options));
}

export function removeSessionCredential({ toolId, provider, credentialRef } = {}) {
  const id = credentialRef?.id || defaultCredentialId(toolId, provider);
  return sessionSecrets.delete(id);
}

export function clearSessionCredentials() {
  sessionSecrets.clear();
}

export function sessionCredentialStatus({ toolId, provider, credentialRef } = {}) {
  const id = credentialRef?.id || defaultCredentialId(toolId, provider);
  return { id, toolId, provider, scope: "session", configured: sessionSecrets.has(id) };
}
