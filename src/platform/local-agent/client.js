import { AgentRequestError } from "./errors.js";
import { streamAgentEvents } from "./events.js";
import { LOCAL_AGENT_URL } from "./config.js";
import { createSessionHeaders, randomAgentId } from "./security.js";

export { LOCAL_AGENT_URL } from "./config.js";

export const AGENT_TOKEN_KEY = "local-tools-agent-token";
export const AGENT_SESSION_KEY = "local-tools-agent-session";
export const AGENT_DEVICE_ID_KEY = "local-tools-device-id";
export const LEGACY_AGENT_TOKEN_KEYS = Object.freeze(["instagram-agent-pairing-token"]);

function browserStorage() {
  try { return globalThis.localStorage || null; }
  catch { return null; }
}

function timeoutSignal(milliseconds, parentSignal) {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new DOMException("Timeout", "TimeoutError")),
    milliseconds,
  );
  const abort = () => controller.abort(parentSignal?.reason);
  if (parentSignal?.aborted) abort();
  else parentSignal?.addEventListener("abort", abort, { once: true });
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      parentSignal?.removeEventListener("abort", abort);
    },
  };
}

function errorFromResponse(response, payload = {}) {
  const data = payload.error || payload;
  return new AgentRequestError(
    data.message || payload.detail || `El agente respondio con estado ${response.status}.`,
    {
      code: data.code || `AGENT_HTTP_${response.status}`,
      status: response.status,
      details: data.details || null,
      requestId: data.requestId || response.headers.get("X-Request-Id") || "",
      retryable: Boolean(data.retryable || response.status >= 500),
    },
  );
}

export async function agentFetchRaw(path, {
  token = "",
  session = null,
  timeout = 8000,
  signal,
  baseUrl = LOCAL_AGENT_URL,
  fetchImpl = globalThis.fetch,
  accept,
  ...options
} = {}) {
  const timed = timeoutSignal(timeout, signal);
  const headers = new Headers(options.headers || {});
  headers.set("Accept", accept || headers.get("Accept") || "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (session) {
    const signed = await createSessionHeaders({
      session,
      method: options.method || "GET",
      target: path,
      body: options.body || "",
    });
    for (const [name, value] of Object.entries(signed)) headers.set(name, value);
  }
  try {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...options,
      headers,
      signal: timed.signal,
      mode: "cors",
      cache: "no-store",
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw errorFromResponse(response, payload);
    }
    return response;
  } catch (error) {
    if (error instanceof AgentRequestError) throw error;
    if (signal?.aborted) {
      throw new AgentRequestError("La solicitud al agente fue cancelada.", {
        code: "AGENT_REQUEST_ABORTED", cause: error,
      });
    }
    if (error?.name === "AbortError" || error?.name === "TimeoutError") {
      throw new AgentRequestError("El agente local tardo demasiado en responder.", {
        code: "AGENT_TIMEOUT", retryable: true, cause: error,
      });
    }
    throw new AgentRequestError("No se pudo conectar con el agente local.", {
      code: "AGENT_UNAVAILABLE", retryable: true, cause: error,
    });
  } finally {
    timed.cleanup();
  }
}

export async function agentFetch(path, options = {}) {
  const response = await agentFetchRaw(path, options);
  if (response.status === 204) return null;
  return response.json();
}

const INITIAL_STATE = Object.freeze({
  status: "idle",
  connected: false,
  checking: false,
  pairing: false,
  health: null,
  info: null,
  capabilities: [],
  details: null,
  token: "",
  session: null,
  error: null,
});

export class AgentClient {
  constructor({
    baseUrl = LOCAL_AGENT_URL,
    fetchImpl = globalThis.fetch,
    storage = browserStorage(),
  } = {}) {
    this.baseUrl = baseUrl;
    this.fetchImpl = fetchImpl;
    this.storage = storage;
    this.listeners = new Set();
    const session = this.#readStoredSession();
    this.state = {
      ...INITIAL_STATE,
      token: session?.id || this.#readStoredToken(),
      session,
    };
  }

