// Registro de fuentes legales del evaluador de demanda laboral.
// Cada componente de cálculo y cada parámetro de legalParams referencia un `id` de esta lista.
// `estado: "verificada"` significa que el enlace respondió y el contenido se contrastó en `fechaVerificacion`.
// `estado: "pendiente"` se muestra en la UI como "pendiente de verificar".

const VERIFIED_ON = "2026-10-17";
const leyChile = (idNorma) => `https://www.bcn.cl/leychile/navegar?idNorma=${idNorma}`;
const CODIGO_TRABAJO = leyChile(207436);

const ct = (articulo, titulo) => ({
  id: `ct-${articulo.replace(/[^\d]+/g, "-").replace(/^-|-$/g, "")}`,
  titulo: `Código del Trabajo: ${titulo}`,
  articulo: `Art. ${articulo}`,
  url: CODIGO_TRABAJO,
  fechaVerificacion: VERIFIED_ON,
  estado: "verificada",
});

export const legalSources = [
  ct("7 y 8", "contrato de trabajo y presunción de relación laboral"),
  ct("67", "feriado anual de 15 días hábiles"),
  ct("69", "el sábado se considera inhábil para el feriado"),
  ct("70", "acumulación del feriado (máximo 2 períodos)"),
  ct("71", "remuneración íntegra durante el feriado"),
  ct("73", "compensación del feriado y feriado proporcional al término"),
  ct("159 a 161", "causales de término del contrato"),
  ct("162", "aviso previo, indemnización sustitutiva y nulidad del despido (Ley Bustos)"),
  ct("163", "indemnización por años de servicio"),
  ct("168", "despido injustificado, indebido o improcedente y recargos"),
  ct("171", "autodespido o despido indirecto"),
  ct("172", "base de cálculo y tope de 90 UF"),
  ct("195", "descanso prenatal y postnatal"),
  ct("201", "fuero maternal"),
  ct("486", "plazo para denunciar vulneración de derechos fundamentales"),
  ct("489", "tutela laboral con ocasión del despido"),
  ct("510", "prescripción de acciones laborales"),
  { id: "dl-3500", titulo: "DL 3.500: sistema de pensiones (cotización 10%, comisión, SIS, salud 7% art. 84)", articulo: "Arts. 17, 29, 59 y 84", url: leyChile(7147), fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "ley-19728", titulo: "Ley 19.728: seguro de cesantía", articulo: "Arts. 5, 6 y 10 (0,6% trabajador; 2,4% empleador = 1,6% CIC + 0,8% FCS; CIC máx. 11 años)", url: leyChile(184979), fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "ley-16744", titulo: "Ley 16.744: seguro de accidentes del trabajo y enfermedades profesionales", articulo: "Art. 15 (cotización básica 0,90% y adicional diferenciada)", url: leyChile(28650), fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "ley-19578", titulo: "Ley 19.578: cotización extraordinaria del seguro de accidentes (art. 6° transitorio)", articulo: "Art. 6° transitorio, modificado por Ley 21.010", url: leyChile(122103), fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "ley-21010", titulo: "Ley 21.010: cotización SANNA de 0,03% y gradualidad 2017–2019", articulo: "Arts. 1 y 3; art. 2° transitorio", url: leyChile(1102293), fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "ley-21063", titulo: "Ley 21.063: Seguro para el Acompañamiento de Niños y Niñas (SANNA)", articulo: "Art. 24", url: leyChile(1113014), fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "ley-17322", titulo: "Ley 17.322: cobranza de cotizaciones, reajustes, interés penal y multas", articulo: "Arts. 22 y 22 a)", url: leyChile(28919), fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "ley-21133", titulo: "Ley 21.133: cotización de trabajadores a honorarios vía retención", articulo: "Texto completo", url: leyChile(1128420), fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "ley-21735", titulo: "Ley 21.735: reforma de pensiones (cotización del empleador y Seguro Social)", articulo: "Art. 4° transitorio (calendario de tasas)", url: leyChile(1212060), fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "ley-18469", titulo: "Ley 18.469: régimen de prestaciones de salud (Fonasa)", articulo: "Texto refundido en DFL 1 de 2005", url: leyChile(29872), fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "dfl-1-2005-salud", titulo: "DFL 1 de 2005 del Ministerio de Salud (Fonasa e Isapres)", articulo: "Libro II y III", url: leyChile(249177), fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "ley-2977", titulo: "Ley 2.977: fija los días feriados", articulo: "Texto vigente", url: leyChile(23639), fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "ley-19668", titulo: "Ley 19.668: traslada a lunes los feriados de San Pedro y San Pablo y del 12 de octubre", articulo: "Art. único", url: leyChile(160270), fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "ley-20299", titulo: "Ley 20.299: feriado del 31 de octubre (Iglesias Evangélicas)", articulo: "Art. único", url: leyChile(279294), fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "ley-21357", titulo: "Ley 21.357: feriado del Día Nacional de los Pueblos Indígenas (solsticio de invierno)", articulo: "Art. único", url: leyChile(1161743), fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "ley-20215", titulo: "Ley 20.215: feriados del 17 y 20 de septiembre según el día de la semana", articulo: "Texto vigente", url: leyChile(264651), fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "dt-feriado-proporcional", titulo: "Dirección del Trabajo: cálculo del feriado proporcional y conversión a días corridos", articulo: "Consulta laboral", url: "https://dt.gob.cl/portal/1628/w3-article-60200.html", fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "dt-dictamen-7549-314", titulo: "Dirección del Trabajo: Dictamen 7549/314, sábado inhábil para el feriado", articulo: "Dictamen", url: "https://dt.gob.cl/legislacion/1624/w3-article-88956.html", fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "dt-financiamiento-16744", titulo: "Dirección del Trabajo: cómo se financia el seguro de accidentes", articulo: "Consulta laboral", url: "https://www.dt.gob.cl/portal/1628/w3-article-95301.html", fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "sp-topes-2026", titulo: "Superintendencia de Pensiones: topes imponibles 2026 (90 UF y 135,2 UF; Res. 236 de 2026)", articulo: "Resolución vigente", url: "https://www.spensiones.cl/portal/institucional/594/w3-article-16885.html", fechaVerificacion: VERIFIED_ON, estado: "pendiente" },
  { id: "sp-sis", titulo: "Superintendencia de Pensiones: tasa del Seguro de Invalidez y Sobrevivencia", articulo: "Información al afiliado", url: "https://www.spensiones.cl/portal/institucional/594/w3-article-2955.html", fechaVerificacion: VERIFIED_ON, estado: "pendiente" },
  { id: "previred-indicadores", titulo: "Previred: indicadores previsionales mensuales (UF fin de mes, topes, SIS, comisiones AFP, Seguro Social)", articulo: "Series mayo 2020 a octubre 2026 contrastadas mes a mes", url: "https://www.previred.com/indicadores-previsionales/", fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "hacienda-21735", titulo: "Ministerio de Hacienda: calendario de la cotización del empleador (Ley 21.735)", articulo: "Tabla del art. 4° transitorio", url: "https://www.hacienda.cl/noticias-y-eventos/noticias/implementacion-de-la-reforma-previsional-nueva-cotizacion-del-empleador-regira", fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "chileatiende-aporte-empleador", titulo: "ChileAtiende: aportes del empleador al sistema de pensiones", articulo: "Ficha 130987", url: "https://www.chileatiende.gob.cl/fichas/130987-aportes-del-empleador-al-sistema-de-pensiones", fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "suseso-sanna", titulo: "Superintendencia de Seguridad Social: Ley SANNA", articulo: "Atención de usuarios", url: "https://www.suseso.gob.cl/606/w3-propertyvalue-137400.html", fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "suseso-cotizacion-extraordinaria", titulo: "Superintendencia de Seguridad Social: cotización extraordinaria Ley 19.578", articulo: "Compendio de Seguridad Laboral", url: "https://www.suseso.gob.cl/613/w3-propertyvalue-136089.html", fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "cmf-api-uf", titulo: "CMF: API de indicadores (UF)", articulo: "recursos_api/uf", url: "https://api.cmfchile.cl/", fechaVerificacion: VERIFIED_ON, estado: "verificada" },
  { id: "mindicador-uf", titulo: "mindicador.cl: serie de la UF (respaldo)", articulo: "/api/uf", url: "https://mindicador.cl/api/uf", fechaVerificacion: VERIFIED_ON, estado: "verificada" },
];

export const legalSourcesById = Object.fromEntries(legalSources.map((source) => [source.id, source]));

export function sourceById(id) {
  return legalSourcesById[id] || { id, titulo: id, articulo: "", url: null, fechaVerificacion: null, estado: "pendiente" };
}
