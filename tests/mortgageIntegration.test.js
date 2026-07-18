import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = async (path) => readFile(new URL(path, import.meta.url), "utf8");

test("registra las dos rutas, metadata, schema y sitemap", async () => {
  const [app, calculator, learning, sitemap] = await Promise.all([source("../src/App.jsx"), source("../src/MortgageCalculatorPage.jsx"), source("../src/MortgageLearningPage.jsx"), source("../public/sitemap.xml")]);
  assert.match(app, /\/herramientas\/calculadora-hipotecaria/);
  assert.match(app, /\/aprende\/finanzas-personales\/como-evaluar-un-credito-hipotecario/);
  assert.match(calculator, /WebApplication/);
  assert.match(learning, /LearningResource/);
  assert.match(sitemap, /calculadora-hipotecaria/);
});

test("incluye modos, acciones, privacidad y alternativas accesibles", async () => {
  const calculator = await source("../src/MortgageCalculatorPage.jsx");
  for (const token of ["UF de la simulación", "Desarrollo mensual de la cuota", "Eje vertical", "Componentes visibles", "Columnas apiladas", "paymentTicks", "Número de cuota", "visibleSeries.principal && <rect", "visibleSeries.interest && <rect", "visibleSeries.costs && <rect", "principal: true", "interest: true", "costs: false", "onPointerMove={selectFromPointer}", "Amortización", "Seguros", "Estimar un crédito", "Estimar valor compatible", "Añadir escenario", "Duplicar escenario", "Copiar resumen", "Imprimir", "Resumen anual", "Detalle mensual", "aria-live", "table", "data-private"]) assert.match(calculator, new RegExp(token));
  assert.doesNotMatch(calculator, /cada 12 meses representa un año/);
  assert.match(calculator, /Eje vertical izquierdo:<\/strong> porcentaje de la cuota/);
  assert.doesNotMatch(calculator, /percentage-line|percentagePoints/);
  assert.match(calculator, /selected-payment-details--side/);
  assert.doesNotMatch(calculator, /monthly-tooltip/);
  assert.doesNotMatch(calculator, /payment-picker|composition-payment|Explorar una cuota con teclado/);
  assert.doesNotMatch(calculator, /localStorage|sessionStorage|URLSearchParams/);
  assert.doesNotMatch(calculator, /trackEvent\([^\n]*(amount|income|debt|principal|rate)/i);
});

test("modela gastos operacionales y el beneficio DFL2 de forma explícita", async () => {
  const [calculator, engine] = await Promise.all([source("../src/MortgageCalculatorPage.jsx"), source("../src/mortgageEngine.js")]);
  for (const token of ["Tasación de la propiedad", "Estudio de títulos", "Borrador de escritura", "Notaría", "Conservador de Bienes Raíces", "Impuesto al mutuo", "primera transferencia", "dentro de 2 años", "persona natural", "0,2% (beneficio DFL2)", "0,8% (tasa general)"]) assert.ok(calculator.includes(token), `Falta el texto: ${token}`);
  assert.match(engine, /GENERAL: 0\.008, DFL2: 0\.002/);
  assert.match(engine, /priorBenefitedHomes < 2/);
});

test("contiene doce casos originales y el aviso educativo en cada tarjeta", async () => {
  const learning = await source("../src/MortgageLearningPage.jsx");
  const caseEntries = (learning.match(/^  \["/gm) || []).length;
  assert.ok(caseEntries >= 23);
  assert.match(learning, /cases\.map/);
  assert.match(learning, /Caso ficticio creado con fines educativos/);
});

test("endpoint mantiene secreto server-side, caché diaria y fallback manual", async () => {
  const [endpoint, calculator] = await Promise.all([source("../api/indicadores/uf.js"), source("../src/MortgageCalculatorPage.jsx")]);
  assert.match(endpoint, /process\.env\.CMF_API_KEY/);
  assert.match(endpoint, /s-maxage=86400/);
  assert.match(endpoint, /stale-while-revalidate/);
  assert.doesNotMatch(calculator, /CMF_API_KEY|apikey/);
  assert.match(calculator, /manual-uf/);
  assert.match(calculator, /Usar valor automático/);
});

test("Vite ejecuta el endpoint UF durante desarrollo y preview local", async () => {
  const vite = await source("../vite.config.js");
  assert.match(vite, /configureServer: install/);
  assert.match(vite, /configurePreviewServer: install/);
  assert.match(vite, /resolveUf\(\{ apiKey \}\)/);
  assert.match(vite, /loadEnv\(mode, process\.cwd\(\), ""\)/);
});
