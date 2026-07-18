import test from "node:test";
import assert from "node:assert/strict";
import { parseBcchDate, parseBcchPublicSeriesHtml, parseChileanNumber, parsePensionFundReturnsHtml, resolveOpportunityIndicators, SOURCES } from "../api/indicadores/oportunidades.js";

test("parses official Chilean numbers and BCCh dates", () => {
  assert.equal(parseChileanNumber("4.555,25%"), 4555.25);
  assert.equal(parseChileanNumber("3.25"), 3.25);
  assert.equal(parseBcchDate("15.Jul.2026"), "2026-07-15");
  assert.equal(parseBcchDate("Jun.2026"), "2026-06-01");
});

test("parses the latest observation from a public BCCh series card", () => {
  const html = '<p class="text-enc-3"> Jul.2026: <b>3,0</b><br /> Actualizado: 10.Jul.2026 </p>';
  assert.deepEqual(parseBcchPublicSeriesHtml(html), { value: 3, effectiveDate: "2026-07-01", updatedDate: "2026-07-10" });
});

test("parses system real returns for all five pension funds", () => {
  const section = (fund, values) => `<table><tr><th>RENTABILIDAD REAL DEL FONDO TIPO ${fund} DEFLACTADA POR LA UF (1)<br>Junio de 2026 - En porcentaje</th></tr><tr><td>SISTEMA</td>${values.map((value) => `<td align=right>${value}%</td>`).join("")}</tr></table>`;
  const html = [section("A", ["1,83", "8,72", "19,71", "5,97"]), section("B", ["1,32", "6,55", "15,74", "5,14"]), section("C", ["0,95", "3,02", "10,25", "4,39", "7,21"]), section("D", ["0,50", "-0,01", "5,59", "3,59"]), section("E", ["0,46", "-2,63", "1,43", "2,96", "3,61"]), "[1] Nota"].join("");
  const parsed = parsePensionFundReturnsHtml(html);
  assert.equal(parsed.funds.length, 5);
  assert.deepEqual(parsed.funds.find((item) => item.fund === "C"), { fund: "C", monthRate: 0.95, yearToDateRate: 3.02, last12MonthsRate: 10.25, longTermAnnualRate: 4.39 });
});

test("builds comparable alternatives using only official mocked responses", async () => {
  const bcch = (value, period = "Jun.2026") => `<p class="text-enc-3"> ${period}: <b>${value}</b><br /> Actualizado: 10.Jul.2026 </p>`;
  const fundSection = (fund, longTerm) => `<table><tr><th>RENTABILIDAD REAL DEL FONDO TIPO ${fund} DEFLACTADA POR LA UF (1)<br>Junio de 2026 - En porcentaje</th></tr><tr><td>SISTEMA</td><td>1,0%</td><td>2,0%</td><td>3,0%</td><td>${longTerm}%</td></tr></table>`;
  const pensionHtml = [fundSection("A", "5,9"), fundSection("B", "5,1"), fundSection("C", "4,4"), fundSection("D", "3,6"), fundSection("E", "3,0"), "[1] Nota"].join("");
  const fetchImpl = async (url) => ({ ok: true, text: async () => url === SOURCES.pensionFunds.url ? pensionHtml : url.includes("EXE_BCCH") ? bcch("3,0", "Jul.2026") : url.includes("TSF_34") ? bcch("4,55") : url.includes("TSF_27") ? bcch("3,97") : bcch("2,62") });
  const result = await resolveOpportunityIndicators({ fetchImpl, now: new Date("2026-07-18T12:00:00Z") });
  assert.equal(result.inflation.annualRate, 3);
  assert.equal(result.mortgageRate.annualRate, 3.97);
  assert.equal(result.mortgageRate.basis, "effective-annual-uf");
  assert.match(result.mortgageRate.methodology, /operaciones efectivamente pactadas/);
  assert.equal(result.alternatives.find((item) => item.id === "deposit-clp").basis, "nominal-clp");
  assert.equal(result.alternatives.find((item) => item.id === "deposit-uf").basis, "real-uf");
  assert.match(result.alternatives.find((item) => item.id === "deposit-uf").label, /sistema bancario BCCh · 90 a 365 días/);
  assert.match(result.alternatives.find((item) => item.id === "deposit-clp").detail, /efectivamente cursados por bancos comerciales/);
  assert.equal(result.alternatives.find((item) => item.id === "cuenta2-c").annualRate, 4.4);
  assert.equal(result.alternatives.length, 7);
  assert.equal(result.alternatives.some((item) => item.kind === "afp"), false);
});
