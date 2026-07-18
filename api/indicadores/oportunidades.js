const REQUEST_TIMEOUT_MS = 7000;

export const SOURCES = Object.freeze({
  inflation: {
    seriesId: "F089.IPC.V12.14.M",
    url: "https://si3.bcentral.cl/siete/ES/Siete/Cuadro/CAP_EXP_ECO/MN_EXP_EC11/EXE_BCCH_01?idSerie=F089.IPC.V12.14.M",
  },
  depositClp: {
    seriesId: "F022.CAP.TIN.AN01.NO.Z.M",
    url: "https://si3.bcentral.cl/siete/ES/Siete/Cuadro/CAP_MERC_CAPT/MN_MERC_CAPT/TSF_34?idSerie=F022.CAP.TIN.AN01.NO.Z.M",
  },
  depositUf: {
    seriesId: "F022.CAP.TIN.AN01.RE.Z.M",
    url: "https://si3.bcentral.cl/siete/ES/Siete/Cuadro/CAP_MERC_CAPT/MN_MERC_CAPT/TSF_35?idSerie=F022.CAP.TIN.AN01.RE.Z.M",
  },
  mortgageUf: {
    seriesId: "F022.VIV.TIP.MA03.UF.Z.M",
    url: "https://si3.bcentral.cl/siete/ES/Siete/Cuadro/CAP_TASA_INTERES/MN_TASA_INTERES_09/TSF_27?idSerie=F022.VIV.TIP.MA03.UF.Z.M",
  },
  pensionFunds: {
    url: "https://www.spensiones.cl/apps/rentabilidad/getRentabilidad.php?tiprent=FP",
  },
});

const MONTHS = Object.freeze({ Ene: "01", Feb: "02", Mar: "03", Abr: "04", May: "05", Jun: "06", Jul: "07", Ago: "08", Sep: "09", Oct: "10", Nov: "11", Dic: "12" });

export function parseChileanNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const compact = value.replace(/%|\s/g, "");
  const cleaned = compact.includes(",") ? compact.replace(/\./g, "").replace(",", ".") : compact;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseBcchDate(label) {
  const value = String(label || "").trim();
  let match = value.match(/^(\d{1,2})\.([A-ZÁÉÍÓÚa-záéíóú]{3})\.(\d{4})$/u);
  if (match && MONTHS[match[2]]) return `${match[3]}-${MONTHS[match[2]]}-${String(match[1]).padStart(2, "0")}`;
  match = value.match(/^([A-ZÁÉÍÓÚa-záéíóú]{3})\.(\d{4})$/u);
  if (match && MONTHS[match[1]]) return `${match[2]}-${MONTHS[match[1]]}-01`;
  return null;
}

