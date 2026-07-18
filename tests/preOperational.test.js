import test from "node:test";
import assert from "node:assert/strict";
import { projectInvestment } from "../src/investmentEngine.js";
import {
  PROPERTY_KINDS,
  evaluateDeliveryScenarios,
  evaluatePreOperationalStage,
  normalizeNewPropertyState,
} from "../src/preOperationalEngine.js";

const operatingInputs = {
  propertyPriceUf: 4000,
  monthlyRentUf: 18,
  occupancyRate: 0.92,
  rentGrowthRate: 0.01,
  appreciationRate: 0.015,
  opportunityCostRate: 0.04,
  perpetualGrowthRate: 0.01,
  horizonYears: 20,
  saleYear: 10,
  acquisitionExpenses: [{ amountUf: 65, included: true }],
  preparationCostsUf: 105,
  initialReservesUf: 25,
  buyerBrokerageUf: 50,
  monthlyCommonExpenseUf: 2,
  ownerCommonShareOccupied: 0,
  ownerCommonShareVacant: 1,
  maintenanceRate: 0.04,
  administrationRate: 0.05,
  contributionsAnnualUf: 5,
  landlordInsuranceAnnualUf: 2,
  otherOperatingAnnualUf: 1,
  saleCostRate: 0.025,
  fixedSaleCostsUf: 10,
  prepaymentCommissionMonths: 1.5,
  capitalExpenditures: [{ year: 6, amountUf: 20 }],
  mortgageInputs: {
    propertyPriceUf: 4000,
    financingRatio: 0.7,
    annualRate: 0.04,
    rateConvention: "annual-effective",
    termMonths: 300,
    ufValueClp: 40000,
    lifeInsurance: { enabled: true, base: "opening-loan-balance", monthlyRate: 0.00004, multiplier: 1 },
    propertyInsurance: { enabled: true, base: "fixed", fixedMonthlyUf: 0.45, multiplier: 1 },
    recurringCosts: [],
    expenses: [],
  },
};

const operatingResult = projectInvestment(operatingInputs);
const common = {
  operatingResult,
  propertyPriceUf: 4000,
  listPriceUf: 4000,
  writtenPriceUf: 4000,
  appraisalValueUf: 4000,
  opportunityCostRate: 0.04,
  ufValueClp: 40000,
  acquisitionExpensesUf: 65,
  preparationCostsUf: 70,
  furnitureUf: 35,
  initialReservesUf: 25,
  buyerBrokerageUf: 50,
  monthlyCommonExpenseUf: 2,
  capitalAvailableUf: 2000,
  firstMortgagePaymentMonth: 25,
  installmentCount: 24,
  firstInstallmentMonth: 1,
  developerInstallments: true,
  delayRule: "original",
};

test("propiedad usada ignora bono, cuotas y atraso y conserva el VPN operativo", () => {
  const residual = normalizeNewPropertyState({
    propertyKind: PROPERTY_KINDS.USED,
    bonoEnabled: true,
    bonoAmount: 500,
    developerInstallments: true,
    delayMonths: 12,
  });
  assert.equal(residual.bonoEnabled, false);
  assert.equal(residual.delayMonths, 0);
  const result = evaluatePreOperationalStage({ ...common, ...residual });
  assert.equal(result.applies, false);
  assert.equal(result.adjustedNpvUf, operatingResult.npvUf);
  assert.equal(result.adjustedIrr.value, operatingResult.irr.value);
  assert.equal(result.payments.length, 0);
});

test("nueva inmediata permite bono y cuotas sin activar atraso de construcción", () => {
  const result = evaluatePreOperationalStage({
    ...common,
    propertyKind: PROPERTY_KINDS.NEW_IMMEDIATE,
    bonoEnabled: true,
    bonoType: "down-payment",
    bonoAmount: 100,
    bonoAmountMode: "fixed",
    bonoUnit: "uf",
    preparationMonths: 1,
    tenantSearchMonths: 1,
    delayMonths: 12,
    firstMortgagePaymentMonth: 1,
  });
  assert.equal(result.futureDelivery, false);
  assert.equal(result.delayMonths, 0);
  assert.equal(result.firstRentMonth, 2);
  assert.equal(result.effectiveDownPaymentUf, result.totalDownPaymentUf - 100);
  assert.ok(result.payments.length > 0);
});

test("entrega en 24 meses produce primer arriendo en mes 26 y descuenta cuotas", () => {
  const result = evaluatePreOperationalStage({
    ...common,
    propertyKind: PROPERTY_KINDS.NEW_FUTURE,
    deliveryMonths: 24,
    preparationMonths: 1,
    tenantSearchMonths: 1,
  });
  assert.equal(result.writingMonth, 24);
  assert.equal(result.firstRentMonth, 26);
  assert.equal(result.developerSchedule.payments.filter((item) => item.type.startsWith("Cuota del pie")).length, 24);
  assert.ok(result.presentValuePaymentsUf < result.nominalPaidBeforeRentUf);
  assert.equal(result.preOperationalPayments.some((item) => item.type.includes("Arriendo")), false);
});

