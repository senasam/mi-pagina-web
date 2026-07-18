import { irr, mirr } from "./investmentEngine.js";

export const PROPERTY_KINDS = Object.freeze({
  USED: "used",
  NEW_IMMEDIATE: "new-immediate",
  NEW_FUTURE: "new-future",
  NEW_GREEN: "new-green",
  NEW_WHITE: "new-white",
});

export const FUTURE_DELIVERY_KINDS = new Set([
  PROPERTY_KINDS.NEW_FUTURE,
  PROPERTY_KINDS.NEW_GREEN,
  PROPERTY_KINDS.NEW_WHITE,
]);

const finite = Number.isFinite;
const nonNegative = (value, fallback = 0) =>
  finite(Number(value)) && Number(value) >= 0 ? Number(value) : fallback;
const integer = (value, fallback = 0) => Math.max(0, Math.round(nonNegative(value, fallback)));
const clampMonth = (value) => Math.max(0, integer(value));
const sum = (values) => values.reduce((total, value) => total + value, 0);

export function isNewProperty(kind) {
  return kind !== PROPERTY_KINDS.USED;
}

export function hasFutureDelivery(kind) {
  return FUTURE_DELIVERY_KINDS.has(kind);
}

export function normalizeNewPropertyState(state = {}) {
  if (isNewProperty(state.propertyKind)) return { ...state };
  return {
    ...state,
    bonoEnabled: false,
    bonoAmount: 0,
    developerInstallments: false,
    developerCredit: false,
    delayMonths: 0,
    installmentCount: 0,
    installmentBalloonUf: 0,
  };
}

export function calculateBono({
  enabled,
  type = "unknown",
  amount = 0,
  amountMode = "fixed",
  amountUnit = "uf",
  percentageBase = "written-price",
  listPriceUf,
  writtenPriceUf,
  totalDownPaymentUf,
  ufValueClp,
  valid = true,
} = {}) {
  if (!enabled || !valid) return { announcedUf: 0, recognizedUf: 0, type, valid };
  const enteredUf = amountUnit === "clp"
    ? nonNegative(amount) / nonNegative(ufValueClp, 1)
    : nonNegative(amount);
  const bases = {
    "list-price": nonNegative(listPriceUf),
    "written-price": nonNegative(writtenPriceUf),
    "total-down-payment": nonNegative(totalDownPaymentUf),
  };
  const announcedUf = amountMode === "percentage"
    ? nonNegative(bases[percentageBase]) * nonNegative(amount) / 100
    : enteredUf;
  const recognizedUf = type === "unknown" ? 0 : announcedUf;
  return { announcedUf, recognizedUf, type, valid };
}

function adjustedInstallmentMonths(baseMonths, delayMonths, rule, writingMonth) {
  if (rule === "suspend") return baseMonths.map((month) => month + delayMonths);
  if (rule === "pay-at-writing") return baseMonths.map(() => writingMonth);
  if (rule === "extend") {
    return baseMonths.map((month, index) =>
      index === baseMonths.length - 1 ? month + delayMonths : month);
  }
  return baseMonths;
}

