export const GENERAL_IVA_RATE = 0.19;

export const BROKERAGE_MODES = Object.freeze({
  PERCENTAGE: "percentage",
  FIXED_UF: "fixed-uf",
  FIXED_CLP: "fixed-clp",
  PERCENTAGE_CAP: "percentage-cap",
  MINIMUM_PERCENTAGE: "minimum-percentage",
  TIERED: "tiered",
});

export const BROKERAGE_TAX = Object.freeze({
  ADDED: "iva-added",
  INCLUDED: "iva-included",
  NOT_SUBJECT: "not-subject",
  UNKNOWN: "unknown",
});

export const TIER_METHODS = Object.freeze({ MARGINAL: "marginal", WHOLE_VALUE: "whole-value" });

const finite = (value) => Number.isFinite(value);
const nonNegative = (value, fallback = 0) => finite(value) && value >= 0 ? value : fallback;
const convertToUf = (amount, unit, ufValueClp) => unit === "clp" ? amount / ufValueClp : amount;

export function calculateTieredNet(propertyValueUf, tiers = [], method = TIER_METHODS.MARGINAL) {
  if (!finite(propertyValueUf) || propertyValueUf < 0) throw new RangeError("El valor de la propiedad no es válido.");
  const normalized = tiers
    .map((tier) => ({ upToUf: tier.upToUf == null || tier.upToUf === "" ? null : Number(tier.upToUf), rate: Number(tier.rate) }))
    .filter((tier) => finite(tier.rate) && tier.rate >= 0);
  if (!normalized.length) return 0;
  let prior = 0;
  for (const tier of normalized) {
    if (tier.upToUf !== null && (!finite(tier.upToUf) || tier.upToUf <= prior)) throw new RangeError("Los límites de tramos deben ser crecientes.");
    prior = tier.upToUf ?? prior;
  }
  if (method === TIER_METHODS.WHOLE_VALUE) {
    const reached = normalized.find((tier) => tier.upToUf === null || propertyValueUf <= tier.upToUf) || normalized.at(-1);
    return propertyValueUf * reached.rate;
  }
  if (method !== TIER_METHODS.MARGINAL) throw new RangeError("La interpretación de tramos no es válida.");
  let total = 0;
  let lower = 0;
  for (const tier of normalized) {
    const upper = tier.upToUf ?? propertyValueUf;
    const portion = Math.max(0, Math.min(propertyValueUf, upper) - lower);
    total += portion * tier.rate;
    lower = upper;
    if (lower >= propertyValueUf) break;
  }
  return total;
}

function baseValueUf(input) {
  if (input.base === "other") return nonNegative(input.otherBaseUf);
  if (input.base === "agreed-price") return nonNegative(input.agreedPriceUf, nonNegative(input.propertyPriceUf));
  return nonNegative(input.propertyPriceUf);
}

function enteredAmountUf(input, baseUf) {
  const mode = input.mode || BROKERAGE_MODES.PERCENTAGE;
  if (mode === BROKERAGE_MODES.FIXED_UF) return nonNegative(input.amount);
  if (mode === BROKERAGE_MODES.FIXED_CLP) {
    if (!(input.ufValueClp > 0)) throw new RangeError("Se requiere una UF válida para convertir el monto fijo en pesos.");
    return nonNegative(input.amount) / input.ufValueClp;
  }
  if (mode === BROKERAGE_MODES.TIERED) return calculateTieredNet(baseUf, input.tiers, input.tierMethod);
  return baseUf * nonNegative(input.rate);
}

function applyNetLimits(amountUf, input) {
  let value = amountUf;
  if (input.minimum?.enabled && input.minimum.scope !== "final") {
    value = Math.max(value, convertToUf(nonNegative(input.minimum.amount), input.minimum.unit, input.ufValueClp));
  }
  if (input.cap?.enabled && input.cap.scope !== "final") {
    value = Math.min(value, convertToUf(nonNegative(input.cap.amount), input.cap.unit, input.ufValueClp));
  }
  return value;
}

function applyFinalLimits(amountUf, input) {
  let value = amountUf;
  if (input.minimum?.enabled && input.minimum.scope === "final") {
    value = Math.max(value, convertToUf(nonNegative(input.minimum.amount), input.minimum.unit, input.ufValueClp));
  }
  if (input.cap?.enabled && input.cap.scope === "final") {
    value = Math.min(value, convertToUf(nonNegative(input.cap.amount), input.cap.unit, input.ufValueClp));
  }
  return value;
}

