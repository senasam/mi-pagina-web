const clean = (value) => String(value ?? "").trim().replace(/\s+/g, " ");
const result = (errors, output = "", warnings = []) => ({ errors, output, warnings });
const validate = (values, names) => {
  const errors = {};
  for (const name of names) {
    const value = clean(values[name]);
    if (!value) errors[name] = "Completa este campo.";
    else if (value.length > 2000) errors[name] = "Resume el contenido en 2.000 caracteres o menos.";
  }
  return errors;
};
const make = ({ heading, required, render, warnings = [] }) => (values = {}) => {
  const errors = validate(values, required);
  return Object.keys(errors).length ? result(errors) : result({}, `${heading}\n\n${render(values)}`, warnings);
};

export const clarifyObjective = make({
  heading: "OBJETIVO DE APRENDIZAJE",
  required: ["decision", "hypothesis", "available", "missing", "nextDecision"],
  render: (v) => `Quiero comprender ${clean(v.missing)} para decidir ${clean(v.nextDecision)}. Hoy parto del supuesto “${clean(v.hypothesis)}” y ya cuento con ${clean(v.available)}.\n\nCATEGORÍAS DE EVIDENCIA\n• Información pública verificable.\n• Experiencia situada y ejemplos.\n• Perspectiva contrastante.\n• Prueba pequeña que puedo realizar.\n\nDECISIÓN O INCERTIDUMBRE ORIGINAL\n${clean(v.decision)}\n\nLÍMITE\nLa conversación aporta perspectiva; no delega la decisión ni garantiza certeza.`,
  warnings: ["Si el objetivo contiene varias decisiones, elige una antes de contactar.", "No pidas a otra persona evaluar tu valor profesional o decidir tu carrera."],
});

export const mapPerspectives = make({
  heading: "MAPA DE PERSPECTIVAS",
  required: ["topic", "role", "transition", "consulted", "categories"],
  render: (v) => `TEMA\n${clean(v.topic)}\n\nFUNCIÓN O CAMPO\n${clean(v.role)}\n\nTRANSICIÓN\n${clean(v.transition)}\n\nYA CONSULTADO\n${clean(v.consulted)}\n\nCATEGORÍAS DESEADAS\n${clean(v.categories)}\n\nVACÍOS A REVISAR\n• Experiencia directa actual.\n• Perspectiva adyacente que colabora con el rol.\n• Trayectoria de entrada o salida comparable.\n• Contexto contrastante por etapa u organización.\n\nNo busques personas reales con esta herramienta. Diversidad de perspectivas no garantiza representatividad.`,
});

export function classifyQuestion(values = {}) {
  const errors = validate(values, ["question", "purpose"]);
  if (Object.keys(errors).length) return result(errors);
  const question = clean(values.question); const lower = question.toLowerCase();
  let category = "Contextual"; let explanation = "Relaciona información conocida con un entorno concreto.";
  if (/cuál es|qué significa|dónde (puedo|se)|cuántos|requisitos oficiales|sitio web/.test(lower)) { category = "Público"; explanation = "Parece buscar un dato que conviene investigar primero en una fuente fiable."; }
  else if (/te ocurrió|has vivido|aprendiste|ejemplo|difícil|sorprendió|observaste/.test(lower)) { category = "Experiencial"; explanation = "Pide una observación o aprendizaje vivido por la persona."; }
  else if (/interpretas|cambiará|tensión|trade.?off|alternativas|qué harías distinto|cómo ves/.test(lower)) { category = "Reflexivo"; explanation = "Invita a interpretar condiciones, tensiones o caminos posibles."; }
  const sensitive = /salario exacto|información confidencial|secreto|quién será despedido|evaluación de .*empleado/.test(lower);
  return result({}, `CLASIFICACIÓN ORIENTATIVA\n${category}\n\nEXPLICACIÓN\n${explanation}\n\nPROPÓSITO DECLARADO\n${clean(values.purpose)}\n\nREFORMULACIÓN\nParte de un hecho público, pregunta cómo varía por contexto y solicita un ejemplo que la persona pueda compartir sin revelar información privada.${sensitive ? "\n\nALERTA: la pregunta parece solicitar información privada o confidencial. Conviene eliminarla, no solo reformularla." : ""}`, ["La clasificación usa reglas simples y puede equivocarse.", "No envía la pregunta a analítica ni a servicios externos."]);
}

