import { calculateBrokeragePlan } from "./brokerageEngine.js";

export const UF_TOLERANCE = 1e-6;
export const RATE_CONVENTIONS = {
  EFFECTIVE: "annual-effective",
  NOMINAL_MONTHLY: "annual-nominal-monthly",
};
export const STAMP_TAX_RATES = Object.freeze({ GENERAL: 0.008, DFL2: 0.002 });

const finite = (value) => Number.isFinite(value);
const nonNegative = (value, fallback = 0) => finite(value) && value >= 0 ? value : fallback;

export function parseChileanNumber(raw) {
  if (typeof raw === "number") return finite(raw) ? raw : Number.NaN;
  if (typeof raw !== "string") return Number.NaN;
  let value = raw.trim().replace(/\s|\$/g, "").replace(/UF/gi, "").replace(/%/g, "");
  if (!value) return Number.NaN;
  const comma = value.lastIndexOf(",");
  const dot = value.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) {
    const decimal = comma > dot ? "," : ".";
    value = value.replace(decimal === "," ? /\./g : /,/g, "").replace(decimal, ".");
  } else if (comma >= 0) {
    const decimals = value.length - comma - 1;
    value = decimals === 3 && /^-?\d{1,3}(,\d{3})+$/.test(value)
      ? value.replace(/,/g, "")
      : value.replace(/\./g, "").replace(",", ".");
  } else if (dot >= 0) {
    const decimals = value.length - dot - 1;
    if (decimals === 3 && /^-?\d{1,3}(\.\d{3})+$/.test(value)) value = value.replace(/\./g, "");
    else value = value.replace(/,/g, "");
  }
  const parsed = Number(value);
  return finite(parsed) ? parsed : Number.NaN;
}

export const formatUf = (value, digits = 2) => finite(value)
  ? new Intl.NumberFormat("es-CL", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value) + " UF"
  : "—";
export const formatClp = (value) => finite(value)
  ? new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value)
  : "—";
export const formatPercent = (value, digits = 2) => finite(value)
  ? new Intl.NumberFormat("es-CL", { style: "percent", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)
  : "—";

export function monthlyRateFromAnnual(annualRate, convention = RATE_CONVENTIONS.EFFECTIVE) {
  if (!finite(annualRate) || annualRate < 0) throw new RangeError("La tasa anual debe ser un número no negativo.");
  if (convention === RATE_CONVENTIONS.EFFECTIVE) return Math.pow(Math.pow(1 + annualRate, 365 / 360), 1 / 12) - 1;
  if (convention === RATE_CONVENTIONS.NOMINAL_MONTHLY) return annualRate / 12;
  throw new RangeError("La convención de tasa no es válida.");
}

export function evaluateDfl2StampTax(assumptions = {}) {
  const priorBenefitedHomes = Number(assumptions.priorBenefitedHomes);
  const criteria = {
    certifiedProperty: assumptions.certifiedProperty === true,
    firstTransfer: assumptions.firstTransfer === true,
    withinTwoYearsOfReception: assumptions.withinTwoYearsOfReception === true,
    naturalPersonBuyer: assumptions.naturalPersonBuyer === true,
    availableHousingQuota: Number.isInteger(priorBenefitedHomes) && priorBenefitedHomes >= 0 && priorBenefitedHomes < 2,
  };
  const eligible = Object.values(criteria).every(Boolean);
  return { eligible, rate: eligible ? STAMP_TAX_RATES.DFL2 : STAMP_TAX_RATES.GENERAL, criteria, priorBenefitedHomes };
}

export function levelPayment(principal, monthlyRate, periods) {
  if (!finite(principal) || principal < 0 || !finite(monthlyRate) || monthlyRate < 0 || !Number.isInteger(periods) || periods < 1) {
    throw new RangeError("Capital, tasa o plazo no válidos.");
  }
  if (principal === 0) return 0;
  if (Math.abs(monthlyRate) < Number.EPSILON) return principal / periods;
  return principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -periods));
}

export function financingBase(propertyPriceUf, appraisalValueUf) {
  if (!finite(propertyPriceUf) || propertyPriceUf <= 0) throw new RangeError("El valor de la propiedad debe ser mayor que cero.");
  return finite(appraisalValueUf) && appraisalValueUf > 0 ? Math.min(propertyPriceUf, appraisalValueUf) : propertyPriceUf;
}

export function expenseAmountUf(expense, context) {
  if (!expense?.enabled) return 0;
  const amount = nonNegative(expense.amount);
  let base = 0;
  if (expense.mode === "fixed-uf") base = amount;
  else if (expense.mode === "fixed-clp") base = context.ufValueClp > 0 ? amount / context.ufValueClp : 0;
  else if (expense.mode === "property-percentage") base = context.propertyPriceUf * amount;
  else if (expense.mode === "principal-percentage") base = context.principalUf * amount;
  const taxRate = nonNegative(expense.taxRate);
  return base * (1 + taxRate);
}

