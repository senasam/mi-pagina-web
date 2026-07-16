import { useEffect, useMemo, useState } from "react";
import { ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { trackEvent } from "./analytics";
import { Breadcrumbs, CopyToClipboard, PageShell } from "./LearningComponents";
import { generateImpactBullets } from "./impactBulletGenerator";
import { breadcrumbSchema, usePageMetadata } from "./seo";

const graphNode = ({ "@context": _context, ...node }) => node;

const initial = { context: "", action: "", method: "", result: "", metric: "", skill: "", target: "" };
const fields = [
  ["context", "Contexto o desafío", "Ej.: el equipo preparaba reportes manuales desde cuatro fuentes", true],
  ["action", "Acción personal", "Ej.: automaticé la consolidación de datos", true],
  ["method", "Método o herramienta", "Ej.: consultas reproducibles y controles de calidad"],
  ["result", "Resultado verificable", "Ej.: reduje el tiempo de preparación mensual", true],
  ["metric", "Métrica real (opcional)", "Ej.: de dos días a cuatro horas"],
  ["skill", "Habilidad que quieres evidenciar (opcional)", "Ej.: análisis y mejora de procesos"],
  ["target", "Objetivo del trabajo (opcional)", "Ej.: acelerar la revisión comercial"],
];

export default function ImpactBulletBuilderPage() {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [bullets, setBullets] = useState([]);
  const [version, setVersion] = useState(0);
  const breadcrumbs = [{ label: "Inicio", href: "/" }, { label: "Herramientas", href: "/herramientas" }, { label: "Constructor de bullets", href: "/herramientas/constructor-bullets-consultoria" }];
  const schema = useMemo(() => ({ "@context": "https://schema.org", "@graph": [graphNode(breadcrumbSchema(breadcrumbs)), { "@type": "WebApplication", name: "Constructor de bullets para consultoría", applicationCategory: "EducationalApplication", operatingSystem: "Web", url: "https://masanes.cl/herramientas/constructor-bullets-consultoria" }] }), []);
  usePageMetadata({ title: "Constructor de bullets para CV de consultoría", description: "Genera variaciones claras de un logro profesional usando solo acciones, resultados y métricas que tú proporcionas.", path: "/herramientas/constructor-bullets-consultoria", schema });
  useEffect(() => trackEvent("consulting_tool_opened", { tool: "impact-bullet" }), []);

  const generate = (nextVersion = version) => {
    const result = generateImpactBullets(values, nextVersion);
    setErrors(result.errors); setBullets(result.bullets);
    if (result.bullets.length) trackEvent("consulting_bullets_generated", { tool: "impact-bullet" });
  };
  const reset = () => { setValues(initial); setErrors({}); setBullets([]); setVersion(0); };

  return <PageShell><main id="main-content" className="content-page"><Breadcrumbs items={breadcrumbs} /><header className="page-hero"><div><p className="eyebrow">Herramienta local</p><h1>Constructor de bullets de impacto</h1><p className="page-hero__lead">Convierte hechos verificables de tu experiencia en tres borradores claros para un CV de consultoría.</p><p>La herramienta trabaja en tu navegador: no envía ni guarda lo que escribes.</p></div></header><div className="generator-layout"><form className="generator-form" noValidate onSubmit={(event) => { event.preventDefault(); generate(); }}><div className="form-section-heading"><p className="eyebrow">Tu evidencia</p><h2>Describe lo que realmente hiciste</h2><p>Los campos marcados son obligatorios. No incluyas información confidencial.</p></div>{fields.map(([name, label, placeholder, required]) => <label className="field" key={name} htmlFor={`bullet-${name}`}><span>{label}{required ? " *" : ""}</span><textarea id={`bullet-${name}`} rows="3" value={values[name]} placeholder={placeholder} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `error-${name}` : undefined} onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))} />{errors[name] && <small className="field-error" id={`error-${name}`}>{errors[name]}</small>}</label>)}<div className="form-actions"><button className="button button--primary" type="submit"><Sparkles size={17} />Crear borradores</button><button className="button button--secondary" type="button" onClick={reset}><RotateCcw size={16} />Limpiar</button></div></form><aside className="generator-output" aria-live="polite"><div className="output-heading"><div><p className="eyebrow">Resultado</p><h2>Tres formas de contar el logro</h2></div></div>{bullets.length ? <><ol className="bullet-results">{bullets.map((bullet, index) => <li key={bullet}><p>{bullet}</p><CopyToClipboard text={bullet} label={`Copiar versión ${index + 1}`} onCopy={() => trackEvent("consulting_bullet_copied", { tool: "impact-bullet" })} /></li>)}</ol><button className="button button--secondary" type="button" onClick={() => { const next = version + 1; setVersion(next); generate(next); }}><RotateCcw size={16} />Generar otras versiones</button></> : <div className="output-placeholder"><Sparkles size={28} /><p>Completa el contexto, tu acción y un resultado verificable para generar los borradores.</p></div>}<p className="output-reminder">Revisa sintaxis, propiedad de la acción y evidencia. La herramienta no comprueba los hechos ni inventa métricas: si no proporcionas una, no añade ninguna.</p></aside></div><aside className="contextual-cta"><div><h2>¿Quieres preparar el CV completo?</h2><p>Revisa el módulo de CV, el inventario de experiencias y el checklist antes de postular.</p></div><a className="button button--primary" href="/aprende/consultoria/cv-consultoria">Ir al módulo de CV <ArrowRight size={17} /></a></aside></main></PageShell>;
}