export const buildRequest = make({
  heading: "SOLICITUD CON CONTEXTO, MOTIVO Y SALIDA FÁCIL",
  required: ["relationship", "topic", "relevance", "format", "length"],
  render: (v) => `VERSIÓN DIRECTA\nHola. ${clean(v.relationship)}. Estoy explorando ${clean(v.topic)} y tu experiencia resulta pertinente porque ${clean(v.relevance)}. ¿Te acomodaría una conversación en formato ${clean(v.format)}, de aproximadamente ${clean(v.length)}? ${clean(v.availability) ? `Podría adaptarme a ${clean(v.availability)}. ` : ""}Si no tienes disponibilidad o no es un tema que quieras conversar, no hay problema. Gracias por considerarlo.\n\nVERSIÓN BREVE\nHola. Estoy investigando ${clean(v.topic)} y me ayudaría conocer tu perspectiva sobre ${clean(v.relevance)}. ¿Aceptarías un intercambio ${clean(v.format)} de ${clean(v.length)}? Si no te acomoda, lo entiendo.\n\nCHECKLIST\n✓ Contexto verdadero\n✓ Motivo específico\n✓ Un pedido acotado\n✓ Salida fácil\n✓ Sin solicitud de empleo o referencia`,
  warnings: ["Edita la estructura para que suene propia y exacta.", "No inventes conexiones, detalles personales, urgencia ni familiaridad."],
});

export function reviewPressure(values = {}) {
  const errors = validate(values, ["draft"]);
  if (Object.keys(errors).length) return result(errors);
  const draft = clean(values.draft); const lower = draft.toLowerCase(); const warnings = [];
  if (draft.length > 900) warnings.push("El mensaje es extenso; conserva solo el contexto necesario.");
  if ((draft.match(/\?/g) || []).length > 2) warnings.push("Hay varias preguntas o solicitudes; prioriza una.");
  if (/trabajo|vacante|contratar|cv|currículum|referencia laboral/.test(lower)) warnings.push("Podría interpretarse como una solicitud de empleo o referencia.");
  if (/urgente|cuanto antes|hoy mismo|necesito que/.test(lower)) warnings.push("Contiene presión o urgencia que conviene justificar o retirar.");
  if (/admiro muchísimo|soy tu mayor|increíble trayectoria|brillante/.test(lower)) warnings.push("El elogio puede sentirse excesivo o artificial.");
  if (!/porque|motivo|explor|investig|comprender|aprender/.test(lower)) warnings.push("No aparece una razón clara para contactar.");
  if (!/si no|no hay problema|si no te acomoda|entiendo si|sin compromiso/.test(lower)) warnings.push("Añade una forma cómoda de declinar.");
  if (/confidencial|no público|secreto|salario exacto/.test(lower)) warnings.push("El borrador parece pedir información privada o confidencial.");
  if (/segundo seguimiento|tercer mensaje|insistiré|hasta que respondas/.test(lower)) warnings.push("El lenguaje sugiere seguimiento repetido; define un cierre.");
  return result({}, `REVISIÓN POR REGLAS\n\n${warnings.length ? warnings.map((item) => `• ${item}`).join("\n") : "No se detectaron las señales configuradas."}\n\nCOMPROBACIÓN HUMANA\nConfirma propósito, exactitud, proporción, privacidad y salida fácil antes de enviar.`, ["Este revisor no comprende perfectamente el tono ni determina adecuación social.", "Una ausencia de alertas no convierte el mensaje en apropiado."]);
}

export const planConversation = make({
  heading: "TARJETA FLEXIBLE DE CONVERSACIÓN",
  required: ["time", "objective", "priority", "optional", "context", "closing"],
  render: (v) => `TIEMPO DISPONIBLE\n${clean(v.time)}\n\nFOCO\n${clean(v.objective)}\n\nCONTEXTO BREVE\n${clean(v.context)}\n\nPREGUNTAS PRIORITARIAS\n${clean(v.priority)}\n\nPREGUNTAS OPCIONALES\n${clean(v.optional)}\n\nFLUJO\n1. Confirmar foco y tiempo.\n2. Dar contexto suficiente.\n3. Explorar experiencia.\n4. Profundizar con ejemplos y excepciones.\n5. Sintetizar y cerrar.\n\nCIERRE\n${clean(v.closing)}\n\nSi el tiempo cambia, conserva una pregunta y el cierre. Pide permiso antes de extender la conversación.`,
  warnings: ["No intentes cubrir una lista completa.", "El plan no asigna minutos obligatorios ni sustituye la escucha."],
});