export function buildDeveloperPaymentSchedule({
  effectiveDownPaymentUf,
  reserveUf = 0,
  promisePaymentUf = 0,
  promiseMonth = 1,
  otherInitialUf = 0,
  installmentCount = 0,
  firstInstallmentMonth = 1,
  balloonUf = 0,
  balloonMonth,
  delayMonths = 0,
  delayRule = "original",
  writingMonth = 0,
} = {}) {
  const effective = nonNegative(effectiveDownPaymentUf);
  const reserve = Math.min(effective, nonNegative(reserveUf));
  const promise = Math.min(Math.max(0, effective - reserve), nonNegative(promisePaymentUf));
  const other = Math.min(Math.max(0, effective - reserve - promise), nonNegative(otherInitialUf));
  const balloon = Math.min(
    Math.max(0, effective - reserve - promise - other),
    nonNegative(balloonUf),
  );
  const count = integer(installmentCount);
  const distributed = Math.max(0, effective - reserve - promise - other - balloon);
  const normal = count > 0 ? distributed / count : 0;
  const baseMonths = Array.from({ length: count }, (_, index) =>
    clampMonth(firstInstallmentMonth) + index);
  const months = adjustedInstallmentMonths(
    baseMonths,
    integer(delayMonths),
    delayRule,
    clampMonth(writingMonth),
  );
  const payments = [
    reserve > 0 && { type: "Reserva", month: 0, amountUf: reserve },
    promise > 0 && { type: "Pago en promesa", month: clampMonth(promiseMonth), amountUf: promise },
    other > 0 && { type: "Otro pago inicial", month: 0, amountUf: other },
    ...months.map((month, index) => ({
      type: `Cuota del pie ${index + 1}`,
      month,
      amountUf: normal,
    })),
    balloon > 0 && {
      type: "Cuota balón",
      month: clampMonth(balloonMonth ?? writingMonth),
      amountUf: balloon,
    },
  ].filter(Boolean);
  if (!count && distributed > 0) {
    payments.push({ type: "Saldo del pie al escriturar", month: clampMonth(writingMonth), amountUf: distributed });
  }
  return {
    payments: payments.sort((a, b) => a.month - b.month),
    normalInstallmentUf: normal,
    nominalTotalUf: sum(payments.map((payment) => payment.amountUf)),
    differenceUf: effective - sum(payments.map((payment) => payment.amountUf)),
  };
}

function monthPresentValue(amountUf, month, annualRate) {
  const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
  return amountUf / Math.pow(1 + monthlyRate, month);
}

function annualizeAdjustedFlows(payments, firstRentMonth, operatingResult) {
  const preYears = Math.ceil(firstRentMonth / 12);
  const flows = Array.from({ length: preYears + operatingResult.saleCashFlows.length }, () => 0);
  for (const payment of payments) flows[Math.floor(payment.month / 12)] -= payment.amountUf;
  const operatingOffset = preYears;
  operatingResult.saleCashFlows.slice(1).forEach((flow, index) => {
    flows[operatingOffset + index] += flow;
  });
  return flows;
}

