const REQUEST_TIMEOUT_MS = 4500;
const MAX_FUTURE_DAYS = 40;
const MAX_SERIES_YEARS = 15;
let lastKnownValid = null;
// Cachés en memoria de la instancia: la UF de cada día no cambia una vez publicada.
const dayCache = new Map(); // "YYYY-MM-DD" → { valueClp, effectiveDate, sourceCategory }
const yearCache = new Map(); // "YYYY" → { fetchedOn, sourceCategory, values: Map(date → valueClp) }

export function resetUfCache() {
  lastKnownValid = null;
  dayCache.clear();
  yearCache.clear();
}

export function chileToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

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

const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) && !Number.isNaN(new Date(`${value}T12:00:00Z`).getTime());
const isMonthKey = (value) => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value || ""));
const lastDayOfMonth = (key) => {
  const [y, m] = key.split("-").map(Number);
  return `${key}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, "0")}`;
};

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

// CMF: { UFs: [{ Valor: "39.987,35", Fecha: "2026-07-18" }, ...] }
const cmfUrl = (path, apiKey) => {
  const url = new URL(`https://api.cmfchile.cl/api-sbifv3/recursos_api/uf${path}`);
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("formato", "json");
  return url;
};
const cmfItems = (payload) => {
  const list = payload?.UFs?.UF || payload?.UFs;
  return Array.isArray(list) ? list : list ? [list] : [];
};
// mindicador.cl: { serie: [{ fecha: "2026-07-18T04:00:00.000Z", valor: 39987.35 }, ...] } (fecha en UTC a medianoche de Chile).
const secondaryItems = (payload) => (Array.isArray(payload?.serie) ? payload.serie : []);
const toDdMmYyyy = (iso) => iso.split("-").reverse().join("-");

export async function fetchCmfUf(apiKey, fetchImpl = fetch, date = null) {
  if (!apiKey) return null;
  const path = date ? `/${date.slice(0, 4)}/${date.slice(5, 7)}/dias/${date.slice(8, 10)}` : "";
  const item = cmfItems(await fetchJson(cmfUrl(path, apiKey), fetchImpl))[0];
  return validateUfRecord({ valueClp: item?.Valor, effectiveDate: item?.Fecha });
}

export async function fetchSecondaryUf(fetchImpl = fetch, date = null) {
  const payload = await fetchJson(`https://mindicador.cl/api/uf${date ? `/${toDdMmYyyy(date)}` : ""}`, fetchImpl);
  const item = secondaryItems(payload)[0];
  return validateUfRecord({ valueClp: item?.valor, effectiveDate: item?.fecha?.slice?.(0, 10) });
}

export async function fetchCmfUfYear(apiKey, year, fetchImpl = fetch) {
  if (!apiKey) return null;
  const records = cmfItems(await fetchJson(cmfUrl(`/${year}`, apiKey), fetchImpl))
    .map((item) => validateUfRecord({ valueClp: item?.Valor, effectiveDate: item?.Fecha }))
    .filter(Boolean);
  return records.length ? records : null;
}

export async function fetchSecondaryUfYear(year, fetchImpl = fetch) {
  const records = secondaryItems(await fetchJson(`https://mindicador.cl/api/uf/${year}`, fetchImpl))
    .map((item) => validateUfRecord({ valueClp: item?.valor, effectiveDate: item?.fecha?.slice?.(0, 10) }))
    .filter(Boolean);
  return records.length ? records : null;
}

const unavailable = (retrievedAt, extra = {}) => ({ valueClp: null, effectiveDate: null, retrievedAt, sourceCategory: "unavailable", status: "unavailable", stale: true, ...extra });

export async function resolveUf({ apiKey = process.env.CMF_API_KEY, fetchImpl = fetch, now = new Date() } = {}) {
  const retrievedAt = now.toISOString();
  const today = chileToday(now);
  const cachedToday = dayCache.get(today);
  if (cachedToday) return { ...cachedToday, retrievedAt, status: "current", stale: false };
  try {
    const official = await fetchCmfUf(apiKey, fetchImpl);
    if (official) {
      if (lastKnownValid && Math.abs(official.valueClp / lastKnownValid.valueClp - 1) > 0.1) throw new Error("Variación sospechosa");
      lastKnownValid = official;
      dayCache.set(official.effectiveDate, { ...official, sourceCategory: "cmf" });
      return { ...official, retrievedAt, sourceCategory: "cmf", status: "current", stale: false };
    }
  } catch { /* Se intenta un respaldo sin revelar detalles ni credenciales. */ }
  try {
    const secondary = await fetchSecondaryUf(fetchImpl);
    if (secondary) {
      if (lastKnownValid && Math.abs(secondary.valueClp / lastKnownValid.valueClp - 1) > 0.1) throw new Error("Variación sospechosa");
      lastKnownValid = secondary;
      dayCache.set(secondary.effectiveDate, { ...secondary, sourceCategory: "secondary-provider" });
      return { ...secondary, retrievedAt, sourceCategory: "secondary-provider", status: "current", stale: false };
    }
  } catch { /* La calculadora puede continuar con caché o entrada manual. */ }
  if (lastKnownValid) return { ...lastKnownValid, retrievedAt, sourceCategory: "cache", status: "cached", stale: true };
  return unavailable(retrievedAt);
}

