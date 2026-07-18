import test from "node:test";
import assert from "node:assert/strict";
import { fetchCmfUf, fetchSecondaryUf, parseOfficialNumber, validateUfRecord } from "../api/indicadores/uf.js";

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

