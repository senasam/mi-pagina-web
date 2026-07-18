const REQUEST_TIMEOUT_MS = 4500;
const MAX_FUTURE_DAYS = 40;
let lastKnownValid = null;

export function parseOfficialNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const compact = value.trim().replace(/\s|\$/g, "");
  const normalized = compact.includes(",")
    ? compact.replace(/\./g, "").replace(",", ".")
    : compact;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function validateUfRecord(record, now = new Date()) {
  const valueClp = parseOfficialNumber(record?.valueClp);
  const date = new Date(`${record?.effectiveDate || ""}T12:00:00Z`);
  const futureLimit = new Date(now.getTime() + MAX_FUTURE_DAYS * 86400000);
  if (!(valueClp > 0) || valueClp < 1000 || valueClp > 200000 || Number.isNaN(date.getTime()) || date > futureLimit) return null;
  return { valueClp, effectiveDate: date.toISOString().slice(0, 10) };
}

async function fetchJson(url, fetchImpl = fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Proveedor respondió ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchCmfUf(apiKey, fetchImpl = fetch) {
  if (!apiKey) return null;
  const url = new URL("https://api.cmfchile.cl/api-sbifv3/recursos_api/uf");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("formato", "json");
  const payload = await fetchJson(url, fetchImpl);
  const item = payload?.UFs?.[0] || payload?.UFs?.UF?.[0] || payload?.UFs?.UF;
  return validateUfRecord({ valueClp: item?.Valor, effectiveDate: item?.Fecha });
}

export async function fetchSecondaryUf(fetchImpl = fetch) {
  const payload = await fetchJson("https://mindicador.cl/api/uf", fetchImpl);
  const item = Array.isArray(payload?.serie) ? payload.serie[0] : null;
  return validateUfRecord({ valueClp: item?.valor, effectiveDate: item?.fecha?.slice?.(0, 10) });
}

export async function resolveUf({ apiKey = process.env.CMF_API_KEY, fetchImpl = fetch, now = new Date() } = {}) {
  const retrievedAt = now.toISOString();
  try {
    const official = await fetchCmfUf(apiKey, fetchImpl);
    if (official) {
      if (lastKnownValid && Math.abs(official.valueClp / lastKnownValid.valueClp - 1) > 0.1) throw new Error("Variación sospechosa");
      lastKnownValid = official;
      return { ...official, retrievedAt, sourceCategory: "cmf", status: "current", stale: false };
    }
  } catch { /* Se intenta un respaldo sin revelar detalles ni credenciales. */ }
  try {
    const secondary = await fetchSecondaryUf(fetchImpl);
    if (secondary) {
      if (lastKnownValid && Math.abs(secondary.valueClp / lastKnownValid.valueClp - 1) > 0.1) throw new Error("Variación sospechosa");
      lastKnownValid = secondary;
      return { ...secondary, retrievedAt, sourceCategory: "secondary-provider", status: "current", stale: false };
    }
  } catch { /* La calculadora puede continuar con caché o entrada manual. */ }
  if (lastKnownValid) return { ...lastKnownValid, retrievedAt, sourceCategory: "cache", status: "cached", stale: true };
  return { valueClp: null, effectiveDate: null, retrievedAt, sourceCategory: "unavailable", status: "unavailable", stale: true };
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Método no permitido" });
  }
  response.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=172800");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  try {
    return response.status(200).json(await resolveUf());
  } catch {
    return response.status(200).json({ valueClp: null, effectiveDate: null, retrievedAt: new Date().toISOString(), sourceCategory: "unavailable", status: "unavailable", stale: true });
  }
}