// UF de una fecha específica (por ejemplo, la fecha del despido). Si ambas fuentes fallan, usa el último valor cacheado
// en o antes de esa fecha e informa su fecha real.
export async function resolveUfForDate({ fecha, apiKey = process.env.CMF_API_KEY, fetchImpl = fetch, now = new Date() } = {}) {
  const retrievedAt = now.toISOString();
  if (!isIsoDate(fecha)) return unavailable(retrievedAt, { error: "Fecha inválida; usa YYYY-MM-DD." });
  const cached = dayCache.get(fecha);
  if (cached) return { ...cached, requestedDate: fecha, retrievedAt, status: "current", stale: false };
  const attempts = [
    ["cmf", () => fetchCmfUf(apiKey, fetchImpl, fecha)],
    ["secondary-provider", () => fetchSecondaryUf(fetchImpl, fecha)],
  ];
  for (const [sourceCategory, attempt] of attempts) {
    try {
      const record = await attempt();
      if (record && record.effectiveDate === fecha) {
        dayCache.set(fecha, { ...record, sourceCategory });
        return { ...record, requestedDate: fecha, retrievedAt, sourceCategory, status: "current", stale: false };
      }
    } catch { /* Se intenta la siguiente fuente. */ }
  }
  const fallback = [...dayCache.values()].filter((item) => item.effectiveDate <= fecha).sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0] || lastKnownValid;
  if (fallback) return { valueClp: fallback.valueClp, effectiveDate: fallback.effectiveDate, requestedDate: fecha, retrievedAt, sourceCategory: "cache", status: "cached", stale: true };
  return unavailable(retrievedAt, { requestedDate: fecha });
}

async function loadYear(year, { apiKey, fetchImpl, today }) {
  const cached = yearCache.get(year);
  const isPastYear = `${year}-12-31` < today;
  if (cached && (isPastYear || cached.fetchedOn === today)) return cached;
  const attempts = [
    ["cmf", () => fetchCmfUfYear(apiKey, year, fetchImpl)],
    ["secondary-provider", () => fetchSecondaryUfYear(year, fetchImpl)],
  ];
  for (const [sourceCategory, attempt] of attempts) {
    try {
      const records = await attempt();
      if (records) {
        const entry = { fetchedOn: today, sourceCategory, values: new Map(records.map((record) => [record.effectiveDate, record.valueClp])) };
        yearCache.set(year, entry);
        records.forEach((record) => { if (!dayCache.has(record.effectiveDate)) dayCache.set(record.effectiveDate, { ...record, sourceCategory }); });
        return entry;
      }
    } catch { /* Se intenta la siguiente fuente. */ }
  }
  return cached ? { ...cached, sourceCategory: "cache", stale: true } : null;
}

// UF del último día de cada mes entre `desde` y `hasta` (YYYY-MM), para topes imponibles históricos.
export async function resolveUfMonthEndSeries({ desde, hasta, apiKey = process.env.CMF_API_KEY, fetchImpl = fetch, now = new Date() } = {}) {
  const retrievedAt = now.toISOString();
  if (!isMonthKey(desde) || !isMonthKey(hasta) || desde > hasta) return { values: {}, missing: [], sources: {}, retrievedAt, status: "unavailable", error: "Rango inválido; usa desde=YYYY-MM y hasta=YYYY-MM." };
  const fromYear = Number(desde.slice(0, 4));
  const toYear = Number(hasta.slice(0, 4));
  if (toYear - fromYear + 1 > MAX_SERIES_YEARS) return { values: {}, missing: [], sources: {}, retrievedAt, status: "unavailable", error: `El rango no puede superar ${MAX_SERIES_YEARS} años.` };
  const today = chileToday(now);
  const values = {};
  const missing = [];
  const sources = {};
  for (let year = fromYear; year <= toYear; year += 1) {
    const entry = await loadYear(String(year), { apiKey, fetchImpl, today });
    if (entry) sources[year] = entry.sourceCategory;
    for (let month = 1; month <= 12; month += 1) {
      const key = `${year}-${String(month).padStart(2, "0")}`;
      if (key < desde || key > hasta) continue;
      const date = lastDayOfMonth(key);
      const valueClp = entry?.values.get(date) ?? dayCache.get(date)?.valueClp;
      if (valueClp > 0) values[key] = { valueClp, effectiveDate: date };
      else missing.push(key);
    }
  }
  const status = !Object.keys(values).length ? "unavailable" : missing.length || Object.values(sources).includes("cache") ? "partial" : "complete";
  return { values, missing, sources, retrievedAt, status };
}

// Punto de entrada común para Vercel y el servidor de desarrollo de Vite.
export async function handleUfQuery(query = {}, options = {}) {
  if (query.serie === "fin-de-mes") return resolveUfMonthEndSeries({ desde: query.desde, hasta: query.hasta, ...options });
  if (query.fecha) return resolveUfForDate({ fecha: query.fecha, ...options });
  return resolveUf(options);
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Método no permitido" });
  }
  const query = request.query || Object.fromEntries(new URL(request.url, "http://localhost").searchParams);
  // Valores históricos no cambian; el valor del día se renueva una vez al día.
  response.setHeader("Cache-Control", query.fecha || query.serie ? "public, s-maxage=86400, stale-while-revalidate=604800" : "public, s-maxage=3600, stale-while-revalidate=172800");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  try {
    return response.status(200).json(await handleUfQuery(query));
  } catch {
    return response.status(200).json(unavailable(new Date().toISOString()));
  }
}
