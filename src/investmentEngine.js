import { calculateMortgage } from "./mortgageEngine.js";

export const SOLVER_STATUS = Object.freeze({
  CONVERGED: "converged",
  NO_BRACKET: "no-bracket",
  NO_VALID_ROOT: "no-valid-root",
  MULTIPLE_ROOTS: "multiple-roots-possible",
  INVALID: "invalid-input",
  MAX_ITERATIONS: "max-iterations",
});

export const PRECISION = Object.freeze({ tolerance: 1e-8, maxIterations: 200 });
const finite = Number.isFinite;
const safe = (value, fallback = 0) => finite(value) ? value : fallback;
const nonNegative = (value, fallback = 0) => finite(value) && value >= 0 ? value : fallback;

export function realRateFromNominal(nominalRate, inflationRate) {
  if (!(nominalRate > -1) || !(inflationRate > -1)) return null;
  const rate = (1 + nominalRate) / (1 + inflationRate) - 1;
  return finite(rate) ? rate : null;
}

export function comparableGrossYield({ monthlyRentUf, propertyPriceUf, occupancyRate = 1 }) {
  if (!(propertyPriceUf > 0) || !(monthlyRentUf >= 0) || !(occupancyRate >= 0 && occupancyRate <= 1)) return null;
  return monthlyRentUf * 12 * occupancyRate / propertyPriceUf;
}

export function impliedMonthlyRentUf({ targetPropertyPriceUf, comparablePropertyPriceUf, comparableMonthlyRentUf, comparableOccupancyRate = 1 }) {
  const yieldRate = comparableGrossYield({ monthlyRentUf: comparableMonthlyRentUf, propertyPriceUf: comparablePropertyPriceUf, occupancyRate: comparableOccupancyRate });
  return yieldRate == null || !(targetPropertyPriceUf > 0) ? null : targetPropertyPriceUf * yieldRate / 12;
}

export function normalizeOccupancy({ occupancyRate, vacantMonths }) {
  if (finite(occupancyRate)) return Math.min(1, Math.max(0, occupancyRate));
  if (finite(vacantMonths)) return Math.min(1, Math.max(0, 1 - vacantMonths / 12));
  return 1;
}

export function effectiveAnnualIncome({ monthlyRentUf, occupancyRate, otherAnnualIncomeUf = 0 }) {
  return nonNegative(monthlyRentUf) * 12 * normalizeOccupancy({ occupancyRate }) + nonNegative(otherAnnualIncomeUf);
}

export function ownerCommonExpenseUf({ monthlyCommonExpenseUf = 0, occupancyRate = 1, ownerShareOccupied = 0, ownerShareVacant = 1, extraordinaryAnnualUf = 0 }) {
  const occupied = normalizeOccupancy({ occupancyRate });
  return nonNegative(monthlyCommonExpenseUf) * 12 * (occupied * nonNegative(ownerShareOccupied) + (1 - occupied) * nonNegative(ownerShareVacant)) + nonNegative(extraordinaryAnnualUf);
}

export function npv(rate, cashFlows) {
  if (!(rate > -1) || !Array.isArray(cashFlows) || !cashFlows.length || cashFlows.some((flow) => !finite(flow))) return null;
  const value = cashFlows.reduce((sum, flow, index) => sum + flow / Math.pow(1 + rate, index), 0);
  return finite(value) ? value : null;
}

function signChanges(values) {
  const signs = values.filter((value) => Math.abs(value) > PRECISION.tolerance).map(Math.sign);
  return signs.reduce((count, sign, index) => count + (index > 0 && sign !== signs[index - 1] ? 1 : 0), 0);
}

