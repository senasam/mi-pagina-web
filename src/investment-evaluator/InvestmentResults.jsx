import { ArrowLeft, BarChart3, Calculator, Copy, Printer, ShieldCheck } from "lucide-react";
import { trackEvent } from "../analytics";
import { formatPercent } from "../mortgageEngine";
import TechnicalHelp from "../TechnicalHelp";
import { ufPlusLabel } from "./config";
import DecisionSummary from "./DecisionSummary";
import { MoneyValue } from "./inputs";
import { Metric, ProjectionChart, ProjectionTable, SimpleProjectionTable, VpnFlowTable } from "./results";

const acronymDefinitions = {
  UF: "Unidad de Fomento: unidad reajustable usada habitualmente en operaciones inmobiliarias chilenas.",
  CLP: "Pesos chilenos.",
  NOI: "Ingreso operativo neto: ingresos menos gastos de operación, antes del crédito y gastos de capital.",
  VPN: "Valor presente neto: valor actual de los flujos comparado con la rentabilidad mínima exigida.",
  TIR: "Tasa interna de retorno: tasa que hace que el valor presente neto sea cero.",
  MIRR: "Tasa interna de retorno modificada: explicita financiamiento y reinversión de los flujos.",
  DSCR: "Cobertura del servicio de deuda: cuántas veces el ingreso operativo neto cubre el crédito.",
  CAPEX: "Gasto de capital relevante para renovar o reponer componentes del inmueble.",
};

function AcronymHelp({ term }) {
  return (
    <button type="button" className="acronym-help" aria-label={`${term}: ${acronymDefinitions[term]}`}>
      <abbr>{term}</abbr>
      <span role="tooltip">{acronymDefinitions[term]}</span>
    </button>
  );
}

