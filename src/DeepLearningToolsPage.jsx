import { useState } from "react";
import { forwardPass, interpretCurve, planAdaptation } from "./deepLearningTools";
import { Breadcrumbs, PageShell } from "./LearningComponents";
import { usePageMetadata } from "./seo";
import { trackEvent } from "./analytics";

const configs = {
  network: { title: "Explorador de red neuronal", path: "/herramientas/explorador-red-neuronal", initial: { inputs: "1 2", weights: "0.5 -0.2\n1 0.3", hiddenBiases: "0.1 -0.1", outputWeights: "0.7 -0.4", outputBias: "0.2", hiddenActivation: "relu", outputActivation: "sigmoid" } },
  curve: { title: "Intérprete de curvas de entrenamiento", path: "/herramientas/interpretar-curvas-entrenamiento", initial: { epochs: "40", train0: "1.2", valid0: "1.3", rate: "0.08", turn: "22", noise: "0.03", seed: "123" } },
  strategy: { title: "Planificador de estrategia de IA", path: "/herramientas/elegir-estrategia-ia", initial: { task: "retrieval", approvedKnowledge: "yes", change: "frequent", deterministic: "no", highImpact: "no", labels: "no", domainBehavior: "no", isolated: "no", humanReview: "yes", detectable: "yes", rules: "yes" } },
};
const labels = { inputs: "Entradas", weights: "Pesos ocultos; una fila por unidad", hiddenBiases: "Sesgos ocultos", outputWeights: "Pesos de salida", outputBias: "Sesgo de salida", hiddenActivation: "Activación oculta", outputActivation: "Activación de salida", epochs: "Épocas", train0: "Pérdida inicial de entrenamiento", valid0: "Pérdida inicial de validación", rate: "Tasa de mejora", turn: "Punto de giro", noise: "Ruido", seed: "Semilla", task: "Tarea", approvedKnowledge: "¿Requiere fuentes aprobadas?", change: "Cambio del conocimiento", deterministic: "¿Salida determinista?", highImpact: "¿Alto impacto?", labels: "¿Ejemplos etiquetados?", domainBehavior: "¿Conducta especializada?", isolated: "¿Ejecución aislada?", humanReview: "¿Revisión humana?", detectable: "¿Falla fácil de detectar?", rules: "¿Reglas son factibles?" };
const yesNo = [["yes", "Sí"], ["no", "No"]];
const selects = {
  hiddenActivation: [["linear", "Lineal"], ["relu", "ReLU"], ["sigmoid", "Sigmoide"], ["tanh", "Tanh"]],
  outputActivation: [["linear", "Lineal"], ["sigmoid", "Sigmoide"]],
  task: [["retrieval", "Recuperación"], ["extraction", "Extracción"], ["classification", "Clasificación"], ["summarization", "Resumen"], ["draft", "Borrador"], ["imageAnalysis", "Análisis de imagen"], ["imageGeneration", "Generación de imagen"]],
  change: [["stable", "Poco"], ["frequent", "Frecuente"]],
  ...Object.fromEntries(["approvedKnowledge", "deterministic", "highImpact", "labels", "domainBehavior", "isolated", "humanReview", "detectable", "rules"].map((key) => [key, yesNo])),
};

export default function DeepLearningToolsPage({ kind }) {
  const cfg = configs[kind] || configs.network;
  const [values, setValues] = useState(cfg.initial);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  usePageMetadata({ title: cfg.title, description: `Herramienta educativa local: ${cfg.title}.`, path: cfg.path, schema: { "@context": "https://schema.org", "@type": "WebApplication", name: cfg.title, url: `https://masanes.cl${cfg.path}`, dateModified: "2026-07-16", inLanguage: "es" } });
  const run = (event) => { event.preventDefault(); const next = kind === "network" ? forwardPass(values) : kind === "curve" ? interpretCurve(values) : planAdaptation(values); setResult(next); trackEvent("deep_learning_tool_completed", { tool: kind, valid: !Object.keys(next.errors || {}).length }); };
  const summary = result && !Object.keys(result.errors || {}).length ? JSON.stringify(result, (key, value) => ["train", "validation"].includes(key) ? undefined : value, 2) : "";
  return <PageShell><main id="main-content" className="content-page tool-page"><Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Herramientas", href: "/herramientas" }, { label: cfg.title, href: cfg.path }]}/><header className="tool-header"><p className="eyebrow">Herramienta local</p><h1>{cfg.title}</h1><p>Usa configuraciones ficticias. No se llama a modelos externos ni se guardan respuestas.</p></header><form className="generator-form" onSubmit={run} noValidate>{Object.keys(cfg.initial).map((key) => <div className="form-field" key={key}><label htmlFor={key}>{labels[key]}</label>{selects[key] ? <select id={key} value={values[key]} onChange={(e) => setValues({ ...values, [key]: e.target.value })}>{selects[key].map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select> : <textarea id={key} rows={key === "weights" ? 4 : 2} value={values[key]} onChange={(e) => setValues({ ...values, [key]: e.target.value })}/>}</div>)}<div className="form-actions"><button className="button button--primary">Calcular</button><button type="button" className="button button--secondary" onClick={() => { setValues(cfg.initial); setResult(null); trackEvent("deep_learning_tool_reset", { tool: kind }); }}>Cargar ejemplo / reiniciar</button></div></form><section className="generator-output" aria-live="polite"><h2>Resultado</h2>{result?.errors && Object.keys(result.errors).length > 0 && <div role="alert"><h3>Revisa los campos</h3><ul>{Object.values(result.errors).map((error) => <li key={error}>{error}</li>)}</ul></div>}{kind === "curve" && result?.table && <div className="table-wrapper"><table><caption>Curvas sintéticas: alternativa textual al gráfico</caption><thead><tr><th>Época</th><th>Entrenamiento</th><th>Validación</th></tr></thead><tbody>{result.table.map((row) => <tr key={row.epoch}><td>{row.epoch}</td><td>{row.training.toFixed(4)}</td><td>{row.validation.toFixed(4)}</td></tr>)}</tbody></table></div>}{summary && <><pre>{summary}</pre><div className="form-actions"><button type="button" className="button button--secondary" onClick={async () => { await navigator.clipboard.writeText(summary); setCopied(true); }}>{copied ? "Copiado" : "Copiar"}</button><button type="button" className="button button--secondary" onClick={() => print()}>Imprimir</button></div></>}</section></main></PageShell>;
}
