import test from "node:test";
import assert from "node:assert/strict";
import {
  annualRentInUf, assessInvestmentDecision, comparableGrossYield, effectiveAnnualIncome, estimatePrepaymentCommission, impliedMonthlyRentUf, irr, mirr, netSaleProceeds,
  npv, ownerCommonExpenseUf, projectInvestment, realRateFromNominal, sensitivityMatrix, solveBreakEvenRent,
  solveIndifferenceRate, terminalHoldValue,
} from "../src/investmentEngine.js";

const baseInputs = {
  propertyPriceUf: 4000,
  monthlyRentUf: 18,
  occupancyRate: 0.92,
  rentGrowthRate: 0.01,
  appreciationRate: 0.015,
  opportunityCostRate: 0.06,
  perpetualGrowthRate: 0.01,
  horizonYears: 20,
  saleYear: 10,
  acquisitionExpenses: [{ amountUf: 60, included: true }],
  preparationCostsUf: 80,
  initialReservesUf: 20,
  buyerBrokerageUf: 47.6,
  monthlyCommonExpenseUf: 2.2,
  ownerCommonShareOccupied: 0,
  ownerCommonShareVacant: 1,
  maintenanceRate: 0.04,
  administrationRate: 0.05,
  contributionsAnnualUf: 5,
  landlordInsuranceAnnualUf: 2,
  otherOperatingAnnualUf: 1,
  capitalExpenditures: [{ year: 6, amountUf: 20 }],
  saleCostRate: 0.025,
  fixedSaleCostsUf: 10,
  prepaymentCostUf: 0,
  mortgageInputs: {
    propertyPriceUf: 4000, financingRatio: 0.8, annualRate: 0.045,
    rateConvention: "annual-effective", termMonths: 240, ufValueClp: 39000,
    lifeInsurance: { enabled: true, base: "opening-loan-balance", monthlyRate: 0.00004, multiplier: 1 },
    propertyInsurance: { enabled: true, base: "fixed", fixedMonthlyUf: 0.45, multiplier: 1 },
    recurringCosts: [], expenses: [],
  },
};

test("comparable yield and implied rent preserve the price/rent relation", () => {
  assert.equal(comparableGrossYield({ monthlyRentUf: 20, propertyPriceUf: 4000 }), 0.06);
  assert.equal(impliedMonthlyRentUf({ targetPropertyPriceUf: 5000, comparablePropertyPriceUf: 4000, comparableMonthlyRentUf: 20 }), 25);
});

test("converts a nominal CLP opportunity return to a comparable real rate", () => {
  assert.ok(Math.abs(realRateFromNominal(0.07, 0.03) - 0.03883495145631066) < 1e-12);
  assert.equal(realRateFromNominal(-1, 0.03), null);
});

test("models periodic CLP rent adjustments and annualized rent/price yield in UF", () => {
  assert.equal(annualRentInUf({ monthlyRentUf: 13, rentCurrency: "uf" }), 156);
  const monthly = annualRentInUf({ monthlyRentUf: 13, rentCurrency: "clp", adjustmentMonths: 1, annualInflationRate: 0.06 });
  const quarterly = annualRentInUf({ monthlyRentUf: 13, rentCurrency: "clp", adjustmentMonths: 3, annualInflationRate: 0.06 });
  const annual = annualRentInUf({ monthlyRentUf: 13, rentCurrency: "clp", adjustmentMonths: 12, annualInflationRate: 0.06 });
  assert.equal(monthly, 156);
  assert.ok(annual < quarterly && quarterly < monthly);
  const projected = projectInvestment({ ...baseInputs, propertyPriceUf: 3900, monthlyRentUf: 13, rentCurrency: "clp", rentAdjustmentMonths: 3, expectedInflationRate: 0.06 });
  assert.ok(Math.abs(projected.grossYield - projected.annualProjection[0].potentialRentUf / 3900) < 1e-12);
});

test("limits appreciation to the selected years and values never selling as a perpetuity", () => {
  const limited = projectInvestment({ ...baseInputs, appreciationRate: 0.1, appreciationStartYear: 2, appreciationEndYear: 3, horizonYears: 5, saleYear: 5 });
  assert.equal(limited.annualProjection[0].propertyValueUf, baseInputs.propertyPriceUf);
  assert.ok(Math.abs(limited.annualProjection[4].propertyValueUf - baseInputs.propertyPriceUf * 1.1 * 1.1) < 1e-8);
  const perpetual = projectInvestment({ ...baseInputs, horizonYears: 20, saleYear: null, saleStrategy: "never" });
  assert.equal(perpetual.neverSell, true);
  assert.equal(perpetual.selectedYearNetSaleValueUf, null);
  assert.ok(Number.isFinite(perpetual.selectedYearHoldValueUf));
  assert.ok(Number.isFinite(perpetual.npvUf));
  assert.equal(perpetual.terminalWealthDifferenceUf, null);
});

test("vacancy lowers effective income and owner common expenses follow occupancy rules", () => {
  assert.equal(effectiveAnnualIncome({ monthlyRentUf: 10, occupancyRate: 0.75 }), 90);
  assert.ok(Math.abs(ownerCommonExpenseUf({ monthlyCommonExpenseUf: 2, occupancyRate: 0.75, ownerShareOccupied: 0.2, ownerShareVacant: 1 }) - 9.6) < 1e-10);
});