export const prepareEvent = make({
  heading: "PLAN DE EVENTO PROFESIONAL",
  required: ["duration", "sessions", "goals", "themes", "constraints"],
  render: (v) => `DURACIÓN\n${clean(v.duration)}\n\nNECESITO APRENDER\n${clean(v.goals)}\n\nCONVIENE COMPARAR\n${clean(v.themes)}\n\nVALOR INESPERADO\nReserva un espacio sin agenda para una conversación o tema emergente.\n\nSESIONES POSIBLES\n${clean(v.sessions)}\n\nENERGÍA, ACCESIBILIDAD Y SEGURIDAD\n${clean(v.constraints)}\n\nRECORDATORIOS\n• Incluye descansos y una alternativa tranquila.\n• Únete a grupos sin interrumpir.\n• Deja espacio a otras voces.\n• No conviertas personas en objetivos ni envíes invitaciones indiscriminadas.`,
});

export const recordLearning = make({
  heading: "REGISTRO ANÓNIMO DE APRENDIZAJE",
  required: ["expectations", "observations", "interpretation", "uncertainty", "action", "verification"],
  render: (v) => `EXPECTATIVA\n${clean(v.expectations)}\n\nOBSERVACIONES\n${clean(v.observations)}\n\nINTERPRETACIÓN PROVISIONAL\n${clean(v.interpretation)}\n\nINCERTIDUMBRE\n${clean(v.uncertainty)}\n\nPOR VERIFICAR\n${clean(v.verification)}\n\nACCIÓN\n${clean(v.action)}\n\nLÍMITE\nUna conversación aporta una perspectiva situada; no prueba que un patrón sea general.`,
  warnings: ["Usa etiquetas anónimas y evita citas, nombres, empleadores o información confidencial.", "La información vive solo en la sesión actual."],
});

export const comparePerspectives = make({
  heading: "COMPARACIÓN DE PERSPECTIVAS",
  required: ["summary1", "summary2", "themes", "agreement", "disagreement", "differences"],
  render: (v) => `PERSPECTIVA A\n${clean(v.summary1)}\n\nPERSPECTIVA B\n${clean(v.summary2)}\n${clean(v.summary3) ? `\nPERSPECTIVA C\n${clean(v.summary3)}\n` : ""}${clean(v.summary4) ? `\nPERSPECTIVA D\n${clean(v.summary4)}\n` : ""}\nTEMAS\n${clean(v.themes)}\n\nACUERDOS\n${clean(v.agreement)}\n\nDIFERENCIAS\n${clean(v.disagreement)}\n\nCONTEXTO QUE PODRÍA EXPLICARLAS\n${clean(v.differences)}\n\nEVIDENCIA ADICIONAL\nBusca una fuente primaria, otra perspectiva o una prueba pequeña antes de concluir.`,
  warnings: ["Frecuencia no equivale a prueba ni representatividad.", "Resume sin nombres, citas extensas o detalles identificables."],
});

export function decideFollowup(values = {}) {
  const required = ["context", "outcome", "acted", "elapsed", "reason", "previous"];
  const errors = validate(values, required);
  if (Object.keys(errors).length) return result(errors);
  const joined = required.map((name) => clean(values[name]).toLowerCase()).join(" ");
  let category = "Esperar"; let explanation = "No aparece una razón nueva y acotada para volver a contactar.";
  if (/no contactar|rechaz|declin|no desea|baja|no más/.test(joined)) { category = "No volver a contactar"; explanation = "La preferencia o negativa debe respetarse sin otra solicitud."; }
  else if (/no agradec|pendiente agradecer|recién|ayer/.test(joined)) { category = "Agradecer y cerrar"; explanation = "Un agradecimiento breve puede cerrar la conversación sin pedir otro favor."; }
  else if (/apliqué|implementé|completé|resultado|avance/.test(joined)) { category = "Enviar una actualización pertinente"; explanation = "Existe una novedad relacionada con el consejo recibido; compártela sin exigir respuesta."; }
  else if (/invitó|ofreció responder|pregunta pendiente|autorizó/.test(joined) && !/dos|tres|varios|repetid/.test(clean(values.previous).toLowerCase())) { category = "Hacer una pregunta acotada"; explanation = "La relación y el permiso permiten una consulta breve, siempre con salida fácil."; }
  return result({}, `ORIENTACIÓN: ${category.toUpperCase()}\n\n${explanation}\n\nCONTEXTO CONSIDERADO\n${clean(values.context)}\n\nLÍMITE\nEsta salida organiza señales declaradas; no determina con certeza qué es socialmente apropiado.`, ["Si existe una negativa clara, la categoría correcta es no volver a contactar.", "No uses seguimiento para crear una obligación de reciprocidad."]);
}

