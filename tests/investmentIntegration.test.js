import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/InvestmentEvaluatorPage.jsx", import.meta.url), "utf8");
const guide = readFileSync(new URL("../src/InvestmentLearningPage.jsx", import.meta.url), "utf8");
const engine = readFileSync(new URL("../src/investmentEngine.js", import.meta.url), "utf8");
const endpoint = readFileSync(new URL("../api/indicadores/oportunidades.js", import.meta.url), "utf8");
const preOperationalEngine = readFileSync(new URL("../src/preOperationalEngine.js", import.meta.url), "utf8");
const helpContent = readFileSync(new URL("../src/investmentHelpContent.js", import.meta.url), "utf8");
const technicalHelp = readFileSync(new URL("../src/TechnicalHelp.jsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/index.css", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");

test("publica evaluador y guía con SEO y sitemap", () => {
  for (const route of ["/herramientas/evaluador-inversion-inmobiliaria", "/aprende/finanzas-personales/evaluar-inversion-inmobiliaria"]) {
    assert.match(app, new RegExp(route));
    assert.match(sitemap, new RegExp(route));
  }
  assert.match(page, /WebApplication/);
  assert.match(guide, /LearningResource/);
});

test("reutiliza hipoteca y corretaje sin duplicar sus fórmulas", () => {
  assert.match(engine, /import \{ calculateMortgage \}/);
  assert.match(page, /calculateBrokerageCommission/);
  assert.doesNotMatch(engine, /principal \* monthlyRate \/ \(1 -/);
});

test("incluye los tres modos, alternativas separadas y tabla accesible", () => {
  for (const token of ["property", "comparable", "break-even", "Si vendes e inviertes en tu mejor alternativa", "Si sigues arrendando", "<caption>"]) assert.match(page, new RegExp(token));
  for (const token of [
    "Decisión en el año",
    "¿Qué opción te dejaría más dinero al año",
    "en vez de",
    "a tener una mayor riqueza, igual",
    "saleVsHoldValue",
    "¿Cómo se calcula esta comparación?",
    "sellAndInvestTerminalWealthUf",
    "holdUntilHorizonTerminalWealthUf",
    "terminalWealthDifferenceUf",
  ]) assert.match(page, new RegExp(token.replace(/[?]/g, "\\?")));
  assert.doesNotMatch(page, /className="prepayment-summary"/);
  assert.doesNotMatch(page, /className="terminal-submetric"/);
  assert.doesNotMatch(page, /invertir indefinidamente|VPN de los flujos hasta/);
  assert.match(page, /aria-live/);
  assert.match(page, /fieldset/);
  assert.match(page, /data-private/);
});

test("explica los tres tipos de cálculo sin lenguaje técnico", () => {
  for (const label of [
    "¿Qué quieres calcular?",
    "Evaluar una propiedad",
    "Estimar el arriendo",
    "Calcular qué tendría que cambiar",
  ])
    assert.match(page, new RegExp(label.replace(/[?]/g, "\\?")));
  assert.doesNotMatch(
    page,
    /¿Qué quieres explorar\?|Estimar desde un comparable|condición objetivo/,
  );
});

test("permite ingresar UF o CLP, muestra equivalencias y explica siglas", () => {
  assert.match(page, /currency-mode/);
  assert.match(page, /MoneyInput/);
  assert.match(page, /MoneyValue/);
  assert.match(page, /Precio de venta de la propiedad/);
  assert.match(page, /Tasación del banco \(opcional\)/);
  assert.match(page, /secondary &&/);
  assert.doesNotMatch(page, /Equivalencia disponible cuando exista una UF válida/);
  assert.match(page, /% en pesos/);
  for (const acronym of ["NOI", "VPN", "TIR", "MIRR", "DSCR", "CAPEX"]) assert.match(page, new RegExp(`<dt>${acronym}</dt>`));
});

test("expresa el IVA del corretaje como + IVA o IVA incluido", () => {
  assert.match(page, /¿Cómo aparece la comisión en la cotización\?/);
  assert.match(page, />\+ IVA</);
  assert.match(page, />IVA incluido</);
  assert.doesNotMatch(page, /IVA agregado|Comisión neta o ingresada/);
});

test("carga inflación oficial y patrones de inversión comprensibles", () => {
  assert.match(page, /api\/indicadores\/oportunidades/);
  assert.match(page, /Depósitos a plazo/);
  assert.match(page, /Cuenta 2/);
  assert.match(page, /UF \+/);
  assert.doesNotMatch(page, /Multifondos AFP/);
  assert.match(page, /Restaurar dato oficial/);
  assert.match(page, /custom-rate-option/);
});

test("parte con 70% de financiamiento y una tasa hipotecaria oficial editable", () => {
  assert.match(page, /financingRatio: 70/);
  assert.match(endpoint, /F022\.VIV\.TIP\.MA03\.UF\.Z\.M/);
  assert.match(page, /Promedio ponderado de créditos de vivienda en UF/);
  assert.match(page, /No está ajustada al plazo elegido/);
  assert.match(page, /No es una oferta bancaria/);
  assert.match(page, /Restaurar tasa oficial/);
  assert.match(page, /setCreditRateMode\("manual"\)/);
});

test("usa nombres cotidianos, nuevos valores iniciales y ubica la equivalencia de ocupación junto al campo", () => {
  for (const token of [
    "Estado de la propiedad",
    "Financiamiento de la propiedad",
    "Gastos operacionales del crédito",
    "¿Qué otros gastos crees que tendrás al año?",
    "Comisión de venta corredor de propiedades IVA incluido",
    "Costos por arreglos para vender la vivienda",
    "Reparación mayor de la vivienda",
    "Costos de la reparación mayor",
  ]) assert.match(page, new RegExp(token.replace(/[?]/g, "\\?")));
  assert.match(page, /termYears: 20/);
  assert.match(page, /brokerageAmount: "2\.0"/);
  assert.match(page, /rentGrowthRate: 0/);
  assert.match(page, /saleCostRate: 2\.38/);
  assert.doesNotMatch(page, /El corretaje de venta se configura por separado como costo de salida/);
  const occupancyField = page.indexOf('id="occupancy"');
  const occupancyExplanation = page.indexOf("Una ocupación de ${form.occupancyRate}%", occupancyField);
  const rentGrowthField = page.indexOf('id="rent-growth"');
  assert.ok(occupancyField >= 0 && occupancyField < occupancyExplanation && occupancyExplanation < rentGrowthField);
});

test("presenta todos los porcentajes como sliders entre 0 y 100 con su valor visible", () => {
  assert.match(page, /const isPercentage = String\(unit \|\| ""\)\.startsWith\("%"\)/);
  assert.match(page, /className="percentage-slider"/);
  assert.match(page, /type="range"/);
  assert.match(page, /min="0"/);
  assert.match(page, /max="100"/);
  assert.match(page, /formatNumericInput\(percentageDisplayValue\)/);
  assert.match(page, /aria-valuetext/);
  assert.match(css, /\.percentage-slider/);
});

test("permite subir y bajar años y UF de una unidad con controles táctiles", () => {
  assert.match(page, /className="numeric-stepper"/);
  assert.match(page, /\["UF", "año", "años"\]/);
  assert.match(page, /currencyMode === "uf"/);
  assert.match(page, /onClick=\{\(\) => adjust\(-1\)\}/);
  assert.match(page, /onClick=\{\(\) => adjust\(1\)\}/);
  assert.match(page, /numericUfValue - 1/);
  assert.match(page, /numericUfValue \+ 1/);
  assert.match(page, /aria-label=\{`Disminuir/);
  assert.match(page, /aria-label=\{`Aumentar/);
  assert.match(css, /\.numeric-stepper/);
  assert.match(css, /touch-action: manipulation/);
});

test("agrega una capa preoperativa acotada sin reemplazar el motor anual", () => {
  for (const token of [
    "Propiedad nueva: antes de que empiece a arrendarse",
    "Nueva con entrega inmediata",
    "Nueva con entrega futura",
    "Nueva en verde",
    "Nueva en blanco",
    "Resultado total desde hoy",
    "Máximo dinero que tendrías que haber puesto antes del primer arriendo",
    "Escenarios de atraso antes del primer arriendo",
  ])
    assert.match(page, new RegExp(token));
  assert.match(preOperationalEngine, /operatingResult\.npvUf \+ operatingResult\.initialEquityUf/);
  assert.match(preOperationalEngine, /evaluateDeliveryScenarios/);
  assert.doesNotMatch(preOperationalEngine, /function calculateMortgage|function projectInvestment/);
  assert.match(page, /window\.confirm/);
});

test("explica objetivamente la etapa de cada estado de propiedad nueva", () => {
  for (const token of [
    "¿Qué significa cada estado del proyecto?",
    "Solo terreno",
    "Terreno y construcción iniciada",
    "Construcción con fecha estimada de entrega",
    "Construcción finalizada",
  ])
    assert.match(page, new RegExp(token.replace(/[?]/g, "\\?")));
  assert.doesNotMatch(page, /Precio habitual|Puede ser conveniente cuando/);
});

test("simplifica DFL 2 y lo selecciona por defecto al cambiar a propiedad nueva", () => {
  assert.match(page, /<option value="confirmed">Sí<\/option>/);
  assert.match(page, /<option value="unknown">No o no sabe<\/option>/);
  assert.match(page, /\? "confirmed"/);
  assert.doesNotMatch(page, /No aplica<\/option>|Confirmada por el usuario/);
});

test("estima la comisión de prepago UF y permite reemplazarla por el certificado bancario", () => {
  assert.match(page, /1,5 meses de interés/);
  assert.match(page, /Monto mínimo contractual de prepago parcial/);
  assert.match(page, /certificado de liquidación/);
  assert.match(engine, /estimatePrepaymentCommission/);
});

test("entrega un resumen final para avanzar o no avanzar con riesgos, pasos y aviso académico", () => {
  for (const token of ["Supuestos iniciales", "Qué pasa con el arriendo", "Riesgos y condiciones pendientes", "Siguientes pasos", "Aviso académico y de responsabilidad"]) assert.match(page, new RegExp(token));
  assert.match(engine, /Avanzar con condiciones/);
  assert.match(engine, /No avanzar bajo estos supuestos/);
  assert.match(page, /puede contener errores/);
  assert.match(page, /comité de riesgo de un\s+banco/);
  assert.match(engine, /assessInvestmentDecision/);
});

test("usa Depende y explica los resultados mixtos favorables con aporte operativo", () => {
  assert.match(page, /const dependsOnCashFlow/);
  assert.match(page, /\? "Depende"/);
  assert.match(page, /Por qué el resultado depende de tu capacidad de aportar/);
  assert.match(page, /la inversión supera a la alternativa en el\s+largo plazo, pero el arriendo no cubre completamente el crédito/i);
  assert.match(page, /Podría ser razonable avanzar únicamente si\s+puedes financiar esos aportes/i);
  assert.match(page, /<p className="result-heading__label">Resultado de tu simulación<\/p>\s*<h2>\s*<button/);
  assert.match(page, /result-heading__note/);
  assert.match(page, /className="result-heading__decision"/);
  assert.match(page, /scrollIntoView\(\{ block: "start", behavior: "smooth" \}\)/);
  assert.match(page, /Ver explicación y resumen final/);
  assert.match(page, /dependsOnCashFlow \? "Depende" : decision\.label/);
});

test("prioriza una lectura cotidiana y mantiene los indicadores en una capa avanzada", () => {
  for (const token of [
    "¿Conviene comprar este departamento para arrendarlo?",
    "Compra y financiamiento",
    "Arriendo y meses sin arrendatario",
    "Gastos de mantener la propiedad",
    "Qué pasa después",
    "Resultado de tu simulación",
    "Dinero que necesitas poner al comienzo",
    "Comparación con tu otra alternativa",
    "Ver indicadores financieros avanzados",
  ]) assert.match(page, new RegExp(token.replace(/[?]/g, "\\?")));
  assert.doesNotMatch(page, /Marco de lectura|<legend>1\. Adquisición y recursos|<legend>2\. Renta y vacancia/);
});

test("explica qué cambia en cada escenario y traduce el signo de la comparación", () => {
  for (const token of [
    "Comparamos tres versiones de la misma compra",
    "Meses arrendados",
    "Arriendo mensual",
    "Cambio anual del valor, además de la UF",
    "La propiedad sería mejor que la otra inversión por",
    "La otra inversión sería mejor que la propiedad por",
    "no es dinero disponible en tu cuenta",
    "No cambia porque el precio, el crédito y los gastos de compra son iguales",
  ]) assert.match(page, new RegExp(token));
});

test("ofrece una tabla anual simple antes de la tabla financiera detallada", () => {
  for (const token of ["Arriendo recibido", "Gastos", "Pago del crédito", "Tú aportas o recibes", "Deuda pendiente", "Ver tabla financiera detallada"])
    assert.match(page, new RegExp(token));
  assert.ok(page.indexOf("SimpleProjectionTable") < page.indexOf("function ProjectionTable"));
});

test("centraliza la ayuda técnica en un diálogo modal y devuelve el foco al cerrarlo", () => {
  for (const token of ["technical", "formula", "includes", "excludes", "warning"])
    assert.match(helpContent, new RegExp(token));
  assert.match(technicalHelp, /<dialog/);
  assert.match(technicalHelp, /showModal\(\)/);
  assert.match(technicalHelp, /onClose=\{\(\) => triggerRef\.current\?\.focus\(\)\}/);
  assert.match(technicalHelp, /aria-haspopup="dialog"/);
  assert.match(technicalHelp, /aria-label=\{label\}/);
  assert.doesNotMatch(technicalHelp, /CircleHelp[^\n]+\{label\}/);
  assert.match(technicalHelp, /aria-label="Cerrar explicación"/);
});

test("no persiste ni incorpora valores financieros en analítica o URL", () => {
  assert.doesNotMatch(page, /localStorage|sessionStorage/);
  assert.doesNotMatch(page, /URLSearchParams|history\.pushState/);
  assert.doesNotMatch(page, /trackEvent\([^\n]+propertyPrice|trackEvent\([^\n]+monthlyRent|trackEvent\([^\n]+npv/);
});

test("la guía distingue NOI, flujo, venta y continuidad", () => {
  for (const token of ["NOI", "Flujo antes de impuestos", "Venta neta", "Continuidad", "no se suma a la venta"]) assert.match(guide, new RegExp(token, "i"));
});
