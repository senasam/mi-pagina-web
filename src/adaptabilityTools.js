const clean = (value) => String(value || "").trim().replace(/\s+/g, " ");
const validate = (values, required) => Object.fromEntries(required.filter((key) => !clean(values[key])).map((key) => [key, "Completa este campo para continuar."]));

export function buildLearningIntention(values) {
  const errors = validate(values, ["skill", "situation", "meaning", "practice"]);
  if (Object.keys(errors).length) return { errors, output: "" };
  const output = `INTENCIÓN DE APRENDIZAJE\nQuiero practicar ${clean(values.skill)} en ${clean(values.situation)} porque ${clean(values.meaning)}.\n\nPRIMERA ACCIÓN\n${clean(values.practice)}${clean(values.frequency) ? `, con una frecuencia de ${clean(values.frequency)}` : ""}.\n\nFEEDBACK\n${clean(values.feedback) || "Fuente por definir"}.\n\nREVISIÓN\n${clean(values.review) || "Fecha por definir"}.\n\nPREGUNTAS\n¿Qué evidencia mostraría aprendizaje?\n¿Qué error quiero observar?\n¿Qué ajuste haré si la práctica no cabe en mi contexto?`;
  return { errors: {}, output };
}

export function buildReframe(values) {
  const errors = validate(values, ["happened", "interpretation", "facts", "next"]);
  if (Object.keys(errors).length) return { errors, output: "" };
  const output = `OPA: OBSERVAR, PAUSAR Y AJUSTAR\n\nOBSERVAR\nSituación: ${clean(values.happened)}\nInterpretación inicial: ${clean(values.interpretation)}\nRespuesta o impulso: ${clean(values.response) || "No registrado"}\nHechos conocidos: ${clean(values.facts)}\nInformación faltante: ${clean(values.missing) || "Por identificar"}\n\nPAUSAR\nAntes de actuar, distinguiré hechos, urgencia y decisión requerida.\n\nAJUSTAR\nPuedo influir en: ${clean(values.influence) || "Por identificar"}\nInterpretación alternativa: ${clean(values.alternative) || "Por explorar"}\nPróxima acción: ${clean(values.next)}\nApoyo o límite: ${clean(values.boundary) || "Por definir"}`;
  return { errors: {}, output };
}

export function buildHabitPlan(values) {
  const errors = validate(values, ["habit", "meaning", "trigger", "action", "recovery"]);
  if (Object.keys(errors).length) return { errors, output: "" };
  const output = `PLAN DE HÁBITO DE APRENDIZAJE\n\nHÁBITO\n${clean(values.habit)}\nMotivo: ${clean(values.meaning)}\n\nRUTINA\nCuando ocurra ${clean(values.trigger)}, realizaré ${clean(values.action)}${clean(values.frequency) ? ` (${clean(values.frequency)})` : ""}.\nRefuerzo inmediato: ${clean(values.reinforcement) || "Por definir"}\n\nOBSTÁCULO\n${clean(values.obstacle) || "Por identificar"}\nPlan de recuperación: ${clean(values.recovery)}\n\nHÁBITO A REDUCIR\n${clean(values.reduce) || "Ninguno seleccionado"}\n\nREVISIÓN\n${clean(values.review) || "Fecha por definir"}\n\nCHECKLIST SEMANAL\n□ Practiqué la acción mínima\n□ Registré una fricción\n□ Usé el plan de recuperación\n□ Ajusté la rutina sin castigarme`;
  return { errors: {}, output };
}

export function buildAdaptabilityPlan(values) {
  const errors = validate(values, ["context", "challenge", "intention", "practice", "support"]);
  if (Object.keys(errors).length) return { errors, output: "" };
  const output = `PLAN PERSONAL DE ADAPTABILIDAD\nContexto: ${clean(values.context)}\nDesafío: ${clean(values.challenge)}\nLímite que debo proteger: ${clean(values.boundary) || "Por definir"}\n\nSEMANA 1 · CLARIFICAR\nSepararé hechos y supuestos. Mi intención será: ${clean(values.intention)}.\nApoyo: ${clean(values.support)}.\n\nSEMANA 2 · PRACTICAR\nSubhabilidad o acción: ${clean(values.practice)}.\nFeedback: ${clean(values.feedback) || "Definir una persona y una pregunta observable"}.\n\nSEMANA 3 · AJUSTAR\nAplicaré OPA a un momento difícil y probaré: ${clean(values.alternative) || "una alternativa pequeña y reversible"}.\nRevisaré carga, apoyo y límites.\n\nSEMANA 4 · CONSOLIDAR\nEvidencia de avance: ${clean(values.evidence) || "Por definir"}.\nHábito a mantener: ${clean(values.maintain) || "Por seleccionar"}.\nHábito a reducir: ${clean(values.reduce) || "Por seleccionar"}.\nPróximo ciclo: revisar resultados y elegir un ajuste.`;
  return { errors: {}, output };
}

export function buildJournalEntry(values) {
  const errors = validate(values, ["situation", "fact", "action", "result", "lesson", "next"]);
  if (Object.keys(errors).length) return { errors, output: "" };
  const output = `REGISTRO HECA\n\nSITUACIÓN\n${clean(values.situation)}\n\nHECHO\n${clean(values.fact)}\n\nEXPLICACIÓN INICIAL\n${clean(values.interpretation) || "No registrada"}\n\nACCIÓN Y CONSECUENCIA\nAcción: ${clean(values.action)}\nResultado: ${clean(values.result)}\nFeedback: ${clean(values.feedback) || "No registrado"}\n\nAPRENDIZAJE\n${clean(values.lesson)}\n\nAJUSTE / PRÓXIMO EXPERIMENTO\n${clean(values.next)}`;
  return { errors: {}, output };
}