test("entrega en 36 meses aumenta espera y cambia valor presente y VPN", () => {
  const at24 = evaluatePreOperationalStage({ ...common, propertyKind: PROPERTY_KINDS.NEW_FUTURE, deliveryMonths: 24, preparationMonths: 1, tenantSearchMonths: 1 });
  const at36 = evaluatePreOperationalStage({ ...common, propertyKind: PROPERTY_KINDS.NEW_FUTURE, deliveryMonths: 36, installmentCount: 36, preparationMonths: 1, tenantSearchMonths: 1 });
  assert.equal(at36.firstRentMonth, 38);
  assert.ok(at36.firstRentMonth > at24.firstRentMonth);
  assert.notEqual(at36.presentValuePaymentsUf, at24.presentValuePaymentsUf);
  assert.ok(at36.adjustedNpvUf < at24.adjustedNpvUf);
});

test("atraso de seis meses desplaza entrega, escritura, arriendo y cuotas suspendidas", () => {
  const result = evaluatePreOperationalStage({
    ...common,
    propertyKind: PROPERTY_KINDS.NEW_FUTURE,
    deliveryMonths: 24,
    delayMonths: 6,
    delayRule: "suspend",
    preparationMonths: 1,
    tenantSearchMonths: 1,
  });
  assert.equal(result.adjustedDeliveryMonth, 30);
  assert.equal(result.writingMonth, 30);
  assert.equal(result.firstRentMonth, 32);
  assert.equal(result.developerSchedule.payments.find((item) => item.type === "Cuota del pie 1").month, 7);
});

test("vencimiento del bono genera pérdida, mayor pie y menor VPN", () => {
  const withBono = evaluatePreOperationalStage({
    ...common,
    propertyKind: PROPERTY_KINDS.NEW_FUTURE,
    deliveryMonths: 24,
    bonoEnabled: true,
    bonoType: "down-payment",
    bonoAmount: 200,
    bonoAmountMode: "fixed",
    bonoUnit: "uf",
    bonoExpiryMonth: 24,
    bonoLossOnDelay: "yes",
    delayMonths: 0,
  });
  const lost = evaluatePreOperationalStage({
    ...common,
    propertyKind: PROPERTY_KINDS.NEW_FUTURE,
    deliveryMonths: 24,
    bonoEnabled: true,
    bonoType: "down-payment",
    bonoAmount: 200,
    bonoAmountMode: "fixed",
    bonoUnit: "uf",
    bonoExpiryMonth: 24,
    bonoLossOnDelay: "yes",
    delayMonths: 6,
  });
  assert.equal(withBono.bonoStatus, "Vigente bajo estos supuestos");
  assert.equal(lost.bonoStatus, "Perdido");
  assert.equal(lost.effectiveDownPaymentUf - withBono.effectiveDownPaymentUf, 200);
  assert.ok(lost.adjustedNpvUf < withBono.adjustedNpvUf);
});

test("tres meses de dividendo antes del arriendo se incorporan como pagos", () => {
  const result = evaluatePreOperationalStage({
    ...common,
    propertyKind: PROPERTY_KINDS.NEW_FUTURE,
    deliveryMonths: 24,
    manualFirstRentMonth: 28,
    firstMortgagePaymentMonth: 25,
  });
  assert.equal(result.mortgageWithoutRentMonths, 3);
  assert.equal(result.payments.filter((item) => item.type === "Dividendo hipotecario sin arriendo").length, 3);
});

test("cuotas posteriores al arriendo entran en saldo y DSCR total aproximado", () => {
  const result = evaluatePreOperationalStage({
    ...common,
    propertyKind: PROPERTY_KINDS.NEW_IMMEDIATE,
    installmentCount: 36,
    firstInstallmentMonth: 1,
    manualFirstRentMonth: 2,
    firstMortgagePaymentMonth: 1,
  });
  assert.ok(result.pendingAtOperationUf > 0);
  assert.ok(result.firstOperatingYearDeveloperDebtUf > 0);
  assert.ok(result.totalDscr < operatingResult.dscr);
});

test("escenarios automáticos incluyen 0, 3, 6 y 12 meses", () => {
  const scenarios = evaluateDeliveryScenarios({
    ...common,
    propertyKind: PROPERTY_KINDS.NEW_FUTURE,
    deliveryMonths: 24,
  });
  assert.deepEqual(scenarios.map((item) => item.delayMonths), [0, 3, 6, 12]);
});

test("sin espera, los pagos fechados sustituyen el capital inicial sin doble contabilización", () => {
  const result = evaluatePreOperationalStage({
    ...common,
    propertyKind: PROPERTY_KINDS.NEW_IMMEDIATE,
    developerInstallments: false,
    preparationMonths: 0,
    tenantSearchMonths: 0,
    firstMortgagePaymentMonth: 1,
  });
  assert.ok(Math.abs(result.presentValuePaymentsUf - operatingResult.initialEquityUf) < 1e-8);
  assert.ok(Math.abs(result.adjustedNpvUf - operatingResult.npvUf) < 1e-8);
});
