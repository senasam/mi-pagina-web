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
import { Analytics } from "@vercel/analytics/react";

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

import EndorsementCarousel from "./EndorsementCarousel";
import MessageGeneratorPage from "./MessageGeneratorPage";
import ImpactBulletBuilderPage from "./ImpactBulletBuilderPage";
import { ConsultingHubPage, ConsultingLessonPage } from "./ConsultingPages";
import { CaseInterviewHubPage, CaseInterviewLessonPage } from "./CaseInterviewPages";
import CaseToolsPage from "./CaseToolsPage";
const AdaptabilityHubPage = lazy(() => import("./AdaptabilityPages").then((module) => ({ default: module.AdaptabilityHubPage })));
const AdaptabilityLessonPage = lazy(() => import("./AdaptabilityPages").then((module) => ({ default: module.AdaptabilityLessonPage })));
const AdaptabilityToolsPage = lazy(() => import("./AdaptabilityToolsPage"));
const ProblemSolvingHubPage = lazy(() => import("./ProblemSolvingPages").then((module) => ({ default: module.ProblemSolvingHubPage })));
const ProblemSolvingLessonPage = lazy(() => import("./ProblemSolvingPages").then((module) => ({ default: module.ProblemSolvingLessonPage })));
const ProblemSolvingToolsPage = lazy(() => import("./ProblemSolvingToolsPage"));
const CommunicationHubPage = lazy(() => import("./CommunicationPages").then((module) => ({ default: module.CommunicationHubPage })));
const CommunicationLessonPage = lazy(() => import("./CommunicationPages").then((module) => ({ default: module.CommunicationLessonPage })));
const CommunicationToolsPage = lazy(() => import("./CommunicationToolsPage"));
const WellbeingHubPage = lazy(() => import("./WellbeingPages").then((module) => ({ default: module.WellbeingHubPage })));
const WellbeingLessonPage = lazy(() => import("./WellbeingPages").then((module) => ({ default: module.WellbeingLessonPage })));
const WellbeingToolsPage = lazy(() => import("./WellbeingToolsPage"));
const AIBusinessHubPage = lazy(() => import("./AIBusinessPages").then((module) => ({ default: module.AIBusinessHubPage })));
const AIBusinessLessonPage = lazy(() => import("./AIBusinessPages").then((module) => ({ default: module.AIBusinessLessonPage })));
const AIBusinessToolsPage = lazy(() => import("./AIBusinessToolsPage"));
const ReliableAIHubPage = lazy(() => import("./ReliableAIPages").then((module) => ({ default: module.ReliableAIHubPage })));
const ReliableAILessonPage = lazy(() => import("./ReliableAIPages").then((module) => ({ default: module.ReliableAILessonPage })));
const ReliableAIToolsPage = lazy(() => import("./ReliableAIToolsPage"));
const OrgAIHubPage = lazy(() => import("./OrgAIPages").then((module) => ({ default: module.OrgAIHubPage })));
const OrgAILessonPage = lazy(() => import("./OrgAIPages").then((module) => ({ default: module.OrgAILessonPage })));
const OrgAIToolsPage = lazy(() => import("./OrgAIToolsPage"));
const ResponsibleAIHubPage = lazy(() => import("./ResponsibleAIPages").then((module) => ({ default: module.ResponsibleAIHubPage })));
const ResponsibleAILessonPage = lazy(() => import("./ResponsibleAIPages").then((module) => ({ default: module.ResponsibleAILessonPage })));
const ResponsibleAIToolsPage = lazy(() => import("./ResponsibleAIToolsPage"));
const AdoptionAIHubPage = lazy(() => import("./AdoptionAIPages").then((module) => ({ default: module.AdoptionAIHubPage })));
const AdoptionAILessonPage = lazy(() => import("./AdoptionAIPages").then((module) => ({ default: module.AdoptionAILessonPage })));
const AdoptionAIToolsPage = lazy(() => import("./AdoptionAIToolsPage"));
const ComputationalHubPage = lazy(() => import("./ComputationalPages").then((module) => ({ default: module.ComputationalHubPage })));
const ComputationalLessonPage = lazy(() => import("./ComputationalPages").then((module) => ({ default: module.ComputationalLessonPage })));
const ComputationalToolsPage = lazy(() => import("./ComputationalToolsPage"));
const DeepLearningHubPage = lazy(() => import("./DeepLearningPages").then((module) => ({ default: module.DeepLearningHubPage })));
const DeepLearningLessonPage = lazy(() => import("./DeepLearningPages").then((module) => ({ default: module.DeepLearningLessonPage })));
const DeepLearningToolsPage = lazy(() => import("./DeepLearningToolsPage"));
const MarketingHubPage = lazy(() => import("./MarketingPages").then((module) => ({ default: module.MarketingHubPage })));
const MarketingLessonPage = lazy(() => import("./MarketingPages").then((module) => ({ default: module.MarketingLessonPage })));
const MarketingToolsPage = lazy(() => import("./MarketingPages").then((module) => ({ default: module.MarketingToolsPage })));
const ProspectingHubPage = lazy(() => import("./ProspectingPages").then((module) => ({ default: module.ProspectingHubPage })));
const ProspectingLessonPage = lazy(() => import("./ProspectingPages").then((module) => ({ default: module.ProspectingLessonPage })));
const ProspectingToolsPage = lazy(() => import("./ProspectingPages").then((module) => ({ default: module.ProspectingToolsPage })));
const InformationalHubPage = lazy(() => import("./InformationalInterviewPages").then((module) => ({ default: module.InformationalHubPage })));
const InformationalLessonPage = lazy(() => import("./InformationalInterviewPages").then((module) => ({ default: module.InformationalLessonPage })));
const InformationalCasesPage = lazy(() => import("./InformationalInterviewPages").then((module) => ({ default: module.InformationalCasesPage })));
const InformationalResourcesPage = lazy(() => import("./InformationalInterviewPages").then((module) => ({ default: module.InformationalResourcesPage })));
const InformationalToolsPage = lazy(() => import("./InformationalInterviewPages").then((module) => ({ default: module.InformationalToolsPage })));
const ProfessionalBrandHubPage = lazy(() => import("./ProfessionalBrandPages").then((module) => ({ default: module.ProfessionalBrandHubPage })));
const ProfessionalBrandLessonPage = lazy(() => import("./ProfessionalBrandPages").then((module) => ({ default: module.ProfessionalBrandLessonPage })));
const ProfessionalBrandCasesPage = lazy(() => import("./ProfessionalBrandPages").then((module) => ({ default: module.ProfessionalBrandCasesPage })));
const ProfessionalBrandResourcesPage = lazy(() => import("./ProfessionalBrandPages").then((module) => ({ default: module.ProfessionalBrandResourcesPage })));
const ProfessionalBrandToolsPage = lazy(() => import("./ProfessionalBrandPages").then((module) => ({ default: module.ProfessionalBrandToolsPage })));
const ListeningFeedbackHubPage = lazy(() => import("./ListeningFeedbackPages").then((module) => ({ default: module.ListeningFeedbackHubPage })));
const ListeningFeedbackLessonPage = lazy(() => import("./ListeningFeedbackPages").then((module) => ({ default: module.ListeningFeedbackLessonPage })));
const ListeningFeedbackCasesPage = lazy(() => import("./ListeningFeedbackPages").then((module) => ({ default: module.ListeningFeedbackCasesPage })));
const ListeningFeedbackResourcesPage = lazy(() => import("./ListeningFeedbackPages").then((module) => ({ default: module.ListeningFeedbackResourcesPage })));
const ListeningFeedbackToolsPage = lazy(() => import("./ListeningFeedbackPages").then((module) => ({ default: module.ListeningFeedbackToolsPage })));
const CompanyResearchHubPage = lazy(() => import("./CompanyResearchPages").then((module) => ({ default: module.CompanyResearchHubPage })));
const CompanyResearchLessonPage = lazy(() => import("./CompanyResearchPages").then((module) => ({ default: module.CompanyResearchLessonPage })));
const CompanyResearchCasesPage = lazy(() => import("./CompanyResearchPages").then((module) => ({ default: module.CompanyResearchCasesPage })));
const CompanyResearchResourcesPage = lazy(() => import("./CompanyResearchPages").then((module) => ({ default: module.CompanyResearchResourcesPage })));
const CompanyResearchToolsPage = lazy(() => import("./CompanyResearchPages").then((module) => ({ default: module.CompanyResearchToolsPage })));
const TeamworkHubPage = lazy(() => import("./TeamworkPages").then((module) => ({ default: module.TeamworkHubPage })));
const TeamworkLessonPage = lazy(() => import("./TeamworkPages").then((module) => ({ default: module.TeamworkLessonPage })));
const TeamworkCasesPage = lazy(() => import("./TeamworkPages").then((module) => ({ default: module.TeamworkCasesPage })));
const TeamworkResourcesPage = lazy(() => import("./TeamworkPages").then((module) => ({ default: module.TeamworkResourcesPage })));
const TeamworkToolsPage = lazy(() => import("./TeamworkPages").then((module) => ({ default: module.TeamworkToolsPage })));
const MortgageCalculatorPage = lazy(() => import("./MortgageCalculatorPage"));
const MortgageLearningPage = lazy(() => import("./MortgageLearningPage"));
const InvestmentEvaluatorPage = lazy(() => import("./InvestmentEvaluatorPage"));
const InvestmentLearningPage = lazy(() => import("./InvestmentLearningPage"));
import { LearnPage, NetworkingHubPage, NetworkingLessonPage, NotFoundPage, ToolsPage } from "./LearningPages";

