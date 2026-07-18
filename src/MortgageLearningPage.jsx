import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, Clipboard } from "lucide-react";
import {
  Breadcrumbs,
  ContextualServiceCta,
  PageShell,
} from "./LearningComponents";
import { breadcrumbSchema, usePageMetadata } from "./seo";
import { trackEvent } from "./analytics";
import {
  BROKERAGE_MODES,
  BROKERAGE_TAX,
  calculateBrokerageCommission,
} from "./brokerageEngine";
import {
  brokerageEditorialBands,
  brokerageQuestions,
} from "./brokerageContent";
import { formatPercent, formatUf } from "./mortgageEngine";

const REVIEW_DATE = "2026-07-18";
const sections = [
  [
    "Qué determina el pago mensual",
    "El capital, la tasa, el plazo y la convención de tasa determinan el pago de capital e interés. Seguros y otros cobros se agregan por separado. Comparar solo el primer dividendo puede ocultar diferencias importantes en interés total y efectivo inicial.",
  ],
  [
    "Precio, tasación y base financiable",
    "El precio es lo acordado en la compraventa; la tasación es una estimación técnica usada por la institución. Para planificar con prudencia, la calculadora aplica el porcentaje de financiamiento al menor de ambos. Si la tasación queda bajo el precio, el pie requerido aumenta.",
  ],
  [
    "Financiamiento, pie y riesgo",
    "Un mayor porcentaje financiado reduce el pie inicial, pero aumenta el capital y normalmente los intereses acumulados. Un pie mayor produce el efecto inverso. La institución puede aplicar criterios propios, por lo que el porcentaje ingresado es un supuesto.",
  ],
  [
    "Tasa y costo durante el plazo",
    "Una tasa menor no es el único criterio: también importan plazo, seguros, gastos y condiciones. Una tasa anual efectiva y una nominal anual no son intercambiables; primero deben convertirse con la convención correcta.",
  ],
  [
    "Cómo funciona la amortización",
    "En una cuota nivelada, el interés de cada mes se calcula sobre el saldo inicial. Al comienzo suele representar una proporción mayor; al caer el saldo, más pago se destina a capital. Un plazo largo suele bajar la cuota, pero puede aumentar el interés total.",
  ],
  [
    "Seguros y gastos iniciales",
    "El desgravamen se relaciona habitualmente con el saldo insoluto. Los seguros del inmueble tienen bases y coberturas que deben confirmarse. Tasación, estudio de títulos, notaría, inscripción, impuestos y corretaje pueden variar según la operación; por eso la herramienta no fija valores universales.",
  ],
  [
    "Carga del hogar",
    "La carga hipotecaria compara el pago mensual con el ingreso. La carga total agrega obligaciones existentes. Un umbral sirve para probar margen y sensibilidad, pero no representa por sí solo una política de aprobación ni reemplaza un presupuesto completo.",
  ],
  [
    "La incertidumbre de la UF en pesos",
    "El saldo y los pagos pueden estar expresados en UF. Su equivalencia en pesos cambia con el valor de la UF. Convertir con la UF de hoy ayuda a dimensionar un escenario, pero no fija el monto futuro en CLP.",
  ],
  [
    "Comparar plazos y escenarios",
    "Conserva una base común y cambia una variable por vez: tasa, plazo, financiamiento o seguros. Revisa pago mensual, pie, efectivo inicial, interés total, tiempo para reducir la deuda a la mitad y desembolso total.",
  ],
  [
    "Preguntas para una institución",
    "Pide la convención de tasa, vigencia de la oferta, valor financiable, seguros y coberturas, gastos incluidos, condiciones de prepago, consecuencias del atraso y forma de convertir la UF. Solicita que cada monto quede identificado y documentado.",
  ],
  [
    "Qué no modela la calculadora",
    "No proyecta la UF ni verifica documentos. Evalúa el beneficio DFL2 del impuesto al mutuo solo con las condiciones declaradas por la persona; no incorpora automáticamente otros subsidios o beneficios tributarios y no reemplaza una cotización. Tampoco modela gracia, tasa variable, mora, prepago u otras particularidades legales y tributarias.",
  ],
];