export function insuranceForPeriod(assumption, context) {
  if (!assumption?.enabled) return 0;
  if (assumption.base === "fixed") return nonNegative(assumption.fixedMonthlyUf) * nonNegative(assumption.multiplier, 1);
  const bases = {
    "opening-loan-balance": context.openingBalanceUf,
    "initial-loan-principal": context.principalUf,
    "appraisal-value": context.appraisalValueUf || context.propertyPriceUf,
    "property-value": context.propertyPriceUf,
  };
  return nonNegative(bases[assumption.base]) * nonNegative(assumption.monthlyRate) * nonNegative(assumption.multiplier, 1);
}

export function generateAmortizationSchedule(inputs) {
  const principalUf = nonNegative(inputs.principalUf);
  const termMonths = inputs.termMonths;
  if (!Number.isInteger(termMonths) || termMonths < 1 || termMonths > 600) throw new RangeError("El plazo debe estar entre 1 y 600 meses.");
  const monthlyRate = monthlyRateFromAnnual(inputs.annualRate, inputs.rateConvention);
  const scheduledPayment = levelPayment(principalUf, monthlyRate, termMonths);
  const rows = [];
  let balance = principalUf;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;
  let cumulativeInsurance = 0;
  let cumulativeRecurring = 0;
  let cumulativeTotal = 0;
  for (let period = 1; period <= termMonths; period += 1) {
    const openingBalanceUf = balance;
    const interestUf = openingBalanceUf * monthlyRate;
    const isFinal = period === termMonths;
    const principalComponent = Math.max(0, scheduledPayment - interestUf);
    const principalPaidUf = isFinal ? openingBalanceUf : Math.min(openingBalanceUf, principalComponent);
    const basePaymentUf = principalPaidUf + interestUf;
    const context = { ...inputs, openingBalanceUf, principalUf };
    const lifeInsuranceUf = insuranceForPeriod(inputs.lifeInsurance, context);
    const propertyInsuranceUf = insuranceForPeriod(inputs.propertyInsurance, context);
    const otherRecurringUf = (inputs.recurringCosts || []).reduce((sum, item) => sum + insuranceForPeriod(item, context), 0);
    const insuranceUf = lifeInsuranceUf + propertyInsuranceUf;
    const totalPaymentUf = basePaymentUf + insuranceUf + otherRecurringUf;
    balance = Math.max(0, openingBalanceUf - principalPaidUf);
    if (balance < UF_TOLERANCE) balance = 0;
    cumulativePrincipal += principalPaidUf;
    cumulativeInterest += interestUf;
    cumulativeInsurance += insuranceUf;
    cumulativeRecurring += otherRecurringUf;
    cumulativeTotal += totalPaymentUf;
    rows.push({
      period, openingBalanceUf, interestUf, principalUf: principalPaidUf, basePaymentUf,
      lifeInsuranceUf, propertyInsuranceUf, otherRecurringUf, totalPaymentUf,
      totalPaymentClp: totalPaymentUf * inputs.ufValueClp, closingBalanceUf: balance,
      cumulativePrincipalUf: cumulativePrincipal, cumulativeInterestUf: cumulativeInterest,
      cumulativeInsuranceUf: cumulativeInsurance, cumulativeRecurringUf: cumulativeRecurring,
      cumulativeTotalUf: cumulativeTotal,
      principalShare: totalPaymentUf ? principalPaidUf / totalPaymentUf : 0,
      interestAndCostShare: totalPaymentUf ? (interestUf + insuranceUf + otherRecurringUf) / totalPaymentUf : 0,
    });
  }
  return rows;
}

export function aggregateScheduleAnnually(schedule) {
  const years = [];
  for (let start = 0; start < schedule.length; start += 12) {
    const rows = schedule.slice(start, start + 12);
    years.push({
      year: years.length + 1,
      openingBalanceUf: rows[0].openingBalanceUf,
      principalUf: rows.reduce((sum, row) => sum + row.principalUf, 0),
      interestUf: rows.reduce((sum, row) => sum + row.interestUf, 0),
      insuranceUf: rows.reduce((sum, row) => sum + row.lifeInsuranceUf + row.propertyInsuranceUf, 0),
      recurringUf: rows.reduce((sum, row) => sum + row.otherRecurringUf, 0),
      totalUf: rows.reduce((sum, row) => sum + row.totalPaymentUf, 0),
      closingBalanceUf: rows.at(-1).closingBalanceUf,
    });
  }
  return years;
}

