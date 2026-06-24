import { useState, lazy, Suspense } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  Compass,
  ExternalLink,
  GraduationCap,
  Handshake,
  Layers3,
  Lightbulb,
  Linkedin,
  Mail,
  MapPin,
  Menu,
  NotebookPen,
  Phone,
  Rocket,
  Target,
  UserRoundCheck,
  Users,
  WalletCards,
  X,
} from "lucide-react";

const profile = {
  name: "Felipe Masanés Didyk",
  role: "Consultor estratégico y coach",
  photo: "felipe-masanes-didyk-professional-photo.png",
  location: "Bloomington, Indiana",
  email: "fmasanes@iu.edu",
  personalEmail: "senasam@gmail.com",
  phoneUS: "+1 (930) 904-3983",
  phoneCL: "+56 9 7765 9302",
  linkedin: "https://www.linkedin.com/in/felipemasanesdidyk/",
  booking: "https://calendly.com/fmasanes-iu/30min",
};

const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

const BlogListPage = lazy(() => import("./BlogListPage"));
const BlogPostPage = lazy(() => import("./BlogPostPage"));
import EndorsementCarousel from "./EndorsementCarousel";

const navigation = [
  ["Servicios", "/#services"],
  ["Enfoque", "/#approach"],
  ["Evidencia", "/#proof"],
  ["Blog", "/blog"],
  ["Credenciales", "/#credentials"],
  ["Finanzas", "/#finance"],
  ["Contacto", "/#contact"],
];

const services = [
  {
    title: "Estrategia y Negocios",
    icon: BriefcaseBusiness,
    accent: "ink",
    description:
      "Para organizaciones que necesitan claridad estratégica, prioridades definidas y un camino práctico para ejecutar.",
    includes: [
      "Diagnóstico organizacional, análisis estratégico y estructuración de problemas complejos",
      "Roadmaps de implementación, gestión del cambio y alineamiento de stakeholders",
      "Modelo de negocio, propuesta de valor, estrategia de mercado y pricing",
      "Comunicación ejecutiva, storytelling estratégico y pitch de negocio",
    ],
  },
  {
    title: "Growth e Innovación",
    icon: Rocket,
    accent: "burgundy",
    description:
      "Para equipos que buscan lanzar nuevos negocios, adaptarse al cambio y mejorar la adopción mediante innovación disciplinada.",
    includes: [
      "Estrategia de innovación, gestión tecnológica y adaptación frente a disrupción",
      "Diseño y validación de productos, servicios y nuevos modelos de negocio",
      "Experimentación, funnels, CRM y analítica de crecimiento",
      "Growth hacking, Lean Startup, MVP, OKRs y priorización ICE",
    ],
  },
  {
    title: "Mejora Continua y Supply Chain",
    icon: Layers3,
    accent: "blue",
    description:
      "Para organizaciones que buscan más eficiencia, menores costos y mejores decisiones operativas.",
    includes: [
      "Diagnóstico operacional, rediseño de procesos y detección de cuellos de botella",
      "Optimización de inventarios, demanda, capacidad, logística y niveles de servicio",
      "Supply chain, sourcing estratégico, distribución y mitigación de riesgos",
      "Modelamiento, forecasting, dashboards, Lean, Six Sigma y mejora continua",
    ],
  },
  {
    title: "Analítica de Clientes y Comercial",
    icon: UserRoundCheck,
    accent: "sage",
    description:
      "Para organizaciones que quieren entender mejor a sus clientes y acelerar el crecimiento con estrategia, datos y experimentación.",
    includes: [
      "Diagnóstico comercial, análisis de mercado, clientes y oportunidades de crecimiento",
      "Segmentación, targeting, posicionamiento, propuesta de valor y go-to-market",
      "Pricing, investigación de mercado y análisis de comportamiento del consumidor",
      "Customer journey, adquisición, retención, funnels y dashboards comerciales",
    ],
  },
  {
    title: "Coaching Profesional",
    icon: Compass,
    accent: "gold",
    description:
      "Para personas que buscan nuevas oportunidades, transiciones de carrera o mayor desarrollo profesional y liderazgo.",
    includes: [
      "Estrategia profesional, objetivos y posicionamiento de carrera",
      "Mejora de CV, LinkedIn, pitch personal y narrativa profesional",
      "Búsqueda laboral, networking, entrevistas y negociación de oferta",
      "Liderazgo, comunicación ejecutiva, influencia y marca personal",
    ],
  },
  {
    title: "Finanzas Personales y Pymes",
    icon: WalletCards,
    accent: "teal",
    description:
      "Para personas, familias y pequeños negocios que quieren ordenar sus finanzas y tomar mejores decisiones económicas.",
    includes: [
      "Diagnóstico financiero, flujo de caja, deudas, activos, pasivos e ingresos",
      "Presupuesto, ahorro, inversión, reducción de deuda y planificación de objetivos",
      "Educación financiera sobre créditos, banca, fondos, acciones, seguros e inversión inmobiliaria",
      "Organización financiera de pymes: costos, precios, márgenes, impuestos y herramientas de gestión",
    ],
  },
  {
    title: "Independientes y Emprendedores",
    icon: BriefcaseBusiness,
    accent: "ink",
    description:
      "Para independientes y emprendedores que quieren convertir habilidades o ideas en un negocio claro, ordenado y rentable.",
    includes: [
      "Diagnóstico de habilidades, propuesta de valor y oportunidades de negocio",
      "Modelo de negocio, servicios, precios, paquetes comerciales y monetización",
      "Orden financiero inicial, costos, punto de equilibrio, presupuesto y metas comerciales",
      "Canales, marketing digital, presencia online, herramientas web y acompañamiento ejecutivo",
    ],
  },
];