export function solveBisection(fn, lower, upper, options = {}) {
  const tolerance = options.tolerance ?? PRECISION.tolerance;
  const maxIterations = options.maxIterations ?? PRECISION.maxIterations;
  let lowValue = fn(lower);
  let highValue = fn(upper);
  if (![lower, upper, lowValue, highValue].every(finite) || lower >= upper) return { status: SOLVER_STATUS.INVALID };
  if (Math.abs(lowValue) <= tolerance) return { status: SOLVER_STATUS.CONVERGED, value: lower, iterations: 0, tolerance };
  if (Math.abs(highValue) <= tolerance) return { status: SOLVER_STATUS.CONVERGED, value: upper, iterations: 0, tolerance };
  if (Math.sign(lowValue) === Math.sign(highValue)) return { status: SOLVER_STATUS.NO_BRACKET };
  let low = lower;
  let high = upper;
  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const mid = (low + high) / 2;
    const value = fn(mid);
    if (!finite(value)) return { status: SOLVER_STATUS.INVALID };
    if (Math.abs(value) <= tolerance || high - low <= tolerance) return { status: SOLVER_STATUS.CONVERGED, value: mid, iterations: iteration, tolerance };
    if (Math.sign(value) === Math.sign(lowValue)) { low = mid; lowValue = value; }
    else high = mid;
  }
  return { status: SOLVER_STATUS.MAX_ITERATIONS, iterations: maxIterations, tolerance };
}

export function irr(cashFlows) {
  if (!Array.isArray(cashFlows) || cashFlows.length < 2 || cashFlows.some((value) => !finite(value)) || !cashFlows.some((value) => value < 0) || !cashFlows.some((value) => value > 0)) return { status: SOLVER_STATUS.NO_VALID_ROOT };
  const multiple = signChanges(cashFlows) > 1;
  const brackets = [];
  const points = [-0.9999, -0.9, -0.75, -0.5, -0.25, 0, 0.05, 0.1, 0.2, 0.4, 0.75, 1, 2, 5, 10, 50];
  for (let index = 0; index < points.length - 1; index += 1) {
    const a = npv(points[index], cashFlows);
    const b = npv(points[index + 1], cashFlows);
    if (finite(a) && finite(b) && (Math.sign(a) !== Math.sign(b) || Math.abs(a) <= PRECISION.tolerance)) brackets.push([points[index], points[index + 1]]);
  }
  if (!brackets.length) return { status: SOLVER_STATUS.NO_VALID_ROOT };
  const solved = solveBisection((rate) => npv(rate, cashFlows), ...brackets[0]);
  return multiple || brackets.length > 1 ? { ...solved, status: SOLVER_STATUS.MULTIPLE_ROOTS, value: solved.value } : solved;
}

export function mirr(cashFlows, financeRate, reinvestmentRate) {
  if (!Array.isArray(cashFlows) || cashFlows.length < 2 || !(financeRate > -1) || !(reinvestmentRate > -1)) return null;
  const periods = cashFlows.length - 1;
  const negativePresent = cashFlows.reduce((sum, flow, index) => flow < 0 ? sum + flow / Math.pow(1 + financeRate, index) : sum, 0);
  const positiveFuture = cashFlows.reduce((sum, flow, index) => flow > 0 ? sum + flow * Math.pow(1 + reinvestmentRate, periods - index) : sum, 0);
  if (!(negativePresent < 0) || !(positiveFuture > 0)) return null;
  const value = Math.pow(positiveFuture / -negativePresent, 1 / periods) - 1;
  return finite(value) ? value : null;
}

export function terminalHoldValue({ nextYearNoiUf, opportunityCostRate, perpetualGrowthRate = 0 }) {
  if (!(nextYearNoiUf >= 0) || !(opportunityCostRate > perpetualGrowthRate) || !(opportunityCostRate > -1)) return null;
  const value = nextYearNoiUf / (opportunityCostRate - perpetualGrowthRate);
  return finite(value) ? value : null;
}

export function netSaleProceeds({ propertyValueUf, mortgageBalanceUf = 0, saleCostRate = 0, fixedSaleCostsUf = 0, prepaymentCostUf = 0 }) {
  const result = nonNegative(propertyValueUf) * (1 - nonNegative(saleCostRate)) - nonNegative(fixedSaleCostsUf) - nonNegative(mortgageBalanceUf) - nonNegative(prepaymentCostUf);
  return finite(result) ? result : null;
}