export function estimatedFlowRate(principalUf, includedInitialExpensesUf, schedule) {
  const initial = principalUf - nonNegative(includedInitialExpensesUf);
  if (!(initial > 0) || !schedule.length) return null;
  const flows = [initial, ...schedule.map((row) => -row.totalPaymentUf)];
  const npv = (rate) => flows.reduce((sum, flow, index) => sum + flow / Math.pow(1 + rate, index), 0);
  let low = -0.9999;
  let high = 1;
  let lowValue = npv(low);
  let highValue = npv(high);
  if (!finite(lowValue) || !finite(highValue) || Math.sign(lowValue) === Math.sign(highValue)) return null;
  for (let i = 0; i < 200; i += 1) {
    const mid = (low + high) / 2;
    const value = npv(mid);
    if (!finite(value)) return null;
    if (Math.abs(value) < 1e-9 || high - low < 1e-12) {
      return { monthly: mid, nominalAnnualized: mid * 12, effectiveAnnualized: Math.pow(1 + mid, 12) - 1 };
    }
    if (Math.sign(value) === Math.sign(lowValue)) { low = mid; lowValue = value; }
    else { high = mid; highValue = value; }
  }
  return null;
}

export function calculateMortgage(inputs) {
  const baseUf = financingBase(inputs.propertyPriceUf, inputs.appraisalValueUf);
  if (!finite(inputs.financingRatio) || inputs.financingRatio < 0 || inputs.financingRatio > 1) throw new RangeError("El financiamiento debe estar entre 0% y 100%.");
  if (!finite(inputs.ufValueClp) || inputs.ufValueClp <= 0) throw new RangeError("La UF debe ser mayor que cero.");
  const principalUf = baseUf * inputs.financingRatio;
  const requiredDownPaymentUf = Math.max(0, inputs.propertyPriceUf - principalUf);
  const schedule = generateAmortizationSchedule({ ...inputs, principalUf });
  const annualSchedule = aggregateScheduleAnnually(schedule);
  const expenseContext = { ...inputs, principalUf, ufValueClp: inputs.ufValueClp };
  const expenses = (inputs.expenses || []).map((expense) => ({ ...expense, calculatedUf: expenseAmountUf(expense, expenseContext) }));
  const proposalContext = { propertyPriceUf: inputs.propertyPriceUf, agreedPriceUf: inputs.propertyPriceUf, ufValueClp: inputs.ufValueClp };
  const brokeragePlan = inputs.brokerageConfig ? calculateBrokeragePlan({
    ...inputs.brokerageConfig,
    buyerProposal: { ...proposalContext, ...inputs.brokerageConfig.buyerProposal },
    sellerProposal: inputs.brokerageConfig.sellerProposal ? { ...proposalContext, ...inputs.brokerageConfig.sellerProposal } : undefined,
  }) : inputs.brokeragePlan || null;
  const legacyBrokerageUf = !brokeragePlan && inputs.brokerage?.enabled
    ? inputs.brokerage.mode === "fixed-clp" ? nonNegative(inputs.brokerage.amount) / inputs.ufValueClp
      : inputs.brokerage.mode === "fixed-uf" ? nonNegative(inputs.brokerage.amount)
        : inputs.propertyPriceUf * nonNegative(inputs.brokerage.amount)
    : 0;
  const operationalExpensesUf = expenses.filter((expense) => expense.id !== "other").reduce((sum, expense) => sum + expense.calculatedUf, 0);
  const otherInitialExpensesUf = expenses.filter((expense) => expense.id === "other").reduce((sum, expense) => sum + expense.calculatedUf, 0);
  const buyerBrokerageUf = brokeragePlan?.initialCashContributionUf ?? legacyBrokerageUf;
  const brokerageUf = buyerBrokerageUf;
  const initialExpensesUf = operationalExpensesUf + otherInitialExpensesUf + buyerBrokerageUf;
  const first = schedule[0];
  const last = schedule.at(-1);
  const totalInterestUf = last?.cumulativeInterestUf || 0;
  const totalInsuranceUf = last?.cumulativeInsuranceUf || 0;
  const totalRecurringCostsUf = last?.cumulativeRecurringUf || 0;
  const totalMonthlyPaymentsUf = last?.cumulativeTotalUf || 0;
  const householdIncomeClp = nonNegative(inputs.householdIncomeClp);
  const existingDebtClp = nonNegative(inputs.existingMonthlyDebtClp);
  const firstTotalPaymentClp = first.totalPaymentUf * inputs.ufValueClp;
  const burdenRatio = householdIncomeClp > 0 ? firstTotalPaymentClp / householdIncomeClp : null;
  const totalDebtBurdenRatio = householdIncomeClp > 0 ? (firstTotalPaymentClp + existingDebtClp) / householdIncomeClp : null;
  const planningBurdenRatio = nonNegative(inputs.planningBurdenRatio);
  const requiredIncomeClp = planningBurdenRatio > 0 ? (firstTotalPaymentClp + existingDebtClp) / planningBurdenRatio : null;
  const monthlyMarginClp = householdIncomeClp * planningBurdenRatio - existingDebtClp - firstTotalPaymentClp;
  const includedExpensesUf = expenses.filter((item) => item.includedInEquivalentCost).reduce((sum, item) => sum + item.calculatedUf, 0) + buyerBrokerageUf;
  return {
    ...inputs, financingBaseUf: baseUf, principalUf, requiredDownPaymentUf,
    requiredDownPaymentClp: requiredDownPaymentUf * inputs.ufValueClp,
    basePaymentUf: first.basePaymentUf, firstLifeInsuranceUf: first.lifeInsuranceUf,
    firstPropertyInsuranceUf: first.propertyInsuranceUf, firstTotalPaymentUf: first.totalPaymentUf,
    firstTotalPaymentClp, expenses, brokeragePlan, brokerageUf, buyerBrokerageUf, operationalExpensesUf, otherInitialExpensesUf, initialExpensesUf,
    initialExpensesClp: initialExpensesUf * inputs.ufValueClp,
    requiredInitialCashUf: requiredDownPaymentUf + initialExpensesUf,
    requiredInitialCashClp: (requiredDownPaymentUf + initialExpensesUf) * inputs.ufValueClp,
    availableDownPaymentDifferenceUf: finite(inputs.availableDownPaymentUf) ? inputs.availableDownPaymentUf - requiredDownPaymentUf : null,
    loanToCommercialValueRatio: principalUf / inputs.propertyPriceUf,
    appraisalDifferenceUf: finite(inputs.appraisalValueUf) ? inputs.appraisalValueUf - inputs.propertyPriceUf : null,
    monthlyRate: monthlyRateFromAnnual(inputs.annualRate, inputs.rateConvention),
    burdenRatio, totalDebtBurdenRatio, requiredIncomeClp, monthlyMarginClp,
    totalInterestUf, totalInsuranceUf, totalRecurringCostsUf, totalMonthlyPaymentsUf,
    estimatedFinancialCostUf: totalInterestUf + totalInsuranceUf + totalRecurringCostsUf + initialExpensesUf,
    estimatedTotalOutflowUf: requiredDownPaymentUf + initialExpensesUf + totalMonthlyPaymentsUf,
    halfPrincipalPeriod: schedule.find((row) => row.closingBalanceUf <= principalUf / 2)?.period || null,
    schedule, annualSchedule,
    equivalentFlowRate: estimatedFlowRate(principalUf, includedExpensesUf, schedule),
  };
}

