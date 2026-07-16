const clean = (value) => String(value || "").trim().replace(/\s+/g, " ");
const validate = (values, required) => Object.fromEntries(required.filter((key) => !clean(values[key])).map((key) => [key, "Completa este campo para continuar."]));
const line = (label, value, fallback = "Por definir") => `${label}: ${clean(value) || fallback}`;
const result = (errors, output, warnings = []) => ({ errors, output, warnings });

export function buildAudienceMap(values) {
  const errors = validate(values, ["topic", "role", "knowledge", "position", "interests", "authority", "channel"]);
  if (Object.keys(errors).length) return result(errors, "");
  const warnings = [!clean(values.assumptions) && "Registra al menos un supuesto que debas verificar.", !clean(values.concerns) && "Pregunta por inquietudes en vez de inferirlas.", !clean(values.stakes) && "Aclara qué podría cambiar para la audiencia."].filter(Boolean);
  const detail = values.knowledge === "Alto" ? "detalle selectivo y foco en implicaciones" : values.knowledge === "Bajo" ? "contexto breve, términos definidos y ejemplos" : "contexto esencial con evidencia disponible";
  return result({}, `MAPA DE AUDIENCIA\n${line("Tema", values.topic)}\n${line("Rol", values.role)}\n${line("Conocimiento actual", values.knowledge)}\n${line("Posición actual", values.position)}\n${line("Intereses", values.interests)}\n${line("Inquietudes", values.concerns)}\n${line("Qué está en juego", values.stakes)}\n${line("Autoridad", values.authority)}\n${line("Contexto", values.context)}\n${line("Canal", values.channel)}\n${line("Supuestos por verificar", values.assumptions)}\n\nPREGUNTAS CLAVE\n¿Qué información tienes que yo no tengo?\n¿Qué resultado necesitas de esta interacción?\n¿Qué parte del mensaje requiere aclaración?\n¿Qué puedes decidir, influir o ejecutar?\n\nNIVEL DE DETALLE SUGERIDO\n${detail}.\n\nRIESGO DE DESALINEACIÓN\nNo confundas rol con preferencia personal. Verifica conocimiento, posición e inquietudes durante la interacción.`, warnings);
}

export function buildListeningPractice(values) {
  const errors = validate(values, ["scenario", "response"]);
  if (Object.keys(errors).length) return result(errors, "");
  const prompts = {
    "Cambio de alcance": "Aclara qué cambió, qué efecto tuvo y qué decisión espera la otra persona.",
    "Demasiado detalle": "Parafrasea el punto principal y acuerda qué parte necesita profundización.",
    "Desacuerdo entre áreas": "Nombra la diferencia sin atribuir intenciones y pregunta qué evidencia podría resolverla.",
  };
  return result({}, `PRÁCTICA CAPTA\nEscenario: ${clean(values.scenario)}\nTu respuesta: ${clean(values.response)}\n\nANÁLISIS PARA AUTOEVALUAR\n${prompts[values.scenario] || "Aclara el significado antes de proponer una solución."}\n\nCAPTA\n□ Concentré la atención en lo dicho\n□ Aclaré términos ambiguos\n□ Parafraseé el significado, no solo palabras\n□ Tensioné una suposición con respeto\n□ Acordé lo entendido antes de avanzar\n\nSIGUIENTE PREGUNTA POSIBLE\n¿Qué información falta para decidir el próximo paso?\n\nNo existe una respuesta universalmente empática. Revisa si tu intervención comprende, verifica y respeta límites.`, []);
}

export function buildCommunicationPurpose(values) {
  const errors = validate(values, ["topic", "audience", "time", "objective", "audienceNeed", "action"]);
  if (Object.keys(errors).length) return result(errors, "");
  const warnings = [!clean(values.outOfScope) && "Declara qué no se resolverá en esta interacción.", !clean(values.followUp) && "Aclara si será necesario un seguimiento."].filter(Boolean);
  return result({}, `PROPÓSITO FIN\nFinalidad: ${clean(values.objective)}.\nInterés compartido: para ${clean(values.audience)}, esta conversación es relevante porque ${clean(values.audienceNeed)}.\nNext step: al terminar, ${clean(values.action)}.\n\nCONDICIONES\n${line("Tema", values.topic)}\n${line("Tiempo", values.time)}\n${line("Fuera de alcance", values.outOfScope)}\n${line("Seguimiento", values.followUp)}\n\nAGENDA SUGERIDA\n1. Abrir con el propósito y el resultado esperado.\n2. Compartir solo el contexto necesario.\n3. Explorar preguntas o diferencias.\n4. Cerrar con decisión, acción o información faltante.\n\nFIN es una guía práctica: ajusta la secuencia al canal y al contexto.`, warnings);
}

