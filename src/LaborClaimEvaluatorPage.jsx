import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ExternalLink, RefreshCw, RotateCcw, Scale } from "lucide-react";
import { Breadcrumbs, PageShell } from "./LearningComponents";
import { breadcrumbSchema, usePageMetadata } from "./seo";
import { trackEvent } from "./analytics";
import { formatNumericInput, normalizeNumericInput } from "./chileanNumberInput";
import { formatClp, parseChileanNumber } from "./mortgageEngine";
import { AFP_OPTIONS, LEGAL_PARAMS_REVIEWED_ON, TERMINATION_TYPES } from "./labor-claim/legalParams";
import { buildMonthlySeries, evaluateLaborClaim, isValidIsoDate, monthRange, validateAssumptions } from "./labor-claim/laborClaimEngine";
import "./labor-claim/laborClaim.css";

const PATH = "/herramientas/evaluador-demanda-laboral";
const TITLE = "Evaluador de demanda laboral por honorarios encubiertos";
const n = (value) => { const parsed = parseChileanNumber(value); return Number.isFinite(parsed) ? parsed : 0; };
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(new Date());
const yearsAgo = (iso, years) => `${Number(iso.slice(0, 4)) - years}${iso.slice(4)}`;
const dateLabel = (iso) => iso ? new Intl.DateTimeFormat("es-CL", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`)) : "sin fecha";
const monthLabel = (key) => new Intl.DateTimeFormat("es-CL", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${key}-15T12:00:00Z`));
const pct = (value) => `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(value * 100)}%`;
const SOURCE_LABELS = { cmf: "CMF (oficial)", "secondary-provider": "mindicador.cl (respaldo)", cache: "último valor guardado", unavailable: "no disponible" };

const initialForm = () => {
  const end = today();
  return {
    startDate: yearsAgo(end, 3), endDate: end, terminationType: "despido-injustificado", surchargeRate: "0.5",
    inputMode: "average", averagePrevious: "", lastThree: ["", "", ""], monthly: {},
    pendingPeriods: "0", unpaidDaysTaken: "0", pregnant: false, dueDate: "",
    nullityEnabled: true, nullityMonths: "12", tutelaEnabled: false, tutelaMonths: "6",
    afp: "", healthSystem: "fonasa", isaprePlanUf: "", accidentAdditional: "0",
    winProbability: "75", settlementRate: "60", lawyerFeeRate: "25",
  };
};
const exampleForm = () => ({
  ...initialForm(), startDate: "2023-07-01", endDate: "2026-06-30", averagePrevious: "950000", lastThree: ["1000000", "1100000", "900000"],
  pendingPeriods: "2", nullityEnabled: true, nullityMonths: "18", tutelaEnabled: true, tutelaMonths: "6", afp: "habitat",
});

function Field({ id, label, help, error, children }) {
  return <div className={`mortgage-field${error ? " mortgage-field--error" : ""}`}>
    <label htmlFor={id}>{label}</label>
    {children}
    {help && <small id={`${id}-help`}>{help}</small>}
    {error && <small className="field-error" id={`${id}-error`}>{error}</small>}
  </div>;
}

function NumberInput({ id, value, onChange, unit, error, describedBy }) {
  return <div className="claim-input-unit">
    <input id={id} inputMode="decimal" value={formatNumericInput(value)} onChange={(event) => onChange(normalizeNumericInput(event.target.value))} aria-invalid={Boolean(error)} aria-describedby={describedBy} data-private="true" />
    {unit && <span aria-hidden="true">{unit}</span>}
  </div>;
}

function SourceRefs({ ids, numbers }) {
  return <span className="claim-source-refs">{ids.filter((id) => numbers[id]).map((id) => <a key={id} href={`#fuente-${id}`} aria-label={`Ver fuente ${numbers[id]}`}>[{numbers[id]}]</a>)}</span>;
}