export function solveAffordableProperty(inputs, options = {}) {
  if (!finite(inputs.householdIncomeClp) || inputs.householdIncomeClp < 0 || !finite(inputs.ufValueClp) || inputs.ufValueClp <= 0) return { status: "invalid" };
  const budgetClp = Math.max(0, inputs.householdIncomeClp * inputs.planningBurdenRatio - nonNegative(inputs.existingMonthlyDebtClp));
  if (budgetClp <= 0 || inputs.financingRatio <= 0) return { status: "impossible", budgetClp };
  let low = options.lowerBoundUf ?? 0;
  let high = options.upperBoundUf ?? 100000;
  const toleranceUf = options.toleranceUf ?? 0.001;
  const maxIterations = options.maxIterations ?? 100;
  const evaluate = (propertyPriceUf) => calculateMortgage({ ...inputs, propertyPriceUf, appraisalValueUf: undefined });
  let highResult = evaluate(high);
  if (!finite(highResult.firstTotalPaymentClp) || highResult.firstTotalPaymentClp <= budgetClp) return { status: "unbounded", budgetClp };
  let result = evaluate(low + toleranceUf);
  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const mid = (low + high) / 2;
    result = evaluate(mid);
    if (!finite(result.firstTotalPaymentClp)) return { status: "invalid", budgetClp };
    if (Math.abs(result.firstTotalPaymentClp - budgetClp) < 1 || high - low < toleranceUf) {
      return { status: "solved", budgetClp, iterations: iteration, propertyPriceUf: mid, result };
    }
    if (result.firstTotalPaymentClp > budgetClp) high = mid;
    else low = mid;
  }
  const propertyPriceUf = (low + high) / 2;
  return { status: "solved", budgetClp, iterations: maxIterations, propertyPriceUf, result: evaluate(propertyPriceUf) };
}
