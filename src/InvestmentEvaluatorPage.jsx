import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Calculator,
  Copy,
  Printer,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import {
  Breadcrumbs,
  ContextualServiceCta,
  PageShell,
} from "./LearningComponents";
import { breadcrumbSchema, usePageMetadata } from "./seo";
import { trackEvent } from "./analytics";
import {
  BROKERAGE_MODES,
  BROKERAGE_TAX,
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
import TechnicalHelp from "./TechnicalHelp";
import { formatNumericInput, normalizeNumericInput } from "./chileanNumberInput";

const REVIEW_DATE = "2026-07-18";
const PATH = "/herramientas/evaluador-inversion-inmobiliaria";
const initial = Object.freeze({
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
  monthlyRentUf: 17.5,
  occupancyRate: 92,
  rentGrowthRate: 0,
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

const asNumber = (value) =>
  typeof value === "number" ? value : Number(String(value).replace(",", "."));
const pct = (value) => asNumber(value) / 100;
const dateLabel = (date) =>
  date
    ? new Intl.DateTimeFormat("es-CL", {
        dateStyle: "long",
        timeZone: "UTC",
      }).format(new Date(`${date}T12:00:00Z`))
    : "sin fecha disponible";
const sourceDateLabel = (date) =>
  /^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))
    ? dateLabel(date)
    : date || "sin fecha disponible";
const rateNumberLabel = (value, minimumFractionDigits = 0) =>
  Number(value).toLocaleString("es-CL", {
    minimumFractionDigits,
    maximumFractionDigits: 2,
  });
const ufPlusLabel = (percentage, minimumFractionDigits = 0) =>
  `UF + ${rateNumberLabel(percentage, minimumFractionDigits)}%`;
const plainDecisionText = (text = "") =>
  text
    .replace("El valor presente neto es negativo frente a la alternativa seleccionada.", "La propiedad queda por debajo de la otra inversión que elegiste.")
    .replace("El valor presente neto es positivo frente a la alternativa seleccionada.", "La propiedad queda por encima de la otra inversión que elegiste.")
    .replace("El flujo del primer año es positivo antes de impuestos personales.", "Durante el primer año quedaría un excedente antes de impuestos personales.")
    .replace("El ingreso operativo neto no cubre completamente el servicio de la deuda.", "El arriendo después de los gastos normales no alcanza a cubrir completamente el crédito.")
    .replace("El ingreso operativo neto mantiene un margen sobre el servicio de la deuda.", "El arriendo después de los gastos normales cubre el crédito y deja un margen.")
    .replace("El valor presente neto está cerca de cero y puede cambiar de signo con variaciones pequeñas.", "La comparación con tu otra alternativa está cerca de cero y puede cambiar con pequeñas variaciones.")
    .replace("La tasa interna de retorno puede tener múltiples soluciones y no debe usarse de forma aislada.", "No es posible resumir estos flujos en una única tasa anual; revisa los montos y fechas.")
    .replace("La cobertura de deuda", "La capacidad del arriendo para cubrir el crédito");

function Input({
  id,
  label,
  unit,
  value,
  onChange,
  min,
  max,
  step = "any",
  help,
  helpConcept,
}) {
  return (
    <div className="investment-field">
      <div className="investment-field__label-row">
        <label htmlFor={id}>
          {label}
          {unit ? ` (${unit})` : ""}
        </label>
        {helpConcept && <TechnicalHelp concept={helpConcept} label={`Explicación de ${label}`} />}
      </div>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        data-min={min}
        data-max={max}
        data-step={step}
        value={formatNumericInput(value)}
        onChange={(event) => onChange(normalizeNumericInput(event.target.value))}
        data-private="true"
      />
      {help && <small>{help}</small>}
    </div>
  );
}

function MoneyInput({
  id,
  label,
  valueUf,
  onChangeUf,
  currencyMode,
  ufValue,
  min = 0,
  help,
  helpConcept,
}) {
  const validUf = valueUf !== "" && Number.isFinite(asNumber(valueUf));
  const primaryValue =
    valueUf === ""
      ? ""
      : currencyMode === "clp" && ufValue > 0
        ? Number((asNumber(valueUf) * ufValue).toFixed(0))
        : valueUf;
  const secondary =
    validUf && ufValue > 0
      ? currencyMode === "clp"
        ? formatUf(asNumber(valueUf))
        : formatClp(asNumber(valueUf) * ufValue)
      : null;
  const change = (raw) => {
    if (raw === "") return onChangeUf("");
    const parsed = asNumber(raw);
    onChangeUf(
      currencyMode === "clp" && ufValue > 0 ? parsed / ufValue : parsed,
    );
  };
  return (
    <div className="investment-field money-field">
      <div className="investment-field__label-row">
        <label htmlFor={id}>
          {label} ({currencyMode === "clp" ? "CLP" : "UF"})
        </label>
        {helpConcept && <TechnicalHelp concept={helpConcept} label={`Explicación de ${label}`} />}
      </div>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        data-min={min}
        value={formatNumericInput(primaryValue)}
        onChange={(event) => change(normalizeNumericInput(event.target.value))}
        data-private="true"
      />
      {secondary && (
        <small className="money-equivalent">Equivale a {secondary}</small>
      )}
      {help && <small>{help}</small>}
    </div>
  );
}

function Select({
  id,
  label,
  value,
  onChange,
  children,
  help,
  className = "",
}) {
  return (
    <div className="investment-field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        className={className}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
      {help && <small>{help}</small>}
    </div>
  );
}

function MoneyValue({ valueUf, ufValue, currencyMode = "uf" }) {
  if (!Number.isFinite(valueUf)) return <span>—</span>;
  const primary =
    currencyMode === "clp" && ufValue > 0
      ? formatClp(valueUf * ufValue)
      : formatUf(valueUf);
  const secondary =
    currencyMode === "clp"
      ? formatUf(valueUf)
      : ufValue > 0
        ? formatClp(valueUf * ufValue)
        : null;
  return (
    <span className="dual-money">
      <span>{primary}</span>
      {secondary && <small>{secondary}</small>}
    </span>
  );
}

function Metric({ label, value, moneyUf, ufValue, currencyMode, detail, helpConcept, helpLabel }) {
  return (
    <div className="investment-metric">
      <dt>
        <span>{label}</span>
        {helpConcept && (
          <TechnicalHelp
            concept={helpConcept}
            label={helpLabel || `Explicación de ${label}`}
          />
        )}
      </dt>
      <dd>
        {moneyUf !== undefined ? (
          <MoneyValue
            valueUf={moneyUf}
            ufValue={ufValue}
            currencyMode={currencyMode}
          />
        ) : (
          value
        )}
      </dd>
      {detail && <small>{detail}</small>}
    </div>
  );
}

function solverLabel(result, formatter = formatUf) {
  if (result?.status === "converged" && Number.isFinite(result.value))
    return formatter(result.value);
  if (
    result?.status === "multiple-roots-possible" &&
    Number.isFinite(result.value)
  )
    return `${formatter(result.value)} (revisar raíces)`;
  return "Sin solución válida en el rango probado";
}

function SolverMoneyMetric({ label, result, ufValue, currencyMode }) {
  const solved =
    ["converged", "multiple-roots-possible"].includes(result?.status) &&
    Number.isFinite(result?.value);
  return solved ? (
    <Metric
      label={label}
      moneyUf={result.value}
      ufValue={ufValue}
      currencyMode={currencyMode}
      detail={
        result.status === "multiple-roots-possible"
          ? "Puede haber más de una solución; revisa el flujo."
          : undefined
      }
    />
  ) : (
    <Metric label={label} value="Sin solución válida en el rango probado" />
  );
}

function ProjectionChart({ rows }) {
  const sampled = rows.filter(
    (_, index) =>
      index === 0 || (index + 1) % 2 === 0 || index === rows.length - 1,
  );
  const max = Math.max(
    ...sampled.flatMap((row) => [
      Math.abs(row.noiUf),
      Math.abs(row.debtServiceUf),
      Math.abs(row.preTaxCashFlowUf),
    ]),
    1,
  );
  return (
    <figure
      className="investment-chart"
      aria-labelledby="flow-chart-title flow-chart-desc"
    >
      <figcaption>
        <h3 id="flow-chart-title">Qué pasa cada año</h3>
        <p id="flow-chart-desc">
          Compara lo que deja el arriendo antes del crédito, los pagos del
          crédito y lo que tú aportas o recibes. La tabla contiene los valores
          exactos.
        </p>
      </figcaption>
      <div className="investment-bars" aria-hidden="true">
        {sampled.map((row) => (
          <div key={row.year} className="investment-bars__year">
            <div className="investment-bars__columns">
              <i
                style={{ height: `${(Math.abs(row.noiUf) / max) * 100}%` }}
                title="Ingreso operativo neto"
              />
              <i
                style={{
                  height: `${(Math.abs(row.debtServiceUf) / max) * 100}%`,
                }}
                title="Deuda"
              />
              <i
                className={row.preTaxCashFlowUf < 0 ? "negative" : ""}
                style={{
                  height: `${(Math.abs(row.preTaxCashFlowUf) / max) * 100}%`,
                }}
                title="Flujo"
              />
            </div>
            <span>{row.year}</span>
          </div>
        ))}
      </div>
      <ul className="chart-legend">
        <li>
          <i /> Arriendo después de gastos normales
        </li>
        <li>
          <i /> Pago del crédito
        </li>
        <li>
          <i /> Tú aportas o recibes
        </li>
      </ul>
    </figure>
  );
}

function SimpleProjectionTable({ rows, saleYear, ufValue, currencyMode }) {
  const money = (value) => (
    <MoneyValue valueUf={value} ufValue={ufValue} currencyMode={currencyMode} />
  );
  return (
    <div className="table-scroll investment-table investment-table--simple" tabIndex="0">
      <table>
        <caption>
          Vista simple de la proyección. Los montos son estimaciones antes de
          impuestos personales y cada uno muestra UF y pesos.
        </caption>
        <thead>
          <tr>
            <th>Año</th>
            <th>Arriendo recibido</th>
            <th>Gastos</th>
            <th>Pago del crédito</th>
            <th>Tú aportas o recibes</th>
            <th>Deuda pendiente</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.year} className={row.year === saleYear ? "selected-year" : ""}>
              <th>{row.year}</th>
              <td>{money(row.effectiveIncomeUf)}</td>
              <td>{money(row.operatingExpensesUf + row.capitalExpenditureUf)}</td>
              <td>{money(row.debtServiceUf)}</td>
              <td>
                <span className={row.preTaxCashFlowUf < 0 ? "cash-direction cash-direction--out" : "cash-direction cash-direction--in"}>
                  {row.preTaxCashFlowUf < 0 ? "Aportas " : "Recibes "}
                  {money(Math.abs(row.preTaxCashFlowUf))}
                </span>
              </td>
              <td>{money(row.mortgageBalanceUf)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProjectionTable({ rows, saleYear, ufValue, currencyMode }) {
  const money = (value) => (
    <MoneyValue valueUf={value} ufValue={ufValue} currencyMode={currencyMode} />
  );
  return (
    <div className="table-scroll investment-table" tabIndex="0">
      <table>
        <caption>
          Vista financiera detallada con valores en UF y CLP. La venta es una
          alternativa final y no se suma a la continuidad.
        </caption>
        <thead>
          <tr>
            <th>Año</th>
            <th>Renta potencial</th>
            <th>Vacancia</th>
            <th>Ingreso efectivo</th>
            <th>Gastos operativos</th>
            <th>Ingreso operativo neto</th>
            <th>Deuda</th>
            <th>Gasto de capital</th>
            <th>Flujo</th>
            <th>Valor propiedad</th>
            <th>Saldo deuda</th>
            <th>Comisión prepago</th>
            <th>Venta neta</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.year}
              className={row.year === saleYear ? "selected-year" : ""}
            >
              <th>{row.year}</th>
              <td>{money(row.potentialRentUf)}</td>
              <td>{money(row.vacancyLossUf)}</td>
              <td>{money(row.effectiveIncomeUf)}</td>
              <td>{money(row.operatingExpensesUf)}</td>
              <td>{money(row.noiUf)}</td>
              <td>{money(row.debtServiceUf)}</td>
              <td>{money(row.capitalExpenditureUf)}</td>
              <td>{money(row.preTaxCashFlowUf)}</td>
              <td>{money(row.propertyValueUf)}</td>
              <td>{money(row.mortgageBalanceUf)}</td>
              <td>{money(row.prepaymentCostUf)}</td>
              <td>{money(row.netSaleProceedsUf)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DecisionSummary({
  decision,
  result,
  inputs,
  form,
  monthlyRentUf,
  ufValue,
  currencyMode,
  selectedAlternative,
  cautiousNpvUf,
  dependsOnCashFlow,
}) {
  if (!decision) return null;
  const risks = [...decision.blockers, ...decision.risks].map(plainDecisionText);
  if (inputs.occupancyRate < 0.9)
    risks.push(
      "La ocupación supuesta es inferior al 90% y aumenta la exposición a meses sin arriendo.",
    );
  if (!form.appraisalValueUf)
    risks.push(
      "No se ingresó una tasación independiente para contrastar el precio de compra.",
    );
  if (form.dfl2Status === "unknown")
    risks.push(
      "La situación DFL 2 y sus efectos deben confirmarse documentalmente.",
    );
  if (form.prepaymentMode === "automatic-uf")
    risks.push(
      "La comisión de prepago es una estimación y debe reemplazarse por el certificado bancario antes de decidir.",
    );
  if (Number.isFinite(cautiousNpvUf) && cautiousNpvUf < 0)
    risks.push(
      "En el escenario difícil, la propiedad queda por debajo de la otra inversión elegida.",
    );
  const uniqueRisks = [...new Set(risks)];
  const steps = [
    "Validar arriendo, vacancia y tiempo de colocación con al menos tres comparables recientes y verificables.",
    "Solicitar al banco una cotización formal del crédito, seguros, gastos, condiciones y certificado o fórmula de prepago.",
    "Revisar títulos, prohibiciones, recepción municipal, contribuciones, gastos comunes, mantenciones y estado material del inmueble.",
    "Confirmar con profesionales el tratamiento tributario, DFL 2 y los costos de adquisición y venta aplicables al caso.",
    decision.status === "avanzar-con-condiciones"
      ? "Definir condiciones de aprobación: precio máximo, reserva de liquidez y límites de vacancia antes de presentar una oferta."
      : "No comprometer fondos todavía; ajustar precio, financiamiento, arriendo o capital inicial y volver a ejecutar el escenario de presión.",
  ];
  return (
    <section
      className={`investment-decision investment-decision--${decision.status}`}
      aria-labelledby="decision-title"
    >
      <div className="investment-decision__header">
        <div>
          <p className="eyebrow">Resumen final del escenario</p>
          <h2 id="decision-title" tabIndex="-1">
            {dependsOnCashFlow ? "Depende" : decision.label}
          </h2>
          <p>{decision.conclusion}</p>
        </div>
        <span>
            {dependsOnCashFlow
              ? "Revisa tu capacidad de aporte"
              : decision.status === "avanzar-con-condiciones"
                ? "Avanzar solo si se valida"
                : "No avanzar todavía"}
        </span>
      </div>
      {dependsOnCashFlow && (
        <div className="conditional-reading">
          <h3>Por qué el resultado depende de tu capacidad de aportar</h3>
          <p>
            Bajo estos supuestos, la inversión supera a la alternativa en el
            largo plazo, pero el arriendo no cubre completamente el crédito.
            Tendrías que aportar aproximadamente{" "}
            <strong>{formatUf(Math.abs(result.annualProjection[0].preTaxCashFlowUf))}</strong>{" "}
            durante el primer año. Podría ser razonable avanzar únicamente si
            puedes financiar esos aportes y el resultado se mantiene en
            escenarios menos favorables.
          </p>
        </div>
      )}
      <div className="decision-grid">
        <article>
          <h3>Supuestos iniciales</h3>
          <dl>
            <div>
              <dt>Precio</dt>
              <dd>
                <MoneyValue
                  valueUf={inputs.propertyPriceUf}
                  ufValue={ufValue}
                  currencyMode={currencyMode}
                />
              </dd>
            </div>
            <div>
              <dt>Capital inicial</dt>
              <dd>
                <MoneyValue
                  valueUf={result.initialEquityUf}
                  ufValue={ufValue}
                  currencyMode={currencyMode}
                />
              </dd>
            </div>
            <div>
              <dt>Financiamiento</dt>
              <dd>
                {form.financingRatio}% · {form.annualRate}% anual ·{" "}
                {form.termYears} años
              </dd>
            </div>
            <div>
              <dt>Arriendo y ocupación</dt>
              <dd>
                <MoneyValue
                  valueUf={monthlyRentUf}
                  ufValue={ufValue}
                  currencyMode={currencyMode}
                />{" "}
                al mes · {form.occupancyRate}%
              </dd>
            </div>
            <div>
              <dt>Salida evaluada</dt>
              <dd>
                Año {result.saleYear} de un horizonte de {form.horizonYears}{" "}
                años
              </dd>
            </div>
            <div>
              <dt>Alternativa</dt>
              <dd>
                {selectedAlternative?.label || "Tasa personalizada"} ·{" "}
                {ufPlusLabel(inputs.opportunityCostRate * 100, 2)}
              </dd>
            </div>
          </dl>
        </article>
        <article>
          <h3>Qué pasa con el arriendo</h3>
          <dl>
            <div>
              <dt>Arriendo después de gastos normales, año 1</dt>
              <dd>
                <MoneyValue
                  valueUf={result.annualProjection[0].noiUf}
                  ufValue={ufValue}
                  currencyMode={currencyMode}
                />
              </dd>
            </div>
            <div>
              <dt>Pagos del crédito, año 1</dt>
              <dd>
                <MoneyValue
                  valueUf={result.annualProjection[0].debtServiceUf}
                  ufValue={ufValue}
                  currencyMode={currencyMode}
                />
              </dd>
            </div>
            <div>
              <dt>{result.annualProjection[0].preTaxCashFlowUf < 0 ? "Tú aportas, año 1" : "Tú recibes, año 1"}</dt>
              <dd>
                <MoneyValue
                  valueUf={Math.abs(result.annualProjection[0].preTaxCashFlowUf)}
                  ufValue={ufValue}
                  currencyMode={currencyMode}
                />
              </dd>
            </div>
            <div>
              <dt>Cuánto del crédito cubre el arriendo</dt>
              <dd>
                {result.dscr == null
                  ? "No aplica"
                  : `${result.dscr.toLocaleString("es-CL", { maximumFractionDigits: 2 })}×`}
              </dd>
            </div>
            <div>
              <dt>Comparación con tu otra alternativa</dt>
              <dd>
                <MoneyValue
                  valueUf={result.npvUf}
                  ufValue={ufValue}
                  currencyMode={currencyMode}
                />
              </dd>
            </div>
            <div>
              <dt>Rendimiento anual calculado</dt>
              <dd>
                {result.irr.value == null
                  ? "No disponible"
                  : formatPercent(result.irr.value)}
              </dd>
            </div>
          </dl>
          <h4>Señales favorables</h4>
          <ul>
            {decision.strengths.length ? (
              decision.strengths.map((item) => <li key={item}>{plainDecisionText(item)}</li>)
            ) : (
              <li>
                  No se identificaron señales suficientes para respaldar un avance.
              </li>
            )}
          </ul>
        </article>
        <article>
          <h3>Riesgos y condiciones pendientes</h3>
          <ul>
            {uniqueRisks.length ? (
              uniqueRisks.map((item) => <li key={item}>{item}</li>)
            ) : (
              <li>
                No se detectaron alertas mecánicas, pero siguen existiendo
                riesgos de mercado, legales, operativos y de liquidez.
              </li>
            )}
          </ul>
        </article>
        <article>
          <h3>Siguientes pasos</h3>
          <ol>
            {steps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </article>
      </div>
      <aside className="academic-disclosure">
        <ShieldCheck size={22} />
        <div>
          <h3>Aviso académico y de responsabilidad</h3>
          <p>
            Esta orientación se genera automáticamente a partir de los datos
            ingresados y reglas simplificadas. Puede contener errores, omisiones
            o supuestos inadecuados. La decisión final y la verificación de la
            información corresponden exclusivamente al usuario.
          </p>
          <p>
            La herramienta tiene fines académicos y educativos. No constituye ni
            reemplaza asesoría financiera, legal, tributaria o crediticia; una
            recomendación profesional de inversión; la revisión de un asesor
            inmobiliario; ni la evaluación, aprobación o comité de riesgo de un
            banco.
          </p>
        </div>
      </aside>
    </section>
  );
}

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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [message, setMessage] = useState("");
  const set = (key) => (value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const newProperty = isNewProperty(form.propertyKind);
  const futureDelivery = hasFutureDelivery(form.propertyKind);
  const changePropertyLevel = (value) => {
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
    setForm((current) => ({
      ...current,
      expectedInflationRate: opportunityData.inflation.annualRate,
    }));
    setInflationMode("automatic");
  };
  const restoreOfficialCreditRate = () => {
    if (!opportunityData.mortgageRate) return;
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
      appreciationRate: pct(form.appreciationRate),
      opportunityCostRate: realOpportunityRate,
      perpetualGrowthRate: pct(form.perpetualGrowthRate),
      horizonYears: asNumber(form.horizonYears),
      saleYear: asNumber(form.saleYear),
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
  if (!(asNumber(form.saleYear) <= asNumber(form.horizonYears)))
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
  const result = useMemo(() => {
    try {
      return errors.length ? null : projectInvestment(inputs);
    } catch {
      return null;
    }
  }, [inputs, errors.join("|")]);
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
    ? `¿Conviene comprar este departamento para arrendarlo?\nResultado bajo estos supuestos: ${initialDecisionLabel}\n${dependsOnCashFlow ? `Bajo estos supuestos, la inversión supera a la alternativa en el largo plazo, pero el arriendo no cubre completamente el crédito. Tendrías que aportar aproximadamente ${summaryMoney(Math.abs(firstYearCashUf))} durante el primer año. Podría ser razonable avanzar únicamente si puedes financiar esos aportes y el resultado se mantiene en escenarios menos favorables.` : decision?.conclusion || ""}\n\nSUPUESTOS PRINCIPALES\nPrecio: ${summaryMoney(inputs.propertyPriceUf)}\nCrédito: ${form.financingRatio}% del precio, ${form.annualRate}% anual, ${form.termYears} años\nArriendo: ${summaryMoney(monthlyRent)} al mes\nMeses arrendados equivalentes: ${(12 * inputs.occupancyRate).toLocaleString("es-CL", { maximumFractionDigits: 1 })} al año\nOtra alternativa: ${selectedAlternative?.label || "Tasa personalizada"}, ${ufPlusLabel(inputs.opportunityCostRate * 100, 2)}\n\nDINERO INICIAL\nDinero que necesitas poner al comienzo: ${summaryMoney(result.initialEquityUf)}\n${preOperational?.applies ? `Máximo dinero acumulado antes del primer arriendo: ${summaryMoney(preOperational.maximumCashUf)}\n` : ""}\nPRIMER AÑO\n${firstYearCashUf < 0 ? "Dinero que tendrías que aportar" : "Dinero que te quedaría"}: ${summaryMoney(Math.abs(firstYearCashUf))}\n\nCOMPARACIÓN CON LA ALTERNATIVA\nDiferencia estimada a valor de hoy: ${summaryMoney(comparisonUf)}. ${comparisonUf > 0 ? "La propiedad supera la alternativa en el modelo." : comparisonUf < 0 ? "La alternativa supera la propiedad en el modelo." : "Ambas opciones quedan prácticamente igualadas."}\n\nDECISIÓN EN EL AÑO ${result.saleYear}: RIQUEZA ESTIMADA AL AÑO ${result.comparisonYear}\nSi vendes e inviertes en tu mejor alternativa: ${summaryMoney(result.sellAndInvestTerminalWealthUf)}\nSi sigues arrendando y vendes al final: ${summaryMoney(result.holdUntilHorizonTerminalWealthUf)}\nDiferencia entre estrategias: ${summaryMoney(Math.abs(result.terminalWealthDifferenceUf))}\n\nINDICADORES TÉCNICOS\nValor presente neto: ${summaryMoney(result.npvUf)}\nTasa interna de retorno: ${result.irr.value == null ? "no disponible" : formatPercent(result.irr.value)}\n\nADVERTENCIAS\n${[...(decision?.blockers || []), ...(decision?.risks || [])].join(" ") || "Requiere validación profesional y documental."}\n\nAviso: herramienta automática con fines académicos; puede contener errores y no reemplaza asesoría profesional, asesor inmobiliario ni evaluación o comité de riesgo bancario. La decisión corresponde al usuario.`
    : "";
  const copy = async () => {
    await navigator.clipboard.writeText(summary);
    setMessage("Resumen copiado sin enviar datos fuera de tu dispositivo.");
    trackEvent("investment_summary_copied", {
      tool: "investment",
      status: "success",
    });
  };
  const goToFinalSummary = () => {
    const target = document.getElementById("decision-title");
    if (!target) return;
    target.scrollIntoView({ block: "start", behavior: "smooth" });
    target.focus({ preventScroll: true });
    trackEvent("investment_final_summary_opened", {
      tool: "investment",
      status: initialDecisionLabel.toLowerCase(),
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
            <div className="hero-actions">
              <a className="button button--primary" href="#modelo">
                <Calculator size={18} /> Comenzar simulación
              </a>
              <a
                className="button button--secondary"
                href="/aprende/finanzas-personales/evaluar-inversion-inmobiliaria"
              >
                <BookOpen size={18} /> Ver cómo funciona
              </a>
            </div>
          </div>
        </header>

        <section id="modelo" className="investment-workspace">
          <div className="investment-inputs">
            <fieldset className="currency-picker">
              <legend>¿En qué unidad quieres ingresar los montos?</legend>
              <label className={currencyMode === "uf" ? "active" : ""}>
                <input
                  type="radio"
                  name="currency-mode"
                  value="uf"
                  checked={currencyMode === "uf"}
                  onChange={() => setCurrencyMode("uf")}
                />
                <span>
                  <strong>Unidad de Fomento (UF)</strong>
                  <small>
                    Útil para comparar valores reales. Debajo verás siempre el
                    equivalente en pesos.
                  </small>
                </span>
              </label>
              <label className={currencyMode === "clp" ? "active" : ""}>
                <input
                  type="radio"
                  name="currency-mode"
                  value="clp"
                  checked={currencyMode === "clp"}
                  onChange={() => setCurrencyMode("clp")}
                />
                <span>
                  <strong>Pesos chilenos (CLP)</strong>
                  <small>
                    Ingresa todos los montos en pesos. Debajo verás siempre el
                    equivalente en UF.
                  </small>
                </span>
              </label>
              <p>
                La unidad elegida cambia cómo ingresas y lees los montos, no el
                escenario guardado. El modelo los normaliza usando la UF
                seleccionada.
              </p>
            </fieldset>
            <fieldset className="mode-picker">
              <legend>¿Qué quieres calcular?</legend>
              <p className="mode-picker__intro">
                Elige el punto de partida. Puedes cambiarlo después sin perder los
                datos ingresados.
              </p>
              {[
                [
                  "property",
                  "Evaluar una propiedad",
                  "Ingresa su precio, arriendo y crédito para estimar si la inversión te conviene.",
                ],
                [
                  "comparable",
                  "Estimar el arriendo",
                  "Usa el precio y el arriendo de una propiedad similar para estimar cuánto podría arrendarse.",
                ],
                [
                  "break-even",
                  "Calcular qué tendría que cambiar",
                  "Descubre el precio, arriendo u ocupación necesarios para alcanzar el resultado esperado.",
                ],
              ].map(([value, title, text]) => (
                <label key={value} className={mode === value ? "active" : ""}>
                  <input
                    type="radio"
                    name="mode"
                    value={value}
                    checked={mode === value}
                    onChange={() => {
                      setMode(value);
                      trackEvent("investment_mode_opened", {
                        tool: "investment",
                        mode: value,
                      });
                    }}
                  />
                  <strong>{title}</strong>
                  <span>{text}</span>
                </label>
              ))}
            </fieldset>

            <section className="uf-panel" aria-live="polite">
              <div>
                <p className="eyebrow">
                  Valor UF al {dateLabel(uf.effectiveDate)}
                </p>
                <h2>{ufValue > 0 ? formatClp(ufValue) : "No disponible"}</h2>
                {uf.stale && (
                  <p className="warning-text">
                    El valor puede estar desactualizado. Confirma la fecha antes
                    de interpretar montos en pesos.
                  </p>
                )}
              </div>
              <div className="uf-panel__actions">
                {(uf.mode === "manual" || uf.mode === "unavailable") && (
                  <label>
                    Valor manual en CLP
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatNumericInput(manualUf)}
                      onChange={(event) => {
                        setManualUf(normalizeNumericInput(event.target.value));
                        setUf((current) => ({ ...current, mode: "manual" }));
                      }}
                      data-private="true"
                    />
                  </label>
                )}
                {uf.mode !== "manual" && uf.mode !== "unavailable" && (
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={() =>
                      setUf((current) => ({ ...current, mode: "manual" }))
                    }
                  >
                    Cambiar valor
                  </button>
                )}
                <button
                  className="text-button"
                  type="button"
                  onClick={() => loadUf(true)}
                >
                  <RefreshCw size={15} /> Actualizar
                </button>
              </div>
            </section>

            {errors.length > 0 && (
              <div className="investment-errors" role="alert">
                <h2>Revisa estos datos</h2>
                <ul>
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <fieldset>
              <legend>1. Compra y financiamiento</legend>
              <div className="investment-field-grid">
                <MoneyInput
                  id="property-price"
                  label="Precio de venta de la propiedad"
                  valueUf={form.propertyPriceUf}
                  onChangeUf={set("propertyPriceUf")}
                  currencyMode={currencyMode}
                  ufValue={ufValue}
                  min="1"
                />
                <MoneyInput
                  id="appraisal"
                  label="Tasación del banco (opcional)"
                  valueUf={form.appraisalValueUf}
                  onChangeUf={set("appraisalValueUf")}
                  currencyMode={currencyMode}
                  ufValue={ufValue}
                />
                <Select
                  id="property-level"
                  label="Estado de la propiedad"
                  value={newProperty ? "new" : "used"}
                  onChange={changePropertyLevel}
                >
                  <option value="used">Propiedad usada</option>
                  <option value="new">Propiedad nueva</option>
                </Select>
                {newProperty && (
                  <>
                    <Select
                      id="property-kind"
                      label="Estado del proyecto"
                      value={form.propertyKind}
                      onChange={set("propertyKind")}
                    >
                      <option value={PROPERTY_KINDS.NEW_IMMEDIATE}>Nueva con entrega inmediata</option>
                      <option value={PROPERTY_KINDS.NEW_FUTURE}>Nueva con entrega futura</option>
                      <option value={PROPERTY_KINDS.NEW_GREEN}>Nueva en verde</option>
                      <option value={PROPERTY_KINDS.NEW_WHITE}>Nueva en blanco</option>
                    </Select>
                    <div className="project-state-guide">
                      <h3>¿Qué significa cada estado del proyecto?</h3>
                      <div className="table-scroll">
                        <table>
                          <caption>
                            Descripción general de la etapa del proyecto.
                          </caption>
                          <thead>
                            <tr>
                              <th>Etapa</th>
                              <th>Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <th>En blanco</th>
                              <td>Solo terreno.</td>
                            </tr>
                            <tr>
                              <th>En verde</th>
                              <td>Terreno y construcción iniciada.</td>
                            </tr>
                            <tr>
                              <th>Entrega futura</th>
                              <td>Construcción con fecha estimada de entrega.</td>
                            </tr>
                            <tr>
                              <th>Entrega inmediata</th>
                              <td>Construcción finalizada.</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
                <Select
                  id="dfl2"
                  label="Situación DFL 2"
                  value={form.dfl2Status}
                  onChange={set("dfl2Status")}
                  help="DFL 2 significa Decreto con Fuerza de Ley N.º 2. En propiedades nuevas se selecciona “Sí” inicialmente, pero debe confirmarse en los documentos del inmueble."
                >
                  <option value="confirmed">Sí</option>
                  <option value="unknown">No o no sabe</option>
                </Select>
                <Input
                  id="financing"
                  label="Financiamiento de la propiedad"
                  unit="%"
                  value={form.financingRatio}
                  onChange={set("financingRatio")}
                  min="0"
                  max="100"
                  help="Supuesto inicial prudente para una propiedad de inversión o segunda vivienda. La institución puede aprobar un porcentaje distinto."
                />
                <Input
                  id="rate"
                  label="¿Cuál es la tasa del crédito?"
                  unit="%"
                  value={form.annualRate}
                  onChange={(value) => {
                    set("annualRate")(value);
                    setCreditRateMode("manual");
                  }}
                  min="0"
                  help="Tasa promedio de referencia del mercado. Puedes reemplazarla con la tasa de una cotización bancaria."
                />
                <Input
                  id="term"
                  label="¿En cuántos años pagarás el crédito?"
                  unit="años"
                  value={form.termYears}
                  onChange={set("termYears")}
                  min="1"
                  max="50"
                  step="1"
                />
                <div className="mortgage-rate-reference">
                  {opportunityData.mortgageRate ? (
                    <p>
                      <strong>
                        {creditRateMode === "automatic"
                          ? "Dato automático"
                          : "Valor modificado"}
                        : {rateNumberLabel(form.annualRate, 2)}% anual efectiva en
                        UF.
                      </strong>{" "}
                      Promedio ponderado de créditos de vivienda en UF a más de
                      tres años, correspondiente a operaciones efectivamente
                      pactadas. No está ajustada al plazo elegido, a una segunda
                      vivienda ni al perfil de quien solicita el crédito. Fuente:{" "}
                      <a
                        href={opportunityData.mortgageRate.source.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Banco Central de Chile
                      </a>
                      , dato de{" "}
                      {sourceDateLabel(
                        opportunityData.mortgageRate.source.effectiveDate,
                      )}
                      . No es una oferta bancaria.
                      {creditRateMode === "manual" && (
                        <button
                          type="button"
                          className="text-button"
                          onClick={restoreOfficialCreditRate}
                        >
                          Restaurar tasa oficial
                        </button>
                      )}
                    </p>
                  ) : (
                    <p>
                      La referencia oficial no está disponible temporalmente. Se
                      mantiene un supuesto editable; confirma la tasa con una
                      cotización bancaria.
                    </p>
                  )}
                </div>
                <MoneyInput
                  id="acquisition"
                  label="Gastos operacionales del crédito"
                  valueUf={form.acquisitionExpensesUf}
                  onChangeUf={set("acquisitionExpensesUf")}
                  currencyMode={currencyMode}
                  ufValue={ufValue}
                  help="Notaría, registro, estudio, tasación y otros confirmados."
                />
                <MoneyInput
                  id="preparation"
                  label="¿Cuánto gastarás en preparar o renovar?"
                  valueUf={form.preparationCostsUf}
                  onChangeUf={set("preparationCostsUf")}
                  currencyMode={currencyMode}
                  ufValue={ufValue}
                />
                <MoneyInput
                  id="furniture"
                  label="¿Cuánto gastarás en muebles y equipamiento?"
                  valueUf={form.furnitureUf}
                  onChangeUf={set("furnitureUf")}
                  currencyMode={currencyMode}
                  ufValue={ufValue}
                />
                <MoneyInput
                  id="reserves"
                  label="¿Cuánto guardarás para imprevistos al comienzo?"
                  valueUf={form.initialReservesUf}
                  onChangeUf={set("initialReservesUf")}
                  currencyMode={currencyMode}
                  ufValue={ufValue}
                />
              </div>
              <details>
                <summary>Configurar corretaje pagado por quien compra</summary>
                <div className="investment-field-grid">
                  <Select
                    id="broker-mode"
                    label="Modalidad"
                    value={form.brokerageMode}
                    onChange={set("brokerageMode")}
                  >
                    <option value={BROKERAGE_MODES.PERCENTAGE}>
                      Porcentaje
                    </option>
                    <option value={BROKERAGE_MODES.FIXED_UF}>
                      Monto fijo en UF
                    </option>
                    <option value={BROKERAGE_MODES.FIXED_CLP}>
                      Monto fijo en CLP
                    </option>
                  </Select>
                  <Input
                    id="broker-amount"
                    label={
                      form.brokerageMode === BROKERAGE_MODES.PERCENTAGE
                        ? form.brokerageTax === BROKERAGE_TAX.INCLUDED
                          ? "Comisión final"
                          : "Comisión antes de IVA"
                        : form.brokerageTax === BROKERAGE_TAX.INCLUDED
                          ? "Monto final"
                          : "Monto antes de IVA"
                    }
                    unit={
                      form.brokerageMode === BROKERAGE_MODES.PERCENTAGE
                        ? "%"
                        : form.brokerageMode === BROKERAGE_MODES.FIXED_UF
                          ? "UF"
                          : "CLP"
                    }
                    value={form.brokerageAmount}
                    onChange={set("brokerageAmount")}
                    min="0"
                    help={
                      form.brokerageMode === BROKERAGE_MODES.FIXED_UF &&
                      ufValue > 0
                        ? `Equivale a ${formatClp(asNumber(form.brokerageAmount) * ufValue)}`
                        : form.brokerageMode === BROKERAGE_MODES.FIXED_CLP &&
                            ufValue > 0
                          ? `Equivale a ${formatUf(asNumber(form.brokerageAmount) / ufValue)}`
                          : undefined
                    }
                  />
                  <Select
                    id="broker-tax"
                    label="¿Cómo aparece la comisión en la cotización?"
                    value={form.brokerageTax}
                    onChange={set("brokerageTax")}
                    help={
                      form.brokerageTax === BROKERAGE_TAX.INCLUDED
                        ? "El porcentaje o monto ingresado ya contiene el IVA."
                        : "El IVA se sumará al porcentaje o monto ingresado."
                    }
                  >
                    <option value={BROKERAGE_TAX.ADDED}>+ IVA</option>
                    <option value={BROKERAGE_TAX.INCLUDED}>IVA incluido</option>
                  </Select>
                </div>
                <p>
                  Costo final de corretaje para quien compra:{" "}
                  <MoneyValue
                    valueUf={buyerBrokerage.finalUf}
                    ufValue={ufValue}
                    currencyMode={currencyMode}
                  />
                  .
                </p>
              </details>
            </fieldset>

            {newProperty && (
              <fieldset className="preoperational-form">
                <legend>Propiedad nueva: antes de que empiece a arrendarse</legend>
                <p className="input-note">
                  Cuéntanos cuándo pagarás y cuándo esperas recibir el primer
                  arriendo. El modelo ubicará esos pagos en el tiempo.
                </p>
                <h3>Precio y bono pie</h3>
                <div className="investment-field-grid">
                  <div className="investment-field">
                    <label htmlFor="reservation-date">Fecha de reserva o inicio de la evaluación</label>
                    <input id="reservation-date" type="date" value={form.reservationDate} onChange={(event) => set("reservationDate")(event.target.value)} data-private="true" />
                  </div>
                  <MoneyInput id="list-price" label="Precio de lista" valueUf={form.listPriceUf} onChangeUf={set("listPriceUf")} currencyMode={currencyMode} ufValue={ufValue} />
                  <MoneyInput id="written-price" label="Precio escriturado" valueUf={form.writtenPriceUf} onChangeUf={set("writtenPriceUf")} currencyMode={currencyMode} ufValue={ufValue} />
                  <Select id="bono-enabled" label="¿Existe bono pie?" value={form.bonoEnabled ? "yes" : "no"} onChange={(value) => set("bonoEnabled")(value === "yes")}>
                    <option value="no">No</option><option value="yes">Sí</option>
                  </Select>
                  {form.bonoEnabled && (
                    <>
                      <Select id="bono-type" label="¿Qué tipo de beneficio es?" value={form.bonoType} onChange={set("bonoType")} help="Si no está confirmado contractualmente, elige estructura desconocida.">
                        <option value="discount">Descuento real del precio</option>
                        <option value="down-payment">Aporte no reembolsable al pie</option>
                        <option value="unknown">Estructura desconocida</option>
                      </Select>
                      <Select id="bono-mode" label="Forma del bono" value={form.bonoAmountMode} onChange={set("bonoAmountMode")}>
                        <option value="fixed">Monto fijo</option><option value="percentage">Porcentaje</option>
                      </Select>
                      <Input id="bono-amount" label="Monto o porcentaje del bono" unit={form.bonoAmountMode === "percentage" ? "%" : form.bonoUnit.toUpperCase()} value={form.bonoAmount} onChange={set("bonoAmount")} min="0" />
                      {form.bonoAmountMode === "fixed" && (
                        <Select id="bono-unit" label="Unidad del bono" value={form.bonoUnit} onChange={set("bonoUnit")}>
                          <option value="uf">UF</option><option value="clp">CLP</option>
                        </Select>
                      )}
                      {form.bonoAmountMode === "percentage" && (
                        <Select id="bono-base" label="Base del porcentaje" value={form.bonoBase} onChange={set("bonoBase")}>
                          <option value="list-price">Precio de lista</option>
                          <option value="written-price">Precio escriturado</option>
                          <option value="total-down-payment">Pie total</option>
                        </Select>
                      )}
                      <Input id="bono-expiry" label="Mes de vencimiento del bono, opcional" value={form.bonoExpiryMonth} onChange={set("bonoExpiryMonth")} min="0" step="1" />
                      <Select id="bono-delay-loss" label="¿Se pierde si la escritura se atrasa?" value={form.bonoLossOnDelay} onChange={set("bonoLossOnDelay")}>
                        <option value="unknown">No sé</option><option value="yes">Sí</option><option value="no">No</option>
                      </Select>
                      <Select id="bono-bank" label="¿El banco conoce el bono?" value={form.bankKnowsBono} onChange={set("bankKnowsBono")}>
                        <option value="unknown">No sé</option><option value="yes">Sí</option><option value="no">No</option>
                      </Select>
                      <Select id="bono-promise" label="¿El bono aparece en la promesa?" value={form.bonoInPromise} onChange={set("bonoInPromise")}>
                        <option value="unknown">No sé</option><option value="yes">Sí</option><option value="no">No</option>
                      </Select>
                      <div className="investment-field">
                        <label htmlFor="bono-conditions">Otras condiciones del bono</label>
                        <textarea id="bono-conditions" rows="3" value={form.bonoConditions} onChange={(event) => set("bonoConditions")(event.target.value)} data-private="true" />
                      </div>
                    </>
                  )}
                </div>

                <h3>Entrega e inicio del arriendo</h3>
                <div className="investment-field-grid">
                  {futureDelivery && <Input id="delivery-months" label="Meses hasta entrega contractual" value={form.deliveryMonths} onChange={set("deliveryMonths")} min="0" step="1" />}
                  {futureDelivery && <Input id="delay-months" label="Meses adicionales de atraso" value={form.delayMonths} onChange={set("delayMonths")} min="0" step="1" />}
                  <Input id="delivery-writing" label="Meses entre entrega y escritura" value={form.deliveryToWritingMonths} onChange={set("deliveryToWritingMonths")} step="1" />
                  <Input id="writing-material" label="Meses entre escritura y entrega material" value={form.writingToMaterialMonths} onChange={set("writingToMaterialMonths")} min="0" step="1" />
                  <Input id="preparation-months" label="Meses de habilitación" value={form.preparationMonths} onChange={set("preparationMonths")} min="0" step="1" />
                  <Input id="tenant-search" label="Meses para encontrar arrendatario" value={form.tenantSearchMonths} onChange={set("tenantSearchMonths")} min="0" step="1" />
                  <Input id="first-rent-manual" label="Mes del primer arriendo, opcional" value={form.manualFirstRentMonth} onChange={set("manualFirstRentMonth")} min="0" step="1" help="Déjalo vacío para calcularlo desde entrega, escritura, habilitación y búsqueda." />
                  <Input id="first-mortgage-payment" label="Mes de la primera cuota hipotecaria" value={form.firstMortgagePaymentMonth} onChange={set("firstMortgagePaymentMonth")} min="0" step="1" />
                </div>

                <h3>Pago del pie en cuotas</h3>
                <div className="investment-field-grid">
                  <Select id="installments-enabled" label="¿El pie se paga en cuotas?" value={form.developerInstallments ? "yes" : "no"} onChange={(value) => set("developerInstallments")(value === "yes")}>
                    <option value="yes">Sí</option><option value="no">No</option>
                  </Select>
                  <MoneyInput id="reserve-payment" label="Reserva" valueUf={form.reserveUf} onChangeUf={set("reserveUf")} currencyMode={currencyMode} ufValue={ufValue} />
                  <MoneyInput id="promise-payment" label="Pago al firmar promesa" valueUf={form.promisePaymentUf} onChangeUf={set("promisePaymentUf")} currencyMode={currencyMode} ufValue={ufValue} />
                  {form.developerInstallments && (
                    <>
                      <Input id="installment-count" label="Número de cuotas mensuales" value={form.installmentCount} onChange={set("installmentCount")} min="1" step="1" />
                      <Input id="first-installment" label="Mes de la primera cuota" value={form.firstInstallmentMonth} onChange={set("firstInstallmentMonth")} min="0" step="1" />
                      <MoneyInput id="balloon" label="Cuota final o balón" valueUf={form.balloonUf} onChangeUf={set("balloonUf")} currencyMode={currencyMode} ufValue={ufValue} />
                      <Input id="balloon-month" label="Mes de la cuota balón" value={form.balloonMonth} onChange={set("balloonMonth")} min="0" step="1" />
                      {futureDelivery && (
                        <Select id="delay-rule" label="¿Qué ocurre con las cuotas si se atrasa la entrega?" value={form.delayRule} onChange={set("delayRule")}>
                          <option value="original">Continúan en las fechas originales</option>
                          <option value="extend">Se extienden al final</option>
                          <option value="suspend">Se desplazan durante el atraso</option>
                          <option value="pay-at-writing">El saldo se paga en la escritura</option>
                          <option value="unchanged">El calendario no cambia</option>
                          <option value="unknown">Condición desconocida</option>
                        </Select>
                      )}
                    </>
                  )}
                  <MoneyInput id="capital-available" label="Capital máximo disponible del comprador" valueUf={form.capitalAvailableUf} onChangeUf={set("capitalAvailableUf")} currencyMode={currencyMode} ufValue={ufValue} />
                </div>

                {preOperational?.applies && (
                  <div className="preoperational-preview">
                    <h3>Resumen antes del primer arriendo</h3>
                    <dl className="investment-metrics">
                      <Metric label="Precio económico efectivo" moneyUf={preOperational.economicPriceUf} ufValue={ufValue} currencyMode={currencyMode} />
                      <Metric label="Pie total" moneyUf={preOperational.totalDownPaymentUf} ufValue={ufValue} currencyMode={currencyMode} />
                      <Metric label="Pie efectivo del comprador" moneyUf={preOperational.effectiveDownPaymentUf} ufValue={ufValue} currencyMode={currencyMode} />
                      <Metric label="Cuota normal estimada" moneyUf={preOperational.developerSchedule.normalInstallmentUf} ufValue={ufValue} currencyMode={currencyMode} />
                      <Metric label="Mes estimado del primer arriendo" value={preOperational.firstRentMonth} />
                      <Metric label="Dividendos sin arriendo" moneyUf={preOperational.mortgageWithoutRentUf} ufValue={ufValue} currencyMode={currencyMode} />
                      <Metric label="Capital máximo acumulado" moneyUf={preOperational.maximumCashUf} ufValue={ufValue} currencyMode={currencyMode} />
                    </dl>
                    <div className="table-scroll">
                      <table>
                        <caption>Hitos y pagos aproximados antes del primer arriendo</caption>
                        <thead><tr><th>Hito o pago</th><th>Mes estimado</th><th>Monto</th></tr></thead>
                        <tbody>
                          {preOperational.payments.map((payment, index) => (
                            <tr key={`${payment.type}-${payment.month}-${index}`}><th>{payment.type}</th><td>{payment.month}</td><td><MoneyValue valueUf={payment.amountUf} ufValue={ufValue} currencyMode={currencyMode} /></td></tr>
                          ))}
                          <tr><th>Entrega contractual</th><td>{preOperational.deliveryMonth}</td><td>—</td></tr>
                          <tr><th>Entrega ajustada</th><td>{preOperational.adjustedDeliveryMonth}</td><td>—</td></tr>
                          <tr><th>Escritura</th><td>{preOperational.writingMonth}</td><td>—</td></tr>
                          <tr><th>Primer arriendo</th><td>{preOperational.firstRentMonth}</td><td>—</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </fieldset>
            )}

            <fieldset>
              <legend>2. Arriendo y meses sin arrendatario</legend>
              {mode === "comparable" && (
                <div className="comparable-box">
                  <div className="investment-field-grid">
                    <MoneyInput
                      id="comparable-price"
                      label="Precio del comparable"
                      valueUf={form.comparablePriceUf}
                      onChangeUf={set("comparablePriceUf")}
                      currencyMode={currencyMode}
                      ufValue={ufValue}
                      min="1"
                    />
                    <MoneyInput
                      id="comparable-rent"
                      label="Arriendo mensual comparable"
                      valueUf={form.comparableRentUf}
                      onChangeUf={set("comparableRentUf")}
                      currencyMode={currencyMode}
                      ufValue={ufValue}
                    />
                  </div>
                  <p>
                    Arriendo implícito del inmueble evaluado:{" "}
                    <strong>
                      <MoneyValue
                        valueUf={comparableRent}
                        ufValue={ufValue}
                        currencyMode={currencyMode}
                      />
                    </strong>{" "}
                    al mes.
                  </p>
                  <p>
                    Este arriendo se deriva de una relación precio/arriendo
                    simplificada. No reemplaza un estudio de mercado de la
                    unidad específica.
                  </p>
                </div>
              )}
              <div className="investment-field-grid">
                {mode !== "comparable" && (
                  <MoneyInput
                    id="rent"
                    label="¿Cuánto podrías cobrar al mes?"
                    valueUf={form.monthlyRentUf}
                    onChangeUf={set("monthlyRentUf")}
                    currencyMode={currencyMode}
                    ufValue={ufValue}
                  />
                )}
                <Input
                  id="occupancy"
                  label="¿Qué porcentaje del año esperas tenerlo arrendado?"
                  unit="%"
                  value={form.occupancyRate}
                  onChange={set("occupancyRate")}
                  min="0"
                  max="100"
                  helpConcept="occupancy"
                  help={`Una ocupación de ${form.occupancyRate}% equivale aproximadamente a ${(12 * pct(form.occupancyRate)).toLocaleString("es-CL", { maximumFractionDigits: 1 })} meses arrendados por año, pero la vacancia real puede concentrarse en periodos completos.`}
                />
                <Input
                  id="rent-growth"
                  label="¿Cuánto esperas que suba el arriendo además del reajuste de la UF?"
                  unit="%"
                  value={form.rentGrowthRate}
                  onChange={set("rentGrowthRate")}
                  min="-100"
                  help="Real significa que el crecimiento se mide por encima de la variación de la UF."
                />
              </div>
            </fieldset>

            <fieldset>
              <legend>3. Gastos de mantener la propiedad</legend>
              <div className="investment-field-grid">
                <MoneyInput
                  id="common"
                  label="¿Cuánto es el gasto común mensual?"
                  valueUf={form.monthlyCommonExpenseUf}
                  onChangeUf={set("monthlyCommonExpenseUf")}
                  currencyMode={currencyMode}
                  ufValue={ufValue}
                />
                <Input
                  id="owner-occupied"
                  label="¿Qué parte pagas tú cuando está arrendado?"
                  unit="%"
                  value={form.ownerCommonShareOccupied}
                  onChange={set("ownerCommonShareOccupied")}
                  min="0"
                  max="100"
                />
                <Input
                  id="owner-vacant"
                  label="¿Qué parte pagas tú cuando está desocupado?"
                  unit="%"
                  value={form.ownerCommonShareVacant}
                  onChange={set("ownerCommonShareVacant")}
                  min="0"
                  max="100"
                />
                <Input
                  id="maintenance"
                  label="¿Qué porcentaje reservarás para mantenciones?"
                  unit="%"
                  value={form.maintenanceRate}
                  onChange={set("maintenanceRate")}
                  min="0"
                />
                <Input
                  id="administration"
                  label="¿Qué porcentaje pagarás por administración?"
                  unit="%"
                  value={form.administrationRate}
                  onChange={set("administrationRate")}
                  min="0"
                />
                <MoneyInput
                  id="contributions"
                  label="¿Cuánto pagarás de contribuciones al año?"
                  valueUf={form.contributionsAnnualUf}
                  onChangeUf={set("contributionsAnnualUf")}
                  currencyMode={currencyMode}
                  ufValue={ufValue}
                />
                <MoneyInput
                  id="landlord-insurance"
                  label="¿Cuánto pagarás de seguros al año?"
                  valueUf={form.landlordInsuranceAnnualUf}
                  onChangeUf={set("landlordInsuranceAnnualUf")}
                  currencyMode={currencyMode}
                  ufValue={ufValue}
                />
                <MoneyInput
                  id="other-operation"
                  label="¿Qué otros gastos crees que tendrás al año?"
                  valueUf={form.otherOperatingAnnualUf}
                  onChangeUf={set("otherOperatingAnnualUf")}
                  currencyMode={currencyMode}
                  ufValue={ufValue}
                />
              </div>
            </fieldset>

            <fieldset>
              <legend>4. Qué pasa después</legend>
              <div className="investment-field-grid">
                <Input
                  id="appreciation"
                  label="¿Cuánto esperas que suba el valor de la propiedad además de la UF?"
                  unit="%"
                  value={form.appreciationRate}
                  onChange={set("appreciationRate")}
                  min="-100"
                  helpConcept="appreciation"
                />
                <Input
                  id="horizon"
                  label="¿Cuántos años quieres proyectar?"
                  unit="años"
                  value={form.horizonYears}
                  onChange={set("horizonYears")}
                  min="1"
                  max="50"
                  step="1"
                />
                <Input
                  id="sale-year"
                  label="¿En qué año quieres comparar vender con seguir arrendando?"
                  unit="año"
                  value={form.saleYear}
                  onChange={set("saleYear")}
                  min="1"
                  max={form.horizonYears}
                  step="1"
                />
                <Input
                  id="sale-cost"
                  label="Comisión de venta corredor de propiedades IVA incluido"
                  unit="%"
                  value={form.saleCostRate}
                  onChange={set("saleCostRate")}
                  min="0"
                  max="100"
                />
                <MoneyInput
                  id="sale-fixed"
                  label="Costos por arreglos para vender la vivienda"
                  valueUf={form.fixedSaleCostsUf}
                  onChangeUf={set("fixedSaleCostsUf")}
                  currencyMode={currencyMode}
                  ufValue={ufValue}
                />
              </div>
              <div className="opportunity-box">
                <div className="opportunity-heading">
                  <div>
                    <h3>
                      ¿Cuál es la mejor alternativa que realmente considerarías?
                    </h3>
                    <p>
                      Elige un patrón comprensible o configura tu propia tasa.
                      La herramienta expresa los retornos que incluyen inflación
                      como UF + tasa.
                    </p>
                  </div>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => loadOpportunityData(true)}
                  >
                    <RefreshCw size={15} /> Actualizar referencias
                  </button>
                </div>
                <Select
                  id="opportunity-instrument"
                  className={
                    opportunitySelection === "custom"
                      ? "custom-rate-selected"
                      : ""
                  }
                  label="Alternativa de inversión"
                  value={opportunitySelection}
                  onChange={chooseOpportunity}
                  help={
                    opportunityData.status === "loading"
                      ? "Consultando fuentes oficiales…"
                      : opportunityData.status === "unavailable"
                        ? "Las referencias automáticas no están disponibles; usa una tasa personalizada."
                        : "Cada depósito identifica institución fuente, universo y plazo. Puedes compararlo con una Cuenta 2 o personalizar la tasa."
                  }
                >
                  {opportunityData.alternatives.some(
                    (item) => item.kind === "deposit",
                  ) && (
                    <optgroup label="Depósitos a plazo">
                      {opportunityData.alternatives
                        .filter((item) => item.kind === "deposit")
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label} ·{" "}
                            {item.basis === "real-uf"
                              ? ufPlusLabel(item.annualRate)
                              : `${rateNumberLabel(item.annualRate)}% en pesos`}
                          </option>
                        ))}
                    </optgroup>
                  )}
                  {opportunityData.alternatives.some(
                    (item) => item.kind === "cuenta2",
                  ) && (
                    <optgroup label="Cuenta 2 (referencia histórica del fondo)">
                      {opportunityData.alternatives
                        .filter((item) => item.kind === "cuenta2")
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label} · {ufPlusLabel(item.annualRate)}
                          </option>
                        ))}
                    </optgroup>
                  )}
                  <option
                    className="custom-rate-option"
                    style={{ fontWeight: 800 }}
                    value="custom"
                  >
                    Personalizar tasa y unidad
                  </option>
                </Select>
                {selectedAlternative && (
                  <article className="opportunity-reference">
                    <div>
                      <span>Referencia seleccionada</span>
                      <strong>
                        {selectedAlternative.basis === "nominal-clp"
                          ? `${rateNumberLabel(selectedAlternative.annualRate, 2)}% anual en pesos`
                          : `${ufPlusLabel(selectedAlternative.annualRate, 2)} anual`}
                      </strong>
                    </div>
                    <p>{selectedAlternative.detail}</p>
                    <small>
                      Fuente:{" "}
                      <a
                        href={selectedAlternative.source.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {selectedAlternative.source.name}
                      </a>{" "}
                      · dato de{" "}
                      {sourceDateLabel(
                        selectedAlternative.source.effectiveDate,
                      )}
                      .
                    </small>
                  </article>
                )}
                {opportunitySelection === "custom" && (
                  <div className="investment-field-grid">
                    <Input
                      id="opportunity"
                      label="Si no compraras, ¿cuánto podría rendir ese dinero al año?"
                      unit="%"
                      value={form.opportunityCostRate}
                      onChange={set("opportunityCostRate")}
                      min="-99"
                      helpConcept="opportunityRate"
                    />
                    <Select
                      id="opportunity-basis"
                      label="¿Cómo está expresado el retorno?"
                      value={form.opportunityRateBasis}
                      onChange={set("opportunityRateBasis")}
                      help="Una tasa en pesos suele incluir inflación. UF + tasa ya queda expresada por encima de la inflación."
                    >
                      <option value="nominal-clp">Porcentaje en pesos</option>
                      <option value="real-uf">UF + porcentaje ingresado</option>
                    </Select>
                  </div>
                )}
                {form.opportunityRateBasis === "nominal-clp" && (
                  <div className="inflation-reference">
                    <Input
                      id="expected-inflation"
                      label="Inflación anual esperada para hacer comparable la tasa"
                      unit="%"
                      value={form.expectedInflationRate}
                      onChange={(value) => {
                        set("expectedInflationRate")(value);
                        setInflationMode("manual");
                      }}
                      min="-99"
                      help="Convierte una tasa nominal en su equivalente UF + tasa; no proyecta el precio futuro de la propiedad."
                    />
                    {opportunityData.inflation && (
                      <p>
                        {inflationMode === "automatic"
                          ? "Dato automático"
                          : "Valor modificado"}
                        : mediana de inflación a 11 meses de la Encuesta de
                        Expectativas Económicas.{" "}
                        <a
                          href={opportunityData.inflation.source.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Banco Central de Chile
                        </a>
                        ,{" "}
                        {sourceDateLabel(
                          opportunityData.inflation.source.effectiveDate,
                        )}
                        .
                        {inflationMode === "manual" && (
                          <button
                            type="button"
                            className="text-button"
                            onClick={restoreAutomaticInflation}
                          >
                            Restaurar dato oficial
                          </button>
                        )}
                      </p>
                    )}
                  </div>
                )}
                <p className="conversion-note">
                  Para comparar con los flujos de la propiedad, la herramienta
                  usará un retorno equivalente de{" "}
                  <strong>{ufPlusLabel(realOpportunityRate * 100, 2)}</strong>
                  {form.opportunityRateBasis === "nominal-clp"
                    ? `, calculado desde ${form.opportunityCostRate}% en pesos y ${form.expectedInflationRate}% de inflación esperada`
                    : ""}
                  .
                </p>
                {opportunityData.caveat && (
                  <p className="opportunity-caveat">
                    <ShieldCheck size={16} /> {opportunityData.caveat}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="text-button"
                aria-expanded={showAdvanced}
                onClick={() => setShowAdvanced((value) => !value)}
              >
                {showAdvanced ? "Ocultar" : "Mostrar"} supuestos avanzados
              </button>
              {showAdvanced && (
                <div className="investment-field-grid advanced-fields">
                  <Input
                    id="perpetual"
                    label="Crecimiento perpetuo del ingreso operativo neto"
                    unit="% real"
                    value={form.perpetualGrowthRate}
                    onChange={set("perpetualGrowthRate")}
                  />
                  <Select
                    id="prepayment-mode"
                    label="Comisión de prepago del crédito"
                    value={form.prepaymentMode}
                    onChange={set("prepaymentMode")}
                    help="La estimación UF usa 1,5 meses de intereses sobre el saldo que se extingue al vender."
                  >
                    <option value="automatic-uf">
                      Estimar crédito UF: 1,5 meses de interés
                    </option>
                    <option value="confirmed">
                      Usar monto informado por el banco
                    </option>
                    <option value="none">Sin comisión, confirmado</option>
                  </Select>
                  {form.prepaymentMode === "confirmed" && (
                    <MoneyInput
                      id="prepayment"
                      label="Comisión de prepago informada"
                      valueUf={form.prepaymentCostUf}
                      onChangeUf={set("prepaymentCostUf")}
                      currencyMode={currencyMode}
                      ufValue={ufValue}
                      help="Usa el certificado de liquidación o cotización de prepago del banco."
                    />
                  )}
                  <MoneyInput
                    id="prepayment-minimum"
                    label="Monto mínimo contractual de prepago parcial, opcional"
                    valueUf={form.prepaymentMinimumUf}
                    onChangeUf={set("prepaymentMinimumUf")}
                    currencyMode={currencyMode}
                    ufValue={ufValue}
                    help="Regístralo para tu revisión. El escenario de venta supone prepago total; por ley, pagos parciales inferiores al 10% del saldo requieren consentimiento del acreedor."
                  />
                  <Input
                    id="capex-year"
                    label="Reparación mayor de la vivienda"
                    unit="año"
                    value={form.capexYear}
                    onChange={set("capexYear")}
                    min="1"
                    step="1"
                  />
                  <MoneyInput
                    id="capex"
                    label="Costos de la reparación mayor"
                    valueUf={form.capexAmountUf}
                    onChangeUf={set("capexAmountUf")}
                    currencyMode={currencyMode}
                    ufValue={ufValue}
                  />
                </div>
              )}
            </fieldset>
            <div className="form-actions">
              <button
                type="button"
                className="button button--secondary"
                onClick={resetForm}
              >
                <RotateCcw size={16} /> Restablecer datos de inversión
              </button>
            </div>
          </div>

          <aside className="investment-results" aria-live="polite">
            {!result ? (
              <div className="empty-result">
                <Calculator size={30} />
                <h2>Completa supuestos válidos</h2>
                <p>Los resultados aparecerán aquí sin enviar tus datos.</p>
              </div>
            ) : (
              <>
                <div className="result-heading">
                  <div>
                    <p className="result-heading__label">Resultado de tu simulación</p>
                    <h2>
                      <button
                        type="button"
                        className="result-heading__decision"
                        onClick={goToFinalSummary}
                        aria-label={`${initialDecisionLabel}. Ir a la explicación y al resumen final del escenario`}
                      >
                        <span>{initialDecisionLabel}</span>
                        <small>Ver explicación y resumen final ↓</small>
                      </button>
                    </h2>
                    <p className="result-heading__note">
                      Estimación antes de impuestos personales.
                    </p>
                  </div>
                </div>
                <dl className="investment-metrics investment-metrics--primary">
                  <Metric
                    label="Dinero que necesitas poner al comienzo"
                    moneyUf={result.initialEquityUf}
                    ufValue={ufValue}
                    currencyMode={currencyMode}
                    detail="Incluye pie y los gastos iniciales que ingresaste."
                    helpConcept="initialMoney"
                    helpLabel="¿Qué incluye el dinero inicial?"
                  />
                  {preOperational?.applies && (
                    <Metric
                      label="Máximo dinero que tendrías que haber puesto antes del primer arriendo"
                      moneyUf={preOperational.maximumCashUf}
                      ufValue={ufValue}
                      currencyMode={currencyMode}
                      detail="Considera los pagos acumulados durante la espera."
                    />
                  )}
                  <Metric
                    label={
                      firstYearCashUf < 0
                        ? "Dinero que tendrías que aportar durante el primer año"
                        : "Dinero que te quedaría durante el primer año"
                    }
                    moneyUf={Math.abs(firstYearCashUf)}
                    ufValue={ufValue}
                    currencyMode={currencyMode}
                    detail={
                      firstYearCashUf >= 0
                        ? "Excedente estimado antes de impuestos personales; no es una ganancia garantizada."
                        : "Aporte adicional estimado para cubrir la operación y el crédito."
                    }
                    helpConcept="firstYearCash"
                    helpLabel="¿Cómo se calcula el primer año?"
                  />
                  <Metric
                    label="Comparación con tu otra alternativa"
                    moneyUf={Math.abs(comparisonUf)}
                    ufValue={ufValue}
                    currencyMode={currencyMode}
                    detail={
                      Math.abs(comparisonUf) < 0.01
                        ? "Las dos opciones quedan prácticamente igualadas bajo estos supuestos."
                        : comparisonUf > 0
                          ? "La propiedad supera a la alternativa por este valor estimado a dinero de hoy."
                          : "La alternativa supera a la propiedad por este valor estimado a dinero de hoy."
                    }
                    helpConcept={preOperational?.applies ? "adjustedPresentValue" : "presentValue"}
                    helpLabel="¿Cómo se hace la comparación?"
                  />
                </dl>
                <details className="advanced-results">
                  <summary>Ver indicadores financieros avanzados</summary>
                  <p>
                    Estos indicadores permiten revisar el cálculo con más
                    detalle. No necesitas entenderlos para leer el resultado
                    principal.
                  </p>
                  <dl className="investment-metrics">
                    {preOperational?.applies && (
                      <>
                        <Metric label="Resultado total desde hoy (VPN ajustado)" moneyUf={preOperational.adjustedNpvUf} ufValue={ufValue} currencyMode={currencyMode} />
                        <Metric label="Valor presente de pagos antes del arriendo" moneyUf={preOperational.presentValuePaymentsUf} ufValue={ufValue} currencyMode={currencyMode} />
                        <Metric
                          label="Te alcanza el dinero que dijiste que tienes"
                          value={preOperational.liquidityBufferUf == null ? "Ingresa el capital disponible" : preOperational.liquidityBufferUf >= 0 ? "Sí" : "No"}
                          detail={preOperational.liquidityBufferUf == null ? undefined : `${summaryMoney(Math.abs(preOperational.liquidityBufferUf))} de ${preOperational.liquidityBufferUf >= 0 ? "margen" : "faltante"}.`}
                        />
                      </>
                    )}
                    <Metric label="Ingreso operativo neto (NOI), año 1" moneyUf={result.annualProjection[0].noiUf} ufValue={ufValue} currencyMode={currencyMode} detail="Excluye crédito y renovaciones importantes." helpConcept="operatingIncome" helpLabel="Explicación del ingreso después de gastos" />
                    <Metric label="Pago del crédito, año 1" moneyUf={result.annualProjection[0].debtServiceUf} ufValue={ufValue} currencyMode={currencyMode} />
                    <Metric label="Valor presente neto (VPN) operativo" moneyUf={result.npvUf} ufValue={ufValue} currencyMode={currencyMode} detail={`Usa una alternativa de ${ufPlusLabel(realOpportunityRate * 100, 2)}.`} helpConcept="presentValue" helpLabel="Explicación del valor presente" />
                    <Metric label="Tasa interna de retorno (TIR)" value={result.irr.value == null ? "No es posible calcular una rentabilidad única con estos flujos" : formatPercent(result.irr.value)} detail={result.irr.status === "multiple-roots-possible" ? "Puede existir más de un resultado; no la interpretes de forma aislada." : undefined} helpConcept="irr" helpLabel="Explicación de la tasa interna" />
                    <Metric label="Tasa interna de retorno modificada (MIRR)" value={result.mirr == null ? "No se puede calcular con estos flujos" : formatPercent(result.mirr)} helpConcept="mirr" helpLabel="Explicación de la tasa modificada" />
                    <Metric label="Retorno sobre efectivo invertido" value={result.cashOnCashReturn == null ? "No se puede calcular" : formatPercent(result.cashOnCashReturn)} helpConcept="cashReturn" helpLabel="Explicación del retorno sobre efectivo" />
                    <Metric label="Cobertura del servicio de deuda (DSCR)" value={result.dscr == null ? form.financingRatio === 0 ? "No aplica: la compra no usa crédito" : "No se puede calcular" : `${result.dscr.toLocaleString("es-CL", { maximumFractionDigits: 2 })}×`} detail={result.dscr != null && result.dscr < 1 ? "El arriendo no cubre por completo el crédito bajo estos supuestos." : undefined} helpConcept="debtCoverage" helpLabel="Explicación de la cobertura del crédito" />
                    <Metric label="Rentabilidad del ingreso operativo neto" value={formatPercent(result.netOperatingYield)} helpConcept="operatingYield" helpLabel="Explicación de la rentabilidad operativa" />
                  </dl>
                </details>
                <section className="terminal-comparison">
                  <header className="terminal-comparison__header">
                    <p>Decisión en el año {result.saleYear}</p>
                    <h3>
                      ¿Qué opción te dejaría más dinero al año{" "}
                      {result.comparisonYear}?
                    </h3>
                  </header>
                  <div className="terminal-options">
                    <article className="terminal-option">
                      <span className="terminal-option__label">
                        Si vendes e inviertes en tu mejor alternativa
                      </span>
                      <strong>
                        <MoneyValue
                          valueUf={result.sellAndInvestTerminalWealthUf}
                          ufValue={ufValue}
                          currencyMode={currencyMode}
                        />
                      </strong>
                      <small>
                        Dinero estimado al año {result.comparisonYear} después
                        de invertir por {result.comparisonYear - result.saleYear}{" "}
                        años el monto neto de la venta, con una rentabilidad de{" "}
                        {ufPlusLabel(realOpportunityRate * 100, 2)}.
                      </small>
                    </article>
                    <article className="terminal-option">
                      <span className="terminal-option__label">Si sigues arrendando</span>
                      <strong>
                        <MoneyValue
                          valueUf={result.holdUntilHorizonTerminalWealthUf}
                          ufValue={ufValue}
                          currencyMode={currencyMode}
                        />
                      </strong>
                      <small>
                        Dinero estimado al año {result.comparisonYear}: incluye
                        los flujos por arriendo desde el año {result.saleYear + 1},
                        reinvertidos, más el dinero neto de vender la propiedad
                        al final.
                      </small>
                    </article>
                  </div>
                  {!Number.isFinite(result.terminalWealthDifferenceUf) ? (
                    <div className="terminal-verdict terminal-verdict--unavailable">
                      No es posible valorar la continuidad con estos supuestos.
                    </div>
                  ) : (
                    <div className="terminal-verdict">
                      <p className="terminal-verdict__sentence">
                        <strong>
                          {result.terminalWealthDifferenceUf >= 0
                            ? "Vender e invertir en tu mejor alternativa"
                            : "Seguir arrendando"}
                        </strong>{" "}
                        en vez de{" "}
                        {result.terminalWealthDifferenceUf >= 0
                          ? "seguir arrendando"
                          : "vender e invertir en tu mejor alternativa"}{" "}
                        desde el año {result.saleYear}, te llevaría el año{" "}
                        {result.comparisonYear} a tener una mayor riqueza, igual
                        a:
                      </p>
                      <div className="terminal-verdict__value">
                        <MoneyValue
                          valueUf={Math.abs(result.terminalWealthDifferenceUf)}
                          ufValue={ufValue}
                          currencyMode={currencyMode}
                        />
                        <TechnicalHelp
                          concept="saleVsHoldValue"
                          label="¿Cómo se calcula esta comparación?"
                        />
                      </div>
                    </div>
                  )}
                </section>
                {mode === "break-even" && breakEvens && (
                  <section className="break-even-panel">
                    <h3>
                      Condiciones de equilibrio del valor presente neto de venta
                    </h3>
                    <dl>
                      <SolverMoneyMetric
                        label="Arriendo mensual"
                        result={breakEvens.rent}
                        ufValue={ufValue}
                        currencyMode={currencyMode}
                      />
                      <Metric
                        label="Ocupación mínima"
                        value={solverLabel(breakEvens.occupancy, (value) =>
                          formatPercent(value),
                        )}
                      />
                      <SolverMoneyMetric
                        label="Precio de compra"
                        result={breakEvens.price}
                        ufValue={ufValue}
                        currencyMode={currencyMode}
                      />
                      <Metric
                        label="Tasa hipotecaria máxima"
                        value={solverLabel(breakEvens.interest, (value) =>
                          formatPercent(value),
                        )}
                      />
                      <Metric
                        label="Capital inicial límite"
                        moneyUf={breakEvens.maximumInitialCapitalUf}
                        ufValue={ufValue}
                        currencyMode={currencyMode}
                        detail="Valor presente máximo de los flujos del escenario; no es una aprobación crediticia."
                      />
                      <Metric
                        label="Retorno de indiferencia entre venta y continuidad"
                        value={solverLabel(breakEvens.indifference, (value) =>
                          ufPlusLabel(value * 100, 2),
                        )}
                      />
                    </dl>
                  </section>
                )}
                <div className="result-actions">
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={copy}
                  >
                    <Copy size={16} /> Copiar resumen
                  </button>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => {
                      window.print();
                      trackEvent("investment_summary_printed", {
                        tool: "investment",
                      });
                    }}
                  >
                    <Printer size={16} /> Imprimir
                  </button>
                </div>
                {message && (
                  <p className="copy-status" role="status">
                    {message}
                  </p>
                )}
              </>
            )}
          </aside>
        </section>

        {result && (
          <section className="investment-analysis">
            <div className="section-title">
              <p className="eyebrow">Prueba otros supuestos</p>
              <h2>Qué puede cambiar el resultado</h2>
              <p>
                Comparamos tres versiones de la misma compra. Solo cambian el
                arriendo, los meses arrendados o el valor futuro de la
                propiedad. Estos escenarios no predicen el futuro.
              </p>
            </div>
            {deliveryScenarios.length > 0 && (
              <section className="sensitivity-section preoperational-scenarios">
                <h3>Escenarios de atraso antes del primer arriendo</h3>
                <p>
                  Comparación aproximada de la fecha contractual y atrasos de 3,
                  6 y 12 meses. La operación anual posterior no se reconstruye.
                </p>
                <div className="table-scroll">
                  <table>
                    <caption>Impacto del atraso y posible pérdida del bono</caption>
                    <thead>
                      <tr><th>Escenario</th><th>Primer arriendo</th><th>Estado del bono</th><th>Máximo dinero acumulado</th><th>Cuotas pagadas antes de recibir arriendo</th><th>Resultado total desde hoy</th></tr>
                    </thead>
                    <tbody>
                      {deliveryScenarios.map(({ delayMonths, result: scenario }) => (
                        <tr key={delayMonths}>
                          <th>{delayMonths === 0 ? "Fecha contractual" : `Atraso de ${delayMonths} meses`}</th>
                          <td>Mes {scenario.firstRentMonth}</td>
                          <td>{scenario.bonoStatus}</td>
                          <td><MoneyValue valueUf={scenario.maximumCashUf} ufValue={ufValue} currencyMode={currencyMode} /></td>
                          <td><MoneyValue valueUf={scenario.mortgageWithoutRentUf} ufValue={ufValue} currencyMode={currencyMode} /></td>
                          <td><MoneyValue valueUf={scenario.adjustedNpvUf} ufValue={ufValue} currencyMode={currencyMode} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>
                  Atraso máximo aproximado antes de que la comparación con tu
                  alternativa pase a ser negativa:{" "}
                  <strong>{tolerableDelay == null ? "no encontrado" : `${tolerableDelay} meses`}</strong>.
                </p>
              </section>
            )}
            <div className="scenario-comparison">
              {scenarios.map((scenario) => {
                const scenarioOccupancy =
                  scenario.overrides.occupancyRate ?? inputs.occupancyRate;
                const scenarioRent =
                  scenario.overrides.monthlyRentUf ?? inputs.monthlyRentUf;
                const scenarioAppreciation =
                  scenario.overrides.appreciationRate ?? inputs.appreciationRate;
                const comparison = scenario.result.npvUf;
                const firstYear =
                  scenario.result.annualProjection[0].preTaxCashFlowUf;
                return (
                  <article key={scenario.id} className={`scenario-card scenario-card--${scenario.id}`}>
                    <h3>{scenario.name}</h3>
                    <p className="scenario-card__description">
                      {scenario.id === "cautious"
                        ? "Prueba menos meses arrendados y un menor valor futuro de la propiedad."
                        : scenario.id === "favorable"
                          ? "Prueba más meses arrendados, un arriendo mayor y un mayor valor futuro."
                          : "Usa exactamente los datos que ingresaste."}
                    </p>
                    <dl className="scenario-assumptions">
                      <div>
                        <dt>Meses arrendados</dt>
                        <dd>
                          {(12 * scenarioOccupancy).toLocaleString("es-CL", {
                            maximumFractionDigits: 1,
                          })} de 12 ({formatPercent(scenarioOccupancy)})
                        </dd>
                      </div>
                      <div>
                        <dt>Arriendo mensual</dt>
                        <dd><MoneyValue valueUf={scenarioRent} ufValue={ufValue} currencyMode={currencyMode} /></dd>
                      </div>
                      <div>
                        <dt>Cambio anual del valor, además de la UF</dt>
                        <dd>{formatPercent(scenarioAppreciation)}</dd>
                      </div>
                    </dl>
                    <dl className="scenario-results">
                      <Metric
                        label={comparison >= 0 ? "La propiedad sería mejor que la otra inversión por" : "La otra inversión sería mejor que la propiedad por"}
                        moneyUf={Math.abs(comparison)}
                        ufValue={ufValue}
                        currencyMode={currencyMode}
                        detail="Diferencia estimada a valor de hoy; no es dinero disponible en tu cuenta."
                      />
                      <Metric
                        label={firstYear < 0 ? "Tú aportarías el primer año" : "Tú recibirías el primer año"}
                        moneyUf={Math.abs(firstYear)}
                        ufValue={ufValue}
                        currencyMode={currencyMode}
                      />
                      <Metric
                        label="Dinero necesario al comienzo"
                        moneyUf={scenario.result.initialEquityUf}
                        ufValue={ufValue}
                        currencyMode={currencyMode}
                        detail="No cambia porque el precio, el crédito y los gastos de compra son iguales en los tres escenarios."
                      />
                    </dl>
                  </article>
                );
              })}
            </div>
            <section className="sensitivity-section">
              <h3>
                Qué pasa si cambia la ocupación o el valor de la propiedad
              </h3>
              <div className="table-scroll">
                <table>
                  <caption>
                    Comparación con tu otra alternativa. Filas: ocupación.
                    Columnas: cambio anual del valor de la propiedad por encima
                    de la UF.
                  </caption>
                  <thead>
                    <tr>
                      <th>Ocupación</th>
                      {[
                        inputs.appreciationRate - 0.02,
                        inputs.appreciationRate,
                        inputs.appreciationRate + 0.02,
                      ].map((value) => (
                        <th key={value}>{formatPercent(value)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sensitivity.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <th>
                          {formatPercent(
                            [
                              Math.max(0, inputs.occupancyRate - 0.1),
                              inputs.occupancyRate,
                              Math.min(1, inputs.occupancyRate + 0.05),
                            ][rowIndex],
                          )}
                        </th>
                        {row.map((value, columnIndex) => (
                          <td
                            key={columnIndex}
                            className={
                              value < 0 ? "negative-value" : "positive-value"
                            }
                          >
                            <MoneyValue
                              valueUf={value}
                              ufValue={ufValue}
                              currencyMode={currencyMode}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="sensitivity-section">
              <h3>Qué podría cambiar el resultado</h3>
              <div className="table-scroll">
                <table>
                  <caption>
                    Resultado al modificar un supuesto y mantener todos los
                    demás sin cambios.
                  </caption>
                  <thead>
                    <tr>
                      <th>Cambio probado</th>
                      <th>Resultado</th>
                      <th>Diferencia frente a tu escenario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driverSensitivity.map(([label, value]) => (
                      <tr key={label}>
                        <th>{label}</th>
                        <td>
                          <MoneyValue
                            valueUf={value}
                            ufValue={ufValue}
                            currencyMode={currencyMode}
                          />
                        </td>
                        <td>
                          <MoneyValue
                            valueUf={value - result.npvUf}
                            ufValue={ufValue}
                            currencyMode={currencyMode}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <ProjectionChart rows={result.annualProjection} />
            <button
              className="button button--secondary"
              type="button"
              aria-expanded={showProjection}
              onClick={() => {
                setShowProjection((value) => !value);
                trackEvent("investment_projection_opened", {
                  tool: "investment",
                  status: showProjection ? "closed" : "opened",
                });
              }}
            >
              <BarChart3 size={17} />{" "}
              {showProjection ? "Ocultar qué pasa cada año" : "Ver qué pasa cada año"}
            </button>
            {showProjection && (
              <div className="projection-tables">
                <SimpleProjectionTable rows={result.annualProjection} saleYear={result.saleYear} ufValue={ufValue} currencyMode={currencyMode} />
                <details className="detailed-table">
                  <summary>Ver tabla financiera detallada</summary>
                  <ProjectionTable rows={result.annualProjection} saleYear={result.saleYear} ufValue={ufValue} currencyMode={currencyMode} />
                </details>
              </div>
            )}
          </section>
        )}

        {result && (
          preOperational?.applies && (
            <section className="investment-decision preoperational-summary">
              <p className="eyebrow">Resumen de propiedad nueva</p>
              <div className="decision-grid">
                <article>
                  <h3>Resumen antes del primer arriendo</h3>
                  <dl>
                    <div><dt>Estado del proyecto</dt><dd>{form.propertyKind.replaceAll("-", " ")}</dd></div>
                    <div><dt>Entrega y atraso</dt><dd>Mes {preOperational.deliveryMonth} + {preOperational.delayMonths} meses</dd></div>
                    <div><dt>Escritura / primer arriendo</dt><dd>Mes {preOperational.writingMonth} / mes {preOperational.firstRentMonth}</dd></div>
                    <div><dt>Pie total / efectivo</dt><dd><MoneyValue valueUf={preOperational.totalDownPaymentUf} ufValue={ufValue} currencyMode={currencyMode} /> / <MoneyValue valueUf={preOperational.effectiveDownPaymentUf} ufValue={ufValue} currencyMode={currencyMode} /></dd></div>
                    <div><dt>Bono</dt><dd>{preOperational.bonoStatus} · <MoneyValue valueUf={preOperational.bono.announcedUf} ufValue={ufValue} currencyMode={currencyMode} /></dd></div>
                    <div><dt>Pagos realizados antes de recibir arriendo</dt><dd><MoneyValue valueUf={preOperational.nominalPaidBeforeRentUf} ufValue={ufValue} currencyMode={currencyMode} /></dd></div>
                    <div><dt>Máximo dinero que tendrías que haber puesto antes del primer arriendo</dt><dd><MoneyValue valueUf={preOperational.maximumCashUf} ufValue={ufValue} currencyMode={currencyMode} /></dd></div>
                    <div><dt>Te alcanza el dinero que dijiste que tienes</dt><dd>{preOperational.liquidityBufferUf == null ? "Ingresa tu capital disponible" : preOperational.liquidityBufferUf >= 0 ? "Sí" : "No"}</dd></div>
                    <div><dt>El bono se perdería por atraso</dt><dd>{preOperational.bonoExpired ? "Sí" : "No según los datos ingresados"}</dd></div>
                  </dl>
                </article>
                <article>
                  <h3>Desde que comienza el arriendo</h3>
                  <dl>
                    <div><dt>Arriendo y ocupación</dt><dd><MoneyValue valueUf={monthlyRent} ufValue={ufValue} currencyMode={currencyMode} /> · {form.occupancyRate}%</dd></div>
                    <div><dt>Arriendo después de gastos normales, año 1</dt><dd><MoneyValue valueUf={result.annualProjection[0].noiUf} ufValue={ufValue} currencyMode={currencyMode} /></dd></div>
                    <div><dt>Cuánto del crédito cubre el arriendo</dt><dd>{result.dscr == null ? "No aplica" : `${result.dscr.toLocaleString("es-CL", { maximumFractionDigits: 2 })}×`}</dd></div>
                    <div><dt>Resultado de la operación desde el primer arriendo</dt><dd><MoneyValue valueUf={result.npvUf} ufValue={ufValue} currencyMode={currencyMode} /></dd></div>
                    <div><dt><span className="metric-label-with-help">Resultado total desde hoy <TechnicalHelp concept="adjustedPresentValue" label="Explicación técnica del resultado desde hoy" /></span></dt><dd><MoneyValue valueUf={preOperational.adjustedNpvUf} ufValue={ufValue} currencyMode={currencyMode} /></dd></div>
                  </dl>
                </article>
              </div>
              <p className="opportunity-caveat"><ShieldCheck size={16} /> El modelo agrupa algunos pagos previos por años y no adelanta exactamente el saldo hipotecario por las cuotas pagadas antes del primer arriendo.</p>
            </section>
          )
        )}

        {result && (
          <DecisionSummary
            decision={decision}
            result={result}
            inputs={inputs}
            form={form}
            monthlyRentUf={monthlyRent}
            ufValue={ufValue}
            currencyMode={currencyMode}
            selectedAlternative={selectedAlternative}
            cautiousNpvUf={
              scenarios.find((scenario) => scenario.id === "cautious")?.result
                .npvUf
            }
            dependsOnCashFlow={dependsOnCashFlow}
          />
        )}

        <section className="investment-methodology">
          <div className="section-title">
            <p className="eyebrow">Ayuda avanzada</p>
            <h2>Cómo funciona el cálculo y qué no considera</h2>
            <p>
              Puedes usar la simulación sin leer esta parte. Ábrela si quieres
              revisar fórmulas, conceptos y límites.
            </p>
          </div>
          <details className="methodology-details">
            <summary>Ver explicación técnica y límites</summary>
          <div className="method-grid">
            <article>
              <h3>Adquisición</h3>
              <p>
                El capital inicial suma pie, gastos del comprador, corretaje,
                preparación y reservas. No presume que el crédito financie esos
                conceptos.
              </p>
            </article>
            <article>
              <h3>Operación</h3>
              <p>
                La renta potencial se ajusta por ocupación. El ingreso operativo
                neto descuenta egresos operativos, pero excluye crédito y gastos
                de capital.
              </p>
            </article>
            <article>
              <h3>Financiamiento</h3>
              <p>
                Cada año suma pagos reales del calendario hipotecario
                compartido. Después del vencimiento, el servicio de deuda es
                cero.
              </p>
            </article>
            <article>
              <h3>Salida</h3>
              <p>
                La venta neta descuenta deuda y costos de salida una sola vez.
                La comisión de prepago puede estimarse automáticamente o
                reemplazarse por el monto certificado por el banco.
              </p>
            </article>
            <article>
              <h3>Continuidad</h3>
              <p>
                Valora el ingreso operativo neto posterior con una perpetuidad
                creciente. Exige que el retorno alternativo expresado como UF +
                tasa sea mayor que el crecimiento perpetuo.
              </p>
            </article>
            <article>
              <h3>Valor presente y tasas de retorno</h3>
              <p>
                El valor presente neto usa el retorno de tu mejor alternativa.
                La tasa interna de retorno puede no existir o tener múltiples
                soluciones; su versión modificada explicita financiamiento y
                reinversión.
              </p>
            </article>
          </div>
          <section
            className="financial-glossary"
            aria-labelledby="glossary-title"
          >
            <h3 id="glossary-title">Glosario de siglas y conceptos</h3>
            <dl>
              <div>
                <dt>UF</dt>
                <dd>
                  Unidad de Fomento. Unidad reajustable usada habitualmente en
                  operaciones inmobiliarias chilenas.
                </dd>
              </div>
              <div>
                <dt>CLP</dt>
                <dd>Pesos chilenos.</dd>
              </div>
              <div>
                <dt>NOI</dt>
                <dd>
                  Ingreso operativo neto: ingreso efectivo menos gastos de
                  operación, antes del crédito y los gastos de capital.
                </dd>
              </div>
              <div>
                <dt>VPN</dt>
                <dd>
                  Valor presente neto: valor de todos los flujos comparados con
                  la rentabilidad de tu mejor alternativa.
                </dd>
              </div>
              <div>
                <dt>TIR</dt>
                <dd>
                  Tasa interna de retorno: tasa que hace que el valor presente
                  neto sea cero.
                </dd>
              </div>
              <div>
                <dt>MIRR</dt>
                <dd>
                  Tasa interna de retorno modificada: variante que explicita
                  cómo se financian y reinvierten los flujos.
                </dd>
              </div>
              <div>
                <dt>DSCR</dt>
                <dd>
                  Cobertura del servicio de deuda: cuántas veces el ingreso
                  operativo neto cubre los pagos del crédito.
                </dd>
              </div>
              <div>
                <dt>CAPEX</dt>
                <dd>
                  Gasto de capital: desembolso relevante para renovar o reponer
                  componentes del inmueble.
                </dd>
              </div>
              <div>
                <dt>Retorno sobre efectivo</dt>
                <dd>
                  Flujo anual dividido por el capital que aportaste
                  inicialmente.
                </dd>
              </div>
            </dl>
          </section>
          <div className="legal-note">
            <h3>Alcance</h3>
            <p>
              Este cálculo es una estimación. La aplicación tributaria depende
              de los antecedentes del inmueble y del contribuyente. Confirma el
              tratamiento con fuentes oficiales o asesoría especializada.
            </p>
            <p>
              La comisión automática supone un mutuo reajustable en UF y usa 1,5
              meses de intereses sobre el capital prepagado. Para operaciones de
              hasta UF 5.000 este es el máximo señalado por el{" "}
              <a
                href="https://www.bcn.cl/leychile/navegar?idNorma=29438&idParte=8101667"
                target="_blank"
                rel="noreferrer"
              >
                artículo 10 de la Ley 18.010
              </a>
              ; sobre ese monto las condiciones se acuerdan libremente. Los
              prepagos parciales inferiores al 10% del saldo requieren
              consentimiento del acreedor. Confirma el instrumento, la fecha del
              crédito, el mínimo operativo y el valor exacto mediante un
              certificado de liquidación; los créditos hipotecarios en letras
              pueden tener reglas diferentes según la{" "}
              <a
                href="https://www.cmfchile.cl/educa/621/w3-article-27382.html"
                target="_blank"
                rel="noreferrer"
              >
                CMF
              </a>
              .
            </p>
            <p>
              Los equivalentes en pesos usan la UF seleccionada hoy. No
              proyectan el valor futuro de la UF. Tampoco se modelan impuestos
              personales, tasa variable, eventos legales, daños mayores,
              liquidez de venta, renegociaciones, mora ni condiciones
              contractuales particulares.
            </p>
            <p>
              <strong>Revisión de contenido sensible:</strong> 18 de julio de
              2026. Los campos tributarios se mantienen como datos del usuario y
              no producen una conclusión legal o tributaria.
            </p>
          </div>
          <p>
            <a
              className="text-button"
              href="/aprende/finanzas-personales/evaluar-inversion-inmobiliaria"
            >
              Leer la guía completa, casos ficticios y fórmulas
            </a>
          </p>
          </details>
        </section>
        <ContextualServiceCta />
      </main>
    </PageShell>
  );
}
