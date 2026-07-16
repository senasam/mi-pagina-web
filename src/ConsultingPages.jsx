import { useEffect, useMemo } from "react";
import { ArrowRight, BookOpen, Clock, Gauge, Layers3, Target } from "lucide-react";
import { trackEvent } from "./analytics";
import { consultingLessonContent, consultingModules, consultingPath, consultingResources, getConsultingModule, getConsultingResource } from "./consultingContent";
import { tools } from "./contentData";
import { Breadcrumbs, LessonCard, LessonContent, LessonMetadata, LessonNavigation, PageShell, RelatedContent, ResourceCard, StatusBadge, ToolCard } from "./LearningComponents";
import { NotFoundPage } from "./LearningPages";
import { breadcrumbSchema, usePageMetadata } from "./seo";

const impactTool = tools.find((tool) => tool.slug === "constructor-bullets-consultoria");
const graphNode = ({ "@context": _context, ...node }) => node;

export function ConsultingHubPage() {
  const breadcrumbs = [{ label: "Inicio", href: "/" }, { label: "Aprende", href: "/aprende" }, { label: "Consultoría", href: "/aprende/consultoria" }];
  const schema = useMemo(() => ({ "@context": "https://schema.org", "@graph": [graphNode(breadcrumbSchema(breadcrumbs)), { "@type": "LearningResource", name: "Consultoría", description: consultingPath.description, url: "https://masanes.cl/aprende/consultoria", learningResourceType: "Ruta de aprendizaje", educationalLevel: consultingPath.level, dateModified: consultingPath.updatedAt }] }), []);
  usePageMetadata({ title: "Consultoría: carrera, CV y entrevistas de caso", description: consultingPath.description, path: "/aprende/consultoria", schema });
  useEffect(() => {
    trackEvent("consulting_hub_opened");
    if (window.location.hash) requestAnimationFrame(() => document.querySelector(window.location.hash)?.scrollIntoView());
  }, []);

  return <PageShell><main id="main-content" className="content-page"><Breadcrumbs items={breadcrumbs} /><header className="page-hero page-hero--networking"><div><p className="eyebrow">Ruta de aprendizaje</p><h1>Consultoría</h1><p className="page-hero__lead">{consultingPath.description}</p><div className="hero-actions"><a className="button button--primary" href="#primer-modulo" onClick={() => trackEvent("consulting_path_started")}>Comenzar la ruta <ArrowRight size={17} /></a><a className="button button--secondary" href={impactTool.href}>Construir un bullet de CV</a></div></div><aside className="summary-panel" aria-label="Resumen de la ruta"><StatusBadge status="published" /><dl><div><dt><Target size={18} />Dirigido a</dt><dd>{consultingPath.audience}</dd></div><div><dt><BookOpen size={18} />Tipo</dt><dd>{consultingPath.format}</dd></div><div><dt><Clock size={18} />Tiempo estimado</dt><dd>{consultingPath.readingTime}</dd></div><div><dt><Gauge size={18} />Nivel</dt><dd>{consultingPath.level}</dd></div><div><dt><Layers3 size={18} />Módulos</dt><dd>{consultingModules.length} módulos</dd></div><div><dt>Actualizado</dt><dd><time dateTime={consultingPath.updatedAt}>14 de julio de 2026</time></dd></div></dl></aside></header><section className="guide-intro" aria-labelledby="consulting-intro"><div><p className="eyebrow">De explorar a preparar</p><h2 id="consulting-intro">Una ruta para tomar decisiones y practicar</h2><p>Empieza por comprender el trabajo y comparar firmas. Después construye evidencia para tu CV, practica casos y entrevistas conductuales, y ordena el proceso según tus fechas reales.</p></div><ul>{consultingPath.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul></section><section className="content-section" aria-labelledby="consulting-modules"><div className="section-title"><p className="eyebrow">Ocho módulos</p><h2 id="consulting-modules">Avanza en orden o entra por tu necesidad actual</h2></div><div className="learning-path">{consultingModules.map((module) => <LessonCard key={module.slug} module={module} />)}</div></section><section id="recursos" className="content-section content-section--soft" aria-labelledby="consulting-resources"><div className="section-title"><p className="eyebrow">Recursos prácticos</p><h2 id="consulting-resources">Diagnósticos, matrices, plantillas y trackers</h2><p>Los campos funcionan localmente y no se guardan. Copia lo que quieras conservar antes de cerrar la página.</p></div><div className="resource-grid">{consultingResources.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}</div></section><section className="content-section" aria-labelledby="consulting-tool"><div className="section-title"><p className="eyebrow">Herramienta</p><h2 id="consulting-tool">Convierte evidencia real en bullets claros</h2></div><div className="card-grid"><ToolCard tool={impactTool} /></div></section><aside className="contextual-cta"><div><h2>¿Necesitas preparar una candidatura concreta?</h2><p>Puedo ayudarte a priorizar firmas, revisar tu evidencia y convertir la preparación en un plan manejable.</p></div><a className="button button--primary" href="/#services" onClick={() => trackEvent("education_service_clicked", { destination: "coaching-consulting" })}>Conocer coaching profesional <ArrowRight size={17} /></a></aside></main></PageShell>;
}

export function ConsultingLessonPage({ slug }) {
  const module = getConsultingModule(slug);
  return module ? <ConsultingLessonContent module={module} /> : <NotFoundPage />;
}

function ConsultingLessonContent({ module }) {
  const index = consultingModules.indexOf(module);
  const content = consultingLessonContent[module.slug];
  const resources = module.relatedResources.map(getConsultingResource).filter(Boolean);
  const breadcrumbs = [{ label: "Inicio", href: "/" }, { label: "Aprende", href: "/aprende" }, { label: "Consultoría", href: "/aprende/consultoria" }, { label: module.title, href: module.href }];
  const schema = useMemo(() => ({ "@context": "https://schema.org", "@graph": [graphNode(breadcrumbSchema(breadcrumbs)), { "@type": "LearningResource", name: module.title, description: content.description, url: `https://masanes.cl${module.href}`, learningResourceType: "Lección", educationalLevel: module.level, dateModified: module.updatedAt, isPartOf: { "@type": "LearningResource", name: "Consultoría", url: "https://masanes.cl/aprende/consultoria" } }] }), [module.slug]);
  usePageMetadata({ title: content.seoTitle, description: content.description, path: module.href, schema });
  useEffect(() => trackEvent("consulting_module_opened", { module: module.slug }), [module.slug]);
  const relatedTools = module.slug === "cv-consultoria" ? [impactTool] : [];
  return <PageShell><main id="main-content" className="content-page lesson-page"><Breadcrumbs items={breadcrumbs} /><article><header className="lesson-header"><div><p className="eyebrow">Módulo {module.order} de {consultingModules.length}</p><h1>{module.title}</h1><p>{content.description}</p></div><StatusBadge status={module.status} /></header><LessonMetadata module={module} total={consultingModules.length} /><aside className="lesson-outcomes"><h2>Al terminar podrás</h2><ul>{content.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul></aside><LessonContent content={content} /><RelatedContent tools={relatedTools} resources={resources} basePath="/aprende/consultoria" />{module.slug === "plan-de-preparacion" && <aside className="contextual-cta"><div><h2>¿Quieres revisar tu plan con apoyo?</h2><p>Una sesión puede ayudarte a priorizar brechas y adaptar el calendario a tus restricciones.</p></div><a className="button button--primary" href="/#services">Conocer coaching profesional</a></aside>}<div className="lesson-hub-link"><a className="button button--secondary" href="/aprende/consultoria">Volver a la ruta de Consultoría</a></div><LessonNavigation previous={consultingModules[index - 1]} next={consultingModules[index + 1]} /></article></main></PageShell>;
}
