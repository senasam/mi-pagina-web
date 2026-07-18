import test from "node:test";
import assert from "node:assert/strict";
import {
  RATE_CONVENTIONS, aggregateScheduleAnnually, calculateMortgage, expenseAmountUf,
  evaluateDfl2StampTax, financingBase, formatClp, formatPercent, formatUf, generateAmortizationSchedule,
  insuranceForPeriod, levelPayment, monthlyRateFromAnnual, parseChileanNumber,
  solveAffordableProperty,
} from "../src/mortgageEngine.js";
import { BROKERAGE_MODES, BROKERAGE_TAX } from "../src/brokerageEngine.js";

const close = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≈ ${expected}`);
const fixture = (overrides = {}) => ({
  propertyPriceUf: 4000, appraisalValueUf: 4000, financingRatio: 0.8, ufValueClp: 36772.81,
  annualRate: 0.04, rateConvention: RATE_CONVENTIONS.EFFECTIVE, termMonths: 300,
  householdIncomeClp: 3000000, existingMonthlyDebtClp: 0, planningBurdenRatio: 0.27,
  lifeInsurance: { enabled: true, base: "opening-loan-balance", monthlyRate: 0.000122, multiplier: 2 },
  propertyInsurance: { enabled: true, base: "property-value", monthlyRate: 0.000227016667, multiplier: 1 },
  recurringCosts: [], expenses: [], brokerage: { enabled: false }, ...overrides,
});

test("convierte tasa efectiva y nominal sin mezclarlas", () => {
  close(monthlyRateFromAnnual(0.04, RATE_CONVENTIONS.EFFECTIVE), Math.pow(Math.pow(1.04, 365 / 360), 1 / 12) - 1);
  close(monthlyRateFromAnnual(0.04, RATE_CONVENTIONS.NOMINAL_MONTHLY), 0.04 / 12);
});

test("calcula anualidad estándar y tasa cero", () => {
  close(levelPayment(1200, 0, 120), 10);
  close(levelPayment(1000, 0.01, 12), 88.84878867834168);
});

test("selecciona base, capital y pie con tasación inferior", () => {
  assert.equal(financingBase(4000, 3700), 3700);
  assert.equal(financingBase(4000, 4300), 4000);
  const result = calculateMortgage(fixture({ appraisalValueUf: 3700 }));
  close(result.principalUf, 2960);
  close(result.requiredDownPaymentUf, 1040);
});

test("calcula seguros y gastos por sus bases configuradas", () => {
  close(insuranceForPeriod({ enabled: true, base: "opening-loan-balance", monthlyRate: 0.0001, multiplier: 2 }, { openingBalanceUf: 3000 }), 0.6);
  close(insuranceForPeriod({ enabled: true, base: "fixed", fixedMonthlyUf: 0.25, multiplier: 1 }, {}), 0.25);
  close(expenseAmountUf({ enabled: true, mode: "property-percentage", amount: 0.01, taxRate: 0.19 }, { propertyPriceUf: 4000, principalUf: 3200, ufValueClp: 40000 }), 47.6);
  close(expenseAmountUf({ enabled: true, mode: "fixed-clp", amount: 400000, taxRate: 0 }, { propertyPriceUf: 1, principalUf: 1, ufValueClp: 40000 }), 10);
});

test("aplica 0,2% al mutuo solo cuando se cumplen conjuntamente las condiciones DFL2", () => {
  const qualifying = evaluateDfl2StampTax({ certifiedProperty: true, firstTransfer: true, withinTwoYearsOfReception: true, naturalPersonBuyer: true, priorBenefitedHomes: 1 });
  assert.equal(qualifying.eligible, true);
  close(qualifying.rate, 0.002);
  close(expenseAmountUf({ enabled: true, mode: "principal-percentage", amount: qualifying.rate }, { propertyPriceUf: 4000, principalUf: 3200, ufValueClp: 40000 }), 6.4);
  for (const missing of [
    { certifiedProperty: false, firstTransfer: true, withinTwoYearsOfReception: true, naturalPersonBuyer: true, priorBenefitedHomes: 0 },
    { certifiedProperty: true, firstTransfer: false, withinTwoYearsOfReception: true, naturalPersonBuyer: true, priorBenefitedHomes: 0 },
    { certifiedProperty: true, firstTransfer: true, withinTwoYearsOfReception: false, naturalPersonBuyer: true, priorBenefitedHomes: 0 },
    { certifiedProperty: true, firstTransfer: true, withinTwoYearsOfReception: true, naturalPersonBuyer: false, priorBenefitedHomes: 0 },
    { certifiedProperty: true, firstTransfer: true, withinTwoYearsOfReception: true, naturalPersonBuyer: true, priorBenefitedHomes: 2 },
  ]) {
    const general = evaluateDfl2StampTax(missing);
    assert.equal(general.eligible, false);
    close(general.rate, 0.008);
  }
});

test("escenario de compatibilidad usa el ajuste efectivo 365/360", () => {
  const result = calculateMortgage(fixture());
  close(result.monthlyRate, 0.00331928, 1e-8);
  close(result.basePaymentUf, 16.8610, 0.001);
  close(result.firstLifeInsuranceUf, 0.7808, 1e-9);
  close(result.firstPropertyInsuranceUf, 0.908066668, 1e-9);
  close(result.firstTotalPaymentUf, 18.5499, 0.001);
  close(result.requiredDownPaymentUf, 800);
  assert.equal(result.schedule.length, 300);
  assert.equal(result.schedule[299].period, 300);
  assert.equal(result.schedule[299].closingBalanceUf, 0);
});

test("la amortización respeta invariantes y reconcilia la agregación anual", () => {
  const result = calculateMortgage(fixture());
  let prior = result.principalUf;
  for (const row of result.schedule) {
    assert.ok(Number.isFinite(row.totalPaymentUf));
    assert.ok(row.closingBalanceUf >= 0);
    assert.ok(row.closingBalanceUf <= prior + 1e-9);
    close(row.interestUf, row.openingBalanceUf * result.monthlyRate, 1e-9);
    close(row.basePaymentUf, row.principalUf + row.interestUf, 1e-9);
    prior = row.closingBalanceUf;
  }
  close(result.schedule.reduce((sum, row) => sum + row.principalUf, 0), 3200, 1e-8);
  close(result.annualSchedule.reduce((sum, year) => sum + year.principalUf, 0), 3200, 1e-8);
  close(result.annualSchedule.reduce((sum, year) => sum + year.interestUf, 0), result.totalInterestUf, 1e-8);
});

test("ajusta el pago final y genera exactamente el plazo solicitado", () => {
  const schedule = generateAmortizationSchedule({ ...fixture({ termMonths: 301 }), principalUf: 3200 });
  assert.equal(schedule.length, 301);
  assert.equal(schedule.at(-1).period, 301);
  assert.equal(schedule.at(-1).closingBalanceUf, 0);
  assert.ok(schedule.every((row) => row.closingBalanceUf >= 0));
});

test("tasas mayores no bajan cuota; plazos mayores no la suben", () => {
  const base = calculateMortgage(fixture());
  const highRate = calculateMortgage(fixture({ annualRate: 0.08 }));
  const longTerm = calculateMortgage(fixture({ termMonths: 360 }));
  assert.ok(highRate.basePaymentUf > base.basePaymentUf);
  assert.ok(longTerm.basePaymentUf < base.basePaymentUf);
});

test("carga, deuda existente e ingreso orientativo se calculan conjuntamente", () => {
  const result = calculateMortgage(fixture({ existingMonthlyDebtClp: 200000 }));
  close(result.burdenRatio, result.firstTotalPaymentClp / 3000000);
  close(result.totalDebtBurdenRatio, (result.firstTotalPaymentClp + 200000) / 3000000);
  close(result.requiredIncomeClp, (result.firstTotalPaymentClp + 200000) / 0.27);
});

test("integra solo el corretaje exigible del comprador en el efectivo inicial", () => {
  const brokerageConfig = {
    participation: "yes", engagedBy: "both", buyerPaymentStatus: "yes", representation: "separate-both",
    paymentMilestone: "signing", status: "confirmed", includeInInitialCash: true,
    payableOutsideMortgage: true, alreadyPaid: false,
    buyerProposal: {
      mode: BROKERAGE_MODES.PERCENTAGE, amount: 1.5, baseType: "commercial-price",
      rate: 0.015, base: "commercial-price", taxTreatment: BROKERAGE_TAX.ADDED, ivaRate: 0.19,
    },
    sellerProposal: { enabled: true, mode: BROKERAGE_MODES.PERCENTAGE, rate: 0.02, base: "commercial-price", taxTreatment: BROKERAGE_TAX.ADDED, ivaRate: 0.19 },
  };
  const result = calculateMortgage(fixture({ propertyPriceUf: 5000, appraisalValueUf: 5000, brokerageConfig }));
  close(result.brokeragePlan.buyer.finalUf, 89.25);
  close(result.brokeragePlan.seller.finalUf, 119);
  close(result.buyerBrokerageUf, 89.25);
  close(result.requiredInitialCashUf, result.requiredDownPaymentUf + result.operationalExpensesUf + result.otherInitialExpensesUf + 89.25);

  const paid = calculateMortgage(fixture({ propertyPriceUf: 5000, appraisalValueUf: 5000, brokerageConfig: {
    ...brokerageConfig, alreadyPaid: true,
  } }));
  close(paid.buyerBrokerageUf, 0);
  close(paid.requiredInitialCashUf, paid.requiredDownPaymentUf);
});

test("solver de capacidad converge y respeta el presupuesto", () => {
  const solved = solveAffordableProperty(fixture({ propertyPriceUf: undefined, appraisalValueUf: undefined }), { upperBoundUf: 20000 });
  assert.equal(solved.status, "solved");
  assert.ok(solved.propertyPriceUf > 0 && solved.propertyPriceUf < 20000);
  assert.ok(Math.abs(solved.result.firstTotalPaymentClp - solved.budgetClp) < 2);
  const impossible = solveAffordableProperty(fixture({ householdIncomeClp: 100000, existingMonthlyDebtClp: 100000 }));
  assert.equal(impossible.status, "impossible");
});

test("TIR equivalente falla de forma segura cuando el flujo inicial no es positivo", () => {
  const result = calculateMortgage(fixture({ expenses: [{ id: "all", label: "Gasto", enabled: true, mode: "fixed-uf", amount: 4000, includedInEquivalentCost: true }] }));
  assert.equal(result.equivalentFlowRate, null);
});

test("parsing chileno y formatos son finitos y localizados", () => {
  assert.equal(parseChileanNumber("36.772,81"), 36772.81);
  assert.equal(parseChileanNumber("4.000"), 4000);
  assert.equal(parseChileanNumber("4,5"), 4.5);
  assert.ok(Number.isNaN(parseChileanNumber("cuatro")));
  assert.match(formatUf(4000), /4\.000,00 UF/);
  assert.match(formatClp(1000000), /1\.000\.000/);
  assert.match(formatPercent(0.27), /27,00/);
});

test("rechaza entradas inválidas y límites fuera de rango", () => {
  assert.throws(() => monthlyRateFromAnnual(-0.1));
  assert.throws(() => levelPayment(100, 0.01, 0));
  assert.throws(() => calculateMortgage(fixture({ financingRatio: 1.1 })));
  assert.throws(() => calculateMortgage(fixture({ ufValueClp: 0 })));
  assert.throws(() => aggregateScheduleAnnually(null));
});