const cases = [
  [
    "Un ingreso y margen acotado",
    "Un hogar con una sola fuente de ingreso compara la carga total con un margen mensual para imprevistos, en vez de usar todo el presupuesto disponible.",
  ],
  [
    "Dos ingresos con distinta estabilidad",
    "Una pareja prueba el escenario con ambos ingresos y luego con uno reducido, para observar sensibilidad sin suponer que la situación será permanente.",
  ],
  [
    "Tasación bajo el precio",
    "Una vivienda se acuerda por 4.200 UF y se tasa en 3.900 UF. El porcentaje se aplica a 3.900 UF y la diferencia eleva el pie.",
  ],
  [
    "Tasación sobre el precio",
    "Una tasación superior no eleva automáticamente el capital en la herramienta: la base sigue limitada por el precio comercial.",
  ],
  [
    "Pie más alto",
    "Un hogar compara 80% y 70% de financiamiento. El segundo caso necesita más efectivo inicial, pero reduce capital, cuota e interés total.",
  ],
  [
    "Plazo más corto",
    "El mismo capital a 15 años aumenta el pago mensual frente a 25 años, pero reduce la duración y normalmente el interés acumulado.",
  ],
  [
    "Plazo más largo",
    "Un plazo de 30 años libera presupuesto mensual, aunque mantiene la deuda por más tiempo y puede elevar el desembolso total.",
  ],
  [
    "Tasa más alta",
    "Una persona duplica su escenario y aumenta la tasa sin cambiar nada más. Así observa el efecto aislado sobre cuota, carga e intereses.",
  ],
  [
    "Obligaciones de consumo",
    "Un hogar incluye cuotas mensuales existentes. Aunque la hipoteca no cambia, la carga total y el ingreso orientativo sí lo hacen.",
  ],
  [
    "Operación con corretaje",
    "La comisión se agrega como supuesto editable al efectivo inicial; no se incorpora silenciosamente al capital.",
  ],
  [
    "Compra sin corretaje",
    "La persona desactiva esa categoría y conserva los demás gastos confirmados, evitando sumar un costo que no corresponde.",
  ],
  [
    "UF en dos fechas",
    "Dos copias del mismo escenario usan valores manuales de UF de fechas distintas. Los resultados en UF coinciden, pero la equivalencia en CLP cambia.",
  ],
];

