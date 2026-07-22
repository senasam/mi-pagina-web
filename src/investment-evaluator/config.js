import { BROKERAGE_MODES, BROKERAGE_TAX } from "../brokerageEngine";
import { PROPERTY_KINDS } from "../preOperationalEngine";

export const REVIEW_DATE = "2026-07-18";
export const PATH = "/herramientas/evaluador-inversion-inmobiliaria";
export const initial = Object.freeze({
  propertyPriceUf: 4000,
  appraisalValueUf: "",
  propertyKind: PROPERTY_KINDS.USED,
  dfl2Status: "unknown",
  financingRatio: 70,
  annualRate: 4,
  termYears: 20,
  acquisitionExpensesUf: 65,
  preparationCostsUf: 70,
  furnitureUf: 35,
  initialReservesUf: 25,
  brokerageMode: BROKERAGE_MODES.PERCENTAGE,
  brokerageAmount: "2.0",
  brokerageTax: BROKERAGE_TAX.ADDED,
  monthlyRentUf: 13,
  rentCurrency: "uf",
  occupancyRate: 92,
  rentGrowthRate: 0,
  rentAdjustmentMonths: 3,
  comparablePriceUf: 3800,
  comparableRentUf: 17,
  monthlyCommonExpenseUf: 2.2,
  ownerCommonShareOccupied: 0,
  ownerCommonShareVacant: 100,
  maintenanceRate: 4,
  administrationRate: 5,
  contributionsAnnualUf: 5,
  landlordInsuranceAnnualUf: 2,
  otherOperatingAnnualUf: 1,
  appreciationRate: 1.5,
  appreciationStartYear: 1,
  appreciationEndYear: 5,
  saleCostRate: 2.38,
  fixedSaleCostsUf: 10,
  prepaymentMode: "automatic-uf",
  prepaymentCostUf: "",
  prepaymentMinimumUf: "",
  opportunityCostRate: 7,
  opportunityRateBasis: "nominal-clp",
  expectedInflationRate: 3,
  perpetualGrowthRate: 1,
  horizonYears: 20,
  saleYear: 10,
  capexYear: 6,
  capexAmountUf: 20,
  listPriceUf: 4000,
  writtenPriceUf: 4000,
  bonoEnabled: false,
  bonoType: "discount",
  bonoAmountMode: "fixed",
  bonoAmount: 0,
  bonoUnit: "uf",
  bonoBase: "written-price",
  bonoExpiryMonth: "",
  bonoLossOnDelay: "unknown",
  bonoPreservedDeveloperDelay: "unknown",
  bankKnowsBono: "unknown",
  bonoInPromise: "unknown",
  bonoConditions: "",
  deliveryMonths: 24,
  delayMonths: 0,
  deliveryToWritingMonths: 0,
  writingToMaterialMonths: 0,
  preparationMonths: 1,
  tenantSearchMonths: 1,
  manualFirstRentMonth: "",
  firstMortgagePaymentMonth: 25,
  developerInstallments: true,
  reserveUf: 0,
  promisePaymentUf: 0,
  promiseMonth: 1,
  otherInitialUf: 0,
  installmentCount: 24,
  firstInstallmentMonth: 1,
  balloonUf: 0,
  balloonMonth: "",
  installmentUnit: "uf",
  delayRule: "original",
  developerCredit: false,
  paymentByCard: false,
  capitalAvailableUf: "",
  delayCausedByDeveloper: true,
  reservationDate: new Date().toISOString().slice(0, 10),
});

export const asNumber = (value) =>
  typeof value === "number" ? value : Number(String(value).replace(",", "."));
export const pct = (value) => asNumber(value) / 100;
export const dateLabel = (date) =>
  date
    ? new Intl.DateTimeFormat("es-CL", {
        dateStyle: "long",
        timeZone: "UTC",
      }).format(new Date(`${date}T12:00:00Z`))
    : "sin fecha disponible";
export const sourceDateLabel = (date) =>
  /^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))
    ? dateLabel(date)
    : date || "sin fecha disponible";
export const rateNumberLabel = (value, minimumFractionDigits = 0) =>
  Number(value).toLocaleString("es-CL", {
    minimumFractionDigits,
    maximumFractionDigits: 2,
  });
export const ufPlusLabel = (percentage, minimumFractionDigits = 0) =>
  `UF + ${rateNumberLabel(percentage, minimumFractionDigits)}%`;
export const plainDecisionText = (text = "") =>
  text
    .replace("El valor presente neto es negativo con la rentabilidad mínima exigida.", "El proyecto no alcanza la rentabilidad mínima exigida bajo estos supuestos.")
    .replace("El valor presente neto es positivo con la rentabilidad mínima exigida.", "El proyecto crea valor por encima de la rentabilidad mínima exigida bajo estos supuestos.")
    .replace("El flujo del primer año es positivo antes de impuestos personales.", "Durante el primer año quedaría un excedente antes de impuestos personales.")
    .replace("El ingreso operativo neto no cubre completamente el servicio de la deuda.", "El arriendo después de los gastos normales no alcanza a cubrir completamente el crédito.")
    .replace("El ingreso operativo neto mantiene un margen sobre el servicio de la deuda.", "El arriendo después de los gastos normales cubre el crédito y deja un margen.")
    .replace("El valor presente neto está cerca de cero y puede cambiar de signo con variaciones pequeñas.", "La comparación con tu otra alternativa está cerca de cero y puede cambiar con pequeñas variaciones.")
    .replace("La tasa interna de retorno puede tener múltiples soluciones y no debe usarse de forma aislada.", "No es posible resumir estos flujos en una única tasa anual; revisa los montos y fechas.")
    .replace("La cobertura de deuda", "La capacidad del arriendo para cubrir el crédito");