export default function InvestmentResults({ model }) {
  const {
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
    methodology,
    reference,
  } = model;

  const occupancyValues = [
    Math.max(0, inputs.occupancyRate - 0.1),
    inputs.occupancyRate,
    Math.min(1, inputs.occupancyRate + 0.05),
  ];
  const appreciationValues = [
    inputs.appreciationRate - 0.02,
    inputs.appreciationRate,
    inputs.appreciationRate + 0.02,
  ];
  const matrixValues = sensitivity.flat().filter(Number.isFinite);
  const matrixMinimum = matrixValues.length ? Math.min(...matrixValues) : null;
  const matrixMaximum = matrixValues.length ? Math.max(...matrixValues) : null;
  const sortedDrivers = [...driverSensitivity]
    .map(([label, value]) => ({ label, value, impact: value - (result?.npvUf ?? 0) }))
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  const maximumDriverImpact = Math.max(...sortedDrivers.map((item) => Math.abs(item.impact)), 1);
  const dominantDriver = sortedDrivers[0];
  const positiveScenarios = scenarios.filter((scenario) => scenario.result.npvUf >= 0);
  const scenarioViews = scenarios.map((scenario) => ({
    ...scenario,
    occupancy: scenario.overrides.occupancyRate ?? inputs.occupancyRate,
    rent: scenario.overrides.monthlyRentUf ?? inputs.monthlyRentUf,
    appreciation: scenario.overrides.appreciationRate ?? inputs.appreciationRate,
    comparison: scenario.result.npvUf,
    firstYear: scenario.result.annualProjection[0].preTaxCashFlowUf,
  }));
  const scenarioSummary =
    positiveScenarios.length === scenarios.length
      ? "La propiedad supera la rentabilidad exigida incluso en el escenario difícil."
      : positiveScenarios.length === 0
        ? "La propiedad no supera la rentabilidad exigida ni siquiera en el escenario favorable."
        : positiveScenarios.length === 1 && positiveScenarios[0]?.id === "favorable"
          ? "La propiedad solo supera la rentabilidad exigida en el escenario favorable."
          : "La propiedad supera la rentabilidad exigida en tu escenario y en el favorable, pero no en el difícil.";

  return (
    <>
      {showResults && result && (
        <section
          id="simulation-result"
          className="simulation-result"
          tabIndex="-1"
          aria-label="Resultado de la simulación"
        >
          <div className="result-view-toolbar">
            <button type="button" className="button button--secondary" onClick={editSimulation}>
              <ArrowLeft size={16} /> Volver a editar simulación
            </button>
          </div>
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
            breakEvens={breakEvens}
          />
      
        <aside className="investment-results" aria-live="polite">
          {!result ? (
            <div className="empty-result">
              <Calculator size={30} />
              <h2>Completa supuestos válidos</h2>
              <p>Los resultados aparecerán aquí sin enviar tus datos.</p>
            </div>
          ) : (
            <>
              <header className="result-detail-heading">
                <p className="eyebrow">Detalle financiero</p>
                <h2>Valores presentes y estrategias de salida</h2>
                <p>Estimación antes de impuestos personales.</p>
                <div className="report-terms" aria-label="Definiciones rápidas de conceptos usados en el reporte">
                  <span>Conceptos del reporte</span>
                  {Object.keys(acronymDefinitions).map((term) => <AcronymHelp key={term} term={term} />)}
                </div>
              </header>
              <dl className="investment-metrics investment-metrics--primary">
                <Metric
                  label={`VPN si vendes al final de tu horizonte (año ${form.horizonYears})`}
                  moneyUf={vpnViews?.horizonSaleNpvUf}
                  ufValue={ufValue}
                  currencyMode={currencyMode}
                  detail="Valor actual del proyecto: inversión inicial, flujos anuales y venta neta al terminar el horizonte. Un VPN positivo indica que supera la rentabilidad mínima exigida; no es una simulación separada de la otra inversión."
                  helpConcept="presentValue"
                  helpLabel="¿Cómo se calcula este VPN?"
                  helpContext={`En esta simulación, los flujos se descuentan a ${ufPlusLabel(realOpportunityRate * 100, 2)} anual, desde hoy hasta el año ${form.horizonYears}. En el último año se suma la venta neta de la propiedad.`}
                  helpExtra={vpnViews && <VpnFlowTable title={`Flujos hasta la venta en el año ${form.horizonYears}`} flows={vpnViews.horizonSaleFlows} discountRate={realOpportunityRate} ufValue={ufValue} currencyMode={currencyMode} />}
                />
                <Metric
                  label={`VPN si vendes al terminar el crédito (año ${form.termYears})`}
                  moneyUf={vpnViews?.mortgageSaleNpvUf}
                  ufValue={ufValue}
                  currencyMode={currencyMode}
                  detail="Incluye la inversión inicial, los aportes o excedentes hasta la última cuota y la venta neta de la propiedad al terminar el crédito."
                  helpConcept="presentValue"
                  helpLabel="¿Cómo se calcula el VPN al terminar el crédito?"
                  helpContext={`Se descuentan a ${ufPlusLabel(realOpportunityRate * 100, 2)} anual los flujos hasta el año ${form.termYears}. En el último año se suma la venta neta: precio proyectado menos costos de venta y cualquier deuda pendiente.`}
                  helpExtra={vpnViews && <VpnFlowTable title={`Flujos y venta al terminar el crédito en el año ${form.termYears}`} flows={vpnViews.mortgageSaleFlows} discountRate={realOpportunityRate} ufValue={ufValue} currencyMode={currencyMode} />}
                />
                <Metric
                  label="VPN manteniendo la propiedad para siempre"
                  moneyUf={vpnViews?.perpetuityNpvUf}
                  ufValue={ufValue}
                  currencyMode={currencyMode}
                  detail="Incluye todos los flujos hasta terminar el crédito y, desde entonces, un valor de continuidad para los arriendos futuros. No supone una venta."
                  helpConcept="presentValue"
                  helpLabel="¿Cómo se calcula el VPN a perpetuidad?"
                  helpContext={`Se modelan los flujos y pagos del crédito hasta el año ${form.termYears}. Después se calcula el valor de continuidad de los arriendos con la tasa de descuento ${ufPlusLabel(realOpportunityRate * 100, 2)} y el crecimiento de largo plazo ingresado.`}
                  helpExtra={vpnViews && <VpnFlowTable title={`Flujos hasta terminar el crédito y valor de continuidad`} flows={vpnViews.perpetuityFlows} discountRate={realOpportunityRate} ufValue={ufValue} currencyMode={currencyMode} />}
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
                    <Metric label="Valor presente de pagos antes del arriendo" moneyUf={preOperational.presentValuePaymentsUf} ufValue={ufValue} currencyMode={currencyMode} />
                  )}
                  <Metric label="Tasa interna de retorno modificada (MIRR)" value={result.mirr == null ? "No se puede calcular con estos flujos" : formatPercent(result.mirr)} helpConcept="mirr" helpLabel="Explicación de la tasa modificada" />
                  <Metric label="Retorno sobre efectivo invertido" value={result.cashOnCashReturn == null ? "No se puede calcular" : formatPercent(result.cashOnCashReturn)} helpConcept="cashReturn" helpLabel="Explicación del retorno sobre efectivo" />
                  <Metric label="Rentabilidad del ingreso operativo neto" value={formatPercent(result.netOperatingYield)} helpConcept="operatingYield" helpLabel="Explicación de la rentabilidad operativa" />
                </dl>
              </details>
              <section className="terminal-comparison">
                <header className="terminal-comparison__header">
                  <p>{result.neverSell ? "Escenario sin venta programada" : `Decisión en el año ${result.saleYear}`}</p>
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
                {result.neverSell ? (
                  <div className="terminal-verdict">
                    <p className="terminal-verdict__sentence"><strong>Elegiste no vender.</strong> El modelo valora la continuidad de los arriendos como una perpetuidad al terminar el horizonte, siempre que el retorno alternativo sea mayor que su crecimiento de largo plazo.</p>
                  </div>
                ) : !Number.isFinite(result.terminalWealthDifferenceUf) ? (
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

      {methodology}
      
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
          <p className="scenario-conclusion"><strong>{scenarioSummary}</strong> Los escenarios son pruebas de sensibilidad y no predicciones.</p>
          <div className="scenario-table table-scroll" tabIndex="0">
            <table>
              <caption>Comparación fila por fila de los tres escenarios</caption>
              <thead>
                <tr>
                  <th>Indicador</th>
                  {scenarioViews.map((scenario) => <th key={scenario.id}>{scenario.name}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Qué cambia</th>
                  {scenarioViews.map((scenario) => <td key={scenario.id}>{scenario.id === "cautious" ? "Menor ocupación y valorización" : scenario.id === "favorable" ? "Mayor ocupación, arriendo y valorización" : "Tus datos actuales"}</td>)}
                </tr>
                <tr>
                  <th>Meses arrendados</th>
                  {scenarioViews.map((scenario) => <td key={scenario.id}>{(12 * scenario.occupancy).toLocaleString("es-CL", { maximumFractionDigits: 1 })} de 12 ({formatPercent(scenario.occupancy)})</td>)}
                </tr>
                <tr>
                  <th>Arriendo mensual</th>
                  {scenarioViews.map((scenario) => <td key={scenario.id}><MoneyValue valueUf={scenario.rent} ufValue={ufValue} currencyMode={currencyMode} /></td>)}
                </tr>
                <tr>
                  <th>Cambio anual del valor, además de la UF</th>
                  {scenarioViews.map((scenario) => <td key={scenario.id}>{formatPercent(scenario.appreciation)}</td>)}
                </tr>
                <tr className="scenario-table__result">
                  <th>Comparación con tu alternativa</th>
                  {scenarioViews.map((scenario) => <td key={scenario.id} className={scenario.comparison >= 0 ? "positive-value" : "negative-value"}><strong>{scenario.comparison >= 0 ? "La propiedad sería mejor que la otra inversión por" : "La otra inversión sería mejor que la propiedad por"}</strong><MoneyValue valueUf={Math.abs(scenario.comparison)} ufValue={ufValue} currencyMode={currencyMode} /><small>Diferencia a valor de hoy; no es dinero disponible en tu cuenta.</small></td>)}
                </tr>
                <tr>
                  <th>Flujo del primer año</th>
                  {scenarioViews.map((scenario) => <td key={scenario.id}><strong>{scenario.firstYear < 0 ? "Tú aportarías" : "Tú recibirías"}</strong><MoneyValue valueUf={Math.abs(scenario.firstYear)} ufValue={ufValue} currencyMode={currencyMode} /></td>)}
                </tr>
              </tbody>
            </table>
          </div>

          <ProjectionChart rows={result.annualProjection} ufValue={ufValue} />

          <section className="sensitivity-section sensitivity-summary">
            <h3>Qué pasa si cambia la ocupación o el valor de la propiedad</h3>
            <p>
              El resultado se mueve entre{" "}<MoneyValue valueUf={matrixMinimum} ufValue={ufValue} currencyMode={currencyMode} />{" "}
              y{" "}<MoneyValue valueUf={matrixMaximum} ufValue={ufValue} currencyMode={currencyMode} /> según la ocupación y valorización probadas.
            </p>
            <details className="sensitivity-disclosure">
              <summary>Ver matriz completa</summary>
              <div className="table-scroll">
                <table>
                  <caption>Comparación con tu otra alternativa. La celda destacada corresponde a tu escenario actual.</caption>
                  <thead>
                    <tr>
                      <th>Ocupación</th>
                      {appreciationValues.map((value, index) => <th key={value} className={index === 1 ? "current-assumption" : ""}>{formatPercent(value)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {sensitivity.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <th className={rowIndex === 1 ? "current-assumption" : ""}>{formatPercent(occupancyValues[rowIndex])}</th>
                        {row.map((value, columnIndex) => (
                          <td key={columnIndex} className={`${value < 0 ? "negative-value" : "positive-value"}${rowIndex === 1 && columnIndex === 1 ? " current-scenario-cell" : ""}`}>
                            <MoneyValue valueUf={value} ufValue={ufValue} currencyMode={currencyMode} />
                            {rowIndex === 1 && columnIndex === 1 && <small>Tu escenario</small>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>

          <section className="sensitivity-section sensitivity-summary">
            <h3>Qué podría cambiar el resultado</h3>
            <p>
              La variable de mayor impacto en estas pruebas es <strong>{dominantDriver?.label || "no disponible"}</strong>{dominantDriver && <>: cambia el resultado en <MoneyValue valueUf={dominantDriver.impact} ufValue={ufValue} currencyMode={currencyMode} />.</>}
            </p>
            <details className="sensitivity-disclosure">
              <summary>Ver todas las variables</summary>
              <div className="table-scroll">
                <table>
                  <caption>Variables ordenadas de mayor a menor impacto absoluto frente a tu escenario.</caption>
                  <thead><tr><th>Cambio probado</th><th>Magnitud</th><th>Resultado</th><th>Diferencia</th></tr></thead>
                  <tbody>
                    {sortedDrivers.map((item, index) => (
                      <tr key={item.label} className={index === 0 ? "dominant-driver" : ""}>
                        <th>{item.label}{index === 0 && <small>Mayor impacto</small>}</th>
                        <td><span className="impact-bar" aria-label={`Magnitud relativa ${Math.round((Math.abs(item.impact) / maximumDriverImpact) * 100)}%`}><i style={{ width: `${(Math.abs(item.impact) / maximumDriverImpact) * 100}%` }} /></span></td>
                        <td><MoneyValue valueUf={item.value} ufValue={ufValue} currencyMode={currencyMode} /></td>
                        <td><MoneyValue valueUf={item.impact} ufValue={ufValue} currencyMode={currencyMode} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>

          {deliveryScenarios.length > 0 && (
            <details className="sensitivity-disclosure preoperational-scenarios">
              <summary>Escenarios de atraso antes del primer arriendo</summary>
              <p>Comparación aproximada de la fecha contractual y atrasos de 3, 6 y 12 meses. La operación anual posterior no se reconstruye.</p>
              <div className="table-scroll"><table><caption>Impacto del atraso y posible pérdida del bono</caption><thead><tr><th>Escenario</th><th>Primer arriendo</th><th>Estado del bono</th><th>Máximo dinero acumulado</th><th>Cuotas antes del arriendo</th><th>Resultado total desde hoy</th></tr></thead><tbody>
                {deliveryScenarios.map(({ delayMonths, result: scenario }) => <tr key={delayMonths}><th>{delayMonths === 0 ? "Fecha contractual" : `Atraso de ${delayMonths} meses`}</th><td>Mes {scenario.firstRentMonth}</td><td>{scenario.bonoStatus}</td><td><MoneyValue valueUf={scenario.maximumCashUf} ufValue={ufValue} currencyMode={currencyMode} /></td><td><MoneyValue valueUf={scenario.mortgageWithoutRentUf} ufValue={ufValue} currencyMode={currencyMode} /></td><td><MoneyValue valueUf={scenario.adjustedNpvUf} ufValue={ufValue} currencyMode={currencyMode} /></td></tr>)}
              </tbody></table></div>
              <p>Atraso máximo aproximado antes de que la comparación pase a ser negativa: <strong>{tolerableDelay == null ? "no encontrado" : `${tolerableDelay} meses`}</strong>.</p>
            </details>
          )}

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
                <h3>Resultado desde hoy</h3>
                <dl>
                  <div><dt><span className="metric-label-with-help">VPN ajustado por la etapa previa al arriendo <TechnicalHelp concept="adjustedPresentValue" label="Explicación técnica del resultado desde hoy" /></span></dt><dd><MoneyValue valueUf={preOperational.adjustedNpvUf} ufValue={ufValue} currencyMode={currencyMode} /></dd></div>
                </dl>
              </article>
            </div>
            <p className="opportunity-caveat"><ShieldCheck size={16} /> El modelo agrupa algunos pagos previos por años y no adelanta exactamente el saldo hipotecario por las cuotas pagadas antes del primer arriendo.</p>
          </section>
        )
      )}

      {reference}
      
        </section>
      )}
      
    </>
  );
}