const brokerageLearning = [
  [
    "Qué remunera una comisión",
    "El corretaje remunera las tareas pactadas para acercar a las partes y apoyar la operación. El alcance puede ser muy distinto entre propuestas: publicar, buscar, coordinar visitas, reunir antecedentes, negociar o acompañar hitos. La descripción escrita importa tanto como el porcentaje.",
  ],
  [
    "Quién encargó el servicio",
    "Identifica quién solicitó originalmente la intervención y si existe un encargo separado para el comprador. Que una persona muestre una propiedad no demuestra por sí solo que represente tus intereses.",
  ],
  [
    "Quién debe pagar",
    "La obligación de pagar depende del acuerdo aplicable. No toda compra usa corredor, no todo comprador paga y la comisión del vendedor es distinta de la comisión del comprador.",
  ],
  [
    "Acuerdo comercial y no tarifa legal",
    "Las tasas de comisión se acuerdan libremente entre el corredor y quien solicita sus servicios. Una referencia frecuente en propuestas no se transforma por eso en porcentaje obligatorio.",
  ],
  [
    "Neto y total no son equivalentes",
    "Una cifra neta requiere determinar si se agregará IVA. Una cifra final ya contiene todos los componentes declarados. Compararlas sin normalizar puede ocultar una diferencia relevante.",
  ],
  [
    "Cómo cambia el total con IVA",
    "La tasa general usada en los ejemplos es 19%. Sin embargo, el SII distingue según la situación del prestador: ciertas personas naturales cuyo ingreso proviene solo de su trabajo personal pueden estar exentas, mientras otras estructuras o actividades pueden estar afectas. Confirma el documento tributario.",
  ],
  [
    "Porcentaje o monto fijo",
    "El porcentaje escala con el precio; el monto fijo no. También pueden acordarse mínimos, topes o tramos. La calculadora muestra la fórmula seleccionada sin decidir cuál conviene.",
  ],
  [
    "Sensibilidad en propiedades de mayor valor",
    "Sobre 12.000 UF, un 2% neto equivale a 240 UF; con IVA de 19%, el impuesto sería 45,6 UF y el total 285,6 UF. Comparar un porcentaje con un monto fijo o tope es una estrategia de negociación, no una regla de mercado.",
  ],
  [
    "Servicios comprometidos",
    "Distingue tareas documentadas, tareas ausentes y asuntos por confirmar. Marcar una tarea en la calculadora sirve para ordenar la propuesta; no acredita que haya sido efectivamente prestada.",
  ],
  [
    "Representación y transparencia",
    "Cuando un intermediario recibe pagos de ambas partes, conviene aclarar qué servicio presta a cada una, qué información maneja y cómo trata intereses distintos. El doble pago no demuestra por sí solo una irregularidad, pero justifica pedir claridad.",
  ],
  [
    "Hito y condición de pago",
    "El momento en que la comisión se devenga y paga debe revisarse en el acuerdo. Antes de reserva, oferta o promesa, pregunta qué ocurre si no se concreta la compra, se rechaza el financiamiento o aparecen problemas de títulos.",
  ],
  [
    "Preguntas antes de ofertar",
    "Solicita costo total, base, IVA, documento tributario, servicios, exclusiones, representación, exclusividad, mínimo, tope y consecuencias si la operación no cierra.",
  ],
  [
    "Comparar sin ganador automático",
    "Normaliza cada propuesta a costo final en UF y CLP, pero conserva a la vista servicios, representación y momento de pago. Menor costo no equivale automáticamente a mejor servicio.",
  ],
  [
    "Documentar lo acordado",
    "Deja por escrito porcentaje o monto, base, impuestos, tareas, condiciones, hito, exclusividad y tratamiento de una operación frustrada. Esta guía ayuda a preparar preguntas, no redacta un contrato.",
  ],
  [
    "Efecto sobre el efectivo inicial",
    "Si el comprador debe pagar y la comisión no está financiada ni pagada, se agrega al pie y demás gastos iniciales. La comisión del vendedor nunca se suma al presupuesto del comprador.",
  ],
  [
    "Errores de cálculo frecuentes",
    "Evita tratar 2% + IVA como 2% final, agregar IVA dos veces, mezclar tasas antes de IVA y tasas con IVA incluido, usar una base equivocada, ignorar topes o mínimos y sumar el pago del vendedor al comprador.",
  ],
  [
    "Llevar el análisis a la calculadora",
    "Modela solo una cifra que puedas identificar como supuesto. Si el IVA aún no está claro, revisa el rango y no lo incorpores como total cierto.",
  ],
];

const guideExamples = [
  ["1% + IVA", 0.01, BROKERAGE_TAX.ADDED],
  ["1,5% sin IVA", 0.015, BROKERAGE_TAX.NOT_SUBJECT],
  ["1,5% + IVA", 0.015, BROKERAGE_TAX.ADDED],
  ["2% sin IVA", 0.02, BROKERAGE_TAX.NOT_SUBJECT],
  ["2% + IVA", 0.02, BROKERAGE_TAX.ADDED],
].map(([label, rate, taxTreatment]) => ({
  label,
  rate,
  taxTreatment,
  result: calculateBrokerageCommission({
    enabled: true,
    propertyPriceUf: 5000,
    agreedPriceUf: 5000,
    ufValueClp: 1,
    base: "commercial-price",
    mode: BROKERAGE_MODES.PERCENTAGE,
    rate,
    taxTreatment,
    ivaRate: 0.19,
  }),
}));
const guideBaseline = guideExamples[1].result.finalUf;