const proofPoints = [
  {
    value: "MBA",
    label: "Indiana University, Bloomington",
    detail:
      "MBA becado por mérito, con foco en estrategia, liderazgo, analytics y supply chain. Integrante de Consulting Academy y Leadership Development Program.",
  },
  {
    value: "Líder",
    label: "KSOB, UDP, AGSCH",
    detail:
      "Coach certificado por Kelley School of Business. Ex instructor UDP en marketing, estrategia y modelos de negocio. Experiencia en liderazgo formativo y scout.",
  },
  {
    value: "Grados",
    label: "Universidad Diego Portales",
    detail:
      "Magíster en Dirección de Marketing, beca por mérito. Ingeniero Comercial, mención Administración. Foco en estrategia comercial, consumidor, tendencias y decisiones de negocio.",
  },
  {
    value: "Growth",
    label: "GOOG, MSFT, HUBS, FIU, IEBS.",
    detail:
      "Certificaciones en growth, marketing digital, inbound, transformación digital, sostenibilidad, desarrollo web, blockchain y prospección comercial, entre otros.",
  },
];

const highlights = [
  {
    eyebrow: "Transformación digital y growth strategy",
    title: "Finvivir / Grupo FI",
    icon: BarChart3,
    body: "Lideró el diseño y ejecución de un Growth Playbook que integró Lean Startup, OKRs, priorización ICE/RICE, A/B testing, segmentación de líderes y cohort analysis en QuickSight.",
    facts: [
      "Roadmap para escalar la adopción de Ilana App",
      "Coordinación de stakeholders entre Sales, Product, Marketing, Analytics y Technology",
      "Iniciativas validadas con proyección de +25% en adopción digital, -15% en CAC y +10% en retención",
    ],
  },
  {
    eyebrow: "Growth leadership en corporate venture",
    title: "Klicker en Kaufmann Chile",
    icon: Rocket,
    body: "Cofundó y lideró la agenda estratégica de growth para un venture fintech impulsado por AI, definiendo el business model, la value proposition y la market entry strategy.",
    facts: [
      "Levantamiento de US$350.000 mediante forecasting y business case",
      "Lideró el despliegue del MVP y más de 60 growth experiments",
      "Redujo CAC 100x y alcanzó break-even según el registro del perfil",
    ],
  },
  {
    eyebrow: "MBA consulting",
    title: "Análisis estratégico de mercado para Microsoft",
    icon: Target,
    body: "Seleccionado para un proyecto de 12 semanas de Kelley Consulting Academy patrocinado por Microsoft en un área emergente de computación.",
    facts: [
      "Market research y análisis de competidores",
      "Entrevistas con stakeholders internos",
      "Recomendaciones executive-level para adopción y posicionamiento de producto",
    ],
  },
  {
    eyebrow: "Product, brand & customer strategy",
    title: "Universidad Diego Portales",
    icon: GraduationCap,
    body: "Dictó Marketing y Product, Brand & Customer Management, guiando a estudiantes con frameworks aplicados y proyectos de consulting para clientes reales.",
    facts: [
      "Plan de estudios de Marketing con STP, marketing mix, digital marketing y growth marketing",
      "Proyectos de magíster para marcas como Hellmann's Vegan, Rheem, Ama Time y Tarragona",
      "Énfasis en analytics, indicadores y structured problem solving",
    ],
  },
];