test("NPV, IRR and MIRR return finite values for conventional flows", () => {
  const flows = [-100, 40, 40, 40];
  assert.ok(Math.abs(npv(0.1, flows) - -0.5259) < 0.001);
  assert.equal(irr(flows).status, "converged");
  assert.ok(Number.isFinite(mirr(flows, 0.08, 0.08)));
  assert.equal(irr([-100, -10, -1]).status, "no-valid-root");
});

test("terminal values validate finite perpetuity and sale costs are applied once", () => {
  assert.ok(Math.abs(terminalHoldValue({ nextYearNoiUf: 100, opportunityCostRate: 0.06, perpetualGrowthRate: 0.02 }) - 2500) < 1e-10);
  assert.equal(terminalHoldValue({ nextYearNoiUf: 100, opportunityCostRate: 0.02, perpetualGrowthRate: 0.02 }), null);
  assert.equal(netSaleProceeds({ propertyValueUf: 5000, mortgageBalanceUf: 2000, saleCostRate: 0.02, fixedSaleCostsUf: 10 }), 2890);
});

test("estimates UF prepayment commission as one and a half months of interest", () => {
  assert.equal(estimatePrepaymentCommission({ capitalToPrepayUf: 500, monthlyInterestRate: 0.01, interestMonths: 1.5 }), 7.5);
  const result = projectInvestment({ ...baseInputs, prepaymentCostUf: undefined, prepaymentCommissionMonths: 1.5 });
  const selected = result.annualProjection[result.saleYear - 1];
  assert.ok(Math.abs(result.selectedYearPrepaymentCostUf - selected.mortgageBalanceUf * result.mortgage.monthlyRate * 1.5) < 1e-10);
});

test("produce una orientación conservadora para avanzar o no avanzar con reglas transparentes", () => {
  const common = { initialEquityUf: 100, annualProjection: [{ preTaxCashFlowUf: 5 }], dscr: 1.3, mortgage: { loanToCommercialValueRatio: 0.7 }, irr: { status: "converged" } };
  const avanzar = assessInvestmentDecision({ ...common, npvUf: 20 });
  assert.equal(avanzar.status, "avanzar-con-condiciones");
  assert.match(avanzar.label, /Avanzar con condiciones/);
  const noAvanzar = assessInvestmentDecision({ ...common, npvUf: -5, annualProjection: [{ preTaxCashFlowUf: -2 }] });
  assert.equal(noAvanzar.status, "no-avanzar");
  assert.ok(noAvanzar.blockers.length >= 2);
});

test("projection separates NOI, financing and mutually exclusive terminal alternatives", () => {
  const result = projectInvestment(baseInputs);
  const first = result.annualProjection[0];
  assert.ok(first.noiUf > first.preTaxCashFlowUf);
  assert.equal(first.preTaxCashFlowUf, first.noiUf - first.debtServiceUf - first.capitalExpenditureUf);
  assert.equal(result.saleCashFlows.length, result.saleYear + 1);
  assert.equal(result.holdCashFlows.length, result.saleYear + 1);
  assert.equal(result.saleCashFlows.at(-1), first.year ? result.annualProjection[result.saleYear - 1].preTaxCashFlowUf + result.selectedYearNetSaleValueUf : NaN);
  const expectedSaleWealth = result.selectedYearNetSaleValueUf * Math.pow(1 + baseInputs.opportunityCostRate, baseInputs.horizonYears - baseInputs.saleYear);
  const expectedHoldWealth = result.annualProjection.at(-1).netSaleProceedsUf
    + result.annualProjection.slice(baseInputs.saleYear).reduce(
      (sum, row) => sum + row.preTaxCashFlowUf * Math.pow(1 + baseInputs.opportunityCostRate, baseInputs.horizonYears - row.year),
      0,
    );
  assert.ok(Math.abs(result.sellAndInvestTerminalWealthUf - expectedSaleWealth) < 1e-10);
  assert.ok(Math.abs(result.holdUntilHorizonTerminalWealthUf - expectedHoldWealth) < 1e-10);
  assert.ok(Math.abs(result.terminalWealthDifferenceUf - (expectedSaleWealth - expectedHoldWealth)) < 1e-10);
  assert.ok(Math.abs(result.saleStrategyNpvUf - npv(baseInputs.opportunityCostRate, result.saleCashFlows)) < 1e-10);
  assert.ok(Math.abs(result.holdStrategyNpvUf - npv(baseInputs.opportunityCostRate, result.holdCashFlows)) < 1e-10);
  assert.ok(Math.abs(result.sellVsHoldPresentValueDifferenceUf - (result.saleStrategyNpvUf - result.holdStrategyNpvUf)) < 1e-10);
  assert.notEqual(result.saleCashFlows.at(-1), result.holdCashFlows.at(-1));
  assert.ok(result.annualProjection.every((row) => row.mortgageBalanceUf >= 0));
  assert.ok(result.annualProjection.slice(20).every((row) => row.debtServiceUf === 0));
});

test("break-even and indifference solvers never expose NaN", () => {
  const rent = solveBreakEvenRent(baseInputs);
  const indifference = solveIndifferenceRate(baseInputs);
  assert.ok(["converged", "no-bracket", "no-valid-root"].includes(rent.status));
  assert.ok(!("value" in rent) || Number.isFinite(rent.value));
  assert.ok(!("value" in indifference) || Number.isFinite(indifference.value));
});

test("sensitivity reacts monotonically to vacancy and appreciation", () => {
  const matrix = sensitivityMatrix(baseInputs, "occupancyRate", [0.8, 0.95], "appreciationRate", [-0.01, 0.03]);
  assert.ok(matrix[1][0] > matrix[0][0]);
  assert.ok(matrix[0][1] > matrix[0][0]);
});
