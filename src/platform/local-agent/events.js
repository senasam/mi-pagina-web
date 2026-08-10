import { LOCAL_AGENT_URL } from "./config.js";

export function parseEventBlock(block) {
  if (!block || block.startsWith(":")) return null;
  const event = { id: "", type: "message", data: "" };
  for (const line of block.split(/\r?\n/)) {
    const separator = line.indexOf(":");
    const field = separator < 0 ? line : line.slice(0, separator);
    const value = separator < 0 ? "" : line.slice(separator + 1).replace(/^ /, "");
    if (field === "id") event.id = value;
    else if (field === "event") event.type = value;
    else if (field === "data") event.data += `${value}\n`;
  }
  if (!event.data) return null;
  return { ...event, data: JSON.parse(event.data.trim()) };
}

export async function streamAgentEvents({
  path,
  token,
  headers: signedHeaders = {},
  signal,
  onEvent,
  baseUrl = LOCAL_AGENT_URL,
  fetchImpl = globalThis.fetch,
}) {
  const headers = { Accept: "text/event-stream", ...signedHeaders };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetchImpl(`${baseUrl}${path}`, { headers, signal, cache: "no-store" });
  if (!response.ok || !response.body) throw new Error("No se pudo abrir el canal de progreso.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      const parsed = parseEventBlock(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
      if (parsed) onEvent(parsed);
      boundary = buffer.indexOf("\n\n");
    }
  }
  buffer += decoder.decode();
  const parsed = parseEventBlock(buffer.trim());
  if (parsed) onEvent(parsed);
}