const navigation = [
  ["Servicios", "/#services"],
  ["Aprende", "/aprende"],
  ["Herramientas", "/herramientas"],
  ["Sobre mí", "/about.html"],
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

function LearnAndApplySection() {
  const cards = [
    { title: "Guías y rutas de aprendizaje", text: "Explora temas organizados para aprender a tu ritmo.", href: "/aprende" },
    { title: "Plantillas y recursos", text: "Usa plantillas, checklists y hojas de trabajo para preparar conversaciones profesionales.", href: "/aprende/networking#recursos" },
    { title: "Herramientas interactivas", text: "Usa recursos que convierten una idea en una primera acción.", href: "/herramientas" },
  ];
  return (
    <section className="section learn-home-section">
      <SectionHeader eyebrow="Aprende y aplica" title="Conocimiento útil, conectado con la práctica." lead="Explora guías, modelos y herramientas diseñadas para ayudarte a desarrollar habilidades, tomar mejores decisiones y avanzar con mayor claridad." />
      <div className="learn-home-grid">
        {cards.map((card) => <a className="learn-home-card" href={card.href} key={card.title}><h3>{card.title}</h3><p>{card.text}</p><span>Explorar <ArrowRight size={16} /></span></a>)}
      </div>
    </section>
  );
}

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentPath = window.location.pathname;
  const normalizedPath = currentPath.replace(/\/$/, "") || "/";
  const networkingLessonSlug = normalizedPath.startsWith("/aprende/networking/")
    ? normalizedPath.replace("/aprende/networking/", "")
    : null;
  const consultingLessonSlug = normalizedPath.startsWith("/aprende/consultoria/")
    ? normalizedPath.replace("/aprende/consultoria/", "")
    : null;
  const caseLessonSlug = normalizedPath.startsWith("/aprende/consultoria/entrevistas-de-caso/")
    ? normalizedPath.replace("/aprende/consultoria/entrevistas-de-caso/", "")
    : null;
  const adaptabilityLessonSlug = normalizedPath.startsWith("/aprende/adaptabilidad-resiliencia/")
    ? normalizedPath.replace("/aprende/adaptabilidad-resiliencia/", "")
    : null;
  const problemSolvingLessonSlug = normalizedPath.startsWith("/aprende/resolucion-de-problemas/")
    ? normalizedPath.replace("/aprende/resolucion-de-problemas/", "")
    : null;
  const communicationLessonSlug = normalizedPath.startsWith("/aprende/comunicacion-profesional/")
    ? normalizedPath.replace("/aprende/comunicacion-profesional/", "")
    : null;
  const wellbeingLessonSlug = normalizedPath.startsWith("/aprende/relaciones-y-bienestar/")
    ? normalizedPath.replace("/aprende/relaciones-y-bienestar/", "")
    : null;
  const aiBusinessLessonSlug = normalizedPath.startsWith("/aprende/ia-generativa-para-negocios/")
    ? normalizedPath.replace("/aprende/ia-generativa-para-negocios/", "")
    : null;
  const reliableAILessonSlug = normalizedPath.startsWith("/aprende/sistemas-ia-confiables/")
    ? normalizedPath.replace("/aprende/sistemas-ia-confiables/", "")
    : null;
  const orgAILessonSlug = normalizedPath.startsWith("/aprende/preparacion-organizacional-para-ia/")
    ? normalizedPath.replace("/aprende/preparacion-organizacional-para-ia/", "")
    : null;
  const responsibleAILessonSlug = normalizedPath.startsWith("/aprende/ia-responsable-y-gobernanza/") ? normalizedPath.replace("/aprende/ia-responsable-y-gobernanza/", "") : null;
  const adoptionAILessonSlug = normalizedPath.startsWith("/aprende/escalamiento-y-adopcion-de-ia/") ? normalizedPath.replace("/aprende/escalamiento-y-adopcion-de-ia/", "") : null;
  const computationalLessonSlug = normalizedPath.startsWith("/aprende/pensamiento-computacional-y-datos/") ? normalizedPath.replace("/aprende/pensamiento-computacional-y-datos/", "") : null;
  const deepLearningLessonSlug = normalizedPath.startsWith("/aprende/inteligencia-artificial-y-deep-learning/") ? normalizedPath.replace("/aprende/inteligencia-artificial-y-deep-learning/", "") : null;
  const marketingLessonSlug = normalizedPath.startsWith("/aprende/marketing-digital/") ? normalizedPath.replace("/aprende/marketing-digital/", "") : null;
  const prospectingLessonSlug = normalizedPath.startsWith("/aprende/prospeccion-b2b/") ? normalizedPath.replace("/aprende/prospeccion-b2b/", "") : null;
  const informationalLessonSlug = normalizedPath.startsWith("/aprende/entrevistas-informativas/") ? normalizedPath.replace("/aprende/entrevistas-informativas/", "") : null;
  const professionalBrandLessonSlug = normalizedPath.startsWith("/aprende/marca-profesional/") ? normalizedPath.replace("/aprende/marca-profesional/", "") : null;
  const listeningFeedbackLessonSlug = normalizedPath.startsWith("/aprende/escucha-curiosidad-feedback/") ? normalizedPath.replace("/aprende/escucha-curiosidad-feedback/", "") : null;
  const companyResearchLessonSlug = normalizedPath.startsWith("/aprende/investigacion-de-empresas/") ? normalizedPath.replace("/aprende/investigacion-de-empresas/", "") : null;
  const teamworkLessonSlug = normalizedPath.startsWith("/aprende/trabajo-en-equipo/") ? normalizedPath.replace("/aprende/trabajo-en-equipo/", "") : null;

  const closeMobileNav = () => setMobileOpen(false);

  if (normalizedPath === "/aprende") return <LearnPage />;
  if (normalizedPath === "/aprende/finanzas-personales/como-evaluar-un-credito-hipotecario") return <Suspense fallback={<div className="loading">Cargando guía...</div>}><MortgageLearningPage /></Suspense>;
  if (normalizedPath === "/aprende/finanzas-personales/evaluar-inversion-inmobiliaria") return <Suspense fallback={<div className="loading">Cargando guía...</div>}><InvestmentLearningPage /></Suspense>;
  if (normalizedPath === "/aprende/networking") return <NetworkingHubPage />;
  if (networkingLessonSlug) return <NetworkingLessonPage slug={networkingLessonSlug} />;
  if (normalizedPath === "/aprende/consultoria") return <ConsultingHubPage />;
  if (normalizedPath === "/aprende/consultoria/entrevistas-de-caso") return <CaseInterviewHubPage />;
  if (caseLessonSlug) return <CaseInterviewLessonPage slug={caseLessonSlug} />;
  if (consultingLessonSlug) return <ConsultingLessonPage slug={consultingLessonSlug} />;
  if (normalizedPath === "/aprende/adaptabilidad-resiliencia") return <Suspense fallback={<div className="loading">Cargando ruta...</div>}><AdaptabilityHubPage /></Suspense>;
  if (adaptabilityLessonSlug) return <Suspense fallback={<div className="loading">Cargando módulo...</div>}><AdaptabilityLessonPage slug={adaptabilityLessonSlug} /></Suspense>;
  if (normalizedPath === "/aprende/resolucion-de-problemas") return <Suspense fallback={<div className="loading">Cargando ruta...</div>}><ProblemSolvingHubPage /></Suspense>;
  if (problemSolvingLessonSlug) return <Suspense fallback={<div className="loading">Cargando módulo...</div>}><ProblemSolvingLessonPage slug={problemSolvingLessonSlug} /></Suspense>;
  if (normalizedPath === "/aprende/comunicacion-profesional") return <Suspense fallback={<div className="loading">Cargando ruta...</div>}><CommunicationHubPage /></Suspense>;
  if (communicationLessonSlug) return <Suspense fallback={<div className="loading">Cargando módulo...</div>}><CommunicationLessonPage slug={communicationLessonSlug} /></Suspense>;
  if (normalizedPath === "/aprende/relaciones-y-bienestar") return <Suspense fallback={<div className="loading">Cargando ruta...</div>}><WellbeingHubPage /></Suspense>;
  if (wellbeingLessonSlug) return <Suspense fallback={<div className="loading">Cargando módulo...</div>}><WellbeingLessonPage slug={wellbeingLessonSlug} /></Suspense>;
  if (normalizedPath === "/aprende/ia-generativa-para-negocios") return <Suspense fallback={<div className="loading">Cargando ruta...</div>}><AIBusinessHubPage /></Suspense>;
  if (aiBusinessLessonSlug) return <Suspense fallback={<div className="loading">Cargando modulo...</div>}><AIBusinessLessonPage slug={aiBusinessLessonSlug} /></Suspense>;
  if (normalizedPath === "/aprende/sistemas-ia-confiables") return <Suspense fallback={<div className="loading">Cargando ruta...</div>}><ReliableAIHubPage /></Suspense>;
  if (reliableAILessonSlug) return <Suspense fallback={<div className="loading">Cargando modulo...</div>}><ReliableAILessonPage slug={reliableAILessonSlug} /></Suspense>;
  if (normalizedPath === "/aprende/preparacion-organizacional-para-ia") return <Suspense fallback={<div className="loading">Cargando ruta...</div>}><OrgAIHubPage /></Suspense>;
  if (orgAILessonSlug) return <Suspense fallback={<div className="loading">Cargando modulo...</div>}><OrgAILessonPage slug={orgAILessonSlug} /></Suspense>;
  if (normalizedPath === "/aprende/ia-responsable-y-gobernanza") return <Suspense fallback={<div className="loading">Cargando ruta...</div>}><ResponsibleAIHubPage /></Suspense>;
  if (responsibleAILessonSlug) return <Suspense fallback={<div className="loading">Cargando modulo...</div>}><ResponsibleAILessonPage slug={responsibleAILessonSlug} /></Suspense>;
  if (normalizedPath === "/aprende/escalamiento-y-adopcion-de-ia") return <Suspense fallback={<div className="loading">Cargando ruta...</div>}><AdoptionAIHubPage /></Suspense>;
  if (adoptionAILessonSlug) return <Suspense fallback={<div className="loading">Cargando modulo...</div>}><AdoptionAILessonPage slug={adoptionAILessonSlug} /></Suspense>;
  if (normalizedPath === "/aprende/pensamiento-computacional-y-datos") return <Suspense fallback={<div className="loading">Cargando ruta...</div>}><ComputationalHubPage /></Suspense>;
  if (computationalLessonSlug) return <Suspense fallback={<div className="loading">Cargando modulo...</div>}><ComputationalLessonPage slug={computationalLessonSlug} /></Suspense>;
  if (normalizedPath === "/aprende/inteligencia-artificial-y-deep-learning") return <Suspense fallback={<div className="loading">Cargando ruta...</div>}><DeepLearningHubPage /></Suspense>;
  if (deepLearningLessonSlug) return <Suspense fallback={<div className="loading">Cargando modulo...</div>}><DeepLearningLessonPage slug={deepLearningLessonSlug} /></Suspense>;
  if (normalizedPath === "/aprende/marketing-digital") return <Suspense fallback={<div className="loading">Cargando ruta...</div>}><MarketingHubPage /></Suspense>;
  if (normalizedPath === "/aprende/prospeccion-b2b") return <Suspense fallback={<div className="loading">Cargando ruta...</div>}><ProspectingHubPage /></Suspense>;
  if (prospectingLessonSlug) return <Suspense fallback={<div className="loading">Cargando módulo...</div>}><ProspectingLessonPage slug={prospectingLessonSlug} /></Suspense>;
  if (normalizedPath === "/aprende/entrevistas-informativas") return <Suspense fallback={<div className="loading">Cargando ruta...</div>}><InformationalHubPage /></Suspense>;
  if (normalizedPath === "/aprende/entrevistas-informativas/casos") return <Suspense fallback={<div className="loading">Cargando casos...</div>}><InformationalCasesPage /></Suspense>;
  if (normalizedPath === "/aprende/entrevistas-informativas/recursos") return <Suspense fallback={<div className="loading">Cargando recursos...</div>}><InformationalResourcesPage /></Suspense>;
  if (informationalLessonSlug) return <Suspense fallback={<div className="loading">Cargando módulo...</div>}><InformationalLessonPage slug={informationalLessonSlug} /></Suspense>;
  if (normalizedPath === "/aprende/marca-profesional") return <Suspense fallback={<div className="loading">Cargando ruta...</div>}><ProfessionalBrandHubPage /></Suspense>;
  if (normalizedPath === "/aprende/marca-profesional/casos") return <Suspense fallback={<div className="loading">Cargando casos...</div>}><ProfessionalBrandCasesPage /></Suspense>;
  if (normalizedPath === "/aprende/marca-profesional/recursos") return <Suspense fallback={<div className="loading">Cargando recursos...</div>}><ProfessionalBrandResourcesPage /></Suspense>;
  if (professionalBrandLessonSlug) return <Suspense fallback={<div className="loading">Cargando módulo...</div>}><ProfessionalBrandLessonPage slug={professionalBrandLessonSlug} /></Suspense>;
  if (normalizedPath === "/aprende/escucha-curiosidad-feedback") return <Suspense fallback={<div className="loading">Cargando ruta...</div>}><ListeningFeedbackHubPage /></Suspense>;
  if (normalizedPath === "/aprende/escucha-curiosidad-feedback/casos") return <Suspense fallback={<div className="loading">Cargando casos...</div>}><ListeningFeedbackCasesPage /></Suspense>;
  if (normalizedPath === "/aprende/escucha-curiosidad-feedback/recursos") return <Suspense fallback={<div className="loading">Cargando recursos...</div>}><ListeningFeedbackResourcesPage /></Suspense>;
  if (listeningFeedbackLessonSlug) return <Suspense fallback={<div className="loading">Cargando módulo...</div>}><ListeningFeedbackLessonPage slug={listeningFeedbackLessonSlug} /></Suspense>;
  if (normalizedPath === "/aprende/investigacion-de-empresas") return <Suspense fallback={<div className="loading">Cargando ruta...</div>}><CompanyResearchHubPage /></Suspense>;
  if (normalizedPath === "/aprende/investigacion-de-empresas/casos") return <Suspense fallback={<div className="loading">Cargando casos...</div>}><CompanyResearchCasesPage /></Suspense>;
  if (normalizedPath === "/aprende/investigacion-de-empresas/recursos") return <Suspense fallback={<div className="loading">Cargando recursos...</div>}><CompanyResearchResourcesPage /></Suspense>;
  if (companyResearchLessonSlug) return <Suspense fallback={<div className="loading">Cargando módulo...</div>}><CompanyResearchLessonPage slug={companyResearchLessonSlug} /></Suspense>;
  if (normalizedPath === "/aprende/trabajo-en-equipo") return <Suspense fallback={<div className="loading">Cargando ruta...</div>}><TeamworkHubPage /></Suspense>;
  if (normalizedPath === "/aprende/trabajo-en-equipo/casos") return <Suspense fallback={<div className="loading">Cargando casos...</div>}><TeamworkCasesPage /></Suspense>;
  if (normalizedPath === "/aprende/trabajo-en-equipo/recursos") return <Suspense fallback={<div className="loading">Cargando recursos...</div>}><TeamworkResourcesPage /></Suspense>;
  if (teamworkLessonSlug) return <Suspense fallback={<div className="loading">Cargando módulo...</div>}><TeamworkLessonPage slug={teamworkLessonSlug} /></Suspense>;
  if (marketingLessonSlug) return <Suspense fallback={<div className="loading">Cargando módulo...</div>}><MarketingLessonPage slug={marketingLessonSlug} /></Suspense>;
  if (normalizedPath === "/herramientas") return <ToolsPage />;
  if (normalizedPath === "/herramientas/calculadora-hipotecaria") return <Suspense fallback={<div className="loading">Cargando calculadora...</div>}><MortgageCalculatorPage /></Suspense>;
  if (normalizedPath === "/herramientas/evaluador-inversion-inmobiliaria") return <Suspense fallback={<div className="loading">Cargando evaluador...</div>}><InvestmentEvaluatorPage /></Suspense>;
  if (normalizedPath === "/herramientas/generador-mensajes-networking") return <MessageGeneratorPage />;
  if (normalizedPath === "/herramientas/constructor-bullets-consultoria") return <ImpactBulletBuilderPage />;
  if (normalizedPath === "/herramientas/practica-market-sizing") return <CaseToolsPage kind="sizing" />;
  if (normalizedPath === "/herramientas/disenador-experimentos-negocio") return <CaseToolsPage kind="experiment" />;
  if (normalizedPath === "/herramientas/constructor-estructuras-caso") return <CaseToolsPage kind="structure" />;
  if (normalizedPath === "/herramientas/seguimiento-practica-casos") return <CaseToolsPage kind="tracker" />;
  if (normalizedPath === "/herramientas/constructor-intenciones-aprendizaje") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><AdaptabilityToolsPage kind="intention" /></Suspense>;
  if (normalizedPath === "/herramientas/reencuadrar-desafio") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><AdaptabilityToolsPage kind="reframe" /></Suspense>;
  if (normalizedPath === "/herramientas/planificador-habitos-aprendizaje") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><AdaptabilityToolsPage kind="habit" /></Suspense>;
  if (normalizedPath === "/herramientas/plan-adaptabilidad") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><AdaptabilityToolsPage kind="plan" /></Suspense>;
  if (normalizedPath === "/herramientas/diario-aprendizaje") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><AdaptabilityToolsPage kind="journal" /></Suspense>;
  if (normalizedPath === "/herramientas/diagnostico-tipo-problema") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><ProblemSolvingToolsPage kind="diagnostic" /></Suspense>;
  if (normalizedPath === "/herramientas/definir-problema") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><ProblemSolvingToolsPage kind="definition" /></Suspense>;
  if (normalizedPath === "/herramientas/constructor-arbol-problemas") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><ProblemSolvingToolsPage kind="tree" /></Suspense>;
  if (normalizedPath === "/herramientas/priorizar-analisis") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><ProblemSolvingToolsPage kind="priority" /></Suspense>;
  if (normalizedPath === "/herramientas/plan-trabajo-problema") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><ProblemSolvingToolsPage kind="workplan" /></Suspense>;
  if (normalizedPath === "/herramientas/constructor-recomendaciones") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><ProblemSolvingToolsPage kind="recommendation" /></Suspense>;
  if (normalizedPath === "/herramientas/revision-sesgos-decision") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><ProblemSolvingToolsPage kind="bias" /></Suspense>;
  if (normalizedPath === "/herramientas/mapa-audiencia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><CommunicationToolsPage kind="audience" /></Suspense>;
  if (normalizedPath === "/herramientas/practica-escucha-activa") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><CommunicationToolsPage kind="listening" /></Suspense>;
  if (normalizedPath === "/herramientas/definir-proposito-comunicacion") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><CommunicationToolsPage kind="purpose" /></Suspense>;
  if (normalizedPath === "/herramientas/convertir-datos-en-insight") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><CommunicationToolsPage kind="insight" /></Suspense>;
  if (normalizedPath === "/herramientas/estructurar-mensaje") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><CommunicationToolsPage kind="message" /></Suspense>;
  if (normalizedPath === "/herramientas/constructor-narrativa-profesional") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><CommunicationToolsPage kind="narrative" /></Suspense>;
  if (normalizedPath === "/herramientas/preparar-presentacion") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><CommunicationToolsPage kind="presentation" /></Suspense>;
  if (normalizedPath === "/herramientas/planificar-reunion") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><CommunicationToolsPage kind="meeting" /></Suspense>;
  if (normalizedPath === "/herramientas/mapa-bienestar-contexto") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><WellbeingToolsPage kind="context" /></Suspense>;
  if (normalizedPath === "/herramientas/mapa-energia-recuperacion") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><WellbeingToolsPage kind="energy" /></Suspense>;
  if (normalizedPath === "/herramientas/plan-practica-sostenible") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><WellbeingToolsPage kind="practice" /></Suspense>;
  if (normalizedPath === "/herramientas/preparar-limite-profesional") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><WellbeingToolsPage kind="boundary" /></Suspense>;
  if (normalizedPath === "/herramientas/preparar-conversacion-relacion") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><WellbeingToolsPage kind="relationship" /></Suspense>;
  if (normalizedPath === "/herramientas/preparar-conversacion-dificil") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><WellbeingToolsPage kind="difficult" /></Suspense>;
  if (normalizedPath === "/herramientas/reflexion-seguridad-equipo") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><WellbeingToolsPage kind="safety" /></Suspense>;
  if (normalizedPath === "/herramientas/disenar-practicas-equipo") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><WellbeingToolsPage kind="team" /></Suspense>;
  if (normalizedPath === "/herramientas/plan-relaciones-bienestar") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><WellbeingToolsPage kind="plan" /></Suspense>;
  if (normalizedPath === "/herramientas/evaluar-oportunidad-ia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><AIBusinessToolsPage kind="opportunity" /></Suspense>;
  if (normalizedPath === "/herramientas/seleccionar-enfoque-ia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><AIBusinessToolsPage kind="pattern" /></Suspense>;
  if (normalizedPath === "/herramientas/elegir-solucion-ia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><AIBusinessToolsPage kind="approach" /></Suspense>;
  if (normalizedPath === "/herramientas/evaluar-agente-negocio") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><AIBusinessToolsPage kind="agent" /></Suspense>;
  if (normalizedPath === "/herramientas/calculadora-economia-ia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><AIBusinessToolsPage kind="economics" /></Suspense>;
  if (normalizedPath === "/herramientas/disenar-gobernanza-ia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><AIBusinessToolsPage kind="governance" /></Suspense>;
  if (normalizedPath === "/herramientas/disenar-piloto-ia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><AIBusinessToolsPage kind="pilot" /></Suspense>;
  if (normalizedPath === "/herramientas/crear-plan-adopcion-ia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><AIBusinessToolsPage kind="adoption" /></Suspense>;
  if (normalizedPath === "/herramientas/evaluar-escala-ia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><AIBusinessToolsPage kind="scale" /></Suspense>;
  if (normalizedPath === "/herramientas/mapa-confiabilidad-ia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><ReliableAIToolsPage kind="reliability" /></Suspense>;
  if (normalizedPath === "/herramientas/disenar-plantilla-prompt") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><ReliableAIToolsPage kind="prompt" /></Suspense>;
  if (normalizedPath === "/herramientas/evaluar-fuentes-ia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><ReliableAIToolsPage kind="sources" /></Suspense>;
  if (normalizedPath === "/herramientas/disenar-flujo-rag") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><ReliableAIToolsPage kind="rag" /></Suspense>;
  if (normalizedPath === "/herramientas/evaluar-preparacion-datos-ia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><ReliableAIToolsPage kind="data" /></Suspense>;
  if (normalizedPath === "/herramientas/revision-seguridad-ia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><ReliableAIToolsPage kind="security" /></Suspense>;
  if (normalizedPath === "/herramientas/elegir-metodo-ia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><ReliableAIToolsPage kind="method" /></Suspense>;
  if (normalizedPath === "/herramientas/plan-evaluacion-ia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><ReliableAIToolsPage kind="evaluation" /></Suspense>;
  if (normalizedPath === "/herramientas/plan-ciclo-vida-modelo") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><ReliableAIToolsPage kind="lifecycle" /></Suspense>;
  if (normalizedPath === "/herramientas/disenar-operacion-ia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><ReliableAIToolsPage kind="operations" /></Suspense>;
  if (normalizedPath === "/herramientas/evaluar-preparacion-organizacional-ia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><OrgAIToolsPage kind="readiness" /></Suspense>;
  if (normalizedPath === "/herramientas/alinear-iniciativa-ia-estrategia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><OrgAIToolsPage kind="strategy" /></Suspense>;
  if (normalizedPath === "/herramientas/portafolio-iniciativas-ia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><OrgAIToolsPage kind="portfolio" /></Suspense>;
  if (normalizedPath === "/herramientas/evaluar-base-tecnologia-datos-ia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><OrgAIToolsPage kind="foundation" /></Suspense>;
  if (normalizedPath === "/herramientas/mapa-capacidades-organizacionales-ia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><OrgAIToolsPage kind="capabilities" /></Suspense>;
  if (normalizedPath === "/herramientas/disenar-gobierno-organizacional-ia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><OrgAIToolsPage kind="governance" /></Suspense>;
  if (normalizedPath === "/herramientas/crear-hoja-ruta-organizacional-ia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><OrgAIToolsPage kind="roadmap" /></Suspense>;
  if (normalizedPath === "/herramientas/disenar-proceso-entrega-ia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><OrgAIToolsPage kind="delivery" /></Suspense>;
  if (normalizedPath === "/herramientas/plan-adopcion-organizacional-ia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><OrgAIToolsPage kind="adoption" /></Suspense>;
  if (normalizedPath === "/herramientas/monitorear-portafolio-ia") return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><OrgAIToolsPage kind="monitor" /></Suspense>;
  {const responsibleTools={"/herramientas/mapa-impacto-ia":"impact","/herramientas/evaluar-uso-sensible-ia":"sensitive","/herramientas/revision-equidad-ia":"fairness","/herramientas/plan-proteccion-ia":"protection","/herramientas/evaluacion-impacto-ia":"assessment","/herramientas/disenar-supervision-humana-ia":"oversight","/herramientas/disenar-modelo-gobernanza-ia":"governance","/herramientas/inventario-gobernanza-ia":"inventory","/herramientas/revision-inclusion-ia":"inclusion","/herramientas/crear-nota-transparencia-ia":"transparency","/herramientas/evaluar-proveedor-ia":"vendor"};if(responsibleTools[normalizedPath])return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><ResponsibleAIToolsPage kind={responsibleTools[normalizedPath]}/></Suspense>}
  {const adoptionTools={"/herramientas/revision-escalamiento-ia":"scaling","/herramientas/alineamiento-escalamiento-ia":"alignment","/herramientas/disenar-modelo-operativo-ia":"operating","/herramientas/gestionar-portafolio-escalamiento-ia":"portfolio","/herramientas/evaluar-componente-reutilizable-ia":"component","/herramientas/plan-colaboracion-dominio-ia":"domain","/herramientas/plan-democratizacion-ia":"democratization","/herramientas/plan-aprendizaje-roles-ia":"learning","/herramientas/tablero-adopcion-ia":"dashboard","/herramientas/revisar-portafolio-agentes-ia":"agents","/herramientas/crear-hoja-ruta-escalamiento-ia":"roadmap"};if(adoptionTools[normalizedPath])return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><AdoptionAIToolsPage kind={adoptionTools[normalizedPath]}/></Suspense>}
  {const computationalTools={"/herramientas/comparador-estrategias-optimizacion":"optimization","/herramientas/explorador-monte-carlo":"montecarlo","/herramientas/muestreo-e-intervalos":"sampling"};if(computationalTools[normalizedPath])return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><ComputationalToolsPage kind={computationalTools[normalizedPath]}/></Suspense>}
  {const deepTools={"/herramientas/explorador-red-neuronal":"network","/herramientas/interpretar-curvas-entrenamiento":"curve","/herramientas/elegir-estrategia-ia":"strategy"};if(deepTools[normalizedPath])return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><DeepLearningToolsPage kind={deepTools[normalizedPath]}/></Suspense>}
  {const marketingTools={"/herramientas/diagnostico-marketing-digital":"diagnostic","/herramientas/crear-estrategia-marketing-digital":"strategy","/herramientas/mapa-recorrido-cliente":"journey","/herramientas/auditoria-presencia-digital":"audit","/herramientas/seleccionar-canales-marketing":"channels","/herramientas/plan-contenidos-marketing":"content","/herramientas/plan-medicion-marketing":"measurement","/herramientas/calculadora-metricas-marketing":"metrics"};if(marketingTools[normalizedPath])return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><MarketingToolsPage kind={marketingTools[normalizedPath]}/></Suspense>}
  {const prospectingTools={"/herramientas/diagnostico-prospeccion-b2b":"diagnostic","/herramientas/definir-cliente-ideal-b2b":"icp","/herramientas/crear-propuesta-valor-b2b":"value","/herramientas/crear-mensaje-prospeccion-b2b":"message","/herramientas/crear-secuencia-prospeccion":"sequence","/herramientas/preparar-respuestas-objeciones":"objection","/herramientas/calculadora-prospeccion-b2b":"calculator","/herramientas/tablero-prospeccion-b2b":"dashboard"};if(prospectingTools[normalizedPath])return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><ProspectingToolsPage kind={prospectingTools[normalizedPath]}/></Suspense>}
  {const informationalTools={"/herramientas/clarificador-entrevista-informativa":"objective","/herramientas/mapa-perspectivas-profesionales":"perspectives","/herramientas/clasificador-preguntas-entrevista":"questions","/herramientas/constructor-solicitud-entrevista-informativa":"request","/herramientas/revisor-solicitud-entrevista":"pressure","/herramientas/planificador-conversacion-informativa":"conversation","/herramientas/preparador-evento-profesional":"event","/herramientas/registro-aprendizajes-conversacion":"record","/herramientas/comparador-perspectivas-profesionales":"compare","/herramientas/decisor-seguimiento-profesional":"followup"};if(informationalTools[normalizedPath])return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><InformationalToolsPage kind={informationalTools[normalizedPath]}/></Suspense>}
  {const professionalBrandTools={"/herramientas/diagnostico-senales-profesionales":"signals","/herramientas/inventario-evidencia-profesional":"evidence","/herramientas/constructor-contribuciones-profesionales":"contribution","/herramientas/constructor-narrativa-marca-profesional":"narrative","/herramientas/revisor-lenguaje-profesional":"language","/herramientas/mapa-coherencia-profesional":"coherence","/herramientas/revisor-perfil-profesional":"profile","/herramientas/preparar-revision-marca-profesional":"peers","/herramientas/plan-actualizacion-marca-profesional":"update","/herramientas/comparar-canales-profesionales":"compare"};if(professionalBrandTools[normalizedPath])return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><ProfessionalBrandToolsPage kind={professionalBrandTools[normalizedPath]}/></Suspense>}
  {const listeningFeedbackTools={"/herramientas/observador-atencion-conversaciones":"attention","/herramientas/separar-observacion-interpretacion":"separate","/herramientas/constructor-preguntas-curiosidad":"curiosity","/herramientas/preparar-escucha-conversacion":"prepare","/herramientas/filtro-feedback-util":"filter","/herramientas/revisar-feedback-profesional":"give","/herramientas/planificar-respuesta-feedback":"respond","/herramientas/simular-clarificacion-conversacion":"clarify","/herramientas/plan-reparacion-conversacion":"repair","/herramientas/plan-practica-escucha-feedback":"practice"};if(listeningFeedbackTools[normalizedPath])return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><ListeningFeedbackToolsPage kind={listeningFeedbackTools[normalizedPath]}/></Suspense>}
  {const companyResearchTools={"/herramientas/crear-pregunta-investigacion-empresa":"question","/herramientas/generar-universo-organizaciones":"universe","/herramientas/evaluar-fuente-empresarial":"source","/herramientas/mapa-evidencia-empresarial":"map","/herramientas/analizar-rol-contexto":"role","/herramientas/comparar-organizaciones":"compare","/herramientas/detectar-contradicciones-empresa":"contradiction","/herramientas/planificar-investigacion-empresa":"next","/herramientas/registro-investigacion-empresa":"log","/herramientas/revisar-privacidad-investigacion":"privacy"};if(companyResearchTools[normalizedPath])return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><CompanyResearchToolsPage kind={companyResearchTools[normalizedPath]}/></Suspense>}
  {const teamworkTools={"/herramientas/clarificar-proposito-equipo":"purpose","/herramientas/mapear-dependencias-equipo":"dependencies","/herramientas/disenar-decision-equipo":"rights","/herramientas/crear-acuerdos-equipo":"agreements","/herramientas/preparar-desacuerdo-equipo":"disagreement","/herramientas/registrar-decision-equipo":"decision","/herramientas/revisar-compromisos-equipo":"commitments","/herramientas/revisar-ciclo-equipo":"review","/herramientas/observar-dinamica-equipo":"dynamics","/herramientas/crear-experimento-equipo":"experiment"};if(teamworkTools[normalizedPath])return <Suspense fallback={<div className="loading">Cargando herramienta...</div>}><TeamworkToolsPage kind={teamworkTools[normalizedPath]}/></Suspense>}
  if (normalizedPath !== "/" && normalizedPath !== "/index.html") return <NotFoundPage />;

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Saltar al contenido principal</a>
      <header className="site-nav">
        <a
          className="brand-mark"
          href="/"
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

      <main id="main-content">
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

        <LearnAndApplySection />

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
      <Analytics />
    </div>
  );
}
