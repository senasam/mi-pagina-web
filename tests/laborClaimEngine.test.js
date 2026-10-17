import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMonthlySeries, calendarDiff, computeContributions, computeScenarios, evaluateLaborClaim, paramAt, validateAssumptions,
} from "../src/labor-claim/laborClaimEngine.js";
import { businessToCalendarDays, chileanHolidays, easterSunday, isoDate } from "../src/labor-claim/holidays.js";
import { legalParams } from "../src/labor-claim/legalParams.js";
import { legalSources } from "../src/labor-claim/legalSources.js";
import { buildEmployerEmail, suggestedProposal } from "../src/labor-claim/employerEmail.js";

const close = (actual, expected, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≈ ${expected}`);
const component = (result, id) => result.components.find((item) => item.id === id);
const UF = 40000;

const baseInput = ({ series, ...overrides } = {}) => {
  const startDate = overrides.startDate || "2023-07-01";
  const endDate = overrides.endDate || "2026-06-30";
  return {
    startDate, endDate,
    series: series || buildMonthlySeries({ startDate, endDate, mode: "average", averagePrevious: 950000, lastThree: [1000000, 1100000, 900000] }),
    terminationType: "despido-injustificado", surchargeRate: 0.5,
    vacation: { pendingPeriods: 2, unpaidDaysTaken: 0 }, maternity: { pregnant: false },
    nullity: { enabled: true, months: 18 }, tutela: { enabled: true, months: 6 },
    afp: "habitat", health: { system: "fonasa" }, accidentAdditionalRate: 0,
    risk: { winProbability: 0.75, settlementRate: 0.6, lawyerFeeRate: 0.25 },
    ufValueClp: UF, ufByMonth: {}, calcDate: endDate,
    ...overrides,
  };
};

test("caso de referencia: base, indemnizaciones, recargo, nulidad, tutela y escenarios", () => {
  const input = baseInput();
  assert.equal(input.series.length, 36);
  assert.deepEqual(input.series.slice(-3).map((item) => item.gross), [1000000, 1100000, 900000]);
  assert.equal(input.series[0].gross, 950000);
  const result = evaluateLaborClaim(input);

  assert.equal(result.bases.isVariable, true);
  assert.equal(result.bases.indemnizationBase, 1000000);
  assert.equal(result.bases.vacationBase, 1000000);
  assert.equal(result.service.countedYears, 3);
  assert.equal(component(result, "aviso-previo").amount, 1000000);
  assert.equal(component(result, "anios-servicio").amount, 3000000);
  assert.match(component(result, "anios-servicio").formula, /3 años × \$1\.000\.000/);
  assert.equal(component(result, "recargo").amount, 1500000);
  assert.equal(component(result, "fuero-nulidad").amount, 18000000);
  assert.equal(component(result, "tutela").amount, 6000000);

  // Feriado: 2 × 15 + (11 meses × 1,25 + 29 días × 1,25/30) hábiles, contados desde el 1-jul-2026.
  // Hábiles: julio 22 (sin el 16), agosto 21 → 43 al 31-ago; el día 44 es el 1-sep → 63 días corridos + fracción.
  const vacation = result.vacation;
  close(vacation.proportionalDays, 11 * 1.25 + 29 * (1.25 / 30));
  close(vacation.businessDays, 30 + vacation.proportionalDays);
  assert.equal(vacation.lastDate, "2026-09-01");
  close(vacation.calendarDays, 63 + (vacation.businessDays - 44));
  close(component(result, "feriado").amount, vacation.calendarDays * (1000000 / 30));
  assert.equal(vacation.inhabilDays, 19);
  assert.match(component(result, "feriado").formula, /\+ 19 sábados, domingos y festivos \(contados del 01-07-2026 al 01-09-2026\)/);

  const total = 1000000 + 3000000 + 1500000 + vacation.amount + 18000000 + 6000000;
  close(result.claimTotal, total);
  const [renunciar, acuerdo, juicio] = result.scenarios;
  assert.equal(renunciar.net, 0);
  close(acuerdo.net, total * 0.6 * 0.75);
  close(juicio.net, total * 0.75 * 0.75);
  close(juicio.fee, total * 0.75 * 0.25);
});

test("cada componente y cada parámetro usado tiene una fuente registrada", () => {
  const result = evaluateLaborClaim(baseInput());
  const ids = new Set(legalSources.map((source) => source.id));
  result.components.forEach((item) => item.sourceIds.forEach((id) => assert.ok(ids.has(id), `fuente ${id} de ${item.id}`)));
  result.paramsUsed.forEach((param) => assert.ok(ids.has(param.fuenteId), `fuente ${param.fuenteId} de ${param.key}`));
  result.sources.forEach((source) => assert.ok(source.url?.startsWith("https://"), source.id));
});

test("desactivar una fila la excluye del total y de los escenarios", () => {
  const all = evaluateLaborClaim(baseInput());
  const withoutTutela = evaluateLaborClaim(baseInput({ excludedComponents: ["tutela"] }));
  close(withoutTutela.claimTotal, all.claimTotal - 6000000);
  assert.equal(component(withoutTutela, "tutela").enabled, false);
  close(withoutTutela.scenarios[2].gross, withoutTutela.claimTotal * 0.75);
});

test("sueldo sobre el tope de 90 UF: indemnizaciones con tope, tutela y nulidad sin tope", () => {
  const startDate = "2023-07-01";
  const endDate = "2026-06-30";
  const series = buildMonthlySeries({ startDate, endDate, mode: "average", averagePrevious: 5000000, lastThree: [5000000, 5000000, 5000000] });
  const result = evaluateLaborClaim(baseInput({ series }));
  assert.equal(result.bases.isVariable, false);
  assert.equal(result.bases.capApplied, true);
  assert.equal(result.bases.indemnizationBase, 90 * UF);
  assert.equal(component(result, "aviso-previo").amount, 3600000);
  assert.equal(component(result, "anios-servicio").amount, 3 * 3600000);
  assert.equal(component(result, "tutela").amount, 6 * 5000000);
  assert.equal(component(result, "fuero-nulidad").amount, 18 * 5000000);
  assert.ok(result.warnings.some((warning) => /tope de 90 UF/.test(warning)));
  // Cotizaciones: imponible limitado al tope AFP vigente en cada mes.
  const june = result.contributions.rows.at(-1);
  assert.equal(june.imponible, 90 * UF);
  assert.equal(june.imponibleCes, 5000000);
});

test("menos de 1 año trabajado: sin años de servicio ni recargo", () => {
  const result = evaluateLaborClaim(baseInput({ startDate: "2025-10-01", endDate: "2026-06-30", series: undefined }));
  assert.equal(result.service.eligible, false);
  assert.equal(component(result, "anios-servicio").amount, 0);
  assert.equal(component(result, "recargo").amount, 0);
  assert.equal(component(result, "aviso-previo").amount, 1000000);
  assert.equal(result.vacation.periods, 0);
});

test("fracción de 6 meses exactos no suma año; 6 meses y 1 día sí", () => {
  const exact = evaluateLaborClaim(baseInput({ startDate: "2020-01-01", endDate: "2022-06-30", series: undefined }));
  assert.deepEqual([exact.service.years, exact.service.months, exact.service.days], [2, 6, 0]);
  assert.equal(exact.service.countedYears, 2);
  const plusOne = evaluateLaborClaim(baseInput({ startDate: "2020-01-01", endDate: "2022-07-01", series: undefined }));
  assert.deepEqual([plusOne.service.years, plusOne.service.months, plusOne.service.days], [2, 6, 1]);
  assert.equal(plusOne.service.countedYears, 3);
});

test("más de 11 años: tope de 11 años y la Cuenta Individual de Cesantía se detiene a los 132 meses", () => {
  const startDate = "2015-01-01";
  const endDate = "2027-06-30";
  const series = buildMonthlySeries({ startDate, endDate, mode: "average", averagePrevious: 800000, lastThree: [800000, 800000, 800000] });
  const result = evaluateLaborClaim(baseInput({ startDate, endDate, series, calcDate: endDate }));
  assert.equal(result.service.uncappedYears, 12); // 12 años y 6 meses exactos
  assert.equal(result.service.countedYears, 11);
  assert.equal(component(result, "anios-servicio").amount, 11 * 800000);
  const rows = result.contributions.rows;
  assert.ok(rows[131].parts["afc-cic"] > 0);
  assert.equal(rows[132].parts["afc-cic"], 0);
  assert.ok(rows[132].parts["afc-fcs"] > 0);
  assert.ok(result.pendingParams.some((param) => param.key === "topeImponibleAfpUf"), "los topes 2015–2019 se informan como pendientes");
});

test("sueldo variable con meses en $0: indemnización usa 3 meses calendario; vacaciones, 3 meses trabajados", () => {
  const startDate = "2025-01-01";
  const endDate = "2026-07-31";
  const monthly = { "2026-03": 900000, "2026-04": 900000, "2026-05": 0, "2026-06": 1200000, "2026-07": 0 };
  const series = buildMonthlySeries({ startDate, endDate, mode: "monthly", monthly });
  const result = evaluateLaborClaim(baseInput({ startDate, endDate, series }));
  assert.equal(result.bases.isVariable, true);
  assert.equal(result.bases.indemnizationBase, 400000);
  assert.deepEqual(result.bases.vacationMonths, ["2026-03", "2026-04", "2026-06"]);
  assert.equal(result.bases.vacationBase, 1000000);
  assert.equal(result.contributions.rows.find((row) => row.month === "2026-05").total, 0);
});

test("fuero y nulidad no se suman: se usa el período mayor", () => {
  // Parto 2026-08-01 → postnatal hasta 2026-10-24 → fuero hasta 2027-10-24 (≈ 15,8 meses desde el 30-jun-2026).
  const withFuero = evaluateLaborClaim(baseInput({ maternity: { pregnant: true, dueDate: "2026-08-01" }, nullity: { enabled: true, months: 6 } }));
  assert.equal(withFuero.protectionKind, "fuero");
  assert.equal(withFuero.maternity.fueroEnd, "2027-10-24");
  close(withFuero.protectionMonths, 15 + 24 / 30);
  assert.match(component(withFuero, "fuero-nulidad").formula, /período mayor/);
  const withNullity = evaluateLaborClaim(baseInput({ maternity: { pregnant: true, dueDate: "2026-08-01" }, nullity: { enabled: true, months: 18 } }));
  assert.equal(withNullity.protectionKind, "nulidad");
  assert.equal(component(withNullity, "fuero-nulidad").amount, 18000000);
});

test("cotizaciones de un mes con tasas vigentes (septiembre 2026)", () => {
  const series = [{ month: "2026-09", gross: 1000000 }];
  const read = (key, month) => paramAt(key, month).valor;
  const result = computeContributions(series, { afp: "habitat", health: { system: "fonasa" } }, { ufByMonth: { "2026-09": 41057.2 }, ufValueClp: UF }, read);
  const parts = result.rows[0].parts;
  close(parts["afp-cuenta"], 101000); // 10% + 0,1% Ley 21.735
  close(parts["afp-comision"], 12700);
  close(parts.sis, 17800);
  close(parts["seguro-social"], 16200); // 0,9% rentabilidad protegida + 0,72% expectativa de vida
  close(parts.salud, 70000);
  close(parts["afc-cic"], 22000); // 0,6% + 1,6%
  close(parts["afc-fcs"], 8000);
  close(parts.mutual, 9000);
  close(parts.otros, 300);
  close(result.total, 257000);
  assert.deepEqual(result.missingUfMonths, []);
});

test("tope imponible con la UF de fin de cada mes, no con la UF de hoy", () => {
  const series = [{ month: "2024-03", gross: 5000000 }, { month: "2026-03", gross: 5000000 }];
  const read = (key, month) => paramAt(key, month).valor;
  const result = computeContributions(series, { afp: "uno" }, { ufByMonth: { "2024-03": 37093.52, "2026-03": 39841.72 }, ufValueClp: 41000 }, read);
  close(result.rows[0].imponible, 84.3 * 37093.52);
  close(result.rows[1].imponible, 90 * 39841.72);
  close(result.rows[0].parts["afp-comision"], 84.3 * 37093.52 * 0.0049);
  close(result.rows[1].parts["afp-comision"], 90 * 39841.72 * 0.0046);
});

test("escenarios netos", () => {
  const [, acuerdo, juicio] = computeScenarios(10000000, { winProbability: 0.75, settlementRate: 0.6, lawyerFeeRate: 0.25 });
  assert.equal(acuerdo.net, 4500000);
  assert.equal(juicio.net, 5625000);
});

test("validación de supuestos", () => {
  const errors = validateAssumptions({ ...baseInput(), endDate: "2020-01-01", afp: "x", ufValueClp: 0, tutela: { enabled: true, months: 12 }, risk: { winProbability: 2, settlementRate: 0.5, lawyerFeeRate: 0.2 } });
  assert.ok(errors.endDate && errors.afp && errors.uf && errors.tutelaMonths && errors.winProbability);
  assert.deepEqual(validateAssumptions(baseInput()), {});
});

test("feriado proporcional: ejemplo de la Dirección del Trabajo (10,08 hábiles → 14,08 corridos)", () => {
  const result = evaluateLaborClaim(baseInput({ startDate: "2021-03-15", endDate: "2021-11-17", vacation: { pendingPeriods: 0 }, series: undefined }));
  close(result.vacation.proportionalDays, 10 + 2 * (1.25 / 30));
  close(result.vacation.calendarDays, 14 + 2 * (1.25 / 30));
});

test("feriados legales con traslados", () => {
  assert.equal(isoDate(easterSunday(2026)), "2026-04-05");
  const y2026 = chileanHolidays(2026).map((item) => item.date);
  assert.ok(y2026.includes("2026-04-03") && y2026.includes("2026-04-04"));
  assert.ok(y2026.includes("2026-06-21"));
  assert.ok(y2026.includes("2026-10-12")); // lunes
  const y2023 = chileanHolidays(2023).map((item) => item.date);
  assert.ok(y2023.includes("2023-10-09"), "12 de octubre jueves → lunes 9");
  assert.ok(y2023.includes("2023-10-27"), "31 de octubre martes → viernes 27");
  assert.ok(y2023.includes("2023-06-26"), "29 de junio jueves → lunes 26");
  const conversion = businessToCalendarDays("2026-09-16", 3); // 17 jue, [18 vie y 19 sáb feriados, 20 dom], 21 lun, 22 mar
  assert.equal(conversion.lastDate, "2026-09-22");
  assert.equal(conversion.calendarDays, 6);
});

test("diferencia calendario y parámetros versionados", () => {
  assert.deepEqual(calendarDiff("2024-01-31", "2024-03-01"), { years: 0, months: 1, days: 1, totalMonths: 1 });
  assert.equal(paramAt("topeImponibleAfpUf", "2026-01").valor, 89.9);
  assert.equal(paramAt("topeImponibleAfpUf", "2026-02").valor, 90);
  assert.equal(paramAt("aporteEmpleador21735", "2026-07").valor.incluyeSis, false);
  assert.equal(paramAt("aporteEmpleador21735", "2026-08").valor.incluyeSis, true);
  assert.throws(() => paramAt("noExiste", "2026-01"));
  Object.entries(legalParams).forEach(([key, value]) => {
    const lists = Array.isArray(value) ? [[key, value]] : Object.entries(value).map(([sub, list]) => [`${key}.${sub}`, list]);
    lists.forEach(([name, list]) => list.forEach((entry, index) => {
      assert.ok(entry.fuenteId, `${name} sin fuente`);
      if (index > 0) assert.ok(list[index - 1].vigenteHasta < entry.vigenteDesde, `${name}: tramos superpuestos en ${entry.vigenteDesde}`);
    }));
  });
});

test("gratificación legal: 25% con tope de 4,75 ingresos mínimos al año, solo los últimos 24 meses", () => {
  const result = evaluateLaborClaim(baseInput({ gratification: { enabled: true } }));
  const grat = component(result, "gratificacion");
  assert.equal(result.gratification.months, 24);
  assert.equal(result.gratification.rows[0].month, "2024-07");
  // Con boletas de ~$1.000.000 el 25% supera el tope todos los meses.
  close(grat.amount, (4.75 / 12) * (7 * 500000 + 5 * 510636 + 6 * 529000 + 6 * 539000));
  assert.deepEqual(grat.sourceIds, ["ct-47-50", "ct-510"]);
  const low = evaluateLaborClaim(baseInput({ gratification: { enabled: true }, series: buildMonthlySeries({ startDate: "2023-07-01", endDate: "2026-06-30", mode: "average", averagePrevious: 400000, lastThree: [400000, 400000, 400000] }) }));
  close(component(low, "gratificacion").amount, 24 * 100000);
  assert.equal(component(evaluateLaborClaim(baseInput()), "gratificacion"), undefined);
});

test("exposición del empleador y correo de propuesta de acuerdo", () => {
  const result = evaluateLaborClaim(baseInput({ gratification: { enabled: true } }));
  close(result.exposure.total, result.claimTotal + result.contributions.total + result.latePayment.total);
  // Sugerido: cotizaciones completas con reajustes e intereses + lo que recibiría si gana el juicio, descontado el honorario del abogado.
  const suggested = suggestedProposal(result, 0.25);
  assert.equal(suggested % 1000, 0);
  const charges = result.latePayment.reajuste + result.latePayment.interes;
  close(suggested, result.contributions.total + charges + result.claimTotal * 0.75, 500);

  const email = buildEmployerEmail(result, {
    employeeName: "Ana Pérez", employerName: "Empresa Demo SpA", startDate: "2023-07-01", endDate: "2026-06-30", responseDays: 7,
    lawyerFeeRate: 0.25, evidence: ["boletas", "mensajes", "clientes"], evidenceOther: "grabaciones de reuniones", rightsDescription: "me despidieron tras reclamar por mi contrato.",
  });
  assert.equal(email.proposal, suggested);
  close(email.toEmployee, suggested - result.contributions.total - charges);
  close(email.contributionsWithCharges, result.contributions.total + charges);
  assert.match(email.subject, /Ana Pérez/);
  assert.match(email.body, /^Estimado\(a\) Empresa Demo SpA:/);
  result.components.forEach((item) => assert.ok(email.body.includes(item.label), item.label));
  assert.ok(email.body.includes("Ley 17.322"));
  assert.match(email.body, /boletas de honorarios emitidas mes a mes/);
  assert.match(email.body, /WhatsApp/);
  assert.match(email.body, /Clientes o proveedores que pueden declarar que les atendí en nombre de la empresa\./);
  assert.match(email.body, / {3}- Grabaciones de reuniones\./);
  assert.match(email.body, /afectó mis derechos fundamentales: me despidieron tras reclamar por mi contrato\. Por eso/);
  assert.match(email.body, /Todos estos montos son estimaciones/);
  assert.match(email.body, /dentro de 7 días hábiles/);
  assert.match(email.body, /artículo 162/);
  assert.doesNotMatch(email.body, /evaluaré presentar la demanda/);
  assert.match(email.body, /^Te escribo con el ánimo/m);
  assert.doesNotMatch(email.body, /(Le escribo|Le propongo|Le menciono|le acomode|Le agradecería)/);
  assert.doesNotMatch(email.body, /evitaría los reajustes/);
  assert.match(email.body, /un acuerdo entre nosotros no los elimina/);
  assert.match(email.body, /artículo 19 del DL 3\.500/);
  assert.match(email.body, /Fundamentos legales\n/);
  assert.ok(email.body.includes("https://www.bcn.cl/leychile/navegar?idNorma=207436"));
  email.sources.forEach((source) => { assert.notEqual(source.estado, "pendiente"); assert.ok(email.body.includes(source.url)); });
  assert.ok(email.sources.some((source) => source.id === "ct-489"));

  const withoutTutela = buildEmployerEmail(evaluateLaborClaim(baseInput({ tutela: { enabled: false } })), {});
  assert.match(withoutTutela.body, /no estoy reclamando una vulneración de derechos fundamentales/);
  assert.match(withoutTutela.body, /\[nombre del empleador o empresa\]/);
  assert.doesNotMatch(withoutTutela.body, /Cuento con antecedentes/);
});

test("las vacaciones proporcionales del período en curso se suman al total demandado", () => {
  // Inicio 1-jul-2023, término 15-oct-2026: período en curso desde el 1-jul-2026 = 3 meses y 14 días.
  const startDate = "2023-07-01";
  const endDate = "2026-10-15";
  const series = buildMonthlySeries({ startDate, endDate, mode: "average", averagePrevious: 1000000, lastThree: [1000000, 1000000, 1000000] });
  const withoutPending = evaluateLaborClaim(baseInput({ startDate, endDate, series, vacation: { pendingPeriods: 0 } }));
  const vacation = withoutPending.vacation;
  assert.equal(vacation.currentPeriodStart, "2026-07-01");
  assert.equal(vacation.completedYears, 3);
  close(vacation.proportionalDays, 3 * 1.25 + 14 * (1.25 / 30));
  close(vacation.businessDays, vacation.proportionalDays);
  const row = component(withoutPending, "feriado");
  assert.ok(row.amount > 0 && row.enabled);
  close(withoutPending.claimTotal, withoutPending.components.filter((item) => item.enabled).reduce((sum, item) => sum + item.amount, 0));
  const excluded = evaluateLaborClaim(baseInput({ startDate, endDate, series, vacation: { pendingPeriods: 0 }, excludedComponents: ["feriado"] }));
  close(withoutPending.claimTotal - excluded.claimTotal, row.amount);
  // Con 2 períodos pendientes se suman 30 días hábiles al mismo proporcional.
  const withPending = evaluateLaborClaim(baseInput({ startDate, endDate, series, vacation: { pendingPeriods: 2 } }));
  close(withPending.vacation.businessDays, 30 + vacation.proportionalDays);
  assert.ok(buildEmployerEmail(withoutPending, {}).body.includes(`${row.label}: `));
});