const credentials = [
  {
    title: "MBA Candidate, Class of 2026",
    organization: "Indiana University, Kelley School of Business",
    detail:
      "Foco en Supply Chain Management y Business Analytics, minor en Leadership, Consulting Academy, Leadership Academy y cursos en predictive analytics, digital transformation, pricing, CRM, supply chain optimization y liderazgo.",
  },
  {
    title: "Magíster en Dirección de Marketing",
    organization: "Universidad Diego Portales",
    detail:
      "Tesis aprobada con nota máxima; formación en strategic marketing, market research, product & brand strategy, pricing, digital marketing, data mining y customer centricity.",
  },
  {
    title: "Ingeniero Comercial, Administración de Empresas y Economía",
    organization: "Universidad Diego Portales",
    detail:
      "Tesis aprobada con nota máxima, beca por alto puntaje PSU y ganador del Walmart Innova Challenge 2017.",
  },
];

const certifications = [
  "Kelley MBA Leadership Academy Coaching Certification",
  "MBA Essentials Certificate, LSE",
  "Innovation & Digital Transformation, FIU Executive Education",
  "Integrating Sustainability in Brand Management, Northwestern University",
  "Growth Frameworks, Growth Rockstar",
  "Certificaciones en Digital Marketing de HubSpot Academy y Google",
];

const consultingPrinciples = [
  "Traducir complejidad abstracta en un operating model simple.",
  "Separar evidencia, supuestos, riesgos y decisiones.",
  "Construir suficiente estructura para actuar sin asumir que el futuro es seguro.",
  "Priorizar acciones por business value, learning value y realidad de ejecución.",
];

const coachingSteps = [
  {
    title: "Clarificar la pregunta real",
    body: "Definimos la decisión, restricción, ambición o patrón que realmente está moviendo la conversación.",
  },
  {
    title: "Construir el sistema personal",
    body: "Convertimos el tema en una cadencia práctica: decisiones, rutinas, conversaciones, estructura financiera o acciones de carrera.",
  },
  {
    title: "Practicar la ejecución",
    body: "El trabajo pasa a la vida real: networking, momentos de liderazgo, decisiones difíciles, disciplina presupuestaria o diseño de hábitos.",
  },
  {
    title: "Revisar y adaptar",
    body: "Evaluamos qué pasó, qué cambió y cuál debería ser el siguiente ajuste de mayor leverage.",
  },
];

function SectionHeader({ eyebrow, title, lead }) {
  return (
    <div className="section-header">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {lead ? <p className="section-lead">{lead}</p> : null}
    </div>
  );
}