export function estimatePrepaymentCommission({ capitalToPrepayUf, monthlyInterestRate, interestMonths = 1.5 }) {
  if (!(capitalToPrepayUf >= 0) || !(monthlyInterestRate >= 0) || !(interestMonths >= 0)) return null;
  const commissionUf = capitalToPrepayUf * monthlyInterestRate * interestMonths;
  return finite(commissionUf) ? commissionUf : null;
}

function annualRateFor(value, year) {
  return Array.isArray(value) ? safe(value[year - 1], safe(value.at(-1))) : safe(value);
}

export function projectInvestment(inputs) {
  const horizonYears = Math.max(1, Math.trunc(nonNegative(inputs.horizonYears, 10)));
  const saleYear = Math.min(horizonYears, Math.max(1, Math.trunc(nonNegative(inputs.saleYear, horizonYears))));
  const mortgage = inputs.mortgageResult || calculateMortgage({ ...inputs.mortgageInputs, propertyPriceUf: inputs.propertyPriceUf });
  const acquisitionExpensesUf = (inputs.acquisitionExpenses || []).filter((item) => item.enabled !== false && item.included !== false).reduce((sum, item) => sum + nonNegative(item.amountUf), 0);
  const preparationCostsUf = nonNegative(inputs.preparationCostsUf);
  const initialReservesUf = nonNegative(inputs.initialReservesUf);
  const buyerBrokerageUf = nonNegative(inputs.buyerBrokerageUf, nonNegative(mortgage.buyerBrokerageUf));
  const initialEquityUf = mortgage.requiredDownPaymentUf + acquisitionExpensesUf + preparationCostsUf + initialReservesUf + buyerBrokerageUf;
  const annualProjection = [];
  let propertyValueUf = inputs.propertyPriceUf;
  let monthlyRentUf = inputs.monthlyRentUf;
  for (let year = 1; year <= horizonYears; year += 1) {
    const appreciationRate = annualRateFor(inputs.appreciationRate, year);
    const rentGrowthRate = annualRateFor(inputs.rentGrowthRate, year);
    if (year > 1) monthlyRentUf *= 1 + rentGrowthRate;
    propertyValueUf *= 1 + appreciationRate;
    const occupancyRate = normalizeOccupancy({ occupancyRate: annualRateFor(inputs.occupancyRate, year) });
    const potentialRentUf = nonNegative(monthlyRentUf) * 12;
    const vacancyLossUf = potentialRentUf * (1 - occupancyRate);
    const effectiveIncomeUf = potentialRentUf - vacancyLossUf + nonNegative(annualRateFor(inputs.otherAnnualIncomeUf, year));
    const commonExpensesUf = ownerCommonExpenseUf({
      monthlyCommonExpenseUf: nonNegative(inputs.monthlyCommonExpenseUf) * Math.pow(1 + safe(inputs.expenseGrowthRate), year - 1),
      occupancyRate,
      ownerShareOccupied: safe(inputs.ownerCommonShareOccupied),
      ownerShareVacant: safe(inputs.ownerCommonShareVacant, 1),
      extraordinaryAnnualUf: annualRateFor(inputs.extraordinaryCommonExpenseUf, year),
    });
    const operatingExpensesUf = commonExpensesUf
      + nonNegative(inputs.maintenanceRate) * effectiveIncomeUf
      + nonNegative(inputs.administrationRate) * effectiveIncomeUf
      + nonNegative(annualRateFor(inputs.contributionsAnnualUf, year))
      + nonNegative(annualRateFor(inputs.landlordInsuranceAnnualUf, year))
      + nonNegative(annualRateFor(inputs.otherOperatingAnnualUf, year));
    const noiUf = effectiveIncomeUf - operatingExpensesUf;
    const financing = mortgage.annualSchedule[year - 1];
    const debtServiceUf = financing?.totalUf || 0;
    const mortgageBalanceUf = financing?.closingBalanceUf ?? 0;
    const capitalExpenditureUf = (inputs.capitalExpenditures || []).filter((item) => item.year === year || (item.recurringEveryYears > 0 && year >= item.year && (year - item.year) % item.recurringEveryYears === 0)).reduce((sum, item) => sum + nonNegative(item.amountUf), 0);
    const preTaxCashFlowUf = noiUf - debtServiceUf - capitalExpenditureUf;
    const prepaymentCostUf = finite(inputs.prepaymentCostUf)
      ? nonNegative(inputs.prepaymentCostUf)
      : estimatePrepaymentCommission({ capitalToPrepayUf: mortgageBalanceUf, monthlyInterestRate: nonNegative(mortgage.monthlyRate), interestMonths: nonNegative(inputs.prepaymentCommissionMonths, 1.5) });
    const saleProceedsUf = netSaleProceeds({ propertyValueUf, mortgageBalanceUf, saleCostRate: inputs.saleCostRate, fixedSaleCostsUf: inputs.fixedSaleCostsUf, prepaymentCostUf });
    annualProjection.push({ year, potentialRentUf, vacancyLossUf, effectiveIncomeUf, commonExpensesUf, operatingExpensesUf, noiUf, debtServiceUf, capitalExpenditureUf, preTaxCashFlowUf, mortgageBalanceUf, prepaymentCostUf, propertyValueUf, estimatedEquityUf: propertyValueUf - mortgageBalanceUf, netSaleProceedsUf: saleProceedsUf });
  }
  const selected = annualProjection[saleYear - 1];
  const nextNoi = selected.noiUf * (1 + annualRateFor(inputs.rentGrowthRate, saleYear + 1));
  const selectedYearHoldValueUf = terminalHoldValue({ nextYearNoiUf: nextNoi, opportunityCostRate: inputs.opportunityCostRate, perpetualGrowthRate: inputs.perpetualGrowthRate });
  const saleCashFlows = [-initialEquityUf, ...annualProjection.slice(0, saleYear).map((row) => row.preTaxCashFlowUf)];
  saleCashFlows[saleCashFlows.length - 1] += selected.netSaleProceedsUf;
  const holdCashFlows = [-initialEquityUf, ...annualProjection.slice(0, saleYear).map((row) => row.preTaxCashFlowUf)];
  if (selectedYearHoldValueUf != null) holdCashFlows[holdCashFlows.length - 1] += selectedYearHoldValueUf;
  const discountRate = safe(inputs.opportunityCostRate);
  const grossYield = nonNegative(inputs.monthlyRentUf) * 12 / inputs.propertyPriceUf;
  const effectiveGrossYield = annualProjection[0].effectiveIncomeUf / inputs.propertyPriceUf;
  const netOperatingYield = annualProjection[0].noiUf / inputs.propertyPriceUf;
  const firstCashFlow = annualProjection[0].preTaxCashFlowUf;
  const positiveDistributions = saleCashFlows.slice(1).reduce((sum, flow) => sum + Math.max(0, flow), 0);
  return {
    initialEquityUf, acquisitionExpensesUf, preparationCostsUf, initialReservesUf, buyerBrokerageUf, mortgage,
    grossYield, effectiveGrossYield, netOperatingYield,
    cashOnCashReturn: initialEquityUf > 0 ? firstCashFlow / initialEquityUf : null,
    dscr: annualProjection[0].debtServiceUf > 0 ? annualProjection[0].noiUf / annualProjection[0].debtServiceUf : null,
    npvUf: npv(discountRate, saleCashFlows), holdNpvUf: selectedYearHoldValueUf == null ? null : npv(discountRate, holdCashFlows),
    irr: irr(saleCashFlows), mirr: mirr(saleCashFlows, discountRate, discountRate),
    equityMultiple: initialEquityUf > 0 ? positiveDistributions / initialEquityUf : null,
    selectedYearNetSaleValueUf: selected.netSaleProceedsUf,
    selectedYearPrepaymentCostUf: selected.prepaymentCostUf,
    selectedYearHoldValueUf,
    sellVsHoldDifferenceUf: selectedYearHoldValueUf == null ? null : selected.netSaleProceedsUf - selectedYearHoldValueUf,
    saleCashFlows, holdCashFlows, saleYear, annualProjection,
  };
}

