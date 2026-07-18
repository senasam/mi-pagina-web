import { useEffect, useMemo, useRef, useState } from "react";
import { Calculator, Check, Clipboard, Copy, Plus, Printer, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { Breadcrumbs, ContextualServiceCta, PageShell } from "./LearningComponents";
import { breadcrumbSchema, usePageMetadata } from "./seo";
import { trackEvent } from "./analytics";
import {
  RATE_CONVENTIONS, calculateMortgage, evaluateDfl2StampTax, formatClp, formatPercent, formatUf,
  parseChileanNumber, solveAffordableProperty,
} from "./mortgageEngine";
import { BROKERAGE_MODES, BROKERAGE_TAX, GENERAL_IVA_RATE, calculateBrokeragePlan } from "./brokerageEngine";
import { BrokerageComparisonTool, BrokerageInputSection, BrokerageResultCard } from "./BrokerageModule";

const REVIEW_DATE = "2026-07-18";
let ufRequestPromise = null;
const requestAutomaticUf = (force = false) => {
  if (force || !ufRequestPromise) {
    ufRequestPromise = fetch("/api/indicadores/uf", { headers: { Accept: "application/json" } }).then(async (response) => {
      if (!response.ok) throw new Error("sin respuesta");
      return response.json();
    });
  }
  return ufRequestPromise;
};
const brokerageDefaults = Object.freeze({
  brokerParticipation: "unknown", brokerEngagedBy: "unknown", buyerCommissionStatus: "unknown", brokerRepresentation: "unclear",
  brokerageMode: BROKERAGE_MODES.PERCENTAGE, brokerageAmount: "", brokerageBase: "commercial-price", brokerageOtherBase: "",
  brokerageTaxTreatment: BROKERAGE_TAX.UNKNOWN, brokerageIvaRate: String(GENERAL_IVA_RATE * 100), brokerageMilestone: "unknown", brokerageStatus: "unknown",
  brokerageOutsideMortgage: true, brokerageIncludeInitial: true, brokerageAlreadyPaid: false, brokerageServices: [],
  brokerageLimitAmount: "", brokerageLimitUnit: "uf", brokerageLimitScope: "net", brokerageTierMethod: "marginal",
  brokerageTier1Limit: "2000", brokerageTier1Rate: "", brokerageTier2Limit: "4000", brokerageTier2Rate: "", brokerageTier3Rate: "",
  sellerCommissionEnabled: false, sellerCommissionAmount: "", sellerCommissionTax: BROKERAGE_TAX.UNKNOWN,
});
const initialForm = Object.freeze({
  propertyPrice: "4000", appraisal: "", financing: "80", availableDownPayment: "",
  availableDownPaymentUnit: "uf",
  annualRate: "4", rateConvention: RATE_CONVENTIONS.EFFECTIVE, termYears: "25", termExtraMonths: "0",
  householdIncome: "3000000", existingDebt: "0", burden: "27", insuredBorrowers: "2",
  lifeInsuranceRate: "0,0122", lifeInsuranceBase: "opening-loan-balance", propertyInsuranceRate: "0,0227016667", propertyInsuranceBase: "property-value", otherRecurring: "0",
  ...brokerageDefaults,
  legalExpense: "1,5", appraisalExpense: "2", deedDraftExpense: "1", notaryExpense: "2,7", conservatorRate: "0,08",
  dfl2Certified: false, dfl2FirstTransfer: false, dfl2WithinTwoYears: false, buyerNaturalPerson: true, priorDfl2Homes: "0",
  otherExpense: "0", otherExpenseMode: "fixed-uf",
});

const n = (value) => parseChileanNumber(value);
const percent = (value) => n(value) / 100;
const cloneForm = (form) => ({ ...form, brokerageServices: [...(form.brokerageServices || [])] });
const dateLabel = (date) => date ? new Intl.DateTimeFormat("es-CL", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)) : "sin fecha disponible";

function buildBrokerageConfig(form) {
  const percentageMode = ![BROKERAGE_MODES.FIXED_UF, BROKERAGE_MODES.FIXED_CLP].includes(form.brokerageMode);
  const proposal = {
    mode: form.brokerageMode,
    base: form.brokerageBase,
    otherBaseUf: n(form.brokerageOtherBase),
    rate: percentageMode && form.brokerageMode !== BROKERAGE_MODES.TIERED ? percent(form.brokerageAmount) : undefined,
    amount: percentageMode ? undefined : n(form.brokerageAmount),
    taxTreatment: form.brokerageTaxTreatment,
    ivaRate: percent(form.brokerageIvaRate),
    tierMethod: form.brokerageTierMethod,
    tiers: form.brokerageMode === BROKERAGE_MODES.TIERED ? [
      { upToUf: n(form.brokerageTier1Limit), rate: percent(form.brokerageTier1Rate) },
      { upToUf: n(form.brokerageTier2Limit), rate: percent(form.brokerageTier2Rate) },
      { upToUf: null, rate: percent(form.brokerageTier3Rate) },
    ] : undefined,
    cap: form.brokerageMode === BROKERAGE_MODES.PERCENTAGE_CAP ? { enabled: true, amount: n(form.brokerageLimitAmount), unit: form.brokerageLimitUnit, scope: form.brokerageLimitScope } : undefined,
    minimum: form.brokerageMode === BROKERAGE_MODES.MINIMUM_PERCENTAGE ? { enabled: true, amount: n(form.brokerageLimitAmount), unit: form.brokerageLimitUnit, scope: form.brokerageLimitScope } : undefined,
  };
  return {
    participation: form.brokerParticipation, engagedBy: form.brokerEngagedBy, buyerPaymentStatus: form.buyerCommissionStatus,
    representation: form.brokerRepresentation, paymentMilestone: form.brokerageMilestone, status: form.brokerageStatus,
    includeInInitialCash: form.brokerageIncludeInitial, payableOutsideMortgage: form.brokerageOutsideMortgage,
    alreadyPaid: form.brokerageAlreadyPaid, services: form.brokerageServices, buyerProposal: proposal,
    sellerProposal: form.sellerCommissionEnabled ? { enabled: true, mode: BROKERAGE_MODES.PERCENTAGE, base: "commercial-price", rate: percent(form.sellerCommissionAmount), taxTreatment: form.sellerCommissionTax, ivaRate: percent(form.brokerageIvaRate) } : undefined,
  };
}

function buildInputs(form, ufValueClp) {
  const termMonths = Math.round(n(form.termYears) * 12 + n(form.termExtraMonths));
  const propertyPriceUf = n(form.propertyPrice);
  const appraisal = n(form.appraisal);
  const availableDown = n(form.availableDownPayment);
  const dfl2StampTax = evaluateDfl2StampTax({
    certifiedProperty: form.dfl2Certified,
    firstTransfer: form.dfl2FirstTransfer,
    withinTwoYearsOfReception: form.dfl2WithinTwoYears,
    naturalPersonBuyer: form.buyerNaturalPerson,
    priorBenefitedHomes: n(form.priorDfl2Homes),
  });
  return {
    propertyPriceUf, appraisalValueUf: Number.isFinite(appraisal) ? appraisal : undefined,
    financingRatio: percent(form.financing), availableDownPaymentUf: Number.isFinite(availableDown) ? (form.availableDownPaymentUnit === "clp" ? availableDown / ufValueClp : availableDown) : undefined,
    ufValueClp, annualRate: percent(form.annualRate), rateConvention: form.rateConvention, termMonths,
    householdIncomeClp: n(form.householdIncome), existingMonthlyDebtClp: n(form.existingDebt), planningBurdenRatio: percent(form.burden),
    insuredBorrowers: Math.round(n(form.insuredBorrowers)),
    lifeInsurance: { enabled: percent(form.lifeInsuranceRate) > 0, base: form.lifeInsuranceBase, monthlyRate: percent(form.lifeInsuranceRate), multiplier: Math.max(0, Math.round(n(form.insuredBorrowers))) },
    propertyInsurance: { enabled: percent(form.propertyInsuranceRate) > 0, base: form.propertyInsuranceBase, monthlyRate: percent(form.propertyInsuranceRate), multiplier: 1 },
    recurringCosts: [{ enabled: n(form.otherRecurring) > 0, base: "fixed", fixedMonthlyUf: n(form.otherRecurring), multiplier: 1 }],
    brokerageConfig: buildBrokerageConfig(form),
    expenses: [
      ["appraisal", "Tasación de la propiedad", form.appraisalExpense],
      ["legal", "Estudio de títulos", form.legalExpense],
      ["deed-draft", "Borrador de escritura", form.deedDraftExpense],
      ["notary", "Notaría", form.notaryExpense],
      ["stamp-tax", `Impuesto al mutuo (${dfl2StampTax.eligible ? "beneficio DFL2" : "tasa general"})`, dfl2StampTax.rate * 100, "principal-percentage"],
      ["conservator", "Conservador de Bienes Raíces", form.conservatorRate, "property-percentage"],
      ["other", "Otros gastos confirmados", form.otherExpense, form.otherExpenseMode],
    ].map(([id, label, amount, mode = "fixed-uf"]) => ({ id, label, enabled: n(amount) > 0, mode, amount: mode.includes("percentage") ? percent(amount) : n(amount), taxRate: 0, includedInInitialCash: true, includedInEquivalentCost: true })),
  };
}

