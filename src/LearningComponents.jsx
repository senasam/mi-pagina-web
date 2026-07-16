import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Calendar, Check, Clipboard, Menu, RotateCcw, X } from "lucide-react";
import { trackEvent } from "./analytics";

export const primaryNavigation = [
  ["Servicios", "/#services"],
  ["Aprende", "/aprende"],
  ["Herramientas", "/herramientas"],
  ["Sobre mí", "/about.html"],
  ["Contacto", "/#contact"],
];

export function SiteHeader({ booking = "https://calendly.com/fmasanes-iu/30min" }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const close = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);
  return (
    <>
      <a className="skip-link" href="#main-content">Saltar al contenido principal</a>
      <header className="site-nav">
        <a className="brand-mark" href="/" aria-label="Inicio de Felipe Masanés Didyk"><span>FMD</span></a>
        <nav className="desktop-nav" aria-label="Navegación principal">
          {primaryNavigation.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
        </nav>
        <div className="nav-actions">
          <a className="nav-cta" href={booking} target="_blank" rel="noreferrer"><Calendar size={16} />Agendar</a>
          <button className="mobile-menu-button" type="button" aria-label={open ? "Cerrar menú" : "Abrir menú"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen((value) => !value)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>
      {open && (
        <nav id="mobile-navigation" className="mobile-nav" aria-label="Navegación móvil">
          {primaryNavigation.map(([label, href]) => <a key={label} href={href} onClick={() => setOpen(false)}>{label}</a>)}
        </nav>
      )}
    </>
  );
}

export function SiteFooter() {
  return <footer className="site-footer"><span>© {new Date().getFullYear()} Felipe Masanés Didyk</span><span>Consultor estratégico y coach</span></footer>;
}

export function PageShell({ children }) {
  return <div className="site-shell"><SiteHeader />{children}<SiteFooter /></div>;
}

export function Breadcrumbs({ items }) {
  return (
    <nav className="breadcrumbs" aria-label="Migas de pan">
      <ol>{items.map((item, index) => <li key={item.href}>{index < items.length - 1 ? <a href={item.href}>{item.label}</a> : <span aria-current="page">{item.label}</span>}</li>)}</ol>
    </nav>
  );
}

export function StatusBadge({ status }) {
  const label = status === "published" ? "Disponible" : status === "content-pending" ? "No publicado" : "Próximamente";
  return <span className={`status-badge status-badge--${status}`}>{label}</span>;
}

export function TopicCard({ topic }) {
  const content = <><div className="card-heading"><h3>{topic.title}</h3><StatusBadge status={topic.status} /></div>{topic.status === "published" && <p>{topic.description || "Accede a la ruta temática, sus módulos y herramientas relacionadas."}</p>}</>;
  return topic.href ? <a className="content-card content-card--link" href={topic.href}>{content}<span className="card-link">Explorar tema <ArrowRight size={16} /></span></a> : <article className="content-card content-card--muted">{content}</article>;
}

export function LessonCard({ module }) {
  return (
    <article className="lesson-card" id={module.order === 1 ? "primer-modulo" : undefined}>
      <div className="lesson-card__number">Módulo {module.order}</div>
      <div><h3>{module.title}</h3><p>{module.description}</p><details><summary>Ver temas</summary><ul>{module.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul></details></div>
      <a className="button button--secondary" href={module.href} aria-label={`Abrir módulo ${module.order}: ${module.title}`}>Ver módulo <ArrowRight size={16} /></a>
    </article>
  );
}

export function ResourceCard({ resource }) {
  const anchorId = `resource-${resource.id}`;
  const isTarget = typeof window !== "undefined" && window.location.hash === `#${anchorId}`;
  const typeLabel = { template: "Plantilla", checklist: "Checklist", worksheet: "Hoja de trabajo", diagnostic: "Autodiagnóstico", choice: "Ejercicio", tool: "Herramienta" }[resource.contentType];
  return <article className="resource-card" id={anchorId}><div className="card-heading"><div><p className="resource-type">{typeLabel}</p><h3>{resource.title}</h3></div><StatusBadge status={resource.status} /></div><p>{resource.description}</p>{resource.href ? <><a className="button button--secondary" href={resource.href} onClick={() => trackEvent("resource_opened", { resource: resource.id })}>Abrir herramienta <ArrowRight size={16} /></a><p className="resource-reminder">{resource.reminder}</p></> : <details defaultOpen={isTarget} onToggle={(event) => event.currentTarget.open && trackEvent("resource_opened", { resource: resource.id })}><summary>Abrir recurso</summary><div className="resource-card__body">{resource.template && <><pre className="template-preview">{resource.template}</pre><CopyToClipboard text={resource.template} label="Copiar plantilla" /></>}{resource.groups?.map((group) => <InteractiveChecklist key={group.title} title={group.title} items={group.items} />)}{resource.fields && <WorksheetResource fields={resource.fields} title={resource.title} />}{resource.options && <ChoiceResource question={resource.question} options={resource.options} />}<p className="resource-reminder">{resource.reminder}</p></div></details>}</article>;
}

export function ToolCard({ tool }) {
  const content = <><div className="card-heading"><h3>{tool.title}</h3><StatusBadge status={tool.status} /></div>{tool.description && <p>{tool.description}</p>}</>;
  return tool.href ? <a className="content-card content-card--link" href={tool.href}>{content}<span className="card-link">Usar herramienta <ArrowRight size={16} /></span></a> : <article className="content-card content-card--muted">{content}</article>;
}

export function LessonMetadata({ module, lesson, total = 5 }) {
  module ||= lesson;
  if (lesson && total === 5) {
    const routeTotals = { "escalamiento-y-adopcion-de-ia": 12, "pensamiento-computacional-y-datos": 8, "inteligencia-artificial-y-deep-learning": 9 };
    total = routeTotals[module.href?.split("/")[2]] || total;
  }
  const formattedDate = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${module.updatedAt}T00:00:00Z`));
  return <dl className="metadata-grid"><div><dt>Nivel</dt><dd>{module.level}</dd></div><div><dt>Lectura estimada</dt><dd>{module.readingTime}</dd></div><div><dt>Módulo</dt><dd>{module.order} de {total}</dd></div><div><dt>Actualizado</dt><dd><time dateTime={module.updatedAt}>{formattedDate}</time></dd></div></dl>;
}

export function LessonNavigation({ previous, next, lessons, currentSlug }) {
  if (lessons && currentSlug) {
    const currentIndex = lessons.findIndex((item) => item.slug === currentSlug);
    previous ||= lessons[currentIndex - 1];
    next ||= lessons[currentIndex + 1];
  }
  return <nav className="lesson-navigation" aria-label="Navegación entre lecciones">{previous ? <a href={previous.href}><ArrowLeft size={17} /><span><small>Anterior</small>{previous.title}</span></a> : <span />}{next ? <a href={next.href}><span><small>Siguiente</small>{next.title}</span><ArrowRight size={17} /></a> : <span />}</nav>;
}

export function RelatedContent({ tools = [], resources = [], basePath = "/aprende/networking" }) {
  const pathParts = typeof window !== "undefined" ? window.location.pathname.split("/").filter(Boolean) : [];
  const resolvedBasePath = basePath === "/aprende/networking" && pathParts[0] === "aprende" && pathParts[1] !== "networking" ? `/aprende/${pathParts[1]}` : basePath;
  const items = [...resources.map((resource) => typeof resource === "string" ? ({ title: resource.replaceAll("-", " "), href: resolvedBasePath }) : ({ title: resource.title, href: resource.href || `${resolvedBasePath}#resource-${resource.id}` })), ...tools];
  return <section className="related-content" aria-labelledby="related-title"><h2 id="related-title">Recursos para aplicar esta lección</h2><div className="compact-links">{items.map((item) => <a key={`${item.href}-${item.title}`} href={item.href}>{item.title}<ArrowRight size={16} /></a>)}</div></section>;
}

export function ContextualServiceCta() {
  return <aside className="contextual-cta"><div><h2>¿Necesitas aplicar esto a una transición profesional concreta?</h2><p>Puedo ayudarte a definir tu estrategia, preparar conversaciones y construir un plan de desarrollo profesional.</p></div><a className="button button--primary" href="/#services" onClick={() => trackEvent("education_service_clicked", { destination: "coaching" })}>Conocer el servicio de coaching <ArrowRight size={17} /></a></aside>;
}

export function CopyToClipboard({ text, onCopy, label = "Copiar mensaje" }) {
  const [status, setStatus] = useState("");
  const copy = async () => {
    if (!text.trim()) return;
    let fallbackArea;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        fallbackArea = document.createElement("textarea");
        fallbackArea.value = text; fallbackArea.style.position = "fixed"; fallbackArea.style.opacity = "0";
        document.body.appendChild(fallbackArea); fallbackArea.select();
        if (!document.execCommand("copy")) throw new Error("copy-failed");
      }
      setStatus("Contenido copiado"); onCopy?.();
    } catch { setStatus("No se pudo copiar. Selecciona el mensaje y cópialo manualmente."); }
    finally { fallbackArea?.remove(); }
  };
  return <><button className="button button--secondary" type="button" onClick={copy} disabled={!text}><Clipboard size={17} />{label}</button><span className="sr-only" role="status" aria-live="polite">{status}</span></>;
}

