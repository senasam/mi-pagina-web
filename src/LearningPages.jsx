import { useEffect, useMemo } from "react";
import { ArrowRight, BookOpen, Clock, Gauge, Layers3, Users } from "lucide-react";
import { trackEvent } from "./analytics";
import { getNetworkingModule, networkingModules, networkingPath, networkingResources, tools, topicGroups } from "./contentData";
import { getLessonContent, getResourceContent } from "./networkingContent";
import { Breadcrumbs, ContextualServiceCta, LessonCard, LessonContent, LessonMetadata, LessonNavigation, PageShell, RelatedContent, ResourceCard, StatusBadge, ToolCard, TopicCard } from "./LearningComponents";
import { breadcrumbSchema, usePageMetadata } from "./seo";

const generatorTool = tools.find((tool) => tool.slug === "generador-mensajes-networking");
const graphNode = ({ "@context": _context, ...node }) => node;

export function LearnPage() {
  const schema = useMemo(() => breadcrumbSchema([{ label: "Inicio", href: "/" }, { label: "Aprende", href: "/aprende" }]), []);
  usePageMetadata({ title: "Aprende", description: "Guías, modelos, recursos y herramientas prácticas para desarrollar habilidades, tomar mejores decisiones y transformar ideas en acciones.", path: "/aprende", schema });
  useEffect(() => trackEvent("learn_viewed"), []);
  return <PageShell><main id="main-content" className="content-page"><Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Aprende", href: "/aprende" }]} /><header className="page-hero"><p className="eyebrow">Biblioteca temática</p><h1>Aprende</h1><p className="page-hero__lead">Guías, modelos, recursos y herramientas prácticas para desarrollar habilidades, tomar mejores decisiones y transformar ideas en acciones.</p><p>Materiales para estudiantes, profesionales, líderes, emprendedores y equipos que quieren pasar de las ideas a la práctica.</p></header><section className="content-section" aria-labelledby="topics-heading"><div className="section-title"><p className="eyebrow">Explora por tema</p><h2 id="topics-heading">Rutas organizadas alrededor de tus preguntas</h2></div><div className="topic-groups">{topicGroups.map((group) => <section className="topic-group" key={group.title}><h3>{group.title}</h3><div className="topic-list">{group.topics.map((topic) => <TopicCard key={topic.title} topic={topic} />)}</div></section>)}</div></section></main></PageShell>;
}