function validate(form, ufValueClp, mode) {
  const errors = {};
  if (mode === "mortgage" && !(n(form.propertyPrice) > 0)) errors.propertyPrice = "Ingresa un valor comercial mayor que cero.";
  if (form.appraisal.trim() && !(n(form.appraisal) > 0)) errors.appraisal = "La tasación debe ser mayor que cero o quedar vacía.";
  if (!(ufValueClp > 0)) errors.uf = "Ingresa o recupera un valor de UF válido.";
  if (!(percent(form.financing) > 0 && percent(form.financing) <= 1)) errors.financing = "Usa un porcentaje mayor que 0% y no superior a 100%.";
  const months = n(form.termYears) * 12 + n(form.termExtraMonths);
  if (!(Number.isInteger(months) && months >= 1 && months <= 600)) errors.termYears = "El plazo total debe ser un número entero entre 1 y 600 meses.";
  if (!(percent(form.annualRate) >= 0)) errors.annualRate = "La tasa no puede ser negativa.";
  if (!(n(form.householdIncome) >= 0) || (mode === "affordability" && !(n(form.householdIncome) > 0))) errors.householdIncome = "Ingresa un ingreso válido mayor que cero para este modo.";
  if (!(n(form.existingDebt) >= 0)) errors.existingDebt = "Las obligaciones no pueden ser negativas.";
  if (!(percent(form.burden) > 0 && percent(form.burden) <= 1)) errors.burden = "El umbral debe ser mayor que 0% y no superior a 100%.";
  if (!(Number.isInteger(n(form.insuredBorrowers)) && n(form.insuredBorrowers) >= 0 && n(form.insuredBorrowers) <= 10)) errors.insuredBorrowers = "Usa un número entero entre 0 y 10.";
  ["lifeInsuranceRate", "propertyInsuranceRate", "otherRecurring", "legalExpense", "appraisalExpense", "deedDraftExpense", "notaryExpense", "conservatorRate", "otherExpense"].forEach((key) => {
    if (!(n(form[key]) >= 0)) errors[key] = "Usa un valor no negativo.";
  });
  const buyerCommissionRequired = form.brokerParticipation !== "no" && form.buyerCommissionStatus === "yes";
  if (buyerCommissionRequired && form.brokerageMode !== BROKERAGE_MODES.TIERED && !(n(form.brokerageAmount) >= 0)) errors.brokerageAmount = "Ingresa una comisión finita y no negativa.";
  if (buyerCommissionRequired && !form.brokerageMode.startsWith("fixed") && n(form.brokerageAmount) > 100) errors.brokerageAmount = "Para esta interfaz, el porcentaje no puede superar 100%.";
  if (!(percent(form.brokerageIvaRate) >= 0 && percent(form.brokerageIvaRate) <= 1)) errors.brokerageIvaRate = "Usa una tasa entre 0% y 100%.";
  if (buyerCommissionRequired && form.brokerageBase === "other" && !(n(form.brokerageOtherBase) > 0)) errors.brokerageOtherBase = "Ingresa una base mayor que cero.";
  if (buyerCommissionRequired && [BROKERAGE_MODES.PERCENTAGE_CAP, BROKERAGE_MODES.MINIMUM_PERCENTAGE].includes(form.brokerageMode) && !(n(form.brokerageLimitAmount) >= 0)) errors.brokerageLimitAmount = "Ingresa un límite finito y no negativo.";
  if (buyerCommissionRequired && form.brokerageMode === BROKERAGE_MODES.TIERED) {
    const limits = [n(form.brokerageTier1Limit), n(form.brokerageTier2Limit)];
    if (!(limits[0] > 0)) errors.brokerageTier1Limit = "El primer límite debe ser mayor que cero.";
    if (!(limits[1] > limits[0])) errors.brokerageTier2Limit = "El segundo límite debe ser mayor que el primero.";
    ["brokerageTier1Rate", "brokerageTier2Rate", "brokerageTier3Rate"].forEach((key) => { if (!(percent(form[key]) >= 0 && percent(form[key]) <= 1)) errors[key] = "Usa una tasa entre 0% y 100%."; });
  }
  if (form.sellerCommissionEnabled && !(n(form.sellerCommissionAmount) >= 0 && n(form.sellerCommissionAmount) <= 100)) errors.sellerCommissionAmount = "Usa un porcentaje entre 0% y 100%.";
  if (!(Number.isInteger(n(form.priorDfl2Homes)) && n(form.priorDfl2Homes) >= 0)) errors.priorDfl2Homes = "Ingresa un número entero igual o mayor que cero.";
  return errors;
}