function UfPanel({ uf, calcDate, setCalcDate, endDate, manualUf, setManualUf, setMode, retry }) {
  const manual = uf.mode === "manual" || uf.mode === "unavailable";
  const value = manual ? n(manualUf) : uf.valueClp;
  return <section className="uf-panel claim-uf-panel" aria-labelledby="uf-title" aria-live="polite">
    <div>
      <p className="eyebrow">Unidad de Fomento</p>
      <h2 id="uf-title">UF utilizada: {value > 0 ? formatClp(value) : "no disponible"}</h2>
      {uf.mode === "loading" && <p>Consultando el valor…</p>}
      {uf.mode === "automatic" && <p>Valor del {dateLabel(uf.effectiveDate)} · fuente: {SOURCE_LABELS[uf.sourceCategory] || uf.sourceCategory}.</p>}
      {uf.mode === "cached" && <p className="claim-warning-text"><AlertTriangle size={15} /> Las fuentes no respondieron. Se usa el último valor guardado, del {dateLabel(uf.effectiveDate)}.</p>}
      {uf.mode === "manual" && <p>Valor ingresado manualmente; se usa para el tope de 90 UF y los cálculos de hoy.</p>}
      {uf.mode === "unavailable" && <p className="claim-warning-text"><AlertTriangle size={15} /> No fue posible obtener la UF. Ingresa el valor que quieras usar.</p>}
    </div>
    <div className="claim-uf-controls">
      <Field id="uf-date" label="Fecha de la UF" help="Por ejemplo, la fecha del despido o la fecha estimada de pago.">
        <input id="uf-date" type="date" value={calcDate} onChange={(event) => setCalcDate(event.target.value)} />
      </Field>
      <div className="uf-actions">
        <button type="button" className="button button--secondary" onClick={() => setCalcDate(endDate)} disabled={!isValidIsoDate(endDate)}>Usar fecha de término</button>
        {manual
          ? <>{uf.valueClp > 0 && <button type="button" className="button button--secondary" onClick={() => setMode(uf.stale ? "cached" : "automatic")}>Usar valor automático</button>}<button type="button" className="button button--secondary" onClick={retry}><RefreshCw size={16} /> Reintentar</button></>
          : <button type="button" className="button button--secondary" onClick={() => { setManualUf(uf.valueClp ? String(uf.valueClp) : ""); setMode("manual"); }}>Ingresar UF manualmente</button>}
      </div>
      {manual && <Field id="manual-uf" label="Valor de la UF (CLP)"><NumberInput id="manual-uf" value={manualUf} onChange={setManualUf} unit="$" /></Field>}
    </div>
  </section>;
}