export function calculateBrokerageCommission(input = {}) {
  if (input.enabled === false) return {
    known: true, netUf: 0, taxUf: 0, finalUf: 0, netClp: 0, taxClp: 0, finalClp: 0,
    effectiveFinalRate: 0, range: null, formula: "Sin comisión",
  };
  if (!(input.ufValueClp > 0)) throw new RangeError("La UF debe ser mayor que cero.");
  const baseUf = baseValueUf(input);
  if ([BROKERAGE_MODES.PERCENTAGE, BROKERAGE_MODES.PERCENTAGE_CAP, BROKERAGE_MODES.MINIMUM_PERCENTAGE, BROKERAGE_MODES.TIERED].includes(input.mode) && !(baseUf > 0)) {
    throw new RangeError("Se requiere un valor base para calcular la comisión porcentual.");
  }
  const ivaRate = nonNegative(input.ivaRate, GENERAL_IVA_RATE);
  const enteredUf = enteredAmountUf(input, baseUf);
  const taxTreatment = input.taxTreatment || BROKERAGE_TAX.UNKNOWN;
  if (taxTreatment === BROKERAGE_TAX.UNKNOWN) {
    const lowerUf = applyFinalLimits(applyNetLimits(enteredUf, input), input);
    const upperUf = applyFinalLimits(applyNetLimits(enteredUf, input) * (1 + ivaRate), input);
    return {
      known: false, netUf: null, taxUf: null, finalUf: null, netClp: null, taxClp: null, finalClp: null,
      effectiveFinalRate: null, baseUf, enteredUf, range: {
        withoutTaxUf: lowerUf, withTaxUf: upperUf,
        withoutTaxClp: lowerUf * input.ufValueClp, withTaxClp: upperUf * input.ufValueClp,
      },
      formula: "Tratamiento tributario pendiente",
    };
  }
  let netUf;
  let taxUf;
  let finalUf;
  if (taxTreatment === BROKERAGE_TAX.INCLUDED) {
    finalUf = applyFinalLimits(enteredUf, input);
    netUf = finalUf / (1 + ivaRate);
    taxUf = finalUf - netUf;
  } else {
    netUf = applyNetLimits(enteredUf, input);
    taxUf = taxTreatment === BROKERAGE_TAX.ADDED ? netUf * ivaRate : 0;
    finalUf = applyFinalLimits(netUf + taxUf, input);
    if (finalUf < netUf + taxUf) {
      if (taxTreatment === BROKERAGE_TAX.ADDED) { netUf = finalUf / (1 + ivaRate); taxUf = finalUf - netUf; }
      else netUf = finalUf;
    }
  }
  return {
    known: true, baseUf, enteredUf, netUf, taxUf, finalUf,
    netClp: netUf * input.ufValueClp, taxClp: taxUf * input.ufValueClp, finalClp: finalUf * input.ufValueClp,
    effectiveFinalRate: baseUf > 0 ? finalUf / baseUf : 0, range: null,
    formula: input.mode === BROKERAGE_MODES.TIERED
      ? `Tramos ${input.tierMethod === TIER_METHODS.WHOLE_VALUE ? "sobre el valor completo" : "marginales"}`
      : input.mode === BROKERAGE_MODES.FIXED_UF ? "Monto fijo en UF"
        : input.mode === BROKERAGE_MODES.FIXED_CLP ? "Monto fijo en CLP"
          : "Porcentaje sobre la base seleccionada",
  };
}

export function calculateBrokeragePlan(input = {}) {
  const noBroker = input.participation === "no";
  const buyerOwes = input.buyerPaymentStatus === "yes";
  const buyer = calculateBrokerageCommission({ ...input.buyerProposal, enabled: !noBroker && input.buyerPaymentStatus !== "no" });
  const seller = input.sellerProposal?.enabled ? calculateBrokerageCommission(input.sellerProposal) : null;
  const initialCashContributionUf = buyerOwes && buyer.known && input.includeInInitialCash && input.payableOutsideMortgage && !input.alreadyPaid
    ? buyer.finalUf : 0;
  return {
    participation: input.participation || "unknown", engagedBy: input.engagedBy || "unknown",
    buyerPaymentStatus: input.buyerPaymentStatus || "unknown", representation: input.representation || "unclear",
    paymentMilestone: input.paymentMilestone || "unknown", status: input.status || "unknown",
    services: Array.isArray(input.services) ? [...input.services] : [], buyer, seller,
    buyerCalculation: {
      mode: input.buyerProposal?.mode || BROKERAGE_MODES.PERCENTAGE,
      base: input.buyerProposal?.base || "commercial-price",
      taxTreatment: input.buyerProposal?.taxTreatment || BROKERAGE_TAX.UNKNOWN,
      rate: input.buyerProposal?.rate,
      amount: input.buyerProposal?.amount,
      formula: buyer.formula,
    },
    totalBothPartiesUf: buyer.known && seller?.known ? buyer.finalUf + seller.finalUf : null,
    initialCashContributionUf, includedInInitialCash: initialCashContributionUf > 0,
  };
}

export function compareBrokerageProposals(proposals, context, baselineId) {
  const calculated = proposals.slice(0, 5).map((proposal) => ({ ...proposal, result: calculateBrokerageCommission({ ...context, ...proposal, enabled: true }) }));
  const known = calculated.filter((item) => item.result.known);
  const lowest = known.length ? Math.min(...known.map((item) => item.result.finalUf)) : null;
  const baseline = calculated.find((item) => item.id === baselineId)?.result;
  return calculated.map((item) => ({
    ...item,
    differenceFromLowestUf: item.result.known && lowest !== null ? item.result.finalUf - lowest : null,
    differenceFromBaselineUf: item.result.known && baseline?.known ? item.result.finalUf - baseline.finalUf : null,
    differenceFromBaselineRate: item.result.known && baseline?.known && baseline.finalUf > 0 ? (item.result.finalUf - baseline.finalUf) / baseline.finalUf : null,
  }));
}