function Field({ id, label, unit, value, onChange, error, help, type = "text", children }) {
  return <div className={`mortgage-field${error ? " mortgage-field--error" : ""}`}>
    <label htmlFor={id}>{label} {unit && <span>({unit})</span>}</label>
    {children || <input id={id} type={type} inputMode={type === "text" ? "decimal" : undefined} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`} data-private="true" autoComplete="off" />}
    {help && <small id={`${id}-help`}>{help}</small>}
    {error && <small className="field-error" id={`${id}-error`}>{error}</small>}
  </div>;
}

function UfControl({ uf, manualValue, setManualValue, enableManual, restoreAuto, retry }) {
  const displayedValue = uf.mode === "manual" ? n(manualValue) : uf.valueClp;
  const usable = displayedValue > 0;
  return <section className="uf-panel" aria-labelledby="uf-title" aria-live="polite">
    <div><p className="eyebrow">Referencia de conversión</p><h2 id="uf-title">{uf.mode === "manual" ? "UF ingresada manualmente" : "UF utilizada"}: {usable ? formatClp(displayedValue) : "no disponible"}</h2>
      {uf.mode === "loading" && <p>Consultando el valor automáticamente…</p>}
      {uf.mode === "automatic" && <p>Valor vigente para el {dateLabel(uf.effectiveDate)}. Actualizado automáticamente.</p>}
      {uf.mode === "cached" && <p>No fue posible actualizar la UF. Se está usando el último valor confirmado del {dateLabel(uf.effectiveDate)}.</p>}
      {uf.mode === "manual" && <p>Este valor se utilizará para convertir los resultados a pesos; no se describe como vigente.</p>}
      {uf.mode === "unavailable" && <p>Ingresa el valor de la UF que deseas utilizar para realizar la simulación.</p>}
    </div>
    {uf.mode === "manual" || uf.mode === "unavailable" ? <div className="uf-actions"><label htmlFor="manual-uf">Valor de la UF en pesos</label><input id="manual-uf" inputMode="decimal" value={manualValue} onChange={(event) => setManualValue(event.target.value)} data-private="true" />{uf.automaticValue > 0 && <button type="button" className="button button--secondary" onClick={restoreAuto}>Usar valor automático</button>}{uf.mode === "unavailable" && <button type="button" className="button button--secondary" onClick={retry}><RefreshCw size={16} /> Reintentar actualización</button>}</div> : <div className="uf-actions"><button type="button" className="button button--secondary" onClick={enableManual}>Cambiar valor</button>{uf.stale && <button type="button" className="button button--secondary" onClick={retry}><RefreshCw size={16} /> Reintentar actualización</button>}</div>}
  </section>;
}

const Metric = ({ label, value, note }) => <div className="mortgage-metric"><dt>{label}</dt><dd>{value}</dd>{note && <small>{note}</small>}</div>;

function BalanceChart({ result }) {
  const points = [0, ...result.annualSchedule.map((year) => year.year * 12)].map((period, index, array) => {
    const balance = period === 0 ? result.principalUf : result.schedule[Math.min(period, result.schedule.length) - 1].closingBalanceUf;
    return `${(index / Math.max(1, array.length - 1)) * 100},${100 - (balance / Math.max(result.principalUf, 1)) * 90}`;
  }).join(" ");
  return <figure className="mortgage-chart" aria-labelledby="balance-chart-title balance-chart-summary">
    <figcaption><h3 id="balance-chart-title">Evolución del saldo</h3><p id="balance-chart-summary">El saldo parte en {formatUf(result.principalUf)} y llega a cero en {result.termMonths} pagos. La mitad del capital se alcanza aproximadamente en el pago {result.halfPrincipalPeriod || "—"}.</p></figcaption>
    <svg viewBox="0 0 100 110" role="img" aria-label={`Curva del saldo desde ${formatUf(result.principalUf)} hasta cero`} preserveAspectRatio="none"><line x1="0" y1="100" x2="100" y2="100" /><line x1="0" y1="10" x2="0" y2="100" /><polyline points={points} /></svg>
    <div className="chart-axis"><span>Inicio</span><span>Meses</span><span>Fin</span></div>
  </figure>;
}

function CompositionChart({ result }) {
  const [activePeriod, setActivePeriod] = useState(1);
  const [visibleSeries, setVisibleSeries] = useState({ principal: true, interest: true, costs: false });
  const active = result.schedule[Math.min(activePeriod, result.schedule.length) - 1];
  const plot = { x: 58, y: 18, width: 914, height: 252 };
  const barWidth = Math.max(1, plot.width / result.schedule.length + 0.18);
  const paymentTicks = [1, ...Array.from({ length: Math.floor(result.schedule.length / 12) }, (_, index) => (index + 1) * 12)];
  if (paymentTicks.at(-1) !== result.schedule.length) paymentTicks.push(result.schedule.length);
  const heightFor = (value, row) => value / Math.max(row.totalPaymentUf, 1e-12) * plot.height;
  const selectFromPointer = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const viewX = (event.clientX - bounds.left) / bounds.width * 1000;
    const fraction = Math.min(0.999999, Math.max(0, (viewX - plot.x) / plot.width));
    setActivePeriod(Math.floor(fraction * result.schedule.length) + 1);
  };
  const activeX = plot.x + (active.period - 0.5) / result.schedule.length * plot.width;
  const insuranceUf = active.lifeInsuranceUf + active.propertyInsuranceUf;
  const toggleSeries = (key) => setVisibleSeries((current) => ({ ...current, [key]: !current[key] }));
  return <figure className="mortgage-chart mortgage-chart--composition" aria-labelledby="composition-title composition-summary"><div className="chart-heading-layout"><div className="chart-heading-copy"><figcaption><h3 id="composition-title">Desarrollo mensual de la cuota</h3><p id="composition-summary">Cada columna representa una cuota y muestra qué porcentaje corresponde a amortización, interés y seguros.</p></figcaption>
    <p className="chart-unit-key"><strong>Eje vertical izquierdo:</strong> porcentaje de la cuota. El panel derecho muestra los montos correspondientes en UF.</p>
    <fieldset className="chart-series-controls"><legend>Componentes visibles</legend><label><input type="checkbox" checked={visibleSeries.principal} onChange={() => toggleSeries("principal")} /><i data-line="principal" /> Amortización</label><label><input type="checkbox" checked={visibleSeries.interest} onChange={() => toggleSeries("interest")} /><i data-line="interest" /> Interés</label><label><input type="checkbox" checked={visibleSeries.costs} onChange={() => toggleSeries("costs")} /><i data-line="costs" /> Seguros</label></fieldset></div>
    <dl className="selected-payment-details selected-payment-details--side" aria-live="polite"><div><dt>Cuota {active.period} · total completo</dt><dd>{formatUf(active.totalPaymentUf)}</dd></div>{visibleSeries.principal && <div><dt>Amortización</dt><dd>{formatUf(active.principalUf)} <small>{formatPercent(active.principalUf / active.totalPaymentUf, 1)}</small></dd></div>}{visibleSeries.interest && <div><dt>Interés</dt><dd>{formatUf(active.interestUf)} <small>{formatPercent(active.interestUf / active.totalPaymentUf, 1)}</small></dd></div>}{visibleSeries.costs && <div><dt>Seguros</dt><dd>{formatUf(insuranceUf)} <small>{formatPercent(insuranceUf / active.totalPaymentUf, 1)}</small></dd></div>}</dl></div>
    <div className="monthly-chart-canvas">
      <svg viewBox="0 0 1000 340" role="img" aria-label={`Columnas apiladas con la composición porcentual de ${result.schedule.length} cuotas. El eje horizontal marca períodos de doce meses. Cuota seleccionada: ${active.period}.`} preserveAspectRatio="none" onPointerMove={selectFromPointer} onPointerDown={selectFromPointer}>
        {[0, .25, .5, .75, 1].map((tick) => { const y = plot.y + plot.height * (1 - tick); return <g key={tick}><line className="chart-gridline" x1={plot.x} y1={y} x2={plot.x + plot.width} y2={y} /><text className="chart-tick" x={plot.x - 8} y={y + 4} textAnchor="end">{tick * 100}%</text></g>; })}
        {result.schedule.map((row, index) => {
          const principalHeight = visibleSeries.principal ? heightFor(row.principalUf, row) : 0;
          const interestHeight = visibleSeries.interest ? heightFor(row.interestUf, row) : 0;
          const costs = row.lifeInsuranceUf + row.propertyInsuranceUf;
          const costHeight = visibleSeries.costs ? heightFor(costs, row) : 0;
          const x = plot.x + index / result.schedule.length * plot.width;
          return <g key={row.period} className={row.period === active.period ? "monthly-bar monthly-bar--active" : "monthly-bar"}>
            {visibleSeries.principal && <rect data-part="0" x={x} y={plot.y + plot.height - principalHeight} width={barWidth} height={principalHeight} />}
            {visibleSeries.interest && <rect data-part="1" x={x} y={plot.y + plot.height - principalHeight - interestHeight} width={barWidth} height={interestHeight} />}
            {visibleSeries.costs && <rect data-part="2" x={x} y={plot.y + plot.height - principalHeight - interestHeight - costHeight} width={barWidth} height={costHeight} />}
          </g>;
        })}
        <line className="active-payment-line" x1={activeX} y1={plot.y} x2={activeX} y2={plot.y + plot.height} />
        <text className="chart-axis-title" x="14" y="145" transform="rotate(-90 14 145)" textAnchor="middle">Porcentaje de la cuota</text>
        {paymentTicks.map((period) => { const x = plot.x + (period - 0.5) / result.schedule.length * plot.width; return <g key={period}><line className="payment-axis-mark" x1={x} y1={plot.y + plot.height} x2={x} y2={plot.y + plot.height + 6} /><text className="chart-tick chart-tick--payment" x={x} y="292" textAnchor="middle">{period}</text></g>; })}
        <text className="chart-axis-title" x="515" y="326" textAnchor="middle">Número de cuota</text>
      </svg>
    </div>
  </figure>;
}

function AnnualTable({ result, showMonthly, setShowMonthly }) {
  const [year, setYear] = useState(1);
  const [jump, setJump] = useState("");
  const selectedRows = result.schedule.slice((year - 1) * 12, Math.min(year * 12, result.schedule.length));
  const jumpTo = () => { const payment = Math.min(result.schedule.length, Math.max(1, Math.round(n(jump)))); setYear(Math.ceil(payment / 12)); setShowMonthly(true); };
  return <section className="schedule-section" aria-labelledby="schedule-title"><div className="section-title"><p className="eyebrow">Amortización</p><h2 id="schedule-title">Cómo cambia la deuda</h2><p>La vista anual resume todos los pagos. El detalle mensual carga un año a la vez para mantener la lectura ágil.</p></div>
    <div className="schedule-controls" role="group" aria-label="Vista de amortización"><button type="button" className={`button ${!showMonthly ? "button--primary" : "button--secondary"}`} onClick={() => setShowMonthly(false)}>Resumen anual</button><button type="button" className={`button ${showMonthly ? "button--primary" : "button--secondary"}`} onClick={() => setShowMonthly(true)}>Detalle mensual</button><label htmlFor="jump-payment">Ir al pago</label><input id="jump-payment" inputMode="numeric" value={jump} onChange={(event) => setJump(event.target.value)} /><button className="button button--secondary" type="button" onClick={jumpTo}>Ir</button></div>
    {!showMonthly ? <div className="table-scroll" tabIndex="0"><table><caption>Resumen anual en UF</caption><thead><tr><th>Año</th><th>Saldo inicial</th><th>Capital</th><th>Interés</th><th>Seguros</th><th>Total</th><th>Saldo final</th></tr></thead><tbody>{result.annualSchedule.map((row) => <tr key={row.year}><th>{row.year}</th><td>{formatUf(row.openingBalanceUf)}</td><td>{formatUf(row.principalUf)}</td><td>{formatUf(row.interestUf)}</td><td>{formatUf(row.insuranceUf)}</td><td>{formatUf(row.totalUf)}</td><td>{formatUf(row.closingBalanceUf)}</td></tr>)}</tbody><tfoot><tr><th>Total</th><td>—</td><td>{formatUf(result.principalUf)}</td><td>{formatUf(result.totalInterestUf)}</td><td>{formatUf(result.totalInsuranceUf)}</td><td>{formatUf(result.totalMonthlyPaymentsUf)}</td><td>{formatUf(0)}</td></tr></tfoot></table></div>
      : <><label className="year-select" htmlFor="schedule-year">Año mostrado <select id="schedule-year" value={year} onChange={(event) => setYear(Number(event.target.value))}>{result.annualSchedule.map((row) => <option key={row.year} value={row.year}>Año {row.year}</option>)}</select></label><div className="table-scroll" tabIndex="0"><table><caption>Detalle mensual del año {year}, valores en UF</caption><thead><tr><th>Pago</th><th>Saldo inicial</th><th>Interés</th><th>Capital</th><th>Pago base</th><th>Seguros</th><th>Otros</th><th>Total</th><th>Saldo final</th></tr></thead><tbody>{selectedRows.map((row) => <tr key={row.period}><th>{row.period}</th><td>{formatUf(row.openingBalanceUf)}</td><td>{formatUf(row.interestUf)}</td><td>{formatUf(row.principalUf)}</td><td>{formatUf(row.basePaymentUf)}</td><td>{formatUf(row.lifeInsuranceUf + row.propertyInsuranceUf)}</td><td>{formatUf(row.otherRecurringUf)}</td><td>{formatUf(row.totalPaymentUf)}</td><td>{formatUf(row.closingBalanceUf)}</td></tr>)}</tbody></table></div></>}
  </section>;
}

function ScenarioComparison({ scenarios, baselineId, setBaselineId, rename, remove }) {
  if (!scenarios.length) return null;
  const baseline = scenarios.find((scenario) => scenario.id === baselineId) || scenarios[0];
  return <section className="comparison-section" aria-labelledby="comparison-title"><div className="section-title"><p className="eyebrow">Observación</p><h2 id="comparison-title">Comparar escenarios guardados en esta sesión</h2><p>No se almacenan en el navegador ni se envían a un servidor. La diferencia se calcula contra el escenario base.</p></div>
    <div className="scenario-list">{scenarios.map((scenario) => <article key={scenario.id} className={scenario.id === baselineId ? "scenario-card scenario-card--baseline" : "scenario-card"}><label htmlFor={`scenario-${scenario.id}`}>Nombre local</label><input id={`scenario-${scenario.id}`} value={scenario.name} maxLength="40" onChange={(event) => rename(scenario.id, event.target.value)} data-private="true" /><label><input type="radio" name="baseline" checked={scenario.id === baselineId} onChange={() => setBaselineId(scenario.id)} /> Escenario base</label><button type="button" className="icon-button" onClick={() => remove(scenario.id)} aria-label={`Eliminar ${scenario.name}`}><Trash2 size={17} /></button></article>)}</div>
    <div className="table-scroll" tabIndex="0"><table><caption>Comparación financiera de escenarios</caption><thead><tr><th>Indicador</th>{scenarios.map((scenario) => <th key={scenario.id}>{scenario.name}</th>)}</tr></thead><tbody>{[
      ["Valor propiedad", (r) => formatUf(r.propertyPriceUf)], ["Financiamiento", (r) => formatPercent(r.financingRatio)], ["Pie mínimo", (r) => formatUf(r.requiredDownPaymentUf)], ["Capital", (r) => formatUf(r.principalUf)], ["Tasa anual", (r) => formatPercent(r.annualRate)], ["Plazo", (r) => `${r.termMonths} meses`], ["Pago base", (r) => formatUf(r.basePaymentUf)], ["Primer pago total", (r) => formatUf(r.firstTotalPaymentUf)], ["Ingreso orientativo", (r) => formatClp(r.requiredIncomeClp)], ["Interés total", (r) => formatUf(r.totalInterestUf)], ["Capital a la mitad", (r) => `Pago ${r.halfPrincipalPeriod}`], ["Tipo de corretaje", (r) => r.brokerageConfig?.buyerProposal?.mode || "Sin comisión definida"], ["Tratamiento IVA", (r) => r.brokerageConfig?.buyerProposal?.taxTreatment || "No informado"], ["Corretaje comprador", (r) => r.brokeragePlan?.buyer?.known ? formatUf(r.brokeragePlan.buyer.finalUf) : r.brokeragePlan?.buyer?.range ? "Rango pendiente" : formatUf(0)], ["% final corretaje", (r) => r.brokeragePlan?.buyer?.known ? formatPercent(r.brokeragePlan.buyer.effectiveFinalRate, 4) : "Pendiente"], ["Servicios documentados", (r) => `${r.brokeragePlan?.services?.length || 0}`], ["Hito de corretaje", (r) => r.brokeragePlan?.paymentMilestone || "No acordado"], ["Efectivo inicial", (r) => formatUf(r.requiredInitialCashUf)], ["Desembolso total", (r) => formatUf(r.estimatedTotalOutflowUf)],
    ].map(([label, render]) => <tr key={label}><th>{label}</th>{scenarios.map((scenario) => { const value = render(scenario.result); const differs = scenario.id !== baseline.id && value !== render(baseline.result); return <td key={scenario.id} className={differs ? "comparison-difference" : undefined}>{value}{differs && <span className="sr-only">, diferente del escenario base</span>}</td>; })}</tr>)}</tbody></table></div>
  </section>;
}

export default function MortgageCalculatorPage() {
  const [mode, setMode] = useState("mortgage");
  const [form, setForm] = useState(cloneForm(initialForm));
  const [uf, setUf] = useState({ mode: "loading", valueClp: null, effectiveDate: null, stale: false, sourceCategory: "unavailable", automaticValue: null });
  const [manualUf, setManualUf] = useState("");
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState("");
  const [showMonthly, setShowMonthly] = useState(false);
  const [scenarios, setScenarios] = useState([]);
  const [baselineId, setBaselineId] = useState(null);
  const resultRef = useRef(null);
  const breadcrumbs = [{ label: "Inicio", href: "/" }, { label: "Herramientas", href: "/herramientas" }, { label: "Calculadora hipotecaria", href: "/herramientas/calculadora-hipotecaria" }];
  const schema = useMemo(() => ({ "@context": "https://schema.org", "@graph": [breadcrumbSchema(breadcrumbs), { "@type": "WebApplication", name: "Calculadora hipotecaria: dividendo, pie y costo total", description: "Herramienta educativa para explorar un crédito hipotecario en UF, su pie, dividendo, seguros, gastos y amortización.", url: "https://masanes.cl/herramientas/calculadora-hipotecaria", applicationCategory: "FinanceApplication", operatingSystem: "Navegador web", isAccessibleForFree: true, dateModified: REVIEW_DATE }] }), []);
  usePageMetadata({ title: "Calculadora hipotecaria: dividendo, pie y costo total", description: "Estima el dividendo, pie, seguros, gastos, carga del hogar y amortización de un crédito hipotecario en UF para Chile.", path: "/herramientas/calculadora-hipotecaria", schema });

  const loadUf = async (force = false) => {
    setUf((current) => ({ ...current, mode: "loading" }));
    try {
      const data = await requestAutomaticUf(force);
      if (!(data.valueClp > 0) || !data.effectiveDate) throw new Error("dato inválido");
      setUf({ mode: data.status === "cached" ? "cached" : "automatic", valueClp: data.valueClp, effectiveDate: data.effectiveDate, stale: Boolean(data.stale), sourceCategory: data.sourceCategory, automaticValue: data.valueClp, automaticDate: data.effectiveDate });
    } catch { setUf((current) => current.automaticValue > 0 ? { ...current, mode: "cached", valueClp: current.automaticValue, stale: true } : { ...current, mode: "unavailable", valueClp: null, stale: true }); }
  };
  useEffect(() => { trackEvent("mortgage_tool_viewed", { tool: "mortgage", category: "mortgage" }); loadUf(); }, []);

  const update = (key, value) => { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: undefined })); };
  const effectiveUf = uf.mode === "manual" || uf.mode === "unavailable" ? n(manualUf) : uf.valueClp;
  const brokeragePreview = useMemo(() => {
    const propertyPriceUf = result?.propertyPriceUf || n(form.propertyPrice);
    if (!(propertyPriceUf > 0) || !(effectiveUf > 0)) return null;
    try {
      const config = buildBrokerageConfig(form);
      const proposalContext = { propertyPriceUf, agreedPriceUf: propertyPriceUf, ufValueClp: effectiveUf };
      return calculateBrokeragePlan({ ...config, buyerProposal: { ...proposalContext, ...config.buyerProposal }, sellerProposal: config.sellerProposal ? { ...proposalContext, ...config.sellerProposal } : undefined });
    } catch { return null; }
  }, [form, effectiveUf, result?.propertyPriceUf]);
  const enableManual = () => { setManualUf(uf.valueClp ? String(uf.valueClp).replace(".", ",") : ""); setUf((current) => ({ ...current, mode: "manual" })); trackEvent("mortgage_uf_manual_enabled", { category: "manual" }); };
  const restoreAuto = () => { setUf((current) => ({ ...current, mode: current.stale ? "cached" : "automatic", valueClp: current.automaticValue, effectiveDate: current.automaticDate })); trackEvent("mortgage_uf_auto_restored", { category: "automatic" }); };

  const calculate = () => {
    const nextErrors = validate(form, effectiveUf, mode);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { setNotice("Revisa los campos indicados antes de calcular."); requestAnimationFrame(() => document.getElementById("mortgage-errors")?.focus()); return; }
    try {
      const inputs = buildInputs(form, effectiveUf);
      let next;
      if (mode === "affordability") {
        const solved = solveAffordableProperty(inputs);
        if (solved.status !== "solved") { setNotice("Con estos datos no fue posible encontrar un valor de propiedad dentro del rango modelado."); return; }
        next = solved.result;
      } else next = calculateMortgage(inputs);
      setResult(next); setNotice(mode === "affordability" ? "Se estimó un valor de propiedad orientativo para este presupuesto." : "Escenario calculado. Revisa resultados, supuestos y amortización.");
      trackEvent(mode === "affordability" ? "mortgage_affordability_completed" : "mortgage_calculation_completed", { category: mode });
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch { setNotice("No fue posible calcular. Revisa que todos los valores sean finitos y estén dentro de los límites indicados."); }
  };
  const addScenario = () => {
    if (!result || scenarios.length >= 4) return;
    const id = `${Date.now()}-${scenarios.length}`;
    setScenarios((current) => [...current, { id, name: `Escenario ${current.length + 1}`, result, form: cloneForm(form), mode }]);
    if (!baselineId) setBaselineId(id);
    setNotice("Escenario añadido a la comparación de esta sesión."); trackEvent("mortgage_scenario_added", { category: mode });
  };
  const duplicateScenario = () => { if (!result || scenarios.length >= 4) return; addScenario(); };
  const rename = (id, name) => setScenarios((current) => current.map((item) => item.id === id ? { ...item, name } : item));
  const remove = (id) => { setScenarios((current) => current.filter((item) => item.id !== id)); if (baselineId === id) setBaselineId(null); };
  const resetBrokerage = () => { setForm((current) => ({ ...current, ...brokerageDefaults, brokerageServices: [] })); setResult(null); setErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith("broker") && !key.startsWith("sellerCommission")))); setNotice("El módulo de corretaje se reinició sin cambiar los demás datos hipotecarios."); trackEvent("brokerage_module_reset", { section: "brokerage" }); };
  const reset = () => { setForm(cloneForm(initialForm)); setResult(null); setErrors({}); setScenarios([]); setBaselineId(null); setNotice("La calculadora y los escenarios locales se reiniciaron."); trackEvent("mortgage_tool_reset", { category: mode }); };
  const brokerageSummary = result?.brokeragePlan ? `\n\nCorretaje del comprador\nParticipación: ${result.brokeragePlan.participation}\nForma de cálculo: ${result.brokerageConfig?.buyerProposal?.mode || "no definida"}\nBase: ${result.brokerageConfig?.buyerProposal?.base || "no definida"}\nTratamiento IVA: ${result.brokerageConfig?.buyerProposal?.taxTreatment || "no confirmado"}\nComisión neta: ${result.brokeragePlan.buyer.known ? formatUf(result.brokeragePlan.buyer.netUf) : "pendiente"}\nIVA: ${result.brokeragePlan.buyer.known ? formatUf(result.brokeragePlan.buyer.taxUf) : "pendiente"}\nCosto final: ${result.brokeragePlan.buyer.known ? `${formatUf(result.brokeragePlan.buyer.finalUf)} (${formatClp(result.brokeragePlan.buyer.finalClp)})` : `${formatUf(result.brokeragePlan.buyer.range.withoutTaxUf)} a ${formatUf(result.brokeragePlan.buyer.range.withTaxUf)}`}\nPorcentaje final efectivo: ${result.brokeragePlan.buyer.known ? formatPercent(result.brokeragePlan.buyer.effectiveFinalRate, 4) : "pendiente"}\nHito de pago: ${result.brokeragePlan.paymentMilestone}\nIncluido en efectivo inicial: ${result.brokeragePlan.includedInInitialCash ? "sí" : "no"}\nEstado: ${result.brokeragePlan.status}\nServicios documentados: ${result.brokeragePlan.services.length}\nEl corretaje corresponde a un supuesto ingresado por el usuario. Confirma por escrito el monto final, los impuestos, los servicios y las condiciones de pago.` : "";
  const summary = result ? `Escenario hipotecario educativo\nValor propiedad: ${formatUf(result.propertyPriceUf)}\nCapital: ${formatUf(result.principalUf)}\nPie mínimo: ${formatUf(result.requiredDownPaymentUf)}\nGastos operacionales: ${formatUf(result.operationalExpensesUf)}\nOtros gastos iniciales: ${formatUf(result.otherInitialExpensesUf)}\nCorretaje incorporado: ${formatUf(result.buyerBrokerageUf)}\nPago base: ${formatUf(result.basePaymentUf)}\nPrimer pago total estimado: ${formatUf(result.firstTotalPaymentUf)} (${formatClp(result.firstTotalPaymentClp)})\nEfectivo inicial estimado: ${formatUf(result.requiredInitialCashUf)}\nPlazo: ${result.termMonths} meses\nTasa anual: ${formatPercent(result.annualRate)}\nUF usada: ${formatClp(effectiveUf)}${brokerageSummary}\n\nEstimación educativa; confirma condiciones y costos.` : "";
  const copySummary = async () => { try { await navigator.clipboard.writeText(summary); setNotice("Resumen copiado."); trackEvent("mortgage_summary_copied", { category: mode }); } catch { setNotice("No fue posible copiar automáticamente; selecciona el resumen desde los resultados."); } };

  return <PageShell><main id="main-content" className="content-page mortgage-page"><Breadcrumbs items={breadcrumbs} />
    <header className="page-hero mortgage-hero"><div><p className="eyebrow">Planificación financiera</p><h1>Calculadora hipotecaria: dividendo, pie y costo total</h1><p className="page-hero__lead">Explora el financiamiento, el dividendo y los costos asociados a una operación hipotecaria en UF.</p></div><aside><Calculator size={30} /><strong>PRECIO</strong><span>Propiedad · Recursos · Endeudamiento · Crédito · Inicio · Observación</span></aside></header>
    <p className="disclosure"><strong>Estimación educativa.</strong> Esta herramienta entrega una estimación educativa basada en los datos y supuestos que ingresas. No constituye una cotización, aprobación de crédito ni asesoría financiera, tributaria o legal. Confirma tasas, seguros, gastos, impuestos y condiciones con las instituciones y profesionales correspondientes.</p>
    <p className="framework-note"><strong>PRECIO</strong> es un modelo práctico creado para organizar esta herramienta. No es un estándar financiero, una certificación ni una garantía de aprobación o resultados.</p>
    <UfControl uf={uf} manualValue={manualUf} setManualValue={(value) => { setManualUf(value); if (uf.mode === "unavailable") setUf((current) => ({ ...current, mode: "manual" })); }} enableManual={enableManual} restoreAuto={restoreAuto} retry={() => loadUf(true)} />

    <section className="mortgage-workspace" aria-labelledby="calculator-title"><div className="uf-inline-summary" aria-live="polite"><div><span>UF de la simulación</span><strong>{effectiveUf > 0 ? formatClp(effectiveUf) : "Pendiente"}</strong></div><p>{uf.mode === "manual" ? "Valor manual" : uf.mode === "cached" ? "Último valor confirmado" : uf.mode === "automatic" ? "Valor automático" : "Ingresa una UF para continuar"}{uf.mode !== "manual" && uf.effectiveDate ? ` · ${dateLabel(uf.effectiveDate)}` : ""}</p><a href="#uf-title">{uf.mode === "manual" ? "Revisar valor" : "Cambiar valor"}</a></div><div className="mode-switch" role="tablist" aria-label="Modo de cálculo"><button role="tab" aria-selected={mode === "mortgage"} className={mode === "mortgage" ? "active" : ""} onClick={() => { setMode("mortgage"); setResult(null); }}>Estimar un crédito</button><button role="tab" aria-selected={mode === "affordability"} className={mode === "affordability" ? "active" : ""} onClick={() => { setMode("affordability"); setResult(null); }}>Estimar valor compatible</button></div>
      <h2 id="calculator-title">{mode === "mortgage" ? "¿Cuánto sería el dividendo y cuánto dinero inicial necesitaría?" : "¿Qué valor de propiedad podría explorar con este ingreso y presupuesto mensual?"}</h2>
      {Object.keys(errors).length > 0 && <div id="mortgage-errors" className="error-summary" role="alert" tabIndex="-1"><strong>Hay datos por corregir:</strong><ul>{Object.entries(errors).map(([key, message]) => <li key={key}><a href={key === "uf" ? "#manual-uf" : `#${key}`}>{message}</a></li>)}</ul></div>}
      <form onSubmit={(event) => { event.preventDefault(); calculate(); }} noValidate>
        <fieldset><legend>Propiedad</legend><p>El menor valor entre precio y tasación se usa como base financiable. La institución puede aplicar criterios propios para determinar el valor financiable y el porcentaje máximo.</p><div className="mortgage-grid">
          {mode === "mortgage" && <Field id="propertyPrice" label="Valor comercial" unit="UF" value={form.propertyPrice} onChange={(value) => update("propertyPrice", value)} error={errors.propertyPrice} help="Ejemplo: 4.000" />}
          <Field id="appraisal" label="Tasación disponible" unit="UF, opcional" value={form.appraisal} onChange={(value) => update("appraisal", value)} error={errors.appraisal} help="Déjalo vacío si aún no existe." />
          <Field id="financing" label="Financiamiento" unit="%" value={form.financing} onChange={(value) => update("financing", value)} error={errors.financing} help="Supuesto de simulación, no política universal." />
          <Field id="availableDownPayment" label="Pie disponible" unit={form.availableDownPaymentUnit === "uf" ? "UF, opcional" : "CLP, opcional"} value={form.availableDownPayment} onChange={(value) => update("availableDownPayment", value)} error={errors.availableDownPayment} help="Permite compararlo con el pie mínimo calculado." />
          <Field id="availableDownPaymentUnit" label="Unidad del pie disponible" value={form.availableDownPaymentUnit}><select id="availableDownPaymentUnit" value={form.availableDownPaymentUnit} onChange={(event) => update("availableDownPaymentUnit", event.target.value)}><option value="uf">UF</option><option value="clp">Pesos chilenos</option></select></Field>
        </div></fieldset>
        <fieldset><legend>Recursos y endeudamiento</legend><div className="mortgage-grid"><Field id="householdIncome" label="Ingreso mensual del hogar" unit="CLP" value={form.householdIncome} onChange={(value) => update("householdIncome", value)} error={errors.householdIncome} /><Field id="existingDebt" label="Obligaciones mensuales existentes" unit="CLP" value={form.existingDebt} onChange={(value) => update("existingDebt", value)} error={errors.existingDebt} /><Field id="burden" label="Umbral de carga para planificar" unit="%" value={form.burden} onChange={(value) => update("burden", value)} error={errors.burden} help="Es una decisión de planificación; no predice criterios de aprobación." /></div></fieldset>
        <fieldset><legend>Crédito</legend><div className="mortgage-grid"><Field id="annualRate" label="Tasa anual" unit="%" value={form.annualRate} onChange={(value) => update("annualRate", value)} error={errors.annualRate} /><Field id="rateConvention" label="Convención de tasa" value={form.rateConvention} error={errors.rateConvention}><select id="rateConvention" value={form.rateConvention} onChange={(event) => update("rateConvention", event.target.value)}><option value={RATE_CONVENTIONS.EFFECTIVE}>Anual efectiva, ajuste 365/360</option><option value={RATE_CONVENTIONS.NOMINAL_MONTHLY}>Nominal anual, capitalización mensual</option></select></Field><Field id="termYears" label="Plazo" unit="años" value={form.termYears} onChange={(value) => update("termYears", value)} error={errors.termYears} /><Field id="termExtraMonths" label="Meses adicionales" unit="0 a 11" value={form.termExtraMonths} onChange={(value) => update("termExtraMonths", value)} error={errors.termYears} /></div><p className="input-note">La tasa anual efectiva se ajusta primero a base 365/360 y luego se convierte a su equivalente mensual con raíz doce. La nominal mensual se divide por doce. La frecuencia modelada es mensual y no incluye meses de gracia.</p></fieldset>
        <fieldset><legend>Seguros y otros pagos mensuales</legend><p>Son supuestos editables, no primas universales. Elige la base usada y confirma con la institución la base contractual, cobertura, tasa y número de asegurados.</p><div className="mortgage-grid"><Field id="insuredBorrowers" label="Personas aseguradas" unit="número" value={form.insuredBorrowers} onChange={(value) => update("insuredBorrowers", value)} error={errors.insuredBorrowers} /><Field id="lifeInsuranceRate" label="Tasa mensual de desgravamen por persona" unit="%" value={form.lifeInsuranceRate} onChange={(value) => update("lifeInsuranceRate", value)} error={errors.lifeInsuranceRate} /><Field id="lifeInsuranceBase" label="Base del desgravamen" value={form.lifeInsuranceBase}><select id="lifeInsuranceBase" value={form.lifeInsuranceBase} onChange={(event) => update("lifeInsuranceBase", event.target.value)}><option value="opening-loan-balance">Saldo inicial de cada mes</option><option value="initial-loan-principal">Capital inicial</option></select></Field><Field id="propertyInsuranceRate" label="Tasa mensual incendio y sismo" unit="%" value={form.propertyInsuranceRate} onChange={(value) => update("propertyInsuranceRate", value)} error={errors.propertyInsuranceRate} /><Field id="propertyInsuranceBase" label="Base del seguro del inmueble" value={form.propertyInsuranceBase}><select id="propertyInsuranceBase" value={form.propertyInsuranceBase} onChange={(event) => update("propertyInsuranceBase", event.target.value)}><option value="property-value">Valor comercial</option><option value="appraisal-value">Tasación ingresada</option><option value="initial-loan-principal">Capital inicial</option></select></Field><Field id="otherRecurring" label="Otros pagos mensuales" unit="UF" value={form.otherRecurring} onChange={(value) => update("otherRecurring", value)} error={errors.otherRecurring} /></div></fieldset>
        <fieldset><legend>Inicio: gastos operacionales</legend><p>Valores iniciales editables según el esquema proporcionado. El impuesto al mutuo se calcula sobre el capital financiado; el Conservador, sobre el valor comercial.</p><div className="mortgage-grid"><Field id="appraisalExpense" label="Tasación de la propiedad" unit="UF" value={form.appraisalExpense} onChange={(value) => update("appraisalExpense", value)} error={errors.appraisalExpense} /><Field id="legalExpense" label="Estudio de títulos" unit="UF" value={form.legalExpense} onChange={(value) => update("legalExpense", value)} error={errors.legalExpense} /><Field id="deedDraftExpense" label="Borrador de escritura" unit="UF" value={form.deedDraftExpense} onChange={(value) => update("deedDraftExpense", value)} error={errors.deedDraftExpense} /><Field id="notaryExpense" label="Notaría" unit="UF" value={form.notaryExpense} onChange={(value) => update("notaryExpense", value)} error={errors.notaryExpense} /><Field id="conservatorRate" label="Conservador de Bienes Raíces" unit="% del valor comercial" value={form.conservatorRate} onChange={(value) => update("conservatorRate", value)} error={errors.conservatorRate} /><Field id="otherExpense" label="Otros gastos confirmados" unit={form.otherExpenseMode === "fixed-uf" ? "UF" : form.otherExpenseMode === "fixed-clp" ? "CLP" : "%"} value={form.otherExpense} onChange={(value) => update("otherExpense", value)} error={errors.otherExpense} /><Field id="otherExpenseMode" label="Base de otros gastos" value={form.otherExpenseMode}><select id="otherExpenseMode" value={form.otherExpenseMode} onChange={(event) => update("otherExpenseMode", event.target.value)}><option value="fixed-uf">Monto fijo en UF</option><option value="fixed-clp">Monto fijo en CLP</option><option value="property-percentage">Porcentaje del valor comercial</option><option value="principal-percentage">Porcentaje del capital</option></select></Field></div><div className="dfl2-panel"><h3>Beneficio DFL2 para el impuesto al mutuo</h3><p>La tasa baja de 0,8% a 0,2% solo cuando se cumplen conjuntamente las condiciones indicadas. Confírmalas en la escritura, el certificado de recepción y con la institución.</p><div className="dfl2-checklist"><label><input type="checkbox" checked={form.dfl2Certified} onChange={(event) => update("dfl2Certified", event.target.checked)} /> La vivienda está formalmente acogida al DFL2</label><label><input type="checkbox" checked={form.dfl2FirstTransfer} onChange={(event) => update("dfl2FirstTransfer", event.target.checked)} /> Es la primera transferencia de la vivienda</label><label><input type="checkbox" checked={form.dfl2WithinTwoYears} onChange={(event) => update("dfl2WithinTwoYears", event.target.checked)} /> Ocurre dentro de 2 años desde la recepción municipal</label><label><input type="checkbox" checked={form.buyerNaturalPerson} onChange={(event) => update("buyerNaturalPerson", event.target.checked)} /> Compra una persona natural</label></div><Field id="priorDfl2Homes" label="Viviendas que ya ocupan el cupo DFL2 del comprador" unit="número" value={form.priorDfl2Homes} onChange={(value) => update("priorDfl2Homes", value)} error={errors.priorDfl2Homes} help="Con 0 o 1 hay cupo disponible; con 2 o más se usa la tasa general." /><p className="dfl2-result"><strong>Tasa modelada:</strong> {evaluateDfl2StampTax({ certifiedProperty: form.dfl2Certified, firstTransfer: form.dfl2FirstTransfer, withinTwoYearsOfReception: form.dfl2WithinTwoYears, naturalPersonBuyer: form.buyerNaturalPerson, priorBenefitedHomes: n(form.priorDfl2Homes) }).eligible ? "0,2% (beneficio DFL2)" : "0,8% (tasa general)"}</p></div></fieldset>
        <BrokerageInputSection form={form} update={update} errors={errors} preview={brokeragePreview} ufValueClp={effectiveUf} resetBrokerage={resetBrokerage} />
        <BrokerageComparisonTool propertyPriceUf={result?.propertyPriceUf || n(form.propertyPrice)} ufValueClp={effectiveUf} />
        <div className="calculator-actions"><button className="button button--primary" type="submit"><Calculator size={17} /> {mode === "mortgage" ? "Calcular escenario" : "Estimar valor orientativo"}</button><button className="button button--secondary" type="button" onClick={reset}><RotateCcw size={17} /> Reiniciar</button></div>
      </form>
    </section>
    <div className="sr-status" aria-live="polite">{notice}</div>

    {result && <section className="mortgage-results" ref={resultRef} tabIndex="-1" aria-labelledby="results-title"><div className="section-title"><p className="eyebrow">Resultado de planificación</p><h2 id="results-title">{mode === "affordability" ? "Valor de propiedad orientativo bajo este escenario" : "Resumen del escenario"}</h2><p>Resultados calculados con la UF y los supuestos mostrados. Los seguros, gastos y equivalencias en pesos deben confirmarse.</p></div>
      {mode === "affordability" && <div className="headline-result"><span>Valor orientativo</span><strong>{formatUf(result.propertyPriceUf)}</strong><small>{formatClp(result.propertyPriceUf * effectiveUf)} con la UF seleccionada</small></div>}
      <dl className="metrics-grid"><Metric label="Valor comercial" value={formatUf(result.propertyPriceUf)} note={formatClp(result.propertyPriceUf * effectiveUf)} /><Metric label="Base financiable" value={formatUf(result.financingBaseUf)} note="Menor entre precio y tasación" /><Metric label="Capital financiado" value={formatUf(result.principalUf)} note="Calculado" /><Metric label="Pie mínimo" value={formatUf(result.requiredDownPaymentUf)} note={formatClp(result.requiredDownPaymentClp)} /><Metric label="Gastos operacionales" value={formatUf(result.operationalExpensesUf)} note="Sin corretaje" /><Metric label="Corretaje del comprador" value={formatUf(result.buyerBrokerageUf)} note={result.brokeragePlan?.includedInInitialCash ? "Incluido en efectivo inicial" : "No incorporado"} /><Metric label="Otros gastos iniciales" value={formatUf(result.otherInitialExpensesUf)} note="Supuestos editables" /><Metric label="Efectivo inicial total" value={formatUf(result.requiredInitialCashUf)} note={formatClp(result.requiredInitialCashClp)} /><Metric label="Pago capital e interés" value={formatUf(result.basePaymentUf)} note="Pago nivelado, salvo ajuste final" /><Metric label="Desgravamen inicial" value={formatUf(result.firstLifeInsuranceUf, 4)} note="Estimado" /><Metric label="Incendio y sismo" value={formatUf(result.firstPropertyInsuranceUf, 4)} note="Estimado" /><Metric label="Primer pago total" value={formatUf(result.firstTotalPaymentUf)} note={formatClp(result.firstTotalPaymentClp)} /><Metric label="Carga hipotecaria" value={formatPercent(result.burdenRatio)} note="Pago total / ingreso" /><Metric label="Carga total" value={formatPercent(result.totalDebtBurdenRatio)} note="Incluye obligaciones existentes" /><Metric label="Ingreso orientativo" value={formatClp(result.requiredIncomeClp)} note="Según umbral elegido" /><Metric label="Margen mensual" value={formatClp(result.monthlyMarginClp)} note="Dentro del umbral elegido" /><Metric label="Intereses totales" value={formatUf(result.totalInterestUf)} note="Durante todo el plazo" /><Metric label="Seguros totales" value={formatUf(result.totalInsuranceUf)} note="Bajo supuestos ingresados" /><Metric label="Desembolso total" value={formatUf(result.estimatedTotalOutflowUf)} note="Pie + gastos + pagos mensuales" /><Metric label="Tasa mensual equivalente" value={formatPercent(result.monthlyRate, 4)} note={result.rateConvention === RATE_CONVENTIONS.EFFECTIVE ? "Desde tasa anual efectiva" : "Desde tasa nominal anual"} /><Metric label="Tasa anual equivalente del flujo" value={result.equivalentFlowRate ? formatPercent(result.equivalentFlowRate.effectiveAnnualized) : "No disponible"} note="Estimación del flujo; no es CAE oficial" /></dl>
      {result.brokeragePlan && <BrokerageResultCard plan={result.brokeragePlan} ufValueClp={effectiveUf} />}
      <details className="assumption-summary"><summary>Ver todos los supuestos utilizados</summary><dl><div><dt>Precio / tasación</dt><dd>{formatUf(result.propertyPriceUf)} / {Number.isFinite(result.appraisalValueUf) ? formatUf(result.appraisalValueUf) : "sin tasación"}</dd></div><div><dt>Financiamiento</dt><dd>{formatPercent(result.financingRatio)}</dd></div><div><dt>Tasa y convención</dt><dd>{formatPercent(result.annualRate)} · {result.rateConvention === RATE_CONVENTIONS.EFFECTIVE ? "anual efectiva" : "nominal anual mensual"}</dd></div><div><dt>Plazo</dt><dd>{result.termMonths} meses</dd></div><div><dt>Ingreso / obligaciones</dt><dd>{formatClp(result.householdIncomeClp)} / {formatClp(result.existingMonthlyDebtClp)}</dd></div><div><dt>Umbral</dt><dd>{formatPercent(result.planningBurdenRatio)}</dd></div><div><dt>UF</dt><dd>{formatClp(effectiveUf)} · {uf.mode}</dd></div><div><dt>Seguros</dt><dd>Desgravamen: {form.lifeInsuranceRate}% por persona, base {form.lifeInsuranceBase}; inmueble: {form.propertyInsuranceRate}%, base {form.propertyInsuranceBase}</dd></div><div><dt>Otros mensuales</dt><dd>{formatUf(n(form.otherRecurring))}</dd></div><div><dt>Gastos iniciales modelados</dt><dd>{formatUf(result.initialExpensesUf)}</dd></div>{result.expenses.filter((expense) => expense.enabled).map((expense) => <div key={expense.id}><dt>{expense.label}</dt><dd>{formatUf(expense.calculatedUf)}</dd></div>)}</dl></details>
      <p className="uf-interpretation">El crédito puede expresarse en UF, pero su equivalente en pesos cambia con el valor de la UF. El valor mostrado en CLP es una conversión realizada con la UF seleccionada para esta simulación; no proyecta pagos futuros en pesos.</p>
      <div className="result-actions"><button className="button button--secondary" type="button" onClick={addScenario} disabled={scenarios.length >= 4}><Plus size={17} /> Añadir escenario</button><button className="button button--secondary" type="button" onClick={duplicateScenario} disabled={scenarios.length >= 4}><Copy size={17} /> Duplicar escenario</button><button className="button button--secondary" type="button" onClick={copySummary}><Clipboard size={17} /> Copiar resumen</button><button className="button button--secondary" type="button" onClick={() => { window.print(); trackEvent("mortgage_summary_printed", { category: mode }); }}><Printer size={17} /> Imprimir</button></div>
      <div className="chart-grid"><CompositionChart result={result} /><BalanceChart result={result} /></div>
      <AnnualTable result={result} showMonthly={showMonthly} setShowMonthly={setShowMonthly} />
    </section>}
    <ScenarioComparison scenarios={scenarios} baselineId={baselineId} setBaselineId={setBaselineId} rename={rename} remove={remove} />
    <section className="methodology-section" aria-labelledby="methodology-title"><div className="section-title"><p className="eyebrow">Método y límites</p><h2 id="methodology-title">Cómo leer esta estimación</h2></div><details onToggle={(event) => event.currentTarget.open && trackEvent("mortgage_methodology_opened", { category: "methodology" })}><summary>Cómo se calcula</summary><div><p><strong>Base y capital.</strong> Se toma el menor valor entre precio y tasación; se multiplica por el porcentaje de financiamiento. El pie es la diferencia entre el precio y ese capital.</p><p><strong>Cuota.</strong> Se usa la fórmula de anualidad nivelada. Cada mes, el interés es saldo inicial × tasa mensual; el resto del pago base reduce capital. El último pago se ajusta para cerrar el saldo en cero.</p><p><strong>Tasas.</strong> Una tasa anual efectiva se ajusta a base 365/360 y se convierte como ((1 + tasa)<sup>365/360</sup>)<sup>1/12</sup> − 1. Una nominal anual con capitalización mensual se divide por 12.</p><p><strong>Gastos e impuesto al mutuo.</strong> Los gastos fijos se expresan en UF. El Conservador se estima como porcentaje del valor comercial. El impuesto al mutuo usa 0,8% del capital financiado o 0,2% cuando todas las condiciones DFL2 declaradas se cumplen.</p><p><strong>Corretaje.</strong> La comisión se calcula en un módulo separado. Un porcentaje neto recibe IVA solo cuando se selecciona esa condición; una tasa final con IVA se descompone sin volver a gravarla. Si el tratamiento tributario está pendiente, se muestra un rango y no se agrega al efectivo inicial. La comisión del vendedor nunca se suma al comprador.</p><p><strong>Carga.</strong> La carga total divide pago estimado más obligaciones existentes por ingreso. El umbral es un supuesto personal de planificación, no una regla universal.</p><p><strong>Tasa equivalente del flujo.</strong> El motor puede estimar la TIR efectiva anual de los flujos incluidos, pero no la presenta como CAE oficial porque esta simulación no reproduce toda la metodología regulatoria ni una oferta contractual.</p><p>Fuente de UF en este escenario: {uf.sourceCategory || "manual"}. Revisión factual del corretaje: normativa vigente de Ley Chile, información tributaria del SII y deberes de información de SERNAC. Última revisión editorial: <time dateTime={REVIEW_DATE}>18 de julio de 2026</time>.</p></div></details><details onToggle={(event) => event.currentTarget.open && trackEvent("mortgage_methodology_opened", { category: "limitations" })}><summary>Limitaciones y preguntas para confirmar</summary><div><p>Una oferta real puede usar otra tasación, políticas de ingreso y carga, primas, coberturas, impuestos, gastos, tasa o porcentaje máximo. Solo se modela el beneficio DFL2 del impuesto al mutuo bajo las condiciones declaradas; esta versión no determina exigibilidad contractual, tratamiento tributario particular, otros beneficios, gracia, prepago, mora, tasa variable, subsidios, inflación futura de la UF ni cambios contractuales.</p><ul><li>¿Qué valor y porcentaje financiará la institución?</li><li>¿Qué convención, período y condiciones tiene la tasa?</li><li>¿Cuál es la base, cobertura y prima de cada seguro?</li><li>¿La escritura y la fecha de recepción acreditan el beneficio DFL2?</li><li>¿Quién encargó el corretaje, qué servicios incluye, qué documento tributario se emitirá y cuándo se paga?</li><li>¿Cómo cambia el costo con prepago, renegociación o atraso?</li></ul></div></details></section>
    <section className="learning-link"><p className="eyebrow">Profundiza</p><h2>Evalúa la operación más allá del dividendo</h2><p>La guía explica tasación, pie, amortización, seguros, UF y preguntas para comparar alternativas.</p><a className="button button--secondary" href="/aprende/finanzas-personales/como-evaluar-un-credito-hipotecario">Abrir guía educativa</a></section>
    <ContextualServiceCta />
  </main></PageShell>;
}