const fields = {
  objective: [["decision", "Decisión o incertidumbre *"], ["hypothesis", "Hipótesis actual *"], ["available", "Evidencia disponible *"], ["missing", "Información faltante *"], ["nextDecision", "Próxima decisión *"]],
  perspectives: [["topic", "Tema *"], ["role", "Función o campo *"], ["transition", "Tipo de transición *"], ["consulted", "Perspectivas ya consultadas *"], ["categories", "Categorías que deseas incluir *"]],
  questions: [["question", "Pregunta *"], ["purpose", "Propósito de aprendizaje *"]],
  request: [["relationship", "Contexto de relación *"], ["topic", "Tema de aprendizaje *"], ["relevance", "Por qué esta perspectiva es relevante *"], ["format", "Formato propuesto *", "select", ["Conversación breve", "Intercambio escrito", "Videollamada", "Llamada", "Conversación en evento"]], ["length", "Rango de duración *"], ["availability", "Disponibilidad opcional"]],
  pressure: [["draft", "Borrador de solicitud *"]],
  conversation: [["time", "Tiempo disponible *"], ["objective", "Objetivo de aprendizaje *"], ["priority", "Preguntas prioritarias *"], ["optional", "Preguntas opcionales *"], ["context", "Contexto breve *"], ["closing", "Cierre preferido *"]],
  event: [["duration", "Duración del evento *"], ["sessions", "Sesiones posibles *"], ["goals", "Objetivos centrales *"], ["themes", "Organizaciones o temas posibles *"], ["constraints", "Energía, accesibilidad o seguridad *"]],
  record: [["expectations", "Qué esperabas *"], ["observations", "Qué observaste *"], ["interpretation", "Tu interpretación *"], ["uncertainty", "Qué sigue incierto *"], ["action", "Siguiente acción *"], ["verification", "Qué debes verificar *"]],
  compare: [["summary1", "Resumen anónimo A *"], ["summary2", "Resumen anónimo B *"], ["summary3", "Resumen anónimo C"], ["summary4", "Resumen anónimo D"], ["themes", "Temas *"], ["agreement", "Acuerdos *"], ["disagreement", "Diferencias *"], ["differences", "Diferencias de contexto *"]],
  followup: [["context", "Contexto de la relación *"], ["outcome", "Resultado de la conversación *"], ["acted", "¿Actuaste sobre algún consejo? *"], ["elapsed", "Tiempo transcurrido *"], ["reason", "Razón legítima para reconectar *"], ["previous", "Seguimientos anteriores *"]],
};

export const informationalToolConfigs = {
  objective: { title: "Clarificador de objetivo", path: "/herramientas/clarificador-entrevista-informativa", event: "informational_objective_completed", fields: fields.objective, build: clarifyObjective },
  perspectives: { title: "Mapa de perspectivas", path: "/herramientas/mapa-perspectivas-profesionales", event: "informational_perspectives_completed", fields: fields.perspectives, build: mapPerspectives },
  questions: { title: "Clasificador de preguntas", path: "/herramientas/clasificador-preguntas-entrevista", event: "informational_question_completed", fields: fields.questions, build: classifyQuestion },
  request: { title: "Constructor de solicitud", path: "/herramientas/constructor-solicitud-entrevista-informativa", event: "informational_request_completed", fields: fields.request, build: buildRequest },
  pressure: { title: "Revisor de presión y claridad", path: "/herramientas/revisor-solicitud-entrevista", event: "informational_pressure_completed", fields: fields.pressure, build: reviewPressure },
  conversation: { title: "Planificador de conversación", path: "/herramientas/planificador-conversacion-informativa", event: "informational_conversation_completed", fields: fields.conversation, build: planConversation },
  event: { title: "Preparador de evento profesional", path: "/herramientas/preparador-evento-profesional", event: "informational_event_completed", fields: fields.event, build: prepareEvent },
  record: { title: "Registro de aprendizajes", path: "/herramientas/registro-aprendizajes-conversacion", event: "informational_record_completed", fields: fields.record, build: recordLearning },
  compare: { title: "Comparador de perspectivas", path: "/herramientas/comparador-perspectivas-profesionales", event: "informational_compare_completed", fields: fields.compare, build: comparePerspectives },
  followup: { title: "Decisor de seguimiento", path: "/herramientas/decisor-seguimiento-profesional", event: "informational_followup_completed", fields: fields.followup, build: decideFollowup },
};
