import { useState } from "react";
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
  name: "Felipe Masanes-Didyk",
  role: "Strategy consultant and coach",
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

const navigation = [
  ["Services", "#services"],
  ["Approach", "#approach"],
  ["Proof", "#proof"],
  ["Credentials", "#credentials"],
  ["Finance", "#finance"],
  ["Contact", "#contact"],
];

const services = [
  {
    title: "Strategy & Business Consulting",
    icon: BriefcaseBusiness,
    accent: "ink",
    description:
      "For organizations that need a clearer strategic agenda, sharper priorities, and a practical path from analysis to action.",
    includes: [
      "Strategic diagnosis and decision framing",
      "Business model, value proposition, and market entry strategy",
      "Pricing, roadmap, and stakeholder alignment",
    ],
  },
  {
    title: "Marketing, Growth & Innovation Consulting",
    icon: Rocket,
    accent: "burgundy",
    description:
      "For teams looking to improve acquisition, retention, product adoption, and commercial learning through disciplined experimentation.",
    includes: [
      "Go-to-market and growth strategy",
      "Funnels, CRM, analytics, and experimentation systems",
      "Innovation playbooks using Lean Startup, OKRs, ICE, and RICE",
    ],
  },
  {
    title: "UX, Product & Problem-Solving Consulting",
    icon: Layers3,
    accent: "blue",
    description:
      "For complex product, customer, or adoption problems that need to be made simple enough to solve and useful enough to execute.",
    includes: [
      "Problem decomposition and usable frameworks",
      "Customer journey, segmentation, and value proposition design",
      "MVP learning plans and product adoption roadmaps",
    ],
  },
  {
    title: "Career & Leadership Coaching",
    icon: UserRoundCheck,
    accent: "sage",
    description:
      "For professionals navigating transitions, job searches, networking, leadership growth, or the next stage of their career.",
    includes: [
      "Career strategy, positioning, and pitch development",
      "Networking plans and interview preparation",
      "Leadership development and professional decision support",
    ],
  },
  {
    title: "Life Coaching",
    icon: Compass,
    accent: "gold",
    description:
      "For individuals who want structure around decisions, priorities, habits, energy, and the tradeoffs behind a fuller life.",
    includes: [
      "Clarifying goals, values, and personal operating principles",
      "Decision frameworks for ambiguous moments",
      "Accountability rhythms that are realistic and human",
    ],
  },
  {
    title: "Personal & Family Financial Coaching",
    icon: WalletCards,
    accent: "teal",
    description:
      "For people and families who want control, order, and confidence in everyday financial decisions without speculative promises.",
    includes: [
      "Budget architecture and cash-flow clarity",
      "Debt, savings, and planning conversations",
      "Financial education for practical household decisions",
    ],
  },
];

const proofPoints = [
  {
    value: "MBA",
    label: "Kelley School of Business",
    detail:
      "Full-time MBA focused on Supply Chain Management and Business Analytics, with Consulting and Leadership Academy participation.",
  },
  {
    value: "60+",
    label: "growth experiments",
    detail:
      "Executed while leading growth for Klicker, an AI-powered fintech venture inside Grupo Kaufmann's innovation division.",
  },
  {
    value: "$350K",
    label: "funding secured",
    detail:
      "Built forecasts and supported funding for Klicker while shaping the venture's business model and market entry strategy.",
  },
  {
    value: "150",
    label: "growth community members",
    detail:
      "Built Lideres de Growth, a Chilean community for startup and company growth leaders to share practice and learning.",
  },
];

const highlights = [
  {
    eyebrow: "Digital transformation and growth strategy",
    title: "Finvivir / Grupo FI",
    icon: BarChart3,
    body: "Led the design and execution of a Growth Playbook integrating Lean Startup, OKRs, ICE/RICE prioritization, A/B testing, leader segmentation, and cohort analysis in QuickSight.",
    facts: [
      "Roadmap to scale Ilana App adoption",
      "Stakeholder coordination across Sales, Product, Marketing, Analytics, and Technology",
      "Validated initiatives projected at +25% digital adoption, -15% CAC, and +10% retention",
    ],
  },
  {
    eyebrow: "Corporate venture growth leadership",
    title: "Klicker at Kaufmann Chile",
    icon: Rocket,
    body: "Co-founded and led the strategic growth agenda for an AI-powered fintech venture, shaping the business model, value proposition, and market entry strategy.",
    facts: [
      "Secured $350,000 in funding through forecasting and business case work",
      "Led MVP deployment and more than 60 growth experiments",
      "Reduced CAC 100x and reached break-even according to the profile record",
    ],
  },
  {
    eyebrow: "MBA consulting",
    title: "Strategic market analysis for Microsoft",
    icon: Target,
    body: "Selected for a 12-week Kelley Consulting Academy project sponsored by Microsoft in an emerging computing area.",
    facts: [
      "Market research and competitor analysis",
      "Internal stakeholder interviews",
      "Executive-level recommendations for product adoption and positioning",
    ],
  },
  {
    eyebrow: "Product, brand, and customer strategy",
    title: "Diego Portales University",
    icon: GraduationCap,
    body: "Taught Marketing and Product, Brand & Customer Management, guiding students through applied frameworks and consulting projects for real clients.",
    facts: [
      "Marketing curriculum with STP, marketing mix, digital and growth marketing",
      "Master's-level projects for brands including Hellmann's Vegan, Rheem, Ama Time, and Tarragona",
      "Emphasis on analytics, indicators, and structured problem solving",
    ],
  },
];

