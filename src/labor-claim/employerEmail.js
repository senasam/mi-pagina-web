// Genera una propuesta de correo al empleador a partir del resultado de evaluateLaborClaim.
// Función pura: no depende de la UI. Tono conciliador, tratando de "tú": informa montos y fundamentos y busca un acuerdo.
import { sourceById } from "./legalSources.js";

const clp = (value) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Math.round(value || 0));
const dateLabel = (iso) => (iso ? new Intl.DateTimeFormat("es-CL", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`)) : "");
const roundThousand = (value) => Math.round((value || 0) / 1000) * 1000;

export const EVIDENCE_OPTIONS = [
  { id: "boletas", label: "Boletas de honorarios emitidas mes a mes", phrase: "las boletas de honorarios emitidas mes a mes, que muestran pagos periódicos y continuos" },
  { id: "correos", label: "Correos electrónicos con instrucciones o jefaturas", phrase: "correos electrónicos con instrucciones, tareas asignadas y comunicaciones con jefaturas" },
  { id: "mensajes", label: "Conversaciones por WhatsApp u otras apps", phrase: "conversaciones por WhatsApp u otras aplicaciones de mensajería" },
  { id: "horario", label: "Registros de horario, turnos o asistencia", phrase: "registros de horario, turnos o asistencia" },
  { id: "herramientas", label: "Correo corporativo, credencial, uniforme o equipos de la empresa", phrase: "el uso de correo corporativo, credencial, uniforme o equipos de la empresa" },
  { id: "testigos", label: "Compañeros de trabajo que pueden declarar", phrase: "compañeros de trabajo que pueden dar testimonio" },
  { id: "clientes", label: "Clientes o proveedores que pueden declarar que les atendía en nombre de la empresa", phrase: "clientes o proveedores que pueden declarar que les atendí en nombre de la empresa" },
  { id: "documentos", label: "Organigramas, evaluaciones o documentos internos", phrase: "organigramas, evaluaciones de desempeño u otros documentos internos" },
];

// Reajustes e intereses legales de las cotizaciones atrasadas (art. 19 DL 3.500; Ley 17.322). No se pueden renunciar
// en un acuerdo: los calcula cada institución al momento del pago. La multa es aparte y a beneficio fiscal.
export const lateContributionCharges = (result) => result.latePayment.reajuste + result.latePayment.interes;

// Monto sugerido: cotizaciones íntegras con sus reajustes e intereses legales + lo que el trabajador recibiría
// si gana el juicio, ya descontado el honorario del abogado.
export function suggestedProposal(result, lawyerFeeRate = 0) {
  return roundThousand(result.exposure.contributions + lateContributionCharges(result) + result.exposure.cash * (1 - lawyerFeeRate));
}

const BASE_SOURCE_IDS = ["ct-7-8", "ct-162", "dl-3500", "ley-19728", "ley-17322"];

export function emailSources(result) {
  const ids = [
    ...BASE_SOURCE_IDS,
    ...result.components.filter((item) => item.enabled && item.amount > 0).flatMap((item) => item.sourceIds),
    ...result.contributions.byDestination.filter((item) => item.amount > 0).flatMap((item) => item.sourceIds),
  ];
  return [...new Set(ids)].map(sourceById).filter((source) => source.url && source.estado !== "pendiente");
}

// Agrupa los artículos del Código del Trabajo en una línea y deja una línea breve por cada otra norma.
export function legalBasisLines(sources) {
  const codeSources = sources.filter((source) => source.id.startsWith("ct-"));
  const firstNumber = (source) => Number(source.articulo.match(/\d+/)?.[0] || 0);
  const articles = codeSources.sort((a, b) => firstNumber(a) - firstNumber(b)).map((source) => source.articulo.replace(/^Art\.\s*/, ""));
  const lines = codeSources.length ? [`Código del Trabajo, arts. ${articles.join("; ")}: ${codeSources[0].url}`] : [];
  sources.filter((source) => !source.id.startsWith("ct-")).forEach((source) => lines.push(`${source.titulo.replace(/\s*\(.*\)\s*$/, "")}: ${source.url}`));
  return lines;
}

export function buildEmployerEmail(result, {
  employeeName = "", employerName = "", startDate, endDate, proposalAmount, responseDays = 10, healthLabel = "Fonasa",
  lawyerFeeRate = 0, evidence = [], evidenceOther = "", rightsDescription = "",
} = {}) {
  const employee = employeeName.trim() || "[tu nombre]";
  const employer = employerName.trim() || "[nombre del empleador o empresa]";
  const proposal = proposalAmount > 0 ? proposalAmount : suggestedProposal(result, lawyerFeeRate);
  const cashItems = result.components.filter((item) => item.enabled && item.amount > 0);
  const destinations = result.contributions.byDestination.filter((item) => item.amount > 0);
  const charges = lateContributionCharges(result);
  const contributionsWithCharges = result.exposure.contributions + charges;
  const toEmployee = Math.max(0, proposal - contributionsWithCharges);
  const destinationLabel = (item) => (item.id === "salud" ? `Salud: ${healthLabel} (7%)` : item.label);
  const rightsClaimed = cashItems.some((item) => item.id === "tutela");
  const evidencePhrases = [
    ...EVIDENCE_OPTIONS.filter((option) => evidence.includes(option.id)).map((option) => option.phrase),
    ...(evidenceOther.trim() ? [evidenceOther.trim()] : []),
  ];
  const sources = emailSources(result);
  const lines = [];

  lines.push(`Estimado(a) ${employer}:`, "");
  lines.push(`Te escribo con el ánimo de conversar y llegar a una solución de común acuerdo respecto de los servicios que presté entre el ${dateLabel(startDate)} y el ${dateLabel(endDate)}.`, "");
  lines.push("Aunque durante ese período emití boletas de honorarios, en la práctica trabajé con horario, siguiendo instrucciones y bajo la supervisión de la empresa. Por eso entiendo que existió una relación laboral en los términos de los artículos 7 y 8 del Código del Trabajo, con los derechos y cotizaciones que la ley asocia a ella.", "");
  if (evidencePhrases.length) {
    lines.push("Cuento con antecedentes que respaldan esta relación, entre ellos:");
    evidencePhrases.forEach((phrase) => lines.push(`   - ${phrase.charAt(0).toUpperCase()}${phrase.slice(1).replace(/\.$/, "")}.`));
    lines.push("");
  }

  if (rightsClaimed) {
    lines.push(`Además, considero que el término de la relación afectó mis derechos fundamentales${rightsDescription.trim() ? `: ${rightsDescription.trim().replace(/\.$/, "")}` : ""}. Por eso incluyo la indemnización que contempla el artículo 489 del Código del Trabajo.`, "");
  } else {
    lines.push("En esta propuesta no estoy reclamando una vulneración de derechos fundamentales; me limito a los conceptos propios de la relación laboral y su término.", "");
  }

  if (result.protectionKind === "fuero") lines.push(`También te comento que al momento del término me encontraba con fuero maternal (artículo 201 del Código del Trabajo), vigente hasta el ${dateLabel(result.maternity.fueroEnd)}.`, "");

  lines.push("Para que ambos tengamos claridad, preparé una estimación de lo que correspondería pagar si este asunto llegara a un tribunal y se acogieran mis pretensiones:", "");
  lines.push("1. Montos a mi favor");
  cashItems.forEach((item) => lines.push(`   - ${item.label}: ${clp(item.amount)}`));
  lines.push(`   Subtotal: ${clp(result.exposure.cash)}`, "");
  lines.push("2. Cotizaciones previsionales, de salud y de seguridad social pendientes (se pagan directamente a cada institución)");
  destinations.forEach((item) => lines.push(`   - ${destinationLabel(item)}: ${clp(item.amount)}`));
  lines.push(`   Subtotal: ${clp(result.exposure.contributions)}`, "");
  lines.push("3. Recargos legales por pago atrasado de cotizaciones");
  lines.push(`   - Reajustes e intereses (artículo 19 del DL 3.500 y Ley 17.322): ${clp(charges)}`);
  lines.push(`   - Multas por declaración fuera de plazo, a beneficio fiscal: ${clp(result.latePayment.multa)}`, "");
  lines.push(`Total estimado: ${clp(result.exposure.total)}`, "");
  if (result.protectionKind === "nulidad") lines.push("Te menciono también que, según el artículo 162 del Código del Trabajo, mientras las cotizaciones no estén pagadas el término de la relación no produce todos sus efectos, por lo que las remuneraciones podrían seguir devengándose hasta que se regularicen.", "");
  lines.push("Todos estos montos son estimaciones. Los calculé siguiendo las normas vigentes que cito al final, y el resultado definitivo dependería de lo que se acredite. Los reajustes e intereses los calcula cada institución al momento del pago, según el tiempo transcurrido.", "");

  lines.push("Mi propuesta");
  lines.push(`Para evitarnos a ambos un juicio, con sus costos y tiempos, te propongo un acuerdo por un total de ${clp(proposal)}, distribuido así:`);
  lines.push(`   - ${clp(contributionsWithCharges)} para pagar íntegramente las cotizaciones pendientes con sus reajustes e intereses legales, directamente a cada institución (${clp(result.exposure.contributions)} de cotizaciones más ${clp(charges)} estimados de reajustes e intereses; el monto exacto lo calcula cada institución al pagar).`);
  lines.push(`   - ${clp(toEmployee)} a mi favor por los conceptos del punto 1.`);
  lines.push("Los reajustes, intereses y multas por cotizaciones atrasadas los fija la ley y un acuerdo entre nosotros no los elimina; pero mientras antes se paguen las cotizaciones, menos crecen. Un acuerdo también evitaría los costos y la incertidumbre de un juicio" + (result.protectionKind === "nulidad" ? " y que sigan acumulándose remuneraciones por la nulidad del despido." : "."));
  lines.push("Podríamos formalizarlo por escrito, mediante finiquito o transacción ratificada ante la Inspección del Trabajo u otro ministro de fe.", "");
  lines.push(`Como el plazo legal para presentar una demanda es de 60 días hábiles desde el término de la relación, te agradecería una respuesta dentro de ${responseDays} días hábiles, para que podamos resolverlo conversando. Quedo disponible para reunirnos o hablar por teléfono cuando te acomode.`, "");

  if (sources.length) {
    lines.push("Fundamentos legales");
    legalBasisLines(sources).forEach((line) => lines.push(`   - ${line}`));
    lines.push("");
  }
  lines.push("Saludos cordiales,", employee);

  return {
    subject: `Propuesta de acuerdo por término de relación laboral – ${employee}`,
    body: lines.join("\n"),
    proposal,
    toEmployee,
    contributionsWithCharges,
    sources,
  };
}