export function solveInput(inputs, key, bounds, objective = (result) => result.npvUf) {
  const solved = solveBisection((value) => {
    try { return objective(projectInvestment({ ...inputs, [key]: value })); }
    catch { return Number.NaN; }
  }, bounds[0], bounds[1], { tolerance: 1e-6 });
  return solved;
}

export const solveBreakEvenRent = (inputs) => solveInput(inputs, "monthlyRentUf", [0, Math.max(1, inputs.monthlyRentUf * 5)]);
export const solveBreakEvenOccupancy = (inputs) => solveInput(inputs, "occupancyRate", [0, 1]);
export const solveBreakEvenPrice = (inputs) => solveInput(inputs, "propertyPriceUf", [Math.max(1, inputs.propertyPriceUf * 0.2), inputs.propertyPriceUf * 3]);
export const solveMaximumInterestRate = (inputs) => solveBisection((rate) => projectInvestment({ ...inputs, mortgageInputs: { ...inputs.mortgageInputs, annualRate: rate } }).npvUf, 0, 0.3, { tolerance: 1e-6 });
export const solveIndifferenceRate = (inputs) => solveBisection((rate) => {
  const result = projectInvestment({ ...inputs, opportunityCostRate: rate });
  return result.sellVsHoldDifferenceUf;
}, Math.max(-0.5, safe(inputs.perpetualGrowthRate) + 0.0001), 1, { tolerance: 1e-6 });

