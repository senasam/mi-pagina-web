import test from "node:test";
import assert from "node:assert/strict";
import { fetchCmfUf, fetchSecondaryUf, handleUfQuery, parseOfficialNumber, resetUfCache, resolveUf, resolveUfForDate, resolveUfMonthEndSeries, validateUfRecord } from "../api/indicadores/uf.js";

const response = (payload, ok = true, status = 200) => ({ ok, status, json: async () => payload });

test("normaliza valores oficiales con separadores chilenos", () => {
  assert.equal(parseOfficialNumber("39.987,35"), 39987.35);
  assert.equal(parseOfficialNumber(39987.35), 39987.35);
  assert.equal(parseOfficialNumber("no disponible"), null);
});

test("valida valor, fecha y límites plausibles", () => {
  assert.deepEqual(validateUfRecord({ valueClp: "39.987,35", effectiveDate: "2026-07-18" }, new Date("2026-07-18T00:00:00Z")), { valueClp: 39987.35, effectiveDate: "2026-07-18" });
  assert.equal(validateUfRecord({ valueClp: 0, effectiveDate: "2026-07-18" }), null);
  assert.equal(validateUfRecord({ valueClp: 40000, effectiveDate: "fecha" }), null);
  assert.equal(validateUfRecord({ valueClp: 40000, effectiveDate: "2030-01-01" }, new Date("2026-07-18T00:00:00Z")), null);
});

test("interpreta el contrato JSON de CMF sin exponer la clave", async () => {
  let requested = "";
  const result = await fetchCmfUf("clave-privada", async (url) => { requested = String(url); return response({ UFs: [{ Valor: "39.987,35", Fecha: "2026-07-18" }] }); });
  assert.equal(result.valueClp, 39987.35);
  assert.equal(result.effectiveDate, "2026-07-18");
  assert.match(requested, /apikey=clave-privada/);
});

test("interpreta el proveedor secundario y rechaza payload incompleto", async () => {
  const valid = await fetchSecondaryUf(async () => response({ serie: [{ valor: 39987.35, fecha: "2026-07-18T04:00:00.000Z" }] }));
  assert.equal(valid.valueClp, 39987.35);
  const invalid = await fetchSecondaryUf(async () => response({ serie: [] }));
  assert.equal(invalid, null);
});

test("propaga errores de servidor, JSON inválido y timeout para activar fallback", async () => {
  await assert.rejects(() => fetchSecondaryUf(async () => response({}, false, 503)));
  await assert.rejects(() => fetchSecondaryUf(async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError("invalid"); } })));
  await assert.rejects(() => fetchSecondaryUf(async (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(new Error("abort"))))));
});


const NOW = new Date("2026-10-17T15:00:00Z");
const failing = async () => { throw new Error("caída"); };

test("UF de una fecha: usa CMF con la ruta del día y cachea el resultado", async () => {
  resetUfCache();
  const urls = [];
  const fetchImpl = async (url) => { urls.push(String(url)); return response({ UFs: [{ Valor: "37.754,47", Fecha: "2024-08-31" }] }); };
  const first = await resolveUfForDate({ fecha: "2024-08-31", apiKey: "k", fetchImpl, now: NOW });
  assert.equal(first.valueClp, 37754.47);
  assert.equal(first.sourceCategory, "cmf");
  assert.match(urls[0], /\/uf\/2024\/08\/dias\/31\?/);
  const second = await resolveUfForDate({ fecha: "2024-08-31", apiKey: "k", fetchImpl: failing, now: NOW });
  assert.equal(second.valueClp, 37754.47);
  assert.equal(urls.length, 1);
});

test("UF de una fecha: sin clave CMF usa mindicador con formato dd-mm-yyyy", async () => {
  resetUfCache();
  let requested = "";
  const result = await resolveUfForDate({ fecha: "2024-08-31", apiKey: "", now: NOW, fetchImpl: async (url) => { requested = String(url); return response({ serie: [{ fecha: "2024-08-31T04:00:00.000Z", valor: 37754.47 }] }); } });
  assert.equal(requested, "https://mindicador.cl/api/uf/31-08-2024");
  assert.equal(result.sourceCategory, "secondary-provider");
});

test("falla de ambas APIs: usa el último valor cacheado con su fecha y aviso; sin caché queda no disponible", async () => {
  resetUfCache();
  const empty = await resolveUfForDate({ fecha: "2026-10-17", apiKey: "k", fetchImpl: failing, now: NOW });
  assert.equal(empty.status, "unavailable");
  assert.equal(empty.valueClp, null);
  const current = await resolveUf({ apiKey: "k", fetchImpl: failing, now: NOW });
  assert.equal(current.status, "unavailable");

  await resolveUfForDate({ fecha: "2026-10-15", apiKey: "k", now: NOW, fetchImpl: async () => response({ UFs: [{ Valor: "41.162,73", Fecha: "2026-10-15" }] }) });
  const fallback = await resolveUfForDate({ fecha: "2026-10-17", apiKey: "k", fetchImpl: failing, now: NOW });
  assert.equal(fallback.status, "cached");
  assert.equal(fallback.stale, true);
  assert.equal(fallback.valueClp, 41162.73);
  assert.equal(fallback.effectiveDate, "2026-10-15");
  assert.equal(fallback.requestedDate, "2026-10-17");
});

test("serie de fin de mes: toma el último día de cada mes y reporta meses faltantes", async () => {
  resetUfCache();
  const fetchImpl = async (url) => {
    assert.match(String(url), /mindicador\.cl\/api\/uf\/2024$/);
    return response({ serie: [
      { fecha: "2024-12-31T03:00:00.000Z", valor: 38416.69 },
      { fecha: "2024-12-30T03:00:00.000Z", valor: 38414.22 },
      { fecha: "2024-11-30T03:00:00.000Z", valor: 38247.92 },
    ] });
  };
  const result = await handleUfQuery({ serie: "fin-de-mes", desde: "2024-10", hasta: "2024-12" }, { apiKey: "", fetchImpl, now: NOW });
  assert.deepEqual(result.values["2024-12"], { valueClp: 38416.69, effectiveDate: "2024-12-31" });
  assert.equal(result.values["2024-11"].valueClp, 38247.92);
  assert.deepEqual(result.missing, ["2024-10"]);
  assert.equal(result.status, "partial");
  const cachedYear = await resolveUfMonthEndSeries({ desde: "2024-11", hasta: "2024-12", apiKey: "", fetchImpl: failing, now: NOW });
  assert.equal(cachedYear.status, "complete", "un año pasado queda en caché y no se vuelve a pedir");
});

test("serie de fin de mes: rechaza rangos inválidos o demasiado largos", async () => {
  assert.equal((await resolveUfMonthEndSeries({ desde: "2024-13", hasta: "2024-12", now: NOW })).status, "unavailable");
  assert.match((await resolveUfMonthEndSeries({ desde: "2000-01", hasta: "2026-12", now: NOW })).error, /15 años/);
});
