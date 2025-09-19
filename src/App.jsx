import { useState } from "react";
import {
  Sun, Moon, Mail, Linkedin, Github, MapPin, Phone,
  ChevronDown, ChevronUp, ExternalLink, PlayCircle, Image as ImageIcon
} from "lucide-react";

/* ------------ Profile / Site Data (edit freely) ------------ */
const PROFILE = {
  name: "Martin Masanes Didyk",
  tagline: "Civil & Structural Engineer · Digital Twins · System Identification · SHM",
  email: "martin.masanesdidyk@unh.edu",
  emailAlt: "martin.masanes.d@gmail.com",
  phone: "603 953 7899",
  location: "Dover, NH",
  linkedin: "https://www.linkedin.com/in/martin-masanes-didyk",
  github: "https://github.com/",
  scholar: "https://scholar.google.com/citations?user=vZB-oT0AAAAJ&hl=en",
  cvUrl: "#",
};

const areas = [
  "Digital Twins for Civil Infrastructure",
  "Recursive Bayesian Estimation (MVU, AKF)",
  "Input–State–Parameter Estimation",
  "System Identification & SHM",
  "OpenSees · MATLAB · Python · Computer Vision",
];

const education = [
  { degree: "Ph.D., Civil & Environmental Engineering", place: "University of New Hampshire, Durham, NH", years: "2021–2025" },
  { degree: "B.S., Civil Engineering", place: "Universidad de los Andes, Santiago, Chile", years: "2007–2013" },
];

const skills = {
  general: ["Structural Design", "Structural Health Monitoring", "System Identification", "Teaching & Mentoring"],
  software: ["OpenSees", "SAP2000 / ETABS / CSI Bridge", "GT Strudl", "AdaptBuilder", "AutoCAD / Revit", "ABI"],
  programming: ["MATLAB", "Python", "R", "TCL", "Mathcad", "ROS"],
};