export function buildInsight(values) {
  const errors = validate(values, ["purpose", "audience", "facts", "pattern", "explanation", "consequence"]);
  if (Object.keys(errors).length) return result(errors, "");
  const warnings = [!clean(values.uncertainty) && "Explicita qué parte de la interpretación sigue incierta.", !clean(values.comparison) && "Una comparación relevante puede ayudar a contextualizar el patrón.", !clean(values.action) && "Define una pregunta o acción proporcionada a la evidencia."].filter(Boolean);
  return result({}, `DE DATOS A INSIGHT\nHallazgo: ${clean(values.pattern)}${clean(values.comparison) ? `, al compararlo con ${clean(values.comparison)}` : ""}.\nInsight: para ${clean(values.audience)}, el patrón sugiere que ${clean(values.explanation)}, lo que importa porque ${clean(values.consequence)}.\n\nDICA\nDato o hallazgo: ${clean(values.facts)}\nInterpretación: ${clean(values.explanation)}\nConsecuencia: ${clean(values.consequence)}\nAcción o pregunta: ${clean(values.action) || "Definir la evidencia adicional necesaria antes de actuar"}\n\nPROPÓSITO\n${clean(values.purpose)}\n\nINCERTIDUMBRE\n${clean(values.uncertainty) || "No declarada"}\n\nADVERTENCIA\nLa interpretación no es un hecho indiscutido. Verifica explicaciones alternativas y muestra la incertidumbre relevante.`, warnings);
}

export function buildMessageStructure(values) {
  const errors = validate(values, ["channel", "audience", "purpose", "message", "reasons", "evidence", "action"]);
  if (Object.keys(errors).length) return result(errors, "");
  const warnings = [!clean(values.risks) && "Incluye la principal condición, objeción o incertidumbre.", !clean(values.deadline) && "Aclara cuándo debe ocurrir la acción, si corresponde."].filter(Boolean);
  const short = `${clean(values.message)}. ${clean(values.action)}${clean(values.deadline) ? ` antes de ${clean(values.deadline)}` : ""}.`;
  return result({}, `ESTRUCTURA NÚCLEO\nNúcleo: ${clean(values.message)}\nUtilidad para ${clean(values.audience)}: ${clean(values.purpose)}\nCimientos: ${clean(values.reasons)}\nEvidencia: ${clean(values.evidence)}\nLlamado: ${clean(values.action)}\nObjeciones o condiciones: ${clean(values.risks) || "Por explicitar"}\n\nVERSIÓN BREVE · ${clean(values.channel)}\n${short}\n\nVERSIÓN AMPLIADA\n${clean(values.message)}\n\nEsto importa porque ${clean(values.reasons)}. La evidencia principal es ${clean(values.evidence)}. ${clean(values.risks) ? `Debemos considerar ${clean(values.risks)}. ` : ""}Propongo ${clean(values.action)}${clean(values.deadline) ? ` antes de ${clean(values.deadline)}` : ""}.\n\nCHECKLIST DEL CANAL\n□ El asunto o inicio expresa el punto principal\n□ El detalle cabe en el canal elegido\n□ La evidencia respalda directamente el mensaje\n□ La solicitud y el plazo son visibles`, warnings);
}