export function evaluatePreOperationalStage(raw = {}) {
  const input = normalizeNewPropertyState(raw);
  const operatingResult = input.operatingResult;
  if (!operatingResult) return null;
  if (!isNewProperty(input.propertyKind)) {
    return {
      applies: false,
      adjustedNpvUf: operatingResult.npvUf,
      operatingNpvUf: operatingResult.npvUf,
      adjustedIrr: operatingResult.irr,
      adjustedMirr: operatingResult.mirr,
      payments: [],
      scenarios: [],
    };
  }

  const future = hasFutureDelivery(input.propertyKind);
  const delayMonths = future ? integer(input.delayMonths) : 0;
  const deliveryMonth = future ? integer(input.deliveryMonths) : 0;
  const adjustedDeliveryMonth = deliveryMonth + delayMonths;
  const writingMonth = Math.max(0, adjustedDeliveryMonth + Number(input.deliveryToWritingMonths || 0));
  const materialDeliveryMonth = Math.max(writingMonth, writingMonth + Number(input.writingToMaterialMonths || 0));
  const calculatedFirstRentMonth = Math.max(
    writingMonth,
    materialDeliveryMonth,
  ) + integer(input.preparationMonths, 1) + integer(input.tenantSearchMonths, 1);
  const firstRentMonth = input.manualFirstRentMonth === "" || input.manualFirstRentMonth == null
    ? calculatedFirstRentMonth
    : Math.max(materialDeliveryMonth, integer(input.manualFirstRentMonth));

  const writtenPriceUf = nonNegative(input.writtenPriceUf, nonNegative(input.propertyPriceUf));
  const listPriceUf = nonNegative(input.listPriceUf, writtenPriceUf);
  const mortgagePrincipalUf = nonNegative(operatingResult.mortgage?.principalUf);
  const totalDownPaymentUf = Math.max(0, writtenPriceUf - mortgagePrincipalUf);
  const expiryMonth = input.bonoExpiryMonth === "" || input.bonoExpiryMonth == null
    ? null
    : integer(input.bonoExpiryMonth);
  const expired = expiryMonth != null && writingMonth > expiryMonth;
  const losesByDelay = input.bonoLossOnDelay === "yes" ||
    (input.bonoLossOnDelay === "unknown" && expired);
  const preservedByDeveloperDelay =
    input.bonoPreservedDeveloperDelay === "yes" && input.delayCausedByDeveloper;
  const bonoValid = !expired || !losesByDelay || preservedByDeveloperDelay;
  const bono = calculateBono({
    enabled: input.bonoEnabled,
    type: input.bonoType,
    amount: input.bonoAmount,
    amountMode: input.bonoAmountMode,
    amountUnit: input.bonoUnit,
    percentageBase: input.bonoBase,
    listPriceUf,
    writtenPriceUf,
    totalDownPaymentUf,
    ufValueClp: input.ufValueClp,
    valid: bonoValid,
  });
  const economicPriceUf = input.bonoType === "discount"
    ? Math.max(0, writtenPriceUf - bono.recognizedUf)
    : writtenPriceUf;
  const appliedToDownPaymentUf = input.bonoType === "down-payment"
    ? Math.min(totalDownPaymentUf, bono.recognizedUf)
    : 0;
  const effectiveDownPaymentUf = Math.max(0, totalDownPaymentUf - appliedToDownPaymentUf);

  const developer = buildDeveloperPaymentSchedule({
    effectiveDownPaymentUf,
    reserveUf: input.reserveUf,
    promisePaymentUf: input.promisePaymentUf,
    promiseMonth: input.promiseMonth,
    otherInitialUf: input.otherInitialUf,
    installmentCount: input.developerInstallments ? input.installmentCount : 0,
    firstInstallmentMonth: input.firstInstallmentMonth,
    balloonUf: input.balloonUf,
    balloonMonth: input.balloonMonth,
    delayMonths,
    delayRule: input.delayRule,
    writingMonth,
  });

  const payments = [...developer.payments];
  const add = (type, month, amountUf) => {
    const amount = nonNegative(amountUf);
    if (amount > 0) payments.push({ type, month: clampMonth(month), amountUf: amount });
  };
  add("Gastos de adquisición", writingMonth, input.acquisitionExpensesUf);
  add("Corretaje del comprador", writingMonth, input.buyerBrokerageUf);
  add("Preparación", materialDeliveryMonth, input.preparationCostsUf);
  add("Muebles y equipamiento", materialDeliveryMonth, input.furnitureUf);
  add("Reservas iniciales", firstRentMonth, input.initialReservesUf);
  const commonStartMonth = clampMonth(input.preOperationalCommonStartMonth ?? materialDeliveryMonth);
  for (let month = commonStartMonth; month < firstRentMonth; month += 1) {
    add("Gasto común antes del arriendo", month, input.monthlyCommonExpenseUf);
  }
  const firstMortgagePaymentMonth = clampMonth(input.firstMortgagePaymentMonth ?? writingMonth + 1);
  const monthlyMortgagePaymentUf = nonNegative(
    input.monthlyMortgagePaymentUf,
    operatingResult.mortgage?.firstTotalPaymentUf,
  );
  for (let month = firstMortgagePaymentMonth; month < firstRentMonth; month += 1) {
    add("Dividendo hipotecario sin arriendo", month, monthlyMortgagePaymentUf);
  }
  payments.sort((a, b) => a.month - b.month);

  const annualRate = Number(input.opportunityCostRate) || 0;
  const preOperationalPayments = payments.filter((payment) => payment.month <= firstRentMonth);
  const postOperationalPayments = payments.filter((payment) => payment.month > firstRentMonth);
  const presentValuePaymentsUf = sum(payments.map((payment) =>
    monthPresentValue(payment.amountUf, payment.month, annualRate)));
  const operatingValueAtStartUf = operatingResult.npvUf + operatingResult.initialEquityUf;
  const operatingValueTodayUf =
    operatingValueAtStartUf / Math.pow(1 + annualRate, firstRentMonth / 12);
  const adjustedNpvUf = operatingValueTodayUf - presentValuePaymentsUf;
  let cumulative = 0;
  let maximumCashUf = 0;
  for (const payment of preOperationalPayments) {
    cumulative += payment.amountUf;
    maximumCashUf = Math.max(maximumCashUf, cumulative);
  }
  const capitalAvailableUf = input.capitalAvailableUf === "" || input.capitalAvailableUf == null
    ? null
    : nonNegative(input.capitalAvailableUf);
  const liquidityBufferUf = capitalAvailableUf == null ? null : capitalAvailableUf - maximumCashUf;
  const mortgageWithoutRentMonths = Math.max(0, firstRentMonth - firstMortgagePaymentMonth);
  const mortgageWithoutRentUf = mortgageWithoutRentMonths * monthlyMortgagePaymentUf;
  const installmentPayments = developer.payments.filter((payment) => payment.type.includes("Cuota"));
  const pendingAtOperationUf = sum(
    installmentPayments.filter((payment) => payment.month >= firstRentMonth).map((payment) => payment.amountUf),
  );
  const firstOperatingYearDeveloperDebtUf = sum(
    installmentPayments
      .filter((payment) => payment.month >= firstRentMonth && payment.month < firstRentMonth + 12)
      .map((payment) => payment.amountUf),
  );
  const firstNoiUf = operatingResult.annualProjection[0]?.noiUf || 0;
  const firstMortgageServiceUf = operatingResult.annualProjection[0]?.debtServiceUf || 0;
  const totalDscr = firstMortgageServiceUf + firstOperatingYearDeveloperDebtUf > 0
    ? firstNoiUf / (firstMortgageServiceUf + firstOperatingYearDeveloperDebtUf)
    : null;
  const adjustedAnnualFlows = annualizeAdjustedFlows(payments, firstRentMonth, operatingResult);
  const adjustedIrr = irr(adjustedAnnualFlows);
  const adjustedMirr = mirr(adjustedAnnualFlows, annualRate, annualRate);
  const ltvAppraisal = nonNegative(input.appraisalValueUf) > 0
    ? mortgagePrincipalUf / nonNegative(input.appraisalValueUf)
    : null;
  const ltvWritten = writtenPriceUf > 0 ? mortgagePrincipalUf / writtenPriceUf : null;
  const ltvEconomic = economicPriceUf > 0 ? mortgagePrincipalUf / economicPriceUf : null;
  const totalEconomicFinancing = economicPriceUf > 0
    ? (mortgagePrincipalUf + pendingAtOperationUf) / economicPriceUf
    : null;
  const warnings = [];
  if (input.bonoType === "unknown" && input.bonoEnabled) warnings.push("La estructura del bono es desconocida y no se reconoce como descuento económico.");
  if (input.bonoEnabled && input.bankKnowsBono === "unknown") warnings.push("No se sabe si el banco conoce el bono.");
  if (input.bonoEnabled && input.bonoInPromise !== "yes") warnings.push("El bono no está confirmado expresamente en la promesa.");
  if (expired) warnings.push("La escritura ajustada supera el vencimiento informado del bono.");
  if (mortgageWithoutRentMonths > 0) warnings.push(`Se estiman ${mortgageWithoutRentMonths} meses pagando el crédito hipotecario sin arriendo.`);
  if (mortgageWithoutRentMonths > 6) warnings.push("Se pagan más de seis dividendos antes del primer arriendo.");
  if (pendingAtOperationUf > 0) warnings.push("Quedan cuotas del pie después del inicio del arriendo.");
  if (input.delayRule === "unknown") warnings.push("No se conoce qué ocurre con las cuotas del pie ante un atraso.");
  if (ltvEconomic > 0.8) warnings.push(`El financiamiento económico supera el ${ltvEconomic > 0.9 ? "90" : ltvEconomic > 0.85 ? "85" : "80"}%.`);
  if (liquidityBufferUf != null && liquidityBufferUf < 0) warnings.push("El capital máximo acumulado supera el capital disponible.");
  if (liquidityBufferUf != null && liquidityBufferUf >= 0 && liquidityBufferUf < maximumCashUf * 0.1) warnings.push("La holgura de liquidez es inferior al 10%.");
  if (input.installmentUnit === "clp") warnings.push("Las cuotas en pesos se convirtieron con la UF actual; no se proyectó la UF futura.");
  if (input.paymentByCard) warnings.push("Parte del pie se pagaría mediante tarjeta de crédito.");
  if (input.balloonUf > developer.normalInstallmentUf * 3 && developer.normalInstallmentUf > 0) warnings.push("La cuota balón supera tres cuotas normales.");
  warnings.push("La TIR ajustada agrupa pagos preoperativos por años y es aproximada.");
  warnings.push("El saldo hipotecario operativo no adelanta exactamente las cuotas pagadas antes del primer arriendo.");

  return {
    applies: true,
    futureDelivery: future,
    deliveryMonth,
    delayMonths,
    adjustedDeliveryMonth,
    writingMonth,
    materialDeliveryMonth,
    firstRentMonth,
    firstMortgagePaymentMonth,
    mortgageWithoutRentMonths,
    mortgageWithoutRentUf,
    listPriceUf,
    writtenPriceUf,
    economicPriceUf,
    mortgagePrincipalUf,
    totalDownPaymentUf,
    effectiveDownPaymentUf,
    bono,
    bonoExpired: expired,
    bonoStatus: bonoValid ? (input.bonoEnabled ? "Vigente bajo estos supuestos" : "Sin bono") : "Perdido",
    developerSchedule: developer,
    payments,
    preOperationalPayments,
    postOperationalPayments,
    nominalPaidBeforeRentUf: sum(preOperationalPayments.map((payment) => payment.amountUf)),
    presentValuePaymentsUf,
    deferralBenefitUf: effectiveDownPaymentUf - sum(developer.payments.map((payment) =>
      monthPresentValue(payment.amountUf, payment.month, annualRate))),
    capitalTodayUf: sum(payments.filter((payment) => payment.month === 0).map((payment) => payment.amountUf)),
    capitalAtWritingUf: sum(payments.filter((payment) => payment.month === writingMonth).map((payment) => payment.amountUf)),
    maximumCashUf,
    capitalAvailableUf,
    liquidityBufferUf,
    pendingAtOperationUf,
    firstOperatingYearDeveloperDebtUf,
    totalDscr,
    operatingNpvUf: operatingResult.npvUf,
    operatingValueTodayUf,
    adjustedNpvUf,
    adjustedAnnualFlows,
    adjustedIrr,
    adjustedMirr,
    ltvAppraisal,
    ltvWritten,
    ltvEconomic,
    totalEconomicFinancing,
    effectiveBuyerContribution: economicPriceUf > 0 ? effectiveDownPaymentUf / economicPriceUf : null,
    warnings,
  };
}

export function evaluateDeliveryScenarios(input, delays = [0, 3, 6, 12]) {
  if (!isNewProperty(input.propertyKind)) return [];
  return delays.map((delayMonths) => ({
    delayMonths,
    result: evaluatePreOperationalStage({ ...input, delayMonths }),
  }));
}

export function maximumTolerableDelay(input, maximumMonths = 120) {
  let last = null;
  for (let delayMonths = 0; delayMonths <= maximumMonths; delayMonths += 1) {
    const result = evaluatePreOperationalStage({ ...input, delayMonths });
    if (!result || result.adjustedNpvUf < 0) break;
    last = delayMonths;
  }
  return last;
}