function BrokerageGuideSection() {
  const [copyStatus, setCopyStatus] = useState("");
  const copyQuestions = async () => {
    try {
      await navigator.clipboard.writeText(
        brokerageQuestions.map((question) => `• ${question}`).join("\n"),
      );
      setCopyStatus("Preguntas copiadas.");
      trackEvent("brokerage_checklist_copied", { section: "guide" });
    } catch {
      setCopyStatus("No fue posible copiar automáticamente.");
    }
  };
  return (
    <section
      className="content-section brokerage-guide"
      aria-labelledby="brokerage-guide-title"
    >
      <div className="section-title">
        <p className="eyebrow">Costo de la compraventa</p>
        <h2 id="brokerage-guide-title">
          Cómo evaluar una comisión de corretaje
        </h2>
        <p>
          Separa acuerdo, impuestos, servicios y presupuesto antes de comparar
          porcentajes.
        </p>
      </div>
      <aside className="lesson-callout">
        <strong>Referencia comercial, no tarifa legal.</strong> En compraventas
        de propiedades usadas es posible encontrar propuestas cercanas al 2% más
        IVA para cada parte, pero la comisión se acuerda libremente. Confirma
        por escrito costo, impuestos, tareas y condiciones de pago.
      </aside>
      <div className="brokerage-learning-grid">
        {brokerageLearning.map(([title, body], index) => (
          <article key={title}>
            <span>{index + 1}</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
      <section
        className="brokerage-example"
        aria-labelledby="brokerage-example-title"
      >
        <h3 id="brokerage-example-title">Ejemplo matemático comparable</h3>
        <p>
          Propiedad hipotética de 5.000 UF e IVA de 19%. Estas cifras prueban
          cálculos; no son tarifas obligatorias ni recomendaciones individuales.
        </p>
        <div className="table-scroll">
          <table>
            <caption>Propuestas normalizadas a costo final</caption>
            <thead>
              <tr>
                <th>Propuesta</th>
                <th>Porcentaje cotizado</th>
                <th>Tratamiento</th>
                <th>Tasa final</th>
                <th>Costo</th>
                <th>Diferencia desde 1,5% sin IVA</th>
              </tr>
            </thead>
            <tbody>
              {guideExamples.map((item) => (
                <tr key={item.label}>
                  <th>{item.label}</th>
                  <td>{formatPercent(item.rate, 2)}</td>
                  <td>
                    {item.taxTreatment === BROKERAGE_TAX.ADDED
                      ? "+ IVA"
                      : "Sin IVA en el escenario"}
                  </td>
                  <td>{formatPercent(item.result.effectiveFinalRate, 3)}</td>
                  <td>{formatUf(item.result.finalUf)}</td>
                  <td>{formatUf(item.result.finalUf - guideBaseline)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="brokerage-example-cards">
          {guideExamples.map((item) => (
            <article key={item.label}>
              <h4>{item.label}</h4>
              <dl>
                <div>
                  <dt>Costo final</dt>
                  <dd>{formatUf(item.result.finalUf)}</dd>
                </div>
                <div>
                  <dt>Tasa final</dt>
                  <dd>{formatPercent(item.result.effectiveFinalRate, 3)}</dd>
                </div>
                <div>
                  <dt>Diferencia</dt>
                  <dd>{formatUf(item.result.finalUf - guideBaseline)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
        <p>
          En particular, 2% + IVA equivale a 2,38% final y 119 UF; frente a 75
          UF, la diferencia es 44 UF, aproximadamente 58,67%.
        </p>
      </section>
      <section>
        <h3>Escenarios orientativos para comparar</h3>
        <p>
          Estas bandas editoriales son supuestos modificables. No constituyen
          tarifa oficial, máximo legal ni evaluación automática de conveniencia.
        </p>
        <div className="editorial-band-grid">
          {brokerageEditorialBands.map((band) => (
            <article key={band.label}>
              <strong>{band.label}</strong>
              <p>{band.note}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="brokerage-questions">
        <h3>Preguntas para llevar a la conversación</h3>
        <ul>
          {brokerageQuestions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ul>
        <button
          className="button button--secondary"
          type="button"
          onClick={copyQuestions}
        >
          <Clipboard size={16} /> Copiar lista
        </button>
        <span role="status" aria-live="polite">
          {copyStatus}
        </span>
        <p>
          Preguntas de preparación; no reemplazan revisión contractual o legal.
        </p>
      </section>
      <section>
        <h3>Errores que alteran el resultado</h3>
        <ul className="mistake-grid">
          <li>Confundir 2% + IVA con 2% final, IVA incluido.</li>
          <li>Volver a agregar IVA a una cifra que ya lo incluye.</li>
          <li>Comparar un porcentaje neto con otro final.</li>
          <li>
            Usar tasación, precio publicado o crédito cuando el acuerdo usa otra
            base.
          </li>
          <li>Omitir mínimos, topes o la interpretación de tramos.</li>
          <li>Sumar la comisión del vendedor al efectivo del comprador.</li>
          <li>
            Suponer que todos los prestadores tienen idéntico tratamiento
            tributario.
          </li>
          <li>Asumir que el crédito hipotecario cubre el corretaje.</li>
          <li>Acordar solo verbalmente o no confirmar cuándo se paga.</li>
          <li>
            Mirar únicamente el porcentaje e ignorar tareas y representación.
          </li>
          <li>
            Tratar una costumbre comercial como si fuera una tarifa legal.
          </li>
        </ul>
      </section>
      <aside className="source-review">
        <strong>Revisión factual:</strong> 18 de julio de 2026. Categorías
        consultadas: normativa vigente en Ley Chile, información tributaria del
        SII y deberes de información publicados por SERNAC. La tasa general de
        IVA y el tratamiento del corretaje deben revisarse nuevamente si cambia
        la normativa o la situación del prestador.
      </aside>
      <a
        className="button button--primary"
        href="/herramientas/calculadora-hipotecaria#corretaje"
      >
        Calcular y comparar corretaje <ArrowRight size={16} />
      </a>
    </section>
  );
}

export default function MortgageLearningPage() {
  const breadcrumbs = [
    { label: "Inicio", href: "/" },
    { label: "Aprende", href: "/aprende" },
    { label: "Finanzas personales", href: "/aprende" },
    {
      label: "Evaluar un crédito hipotecario",
      href: "/aprende/finanzas-personales/como-evaluar-un-credito-hipotecario",
    },
  ];
  const schema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@graph": [
        breadcrumbSchema(breadcrumbs),
        {
          "@type": "LearningResource",
          name: "Cómo evaluar una operación hipotecaria más allá del dividendo",
          description:
            "Guía educativa para comprender pie, tasa, seguros, corretaje, amortización, carga del hogar y UF en una operación hipotecaria chilena.",
          url: "https://masanes.cl/aprende/finanzas-personales/como-evaluar-un-credito-hipotecario",
          learningResourceType: "Guía práctica",
          educationalLevel: "Introductorio",
          inLanguage: "es-CL",
          datePublished: REVIEW_DATE,
          dateModified: REVIEW_DATE,
        },
      ],
    }),
    [],
  );
  usePageMetadata({
    title: "Cómo evaluar una operación hipotecaria y su corretaje",
    description:
      "Comprende pie, tasación, tasa, amortización, seguros, corretaje, IVA, carga del hogar y UF antes de comparar una compra en Chile.",
    path: "/aprende/finanzas-personales/como-evaluar-un-credito-hipotecario",
    schema,
  });
  useEffect(
    () => trackEvent("mortgage_learning_opened", { category: "mortgage" }),
    [],
  );
  return (
    <PageShell>
      <main id="main-content" className="content-page mortgage-learning">
        <Breadcrumbs items={breadcrumbs} />
        <header className="page-hero">
          <div>
            <p className="eyebrow">Finanzas personales</p>
            <h1>
              Cómo evaluar una operación hipotecaria más allá del dividendo
            </h1>
            <p className="page-hero__lead">
              Una guía para separar capital, intereses, seguros, gastos, carga
              del hogar y riesgo de conversión de la UF.
            </p>
            <a
              className="button button--primary"
              href="/herramientas/calculadora-hipotecaria"
            >
              Abrir calculadora <ArrowRight size={17} />
            </a>
          </div>
          <aside className="summary-panel">
            <BookOpen size={24} />
            <dl>
              <div>
                <dt>Nivel</dt>
                <dd>Introductorio</dd>
              </div>
              <div>
                <dt>Formato</dt>
                <dd>Guía práctica</dd>
              </div>
              <div>
                <dt>Última revisión</dt>
                <dd>
                  <time dateTime={REVIEW_DATE}>18 de julio de 2026</time>
                </dd>
              </div>
            </dl>
          </aside>
        </header>
        <p className="disclosure">
          <strong>Alcance educativo.</strong> Esta guía no es una recomendación
          de endeudamiento, evaluación de riesgo, cotización ni asesoría
          financiera, tributaria o legal. Las condiciones dependen de la
          operación y deben confirmarse.
        </p>
        <section className="content-section" aria-labelledby="guide-title">
          <div className="section-title">
            <p className="eyebrow">Once decisiones</p>
            <h2 id="guide-title">Una lectura ordenada de la operación</h2>
          </div>
          <div className="mortgage-learning-grid">
            {sections.map(([title, body], index) => (
              <article key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>
        <BrokerageGuideSection />
        <section
          className="content-section content-section--soft"
          aria-labelledby="cases-title"
        >
          <div className="section-title">
            <p className="eyebrow">Biblioteca de casos</p>
            <h2 id="cases-title">Doce situaciones para comparar supuestos</h2>
            <p>
              Los números o personas no representan clientes, proyectos ni
              ofertas reales.
            </p>
          </div>
          <div className="case-grid">
            {cases.map(([title, body]) => (
              <article key={title}>
                <p className="case-label">
                  Caso ficticio creado con fines educativos.
                </p>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>
        <section
          className="integrative-case"
          aria-labelledby="integrative-title"
        >
          <p className="case-label">
            Caso ficticio creado con fines educativos.
          </p>
          <h2 id="integrative-title">
            Caso integrador: comparar antes de decidir
          </h2>
          <p>
            Un hogar observa una propiedad de 4.500 UF. La tasación referencial
            es 4.200 UF, dispone de 1.100 UF para pie y gastos, y estudia 80% de
            financiamiento a 20 o 30 años. Tiene ingresos mensuales de
            $3.400.000, obligaciones existentes de $180.000 y aún no confirma
            seguros ni gastos.
          </p>
          <h3>Tarea</h3>
          <ol>
            <li>
              Identifica qué datos son supuestos y cuáles requieren
              confirmación.
            </li>
            <li>Determina base financiable, capital y pie mínimo.</li>
            <li>Compara ambos plazos manteniendo la misma tasa.</li>
            <li>
              Interpreta carga total, curva de amortización y equivalencia en
              pesos.
            </li>
            <li>
              Prepara preguntas sobre tasación, seguros, gastos y prepago.
            </li>
          </ol>
          <details>
            <summary>Ver solución razonada y notas de facilitación</summary>
            <div>
              <p>
                <CheckCircle2 size={18} /> La base es 4.200 UF. Con 80%, el
                capital orientativo es 3.360 UF y el pie mínimo frente al precio
                es 1.140 UF, antes de gastos. Por ello, los 1.100 UF disponibles
                no cubren todavía pie mínimo más gastos.
              </p>
              <p>
                El plazo de 30 años debería producir una cuota base menor, pero
                normalmente más interés total y una reducción más lenta del
                capital. El de 20 años exige más presupuesto mensual. La
                comparación solo es válida si tasa, seguros y demás supuestos
                permanecen iguales.
              </p>
              <p>
                La carga total suma el pago modelado y $180.000 de obligaciones
                antes de dividir por el ingreso. La conversión a pesos describe
                la UF elegida para la simulación, no el valor futuro. Seguros,
                gastos, tasación aceptada y condiciones de prepago siguen sin
                verificar.
              </p>
              <p>
                <strong>Notas para facilitar:</strong> pide que la persona
                distinga cálculo de decisión. No hay una alternativa “correcta”
                sin conocer estabilidad de ingresos, liquidez, tolerancia a
                cambios en CLP y condiciones contractuales. Revisa que no
                confunda menor cuota con menor costo total.
              </p>
            </div>
          </details>
          <a
            className="button button--primary"
            href="/herramientas/calculadora-hipotecaria"
          >
            Modelar el caso en la calculadora
          </a>
        </section>
        <section className="questions-section">
          <h2>Lista de verificación antes de comparar</h2>
          <ul>
            <li>Valor comercial, tasación aceptada y base financiable.</li>
            <li>Tasa, convención, vigencia y plazo exacto.</li>
            <li>Prima, base, cobertura y exclusiones de seguros.</li>
            <li>Gastos, impuestos y responsables de pago.</li>
            <li>Condiciones de prepago, mora y modificación contractual.</li>
            <li>Presupuesto del hogar bajo más de un valor de UF.</li>
          </ul>
        </section>
        <ContextualServiceCta />
      </main>
    </PageShell>
  );
}