export function NetworkingHubPage() {
  const breadcrumbs = [{ label: "Inicio", href: "/" }, { label: "Aprende", href: "/aprende" }, { label: "Networking", href: "/aprende/networking" }];
  const schema = useMemo(() => ({ "@context": "https://schema.org", "@graph": [graphNode(breadcrumbSchema(breadcrumbs)), { "@type": "LearningResource", name: "Networking", description: networkingPath.description, url: "https://masanes.cl/aprende/networking", learningResourceType: "Guía práctica", educationalLevel: "Introductorio", dateModified: networkingPath.updatedAt }] }), []);
  usePageMetadata({ title: "Cómo hacer networking: guía práctica", description: networkingPath.description, path: "/aprende/networking", schema });
  useEffect(() => {
    trackEvent("networking_hub_opened");
    if (window.location.hash) requestAnimationFrame(() => document.querySelector(window.location.hash)?.scrollIntoView());
  }, []);
  return <PageShell><main id="main-content" className="content-page"><Breadcrumbs items={breadcrumbs} /><header className="page-hero page-hero--networking"><div><p className="eyebrow">Ruta de aprendizaje</p><h1>Networking</h1><p className="page-hero__lead">{networkingPath.description}</p><div className="hero-actions"><a className="button button--primary" href="#primer-modulo" onClick={() => trackEvent("networking_path_started")}>Comenzar la guía <ArrowRight size={17} /></a><a className="button button--secondary" href={generatorTool.href}>Crear un mensaje de contacto</a></div></div><aside className="summary-panel" aria-label="Resumen de la ruta"><StatusBadge status="published" /><dl><div><dt><Users size={18} />Dirigido a</dt><dd>{networkingPath.audience}</dd></div><div><dt><BookOpen size={18} />Tipo</dt><dd>{networkingPath.format}</dd></div><div><dt><Clock size={18} />Tiempo estimado</dt><dd>{networkingPath.readingTime}</dd></div><div><dt><Gauge size={18} />Nivel</dt><dd>{networkingPath.level}</dd></div><div><dt><Layers3 size={18} />Módulos</dt><dd>5 módulos</dd></div><div><dt>Actualizado</dt><dd><time dateTime={networkingPath.updatedAt}>14 de julio de 2026</time></dd></div></dl></aside></header><section className="guide-intro" aria-labelledby="guide-intro-title"><div><p className="eyebrow">Punto de partida</p><h2 id="guide-intro-title">Crear relaciones profesionales con intención</h2><p>Construir una red no consiste en hablar con muchas personas ni en pedir favores. Es un proceso de intercambio de información y desarrollo de relaciones que puede ayudarte a comprender industrias, descubrir caminos posibles, preparar postulaciones y tomar decisiones con mayor contexto.</p><p>Esta guía es especialmente útil si no heredaste una red profesional, estás entrando a un entorno nuevo o no te acomodan los eventos tradicionales. Puedes comenzar desde cero con una pregunta concreta, preparación y una primera conversación respetuosa.</p></div><div><h3>Al completar la guía podrás:</h3><ul>{networkingPath.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul><h3>¿Para quién es?</h3><p>Estudiantes, recién egresados, profesionales en transición, personas que postulan a empresas o universidades, emprendedores y quienes sienten que todavía no tienen una red sólida.</p></div></section><section className="content-section" aria-labelledby="path-heading"><div className="section-title"><p className="eyebrow">Cinco módulos</p><h2 id="path-heading">De la primera pregunta al seguimiento</h2><p>Avanza en orden o comienza por el módulo que responda a tu necesidad actual.</p></div><div className="learning-path">{networkingModules.map((module) => <LessonCard key={module.slug} module={module} />)}</div></section><section id="recursos" className="content-section content-section--soft" aria-labelledby="resources-heading"><div className="section-title"><p className="eyebrow">Recursos prácticos</p><h2 id="resources-heading">Plantillas, checklist y hojas de trabajo</h2><p>Personaliza las plantillas, marca el checklist y copia tus hojas antes de cerrar la página. Los datos de las hojas de trabajo no se guardan ni se envían.</p></div><div className="resource-grid">{networkingResources.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}</div></section><section className="content-section" aria-labelledby="tool-heading"><div className="section-title"><p className="eyebrow">Herramienta</p><h2 id="tool-heading">Convierte tu contexto en un primer borrador</h2></div><div className="card-grid"><ToolCard tool={generatorTool} /></div></section><ContextualServiceCta /></main></PageShell>;
}

export function NetworkingLessonPage({ slug }) {
  const module = getNetworkingModule(slug);
  return module ? <NetworkingLessonContent module={module} /> : <NotFoundPage />;
}

function NetworkingLessonContent({ module }) {
  const index = networkingModules.indexOf(module);
  const content = getLessonContent(module.slug);
  const resources = module.relatedResources.map(getResourceContent).filter(Boolean);
  const breadcrumbs = [{ label: "Inicio", href: "/" }, { label: "Aprende", href: "/aprende" }, { label: "Networking", href: "/aprende/networking" }, { label: module.title, href: module.href }];
  const schema = useMemo(() => ({ "@context": "https://schema.org", "@graph": [graphNode(breadcrumbSchema(breadcrumbs)), { "@type": "LearningResource", name: module.title, description: content.description, url: `https://masanes.cl${module.href}`, learningResourceType: "Lección", educationalLevel: module.level, dateModified: module.updatedAt, isPartOf: { "@type": "LearningResource", name: "Networking", url: "https://masanes.cl/aprende/networking" } }] }), [module.slug]);
  usePageMetadata({ title: content.seoTitle, description: content.description, path: module.href, schema });
  useEffect(() => trackEvent("networking_module_opened", { module: module.slug }), [module.slug]);
  return <PageShell><main id="main-content" className="content-page lesson-page"><Breadcrumbs items={breadcrumbs} /><article><header className="lesson-header"><div><p className="eyebrow">Módulo {module.order} de 5</p><h1>{module.title}</h1><p>{content.description}</p></div><StatusBadge status={module.status} /></header><LessonMetadata module={module} /><aside className="lesson-outcomes"><h2>Al terminar podrás</h2><ul>{content.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul></aside><LessonContent content={content} /><RelatedContent tools={[generatorTool]} resources={resources} />{module.slug === "entrevistas-informativas" && <ContextualServiceCta />}<div className="lesson-hub-link"><a className="button button--secondary" href="/aprende/networking">Volver a la guía de Networking</a></div><LessonNavigation previous={networkingModules[index - 1]} next={networkingModules[index + 1]} /></article></main></PageShell>;
}

export function ToolsPage() {
  const availableTools = tools.filter((tool) => tool.status === "published");
  const plannedTools = tools.filter((tool) => tool.status !== "published");
  const schema = useMemo(() => breadcrumbSchema([{ label: "Inicio", href: "/" }, { label: "Herramientas", href: "/herramientas" }]), []);
  usePageMetadata({ title: "Herramientas", description: "Recursos interactivos para aplicar ideas, preparar conversaciones y tomar mejores decisiones.", path: "/herramientas", schema });
  useEffect(() => trackEvent("tools_viewed"), []);
  return <PageShell><main id="main-content" className="content-page"><Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Herramientas", href: "/herramientas" }]} /><header className="page-hero"><p className="eyebrow">Aplicación práctica</p><h1>Herramientas</h1><p className="page-hero__lead">Recursos interactivos para aplicar ideas, preparar conversaciones y tomar mejores decisiones.</p></header><section className="content-section" aria-labelledby="available-tools"><div className="section-title"><p className="eyebrow">Disponibles</p><h2 id="available-tools">Empieza con una herramienta concreta</h2></div><div className="card-grid">{availableTools.map((tool) => <ToolCard key={tool.slug} tool={tool} />)}</div></section><section className="content-section content-section--soft" aria-labelledby="future-tools"><div className="section-title"><p className="eyebrow">En preparación</p><h2 id="future-tools">Próximas áreas</h2><p>Estas categorías orientan el desarrollo futuro; todavía no son herramientas activas.</p></div><div className="planned-list">{plannedTools.map((tool) => <span key={tool.title}>{tool.title}</span>)}</div></section></main></PageShell>;
}

export function NotFoundPage() {
  usePageMetadata({ title: "Página no encontrada", description: "La página solicitada no está disponible.", path: window.location.pathname, noindex: true });
  return <PageShell><main id="main-content" className="content-page"><section className="not-found"><p className="eyebrow">Error 404</p><h1>Página no encontrada</h1><p>La dirección puede haber cambiado o no estar disponible.</p><a className="button button--primary" href="/">Volver al inicio</a></section></main></PageShell>;
}