/* ------------ Publications (abstract placeholder dropdowns) ------------ */
const publications = [
  {title: "A Nonlinear Filter for Output-Only Bayesian State–Parameter Estimation",
  author: "yo y que wea",
  venue: "TBD",
  date: "TBD",
  doi: "TBD",
  abstract: "This study contributes to the state-of-the-art in structural system identification and facilitates virtual sensing and digital twinning of different infrastructure systems under operational conditions by presenting a novel nonlinear extension of an output-only recursive Bayesian estimator, for systems with direct feedthrough. In addition to state estimation, two important aspects  to address in the context of digital twins and system identification of operational civil infrastructure are first, to identify the unknown loads under which the system is operating, and second, identify the true values of the system parameters. Herein a nonlinear extension of an output-only recursive Bayesian estimator (RBE) for state space systems with direct feedthrough is presented. The objective of a nonlinear filter is to estimate states of systems showing nonlinear behavior, or to be able to recursively estimate parameters of the system, whether the system is linear or not. Both simulated and experimental examples are presented. The simulated experiment is carried out to test the algorithm’s performance for simultaneous input-state-parameter estimation, when al theoretical assumptions made in the derivations are met. A reduced-scale laboratory test focuses on determining the states, inputs, and parameters of a laboratory scale model of a structural system.",
  links: [
    { label: "Demo video of thee filter performance", href: "https://www.youtube.com/watch?v=YytcXsam8Yw&ab_channel=MartinMasanes" },
    // Optional extras:
    // { label: "Code", href: "https://github.com/you/repo" },
    // { label: "Preprint PDF", href: "https://..." }
  ],
  },
  {
    title: "Towards digital twinning: Input-state-parameter estimation through extended MVU filter for systems without direct feedthrough using computer vision",
    venue: "Mechanical Systems and Signal Processing, 230:112557",
    date: "May 2025",
    doi: "https://doi.org/10.1016/j.ymssp.2025.112557",
    abstract: "The concept of a digital twin (DT) involves creating a digital replica of a system to accurately represent and interact with its physical counterpart. In large civil infrastructure, DT characteristics depend on whether they represent structural behavior, mechanical components, or both. For structural health monitoring (SHM), DTs provide vital information that is not readily accessible due to cost and accessibility issues. Recursive Bayesian estimation (RBE) combines data from simulations and sensors to estimate system states, but it faces challenges in estimating unobserved states. Kalman-type filters need input information, often unknown in structural systems. The augmented Kalman filter (AKF) addresses this issue by assuming a random walk as input model, while Minimum Variance Unbiased (MVU) filters do not make any prior assumption regarding the input or its statistics. Extending to simultaneous estimation of inputs, states, and system parameters requires nonlinear methods like the extended Kalman filter (EKF) or unscented Kalman filter (UKF). These methods need optimal sensor placement and address stability issues in real-life systems with limited accurate measurements. Recent advancements in computer vision (CV) provide high-quality displacement and velocity measurements. This paper outlines the formulation of a novel nonlinear MVU filtering scheme and integrates CV measurement results from a laboratory experiment and from a simulated experiment to help validate the approach. CV observations were obtained from a cell phone video. Results show that for both experiments, input estimation and parameter estimation were accurate and converged to the true values. However, input estimation was notably accurate only for the simulated experiment."
  },
  {
    title: "An output-only unbiased minimum variance state estimator for linear systems",
    venue: "Mechanical Systems and Signal Processing, 211:111204",
    date: "Apr 2024",
    doi: "https://doi.org/10.1016/j.ymssp.2024.111204",
    abstract: "This study proposes a novel filtering method for unbiased minimum variance state estimation. A key challenge in the development of digital twinning and system identification of operational civil infrastructure is the difficulties associated with measurement of the often nonstationary, and stochastic unknown input to the system, e.g. traffic, earthquake, and wind loads. Herein a novel algorithm is presented for an unbiased output-only state estimation for linear state space systems with direct feedthrough. In this paper, the problem of state estimation for discrete time systems with unknown input, where no previous assumption is made regarding the probability distribution of the input, is addressed. In this regard, a two-stage output-only filter is proposed. The unbiasedness of the estimation is demonstrated, and the error covariance propagation over time is derived. It is shown that the unknown input of the system can be subsequently reconstructed via the system matrices, the measured responses, and the estimated state vector. A closed-form solution is provided for the parameters associated with pseudo-inverse in gain calculations to ensure the numerical stability of the filter. Three case studies including simulated and laboratory experiments for verification, validation, and cross comparison of the proposed method are presented. The first case study corresponds to a simulated shear building subjected to two different load time histories, a parametric sinusoidal load, and an earthquake ground acceleration. The second case study shows the results for a simulated experiment on a steel railway bridge subjected to a concentrated load. The third case study corresponds to a laboratory shear building subjected to ground motion and observed through accelerometers. The results of the experiments show a good agreement between the “true response” and the filter state estimation. Moreover, the proposed method is compared against a state-of-the-art algorithm."
  },
  {
    title: "Minimum variance unbiased Bayesian smoothing for input and state estimation of systems without direct Feedthrough: Mitigating Ill-Posedness of online load identification",
    venue: "Engineering Structures, 298:117023",
    date: "Jan 2024",
    doi: "https://doi.org/10.1016/j.engstruct.2023.117023",
    abstract: "In this paper, the problem of moving load identification using pure displacement measurements is addressed. It is known that when no assumptions are made on the statistics of the unknown loads and a minimum variance unbiased (MVU) estimation approach is adopted, the existing methods in the literature suffer from a very elevated load estimation uncertainty. This elevated uncertainty is due to ill-posedness of the problem. In this paper a new method is proposed that addresses this issue via an MVU smoothing approach. To alleviate this problem, a MVU smoothing algorithm is proposed in this study, via modification of a MVU smoothing Bayesian estimator proposed by some of the co-authors of this paper hence referred to as MSBE, which leads to substantial decrease in the moving load estimation uncertainties using pure displacement measurements. The efficacy of the MSBE is studied through a simulated experiment corresponding to a numerical model of an operating steel railway bridge with riveted connections and a multi-axle load. The selection of the hyperparameters of the smoothing and filtering techniques are discussed, and the optimal values are presented. The parametric studies show that the proposed method can yield highly accurate results, and substantially outperforms a celebrated MVU filter proposed by Gillijns and De Moor."
  },
  {
    title: "Experimental validation and numerical investigation of virtual strain sensing methods for steel railway bridges",
    venue: "Engineering Structures, 298:117023",
    date: "Jan 2024",
    doi: "https://doi.org/10.1016/j.engstruct.2023.117023",
    abstract: "Railway bridges are subjected to intermittent excitations induced by gravity loads. The monitoring of stress time histories at fatigue prone areas (i.e., “hot spots”) for steel, heavy haul railway bridges is vital for cost-effective maintenance and, most importantly, for maintaining safety. In this regard, strain measurements are crucial for determining fatigue susceptibility and, possibly, damage to steel bridges under daily, cyclical loading conditions. While, in the limit, sensing the response of a steel bridge under operational conditions is the best way to identify hot spots to prevent damage and, possibly, collapse, it is impractical if not impossible to install strain sensors at every susceptible location. To address this issue, the current study focuses on virtual sensing of strain time histories on steel railway bridges using sparse response measurements. An augmented Kalman filter (AKF) method was adopted for input-state estimation. Since AKF estimates unknown load and response using a physical model, it is crucial to assess the effects of modeling uncertainties on estimation results. In addition to AKF, Modal Expansion (ME) was adopted for extrapolation of measured response to unmeasured locations. In contrast to AKF, which requires a full physical model, ME only relies on vibration modes. A novel application of the Singular Value Decomposition (SVD) method that facilitates data-driven strain prediction by relying on data obtained from field measurements or models was also developed and examined. The study was completed using simulated experiments and strains measured from an in-service, through girder, steel railway bridge. The three methods were compared and strengths and limitations of each were highlighted."
  },
];

