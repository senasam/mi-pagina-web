import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

const endorsementsData = [
  {
    quote: "Visión estratégica y creatividad que generaron aprendizajes de gran valor.",
    author: "Yelca Mondragon Pomares",
    context: "GrupoFi",
  },
  {
    quote: "Mirada clara, estratégica y siempre muy útil.",
    author: "José María de Val Ortiz",
    context: "Cliente",
  },
  {
    quote: "Ideas en experimentos tácticos y resultados medibles.",
    author: "Marcos Sanchez Paez",
    context: "Kaufmann",
  },
  {
    quote: "Me ayudó a ordenar y proyectar mis finanzas.",
    author: "Francisca Espina Donoso",
    context: "Cliente",
  },
  {
    quote: "Gran habilidad para desarrollar estrategias innovadoras de marketing.",
    author: "María José Rodríguez",
    context: "Kaufmann / Klicker",
  },
  {
    quote: "Siempre alineado a los objetivos y aportando valor.",
    author: "Sebastián Saavedra Villarroel",
    context: "Kaufmann",
  },
  {
    quote: "Tremendo profesional y calidad humana.",
    author: "Salvador Achondo",
    context: "Getback",
  },
  {
    quote: "Comprometido, proactivo y muy dinámico.",
    author: "Martin Pico-Estrada",
    context: "Tutor académico",
  },
  {
    quote: "Sus clases ayudaban a entender y aplicar los contenidos.",
    author: "Ignacio Javier Martínez Riquelme",
    context: "Alumno",
  },
  {
    quote: "Creativo, curioso y capaz de ejecutar muy buenas estrategias.",
    author: "Catalina Venegas Celedón",
    context: "Getback",
  },
  {
    quote: "Creativo, analítico y muy bueno para resolver problemas.",
    author: "Agustin Ortiz Monasterio Rivero",
    context: "Getback",
  },
  {
    quote: "Siempre atento a resolver dudas y ayudar.",
    author: "Nicolas Cepeda",
    context: "Alumno",
  },
  {
    quote: "Resultados sobresalientes y calidad profesional.",
    author: "Alex Rossi Guzmán",
    context: "Muruna",
  },
  {
    quote: "Entiende rápido las necesidades y los objetivos del negocio.",
    author: "Ian Antonio Reglá Ortiz",
    context: "QuePlan",
  },
  {
    quote: "Excelente profesional, hábil y creativo.",
    author: "Daniela Guzmán",
    context: "QuePlan",
  },
  {
    quote: "Trabajo eficiente, rápido y con gran capacidad de aprendizaje.",
    author: "Ernesto Riquelme Gubelin",
    context: "Skimend & Tecnoderm",
  },
];

export default function EndorsementCarousel({ autoplay = true, interval = 5000 }) {
  const [items, setItems] = useState([]);
  const [start, setStart] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const arr = endorsementsData.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setItems(arr);
  }, []);

  useEffect(() => {
    if (!autoplay || paused || items.length === 0) return;
    const id = setInterval(() => {
      setStart((s) => (s + 3) % items.length);
    }, interval);
    return () => clearInterval(id);
  }, [autoplay, paused, items, interval]);

  const next = () => {
    if (items.length === 0) return;
    setStart((s) => (s + 3) % items.length);
  };

  const prev = () => {
    if (items.length === 0) return;
    setStart((s) => (s - 3 + items.length) % items.length);
  };

  if (!items || items.length === 0) return null;

  const visible = [];
  for (let i = 0; i < 3; i++) {
    visible.push(items[(start + i) % items.length]);
  }

  return (
    <div
      className="endorsement-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="endorsement-carousel__controls">
        <button
          type="button"
          className="carousel-button carousel-button--prev"
          onClick={prev}
          aria-label="Anterior"
        >
          <ArrowLeft size={16} />
        </button>
        <button
          type="button"
          className="carousel-button carousel-button--next"
          onClick={next}
          aria-label="Siguiente"
        >
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="endorsement-grid">
        {visible.map((item) => (
          <figure key={item.author}>
            <blockquote>"{item.quote}"</blockquote>
            <figcaption>
              <strong>{item.author}</strong>
              <span>{item.context}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}