export function InteractiveChecklist({ title, items }) {
  const [checked, setChecked] = useState(() => items.map(() => false));
  return <section className="interactive-checklist"><h3>{title}</h3>{items.map((item, index) => <label key={item}><input type="checkbox" checked={checked[index]} onChange={() => setChecked((values) => values.map((value, i) => i === index ? !value : value))} /><Check size={16} />{item}</label>)}<button type="button" className="text-button" onClick={() => setChecked(items.map(() => false))}><RotateCcw size={15} />Reiniciar checklist</button></section>;
}

export function WorksheetResource({ fields, title }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((field) => [field, ""])));
  const summary = fields.map((field) => `${field}: ${values[field] || "—"}`).join("\n");
  return <div className="worksheet"><div className="worksheet-grid">{fields.map((field) => <label key={field}>{field}<textarea rows="2" value={values[field]} onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))} /></label>)}</div><div className="form-actions"><CopyToClipboard text={`${title}\n\n${summary}`} label="Copiar resumen" /><button type="button" className="button button--secondary" onClick={() => setValues(Object.fromEntries(fields.map((field) => [field, ""]))) }><RotateCcw size={16} />Limpiar</button></div></div>;
}

export function LessonContent({ content, sections }) {
  content ||= { sections: sections || [], slug: "lesson" };
  return <div className="lesson-content">{content.sections.map((section, index) => <section key={section.title} id={`seccion-${index + 1}`}><h2>{section.title}</h2>{section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.bulletsTitle && <h3>{section.bulletsTitle}</h3>}{section.bullets && <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}{section.ordered && <ol>{section.ordered.map((item) => <li key={item}>{item}</li>)}</ol>}{section.callout && <aside className="lesson-callout"><h3>{section.callout.title}</h3><p>{section.callout.text}</p></aside>}{section.exercise && <aside className="lesson-exercise"><p className="eyebrow">Ejercicio</p><h3>{section.exercise.title}</h3><p>{section.exercise.prompt}</p><p className="exercise-help">{section.exercise.help}</p></aside>}{section.reflectionChoices && <ReflectionChoices data={section.reflectionChoices} />}{section.checklist && <InteractiveChecklist title="Lleva estas acciones a la práctica" items={section.checklist} />}{section.examples?.map((example) => <div className="lesson-example" key={example.title}><h3>{example.title}</h3><p>{example.text}</p></div>)}{section.example && <div className="lesson-example"><h3>{section.example.title}</h3><p>{section.example.text}</p></div>}{section.scenarios && <ScenarioCards items={section.scenarios} />}{section.classification && <ClassificationExercise items={section.classification} />}{section.modelAnswers && <div className="model-answers">{section.modelAnswers.map((answer) => <details key={answer.title} onToggle={(event) => event.currentTarget.open && trackEvent("case_model_revealed", { module: content.slug || "case-lesson" })}><summary>Ver respuesta modelo: {answer.title}</summary><p>{answer.text}</p></details>)}</div>}{section.formulas && <dl className="formula-grid">{section.formulas.map((item) => <div key={item.label}><dt>{item.label}</dt><dd><code>{item.formula}</code></dd></div>)}</dl>}{section.calculationDrills && <div className="calculation-drills">{section.calculationDrills.map((drill) => <details key={drill.title}><summary>{drill.title}: {drill.prompt}</summary><p><strong>Pista:</strong> {drill.hint}</p><p><strong>Respuesta:</strong> {drill.answer}</p><p>{drill.interpretation}</p></details>)}</div>}{section.cases && <div className="lesson-links">{section.cases.map((caseSlug) => <a key={caseSlug} href={`/aprende/consultoria/entrevistas-de-caso#caso-${caseSlug}`}>Abrir caso: {caseSlug.replaceAll("-", " ")}<ArrowRight size={16} /></a>)}</div>}{section.rubric && <Rubric dimensions={section.rubric} />}{section.behavioralQuestions && <BehavioralQuestionBank groups={section.behavioralQuestions} />}{section.caseStudy && <aside className="case-study"><p className="eyebrow">Caso práctico</p><h3>{section.caseStudy.title}</h3>{section.caseStudy.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</aside>}{section.framework && <div className="skill-framework">{section.framework.map((item, itemIndex) => <article key={item.title}><span>{String(itemIndex + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>}{section.comparison && <Comparison data={section.comparison} />}{section.timeline && <ol className="lesson-timeline">{section.timeline.map((item) => <li key={item.time}><strong>{item.time}</strong><span>{item.text}</span></li>)}</ol>}{section.questionGroups && <div className="question-groups">{section.questionGroups.map((group) => <section key={group.title}><h3>{group.title}</h3><ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul></section>)}</div>}{section.applications && <Applications items={section.applications} />}{section.diagnostic && <BarrierTable items={section.diagnostic} />}{section.links && <div className="lesson-links">{section.links.map((link) => <a key={link.href} href={link.href}>{link.label}<ArrowRight size={16} /></a>)}</div>}</section>)}</div>;
}

function Rubric({ dimensions }) {
  return <div className="barrier-table-wrap"><table className="barrier-table"><thead><tr><th>Dimensión</th><th>Niveles cualitativos</th></tr></thead><tbody>{dimensions.map((dimension) => <tr key={dimension}><th scope="row">{dimension}</th><td>Necesita fundamentos · En desarrollo · Consistente · Lista en esta dimensión</td></tr>)}</tbody></table></div>;
}

function BehavioralQuestionBank({ groups }) {
  const categories = Object.keys(groups);
  const [category, setCategory] = useState(categories[0]);
  return <div className="choice-result"><label className="field" htmlFor="behavioral-category"><span>Competencia</span><select id="behavioral-category" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><div role="status" aria-live="polite"><strong>Pregunta para practicar</strong><p>{groups[category][0]}</p></div></div>;
}

function ScenarioCards({ items }) {
  return <div className="scenario-grid">{items.map((item) => <article key={item.id}><p className="resource-type">Escenario ficticio</p><h3>{item.title}</h3><p>{item.situation}</p><h4>Pregunta de reflexión</h4><p>{item.question}</p><h4>Acción posible</h4><p>{item.action}</p><p className="resource-reminder"><strong>Restricción:</strong> {item.constraint}</p></article>)}</div>;
}

function ClassificationExercise({ items }) {
  const [answers, setAnswers] = useState({});
  const options = ["Intención de aprendizaje", "Objetivo de desempeño", "Objetivo mixto", "Intención vaga"];
  const update = (index, value) => {
    const next = { ...answers, [index]: value };
    setAnswers(next);
    if (Object.keys(next).length === items.length) trackEvent("learning_classification_completed");
  };
  return <div className="classification-exercise">{items.map((item, index) => <div key={item.statement}><label htmlFor={`classification-${index}`}><strong>{index + 1}. {item.statement}</strong></label><select id={`classification-${index}`} value={answers[index] || ""} onChange={(event) => update(index, event.target.value)}><option value="">Selecciona una categoría</option>{options.map((option) => <option key={option}>{option}</option>)}</select>{answers[index] && <p role="status"><strong>{answers[index] === item.answer ? "Clasificación posible" : `Una clasificación más precisa: ${item.answer}`}.</strong> {item.explanation}</p>}</div>)}</div>;
}

export function ChoiceResource({ question, options }) {
  const [selected, setSelected] = useState("");
  const result = options.find((option) => option.label === selected);
  return <fieldset className="choice-resource"><legend>{question}</legend>{options.map((option) => <label key={option.label}><input type="radio" name={question} value={option.label} checked={selected === option.label} onChange={(event) => setSelected(event.target.value)} /><span>{option.label}</span></label>)}<div className="choice-result" role="status" aria-live="polite">{result ? <><strong>Primera acción</strong><p>{result.action}</p></> : <p>Selecciona una opción para ver una primera acción.</p>}</div></fieldset>;
}

function ReflectionChoices({ data }) {
  const [selected, setSelected] = useState([]);
  const toggle = (choice) => setSelected((current) => current.includes(choice) ? current.filter((item) => item !== choice) : [...current, choice]);
  return <fieldset className="reflection-choices"><legend>{data.question}</legend>{data.choices.map((choice) => <label key={choice}><input type="checkbox" checked={selected.includes(choice)} onChange={() => toggle(choice)} />{choice}</label>)}</fieldset>;
}

function Comparison({ data }) {
  return <div className="relationship-comparison" aria-label="Comparación entre interacción transaccional y relación profesional"><section><h3>{data.leftTitle}</h3><ul>{data.leftItems.map((item) => <li key={item}>{item}</li>)}</ul></section><section><h3>{data.rightTitle}</h3><ul>{data.rightItems.map((item) => <li key={item}>{item}</li>)}</ul></section></div>;
}

function Applications({ items }) {
  return <div className="application-guides">{items.map((item) => <article key={item.title}><h3>{item.title}</h3><h4>Personas que pueden aportar contexto</h4><ul>{item.contacts.map((contact) => <li key={contact}>{contact}</li>)}</ul><h4>Temas que conviene explorar</h4><ul>{item.questions.map((question) => <li key={question}>{question}</li>)}</ul>{item.links.map((link) => <a key={link.href} href={link.href}>{link.label}<ArrowRight size={15} /></a>)}</article>)}</div>;
}

function BarrierTable({ items }) {
  return <div className="barrier-table-wrap"><table className="barrier-table"><thead><tr><th scope="col">Barrera principal</th><th scope="col">Primera acción</th></tr></thead><tbody>{items.map((item) => <tr key={item.barrier}><th scope="row">{item.barrier}</th><td>{item.action}</td></tr>)}</tbody></table></div>;
}
