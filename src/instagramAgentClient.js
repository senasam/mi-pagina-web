export const INSTAGRAM_AGENT_URL = (import.meta.env.VITE_INSTAGRAM_AGENT_URL || "http://127.0.0.1:8765").replace(/\/$/, "");
export const INSTAGRAM_INSTALLER_URL = import.meta.env.VITE_INSTAGRAM_AGENT_INSTALLER_URL || "";

function timeoutSignal(milliseconds, parentSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException("Timeout", "TimeoutError")), milliseconds);
  const abort = () => controller.abort(parentSignal?.reason);
  parentSignal?.addEventListener("abort", abort, { once: true });
  return { signal: controller.signal, cleanup: () => { clearTimeout(timer); parentSignal?.removeEventListener("abort", abort); } };
}

export async function agentFetch(path, { token = "", timeout = 8000, signal, ...options } = {}) {
  const timed = timeoutSignal(timeout, signal);
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  try {
    const response = await fetch(`${INSTAGRAM_AGENT_URL}${path}`, { ...options, headers, signal: timed.signal, mode: "cors", cache: "no-store" });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.detail || `El agente respondio con estado ${response.status}.`);
    }
    if (response.status === 204) return null;
    return await response.json();
  } catch (error) {
    if (error?.name === "AbortError" || error?.name === "TimeoutError") throw new Error("El agente local tardo demasiado en responder.");
    throw error;
  } finally {
    timed.cleanup();
  }
}

export const checkAgentHealth = (signal) => agentFetch("/health", { timeout: 1800, signal });
export const pairWithAgent = (signal) => agentFetch("/pairing", { method: "POST", timeout: 3000, signal });

function parseEventBlock(block) {
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

export async function streamExportEvents({ jobId, token, lastEventId = 0, signal, onEvent }) {
  const headers = { Accept: "text/event-stream", Authorization: `Bearer ${token}` };
  const response = await fetch(`${INSTAGRAM_AGENT_URL}/exports/${jobId}/events?last_event_id=${encodeURIComponent(lastEventId)}`, { headers, signal, cache: "no-store" });
  if (!response.ok || !response.body) throw new Error("No se pudo abrir el canal de progreso.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
    let boundary;
    while ((boundary = buffer.indexOf("\n\n")) >= 0) {
      const parsed = parseEventBlock(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
      if (parsed) onEvent(parsed);
    }
  }
}
