import test from "node:test";
import assert from "node:assert/strict";
import {
  BROKERAGE_MODES, BROKERAGE_TAX, GENERAL_IVA_RATE, TIER_METHODS,
  calculateBrokerageCommission, calculateBrokeragePlan, calculateTieredNet,
  compareBrokerageProposals,
} from "../src/brokerageEngine.js";

const close = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≈ ${expected}`);
const context = { propertyPriceUf: 5000, agreedPriceUf: 5000, ufValueClp: 40000, base: "commercial-price", ivaRate: GENERAL_IVA_RATE };
const percentage = (rate, taxTreatment) => calculateBrokerageCommission({ ...context, enabled: true, mode: BROKERAGE_MODES.PERCENTAGE, rate, taxTreatment });

test("regresión UF 5.000: porcentajes sin IVA y + IVA", () => {
  const one = percentage(0.01, BROKERAGE_TAX.ADDED);
  close(one.netUf, 50); close(one.taxUf, 9.5); close(one.finalUf, 59.5); close(one.effectiveFinalRate, 0.0119);
  const oneHalfNoTax = percentage(0.015, BROKERAGE_TAX.NOT_SUBJECT);
  close(oneHalfNoTax.netUf, 75); close(oneHalfNoTax.taxUf, 0); close(oneHalfNoTax.finalUf, 75); close(oneHalfNoTax.effectiveFinalRate, 0.015);
  const oneHalf = percentage(0.015, BROKERAGE_TAX.ADDED);
  close(oneHalf.netUf, 75); close(oneHalf.taxUf, 14.25); close(oneHalf.finalUf, 89.25); close(oneHalf.effectiveFinalRate, 0.01785);
  const twoNoTax = percentage(0.02, BROKERAGE_TAX.NOT_SUBJECT);
  close(twoNoTax.finalUf, 100); close(twoNoTax.effectiveFinalRate, 0.02);
  const two = percentage(0.02, BROKERAGE_TAX.ADDED);
  close(two.netUf, 100); close(two.taxUf, 19); close(two.finalUf, 119); close(two.effectiveFinalRate, 0.0238);
});

test("un porcentaje final con IVA extrae impuesto sin aplicarlo dos veces", () => {
  const result = percentage(0.015, BROKERAGE_TAX.INCLUDED);
  close(result.finalUf, 75);
  close(result.netUf, 75 / 1.19);
  close(result.taxUf, 75 - 75 / 1.19);
  close(result.effectiveFinalRate, 0.015);
});

test("convierte montos fijos UF y CLP con la UF existente", () => {
  const uf = calculateBrokerageCommission({ ...context, mode: BROKERAGE_MODES.FIXED_UF, amount: 60, taxTreatment: BROKERAGE_TAX.NOT_SUBJECT });
  close(uf.finalUf, 60); close(uf.finalClp, 2400000);
  const clp = calculateBrokerageCommission({ ...context, mode: BROKERAGE_MODES.FIXED_CLP, amount: 2400000, taxTreatment: BROKERAGE_TAX.NOT_SUBJECT });
  close(clp.finalUf, 60); close(clp.finalClp, 2400000);
});

test("aplica tope neto, tope final y mínimo en el orden declarado", () => {
  const netCap = calculateBrokerageCommission({ ...context, mode: BROKERAGE_MODES.PERCENTAGE_CAP, rate: 0.02, taxTreatment: BROKERAGE_TAX.ADDED, cap: { enabled: true, amount: 60, unit: "uf", scope: "net" } });
  close(netCap.netUf, 60); close(netCap.finalUf, 71.4);
  const finalCap = calculateBrokerageCommission({ ...context, mode: BROKERAGE_MODES.PERCENTAGE_CAP, rate: 0.02, taxTreatment: BROKERAGE_TAX.ADDED, cap: { enabled: true, amount: 70, unit: "uf", scope: "final" } });
  close(finalCap.finalUf, 70); close(finalCap.netUf, 70 / 1.19);
  const minimum = calculateBrokerageCommission({ ...context, mode: BROKERAGE_MODES.MINIMUM_PERCENTAGE, rate: 0.005, taxTreatment: BROKERAGE_TAX.NOT_SUBJECT, minimum: { enabled: true, amount: 40, unit: "uf", scope: "net" } });
  close(minimum.finalUf, 40);
});

test("calcula tramos marginales y por valor completo", () => {
  const tiers = [{ upToUf: 2000, rate: 0.02 }, { upToUf: 4000, rate: 0.015 }, { upToUf: null, rate: 0.01 }];
  close(calculateTieredNet(5000, tiers, TIER_METHODS.MARGINAL), 80);
  close(calculateTieredNet(5000, tiers, TIER_METHODS.WHOLE_VALUE), 50);
  assert.throws(() => calculateTieredNet(5000, [{ upToUf: 3000, rate: 0.01 }, { upToUf: 2000, rate: 0.02 }]));
});

test("tratamiento tributario desconocido devuelve rango y no total preciso", () => {
  const result = percentage(0.02, BROKERAGE_TAX.UNKNOWN);
  assert.equal(result.known, false);
  assert.equal(result.finalUf, null);
  close(result.range.withoutTaxUf, 100);
  close(result.range.withTaxUf, 119);
});

test("separa comprador y vendedor e integra solo al comprador en efectivo inicial", () => {
  const buyerProposal = { ...context, mode: BROKERAGE_MODES.PERCENTAGE, rate: 0.015, taxTreatment: BROKERAGE_TAX.ADDED };
  const sellerProposal = { ...context, enabled: true, mode: BROKERAGE_MODES.PERCENTAGE, rate: 0.02, taxTreatment: BROKERAGE_TAX.ADDED };
  const plan = calculateBrokeragePlan({ participation: "yes", buyerPaymentStatus: "yes", buyerProposal, sellerProposal, includeInInitialCash: true, payableOutsideMortgage: true, alreadyPaid: false });
  close(plan.initialCashContributionUf, 89.25);
  close(plan.totalBothPartiesUf, 208.25);
  const paid = calculateBrokeragePlan({ participation: "yes", buyerPaymentStatus: "yes", buyerProposal, sellerProposal, includeInInitialCash: true, payableOutsideMortgage: true, alreadyPaid: true });
  close(paid.initialCashContributionUf, 0);
  const sellerOnly = calculateBrokeragePlan({ participation: "yes", buyerPaymentStatus: "no", buyerProposal, sellerProposal, includeInInitialCash: true, payableOutsideMortgage: true });
  close(sellerOnly.initialCashContributionUf, 0);
});

test("sin corredor, comisión cero y estado desconocido no se incorpora", () => {
  const proposal = { ...context, mode: BROKERAGE_MODES.PERCENTAGE, rate: 0.02, taxTreatment: BROKERAGE_TAX.ADDED };
  const none = calculateBrokeragePlan({ participation: "no", buyerPaymentStatus: "no", buyerProposal: proposal, includeInInitialCash: true, payableOutsideMortgage: true });
  close(none.buyer.finalUf, 0); close(none.initialCashContributionUf, 0);
  const unknown = calculateBrokeragePlan({ participation: "unknown", buyerPaymentStatus: "unknown", buyerProposal: { ...proposal, taxTreatment: BROKERAGE_TAX.UNKNOWN }, includeInInitialCash: true, payableOutsideMortgage: true });
  assert.equal(unknown.buyer.known, false); close(unknown.initialCashContributionUf, 0);
});

test("comparación calcula diferencias UF 44 y 58,67%", () => {
  const proposals = [
    { id: "base", mode: BROKERAGE_MODES.PERCENTAGE, rate: 0.015, taxTreatment: BROKERAGE_TAX.NOT_SUBJECT },
    { id: "two", mode: BROKERAGE_MODES.PERCENTAGE, rate: 0.02, taxTreatment: BROKERAGE_TAX.ADDED },
  ];
  const compared = compareBrokerageProposals(proposals, context, "base");
  const two = compared.find((item) => item.id === "two");
  close(two.differenceFromBaselineUf, 44);
  close(two.differenceFromBaselineRate, 44 / 75);
});

test("1,25% + IVA produce tasa final efectiva 1,4875%", () => {
  close(percentage(0.0125, BROKERAGE_TAX.ADDED).effectiveFinalRate, 0.014875);
});