export default function LaborClaimEvaluatorPage() {
  const [form, setForm] = useState(initialForm);
  const [calcDate, setCalcDate] = useState(today);
  const [uf, setUf] = useState({ mode: "loading", valueClp: null, effectiveDate: null, sourceCategory: null, stale: false });
  const [manualUf, setManualUf] = useState("");
  const [ufSeries, setUfSeries] = useState({ status: "idle", values: {}, missing: [] });
  const [excluded, setExcluded] = useState([]);
  const [retryToken, setRetryToken] = useState(0);
  const breadcrumbs = [{ label: "Inicio", href: "/" }, { label: "Herramientas", href: "/herramientas" }, { label: "Evaluador de demanda laboral", href: PATH }];
  const schema = useMemo(() => ({ "@context": "https://schema.org", "@graph": [breadcrumbSchema(breadcrumbs), { "@type": "WebApplication", name: TITLE, description: "Estimación orientativa de indemnizaciones y cotizaciones adeudadas cuando una relación a honorarios encubre un contrato de trabajo en Chile.", url: `https://masanes.cl${PATH}`, applicationCategory: "FinanceApplication", operatingSystem: "Navegador web", isAccessibleForFree: true, dateModified: LEGAL_PARAMS_REVIEWED_ON }] }), []);
  usePageMetadata({ title: TITLE, description: "Estima cuánto podría recibir si demanda por honorarios encubiertos y cuánto debería pagar el empleador a la AFP, salud y seguro de cesantía, con la fuente legal de cada monto.", path: PATH, schema });
  useEffect(() => { trackEvent("labor_claim_tool_viewed", { tool: "labor_claim" }); }, []);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  // UF de la fecha de cálculo (endpoint propio; nunca se llama a APIs externas desde el navegador).
  useEffect(() => {
    if (!isValidIsoDate(calcDate)) return undefined;
    let cancelled = false;
    setUf((current) => current.mode === "manual" ? current : { ...current, mode: "loading" });
    fetch(`/api/indicadores/uf?fecha=${calcDate}`, { headers: { Accept: "application/json" } })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("sin respuesta")))
      .then((data) => {
        if (cancelled) return;
        if (!(data.valueClp > 0)) throw new Error("sin valor");
        setUf((current) => ({ mode: current.mode === "manual" ? "manual" : data.status === "cached" ? "cached" : "automatic", valueClp: data.valueClp, effectiveDate: data.effectiveDate, sourceCategory: data.sourceCategory, stale: Boolean(data.stale) }));
      })
      .catch(() => { if (!cancelled) setUf((current) => current.mode === "manual" ? current : { ...current, mode: current.valueClp > 0 ? "cached" : "unavailable", stale: true }); });
    return () => { cancelled = true; };
  }, [calcDate, retryToken]);

  // UF del último día de cada mes trabajado, para el tope imponible vigente en cada mes.
  const monthsKey = isValidIsoDate(form.startDate) && isValidIsoDate(form.endDate) && form.startDate <= form.endDate ? `${form.startDate.slice(0, 7)}|${form.endDate.slice(0, 7)}` : "";
  useEffect(() => {
    if (!monthsKey) return undefined;
    const [desde, hasta] = monthsKey.split("|");
    let cancelled = false;
    const timer = setTimeout(() => {
      setUfSeries((current) => ({ ...current, status: "loading" }));
      fetch(`/api/indicadores/uf?serie=fin-de-mes&desde=${desde}&hasta=${hasta}`, { headers: { Accept: "application/json" } })
        .then((response) => response.ok ? response.json() : Promise.reject(new Error("sin respuesta")))
        .then((data) => { if (!cancelled) setUfSeries({ status: data.status || "partial", values: data.values || {}, missing: data.missing || [] }); })
        .catch(() => { if (!cancelled) setUfSeries({ status: "unavailable", values: {}, missing: [] }); });
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [monthsKey, retryToken]);

  const months = useMemo(() => monthsKey ? monthRange(form.startDate, form.endDate) : [], [monthsKey]);
  const effectiveUf = uf.mode === "manual" || uf.mode === "unavailable" ? n(manualUf) : uf.valueClp;
  const termination = TERMINATION_TYPES.find((type) => type.id === form.terminationType);

  const input = useMemo(() => {
    const series = monthsKey ? buildMonthlySeries({
      startDate: form.startDate, endDate: form.endDate, mode: form.inputMode,
      monthly: Object.fromEntries(Object.entries(form.monthly).map(([key, value]) => [key, n(value)])),
      averagePrevious: n(form.averagePrevious), lastThree: form.lastThree.map(n),
    }) : [];
    const ufByMonth = Object.fromEntries(Object.entries(ufSeries.values).map(([key, item]) => [key, item.valueClp]));
    return {
      startDate: form.startDate, endDate: form.endDate, series, terminationType: form.terminationType, surchargeRate: Number(form.surchargeRate),
      vacation: { pendingPeriods: n(form.pendingPeriods), unpaidDaysTaken: n(form.unpaidDaysTaken) },
      maternity: { pregnant: form.pregnant, dueDate: form.dueDate },
      nullity: { enabled: form.nullityEnabled, months: n(form.nullityMonths) },
      tutela: { enabled: form.tutelaEnabled, months: n(form.tutelaMonths) },
      afp: form.afp, health: { system: form.healthSystem, planUf: n(form.isaprePlanUf) }, accidentAdditionalRate: n(form.accidentAdditional) / 100,
      risk: { winProbability: n(form.winProbability) / 100, settlementRate: n(form.settlementRate) / 100, lawyerFeeRate: n(form.lawyerFeeRate) / 100 },
      ufValueClp: effectiveUf, ufByMonth, calcDate: isValidIsoDate(calcDate) ? calcDate : form.endDate, excludedComponents: excluded,
    };
  }, [form, monthsKey, ufSeries, effectiveUf, calcDate, excluded]);

  const errors = useMemo(() => validateAssumptions(input), [input]);
  const result = useMemo(() => {
    if (Object.keys(errors).length) return null;
    try { return evaluateLaborClaim(input); } catch { return null; }
  }, [input, errors]);
  const sourceNumbers = useMemo(() => Object.fromEntries((result?.sources || []).map((source, index) => [source.id, index + 1])), [result]);
  const toggleComponent = (id) => setExcluded((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const maxDestination = Math.max(1, ...(result?.contributions.byDestination.map((item) => item.amount) || [1]));

  return <PageShell><main id="main-content" className="content-page mortgage-page labor-claim-page"><Breadcrumbs items={breadcrumbs} />
    <header className="mortgage-hero">
      <div>
        <p className="eyebrow">Derecho laboral · herramienta orientativa</p>
        <h1>¿Cuánto podría recibir si demanda por honorarios encubiertos?</h1>
        <p>Si trabaja con boletas de honorarios pero cumple horario, recibe órdenes y depende de una jefatura, la ley puede considerar que existe un contrato de trabajo (arts. 7 y 8 del Código del Trabajo). Esta herramienta estima las indemnizaciones y las cotizaciones que el empleador debería pagar, con la fuente legal de cada monto.</p>
        <UfPanel uf={uf} calcDate={calcDate} setCalcDate={setCalcDate} endDate={form.endDate} manualUf={manualUf} setManualUf={setManualUf} setMode={(mode) => setUf((current) => ({ ...current, mode }))} retry={() => setRetryToken((value) => value + 1)} />
      </div>
    </header>

    <section className="mortgage-workspace" aria-labelledby="claim-form-title">
      <div className="mortgage-workspace__intro">
        <p className="eyebrow">Supuestos</p>
        <h2 id="claim-form-title">Datos de la relación laboral</h2>
        <p>Los resultados se actualizan mientras escribe. Use montos brutos de boleta, antes de la retención de honorarios.</p>
        <div className="result-actions">
          <button type="button" className="button button--secondary" onClick={() => { setForm(exampleForm()); setExcluded([]); trackEvent("labor_claim_example_loaded", { tool: "labor_claim" }); }}>Cargar caso de ejemplo</button>
          <button type="button" className="button button--secondary" onClick={() => { setForm(initialForm()); setExcluded([]); }}><RotateCcw size={16} /> Reiniciar</button>
        </div>
      </div>
      <form className="claim-form" onSubmit={(event) => event.preventDefault()} noValidate>
        <fieldset>
          <legend>1. Relación y término</legend>
          <div className="mortgage-grid">
            <Field id="startDate" label="Fecha de inicio" error={errors.startDate}><input id="startDate" type="date" value={form.startDate} onChange={(event) => update("startDate", event.target.value)} /></Field>
            <Field id="endDate" label="Fecha de término (real o hipotética)" error={errors.endDate}><input id="endDate" type="date" value={form.endDate} onChange={(event) => update("endDate", event.target.value)} /></Field>
            <Field id="terminationType" label="Causal de término o tipo de acción" error={errors.terminationType} help={termination?.nota}>
              <select id="terminationType" value={form.terminationType} onChange={(event) => { const next = TERMINATION_TYPES.find((type) => type.id === event.target.value); setForm((current) => ({ ...current, terminationType: next.id, surchargeRate: String(next.recargoPorDefecto) })); }}>
                {TERMINATION_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
              </select>
            </Field>
            <Field id="surchargeRate" label="Recargo sobre años de servicio" help="Porcentajes permitidos para la causal elegida.">
              <select id="surchargeRate" value={form.surchargeRate} onChange={(event) => update("surchargeRate", event.target.value)}>
                {termination?.recargos.map((rate) => <option key={rate} value={String(rate)}>{pct(rate)}</option>)}
              </select>
            </Field>
          </div>
        </fieldset>

        <fieldset>
          <legend>2. Montos brutos de boleta</legend>
          <div className="mode-switch" role="tablist" aria-label="Forma de ingresar las boletas">
            <button type="button" role="tab" aria-selected={form.inputMode === "average"} className={form.inputMode === "average" ? "active" : ""} onClick={() => update("inputMode", "average")}>Promedio + últimos 3 meses</button>
            <button type="button" role="tab" aria-selected={form.inputMode === "monthly"} className={form.inputMode === "monthly" ? "active" : ""} onClick={() => update("inputMode", "monthly")}>Mes a mes</button>
          </div>
          {form.inputMode === "average" ? <div className="mortgage-grid claim-grid-4">
            <Field id="averagePrevious" label="Promedio de los meses anteriores" help="Se aplica a todos los meses salvo los 3 últimos."><NumberInput id="averagePrevious" value={form.averagePrevious} onChange={(value) => update("averagePrevious", value)} unit="$" /></Field>
            {["Antepenúltimo mes", "Penúltimo mes", "Último mes"].map((label, index) => <Field key={label} id={`last-${index}`} label={label}><NumberInput id={`last-${index}`} value={form.lastThree[index]} onChange={(value) => update("lastThree", form.lastThree.map((item, i) => i === index ? value : item))} unit="$" /></Field>)}
          </div> : <div className="claim-monthly">
            <div className="result-actions"><button type="button" className="button button--secondary" onClick={() => { const fill = form.monthly[months.at(-1)] || form.averagePrevious; if (fill) update("monthly", Object.fromEntries(months.map((key) => [key, form.monthly[key] || fill]))); }}>Rellenar meses vacíos con el último monto</button></div>
            <div className="claim-monthly__grid">{months.map((key) => <Field key={key} id={`m-${key}`} label={monthLabel(key)}><NumberInput id={`m-${key}`} value={form.monthly[key] || ""} onChange={(value) => update("monthly", { ...form.monthly, [key]: value })} unit="$" /></Field>)}</div>
          </div>}
          {errors.series && <p className="field-error">{errors.series}</p>}
          <p className="claim-hint">{months.length} meses en la relación. Los meses sin boleta cuentan como $0: bajan el promedio de indemnización (3 meses calendario, art. 172) pero no el de vacaciones (3 meses trabajados, art. 71).</p>
        </fieldset>

        <fieldset>
          <legend>3. Vacaciones</legend>
          <div className="mortgage-grid">
            <Field id="pendingPeriods" label="Períodos completos pendientes" help="Máximo 2 acumulables (art. 70). El proporcional del último año se calcula solo.">
              <select id="pendingPeriods" value={form.pendingPeriods} onChange={(event) => update("pendingPeriods", event.target.value)}>{["0", "1", "2"].map((value) => <option key={value} value={value}>{value}</option>)}</select>
            </Field>
            <Field id="unpaidDaysTaken" label="Días de vacaciones tomados sin pago" help="Días corridos en que descansó y no le pagaron."><NumberInput id="unpaidDaysTaken" value={form.unpaidDaysTaken} onChange={(value) => update("unpaidDaysTaken", value)} unit="días" /></Field>
          </div>
        </fieldset>

        <fieldset>
          <legend>4. Fuero, nulidad y tutela</legend>
          <div className="mortgage-grid">
            <label className="claim-check"><input type="checkbox" checked={form.pregnant} onChange={(event) => update("pregnant", event.target.checked)} /> Embarazo o fuero maternal al momento del término</label>
            {form.pregnant && <Field id="dueDate" label="Fecha probable de parto" error={errors.dueDate} help="El fuero dura hasta un año después del postnatal (12 semanas desde el parto)."><input id="dueDate" type="date" value={form.dueDate} onChange={(event) => update("dueDate", event.target.value)} /></Field>}
            <label className="claim-check"><input type="checkbox" checked={form.nullityEnabled} onChange={(event) => update("nullityEnabled", event.target.checked)} /> Pedir nulidad del despido (Ley Bustos) por cotizaciones impagas</label>
            {form.nullityEnabled && <Field id="nullityMonths" label="Meses estimados hasta la convalidación" help="Desde el despido hasta que el empleador pague las cotizaciones."><NumberInput id="nullityMonths" value={form.nullityMonths} onChange={(value) => update("nullityMonths", value)} unit="meses" /></Field>}
            <label className="claim-check"><input type="checkbox" checked={form.tutelaEnabled} onChange={(event) => update("tutelaEnabled", event.target.checked)} /> Tutela de derechos fundamentales</label>
            {form.tutelaEnabled && <Field id="tutelaMonths" label="Remuneraciones a pedir (6 a 11)" error={errors.tutelaMonths}><select id="tutelaMonths" value={form.tutelaMonths} onChange={(event) => update("tutelaMonths", event.target.value)}>{[6, 7, 8, 9, 10, 11].map((value) => <option key={value} value={String(value)}>{value}</option>)}</select></Field>}
          </div>
          <p className="claim-hint">Fuero y nulidad no se suman sobre los mismos meses: el cálculo usa el período más largo.</p>
        </fieldset>

        <fieldset>
          <legend>5. Previsión y salud</legend>
          <div className="mortgage-grid">
            <Field id="afp" label="AFP" error={errors.afp}><select id="afp" value={form.afp} onChange={(event) => update("afp", event.target.value)}><option value="">Elige la AFP</option>{AFP_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></Field>
            <Field id="healthSystem" label="Sistema de salud"><select id="healthSystem" value={form.healthSystem} onChange={(event) => update("healthSystem", event.target.value)}><option value="fonasa">Fonasa</option><option value="isapre">Isapre</option></select></Field>
            {form.healthSystem === "isapre" && <Field id="isaprePlanUf" label="Valor del plan de Isapre" help="Solo si supera el 7%; se muestra aparte como dato informativo."><NumberInput id="isaprePlanUf" value={form.isaprePlanUf} onChange={(value) => update("isaprePlanUf", value)} unit="UF" /></Field>}
            <Field id="accidentAdditional" label="Cotización adicional de accidentes" help="Según actividad de la empresa (0% a 3,4%). La básica de 0,90% ya está incluida."><NumberInput id="accidentAdditional" value={form.accidentAdditional} onChange={(value) => update("accidentAdditional", value)} unit="%" /></Field>
          </div>
        </fieldset>

        <fieldset>
          <legend>6. Riesgo y honorarios</legend>
          <div className="mortgage-grid claim-grid-3">
            <Field id="winProbability" label="Probabilidad de ganar" error={errors.winProbability}><NumberInput id="winProbability" value={form.winProbability} onChange={(value) => update("winProbability", value)} unit="%" /></Field>
            <Field id="settlementRate" label="Acuerdo esperado (% del reclamo)" error={errors.settlementRate}><NumberInput id="settlementRate" value={form.settlementRate} onChange={(value) => update("settlementRate", value)} unit="%" /></Field>
            <Field id="lawyerFeeRate" label="Honorario del abogado" error={errors.lawyerFeeRate}><NumberInput id="lawyerFeeRate" value={form.lawyerFeeRate} onChange={(value) => update("lawyerFeeRate", value)} unit="%" /></Field>
          </div>
        </fieldset>
      </form>
    </section>

    {errors.uf && <div className="error-summary" role="alert"><strong>Falta la UF.</strong> Ingrese un valor manual en el panel de la UF para calcular.</div>}
    {!result && !errors.uf && <p className="claim-hint claim-empty">Complete los montos de boleta, las fechas y la AFP para ver la estimación.</p>}

    {result && <section className="mortgage-results claim-results" aria-labelledby="claim-results-title">
      <div className="section-title"><p className="eyebrow">Resultado orientativo</p><h2 id="claim-results-title">Resumen</h2></div>
      <div className="headline-result claim-headline">
        <span>Si gana la demanda, recibiría aprox.</span>
        <strong>{formatClp(result.claimTotal)}</strong>
        <small>en dinero, antes de honorarios del abogado.</small>
      </div>
      <p className="claim-lead">Además, el empleador debería pagar <strong>{formatClp(result.contributions.total)}</strong> a sus instituciones previsionales y de salud (AFP, salud, seguro de cesantía y otras).</p>
      {result.warnings.length > 0 && <ul className="claim-warnings">{result.warnings.map((warning) => <li key={warning}><AlertTriangle size={15} /> {warning}</li>)}</ul>}

      <h3>Escenarios netos para usted</h3>
      <dl className="metrics-grid claim-scenarios">{result.scenarios.map((scenario) => <div className="mortgage-metric" key={scenario.id}><dt>{scenario.label}</dt><dd>{formatClp(scenario.net)}</dd><small>{scenario.formula}{scenario.fee > 0 ? ` (${formatClp(scenario.fee)})` : ""}</small></div>)}</dl>

      <h3>Dinero para usted, por concepto</h3>
      <p className="claim-hint">Desmarque una fila para excluirla del total y de los escenarios.</p>
      <div className="claim-table" role="table" aria-label="Componentes del reclamo">
        <div className="claim-table__head" role="row"><span role="columnheader">Incluir</span><span role="columnheader">Concepto</span><span role="columnheader">Fórmula</span><span role="columnheader">Monto</span><span role="columnheader">Fuente</span></div>
        {result.components.map((component) => <div className={`claim-table__row${component.enabled ? "" : " is-off"}`} role="row" key={component.id}>
          <span role="cell"><input type="checkbox" checked={component.enabled} onChange={() => toggleComponent(component.id)} aria-label={`Incluir ${component.label}`} /></span>
          <span role="cell" className="claim-table__concept">{component.label}{component.note && <small>{component.note}</small>}</span>
          <span role="cell" className="claim-table__formula">{component.formula}</span>
          <span role="cell" className="claim-table__amount">{formatClp(component.amount)}</span>
          <span role="cell"><SourceRefs ids={component.sourceIds} numbers={sourceNumbers} /></span>
        </div>)}
        <div className="claim-table__row claim-table__total" role="row"><span role="cell" /><span role="cell">Total</span><span role="cell" /><span role="cell" className="claim-table__amount">{formatClp(result.claimTotal)}</span><span role="cell" /></div>
      </div>
      <p className="claim-hint">Base de indemnizaciones: {formatClp(result.bases.indemnizationBase)} ({result.bases.isVariable ? "promedio de los últimos 3 meses calendario" : "última remuneración"}{result.bases.capApplied ? `, con tope de ${result.bases.capUf} UF` : ""}). Base de vacaciones: {formatClp(result.bases.vacationBase)} (promedio de los últimos 3 meses trabajados).</p>

      <h3>¿A dónde va el dinero de las cotizaciones?</h3>
      <p className="claim-hint">Cálculo mes a mes durante {result.contributions.rows.length} meses, con el tope imponible y la UF de fin de cada mes{ufSeries.status === "loading" ? " (cargando UF históricas…)" : ""}.</p>
      <div className="claim-destinations">{result.contributions.byDestination.map((destination) => <div className="claim-destination" key={destination.id}>
        <div className="claim-destination__label"><span>{destination.id === "salud" ? `Salud: ${form.healthSystem === "isapre" ? "Isapre" : "Fonasa"} (7%)` : destination.label}</span><SourceRefs ids={destination.sourceIds} numbers={sourceNumbers} /></div>
        <div className="claim-destination__bar" aria-hidden="true"><span style={{ width: `${(destination.amount / maxDestination) * 100}%` }} /></div>
        <strong>{formatClp(destination.amount)}</strong>
      </div>)}
        <div className="claim-destination claim-destination--total"><div className="claim-destination__label"><span>Total cotizaciones adeudadas</span></div><div /><strong>{formatClp(result.contributions.total)}</strong></div>
      </div>
      {form.healthSystem === "isapre" && result.contributions.isapreExtraTotal > 0 && <p className="disclosure">Dato informativo: el plan de Isapre pactado supera el 7% en {formatClp(result.contributions.isapreExtraTotal)} durante el período. Esa diferencia no se incluye en el total.</p>}
      <details className="assumption-summary"><summary>Estimación separada: reajustes, intereses y multas (Ley 17.322)</summary>
        <dl className="metrics-grid"><div className="mortgage-metric"><dt>Reajuste</dt><dd>{formatClp(result.latePayment.reajuste)}</dd><small>Aproximado por la variación de la UF</small></div><div className="mortgage-metric"><dt>Interés penal</dt><dd>{formatClp(result.latePayment.interes)}</dd><small>{pct(result.latePayment.annualRate)} anual, capitalizado mensualmente</small></div><div className="mortgage-metric"><dt>Multas por no declarar</dt><dd>{formatClp(result.latePayment.multa)}</dd><small>{result.latePayment.fineUf} UF por mes</small></div><div className="mortgage-metric"><dt>Total estimado</dt><dd>{formatClp(result.latePayment.total)}</dd><small>No incluido en los totales</small></div></dl>
        <p className="claim-hint">Estimación gruesa: la tasa de interés corriente cambia cada mes y el reajuste legal usa el IPC. <SourceRefs ids={["ley-17322"]} numbers={sourceNumbers} /></p>
      </details>
      <p className="framework-note"><strong>Importante:</strong> lo que usted ya cotizó mediante la retención de honorarios (Ley 21.133) puede descontarse o compensarse y cambiar el resultado. Revíselo con un abogado. <SourceRefs ids={["ley-21133"]} numbers={sourceNumbers} /></p>

      <section className="claim-sources" aria-labelledby="claim-sources-title">
        <h3 id="claim-sources-title"><Scale size={18} /> Fuentes legales</h3>
        <ol>{result.sources.map((source) => <li id={`fuente-${source.id}`} key={source.id}>
          <strong>{source.titulo}</strong>{source.articulo && <> · {source.articulo}</>}
          {" "}{source.url ? <a href={source.url} target="_blank" rel="noreferrer">Abrir <ExternalLink size={13} /></a> : null}
          {source.estado === "pendiente" ? <span className="claim-badge">Pendiente de verificar</span> : <small> · verificada el {dateLabel(source.fechaVerificacion)}</small>}
        </li>)}</ol>
        {result.pendingParams.length > 0 && <details><summary>Parámetros pendientes de verificar usados en este cálculo ({result.pendingParams.length})</summary><ul>{result.pendingParams.map((param) => <li key={param.id}><code>{param.key}</code> desde {param.vigenteDesde}: {param.nota}</li>)}</ul></details>}
      </section>
    </section>}

    <aside className="methodology-section claim-disclaimer" aria-labelledby="claim-disclaimer-title">
      <h2 id="claim-disclaimer-title">Antes de decidir</h2>
      <p>Esta es una <strong>estimación orientativa, no asesoría legal</strong>. El resultado real depende de la prueba de la relación laboral, de lo que resuelva el tribunal y de lo que acuerden las partes. Consulte a un abogado laboral, a la Inspección del Trabajo o a la Corporación de Asistencia Judicial (atención gratuita).</p>
      <p><strong>Plazos clave:</strong> tiene <strong>60 días hábiles</strong> desde el término para demandar por despido (art. 168) o por tutela de derechos fundamentales (art. 486). El plazo se suspende al reclamar ante la Inspección del Trabajo, pero no puede superar 90 días hábiles en total.</p>
      <p className="claim-hint">Parámetros legales revisados el {dateLabel(LEGAL_PARAMS_REVIEWED_ON)}.</p>
    </aside>
  </main></PageShell>;
}
