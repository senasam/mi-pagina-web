import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { trackEvent } from "./analytics";
import { CopyToClipboard, Breadcrumbs, PageShell } from "./LearningComponents";
import { generateNetworkingMessage, validateMessageForm } from "./messageGenerator";
import { usePageMetadata } from "./seo";

const initialValues = {
  userName: "", currentSituation: "", contactName: "", contactContext: "", organization: "",
  objective: "", specificReason: "", sharedConnection: "", contribution: "", duration: "20", channel: "linkedin", tone: "profesional",
};

const fields = [
  ["userName", "Tu nombre", "Ej.: Camila", true],
  ["currentSituation", "Situación actual", "Ej.: estoy terminando mis estudios y explorando el sector", true],
  ["contactName", "Nombre de la persona", "Ej.: Andrea", true],
  ["contactContext", "Rol o contexto de la persona", "Ej.: líder de producto", true],
  ["organization", "Empresa, universidad o industria", "Ej.: industria de tecnología educativa", true],
  ["objective", "Objetivo de la conversación", "Ej.: comprender cómo se desarrolla una carrera en producto", true],
  ["specificReason", "Razón específica para contactar a esta persona", "Ej.: su transición desde educación hacia producto se relaciona con mi interés", true],
  ["sharedConnection", "Conexión o punto en común (opcional)", "Ej.: estudiamos en la misma universidad", false],
  ["contribution", "Algo que puedes compartir (opcional)", "Ej.: una perspectiva sobre el mercado local o un recurso relevante", false],
];

export default function MessageGeneratorPage() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [variation, setVariation] = useState(0);
  const [generating, setGenerating] = useState(false);
  const schema = useMemo(() => ({ "@context": "https://schema.org", "@type": "WebApplication", name: "Generador de mensajes de networking", url: "https://masanes.cl/herramientas/generador-mensajes-networking", applicationCategory: "BusinessApplication", operatingSystem: "Web browser", offers: { "@type": "Offer", price: "0", priceCurrency: "CLP" } }), []);
  usePageMetadata({ title: "Generador de mensajes de networking", description: "Crea un primer mensaje profesional, breve y personalizado para LinkedIn, email o mensajería.", path: "/herramientas/generador-mensajes-networking", schema });
  useEffect(() => trackEvent("networking_generator_viewed"), []);

  const update = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  };
  const runGeneration = (nextVariation) => {
    const validation = validateMessageForm(values);
    setErrors(validation);
    if (Object.keys(validation).length) {
      setMessage("");
      requestAnimationFrame(() => document.querySelector("[aria-invalid='true']")?.focus());
      return;
    }
    setGenerating(true);
    requestAnimationFrame(() => {
      const result = generateNetworkingMessage(values, nextVariation);
      setMessage(result.message); setVariation(nextVariation); setGenerating(false);
      trackEvent("networking_message_generated", { channel: values.channel, tone: values.tone });
    });
  };
  const clear = () => { setValues(initialValues); setErrors({}); setMessage(""); setVariation(0); };

  return (
    <PageShell>
      <main id="main-content" className="content-page tool-page">
        <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Herramientas", href: "/herramientas" }, { label: "Generador de mensajes", href: "/herramientas/generador-mensajes-networking" }]} />
        <header className="page-hero page-hero--compact"><p className="eyebrow">Herramienta interactiva</p><h1>Generador de mensajes de networking</h1><p>Prepara un primer contacto conciso y respetuoso. Los datos se procesan solo en tu navegador: no se guardan ni se envían a servicios externos.</p></header>
        <div className="generator-layout">
          <form className="generator-form" onSubmit={(event) => { event.preventDefault(); runGeneration(variation); }} noValidate>
            <div className="form-section-heading"><h2>Información para el mensaje</h2><p>Los campos marcados con * son obligatorios.</p></div>
            <div className="form-grid">{fields.map(([name, label, placeholder, required]) => <div className={name === "objective" || name === "specificReason" ? "field field--wide" : "field"} key={name}><label htmlFor={name}>{label}{required ? " *" : ""}</label>{name === "objective" || name === "specificReason" ? <textarea id={name} name={name} value={values[name]} onChange={update} placeholder={placeholder} required={required} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-error` : undefined} rows="3" /> : <input id={name} name={name} value={values[name]} onChange={update} placeholder={placeholder} required={required} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-error` : name === "contribution" ? "contribution-help" : undefined} />}{name === "contribution" && <span className="field-hint" id="contribution-help">No necesitas ofrecer un intercambio para pedir una conversación respetuosa.</span>}{errors[name] && <span className="field-error" id={`${name}-error`}>{errors[name]}</span>}</div>)}</div>
            <div className="choice-grid">
              <fieldset><legend>Duración solicitada</legend>{["15", "20", "30"].map((value) => <label key={value}><input type="radio" name="duration" value={value} checked={values.duration === value} onChange={update} />{value} minutos</label>)}</fieldset>
              <div className="field"><label htmlFor="channel">Canal</label><select id="channel" name="channel" value={values.channel} onChange={update}><option value="linkedin">LinkedIn</option><option value="email">Email</option><option value="mensaje">Mensaje corto</option></select></div>
              <div className="field"><label htmlFor="tone">Tono</label><select id="tone" name="tone" value={values.tone} onChange={update}><option value="profesional">Profesional</option><option value="cercano">Cálido</option><option value="directo">Directo</option></select></div>
            </div>
            <div className="form-actions"><button className="button button--primary" type="submit" disabled={generating}><Sparkles size={17} />{generating ? "Generando…" : "Generar mensaje"}</button><button className="button button--secondary" type="button" onClick={clear}><Trash2 size={17} />Limpiar formulario</button></div>
          </form>
          <section className="generator-output" aria-labelledby="output-title"><div className="output-heading"><div><p className="eyebrow">Borrador</p><h2 id="output-title">Tu mensaje</h2></div>{message && <button className="text-button" type="button" onClick={() => runGeneration(variation + 1)}><RefreshCw size={16} />Generar otra versión</button>}</div><div className={`message-preview ${message ? "" : "message-preview--empty"}`}><p>{message || "Completa el formulario para generar un borrador."}</p></div>{message && <><p className="output-reminder">Revisa y personaliza el mensaje antes de enviarlo. Una referencia específica a la experiencia de la otra persona puede mejorar considerablemente el resultado. Si no recibes respuesta, no asumas automáticamente que se trata de un rechazo personal.</p><CopyToClipboard text={message} onCopy={() => trackEvent("networking_message_copied", { channel: values.channel, tone: values.tone })} /></>}<span className="sr-only" role="status" aria-live="polite">{generating ? "Generando mensaje" : message ? "Mensaje generado" : ""}</span></section>
        </div>
        <a className="back-link" href="/herramientas"><ArrowLeft size={16} />Volver a Herramientas</a>
      </main>
    </PageShell>
  );
}
