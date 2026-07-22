import { formatPercent, formatUf } from "../mortgageEngine";
import { isNewProperty } from "../preOperationalEngine";
import { plainDecisionText, ufPlusLabel } from "./config";
import { MoneyValue } from "./inputs";
import { Metric, SolverMoneyMetric, solverLabel } from "./results";

export default function DecisionSummary({
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
  breakEvens,
}) {
  if (!decision) return null;
  const newProperty = isNewProperty(form.propertyKind);
  const risks = [...decision.blockers, ...decision.risks].map(plainDecisionText);
  if (inputs.occupancyRate < 0.9)
    risks.push(
      "La ocupación supuesta es inferior al 90% y aumenta la exposición a meses sin arriendo.",
    );
  if (!form.appraisalValueUf)
    risks.push(
      "No se ingresó una tasación independiente para contrastar el precio de compra.",
    );
  if (newProperty && form.dfl2Status === "unknown")
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
    newProperty
      ? "Confirmar con profesionales el tratamiento tributario, DFL 2 y los costos de adquisición y venta aplicables al caso."
      : "Confirmar con profesionales el tratamiento tributario y los costos de adquisición y venta aplicables al caso.",
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
          <p className="eyebrow">Resumen de la simulación</p>
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
            Bajo estos supuestos, el proyecto crea valor con la rentabilidad
            exigida, pero el arriendo no cubre completamente el crédito.
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
              <dt>Relación arriendo/precio anual</dt>
              <dd>{formatPercent(result.grossYield)}</dd>
            </div>
            <div>
              <dt>Salida evaluada</dt>
              <dd>
                {result.neverSell ? "Nunca: continuidad de largo plazo" : `Año ${result.saleYear} de un horizonte de ${form.horizonYears} años`}
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
              <dt>VPN según el año de venta elegido</dt>
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
        {breakEvens && (
        <article className="decision-grid__full break-even-summary">
          <h3>¿Qué tendría que cambiar para llegar al equilibrio?</h3>
          <p>
            Estos valores muestran el punto en que comprar y tu otra alternativa
            quedan empatados bajo el modelo. No son una aprobación crediticia ni
            una promesa de rentabilidad: sirven para entender cuánto margen tiene
            tu escenario.
          </p>
          <dl>
            <SolverMoneyMetric label="Arriendo mensual para que convenga comprar" result={breakEvens.rent} ufValue={ufValue} currencyMode={currencyMode} />
            <Metric label="Ocupación mínima que soporta el modelo" value={solverLabel(breakEvens.occupancy, formatPercent)} detail="Por debajo de este nivel, la vacancia inclina la comparación hacia tu otra alternativa." />
            <SolverMoneyMetric label="Precio máximo de compra compatible" result={breakEvens.price} ufValue={ufValue} currencyMode={currencyMode} />
            <Metric label="Tasa hipotecaria máxima viable" value={solverLabel(breakEvens.interest, formatPercent)} detail="Una tasa mayor haría que el costo del crédito supere el margen del escenario." />
            <Metric label="Capital inicial máximo que soporta el flujo" moneyUf={breakEvens.maximumInitialCapitalUf} ufValue={ufValue} currencyMode={currencyMode} detail="Es el máximo estimado que podrías poner hoy antes de perder la ventaja frente a la alternativa." />
            <Metric label="Retorno desde el que ambas opciones son indiferentes" value={solverLabel(breakEvens.indifference, (value) => ufPlusLabel(value * 100, 2))} detail="Si tu alternativa rinde más que este nivel, comprar pierde atractivo relativo." />
          </dl>
        </article>
        )}
        <article className="decision-grid__full">
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
        <article className="decision-grid__full">
          <h3>Siguientes pasos</h3>
          <ol>
            {steps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </article>
      </div>
    </section>
  );
}

