import { createCredentialRef, defaultCredentialId } from "./contracts.js";

// Los secretos viven exclusivamente en la memoria de esta pestaña. Esta interfaz
// podrá reemplazarse por un almacén de usuario o del sistema operativo sin cambiar
// las herramientas consumidoras.
const sessionSecrets = new Map();
const DEVICE_DB_NAME = "fmd-ai-credentials";
const DEVICE_DB_VERSION = 1;
const CREDENTIAL_STORE = "credentials";
const KEY_STORE = "keys";

function deviceStorageAvailable() {
  return typeof indexedDB !== "undefined" && typeof globalThis.crypto?.subtle !== "undefined";
}

function openDeviceDb() {
  if (!deviceStorageAvailable()) throw new Error("El almacenamiento seguro del dispositivo no está disponible en este navegador.");
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DEVICE_DB_NAME, DEVICE_DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(CREDENTIAL_STORE)) request.result.createObjectStore(CREDENTIAL_STORE);
      if (!request.result.objectStoreNames.contains(KEY_STORE)) request.result.createObjectStore(KEY_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deviceStoreRequest(storeName, mode, operation) {
  const db = await openDeviceDb();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const request = operation(transaction.objectStore(storeName));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } finally { db.close(); }
}

async function deviceEncryptionKey(id) {
  let key = await deviceStoreRequest(KEY_STORE, "readonly", (store) => store.get(id));
  if (key) return key;
  key = await globalThis.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  await deviceStoreRequest(KEY_STORE, "readwrite", (store) => store.put(key, id));
  return key;
}

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

export function supportsDeviceCredentials() {
  return deviceStorageAvailable();
}

export async function saveDeviceCredential({ toolId, provider, secret, id }) {
  const cleanSecret = String(secret || "").trim();
  if (!cleanSecret || /[\r\n]/.test(cleanSecret)) throw new Error("La credencial no es válida.");
  const ref = createCredentialRef({ id, toolId, provider, scope: "device" });
  const key = await deviceEncryptionKey(ref.id);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await globalThis.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(cleanSecret));
  await deviceStoreRequest(CREDENTIAL_STORE, "readwrite", (store) => store.put({ ciphertext, iv, updatedAt: new Date().toISOString() }, ref.id));
  sessionSecrets.set(ref.id, cleanSecret);
  return ref;
}

export async function hydrateDeviceCredential({ toolId, provider, credentialRef } = {}) {
  if (credentialRef?.scope !== "device" || !deviceStorageAvailable()) return "";
  const id = credentialRef.id || defaultCredentialId(toolId, provider);
  if (sessionSecrets.has(id)) return sessionSecrets.get(id);
  const [record, key] = await Promise.all([
    deviceStoreRequest(CREDENTIAL_STORE, "readonly", (store) => store.get(id)),
    deviceStoreRequest(KEY_STORE, "readonly", (store) => store.get(id)),
  ]);
  if (!record?.ciphertext || !record?.iv || !key) return "";
  try {
    const plaintext = await globalThis.crypto.subtle.decrypt({ name: "AES-GCM", iv: record.iv }, key, record.ciphertext);
    const secret = new TextDecoder().decode(plaintext);
    if (secret) sessionSecrets.set(id, secret);
    return secret;
  } catch { return ""; }
}

export async function removeDeviceCredential({ toolId, provider, credentialRef } = {}) {
  if (!deviceStorageAvailable()) return false;
  const id = credentialRef?.id || defaultCredentialId(toolId, provider);
  sessionSecrets.delete(id);
  await Promise.all([
    deviceStoreRequest(CREDENTIAL_STORE, "readwrite", (store) => store.delete(id)),
    deviceStoreRequest(KEY_STORE, "readwrite", (store) => store.delete(id)),
  ]);
  return true;
}
