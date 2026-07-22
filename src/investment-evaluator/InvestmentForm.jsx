import { useState } from "react";
import { ArrowLeft, ArrowRight, Calculator, Check, RefreshCw, RotateCcw, ShieldCheck } from "lucide-react";
import { BROKERAGE_MODES, BROKERAGE_TAX } from "../brokerageEngine";
import { formatClp, formatPercent, formatUf } from "../mortgageEngine";
import { PROPERTY_KINDS } from "../preOperationalEngine";
import { asNumber, pct, rateNumberLabel, sourceDateLabel, ufPlusLabel } from "./config";
import { Input, MoneyInput, MoneyValue, Select } from "./inputs";
import { Metric } from "./results";

export default function InvestmentForm({ model }) {
  const {
    mode,
    setMode,
    currencyMode,
    form,
    set,
    newProperty,
    futureDelivery,
    changePropertyLevel,
    errors,
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
    stepErrors,
    hideResults,
  } = model;
  const [activeStep, setActiveStep] = useState(1);
  const [highestStep, setHighestStep] = useState(1);
  const [attemptedStep, setAttemptedStep] = useState(null);
  const steps = [
    { number: 1, label: "Inversión Inicial" },
    { number: 2, label: "Ingresos por Arriendo" },
    { number: 3, label: "Costos de Operación" },
    { number: 4, label: "Opción de Salida" },
    { number: 5, label: "Costo de oportunidad" },
    { number: 6, label: "Otros supuestos" },
    { number: 7, label: "Revisión" },
  ];
  const currentErrors = stepErrors?.[activeStep] || [];
  const goToStep = (step) => {
    if (step > highestStep) return;
    hideResults();
    setActiveStep(step);
    setAttemptedStep(null);
    document.getElementById("modelo")?.scrollIntoView({ block: "start", behavior: "smooth" });
  };
  const continueToNextStep = () => {
    hideResults();
    setAttemptedStep(activeStep);
    if (currentErrors.length) return;
    const nextStep = Math.min(7, activeStep + 1);
    setHighestStep((value) => Math.max(value, nextStep));
    setActiveStep(nextStep);
    setAttemptedStep(null);
    document.getElementById("modelo")?.scrollIntoView({ block: "start", behavior: "smooth" });
  };
  const handleReset = () => {
    resetForm();
    setActiveStep(1);
    setHighestStep(1);
    setAttemptedStep(null);
  };

  return (
    <section id="modelo" className="investment-workspace">
      <header className="wizard-header">
        <div className="wizard-progress-copy">
          <p className="eyebrow">Configura tu simulación</p>
        </div>
        <div className="wizard-progress-bar" aria-hidden="true">
          <span style={{ width: `${(activeStep / 7) * 100}%` }} />
        </div>
        <ol className="wizard-stepper" aria-label="Progreso de la simulación">
          {steps.map((step) => {
            const available = step.number <= highestStep;
            const complete = step.number < activeStep || step.number < highestStep;
            return (
              <li key={step.number} className={step.number === activeStep ? "active" : complete ? "complete" : ""}>
                <button type="button" onClick={() => goToStep(step.number)} disabled={!available} aria-current={step.number === activeStep ? "step" : undefined}>
                  <span>{complete ? <Check size={15} /> : step.number}</span>
                  <strong>{step.label}</strong>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="wizard-actions">
          <button type="button" className="button button--secondary" onClick={() => goToStep(activeStep - 1)} disabled={activeStep === 1}>
            <ArrowLeft size={16} /> Anterior
          </button>
          {activeStep < 7 ? (
            <button type="button" className="button button--primary" onClick={continueToNextStep}>
              Continuar <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" className="button button--primary wizard-final-button" onClick={revealResults} disabled={!result}>
              <Calculator size={17} /> Ver resultado de la simulación
            </button>
          )}
        </div>
      </header>
      <div className="investment-inputs">
        {attemptedStep === activeStep && currentErrors.length > 0 && (
          <div className="investment-errors" role="alert">
            <h2>Revisa estos datos</h2>
            <ul>
              {currentErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}
    
        <fieldset hidden={activeStep !== 1}>
          <legend>Compra y Financiamiento</legend>
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
            <details className="advanced-disclosure">
              <summary>Avanzado: tasación del banco</summary>
              <MoneyInput id="appraisal" label="Tasación del banco (opcional)" valueUf={form.appraisalValueUf} onChangeUf={set("appraisalValueUf")} currencyMode={currencyMode} ufValue={ufValue} />
            </details>
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
            {newProperty && (
              <Select
                id="dfl2"
                label="¿Tiene beneficio tributario DFL2?"
                value={form.dfl2Status}
                onChange={set("dfl2Status")}
                help="DFL 2 significa Decreto con Fuerza de Ley N.º 2. En propiedades nuevas se selecciona “Sí” inicialmente, pero debe confirmarse en los documentos del inmueble."
              >
                <option value="confirmed">Sí</option>
                <option value="unknown">No o no sabe</option>
              </Select>
            )}
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
              helpConcept="mortgageRate"
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
            {creditRateMode === "manual" && opportunityData.mortgageRate && (
              <button type="button" className="text-button compact-action" onClick={restoreOfficialCreditRate}>Restaurar tasa oficial</button>
            )}
            <MoneyInput
              id="acquisition"
              label="Gastos operacionales de la compra"
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
              label="Ahorro en caso de imprevistos"
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
          <fieldset className="preoperational-form" hidden={activeStep !== 1}>
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
    
        <fieldset hidden={activeStep !== 2}>
          <legend>Ingresos por arriendo</legend>
          <div className="investment-field-grid">
            <MoneyInput
              id="rent"
              label="¿Cuánto podrías cobrar al mes?"
              valueUf={form.monthlyRentUf}
              onChangeUf={(value) => { set("monthlyRentUf")(value); setMode("property"); }}
              currencyMode={currencyMode}
              ufValue={ufValue}
            />
            <Select
              id="rent-currency"
              label="Unidad pactada del arriendo"
              value={form.rentCurrency}
              onChange={set("rentCurrency")}
              help="Este supuesto define cómo se reajusta el contrato y es independiente de la unidad que uses para ingresar los montos."
            >
              <option value="uf">UF</option>
              <option value="clp">Pesos chilenos (CLP)</option>
            </Select>
            <Input
              id="occupancy"
              label="¿Qué porcentaje del año esperas tenerlo arrendado?"
              unit="%"
              value={form.occupancyRate}
              onChange={set("occupancyRate")}
              min="0"
              max="100"
              helpConcept="occupancy"
              help={`Una ocupación de ${form.occupancyRate}% equivale aproximadamente a ${(12 * pct(form.occupancyRate)).toLocaleString("es-CL", { maximumFractionDigits: 1 })} meses arrendados por año.`}
            />
            {form.rentCurrency === "clp" && (
              <Select id="rent-adjustment" label="¿Cada cuánto se reajusta el arriendo en pesos?" value={form.rentAdjustmentMonths} onChange={set("rentAdjustmentMonths")} help="Entre reajustes, el monto se mantiene fijo en pesos. Al cumplirse el período vuelve a ajustarse según IPC.">
                <option value="1">Mensualmente según IPC</option>
                <option value="3">Cada 3 meses</option>
                <option value="6">Cada 6 meses</option>
                <option value="12">Una vez al año</option>
              </Select>
            )}
          </div>
          <div className="rent-price-indicator">
            <span>Relación arriendo/precio anualizada</span>
            <strong>{result ? formatPercent(result.grossYield) : "—"}</strong>
            <small>Arriendo anual estimado en UF ÷ precio de la vivienda. Incluye el reajuste elegido cuando ingresas el arriendo en pesos.</small>
          </div>
          <details className="advanced-disclosure section-advanced">
            <summary>Avanzado: estimación y crecimiento del arriendo</summary>
            <div className="comparable-box">
              <h3>Estimar el arriendo con una propiedad similar</h3>
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
              <button type="button" className="button button--secondary" onClick={() => setMode(mode === "comparable" ? "property" : "comparable")}>
                {mode === "comparable" ? "Dejar de usar esta estimación" : "Usar este arriendo estimado"}
              </button>
              <p>
                Este arriendo se deriva de una relación precio/arriendo
                simplificada. No reemplaza un estudio de mercado de la
                unidad específica.
              </p>
            </div>
            <div className="investment-field-grid advanced-fields">
            <Input
              id="rent-growth"
              label="Crecimiento adicional del arriendo"
              unit="%"
              value={form.rentGrowthRate}
              onChange={set("rentGrowthRate")}
              min="-100"
              help="Real significa que el crecimiento se mide por encima de la variación de la UF."
            />
            </div>
          </details>
        </fieldset>
    
        <fieldset hidden={activeStep !== 3}>
          <legend>Gastos de operación</legend>
          <div className="investment-field-grid">
            <MoneyInput
              id="common"
              label="Gasto común mensual"
              valueUf={form.monthlyCommonExpenseUf}
              onChangeUf={set("monthlyCommonExpenseUf")}
              currencyMode={currencyMode}
              ufValue={ufValue}
            />
            <MoneyInput
              id="contributions"
              label="Contribuciones al año"
              valueUf={form.contributionsAnnualUf}
              onChangeUf={set("contributionsAnnualUf")}
              currencyMode={currencyMode}
              ufValue={ufValue}
            />
            <MoneyInput
              id="landlord-insurance"
              label="Seguros al año"
              valueUf={form.landlordInsuranceAnnualUf}
              onChangeUf={set("landlordInsuranceAnnualUf")}
              currencyMode={currencyMode}
              ufValue={ufValue}
            />
          </div>
          <details className="advanced-disclosure section-advanced">
            <summary>Avanzado: detalle de gasto común</summary>
            <div className="investment-field-grid advanced-fields">
              <Input id="owner-occupied" label="Parte que pagas tú cuando está arrendado" unit="%" value={form.ownerCommonShareOccupied} onChange={set("ownerCommonShareOccupied")} min="0" max="100" />
              <Input id="owner-vacant" label="Parte que pagas tú cuando está desocupado" unit="%" value={form.ownerCommonShareVacant} onChange={set("ownerCommonShareVacant")} min="0" max="100" />
            </div>
          </details>
          <details className="advanced-disclosure section-advanced">
            <summary>Avanzado: detalle de mantenimiento</summary>
            <div className="investment-field-grid advanced-fields">
              <Input id="maintenance" label="Porcentaje de mantenimiento" unit="%" value={form.maintenanceRate} onChange={set("maintenanceRate")} min="0" />
              <Input id="administration" label="Porcentaje de administración" unit="%" value={form.administrationRate} onChange={set("administrationRate")} min="0" />
              <MoneyInput id="other-operation" label="Otros gastos de mantenimiento" valueUf={form.otherOperatingAnnualUf} onChangeUf={set("otherOperatingAnnualUf")} currencyMode={currencyMode} ufValue={ufValue} help="Por ejemplo: reparaciones menores, reemplazo de electrodomésticos, pintura, gastos no recurrentes o mantenciones extraordinarias." />
            </div>
          </details>
        </fieldset>
    
        <fieldset hidden={activeStep !== 4}>
          <legend>Plusvalía y venta de la propiedad</legend>
          <div className="investment-field-grid">
            <Input
              id="appreciation"
              label="Plusvalía de la propiedad"
              unit="%"
              value={form.appreciationRate}
              onChange={set("appreciationRate")}
              min="-100"
              helpConcept="appreciation"
            />
            <Input
              id="appreciation-start"
              label="La plusvalía comienza en el año"
              unit="año"
              value={form.appreciationStartYear}
              onChange={set("appreciationStartYear")}
              min="1"
              step="1"
            />
            <Input
              id="appreciation-end"
              label="La plusvalía termina en el año"
              unit="año"
              value={form.appreciationEndYear}
              onChange={set("appreciationEndYear")}
              min="1"
              max={form.horizonYears}
              step="1"
            />
            <Select id="sale-year" label="¿En qué año crees que pensarías en vender la propiedad?" value={form.saleYear} onChange={set("saleYear")} help="Elige “Nunca” si quieres valorar los arriendos como una continuidad de largo plazo.">
              {Array.from({ length: Math.max(1, Math.trunc(asNumber(form.horizonYears) || 1)) }, (_, index) => index + 1).map((year) => <option key={year} value={year}>Año {year}</option>)}
              <option value="never">Nunca</option>
            </Select>
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
          <details className="advanced-disclosure section-advanced">
            <summary>Avanzado: horizonte de inversión</summary>
            <div className="investment-field-grid advanced-fields">
              <Input id="horizon" label="Horizonte de inversión" unit="años" value={form.horizonYears} onChange={set("horizonYears")} min="1" max="50" step="1" helpConcept="investmentHorizon" />
            </div>
          </details>
        </fieldset>
    
        {/* 5. Costo de oportunidad: nombre histórico conservado para trazabilidad. */}
        <fieldset className="opportunity-section" hidden={activeStep !== 5}>
          <legend>Costo de oportunidad</legend>
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
        </fieldset>

        {/* 6. Otros: supuestos técnicos residuales del modelo. */}
        <fieldset hidden={activeStep !== 6}>
          <legend>Otros supuestos</legend>
          <div className="investment-field-grid">
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
        </fieldset>
        {activeStep === 7 && (
          <fieldset className="wizard-review">
            <legend>Revisa antes de decidir</legend>
            <p className="wizard-review__intro">Comprueba los supuestos que más influyen en la simulación. Todavía no mostramos conclusiones ni recomendaciones.</p>
            <div className="wizard-review-grid">
              <article>
                <span>Compra y Financiamiento</span>
                <h3>Compra y crédito</h3>
                <dl>
                  <div><dt>Precio</dt><dd><MoneyValue valueUf={form.propertyPriceUf} ufValue={ufValue} currencyMode={currencyMode} /></dd></div>
                  <div><dt>Propiedad</dt><dd>{newProperty ? "Nueva" : "Usada"}</dd></div>
                  <div><dt>Financiamiento</dt><dd>{form.financingRatio}% · {form.annualRate}% anual · {form.termYears} años</dd></div>
                </dl>
                <button type="button" className="text-button" onClick={() => goToStep(1)}>Editar Compra y Financiamiento</button>
              </article>
              <article>
                <span>Operación</span>
                <h3>Arriendo y gastos</h3>
                <dl>
                  <div><dt>Arriendo mensual</dt><dd><MoneyValue valueUf={mode === "comparable" && comparableRent != null ? comparableRent : form.monthlyRentUf} ufValue={ufValue} currencyMode={currencyMode} /></dd></div>
                  <div><dt>Unidad pactada</dt><dd>{form.rentCurrency === "clp" ? "CLP" : "UF"}</dd></div>
                  <div><dt>Ocupación</dt><dd>{form.occupancyRate}%</dd></div>
                  <div><dt>Gasto común</dt><dd><MoneyValue valueUf={form.monthlyCommonExpenseUf} ufValue={ufValue} currencyMode={currencyMode} /></dd></div>
                </dl>
                <button type="button" className="text-button" onClick={() => goToStep(2)}>Editar arriendo y operación</button>
              </article>
              <article>
                <span>Salida</span>
                <h3>Venta de la propiedad</h3>
                <dl>
                  <div><dt>Plusvalía anual</dt><dd>{form.appreciationRate}%</dd></div>
                  <div><dt>Horizonte</dt><dd>{form.horizonYears} años</dd></div>
                  <div><dt>Venta considerada</dt><dd>{form.saleYear === "never" ? "Continuar sin venta" : `Año ${form.saleYear}`}</dd></div>
                </dl>
                <button type="button" className="text-button" onClick={() => goToStep(3)}>Editar venta</button>
              </article>
              <article>
                <span>Comparación</span>
                <h3>Costo de oportunidad</h3>
                <dl>
                  <div><dt>Alternativa</dt><dd>{selectedAlternative?.label || "Tasa personalizada"}</dd></div>
                  <div><dt>Retorno comparable</dt><dd>{ufPlusLabel(realOpportunityRate * 100, 2)}</dd></div>
                </dl>
                <button type="button" className="text-button" onClick={() => goToStep(4)}>Editar costo de oportunidad</button>
              </article>
              <article>
                <span>Supuestos técnicos</span>
                <h3>Otros supuestos</h3>
                <dl>
                  <div><dt>Crecimiento perpetuo</dt><dd>{form.perpetualGrowthRate}% real</dd></div>
                  <div><dt>Prepago</dt><dd>{form.prepaymentMode === "automatic-uf" ? "Estimación automática" : form.prepaymentMode === "confirmed" ? "Monto bancario" : "Sin comisión confirmada"}</dd></div>
                  <div><dt>Reparación mayor</dt><dd>Año {form.capexYear}</dd></div>
                </dl>
                <button type="button" className="text-button" onClick={() => goToStep(5)}>Editar otros supuestos</button>
              </article>
            </div>
            <div className={`wizard-validation ${errors.length ? "wizard-validation--error" : "wizard-validation--ready"}`} role="status">
              <ShieldCheck size={22} />
              <div>
                <h3>{errors.length ? "Hay datos por corregir" : "Todo listo para simular"}</h3>
                {errors.length ? <ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul> : <p>Los datos requeridos son válidos. El siguiente botón separa la configuración del análisis final.</p>}
              </div>
            </div>
          </fieldset>
        )}
        <div className="form-actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={handleReset}
          >
            <RotateCcw size={16} /> Restablecer datos de inversión
          </button>
        </div>
      </div>
    </section>
    
  );
}
