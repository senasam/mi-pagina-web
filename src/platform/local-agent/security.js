const encoder = new TextEncoder();

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function bytesToHex(bytes) {
  return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
}

export function randomAgentId(size = 24, cryptoImpl = globalThis.crypto) {
  const bytes = new Uint8Array(size);
  cryptoImpl.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export async function createSessionHeaders({
  session,
  method = "GET",
  target,
  body = "",
  now = () => Date.now(),
  cryptoImpl = globalThis.crypto,
  nonce = randomAgentId(18, cryptoImpl),
}) {
  if (!session?.id || !session?.secret) return {};
  const timestamp = String(Math.floor(now() / 1000));
  const bodyBytes = typeof body === "string" ? encoder.encode(body) : new Uint8Array(body || []);
  const bodyHash = bytesToHex(new Uint8Array(await cryptoImpl.subtle.digest("SHA-256", bodyBytes)));
  const canonical = `${method.toUpperCase()}\n${target}\n${timestamp}\n${nonce}\n${bodyHash}`;
  const key = await cryptoImpl.subtle.importKey(
    "raw",
    base64UrlToBytes(session.secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = bytesToHex(new Uint8Array(
    await cryptoImpl.subtle.sign("HMAC", key, encoder.encode(canonical)),
  ));
  return {
    Authorization: `Bearer ${session.id}`,
    "X-Agent-Session": session.id,
    "X-Agent-Timestamp": timestamp,
    "X-Agent-Nonce": nonce,
    "X-Agent-Signature": signature,
  };
}