const credentials = [
  {
    title: "MBA Candidate, Class of 2026",
    organization: "Indiana University, Kelley School of Business",
    detail:
      "Supply Chain Management and Business Analytics focus, Leadership minor, Consulting Academy, Leadership Academy, and coursework in predictive analytics, digital transformation, pricing, CRM, supply chain optimization, and leadership.",
  },
  {
    title: "Master of Science, Marketing Management",
    organization: "Universidad Diego Portales",
    detail:
      "Thesis approved with maximum grade; coursework across strategic marketing, market research, product and brand strategy, pricing, digital marketing, data mining, and customer centricity.",
  },
  {
    title: "Bachelor of Science, Business Administration and Economics",
    organization: "Universidad Diego Portales",
    detail:
      "Thesis approved with maximum grade, high PSU score scholarship, and winner of the Walmart Innova Challenge 2017.",
  },
];

const certifications = [
  "Kelley MBA Leadership Academy Coaching Certification",
  "MBA Essentials Certificate, LSE",
  "Innovation and Digital Transformation, FIU Executive Education",
  "Integrating Sustainability in Brand Management, Northwestern University",
  "Growth Frameworks, Growth Rockstar",
  "Digital Marketing certifications from HubSpot Academy and Google",
];

const consultingPrinciples = [
  "Translate abstract complexity into a simple operating model.",
  "Separate evidence, assumptions, risks, and decisions.",
  "Build enough structure to act without pretending the future is certain.",
  "Prioritize actions by business value, learning value, and execution reality.",
];

const coachingSteps = [
  {
    title: "Clarify the real question",
    body: "We define the decision, constraint, ambition, or pattern that is actually driving the conversation.",
  },
  {
    title: "Build the personal system",
    body: "We turn the issue into a practical cadence: choices, routines, conversations, financial structure, or career actions.",
  },
  {
    title: "Practice execution",
    body: "The work moves into real life: networking, leadership moments, difficult decisions, budget discipline, or habit design.",
  },
  {
    title: "Review and adapt",
    body: "We evaluate what happened, what changed, and what the next highest-leverage adjustment should be.",
  },
];