/* ------------ Professional Experience (title + dropdown details) ------------ */
const experience = [
  {
    title: "Instructor — Structural Design in Steel (CEE 793/893), University of New Hampshire (Spring 2025)",
    details: [
      "Taught undergraduate/graduate-level steel design course to 30+ students using AISC 360-22 and SAP2000.",
      "Supervised student projects related to load path, member design, and stability analysis.",
      "Developed course materials and in-class problem sets to reinforce core concepts in steel design",
      "Engaged in student mentoring and provided individualized academic support during office hours.",
    ],
  },
  {
    title: "Project Engineer — Postec S.p.A. (2014–2021)",
    details: [
      "Engineered prestressed concrete systems for diverse buildings, optimizing structural integrity and cost-efficiency in residential, healthcare, and educational projects.",
      "Spearheaded retrofit initiatives for non-compliant structures, implementing innovative techniques to ensure safety and regulatory adherence.",
      "Developed custom solutions combining design and coding software, streamlining structural analysis processes and enhancing project efficiency.",
      "Coordinated with cross-functional teams to deliver comprehensive structural designs, fostering seamless integration of architectural and engineering elements."
    ],
  },
  {
    title: "Undergraduate Project Advisor — Universidad de los Andes (2016–2021)",
    details: [
      "Guided undergraduate students in final year projects, fostering critical thinking and problem-solving skills. Developed tailored methodologies to address complex subject-specific challenges.",
      "Drove successful completion of undergraduate projects by setting clear objectives, establishing rigorous timelines, and providing targeted support to ensure high-quality outcomes.",
      "Mentored student groups through project development, offering constructive feedback and guidance. Facilitated deep understanding of research methodologies and project management principles."
    ],
  },
];