  #readStoredToken() {
    const current = this.storage?.getItem?.(AGENT_TOKEN_KEY) || "";
    if (current) return current;
    for (const key of LEGACY_AGENT_TOKEN_KEYS) {
      const legacy = this.storage?.getItem?.(key) || "";
      if (legacy) {
        this.storage?.setItem?.(AGENT_TOKEN_KEY, legacy);
        this.storage?.removeItem?.(key);
        return legacy;
      }
    }
    return "";
  }

  #readStoredSession() {
    try {
      const value = this.storage?.getItem?.(AGENT_SESSION_KEY);
      const session = value ? JSON.parse(value) : null;
      if (!session?.id || !session?.secret) return null;
      if (session.expiresAt && Number(session.expiresAt) * 1000 <= Date.now()) {
        this.storage?.removeItem?.(AGENT_SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      this.storage?.removeItem?.(AGENT_SESSION_KEY);
      return null;
    }
  }

  #deviceId() {
    let deviceId = this.storage?.getItem?.(AGENT_DEVICE_ID_KEY) || "";
    if (!deviceId) {
      deviceId = randomAgentId(24);
      this.storage?.setItem?.(AGENT_DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  #setState(update) {
    this.state = { ...this.state, ...update };
    for (const listener of this.listeners) listener();
  }

  #storeToken(token) {
    if (token) this.storage?.removeItem?.(AGENT_SESSION_KEY);
    if (token) this.storage?.setItem?.(AGENT_TOKEN_KEY, token);
    else this.storage?.removeItem?.(AGENT_TOKEN_KEY);
    for (const key of LEGACY_AGENT_TOKEN_KEYS) this.storage?.removeItem?.(key);
    this.#setState({ token, session: token ? null : this.state.session });
  }

  #storeSession(session) {
    if (session) this.storage?.setItem?.(AGENT_SESSION_KEY, JSON.stringify(session));
    else this.storage?.removeItem?.(AGENT_SESSION_KEY);
    if (session) {
      this.storage?.removeItem?.(AGENT_TOKEN_KEY);
      for (const key of LEGACY_AGENT_TOKEN_KEYS) this.storage?.removeItem?.(key);
    }
    this.#setState({ session, token: session?.id || "" });
  }

  subscribe = (listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.state;

  get token() { return this.state.token; }
  get session() { return this.state.session; }

  request(path, options = {}) {
    return agentFetch(path, {
      ...options,
      token: options.token ?? this.token,
      session: options.session ?? this.session,
      baseUrl: this.baseUrl,
      fetchImpl: this.fetchImpl,
    });
  }

  requestRaw(path, options = {}) {
    return agentFetchRaw(path, {
      ...options,
      token: options.token ?? this.token,
      session: options.session ?? this.session,
      baseUrl: this.baseUrl,
      fetchImpl: this.fetchImpl,
    });
  }

  async stream({ path, signal, onEvent }) {
    const sessionHeaders = await createSessionHeaders({
      session: this.session,
      method: "GET",
      target: path,
    });
    return streamAgentEvents({
      path,
      token: this.session ? "" : this.token,
      headers: sessionHeaders,
      signal,
      onEvent,
      baseUrl: this.baseUrl,
      fetchImpl: this.fetchImpl,
    });
  }

  listTasks({ capability, status, limit = 50 } = {}) {
    const query = new URLSearchParams();
    if (capability) query.set("capability", capability);
    if (status) query.set("status", status);
    query.set("limit", String(limit));
    return this.request(`/v1/tasks?${query}`);
  }

  getTask(taskId) {
    return this.request(`/v1/tasks/${encodeURIComponent(taskId)}`);
  }

  cancelTask(taskId) {
    return this.request(`/v1/tasks/${encodeURIComponent(taskId)}/cancel`, { method: "POST" });
  }

  streamTaskEvents({ taskId, lastEventId = 0, signal, onEvent }) {
    return this.stream({
      path: `/v1/tasks/${encodeURIComponent(taskId)}/events?last_event_id=${encodeURIComponent(lastEventId)}`,
      signal,
      onEvent,
    });
  }

  async runTask(capabilityId, operation, input = {}, idempotencyKey = undefined) {
    const body = {
      capabilityId,
      operation,
      operationVersion: "1",
      input,
    };
    if (idempotencyKey) body.idempotencyKey = idempotencyKey;
    try {
      const payload = await this.request("/v1/tasks", { method: "POST", body: JSON.stringify(body) });
      // payload may be { task: { ... } } or the task directly
      return payload.task || payload;
    } catch (error) {
      // propagate for the caller to handle or fallback to legacy endpoints
      throw error;
    }
  }

  async connect({ signal } = {}) {
    this.#setState({ status: "checking", checking: true, error: null });
    try {
      const health = await agentFetch("/health", {
        timeout: 1800, signal, baseUrl: this.baseUrl, fetchImpl: this.fetchImpl,
      });
      const explicitPairing = health.pairing === "explicit";
      let session = explicitPairing ? this.session : null;
      let token = explicitPairing ? "" : this.token;
      if (explicitPairing && this.state.token && !session) this.#storeToken("");

      if (session) {
        try {
          await agentFetch("/v1/agent", {
            session, timeout: 2500, signal, baseUrl: this.baseUrl, fetchImpl: this.fetchImpl,
          });
        } catch (error) {
          if (error.status === 401) {
            session = null;
            this.#storeSession(null);
          }
          else if (error.status !== 404) throw error;
        }
      }
      if (explicitPairing && !session) {
        this.#setState({ status: "pairing", pairing: true });
        const pairing = await agentFetch("/v1/pairing/requests", {
          method: "POST",
          body: JSON.stringify({
            deviceId: this.#deviceId(),
            deviceName: globalThis.navigator?.platform || "Navegador web",
          }),
          timeout: 120000,
          signal,
          baseUrl: this.baseUrl,
          fetchImpl: this.fetchImpl,
        });
        session = pairing.session;
        if (!session?.id || !session?.secret) {
          throw new AgentRequestError("El agente devolvio una sesion no valida.", {
            code: "PAIRING_RESPONSE_INVALID",
          });
        }
        this.#storeSession(session);
      } else if (!explicitPairing && token) {
        try {
          await agentFetch("/v1/agent", {
            token, timeout: 2500, signal, baseUrl: this.baseUrl, fetchImpl: this.fetchImpl,
          });
        } catch (error) {
          if (error.status === 401) token = "";
          else if (error.status !== 404) throw error;
        }
      }
      if (!explicitPairing && !token) {
        const pairing = await agentFetch("/pairing", {
          method: "POST", timeout: 3000, signal,
          baseUrl: this.baseUrl, fetchImpl: this.fetchImpl,
        });
        token = pairing.token;
        this.#storeToken(token);
      }

      let info;
      let catalog;
      try {
        const authentication = session ? { session } : { token };
        [info, catalog] = await Promise.all([
          agentFetch("/v1/agent", {
            ...authentication, timeout: 2500, signal, baseUrl: this.baseUrl, fetchImpl: this.fetchImpl,
          }),
          agentFetch("/v1/capabilities", {
            ...authentication, timeout: 10000, signal, baseUrl: this.baseUrl, fetchImpl: this.fetchImpl,
          }),
        ]);
      } catch (error) {
        if (error.status !== 404) throw error;
        info = {
          name: "Instagram Exporter Local Agent",
          agentVersion: health.version || "unknown",
          protocolVersions: ["legacy"],
          activeProtocolVersion: "legacy",
        };
        catalog = { capabilities: [] };
      }
      if (!info.protocolVersions?.some((version) => version === "1" || version === "legacy")) {
        throw new AgentRequestError("La version del agente no es compatible con esta pagina.", {
          code: "AGENT_PROTOCOL_INCOMPATIBLE",
        });
      }
      const details = await agentFetch("/v1/health", {
        ...(session ? { session } : { token }),
        timeout: 5000, signal, baseUrl: this.baseUrl, fetchImpl: this.fetchImpl,
      }).catch((error) => {
        if (error.status === 404) return null;
        throw error;
      });
      const next = {
        status: "connected",
        connected: true,
        checking: false,
        pairing: false,
        health,
        info,
        capabilities: catalog.capabilities || [],
        details,
        token: session?.id || token,
        session,
        error: null,
      };
      this.#setState(next);
      return next;
    } catch (error) {
      if (error.code === "AGENT_REQUEST_ABORTED") {
        this.#setState({ checking: false, pairing: false });
        throw error;
      }
      const status = error.code === "AGENT_PROTOCOL_INCOMPATIBLE" ? "incompatible" : "unavailable";
      this.#setState({
        status, connected: false, checking: false, pairing: false,
        health: null, info: null, capabilities: [], details: null, error,
      });
      throw error;
    }
  }

  clearSession() {
    this.#storeSession(null);
    this.#storeToken("");
    this.#setState({ ...INITIAL_STATE });
  }

  async revokeSession() {
    if (this.session) {
      await this.request("/v1/session/revoke", { method: "POST" });
    }
    this.clearSession();
  }
}

export const defaultAgentClient = new AgentClient();

// Facades temporales para consumidores antiguos; las features nuevas usan la instancia.
export const checkAgentHealth = (signal) => agentFetch("/health", { timeout: 1800, signal });
export const checkAgentCapabilities = (token, signal) => agentFetch("/v1/health", { token, timeout: 2500, signal });
export const pairWithAgent = (signal) => agentFetch("/pairing", { method: "POST", timeout: 3000, signal });
