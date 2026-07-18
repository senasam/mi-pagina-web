import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/InvestmentEvaluatorPage.jsx", import.meta.url), "utf8");
const guide = readFileSync(new URL("../src/InvestmentLearningPage.jsx", import.meta.url), "utf8");
const engine = readFileSync(new URL("../src/investmentEngine.js", import.meta.url), "utf8");
const endpoint = readFileSync(new URL("../api/indicadores/oportunidades.js", import.meta.url), "utf8");
const preOperationalEngine = readFileSync(new URL("../src/preOperationalEngine.js", import.meta.url), "utf8");
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
  for (const token of ["property", "comparable", "break-even", "Venta neta estimada", "Valor de continuar", "<caption>"]) assert.match(page, new RegExp(token));
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

test("agrega una capa preoperativa acotada sin reemplazar el motor anual", () => {
  for (const token of [
    "Compra nueva y período antes del arriendo",
    "Nueva con entrega inmediata",
    "Nueva con entrega futura",
    "Nueva en verde",
    "Nueva en blanco",
    "VPN ajustado desde hoy",
    "Capital máximo acumulado",
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
  for (const token of ["Supuestos iniciales", "Operación proyectada", "Riesgos y condiciones pendientes", "Siguientes pasos", "Aviso académico y de responsabilidad"]) assert.match(page, new RegExp(token));
  assert.match(engine, /Avanzar con condiciones/);
  assert.match(engine, /No avanzar bajo estos supuestos/);
  assert.match(page, /puede contener errores/);
  assert.match(page, /comité de riesgo de un\s+banco/);
  assert.match(engine, /assessInvestmentDecision/);
});

test("no persiste ni incorpora valores financieros en analítica o URL", () => {
  assert.doesNotMatch(page, /localStorage|sessionStorage/);
  assert.doesNotMatch(page, /URLSearchParams|history\.pushState/);
  assert.doesNotMatch(page, /trackEvent\([^\n]+propertyPrice|trackEvent\([^\n]+monthlyRent|trackEvent\([^\n]+npv/);
});

test("la guía distingue NOI, flujo, venta y continuidad", () => {
  for (const token of ["NOI", "Flujo antes de impuestos", "Venta neta", "Continuidad", "no se suma a la venta"]) assert.match(guide, new RegExp(token, "i"));
});