/* ------------ Projects (dropdowns with summary/tech) ------------ */
const projects = [
  {
    title: "SMART Analytics — Nebraska (2024) — Field & Instrumentation Engineer",
    summary: "Drive-by sensing on a real bridge (Lincoln, NE) with vehicle instrumentation and bridge sensors.",
    tech: "BDI strain, accelerometers, LVDTs; STS Live; Python",
    details: [
      "Instrumented vehicle with tri-axial accelerometer + GPS; synchronized with bridge sensors via STS Live.",
      "Collected 20 controlled passes at ~25–35 mph (200 Hz sampling).",
      "Processed drive-by data and compared MVU estimator results to the numerical twin.",
    ],
    links: [
      { label: "Field notes", href: "#" },
      { label: "Demo video", href: "#" }
    ]
  },
  {
    title: "ERDC Demonstration — New Hampshire (2024) — Field & Instrumentation Engineer",
    summary: "Live data acquisition on Memorial Bridge (Portsmouth, NH) and secure remote transfer.",
    tech: "BDI sensors; STS Live/Core; Raspberry Pi DAQ pipeline",
    details: [
      "Deployed bridge deck instrumentation and validated signal quality on-site.",
      "Built Raspberry Pi pipeline for buffering + secure upstream transfer.",
    ]
  },
  {
    title: "Long-Term Shear Building Digital Twin (2024) — Lead Engineer",
    summary: "6-story scale shear building with recursive estimation from continuous sensors.",
    tech: "MATLAB, Python, PCB accelerometers, inertial shaker, LabVIEW",
    details: [
      "Designed sensor layout and established continuous acquisition (synchronization + drift checks).",
      "Implemented estimator tuning and convergence monitoring; benchmarked against baseline models."
    ]
  }
];


/* ------------ Other Activities (gallery) ------------ */
const galleryImages = [
  // Replace with your own image URLs (can be external links or /public paths)
  { src: "https://images.unsplash.com/photo-1482594254723-cc424817c99a?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", alt: "Skiing", cap: "Skiing" },
  { src: "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", alt: "Hiking", cap: "Hiking" },
  { src: "https://images.unsplash.com/photo-1450500392544-c2cb0fd6e3b8?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", alt: "Kayaking", cap: "Kayaking" },
  { src: "https://plus.unsplash.com/premium_photo-1663046050988-1b873a56dced?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", alt: "Music", cap: "Music" },
];

/* ------------ Small reusable Accordion item ------------ */
function AccordionItem({ title, subtitle, children, isOpen, onToggle }) {
  return (
    <article className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 backdrop-blur">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        aria-expanded={isOpen}
      >
        <div>
          <div className="font-medium">{title}</div>
          {subtitle && <div className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</div>}
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
      {isOpen && <div className="px-5 pb-5 pt-0">{children}</div>}
    </article>
  );
}