export function buildNarrative(values) {
  const errors = validate(values, ["audience", "context", "change", "importance", "insight", "response", "outcome", "channel"]);
  if (Object.keys(errors).length) return result(errors, "");
  const warnings = [!clean(values.evidence) && "Vincula el insight con evidencia verificable."];
  return result({}, `NARRATIVA CAMBIO\nContexto: ${clean(values.context)}\nAlteración: ${clean(values.change)}\nMotivo: para ${clean(values.audience)}, importa porque ${clean(values.importance)}\nInsight: ${clean(values.insight)}\nGiro: ${clean(values.response)}\nOutcome: ${clean(values.outcome)}\n\nORDEN SUGERIDO PARA ${clean(values.channel).toUpperCase()}\n1. Sitúa el cambio sin dramatizar.\n2. Presenta la evidencia esencial: ${clean(values.evidence) || "por seleccionar"}.\n3. Explica la implicación.\n4. Propón respuesta y resultado esperado.\n\nTRABAJOS VISUALES POSIBLES\n• Mostrar el cambio o tendencia.\n• Comparar la situación actual con la propuesta.\n• Representar el proceso de implementación.\n\nNo presentes una anécdota como evidencia ni una expectativa como resultado garantizado.`, warnings.filter(Boolean));
}

export function buildPresentationPlan(values) {
  const errors = validate(values, ["audience", "purpose", "duration", "message", "points", "opening", "closing", "channel"]);
  if (Object.keys(errors).length) return result(errors, "");
  const warnings = [!clean(values.questions) && "Prepara al menos una pregunta probable y una respuesta honesta.", !clean(values.priority) && "Elige una sola prioridad de entrega para practicar."].filter(Boolean);
  return result({}, `PLAN DE ENSAYO\nAudiencia: ${clean(values.audience)}\nPropósito: ${clean(values.purpose)}\nDuración: ${clean(values.duration)}\nCanal: ${clean(values.channel)}\nMensaje principal: ${clean(values.message)}\nPuntos de apoyo: ${clean(values.points)}\n\nAPERTURA\n${clean(values.opening)}\n\nCIERRE\n${clean(values.closing)}\n\nSECUENCIA DE PRÁCTICA\n1. Revisa la lógica en silencio.\n2. Explica el mensaje en voz alta.\n3. Cronometra y elimina detalle secundario.\n4. Registra una versión si te resulta accesible; no es obligatorio.\n5. Practica apertura, transición y cierre.\n6. Ensaya preguntas: ${clean(values.questions) || "por preparar"}.\n\nVIVA\n□ Voz audible, ritmo natural, pausas y énfasis\n□ Intención clara en cada sección\n□ Visibilidad presencial o en pantalla sin distracciones\n□ Atención a preguntas y señales verificables\n\nPRIORIDAD DE ESTA PRÁCTICA\n${clean(values.priority) || "Claridad del mensaje principal"}\n\nNo existe una postura, acento o estilo corporal universalmente correcto.`, warnings);
}

export function buildMeetingPlan(values) {
  const errors = validate(values, ["topic", "participants", "time", "outcome", "owner", "scope", "questions", "actions"]);
  if (Object.keys(errors).length) return result(errors, "");
  const warnings = [!clean(values.inputs) && "Aclara qué preparación o evidencia debe llegar antes de la reunión.", !clean(values.risks) && "Anticipa al menos una dinámica que pueda impedir el resultado."].filter(Boolean);
  return result({}, `PLAN AFO\nTema: ${clean(values.topic)}\nParticipantes: ${clean(values.participants)}\nTiempo: ${clean(values.time)}\nResultado: ${clean(values.outcome)}\nResponsable de la decisión: ${clean(values.owner)}\nAlcance: ${clean(values.scope)}\n\nABRIR\n“El objetivo es ${clean(values.outcome)}. Tenemos ${clean(values.time)}. Trabajaremos dentro de ${clean(values.scope)} y cerraremos con responsables y fechas.”\n\nFOCALIZAR\nPreguntas principales: ${clean(values.questions)}\nInsumos: ${clean(values.inputs) || "Por confirmar"}\nRiesgos de dinámica: ${clean(values.risks) || "Por identificar"}\nParticipación: reflexión individual breve, ronda de perspectivas y contraste con criterios.\n\nOPERACIONALIZAR\nAcciones esperadas: ${clean(values.actions)}\n\nREGISTRO\nDecisión: ____________________\nAcción: ______________________\nResponsable: _________________\nFecha: _______________________\nDependencia: _________________\nSeguimiento: __________________\n\nCIERRE\nResume lo decidido, lo abierto, los supuestos y cómo se informará a quienes no estuvieron presentes.`, warnings);
}