export function parseBcchPublicSeriesHtml(html) {
  const card = String(html || "").match(/<p[^>]*class=["']text-enc-3["'][^>]*>([\s\S]*?)<\/p>/i)?.[1];
  if (!card) return null;
  const observation = card.match(/([0-9]{1,2}\.[A-Za-zÁÉÍÓÚáéíóú]{3}\.[0-9]{4}|[A-Za-zÁÉÍÓÚáéíóú]{3}\.[0-9]{4})\s*:\s*<b[^>]*>\s*([^<]+)\s*<\/b>/u);
  if (!observation) return null;
  const value = parseChileanNumber(observation[2]);
  const effectiveDate = parseBcchDate(observation[1]);
  if (!Number.isFinite(value) || !effectiveDate) return null;
  const updatedLabel = card.match(/Actualizado:\s*([^<\r\n]+)/i)?.[1]?.trim();
  return { value, effectiveDate, updatedDate: parseBcchDate(updatedLabel) || effectiveDate };
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&Uacute;/gi, "Ú").replace(/&iacute;/gi, "í").replace(/&oacute;/gi, "ó")
    .replace(/&aacute;/gi, "á").replace(/&eacute;/gi, "é").replace(/&ntilde;/gi, "ñ")
    .replace(/&nbsp;/gi, " ").replace(/&#0*37;/gi, "%").replace(/&amp;/gi, "&");
}

export function parsePensionFundReturnsHtml(html) {
  const source = String(html || "");
  const period = decodeEntities(source.match(/FONDO TIPO A[\s\S]{0,180}<br>\s*([^<]+)</i)?.[1] || "").replace(/\s*-\s*En porcentaje\s*$/i, "").trim();
  const funds = [];
  for (const fund of ["A", "B", "C", "D", "E"]) {
    const section = source.match(new RegExp(`RENTABILIDAD REAL DEL FONDO TIPO ${fund}([\\s\\S]*?)(?=RENTABILIDAD REAL DEL FONDO TIPO [A-E]|\\[1\\])`, "i"))?.[1];
    const row = section?.match(/<td[^>]*>\s*SISTEMA\s*<\/td>([\s\S]*?)<\/tr>/i)?.[1];
    if (!row) continue;
    const values = [...row.matchAll(/<td[^>]*>\s*([^<]+?)\s*<\/td>/gi)].map((match) => parseChileanNumber(decodeEntities(match[1]))).filter(Number.isFinite);
    if (values.length < 4) continue;
    funds.push({ fund, monthRate: values[0], yearToDateRate: values[1], last12MonthsRate: values[2], longTermAnnualRate: values[3] });
  }
  return funds.length === 5 ? { period: period || null, funds } : null;
}

async function fetchText(url, fetchImpl = fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, { signal: controller.signal, headers: { Accept: "text/html,application/json" } });
    if (!response.ok) throw new Error(`Proveedor respondió ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function apiObservation(payload) {
  const observations = payload?.Series?.Obs || payload?.series?.obs || payload?.Obs;
  const items = Array.isArray(observations) ? observations : observations ? [observations] : [];
  for (const item of [...items].reverse()) {
    const value = parseChileanNumber(item?.value ?? item?.Value);
    const rawDate = item?.indexDateString ?? item?.IndexDateString ?? item?.date ?? item?.Date;
    const isoDate = /^\d{4}-\d{2}-\d{2}/.test(String(rawDate || "")) ? String(rawDate).slice(0, 10) : parseBcchDate(rawDate);
    if (Number.isFinite(value) && isoDate) return { value, effectiveDate: isoDate, updatedDate: isoDate };
  }
  return null;
}

export async function fetchBcchApiSeries(seriesId, { user, password, fetchImpl = fetch, now = new Date() } = {}) {
  if (!user || !password) return null;
  const last = now.toISOString().slice(0, 10);
  const first = new Date(now.getTime() - 400 * 86400000).toISOString().slice(0, 10);
  const url = new URL("https://si3.bcentral.cl/SieteRestWS/SieteRestWS.ashx");
  url.searchParams.set("user", user);
  url.searchParams.set("pass", password);
  url.searchParams.set("firstdate", first);
  url.searchParams.set("lastdate", last);
  url.searchParams.set("timeseries", seriesId);
  url.searchParams.set("function", "GetSeries");
  const text = await fetchText(url, fetchImpl);
  return apiObservation(JSON.parse(text));
}

async function resolveBcchSeries(source, options) {
  try {
    const fromApi = await fetchBcchApiSeries(source.seriesId, options);
    if (fromApi) return { ...fromApi, access: "bde-api" };
  } catch { /* Se continúa con la página pública oficial. */ }
  try {
    const fromPublicPage = parseBcchPublicSeriesHtml(await fetchText(source.url, options.fetchImpl));
    if (fromPublicPage) return { ...fromPublicPage, access: "public-page" };
  } catch { /* La interfaz mostrará la indisponibilidad sin inventar una tasa. */ }
  return null;
}

function alternative(id, label, rate, basis, kind, detail, source, extra = {}) {
  return { id, label, annualRate: rate, basis, kind, detail, source, ...extra };
}

export async function resolveOpportunityIndicators({
  user = process.env.BCCH_API_USER,
  password = process.env.BCCH_API_PASSWORD,
  fetchImpl = fetch,
  now = new Date(),
} = {}) {
  const options = { user, password, fetchImpl, now };
  const [inflation, depositClp, depositUf, mortgageUf, pensionData] = await Promise.all([
    resolveBcchSeries(SOURCES.inflation, options),
    resolveBcchSeries(SOURCES.depositClp, options),
    resolveBcchSeries(SOURCES.depositUf, options),
    resolveBcchSeries(SOURCES.mortgageUf, options),
    fetchText(SOURCES.pensionFunds.url, fetchImpl).then(parsePensionFundReturnsHtml).catch(() => null),
  ]);

  const bcchSource = (item, url) => ({ name: "Banco Central de Chile", url, effectiveDate: item?.effectiveDate || null, updatedDate: item?.updatedDate || null });
  const alternatives = [];
  if (depositUf) alternatives.push(alternative("deposit-uf", "En UF · sistema bancario BCCh · 90 a 365 días", depositUf.value, "real-uf", "deposit", "Benchmark del Banco Central de Chile: tasa promedio ponderada de depósitos en UF efectivamente cursados por bancos comerciales, con plazos de 90 días a un año. No corresponde a la oferta de un banco específico.", bcchSource(depositUf, SOURCES.depositUf.url)));
  if (depositClp) alternatives.push(alternative("deposit-clp", "En Pesos · sistema bancario BCCh · 90 a 365 días", depositClp.value, "nominal-clp", "deposit", "Benchmark del Banco Central de Chile: tasa nominal anualizada promedio ponderada de depósitos en pesos efectivamente cursados por bancos comerciales, con plazos de 90 días a un año. No corresponde a la oferta de un banco específico.", bcchSource(depositClp, SOURCES.depositClp.url)));
  if (pensionData) {
    const riskLabel = { A: "más riesgoso", B: "riesgoso", C: "intermedio", D: "conservador", E: "más conservador" };
    for (const item of pensionData.funds) {
      const source = { name: "Superintendencia de Pensiones", url: SOURCES.pensionFunds.url, effectiveDate: pensionData.period };
      const detail = `Retorno histórico anual promedio del sistema para el Fondo ${item.fund}: UF + ${item.longTermAnnualRate.toLocaleString("es-CL", { maximumFractionDigits: 2 })}%; últimos 12 meses: UF + ${item.last12MonthsRate.toLocaleString("es-CL", { maximumFractionDigits: 2 })}%.`;
      alternatives.push(alternative(`cuenta2-${item.fund.toLowerCase()}`, `Cuenta 2 en Fondo ${item.fund} (${riskLabel[item.fund]})`, item.longTermAnnualRate, "real-uf", "cuenta2", `${detail} El retorno efectivo depende de la AFP, comisiones e impuestos aplicables.`, source, { last12MonthsRate: item.last12MonthsRate }));
    }
  }

  return {
    retrievedAt: now.toISOString(),
    status: inflation || mortgageUf || alternatives.length ? "available" : "unavailable",
    inflation: inflation ? { annualRate: inflation.value, basis: "nominal-clp", horizonMonths: 11, source: bcchSource(inflation, SOURCES.inflation.url), methodology: "Mediana de la Encuesta de Expectativas Económicas del BCCh: variación del IPC en 12 meses esperada dentro de 11 meses." } : null,
    mortgageRate: mortgageUf ? {
      annualRate: mortgageUf.value,
      basis: "effective-annual-uf",
      source: bcchSource(mortgageUf, SOURCES.mortgageUf.url),
      methodology: "Tasa efectiva anual promedio ponderada de créditos de vivienda en UF a más de tres años, correspondiente a operaciones efectivamente pactadas e informadas al Banco Central de Chile.",
    } : null,
    alternatives,
    caveat: "Los benchmarks de depósitos reflejan operaciones bancarias efectivas, pero no son una cotización contratable ni una oferta garantizada de un banco particular. Los retornos usados para Cuenta 2 son históricos y no predicen retornos futuros.",
  };
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Método no permitido" });
  }
  response.setHeader("Cache-Control", "public, s-maxage=21600, stale-while-revalidate=86400");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  try {
    return response.status(200).json(await resolveOpportunityIndicators());
  } catch {
    return response.status(200).json({ retrievedAt: new Date().toISOString(), status: "unavailable", inflation: null, mortgageRate: null, alternatives: [], caveat: "Fuentes oficiales temporalmente no disponibles." });
  }
}
