// Motor de evaluación económica de una demanda laboral por honorarios encubiertos.
// Funciones puras: reciben supuestos + parámetros legales y devuelven montos, fórmulas y fuentes.
// No hay números legales en este archivo: todos salen de legalParams.js.
import { AFP_OPTIONS, TERMINATION_TYPES, legalParams } from "./legalParams.js";
import { businessToCalendarDays } from "./holidays.js";
import { sourceById } from "./legalSources.js";

// ——— Utilidades de fecha (UTC, sin dependencia de la zona del navegador) ———
const pad = (value) => String(value).padStart(2, "0");
const parseDate = (iso) => {
  const [y, m, d] = String(iso || "").split("-").map(Number);
  return { y, m, d };
};
const daysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();
const toDate = ({ y, m, d }) => new Date(Date.UTC(y, m - 1, d));
const fromDate = (date) => ({ y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() });
const isoOf = ({ y, m, d }) => `${y}-${pad(m)}-${pad(d)}`;
export const isValidIsoDate = (iso) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ""))) return false;
  const parts = parseDate(iso);
  return parts.m >= 1 && parts.m <= 12 && parts.d >= 1 && parts.d <= daysInMonth(parts.y, parts.m);
};
export const addDaysIso = (iso, days) => isoOf(fromDate(new Date(toDate(parseDate(iso)).getTime() + days * 86400000)));
export const monthKey = (iso) => String(iso).slice(0, 7);
export const nextMonthKey = (key) => {
  const [y, m] = key.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`;
};
export const monthsBetweenKeys = (fromKey, toKey) => {
  const [fy, fm] = fromKey.split("-").map(Number);
  const [ty, tm] = toKey.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
};
export function monthRange(startIso, endIso) {
  const keys = [];
  let key = monthKey(startIso);
  const last = monthKey(endIso);
  while (key <= last && keys.length < 1200) { keys.push(key); key = nextMonthKey(key); }
  return keys;
}

// Diferencia calendario a → b (b excluido) en años, meses y días.
export function calendarDiff(fromIso, toIso) {
  const a = parseDate(fromIso);
  const b = toDate(parseDate(toIso));
  // Ancla = inicio + N meses, con el día limitado al largo del mes (31-ene + 1 mes = 29-feb).
  const anchor = (total) => {
    const y = a.y + Math.floor((a.m - 1 + total) / 12);
    const m = ((a.m - 1 + total) % 12) + 1;
    return toDate({ y, m, d: Math.min(a.d, daysInMonth(y, m)) });
  };
  let totalMonths = (b.getUTCFullYear() - a.y) * 12 + (b.getUTCMonth() + 1 - a.m);
  while (totalMonths > 0 && anchor(totalMonths) > b) totalMonths -= 1;
  const days = Math.round((b - anchor(totalMonths)) / 86400000);
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12, days, totalMonths };
}

// ——— Parámetros versionados ———
export function paramAt(key, month, params = legalParams) {
  const path = key.split(".");
  let list = params;
  for (const part of path) list = list?.[part];
  if (!Array.isArray(list)) throw new Error(`Parámetro legal desconocido: ${key}`);
  const entry = list.find((item) => item.vigenteDesde <= month && (item.vigenteHasta == null || month <= item.vigenteHasta));
  if (!entry) throw new Error(`Sin valor vigente de ${key} para ${month}`);
  return { ...entry, key };
}

function createParamReader(params) {
  const used = new Map();
  const read = (key, month) => {
    const entry = paramAt(key, month, params);
    const id = `${key}@${entry.vigenteDesde}`;
    if (!used.has(id)) used.set(id, { id, key, vigenteDesde: entry.vigenteDesde, vigenteHasta: entry.vigenteHasta, valor: entry.valor, fuenteId: entry.fuenteId, verificado: entry.verificado !== false, nota: entry.nota || null });
    return entry.valor;
  };
  return { read, used };
}

// ——— Formato para fórmulas legibles ———
const clp = (value) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Math.round(value || 0));
const num = (value, digits = 2) => new Intl.NumberFormat("es-CL", { maximumFractionDigits: digits }).format(value || 0);
const pct = (value, digits = 2) => `${num(value * 100, digits)}%`;
const dmy = (iso) => iso.split("-").reverse().join("-");
const plural = (n, one, many) => `${num(n)} ${Math.abs(n - 1) < 1e-9 ? one : many}`;

// ——— Serie mensual de boletas ———
// mode "monthly": monthly = { "YYYY-MM": monto }; mode "average": averagePrevious para los meses previos y lastThree = [antepenúltimo, penúltimo, último].
export function buildMonthlySeries({ startDate, endDate, mode = "monthly", monthly = {}, averagePrevious = 0, lastThree = [] }) {
  const keys = monthRange(startDate, endDate);
  if (mode === "average") {
    const tail = lastThree.slice(-3).map((value) => Number(value) || 0);
    return keys.map((month, index) => {
      const fromEnd = keys.length - 1 - index;
      const tailIndex = tail.length - 1 - fromEnd;
      return { month, gross: fromEnd < tail.length && tailIndex >= 0 ? tail[tailIndex] : Number(averagePrevious) || 0 };
    });
  }
  return keys.map((month) => ({ month, gross: Number(monthly[month]) || 0 }));
}

// ——— Bases de cálculo ———
export function computeBases(series, ufValueClp, read, endMonth) {
  const lastThree = series.slice(-3).map((item) => item.gross);
  const averageLastThree = lastThree.length ? lastThree.reduce((sum, value) => sum + value, 0) / lastThree.length : 0;
  const isVariable = new Set(lastThree).size > 1;
  const uncapped = isVariable ? averageLastThree : (lastThree.at(-1) || 0);
  const capUf = read("topeIndemnizacionUf", endMonth);
  const capClp = capUf * ufValueClp;
  const indemnizationBase = Math.min(uncapped, capClp);
  const workedMonths = series.filter((item) => item.gross > 0).slice(-3);
  const vacationBase = workedMonths.length ? workedMonths.reduce((sum, item) => sum + item.gross, 0) / workedMonths.length : 0;
  return {
    lastThree, averageLastThree, isVariable, remunerationBase: uncapped, indemnizationBase, capUf, capClp,
    capApplied: uncapped > capClp, vacationBase, vacationMonths: workedMonths.map((item) => item.month),
  };
}

// Art. 163: 1 base por año, fracción superior a 6 meses cuenta como año, máximo 11; requiere 1 año o más.
export function computeServiceYears(startDate, endDate, read, endMonth) {
  const diff = calendarDiff(startDate, addDaysIso(endDate, 1));
  const max = read("maxAniosServicio", endMonth);
  const fractionMonths = read("fraccionMesesQueCuentaComoAnio", endMonth);
  const extra = diff.months > fractionMonths || (diff.months === fractionMonths && diff.days > 0) ? 1 : 0;
  const raw = diff.totalMonths >= 12 ? diff.years + extra : 0;
  return { ...diff, countedYears: Math.min(max, raw), uncappedYears: raw, maxYears: max, fractionMonths, eligible: diff.totalMonths >= 12 };
}

// Feriado: períodos completos pendientes (máx. 2) + proporcional desde el último aniversario (1,25 días hábiles por mes, criterio DT).
export function computeVacation({ startDate, endDate, pendingPeriods = 0, unpaidDaysTaken = 0 }, vacationBase, read, endMonth) {
  const annualDays = read("diasHabilesFeriadoAnual", endMonth);
  const maxPeriods = read("maxPeriodosFeriadoAcumulados", endMonth);
  const divisor = read("divisorValorDia", endMonth);
  const sinceStart = calendarDiff(startDate, endDate);
  const periods = Math.max(0, Math.min(maxPeriods, Math.floor(Number(pendingPeriods) || 0), sinceStart.years));
  const perMonth = annualDays / 12;
  const proportionalDays = sinceStart.months * perMonth + sinceStart.days * (perMonth / 30);
  const pendingDays = periods * annualDays;
  const businessDays = pendingDays + proportionalDays;
  const conversion = businessToCalendarDays(endDate, businessDays);
  const dayValue = vacationBase / divisor;
  return {
    annualDays, maxPeriods, periods, pendingDays, proportionalDays, proportionalMonths: sinceStart.months, proportionalExtraDays: sinceStart.days,
    businessDays, calendarDays: conversion.calendarDays, inhabilDays: conversion.inhabilDays, lastDate: conversion.lastDate,
    dayValue, divisor, amount: conversion.calendarDays * dayValue, unpaidDaysTaken: Math.max(0, Number(unpaidDaysTaken) || 0),
    unpaidAmount: Math.max(0, Number(unpaidDaysTaken) || 0) * dayValue,
  };
}

// Art. 201 y 195: fuero hasta un año después del término del postnatal (12 semanas desde el parto).
export function computeMaternityProtection({ pregnant, dueDate }, endDate, read, endMonth) {
  if (!pregnant || !isValidIsoDate(dueDate)) return { applies: false, months: 0 };
  const prenatalWeeks = read("semanasPrenatal", endMonth);
  const postnatalWeeks = read("semanasPostnatal", endMonth);
  const fueroMonths = read("mesesFueroTrasPostnatal", endMonth);
  const prenatalStart = addDaysIso(dueDate, -prenatalWeeks * 7);
  const postnatalEnd = addDaysIso(dueDate, postnatalWeeks * 7);
  const { y, m, d } = parseDate(postnatalEnd);
  const fueroEnd = isoOf({ y: y + Math.floor(fueroMonths / 12), m, d: Math.min(d, daysInMonth(y + Math.floor(fueroMonths / 12), m)) });
  if (fueroEnd <= endDate) return { applies: false, months: 0, prenatalStart, postnatalEnd, fueroEnd, expired: true };
  const diff = calendarDiff(endDate, fueroEnd);
  return { applies: true, months: diff.totalMonths + diff.days / 30, prenatalStart, postnatalEnd, fueroEnd };
}

// Art. 50 CT: 25% de lo devengado en cada mes con tope de 4,75 ingresos mínimos al año (÷ 12 por mes),
// solo para los meses no prescritos (art. 510: 2 años).
export function computeGratification(series, read, endMonth) {
  const window = read("mesesPrescripcionDerechos", endMonth);
  const rows = series.slice(-window).map((item) => {
    const rate = read("gratificacionTasa", item.month);
    const monthlyCap = (read("gratificacionTopeImmAnual", item.month) * read("ingresoMinimoMensual", item.month)) / 12;
    return { month: item.month, amount: Math.min(item.gross * rate, monthlyCap), capped: item.gross * rate > monthlyCap, monthlyCap };
  });
  return { rows, months: rows.length, window, amount: rows.reduce((sum, row) => sum + row.amount, 0), cappedMonths: rows.filter((row) => row.capped).length };
}

// ——— Cotizaciones mes a mes ———
export const DESTINATIONS = [
  { id: "afp-cuenta", label: "AFP: cuenta individual", sourceIds: ["dl-3500", "ley-21735"] },
  { id: "afp-comision", label: "AFP: comisión", sourceIds: ["dl-3500"] },
  { id: "sis", label: "Seguro de Invalidez y Sobrevivencia (SIS)", sourceIds: ["dl-3500", "sp-sis"] },
  { id: "seguro-social", label: "Seguro Social Previsional (IPS / FAPP)", sourceIds: ["ley-21735"] },
  { id: "salud", label: "Salud (7%)", sourceIds: ["dl-3500", "ley-18469", "dfl-1-2005-salud"] },
  { id: "afc-cic", label: "AFC: Cuenta Individual de Cesantía", sourceIds: ["ley-19728"] },
  { id: "afc-fcs", label: "AFC: Fondo de Cesantía Solidario", sourceIds: ["ley-19728"] },
  { id: "mutual", label: "Mutual / ISL (accidentes del trabajo)", sourceIds: ["ley-16744", "ley-19578", "ley-21010"] },
  { id: "otros", label: "Otros: SANNA", sourceIds: ["ley-21010", "ley-21063"] },
];

export function computeContributions(series, { afp, health = {}, accidentAdditionalRate = 0 }, { ufByMonth = {}, ufValueClp }, read) {
  const missingUfMonths = [];
  const rows = series.map((item, index) => {
    const ufMonth = Number(ufByMonth[item.month]) > 0 ? Number(ufByMonth[item.month]) : ufValueClp;
    if (!(Number(ufByMonth[item.month]) > 0)) missingUfMonths.push(item.month);
    const topeAfp = read("topeImponibleAfpUf", item.month) * ufMonth;
    const topeCes = read("topeImponibleCesantiaUf", item.month) * ufMonth;
    const imponible = Math.min(item.gross, topeAfp);
    const imponibleCes = Math.min(item.gross, topeCes);
    const ley = read("aporteEmpleador21735", item.month);
    const sisRate = read("tasaSis", item.month);
    const sis = imponible * sisRate;
    const seguroSocialRate = ley.incluyeSis ? Math.max(0, ley.seguroSocial - sisRate) + ley.rentabilidadProtegida : ley.seguroSocial + ley.rentabilidadProtegida;
    const cicActive = index < read("cesantiaMesesMaxCic", item.month);
    const salud = imponible * read("tasaSalud", item.month);
    const planClp = health.system === "isapre" && Number(health.planUf) > 0 ? Number(health.planUf) * ufMonth : 0;
    const parts = {
      "afp-cuenta": imponible * (read("tasaCuentaIndividualAfp", item.month) + ley.cuentaIndividual),
      "afp-comision": imponible * read(`comisionAfp.${afp}`, item.month),
      sis,
      "seguro-social": imponible * seguroSocialRate,
      salud,
      "afc-cic": cicActive ? imponibleCes * (read("cesantiaTrabajador", item.month) + read("cesantiaEmpleadorCic", item.month)) : 0,
      "afc-fcs": imponibleCes * read("cesantiaEmpleadorFcs", item.month),
      mutual: imponible * (read("accidentesBasica", item.month) + read("accidentesExtraordinaria", item.month) + (Number(accidentAdditionalRate) || 0)),
      otros: imponible * read("tasaSanna", item.month),
    };
    const total = Object.values(parts).reduce((sum, value) => sum + value, 0);
    return { month: item.month, gross: item.gross, ufMonth, imponible, imponibleCes, capped: item.gross > topeAfp, parts, total, isapreExtra: Math.max(0, planClp - salud) };
  });
  const byDestination = DESTINATIONS.map((destination) => ({ ...destination, amount: rows.reduce((sum, row) => sum + row.parts[destination.id], 0) }));
  return {
    rows, byDestination, total: rows.reduce((sum, row) => sum + row.total, 0), missingUfMonths,
    isapreExtraTotal: rows.reduce((sum, row) => sum + row.isapreExtra, 0), cappedMonths: rows.filter((row) => row.capped).map((row) => row.month),
  };
}

// Ley 17.322 art. 22 y 22 a): reajuste (aprox. por variación de la UF), interés penal capitalizado mensualmente y multa por no declarar.
export function estimateLatePayment(contributionRows, { ufValueClp, calcDate }, read) {
  const calcMonth = monthKey(calcDate);
  const annual = read("tasaInteresCorrienteReajustableAnual", calcMonth) * read("factorInteresPenal", calcMonth);
  const fineUf = read("multaDeclaracionUf", calcMonth);
  let reajuste = 0;
  let interes = 0;
  contributionRows.forEach((row) => {
    const dueMonth = nextMonthKey(row.month);
    const months = Math.max(0, monthsBetweenKeys(dueMonth, calcMonth));
    if (!months) return;
    const readjusted = row.total * Math.max(0, ufValueClp / row.ufMonth - 1);
    reajuste += readjusted;
    interes += (row.total + readjusted) * ((1 + annual / 12) ** months - 1);
  });
  const multa = contributionRows.filter((row) => monthsBetweenKeys(nextMonthKey(row.month), calcMonth) > 0).length * fineUf * ufValueClp;
  return { reajuste, interes, multa, total: reajuste + interes + multa, annualRate: annual, fineUf };
}

export function computeScenarios(claimTotal, { winProbability = 0, settlementRate = 0, lawyerFeeRate = 0 }) {
  const build = (id, label, gross, formula) => {
    const fee = gross * lawyerFeeRate;
    return { id, label, gross, fee, net: gross - fee, formula };
  };
  return [
    { id: "renunciar", label: "Renunciar a demandar", gross: 0, fee: 0, net: 0, formula: "No recibe dinero ni paga honorarios." },
    build("acuerdo", "Acuerdo", claimTotal * settlementRate, `${clp(claimTotal)} × ${pct(settlementRate, 0)} acuerdo − ${pct(lawyerFeeRate, 0)} honorario`),
    build("juicio", "Juicio (valor esperado)", claimTotal * winProbability, `${clp(claimTotal)} × ${pct(winProbability, 0)} probabilidad − ${pct(lawyerFeeRate, 0)} honorario`),
  ];
}

export function validateAssumptions(input) {
  const errors = {};
  if (!isValidIsoDate(input.startDate)) errors.startDate = "Ingresa una fecha de inicio válida.";
  if (!isValidIsoDate(input.endDate)) errors.endDate = "Ingresa una fecha de término válida.";
  if (!errors.startDate && !errors.endDate && input.endDate < input.startDate) errors.endDate = "La fecha de término debe ser posterior al inicio.";
  if (!errors.startDate && input.startDate < "2015-01-01") errors.startDate = "Por ahora el evaluador cubre relaciones iniciadas desde enero de 2015.";
  if (!(Number(input.ufValueClp) > 0)) errors.uf = "Falta el valor de la UF.";
  if (!TERMINATION_TYPES.some((type) => type.id === input.terminationType)) errors.terminationType = "Elige la causal o tipo de acción.";
  if (!AFP_OPTIONS.some((option) => option.id === input.afp)) errors.afp = "Elige la AFP.";
  const pctFields = ["winProbability", "settlementRate", "lawyerFeeRate"];
  pctFields.forEach((key) => { const value = Number(input.risk?.[key]); if (!(value >= 0 && value <= 1)) errors[key] = "Debe estar entre 0% y 100%."; });
  if (input.tutela?.enabled) {
    const n = Number(input.tutela.months);
    if (!(n >= 6 && n <= 11)) errors.tutelaMonths = "La tutela permite pedir entre 6 y 11 remuneraciones.";
  }
  if (input.maternity?.pregnant && !isValidIsoDate(input.maternity.dueDate)) errors.dueDate = "Ingresa la fecha probable de parto.";
  if (input.series && !input.series.some((item) => item.gross > 0)) errors.series = "Ingresa al menos un monto de boleta mayor a cero.";
  if (input.series?.some((item) => !(item.gross >= 0))) errors.series = "Los montos de boleta no pueden ser negativos.";
  return errors;
}

// ——— Evaluación completa ———
// input: { startDate, endDate, series, terminationType, surchargeRate, vacation, maternity, nullity, tutela, afp, health,
//          accidentAdditionalRate, risk, ufValueClp, ufByMonth, calcDate, excludedComponents }
export function evaluateLaborClaim(input, params = legalParams) {
  const { read, used } = createParamReader(params);
  const endMonth = monthKey(input.endDate);
  const ufValueClp = Number(input.ufValueClp);
  const series = input.series;
  const termination = TERMINATION_TYPES.find((type) => type.id === input.terminationType);
  const surchargeRate = termination.recargos.includes(Number(input.surchargeRate)) ? Number(input.surchargeRate) : termination.recargoPorDefecto;
  const excluded = new Set(input.excludedComponents || []);
  const warnings = [];

  const bases = computeBases(series, ufValueClp, read, endMonth);
  const service = computeServiceYears(input.startDate, input.endDate, read, endMonth);
  const vacation = computeVacation({ startDate: input.startDate, endDate: input.endDate, ...input.vacation }, bases.vacationBase, read, endMonth);
  const maternity = computeMaternityProtection(input.maternity || {}, input.endDate, read, endMonth);
  const nullityMonths = input.nullity?.enabled ? Math.max(0, Number(input.nullity.months) || 0) : 0;
  const protectionMonths = Math.max(maternity.months, nullityMonths);
  const protectionKind = !protectionMonths ? null : maternity.months >= nullityMonths ? "fuero" : "nulidad";
  const tutelaMonths = input.tutela?.enabled ? Math.min(read("tutelaRemuneracionesMax", endMonth), Math.max(read("tutelaRemuneracionesMin", endMonth), Number(input.tutela.months) || 0)) : 0;
  const noticeMonths = read("mesesAvisoPrevio", endMonth);

  const base = bases.indemnizationBase;
  const yearsAmount = service.countedYears * base;
  const components = [
    {
      id: "aviso-previo", label: "Indemnización sustitutiva del aviso previo", amount: noticeMonths * base,
      formula: `${plural(noticeMonths, "remuneración", "remuneraciones")} × ${clp(base)}${bases.capApplied ? " (con tope de 90 UF)" : ""}`,
      sourceIds: ["ct-162", termination.id === "autodespido" ? "ct-171" : "ct-168", "ct-172"],
    },
    {
      id: "anios-servicio", label: "Indemnización por años de servicio", amount: yearsAmount,
      formula: service.eligible
        ? `${plural(service.countedYears, "año", "años")} × ${clp(base)} (${service.years} a, ${service.months} m, ${service.days} d trabajados${service.uncappedYears > service.maxYears ? `; tope ${service.maxYears} años` : ""})`
        : `Menos de 1 año trabajado: no corresponde (${service.months} m, ${service.days} d)`,
      sourceIds: ["ct-163", "ct-172"],
    },
    {
      id: "recargo", label: `Recargo legal (${pct(surchargeRate, 0)})`, amount: yearsAmount * surchargeRate,
      formula: `${clp(yearsAmount)} × ${pct(surchargeRate, 0)}`, sourceIds: [termination.fuenteId], note: termination.nota,
    },
    {
      id: "feriado", label: "Feriado pendiente y proporcional", amount: vacation.amount,
      formula: `(${plural(vacation.periods, "período", "períodos")} × ${vacation.annualDays} + ${num(vacation.proportionalDays)} proporcionales) = ${num(vacation.businessDays)} días hábiles + ${vacation.inhabilDays} sábados, domingos y festivos (contados del ${dmy(addDaysIso(input.endDate, 1))} al ${dmy(vacation.lastDate)}) = ${num(vacation.calendarDays)} días corridos × ${clp(vacation.dayValue)}`,
      sourceIds: ["ct-67", "ct-69", "ct-70", "ct-71", "ct-73", "dt-feriado-proporcional"],
    },
  ];
  if (vacation.unpaidDaysTaken > 0) components.push({
    id: "vacaciones-impagas", label: "Vacaciones tomadas sin pago", amount: vacation.unpaidAmount,
    formula: `${plural(vacation.unpaidDaysTaken, "día corrido", "días corridos")} × ${clp(vacation.dayValue)}`, sourceIds: ["ct-67", "ct-71"],
  });
  if (protectionMonths > 0) components.push({
    id: "fuero-nulidad", label: protectionKind === "fuero" ? "Remuneraciones por fuero maternal" : "Remuneraciones por nulidad del despido (Ley Bustos)",
    amount: protectionMonths * bases.remunerationBase,
    formula: `${num(protectionMonths)} meses × ${clp(bases.remunerationBase)}`
      + (maternity.months > 0 && nullityMonths > 0 ? ` · Se usa el período mayor (fuero ${num(maternity.months)} m vs. nulidad ${num(nullityMonths)} m); no se suman sobre los mismos meses.` : ""),
    sourceIds: protectionKind === "fuero" ? ["ct-201", "ct-195"] : ["ct-162"],
    note: protectionKind === "fuero" ? `Fuero desde el despido hasta el ${maternity.fueroEnd}.` : "Hasta que el empleador convalide pagando las cotizaciones adeudadas.",
  });
  if (tutelaMonths > 0) components.push({
    id: "tutela", label: "Indemnización por tutela de derechos fundamentales", amount: tutelaMonths * bases.remunerationBase,
    formula: `${tutelaMonths} remuneraciones × ${clp(bases.remunerationBase)}`, sourceIds: ["ct-489"],
  });
  const gratification = input.gratification?.enabled ? computeGratification(series, read, endMonth) : null;
  if (gratification) components.push({
    id: "gratificacion", label: "Gratificación legal", amount: gratification.amount,
    formula: `${plural(gratification.months, "mes", "meses")} × mín(25% de la boleta; 4,75 ingresos mínimos ÷ 12)${gratification.cappedMonths ? ` · tope aplicado en ${gratification.cappedMonths} mes(es)` : ""}`,
    sourceIds: ["ct-47-50", "ct-510"],
    note: `Modalidad del art. 50. Solo los últimos ${gratification.window} meses: lo anterior está prescrito.`,
  });
  components.forEach((component) => { component.enabled = !excluded.has(component.id); });
  const claimTotal = components.filter((component) => component.enabled).reduce((sum, component) => sum + component.amount, 0);

  if (input.maternity?.pregnant && maternity.expired) warnings.push(`El fuero maternal habría terminado el ${maternity.fueroEnd}, antes de la fecha de término; no se calcula.`);
  if (bases.capApplied) warnings.push(`La remuneración base (${clp(bases.remunerationBase)}) supera el tope de ${bases.capUf} UF (${clp(bases.capClp)}); las indemnizaciones se calculan con el tope.`);
  if (!service.eligible) warnings.push("Con menos de un año de servicio no corresponde indemnización por años de servicio ni recargo.");

  const contributions = computeContributions(series, { afp: input.afp, health: input.health, accidentAdditionalRate: input.accidentAdditionalRate }, { ufByMonth: input.ufByMonth, ufValueClp }, read);
  if (contributions.missingUfMonths.length) warnings.push(`No hay UF de fin de mes para ${contributions.missingUfMonths.length} mes(es) (${contributions.missingUfMonths.slice(0, 3).join(", ")}${contributions.missingUfMonths.length > 3 ? "…" : ""}); se usó la UF de cálculo para su tope imponible.`);
  const latePayment = estimateLatePayment(contributions.rows, { ufValueClp, calcDate: input.calcDate || input.endDate }, read);
  const scenarios = computeScenarios(claimTotal, input.risk || {});

  const paramsUsed = [...used.values()];
  const sourceIds = new Set([...components.flatMap((component) => component.sourceIds), ...DESTINATIONS.flatMap((destination) => destination.sourceIds), ...paramsUsed.map((param) => param.fuenteId), "ct-7-8", "ley-21133", "ley-17322", "ct-486", "ct-510"]);
  return {
    bases, service, vacation, maternity, nullityMonths, protectionMonths, protectionKind, tutelaMonths, surchargeRate, termination,
    components, claimTotal, contributions, latePayment, scenarios, warnings, gratification,
    // Lo que el empleador arriesga si pierde: dinero al trabajador + cotizaciones + reajustes, intereses y multas.
    exposure: { cash: claimTotal, contributions: contributions.total, latePayment: latePayment.total, total: claimTotal + contributions.total + latePayment.total },
    pendingParams: paramsUsed.filter((param) => !param.verificado),
    paramsUsed,
    sources: [...sourceIds].map(sourceById),
  };
}