const endorsements = [
  {
    quote:
      "He brought a strategic and creative vision to Growth, driving marketing experiments that generated valuable learnings.",
    author: "Yelca Mondragon Pomares",
    context: "GrupoFi recommendation",
  },
  {
    quote:
      "Felipe has been a great support for me in different professional moments, thanks to his clear vision and strategic mindset.",
    author: "Jose Maria de Val Ortiz",
    context: "Client recommendation",
  },
  {
    quote:
      "Felipe demonstrated a remarkable ability to turn ideas into tactical experiments and measurable results.",
    author: "Marcos Sanchez Paez",
    context: "Kaufmann / Klicker recommendation",
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

  const closeMobileNav = () => setMobileOpen(false);

  return (
    <div className="site-shell">
      <header className="site-nav">
        <a
          className="brand-mark"
          href="#top"
          aria-label="Felipe Masanes-Didyk home"
        >
          <span>FM-D</span>
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
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
            Book
          </a>
          <button
            className="mobile-menu-button"
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {mobileOpen ? (
        <nav className="mobile-nav" aria-label="Mobile navigation">
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
            <p className="eyebrow">Strategy consulting & coaching</p>
            <h1>{profile.name}</h1>
            <p className="hero-lead">
              I help organizations, leaders, professionals, and families
              translate ambiguity into clear strategic action.
            </p>
            <p className="hero-body">
              My consulting work turns complex business, marketing, growth,
              product, and innovation problems into disciplined frameworks and
              executable plans. My coaching work helps people make better
              decisions, navigate transitions, lead with more clarity, and build
              practical personal systems.
            </p>
            <div className="hero-actions">
              <a
                className="button button--primary"
                href={profile.booking}
                target="_blank"
                rel="noreferrer"
              >
                Book a 30-minute consultation
                <ArrowRight size={18} strokeWidth={1.8} />
              </a>
              <a
                className="button button--secondary"
                href={`mailto:${profile.email}`}
              >
                Email Felipe
              </a>
            </div>
          </div>

          <div
            className="hero-visual"
            style={{ "--hero-image": `url(${asset(profile.photo)})` }}
            aria-label="Professional portrait of Felipe Masanes-Didyk"
          >
            <img
              src={asset(profile.photo)}
              alt="Felipe Masanes-Didyk professional portrait"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
            />
            <div className="hero-visual__panel">
              <span>Consulting first. Coaching second.</span>
              <p>
                Clear thinking, structured action, disciplined follow-through.
              </p>
            </div>
          </div>
        </section>

        <section className="proof-strip" aria-label="Professional proof points">
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
            eyebrow="Services"
            title="A broad practice, organized around the problems people actually bring."
            lead="The offer is intentionally coherent: strategy, growth, product clarity, leadership, personal direction, and household financial structure all require the same discipline of framing the real problem and choosing the next right action."
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
            <p className="eyebrow">How the work is framed</p>
            <h2>
              Consulting is where I do the work. Coaching is where I help you do
              the work.
            </h2>
            <p>
              The distinction matters. Some problems require an external
              operator who can diagnose, model, synthesize, and build the plan.
              Other problems require a structured partner who helps the client
              think better, act with discipline, and own the next step.
            </p>
          </div>

          <div className="approach-panels">
            <article>
              <Handshake size={26} strokeWidth={1.8} />
              <h3>Consulting</h3>
              <p>
                I enter the problem, structure the work, analyze the market or
                system, create usable frameworks, and translate the answer into
                action.
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
                I help the client clarify the decision, test assumptions, create
                accountability, and develop the judgment to keep moving without
                dependency.
              </p>
              <ul>
                <li>
                  Career transitions, job search, networking, and interviews.
                </li>
                <li>
                  Leadership moments, personal strategy, and life decisions.
                </li>
                <li>
                  Family financial clarity through budgets, structure, and
                  planning.
                </li>
                <li>
                  No speculative promises, investment management, tax, or legal
                  advice.
                </li>
              </ul>
            </article>
          </div>
        </section>

        <section id="proof" className="section section--ink">
          <SectionHeader
            eyebrow="Selected highlights"
            title="Evidence from strategy, growth, product, teaching, and consulting work."
            lead="These examples are drawn from the profile record and summarized conservatively to preserve the underlying facts."
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
                eyebrow="Credentials"
                title="Business training, practical execution, and teaching experience."
                lead="Felipe's background spans consulting, growth leadership, digital marketing, fintech, product and customer strategy, analytics, university teaching, and formal MBA training."
              />

              <div className="certification-block">
                <h3>Selected certifications and awards</h3>
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
              <p className="eyebrow">Coaching approach</p>
              <h2>
                Structured enough for progress. Human enough for real life.
              </h2>
              <p>
                The coaching practice is grounded in mentoring students and
                professionals, MBA leadership coaching training, university
                teaching, and years of helping people clarify career,
                leadership, and personal decisions. The work is direct,
                practical, and built around action.
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
            <p className="eyebrow">Personal & family financial coaching</p>
            <h2>Structure before speculation.</h2>
            <p>
              This work is for people who want to understand where their money
              goes, make conscious tradeoffs, plan with their family, and reduce
              financial noise. It is education, structure, and decision support,
              not speculative wealth building or licensed investment advice.
            </p>
          </div>

          <div className="finance-principles">
            <article>
              <CircleDollarSign size={24} strokeWidth={1.8} />
              <h3>Cash-flow clarity</h3>
              <p>
                Build a simple view of income, spending, obligations, and
                recurring decisions.
              </p>
            </article>
            <article>
              <Lightbulb size={24} strokeWidth={1.8} />
              <h3>Prioritization</h3>
              <p>
                Separate urgent pressure from important financial choices and
                next actions.
              </p>
            </article>
            <article>
              <Users size={24} strokeWidth={1.8} />
              <h3>Family alignment</h3>
              <p>
                Create shared language for goals, limits, tradeoffs, and
                accountability.
              </p>
            </article>
          </div>
        </section>

        <section className="section endorsements-section">
          <SectionHeader
            eyebrow="Recommendations"
            title="What collaborators and clients have highlighted."
            lead="Selected excerpts from profile recommendations, included without adding client logos or unsupported claims."
          />

          <div className="endorsement-grid">
            {endorsements.map((item) => (
              <figure key={item.author}>
                <blockquote>"{item.quote}"</blockquote>
                <figcaption>
                  <strong>{item.author}</strong>
                  <span>{item.context}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="contact" className="contact-section">
          <div className="contact-panel">
            <div>
              <p className="eyebrow">Start the conversation</p>
              <h2>Bring the problem. Leave with a sharper first frame.</h2>
              <p>
                Use the first call to clarify the situation, the decision at
                stake, and whether the right next step is consulting, coaching,
                or a narrower diagnostic.
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
                Book a 30-minute call
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

          <div className="contact-details" aria-label="Contact details">
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