function ServiceCard({ service, index }) {
  const Icon = service.icon;
  return (
    <article className={`service-card service-card--${service.accent}`}>
      <div className="service-card__top">
        <span className="service-card__number">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="service-card__icon" aria-hidden="true">
          <Icon size={22} strokeWidth={1.8} />
        </span>
      </div>
      <h3>{service.title}</h3>
      <p>{service.description}</p>
      <ul>
        {service.includes.map((item) => (
          <li key={item}>
            <CheckCircle2 size={16} strokeWidth={1.8} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function HighlightCard({ item }) {
  const Icon = item.icon;
  return (
    <article className="highlight-card">
      <div className="highlight-card__heading">
        <Icon size={24} strokeWidth={1.8} />
        <div>
          <p>{item.eyebrow}</p>
          <h3>{item.title}</h3>
        </div>
      </div>
      <p className="highlight-card__body">{item.body}</p>
      <ul>
        {item.facts.map((fact) => (
          <li key={fact}>{fact}</li>
        ))}
      </ul>
    </article>
  );
}

function CredentialItem({ credential }) {
  return (
    <article className="credential-item">
      <div>
        <h3>{credential.title}</h3>
        <p className="credential-item__org">{credential.organization}</p>
      </div>
      <p>{credential.detail}</p>
    </article>
  );
}

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentPath = window.location.pathname;
  const normalizedPath = currentPath.replace(/\/$/, "") || "/";
  const isBlogList = normalizedPath === "/blog";
  const blogSlug = normalizedPath.startsWith("/blog/")
    ? normalizedPath.replace("/blog/", "")
    : null;

  const closeMobileNav = () => setMobileOpen(false);

  if (isBlogList || blogSlug) {
    return (
      <div className="site-shell">
        <Suspense fallback={<div className="loading">Cargando blog...</div>}>
          {isBlogList ? (
            <BlogListPage />
          ) : (
            <BlogPostPage slug={blogSlug} />
          )}
        </Suspense>
      </div>
    );
  }

  return (
    <div className="site-shell">
      <header className="site-nav">
        <a
          className="brand-mark"
          href="#top"
          aria-label="Inicio de Felipe Masanés Didyk"
        >
          <span>FMD</span>
        </a>

        <nav className="desktop-nav" aria-label="Navegación principal">
          {navigation.map(([label, href]) => (
            <a key={label} href={href}>
              {label}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <a
            className="nav-cta"
            href={profile.booking}
            target="_blank"
            rel="noreferrer"
          >
            <Calendar size={16} strokeWidth={1.8} />
            Agendar
          </a>
          <button
            className="mobile-menu-button"
            type="button"
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {mobileOpen ? (
        <nav className="mobile-nav" aria-label="Navegación móvil">
          {navigation.map(([label, href]) => (
            <a key={label} href={href} onClick={closeMobileNav}>
              {label}
            </a>
          ))}
        </nav>
      ) : null}

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">Consultor & Coach</p>
            <h1>{profile.name}</h1>
            <p className="hero-lead">
              Ayudo a personas a transformar la ambigüedad en acción estratégica clara.
            </p>
            <p className="hero-body">
              Como consultor estratégico, convierto problemas complejos de negocios, operaciones, marketing, crecimiento, producto e innovación en planes ejecutables o resultados concretos.
            </p>
            <p className="hero-body">
              Como coach, ayudo a personas a pensar, decidir, practicar y avanzar hacia sus objetivos con mayor claridad y construir sistemas personales prácticos.
            </p>
            <div className="hero-actions">
              <a
                className="button button--primary"
                href={profile.booking}
                target="_blank"
                rel="noreferrer"
              >
                Agendar consulta de 30 minutos
                <ArrowRight size={18} strokeWidth={1.8} />
              </a>
              <a
                className="button button--secondary"
                href={`mailto:${profile.email}`}
              >
                Escribir a Felipe
              </a>
            </div>
          </div>

          <div
            className="hero-visual"
            style={{ "--hero-image": `url(${asset(profile.photo)})` }}
            aria-label="Retrato profesional de Felipe Masanés Didyk"
          >
            <img
              src={asset(profile.photo)}
              alt="Retrato profesional de Felipe Masanés Didyk"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
            />
            <div className="hero-visual__panel">
              <span>Consultoría + Coaching.</span>
              <p>
                Orden. Estructura. Claridad. Acción. Resultado.
              </p>
            </div>
          </div>
        </section>

        <section className="proof-strip" aria-label="Credenciales profesionales">
          {proofPoints.map((item) => (
            <article key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <p>{item.detail}</p>
            </article>
          ))}
        </section>

        <section id="services" className="section section--paper">
          <SectionHeader
            eyebrow="Servicios"
            title="Práctica organizada en torno a solucionar problemas en dos etapas: estrategia y ejecución."
            lead="La estrategia vive en distintos niveles: dónde competir y cómo ganar, dónde estoy versus dónde quiero llegar, y qué acciones concretas debo tomar para avanzar. Crear, lanzar o hacer crecer un producto, servicio, negocio, carrera o proyecto financiero exige una misma disciplina: entender bien el problema, priorizar con criterio y ejecutar con foco."
          />

          <div className="services-grid">
            {services.map((service, index) => (
              <ServiceCard
                key={service.title}
                service={service}
                index={index}
              />
            ))}
          </div>
        </section>

        <section id="approach" className="section approach-section">
          <div className="approach-copy">
            <p className="eyebrow">Cómo se estructura el trabajo</p>
            <h2>
              Consulting es donde hago el trabajo. Coaching es donde te ayudo a
              hacer el trabajo.
            </h2>
            <p>
              La distinción importa. Algunos problemas requieren un operador
              externo que pueda diagnosticar, modelar, sintetizar y construir el
              plan. Otros requieren un partner estructurado que ayude al cliente
              a pensar mejor, actuar con disciplina y hacerse cargo del próximo
              paso.
            </p>
          </div>

          <div className="approach-panels">
            <article>
              <Handshake size={26} strokeWidth={1.8} />
              <h3>Consulting</h3>
              <p>
                Entro al problema, estructuro el trabajo, analizo el mercado o
                sistema, creo frameworks utilizables y traduzco la respuesta en
                acción.
              </p>
              <ul>
                {consultingPrinciples.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article>
              <NotebookPen size={26} strokeWidth={1.8} />
              <h3>Coaching</h3>
              <p>
                Ayudo al cliente a clarificar la decisión, testear supuestos,
                crear accountability y desarrollar criterio para avanzar sin
                dependencia.
              </p>
              <ul>
                <li>
                  Career transitions, job search, networking y entrevistas.
                </li>
                <li>
                  Momentos de liderazgo, estrategia personal y decisiones de
                  vida.
                </li>
                <li>
                  Claridad financiera familiar mediante presupuestos, estructura
                  y planificación.
                </li>
                <li>
                  Sin promesas especulativas, investment management, asesoría
                  tributaria o asesoría legal.
                </li>
              </ul>
            </article>
          </div>
        </section>

        <section id="proof" className="section section--ink">
          <SectionHeader
            eyebrow="Highlights seleccionados"
            title="Evidencia en strategy, growth, product, docencia y consulting."
            lead="Estos ejemplos provienen del perfil profesional y están resumidos de forma conservadora para preservar los hechos de base."
          />

          <div className="highlights-grid">
            {highlights.map((item) => (
              <HighlightCard key={item.title} item={item} />
            ))}
          </div>
        </section>

        <section id="credentials" className="section credentials-section">
          <div className="credentials-layout">
            <div>
              <SectionHeader
                eyebrow="Credenciales"
                title="Formación en business, ejecución práctica y experiencia docente."
                lead="La trayectoria de Felipe combina consulting, growth leadership, digital marketing, fintech, product & customer strategy, analytics, docencia universitaria y formación MBA."
              />

              <div className="certification-block">
                <h3>Certificaciones y reconocimientos seleccionados</h3>
                <div className="certification-list">
                  {certifications.map((item) => (
                    <span key={item}>
                      <BadgeCheck size={16} strokeWidth={1.8} />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="credentials-list">
              {credentials.map((credential) => (
                <CredentialItem
                  key={credential.title}
                  credential={credential}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="section coaching-section">
          <div className="coaching-grid">
            <div className="coaching-copy">
              <p className="eyebrow">Enfoque de coaching</p>
              <h2>
                Estructura suficiente para avanzar. Humano suficiente para la
                vida real.
              </h2>
              <p>
                La práctica de coaching se basa en mentoría a estudiantes y
                profesionales, formación de MBA leadership coaching, docencia
                universitaria y años ayudando a personas a clarificar decisiones
                de carrera, liderazgo y vida personal. El trabajo es directo,
                práctico y construido alrededor de la acción.
              </p>
            </div>
            <div className="coaching-steps">
              {coachingSteps.map((step, index) => (
                <article key={step.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="finance" className="finance-section">
          <div className="finance-copy">
            <p className="eyebrow">Coaching financiero personal y familiar</p>
            <h2>Estructura antes que especulación.</h2>
            <p>
              Este trabajo es para personas que quieren entender adónde va su
              dinero, tomar tradeoffs conscientes, planificar con su familia y
              reducir el ruido financiero. Es educación, estructura y apoyo para
              decidir, no construcción especulativa de patrimonio ni asesoría de
              inversiones licenciada.
            </p>
          </div>

          <div className="finance-principles">
            <article>
              <CircleDollarSign size={24} strokeWidth={1.8} />
              <h3>Claridad de cash flow</h3>
              <p>
                Construir una vista simple de ingresos, gastos, obligaciones y
                decisiones recurrentes.
              </p>
            </article>
            <article>
              <Lightbulb size={24} strokeWidth={1.8} />
              <h3>Priorización</h3>
              <p>
                Separar la presión urgente de las decisiones financieras
                importantes y las próximas acciones.
              </p>
            </article>
            <article>
              <Users size={24} strokeWidth={1.8} />
              <h3>Alineamiento familiar</h3>
              <p>
                Crear un lenguaje compartido para objetivos, límites, tradeoffs
                y accountability.
              </p>
            </article>
          </div>
        </section>

        <section className="section endorsements-section">
          <SectionHeader
            eyebrow="Recomendaciones"
            title="Lo que colaboradores y clientes han destacado."
            lead="Extractos seleccionados de recomendaciones del perfil, incluidos sin agregar logos de clientes ni claims no respaldados."
          />

          <EndorsementCarousel />
        </section>

        <section id="contact" className="contact-section">
          <div className="contact-panel">
            <div>
              <p className="eyebrow">Iniciemos la conversación</p>
              <h2>Trae el problema. Sal con un primer frame más claro.</h2>
              <p>
                Usa la primera llamada para clarificar la situación, la decisión
                en juego y si el próximo paso correcto es consulting, coaching o
                un diagnóstico más acotado.
              </p>
            </div>

            <div className="contact-actions">
              <a
                className="button button--primary"
                href={profile.booking}
                target="_blank"
                rel="noreferrer"
              >
                <Calendar size={18} strokeWidth={1.8} />
                Agendar llamada de 30 minutos
              </a>
              <a
                className="button button--secondary"
                href={`mailto:${profile.email}`}
              >
                <Mail size={18} strokeWidth={1.8} />
                {profile.email}
              </a>
              <a
                className="button button--secondary"
                href={profile.linkedin}
                target="_blank"
                rel="noreferrer"
              >
                <Linkedin size={18} strokeWidth={1.8} />
                LinkedIn
                <ExternalLink size={15} strokeWidth={1.8} />
              </a>
            </div>
          </div>

          <div className="contact-details" aria-label="Datos de contacto">
            <span>
              <MapPin size={16} strokeWidth={1.8} />
              {profile.location}
            </span>
            <span>
              <Phone size={16} strokeWidth={1.8} />
              {profile.phoneUS}
            </span>
            <span>
              <Phone size={16} strokeWidth={1.8} />
              {profile.phoneCL}
            </span>
            <span>
              <Mail size={16} strokeWidth={1.8} />
              {profile.personalEmail}
            </span>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span>{profile.role}</span>
      </footer>
    </div>
  );
}