export function assessInvestmentDecision(result, { minimumDscr = 1.2 } = {}) {
  if (!result || !finite(result.npvUf) || !Array.isArray(result.annualProjection) || !result.annualProjection.length) return null;
  const firstYear = result.annualProjection[0];
  const blockers = [];
  const strengths = [];
  const risks = [];

  if (result.npvUf < 0) blockers.push("El valor presente neto es negativo frente a la alternativa seleccionada.");
  else strengths.push("El valor presente neto es positivo frente a la alternativa seleccionada.");

  if (firstYear.preTaxCashFlowUf < 0) blockers.push("La operación requiere aportes adicionales durante el primer año.");
  else strengths.push("El flujo del primer año es positivo antes de impuestos personales.");

  if (result.dscr != null && result.dscr < 1) blockers.push("El ingreso operativo neto no cubre completamente el servicio de la deuda.");
  else if (result.dscr != null && result.dscr < minimumDscr) risks.push(`La cobertura de deuda es inferior al margen prudente de ${minimumDscr.toLocaleString("es-CL")} veces usado por esta orientación.`);
  else if (result.dscr != null) strengths.push("El ingreso operativo neto mantiene un margen sobre el servicio de la deuda.");

  if (Math.abs(result.npvUf) < result.initialEquityUf * 0.05) risks.push("El valor presente neto está cerca de cero y puede cambiar de signo con variaciones pequeñas.");
  if (result.mortgage?.loanToCommercialValueRatio > 0.8) risks.push("El financiamiento supera el 80% del valor y deja menos margen ante desviaciones.");
  if (result.irr?.status === SOLVER_STATUS.MULTIPLE_ROOTS) risks.push("La tasa interna de retorno puede tener múltiples soluciones y no debe usarse de forma aislada.");

  const status = blockers.length ? "no-avanzar" : "avanzar-con-condiciones";
  return {
    status,
    label: status === "avanzar-con-condiciones" ? "Avanzar con condiciones" : "No avanzar bajo estos supuestos",
    conclusion: status === "avanzar-con-condiciones"
      ? "El escenario supera los filtros financieros básicos de esta herramienta, sujeto a validar los datos y riesgos pendientes."
      : "No conviene avanzar todavía con el escenario ingresado; primero deben corregirse o comprobarse las señales desfavorables.",
    blockers,
    strengths,
    risks,
  };
}

export function compareScenarios(baseInputs, scenarios) {
  return scenarios.map((scenario) => ({ ...scenario, result: projectInvestment({ ...baseInputs, ...scenario.overrides, mortgageInputs: { ...baseInputs.mortgageInputs, ...(scenario.overrides?.mortgageInputs || {}) } }) }));
}

export function sensitivityMatrix(baseInputs, rowKey, rowValues, columnKey, columnValues) {
  return rowValues.map((rowValue) => columnValues.map((columnValue) => projectInvestment({ ...baseInputs, [rowKey]: rowValue, [columnKey]: columnValue }).npvUf));
}
