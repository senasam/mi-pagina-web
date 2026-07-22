import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  Breadcrumbs,
  PageShell,
} from "./LearningComponents";
import { breadcrumbSchema, usePageMetadata } from "./seo";
import { trackEvent } from "./analytics";
import {
  BROKERAGE_MODES,
  calculateBrokerageCommission,
} from "./brokerageEngine";
import {
  RATE_CONVENTIONS,
  formatClp,
  formatPercent,
  formatUf,
} from "./mortgageEngine";
import {
  assessInvestmentDecision,
  compareScenarios,
  impliedMonthlyRentUf,
  projectInvestment,
  sensitivityMatrix,
  realRateFromNominal,
  solveBreakEvenOccupancy,
  solveBreakEvenPrice,
  solveBreakEvenRent,
  solveIndifferenceRate,
  solveMaximumInterestRate,
} from "./investmentEngine";
import {
  PROPERTY_KINDS,
  evaluateDeliveryScenarios,
  evaluatePreOperationalStage,
  hasFutureDelivery,
  isNewProperty,
  maximumTolerableDelay,
} from "./preOperationalEngine";
import { formatNumericInput, normalizeNumericInput } from "./chileanNumberInput";

import {
  PATH,
  REVIEW_DATE,
  asNumber,
  dateLabel,
  initial,
  pct,
  ufPlusLabel,
} from "./investment-evaluator/config";
import InvestmentForm from "./investment-evaluator/InvestmentForm";
import InvestmentMethodology, { InvestmentReference } from "./investment-evaluator/InvestmentMethodology";
import InvestmentResults from "./investment-evaluator/InvestmentResults";
export default function InvestmentEvaluatorPage() {
  const [mode, setMode] = useState("property");
  const [currencyMode, setCurrencyMode] = useState("uf");
  const [form, setForm] = useState({ ...initial });
  const [manualUf, setManualUf] = useState("");
  const [uf, setUf] = useState({
    valueClp: null,
    effectiveDate: null,
    mode: "loading",
    stale: false,
    automaticValue: null,
  });
  const [opportunityData, setOpportunityData] = useState({
    status: "loading",
    inflation: null,
    mortgageRate: null,
    alternatives: [],
    caveat: "",
  });
  const [opportunitySelection, setOpportunitySelection] =
    useState("deposit-uf");
  const [inflationMode, setInflationMode] = useState("automatic");
  const [creditRateMode, setCreditRateMode] = useState("automatic");
  const [showProjection, setShowProjection] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [message, setMessage] = useState("");
  const set = (key) => (value) => {
    setShowResults(false);
    setForm((current) => ({ ...current, [key]: value }));
  };
  const newProperty = isNewProperty(form.propertyKind);
  const futureDelivery = hasFutureDelivery(form.propertyKind);
  const changePropertyLevel = (value) => {
    setShowResults(false);
    if (value === "new") {
      setForm((current) => ({
        ...current,
        propertyKind:
          current.propertyKind === PROPERTY_KINDS.USED
            ? PROPERTY_KINDS.NEW_IMMEDIATE
            : current.propertyKind,
        preparationMonths:
          current.propertyKind === PROPERTY_KINDS.USED ? 1 : current.preparationMonths,
        tenantSearchMonths:
          current.propertyKind === PROPERTY_KINDS.USED ? 1 : current.tenantSearchMonths,
        dfl2Status:
          current.propertyKind === PROPERTY_KINDS.USED
            ? "confirmed"
            : current.dfl2Status,
      }));
      return;
    }
    if (
      newProperty &&
      !window.confirm(
        "Al cambiar a propiedad usada se desactivarán el bono pie, las cuotas de inmobiliaria, el crédito directo y los atrasos del proyecto. Los datos comunes se mantendrán. ¿Quieres continuar?",
      )
    )
      return;
    setForm((current) => ({
      ...current,
      propertyKind: PROPERTY_KINDS.USED,
      bonoEnabled: false,
      bonoAmount: 0,
      developerInstallments: false,
      developerCredit: false,
      delayMonths: 0,
      preparationMonths: 0,
      tenantSearchMonths: 0,
      dfl2Status: "unknown",
    }));
  };

  const schema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@graph": [
        breadcrumbSchema([
          { label: "Inicio", href: "/" },
          { label: "Herramientas", href: "/herramientas" },
          { label: "Evaluador de inversión inmobiliaria", href: PATH },
        ]),
        {
          "@type": "WebApplication",
          name: "Evaluador de inversión inmobiliaria para arriendo",
          description:
            "Herramienta educativa para proyectar adquisición, financiamiento, arriendo, salida y continuidad de una propiedad residencial en Chile.",
          url: `https://masanes.cl${PATH}`,
          applicationCategory: "FinanceApplication",
          operatingSystem: "Navegador web",
          isAccessibleForFree: true,
          inLanguage: "es-CL",
          dateModified: REVIEW_DATE,
        },
      ],
    }),
    [],
  );
  usePageMetadata({
    title: "Evaluador de inversión inmobiliaria para arriendo",
    description:
      "Proyecta capital inicial, arriendo, vacancia, gastos, crédito, flujo, VPN, TIR y alternativas de venta o continuidad en Chile.",
    path: PATH,
    schema,
  });

  const loadUf = async (force = false) => {
    if (force) setShowResults(false);
    setUf((current) => ({ ...current, mode: "loading" }));
    try {
      const response = await fetch(
        `/api/indicadores/uf${force ? `?t=${Date.now()}` : ""}`,
        { headers: { Accept: "application/json" } },
      );
      const data = await response.json();
      if (!(data.valueClp > 0)) throw new Error("UF no disponible");
      setUf({
        valueClp: data.valueClp,
        effectiveDate: data.effectiveDate,
        mode: data.status === "cached" ? "cached" : "automatic",
        stale: Boolean(data.stale),
        automaticValue: data.valueClp,
      });
    } catch {
      setUf((current) => ({
        ...current,
        mode: current.automaticValue ? "cached" : "unavailable",
        stale: true,
      }));
    }
  };
  const loadOpportunityData = async (force = false) => {
    setOpportunityData((current) => ({ ...current, status: "loading" }));
    try {
      const response = await fetch(
        `/api/indicadores/oportunidades${force ? `?t=${Date.now()}` : ""}`,
        { headers: { Accept: "application/json" } },
      );
      const data = await response.json();
      if (!Array.isArray(data.alternatives))
        throw new Error("Referencias no disponibles");
      setOpportunityData(data);
      const defaultAlternative =
        opportunitySelection === "custom"
          ? null
          : data.alternatives.find(
              (item) => item.id === opportunitySelection,
            ) ||
            data.alternatives.find((item) => item.id === "deposit-uf") ||
            data.alternatives[0];
      setForm((current) => ({
        ...current,
        ...(data.mortgageRate && creditRateMode === "automatic"
          ? { annualRate: data.mortgageRate.annualRate }
          : {}),
        ...(defaultAlternative
          ? {
              opportunityCostRate: defaultAlternative.annualRate,
              opportunityRateBasis: defaultAlternative.basis,
            }
          : {}),
        ...(data.inflation
          ? { expectedInflationRate: data.inflation.annualRate }
          : {}),
      }));
      if (defaultAlternative) setOpportunitySelection(defaultAlternative.id);
      else if (opportunitySelection !== "custom")
        setOpportunitySelection("custom");
    } catch {
      setOpportunityData({
        status: "unavailable",
        inflation: null,
        mortgageRate: null,
        alternatives: [],
        caveat: "Las fuentes oficiales no están disponibles temporalmente.",
      });
      setOpportunitySelection("custom");
    }
  };
  useEffect(() => {
    trackEvent("investment_tool_viewed", {
      tool: "investment",
      mode: "property",
    });
    loadUf();
    loadOpportunityData();
  }, []);
  const selectedAlternative =
    opportunityData.alternatives.find(
      (item) => item.id === opportunitySelection,
    ) || null;
  const chooseOpportunity = (id) => {
    setShowResults(false);
    setOpportunitySelection(id);
    const alternative = opportunityData.alternatives.find(
      (item) => item.id === id,
    );
    if (alternative)
      setForm((current) => ({
        ...current,
        opportunityCostRate: alternative.annualRate,
        opportunityRateBasis: alternative.basis,
      }));
  };
  const restoreAutomaticInflation = () => {
    if (!opportunityData.inflation) return;
    setShowResults(false);
    setForm((current) => ({
      ...current,
      expectedInflationRate: opportunityData.inflation.annualRate,
    }));
    setInflationMode("automatic");
  };
  const restoreOfficialCreditRate = () => {
    if (!opportunityData.mortgageRate) return;
    setShowResults(false);
    setForm((current) => ({
      ...current,
      annualRate: opportunityData.mortgageRate.annualRate,
    }));
    setCreditRateMode("automatic");
  };
  const resetForm = () => {
    const alternative =
      opportunityData.alternatives.find((item) => item.id === "deposit-uf") ||
      opportunityData.alternatives[0];
    setForm({
      ...initial,
      ...(alternative
        ? {
            opportunityCostRate: alternative.annualRate,
            opportunityRateBasis: alternative.basis,
          }
        : {}),
      ...(opportunityData.inflation
        ? { expectedInflationRate: opportunityData.inflation.annualRate }
        : {}),
      ...(opportunityData.mortgageRate
        ? { annualRate: opportunityData.mortgageRate.annualRate }
        : {}),
    });
    setOpportunitySelection(alternative?.id || "custom");
    setShowResults(false);
    setInflationMode("automatic");
    setCreditRateMode("automatic");
  };
  const ufValue = uf.mode === "manual" ? asNumber(manualUf) : uf.valueClp;
  const enteredOpportunityRate = pct(form.opportunityCostRate);
  const expectedInflationRate = pct(form.expectedInflationRate);
  const realOpportunityRate =
    form.opportunityRateBasis === "nominal-clp"
      ? realRateFromNominal(enteredOpportunityRate, expectedInflationRate)
      : enteredOpportunityRate;
  const effectivePropertyPriceUf = newProperty
    ? asNumber(form.writtenPriceUf)
    : asNumber(form.propertyPriceUf);

  const comparableRent = impliedMonthlyRentUf({
    targetPropertyPriceUf: effectivePropertyPriceUf,
    comparablePropertyPriceUf: asNumber(form.comparablePriceUf),
    comparableMonthlyRentUf: asNumber(form.comparableRentUf),
  });
  const monthlyRent =
    mode === "comparable" && comparableRent != null
      ? comparableRent
      : asNumber(form.monthlyRentUf);
  const buyerBrokerage = useMemo(() => {
    try {
      return calculateBrokerageCommission({
        mode: form.brokerageMode,
        amount: asNumber(form.brokerageAmount),
        rate:
          form.brokerageMode === BROKERAGE_MODES.PERCENTAGE
            ? pct(form.brokerageAmount)
            : 0,
        taxTreatment: form.brokerageTax,
        propertyPriceUf: effectivePropertyPriceUf,
        agreedPriceUf: effectivePropertyPriceUf,
        ufValueClp: ufValue || 1,
      });
    } catch {
      return { finalUf: 0 };
    }
  }, [
    form.brokerageAmount,
    form.brokerageMode,
    form.brokerageTax,
    effectivePropertyPriceUf,
    ufValue,
  ]);

  const inputs = useMemo(
    () => ({
      propertyPriceUf: effectivePropertyPriceUf,
      monthlyRentUf: monthlyRent,
      occupancyRate: pct(form.occupancyRate),
      rentGrowthRate: pct(form.rentGrowthRate),
      rentCurrency: form.rentCurrency,
      rentAdjustmentMonths: asNumber(form.rentAdjustmentMonths),
      expectedInflationRate,
      appreciationRate: pct(form.appreciationRate),
      appreciationStartYear: asNumber(form.appreciationStartYear),
      appreciationEndYear: asNumber(form.appreciationEndYear),
      opportunityCostRate: realOpportunityRate,
      perpetualGrowthRate: pct(form.perpetualGrowthRate),
      horizonYears: asNumber(form.horizonYears),
      saleYear: form.saleYear === "never" ? null : asNumber(form.saleYear),
      saleStrategy: form.saleYear === "never" ? "never" : "sell",
      acquisitionExpenses: [
        { amountUf: asNumber(form.acquisitionExpensesUf), included: true },
      ],
      preparationCostsUf:
        asNumber(form.preparationCostsUf) + asNumber(form.furnitureUf),
      initialReservesUf: asNumber(form.initialReservesUf),
      buyerBrokerageUf: buyerBrokerage.finalUf,
      monthlyCommonExpenseUf: asNumber(form.monthlyCommonExpenseUf),
      ownerCommonShareOccupied: pct(form.ownerCommonShareOccupied),
      ownerCommonShareVacant: pct(form.ownerCommonShareVacant),
      maintenanceRate: pct(form.maintenanceRate),
      administrationRate: pct(form.administrationRate),
      contributionsAnnualUf: asNumber(form.contributionsAnnualUf),
      landlordInsuranceAnnualUf: asNumber(form.landlordInsuranceAnnualUf),
      otherOperatingAnnualUf: asNumber(form.otherOperatingAnnualUf),
      capitalExpenditures:
        asNumber(form.capexAmountUf) > 0
          ? [
              {
                year: asNumber(form.capexYear),
                amountUf: asNumber(form.capexAmountUf),
              },
            ]
          : [],
      saleCostRate: pct(form.saleCostRate),
      fixedSaleCostsUf: asNumber(form.fixedSaleCostsUf),
      prepaymentCostUf:
        form.prepaymentMode === "confirmed"
          ? asNumber(form.prepaymentCostUf)
          : form.prepaymentMode === "none"
            ? 0
            : undefined,
      prepaymentCommissionMonths:
        form.prepaymentMode === "automatic-uf" ? 1.5 : 0,
      mortgageInputs: {
        propertyPriceUf: effectivePropertyPriceUf,
        appraisalValueUf: asNumber(form.appraisalValueUf) || undefined,
        financingRatio: pct(form.financingRatio),
        annualRate: pct(form.annualRate),
        rateConvention: RATE_CONVENTIONS.EFFECTIVE,
        termMonths: asNumber(form.termYears) * 12,
        ufValueClp: ufValue || 1,
        lifeInsurance: {
          enabled: true,
          base: "opening-loan-balance",
          monthlyRate: 0.00004,
          multiplier: 1,
        },
        propertyInsurance: {
          enabled: true,
          base: "fixed",
          fixedMonthlyUf: 0.45,
          multiplier: 1,
        },
        recurringCosts: [],
        expenses: [],
      },
    }),
    [form, monthlyRent, buyerBrokerage.finalUf, ufValue, realOpportunityRate],
  );

  const errors = [];
  if (!(inputs.propertyPriceUf > 0))
    errors.push("Ingresa un precio de propiedad mayor que cero para poder calcular la compra.");
  if (!(inputs.monthlyRentUf >= 0)) errors.push("Ingresa un arriendo mensual igual o mayor que cero para calcular los ingresos.");
  if (!(inputs.occupancyRate >= 0 && inputs.occupancyRate <= 1))
    errors.push("Ingresa un porcentaje de ocupación entre 0% y 100%.");
  if (!(inputs.opportunityCostRate > inputs.perpetualGrowthRate))
    errors.push(
      "La rentabilidad de tu otra alternativa debe ser mayor que el crecimiento de largo plazo del arriendo. Baja ese crecimiento o sube la rentabilidad alternativa.",
    );
  if (form.saleYear !== "never" && !(asNumber(form.saleYear) <= asNumber(form.horizonYears)))
    errors.push("El año en que compararás vender debe estar dentro del período proyectado. Elige un año menor o amplía la proyección.");
  if (newProperty && asNumber(form.balloonUf) > 0 && form.balloonMonth === "")
    errors.push("Indica en qué mes pagarás la cuota final para poder ubicar ese pago.");
  if (
    newProperty &&
    form.manualFirstRentMonth !== "" &&
    asNumber(form.manualFirstRentMonth) <
      (futureDelivery ? asNumber(form.deliveryMonths) + asNumber(form.delayMonths) : 0) +
        asNumber(form.deliveryToWritingMonths) +
        asNumber(form.writingToMaterialMonths)
  )
    errors.push("El primer arriendo no puede ocurrir antes de recibir materialmente la propiedad. Corrige la fecha de entrega o el mes del primer arriendo.");
  const stepErrors = {
    1: errors.filter((error) => /precio de propiedad|cuota final|primer arriendo/i.test(error)),
    2: errors.filter((error) => /arriendo mensual|ocupación/i.test(error)),
    3: [],
    4: errors.filter((error) => /año en que compararás vender/i.test(error)),
    5: errors.filter((error) => /rentabilidad de tu otra alternativa/i.test(error)),
    6: [],
    7: errors,
  };
  const result = useMemo(() => {
    try {
      return errors.length ? null : projectInvestment(inputs);
    } catch {
      return null;
    }
  }, [inputs, errors.join("|")]);
  const vpnViews = useMemo(() => {
    if (!result) return null;
    try {
      const horizonYears = Math.max(1, asNumber(form.horizonYears));
      const mortgageYears = Math.max(1, asNumber(form.termYears));
      const horizonSale = projectInvestment({
        ...inputs,
        horizonYears,
        saleYear: horizonYears,
        saleStrategy: "sell",
      });
      const throughMortgage = projectInvestment({
        ...inputs,
        horizonYears: mortgageYears,
        saleYear: mortgageYears,
        saleStrategy: "sell",
      });
      const perpetuity = projectInvestment({
        ...inputs,
        horizonYears: mortgageYears,
        saleYear: null,
        saleStrategy: "never",
      });
      const flowRows = (projection, initialEquityUf, terminalUf = 0) => [
        { year: 0, operatingUf: -initialEquityUf, terminalUf: 0, totalUf: -initialEquityUf },
        ...projection.map((row, index) => {
          const finalValueUf = index === projection.length - 1 ? terminalUf : 0;
          return {
            year: row.year,
            operatingUf: row.preTaxCashFlowUf,
            terminalUf: finalValueUf,
            totalUf: row.preTaxCashFlowUf + finalValueUf,
          };
        }),
      ];
      return {
        horizonSaleNpvUf: horizonSale.npvUf,
        mortgageSaleNpvUf: throughMortgage.npvUf,
        perpetuityNpvUf: perpetuity.npvUf,
        horizonSaleFlows: flowRows(horizonSale.annualProjection, horizonSale.initialEquityUf, horizonSale.selectedYearNetSaleValueUf),
        mortgageSaleFlows: flowRows(
          throughMortgage.annualProjection,
          throughMortgage.initialEquityUf,
          throughMortgage.selectedYearNetSaleValueUf,
        ),
        perpetuityFlows: flowRows(perpetuity.annualProjection, perpetuity.initialEquityUf, perpetuity.selectedYearHoldValueUf),
        horizonYears,
        mortgageYears,
      };
    } catch {
      return null;
    }
  }, [result, inputs, form.horizonYears, form.termYears]);
  const preOperationalInput = useMemo(
    () => ({
      ...form,
      operatingResult: result,
      propertyPriceUf: effectivePropertyPriceUf,
      listPriceUf: asNumber(form.listPriceUf),
      writtenPriceUf: effectivePropertyPriceUf,
      appraisalValueUf: asNumber(form.appraisalValueUf),
      opportunityCostRate: realOpportunityRate,
      ufValueClp: ufValue || 1,
      acquisitionExpensesUf: asNumber(form.acquisitionExpensesUf),
      buyerBrokerageUf: buyerBrokerage.finalUf,
      preparationCostsUf: asNumber(form.preparationCostsUf),
      furnitureUf: asNumber(form.furnitureUf),
      initialReservesUf: asNumber(form.initialReservesUf),
      monthlyCommonExpenseUf: asNumber(form.monthlyCommonExpenseUf),
      monthlyMortgagePaymentUf: result?.mortgage?.firstTotalPaymentUf,
    }),
    [
      form,
      result,
      effectivePropertyPriceUf,
      realOpportunityRate,
      ufValue,
      buyerBrokerage.finalUf,
    ],
  );
  const preOperational = useMemo(
    () => evaluatePreOperationalStage(preOperationalInput),
    [preOperationalInput],
  );
  const deliveryScenarios = useMemo(
    () =>
      result && futureDelivery
        ? evaluateDeliveryScenarios(preOperationalInput)
        : [],
    [result, futureDelivery, preOperationalInput],
  );
  const tolerableDelay = useMemo(
    () =>
      result && futureDelivery
        ? maximumTolerableDelay(preOperationalInput)
        : null,
    [result, futureDelivery, preOperationalInput],
  );
  const decision = useMemo(() => {
    const base = assessInvestmentDecision(result);
    if (!base || !preOperational?.applies) return base;
    const blockers = [...base.blockers];
    const strengths =
      preOperational.adjustedNpvUf < 0
        ? base.strengths.filter((item) => !item.includes("valor presente neto"))
        : base.strengths;
    const risks = [...base.risks, ...preOperational.warnings];
    if (preOperational.adjustedNpvUf < 0)
      blockers.push("Desde hoy, la propiedad queda por debajo de la otra inversión que elegiste.");
    if (
      preOperational.liquidityBufferUf != null &&
      preOperational.liquidityBufferUf < 0
    )
      blockers.push("El dinero disponible no cubre el máximo que necesitarías antes del primer arriendo.");
    if (preOperational.totalDscr != null && preOperational.totalDscr < 1)
      blockers.push("El arriendo después de gastos normales no cubre el crédito hipotecario y las cuotas pendientes del pie.");
    const status = blockers.length ? "no-avanzar" : "avanzar-con-condiciones";
    return {
      ...base,
      status,
      blockers,
      strengths,
      risks,
      label:
        status === "avanzar-con-condiciones"
          ? "Avanzar con condiciones"
          : "No avanzar bajo estos supuestos",
      conclusion:
        status === "avanzar-con-condiciones"
          ? "Bajo estos supuestos, el resultado desde hoy supera los filtros básicos del modelo. Aún debes confirmar el bono, las fechas y el dinero disponible."
          : "Bajo estos supuestos, no conviene avanzar todavía. Primero corrige o confirma las condiciones señaladas.",
    };
  }, [result, preOperational]);
  const scenarios = useMemo(
    () =>
      result
        ? compareScenarios(inputs, [
            {
              id: "cautious",
              name: "Escenario difícil",
              overrides: {
                occupancyRate: Math.max(0, inputs.occupancyRate - 0.08),
                appreciationRate: inputs.appreciationRate - 0.02,
              },
            },
            { id: "base", name: "Tu escenario", overrides: {} },
            {
              id: "favorable",
              name: "Escenario favorable",
              overrides: {
                occupancyRate: Math.min(1, inputs.occupancyRate + 0.04),
                monthlyRentUf: inputs.monthlyRentUf * 1.06,
                appreciationRate: inputs.appreciationRate + 0.015,
              },
            },
          ])
        : [],
    [result, inputs],
  );
  const breakEvens = useMemo(
    () =>
      result
        ? {
            rent: solveBreakEvenRent(inputs),
            occupancy: solveBreakEvenOccupancy(inputs),
            price: solveBreakEvenPrice(inputs),
            interest: solveMaximumInterestRate(inputs),
            indifference: solveIndifferenceRate(inputs),
            maximumInitialCapitalUf: result.initialEquityUf + result.npvUf,
          }
        : null,
    [result, inputs],
  );
  const sensitivity = useMemo(
    () =>
      result
        ? sensitivityMatrix(
            inputs,
            "occupancyRate",
            [
              Math.max(0, inputs.occupancyRate - 0.1),
              inputs.occupancyRate,
              Math.min(1, inputs.occupancyRate + 0.05),
            ],
            "appreciationRate",
            [
              inputs.appreciationRate - 0.02,
              inputs.appreciationRate,
              inputs.appreciationRate + 0.02,
            ],
          )
        : [],
    [result, inputs],
  );
  const driverSensitivity = useMemo(
    () =>
      result
        ? [
            [
              "Ocupación −10 pp",
              projectInvestment({
                ...inputs,
                occupancyRate: Math.max(0, inputs.occupancyRate - 0.1),
              }).npvUf,
            ],
            [
              "Arriendo +10%",
              projectInvestment({
                ...inputs,
                monthlyRentUf: inputs.monthlyRentUf * 1.1,
              }).npvUf,
            ],
            [
              "Tasa hipotecaria +1 pp",
              projectInvestment({
                ...inputs,
                mortgageInputs: {
                  ...inputs.mortgageInputs,
                  annualRate: inputs.mortgageInputs.annualRate + 0.01,
                },
              }).npvUf,
            ],
            [
              "Variación del inmueble +2 pp",
              projectInvestment({
                ...inputs,
                appreciationRate: inputs.appreciationRate + 0.02,
              }).npvUf,
            ],
            [
              "Costo de oportunidad +2 pp",
              projectInvestment({
                ...inputs,
                opportunityCostRate: inputs.opportunityCostRate + 0.02,
              }).npvUf,
            ],
          ]
        : [],
    [result, inputs],
  );

  const summaryMoney = (value) =>
    Number.isFinite(value)
      ? `${formatUf(value)} (${ufValue > 0 ? formatClp(value * ufValue) : "CLP no disponible"})`
      : "no disponible";
  const firstYearCashUf = result?.annualProjection[0]?.preTaxCashFlowUf;
  const comparisonUf = preOperational?.applies
    ? preOperational.adjustedNpvUf
    : result?.npvUf;
  const dependsOnCashFlow = Boolean(
    result &&
      comparisonUf > 0 &&
      (firstYearCashUf < 0 || (result.dscr != null && result.dscr < 1)),
  );
  const initialDecisionLabel = dependsOnCashFlow
    ? "Depende"
    : decision?.label || "Bajo estos supuestos";
  const summary = result
    ? `¿Conviene comprar este departamento para arrendarlo?\nResultado bajo estos supuestos: ${initialDecisionLabel}\n${dependsOnCashFlow ? `Bajo estos supuestos, el proyecto crea valor con la rentabilidad exigida, pero el arriendo no cubre completamente el crédito. Durante el primer año deberías aportar aproximadamente ${summaryMoney(Math.abs(firstYearCashUf))}. Podría ser razonable avanzar únicamente si puedes financiar esos aportes y el resultado se mantiene en escenarios menos favorables.` : decision?.conclusion || ""}\n\nSUPUESTOS PRINCIPALES\nPrecio: ${summaryMoney(inputs.propertyPriceUf)}\nCrédito: ${form.financingRatio}% del precio, ${form.annualRate}% anual, ${form.termYears} años\nArriendo: ${summaryMoney(monthlyRent)} al mes\nMeses arrendados equivalentes: ${(12 * inputs.occupancyRate).toLocaleString("es-CL", { maximumFractionDigits: 1 })} al año\nRentabilidad mínima exigida: ${selectedAlternative?.label || "Tasa personalizada"}, ${ufPlusLabel(inputs.opportunityCostRate * 100, 2)}\n\nINVERSIÓN INICIAL DEL PROYECTO\n${summaryMoney(result.initialEquityUf)}\n${preOperational?.applies ? `Máximo dinero acumulado antes del primer arriendo: ${summaryMoney(preOperational.maximumCashUf)}\n` : ""}\nPRIMER AÑO\n${firstYearCashUf < 0 ? "Durante el primer año deberías aportar" : "Durante el primer año recibirías"}: ${summaryMoney(Math.abs(firstYearCashUf))}\n\nVALOR PRESENTE NETO DEL PROYECTO\nVPN estimado: ${summaryMoney(comparisonUf)}. ${comparisonUf > 0 ? "El proyecto crea valor por encima de la rentabilidad exigida." : comparisonUf < 0 ? "El proyecto no alcanza la rentabilidad exigida." : "El proyecto queda prácticamente en el punto de equilibrio."}\n\n${result.neverSell ? "CONTINUIDAD DE LARGO PLAZO" : `DECISIÓN EN EL AÑO ${result.saleYear}: RIQUEZA ESTIMADA AL AÑO ${result.comparisonYear}`}\n${result.neverSell ? `Valor estimado de continuidad: ${summaryMoney(result.selectedYearHoldValueUf)}` : `Si vendes e inviertes en tu mejor alternativa: ${summaryMoney(result.sellAndInvestTerminalWealthUf)}\nSi sigues arrendando y vendes al final: ${summaryMoney(result.holdUntilHorizonTerminalWealthUf)}\nDiferencia entre estrategias: ${summaryMoney(Math.abs(result.terminalWealthDifferenceUf))}`}\n\nINDICADORES TÉCNICOS\nValor presente neto: ${summaryMoney(result.npvUf)}\nTasa interna de retorno: ${result.irr.value == null ? "no disponible" : formatPercent(result.irr.value)}\n\nADVERTENCIAS\n${[...(decision?.blockers || []), ...(decision?.risks || [])].join(" ") || "Requiere validación profesional y documental."}\n\nAviso: herramienta automática con fines académicos; puede contener errores y no reemplaza asesoría profesional, asesor inmobiliario ni evaluación o comité de riesgo bancario. La decisión corresponde al usuario.`
    : "";
  const copy = async () => {
    await navigator.clipboard.writeText(summary);
    setMessage("Resumen copiado sin enviar datos fuera de tu dispositivo.");
    trackEvent("investment_summary_copied", {
      tool: "investment",
      status: "success",
    });
  };
  const revealResults = () => {
    if (!result) return;
    setShowResults(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const target = document.getElementById("simulation-result");
        target?.scrollIntoView({ block: "start", behavior: "smooth" });
        target?.focus({ preventScroll: true });
      });
    });
    trackEvent("investment_result_requested", {
      tool: "investment",
      status: initialDecisionLabel.toLowerCase(),
    });
  };
  const editSimulation = () => {
    setShowResults(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById("modelo")?.scrollIntoView({
          block: "start",
          behavior: "smooth",
        });
      });
    });
  };

  return (
    <PageShell>
      <main id="main-content" className="content-page investment-page">
        <Breadcrumbs
          items={[
            { label: "Inicio", href: "/" },
            { label: "Herramientas", href: "/herramientas" },
            { label: "Evaluador de inversión inmobiliaria", href: PATH },
          ]}
        />
        <header className="investment-hero">
          <div>
            <p className="eyebrow">
              Finanzas personales · herramienta educativa
            </p>
            <h1>¿Conviene comprar este departamento para arrendarlo?</h1>
            <p>
              Calcula cuánto dinero necesitas, cuánto tendrías que aportar y si
              la inversión podría rendir más que otra alternativa.
            </p>
            <section className="monetary-settings" aria-labelledby="monetary-settings-title">
              <header className="monetary-settings__header">
                <div>
                  <p className="eyebrow">Configuración monetaria</p>
                  <h2 id="monetary-settings-title">Valor UF y unidad de los montos</h2>
                </div>
                <p>
                  Usa la referencia automática o ingresa otra UF. Puedes alternar
                  entre UF y pesos sin perder los datos de la simulación.
                </p>
              </header>
              <div className="monetary-settings__body">
                <article className="uf-reference" aria-live="polite">
                  <div>
                    <p className="eyebrow">{uf.effectiveDate ? `Valor UF al ${dateLabel(uf.effectiveDate)}` : "Valor UF de referencia"}</p>
                    <h2>{ufValue > 0 ? formatClp(ufValue) : uf.mode === "loading" ? "Consultando…" : "No disponible"}</h2>
                    {uf.stale && <p className="warning-text">El valor puede estar desactualizado. Confirma la fecha antes de interpretar montos en pesos.</p>}
                  </div>
                  <div className="uf-reference__actions">
                    {(uf.mode === "manual" || uf.mode === "unavailable") && (
                      <label>Valor manual en CLP
                        <input type="text" inputMode="numeric" value={formatNumericInput(manualUf)} onChange={(event) => { setShowResults(false); setManualUf(normalizeNumericInput(event.target.value)); setUf((current) => ({ ...current, mode: "manual" })); }} data-private="true" />
                      </label>
                    )}
                    {["automatic", "cached"].includes(uf.mode) && (
                      <button className="button button--secondary" type="button" onClick={() => { setShowResults(false); setUf((current) => ({ ...current, mode: "manual" })); }}>Cambiar valor</button>
                    )}
                    <button className="text-button" type="button" onClick={() => loadUf(true)} disabled={uf.mode === "loading"}><RefreshCw size={15} /> {uf.mode === "loading" ? "Consultando" : "Actualizar"}</button>
                  </div>
                </article>
                <fieldset className="currency-selector">
                  <legend>¿En qué unidad quieres trabajar?</legend>
                  <p>Los campos y resultados mostrarán primero la unidad elegida y debajo su equivalencia.</p>
                  <div>
                    <label className={currencyMode === "uf" ? "active" : ""}>
                      <input
                        type="radio"
                        name="currency-mode"
                        value="uf"
                        checked={currencyMode === "uf"}
                        onChange={() => setCurrencyMode("uf")}
                      />
                      <span><strong>UF</strong><small>Unidad de Fomento</small></span>
                    </label>
                    <label className={currencyMode === "clp" ? "active" : ""}>
                      <input
                        type="radio"
                        name="currency-mode"
                        value="clp"
                        checked={currencyMode === "clp"}
                        onChange={() => setCurrencyMode("clp")}
                      />
                      <span><strong>CLP</strong><small>Pesos chilenos</small></span>
                    </label>
                  </div>
                </fieldset>
              </div>
              <p className="monetary-settings__note">
                La unidad elegida cambia cómo ingresas y lees los montos, no los supuestos financieros guardados en tu escenario.
              </p>
            </section>
          </div>
        </header>

        <div className="investment-form-region" hidden={showResults}>
          <InvestmentForm
            model={{
            mode,
            setMode,
            currencyMode,
            form,
            set,
            newProperty,
            futureDelivery,
            changePropertyLevel,
            errors,
            stepErrors,
            hideResults: () => setShowResults(false),
            ufValue,
            preOperational,
            buyerBrokerage,
            opportunityData,
            inflationMode,
            setInflationMode,
            creditRateMode,
            setCreditRateMode,
            selectedAlternative,
            opportunitySelection,
            chooseOpportunity,
            restoreAutomaticInflation,
            restoreOfficialCreditRate,
            comparableRent,
            resetForm,
            revealResults,
            result,
            loadOpportunityData,
            realOpportunityRate,
            }}
          />
        </div>
        <InvestmentResults
          model={{
            showResults,
            editSimulation,
            result,
            decision,
            inputs,
            form,
            monthlyRent,
            ufValue,
            currencyMode,
            selectedAlternative,
            scenarios,
            dependsOnCashFlow,
            breakEvens,
            vpnViews,
            realOpportunityRate,
            preOperational,
            showProjection,
            setShowProjection,
            summary,
            copy,
            message,
            deliveryScenarios,
            tolerableDelay,
            sensitivity,
            driverSensitivity,
            methodology: <InvestmentMethodology />,
            reference: <InvestmentReference />,
          }}
        />
      </main>
    </PageShell>
  );
}