/* Embed youtube video small code */
function toEmbedUrl(url) {
  try {
    const u = new URL(url);
    // YouTube
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    // Vimeo
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {}
  return null;
}


export default function App() {
  const [dark, setDark] = useState(true);
  const [openPub, setOpenPub] = useState(null);
  const [openExp, setOpenExp] = useState(null);
  const [openProj, setOpenProj] = useState(null);

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 selection:bg-indigo-300/60 dark:selection:bg-indigo-500/40">
        {/* Navbar */}
        <header className="sticky top-0 z-50 backdrop-blur bg-white/70 dark:bg-slate-950/60 border-b border-slate-200/60 dark:border-slate-800">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <a href="#top" className="font-semibold tracking-tight">{PROFILE.name.split(" ")[0]}</a>
            <nav className="hidden md:flex gap-6 text-sm">
              {[
                ["About", "#about"],
                ["Education", "#education"],
                ["Skills", "#skills"],
                ["Publications", "#publications"],
                ["Experience", "#experience"],
                ["Projects", "#projects"],
                ["Activities", "#activities"],
                ["Contact", "#contact"],
              ].map(([label, href]) => (
                <a key={label} className="hover:opacity-80" href={href}>{label}</a>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <button
                aria-label="Toggle theme"
                onClick={() => setDark(v => !v)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              {PROFILE.cvUrl !== "#" && (
                <a
                  className="hidden sm:inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  href={PROFILE.cvUrl}
                  target="_blank" rel="noreferrer"
                >
                  CV
                </a>
              )}
            </div>
          </div>
        </header>

        {/* Hero */}
        <section id="top" className="relative overflow-hidden">
          {/* gradient orbs */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl dark:bg-indigo-600/20" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-pink-300/30 blur-3xl dark:bg-pink-600/20" />
          </div>

          <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 grid md:grid-cols-5 gap-10 items-center">
            <div className="md:col-span-3">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">{PROFILE.name}</h1>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">{PROFILE.tagline}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {areas.map(a => (
                  <span key={a} className="text-[0.8rem] px-3 py-1 rounded-full border border-slate-300/70 dark:border-slate-700/80 bg-white/60 dark:bg-slate-900/40 backdrop-blur">
                    {a}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <a className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                   href={PROFILE.linkedin} target="_blank" rel="noreferrer">
                  <Linkedin className="h-4 w-4" /> LinkedIn
                </a>
                <a className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                   href={PROFILE.github} target="_blank" rel="noreferrer">
                  <Github className="h-4 w-4" /> GitHub
                </a>
              </div>
            </div>

            {/* Contact card */}
            <div className="md:col-span-2">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 backdrop-blur p-5 shadow-sm">
                <h3 className="font-semibold text-lg">Contact</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {PROFILE.location}</p>
                  <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {PROFILE.phone}</p>
                  <p className="flex items-center gap-2"><Mail className="h-4 w-4" />
                    <a className="underline" href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
                  </p>
                  <p className="flex items-center gap-2"><Mail className="h-4 w-4" />
                    <a className="underline" href={`mailto:${PROFILE.emailAlt}`}>{PROFILE.emailAlt}</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="border-t border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <p className="max-w-3xl text-slate-600 dark:text-slate-300">
              I build estimation algorithms that fuse data with physics-based models to maintain live Digital Twins of civil structures.
              Interests include input rejection, convergence guarantees, and uncertainty-aware decision support for asset management.
            </p>
          </div>
        </section>

        {/* Education */}
        <section id="education" className="border-t border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Education</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {education.map(e => (
                <li key={e.degree} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white/60 dark:bg-slate-900/40">
                  <div>
                    <div className="font-medium">{e.degree}</div>
                    <div className="text-slate-600 dark:text-slate-400">{e.place}</div>
                  </div>
                  <div className="mt-1 sm:mt-0 text-slate-600 dark:text-slate-400">{e.years}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Skills */}
        <section id="skills" className="border-t border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Skills</h2>
            <div className="mt-6 grid md:grid-cols-3 gap-6">
              {[
                ["General", skills.general],
                ["Software", skills.software],
                ["Programming", skills.programming],
              ].map(([label, list]) => (
                <div key={label} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white/60 dark:bg-slate-900/40">
                  <div className="font-medium mb-3">{label}</div>
                  <div className="flex flex-wrap gap-2">
                    {list.map(s => (
                      <span key={s} className="text-xs px-3 py-1 rounded-full border border-slate-300/70 dark:border-slate-700/80">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Publications (Accordion w/ abstract placeholder) */}
        <section id="publications" className="border-t border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">Publications</h2>
            <div className="space-y-3">
              {publications.map((p, idx) => (
                <AccordionItem
                  key={p.title}
                  title={p.title}
                  subtitle={`${p.venue} • ${p.date}`}
                  isOpen={openPub === idx}
                  onToggle={() => setOpenPub(openPub === idx ? null : idx)}
                >
        <div className="space-y-3">
        {/* Author (optional line) */}
        {p.author && (
        <div className="text-sm text-slate-600 dark:text-slate-400">
        <span className="opacity-70">Author:</span> {p.author}
        </div>
        )}

  {/* Abstract */}
  <p className="text-sm text-slate-700 dark:text-slate-300">
    {p.abstract}
  </p>

  {/* DOI link if provided */}
  {p.doi && p.doi !== "TBD" && (
    <a
      className="inline-flex items-center gap-1 text-sm underline underline-offset-2"
      href={p.doi}
      target="_blank"
      rel="noreferrer"
    >
      <ExternalLink className="h-4 w-4" />
      DOI
    </a>
  )}

  {/* Links (video/code/preprint…) */}
  {Array.isArray(p.links) && p.links.length > 0 && (
    <div className="flex flex-wrap gap-2">
      {p.links.map((l, i) => (
        <a
          key={i}
          href={l.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {l.label.toLowerCase().includes("video") ? (
            <PlayCircle className="h-4 w-4" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
          {l.label}
        </a>
      ))}
    </div>
  )}

  {/* Auto-embed if the first link is a YT/Vimeo video */}
  {p.links?.[0]?.href && toEmbedUrl(p.links[0].href) && (
    <div className="mt-3 aspect-video overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
      <iframe
        src="https://www.youtube.com/embed/YytcXsam8Yw?si=OLkPCZOGcHPOalui"
        title="YouTube video player"
        className="w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  )}
</div>

                </AccordionItem>
              ))}
            </div>
          </div>
        </section>

        {/* Professional Experience (title + dropdown details) */}
        <section id="experience" className="border-t border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">Professional Experience</h2>
            <div className="space-y-3">
              {experience.map((x, idx) => (
                <AccordionItem
                  key={x.title}
                  title={x.title}
                  isOpen={openExp === idx}
                  onToggle={() => setOpenExp(openExp === idx ? null : idx)}
                >
                  <ul className="text-sm list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                    {x.details.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                </AccordionItem>
              ))}
            </div>
          </div>
        </section>

        {/* Projects (dropdowns) */}
        <section id="projects" className="border-t border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">Field & Laboratory Projects</h2>
            <div className="space-y-3">
              {projects.map((pr, idx) => (
                <AccordionItem
                  key={pr.title}
                  title={pr.title}
                  isOpen={openProj === idx}
                  onToggle={() => setOpenProj(openProj === idx ? null : idx)}
                >
<p className="text-sm text-slate-700 dark:text-slate-300">{pr.summary}</p>

{Array.isArray(pr.details) && pr.details.length > 0 && (
  <ul className="mt-3 text-sm list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
    {pr.details.map((d, i) => (
      <li key={i}>{d}</li>
    ))}
  </ul>
)}

{!!pr.tech && (
  <div className="mt-3 flex flex-wrap gap-2 text-xs opacity-90">
    {Array.isArray(pr.tech)
      ? pr.tech.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 rounded-full border border-slate-300/70 dark:border-slate-700/80"
          >
            {tag}
          </span>
        ))
      : (
          <span className="px-2 py-1 rounded-full border border-slate-300/70 dark:border-slate-700/80">
            {pr.tech}
          </span>
        )
    }
  </div>
)}

{Array.isArray(pr.links) && pr.links.length > 0 && (
  <div className="mt-3 flex flex-wrap gap-2">
    {pr.links.map((l, i) => (
      <a
        key={i}
        href={l.href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <ExternalLink className="h-3 w-3" />
        {l.label}
      </a>
    ))}
  </div>
)}

                </AccordionItem>
              ))}
            </div>
          </div>
        </section>

        {/* Other Activities (gallery) */}
        <section id="activities" className="border-t border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">Other Activities</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Some of my Summer and Winter hobbies
              </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {galleryImages.map((img, i) => (
                <figure key={i} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                  {img.src ? (
                    <img src={img.src} alt={img.alt} className="w-full h-56 object-cover" />
                  ) : (
                    <div className="w-full h-56 flex items-center justify-center">
                      <ImageIcon className="h-10 w-10 opacity-50" />
                    </div>
                  )}
                  <figcaption className="p-3 text-sm text-slate-700 dark:text-slate-300">{img.cap}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Contact / Footer */}
        <section id="contact" className="border-t border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Get in touch</h2>
            <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-300">
              I’m open to collaborations, research discussions, and industry roles in structural mechanics, SHM, and digital twins.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                 href={`mailto:${PROFILE.email}`}>
                <Mail className="h-4 w-4" /> {PROFILE.email}
              </a>
              <a className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                 href={PROFILE.linkedin} target="_blank" rel="noreferrer">
                <Linkedin className="h-4 w-4" /> LinkedIn
              </a>
              <a className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                 href={PROFILE.github} target="_blank" rel="noreferrer">
                <Github className="h-4 w-4" /> GitHub
              </a>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm flex flex-col md:flex-row items-center justify-between gap-2 text-slate-600 dark:text-slate-400">
            <div>© {new Date().getFullYear()} {PROFILE.name} · All rights reserved.</div>
            <a href="#top" className="underline-offset-2 hover:underline">Back to top</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
