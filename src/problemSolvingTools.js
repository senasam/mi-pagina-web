const clean = (value) => String(value || "").trim().replace(/\s+/g, " ");
const validate = (values, required) => Object.fromEntries(required.filter((key) => !clean(values[key])).map((key) => [key, "Completa este campo para continuar."]));
const line = (label, value, fallback = "Por definir") => `${label}: ${clean(value) || fallback}`;

export function diagnoseProblemType(values) {
  const errors = validate(values, ["urgency", "consequence", "data", "stakeholders", "reversibility", "uncertainty", "creativity", "duration"]);
  if (Object.keys(errors).length) return { errors, output: "", warnings: [] };
  const signals = [values.consequence, values.stakeholders, values.uncertainty, values.creativity, values.duration].filter((value) => value === "Alto").length;
  const depth = values.consequence === "Alto" || values.reversibility === "Baja" || signals >= 3 ? "extendida" : signals >= 1 || values.duration === "Medio" ? "enfocada" : "rápida";
  const warnings = [values.urgency === "Alto" && values.consequence === "Alto" && "Si existe riesgo inmediato, prioriza la reducción de daño, los protocolos aplicables y la orientación especializada cuando corresponda.", values.reversibility === "Baja" && "Una decisión difícil de revertir merece revisión independiente.", values.data === "Bajo" && "Distingue la falta de datos de la falta de claridad sobre la decisión."].filter(Boolean);
  const output = `ORIENTACIÓN DE PROFUNDIDAD\nProceso sugerido: resolución ${depth}.\n\nPRIMERAS PREGUNTAS\n1. ¿Qué decisión concreta debe tomarse?\n2. ¿Qué daño o riesgo exige una acción inmediata?\n3. ¿Qué evidencia podría cambiar la decisión?\n4. ¿Qué parte es reversible y qué parte no?\n\nHERRAMIENTAS SUGERIDAS\n${depth === "rápida" ? "Pregunta CLARO y regla de parada." : depth === "enfocada" ? "Lienzo de definición, hipótesis rivales y VERA." : "Lienzo, árbol lógico, VERA, plan de trabajo, registro de decisión y revisión de riesgos."}\n\nEsta salida orienta el esfuerzo; no es un diagnóstico ni asesoría especializada.`;
  return { errors: {}, output, warnings };
}

export function buildProblemDefinition(values) {
  const errors = validate(values, ["situation", "decision", "outcome", "horizon"]);
  if (Object.keys(errors).length) return { errors, output: "", warnings: [] };
  const question = `¿Qué decisión sobre ${clean(values.decision)} permitirá pasar de ${clean(values.situation)} a ${clean(values.outcome)} durante ${clean(values.horizon)}, considerando ${clean(values.constraints) || "las restricciones confirmadas"}?`;
  const warnings = [!clean(values.metric) && "Define una señal observable de éxito.", !clean(values.scope) && "Aclara qué queda dentro y fuera del análisis.", !clean(values.unknowns) && "Registra al menos una incertidumbre que podría cambiar la decisión."].filter(Boolean);
  const output = `BORRADOR DE PREGUNTA\n${question}\n\nLIENZO DEL PROBLEMA\n${line("Situación actual", values.situation)}\n${line("Decisión", values.decision)}\n${line("Resultado deseado", values.outcome)}\n${line("Métrica", values.metric)}\n${line("Horizonte", values.horizon)}\n${line("Alcance", values.scope)}\n${line("Restricciones", values.constraints)}\n${line("Actores relevantes", values.stakeholders)}\n${line("Hechos conocidos", values.facts)}\n${line("Incertidumbres", values.unknowns)}\n\nREVISIÓN CLARO\nConcreta: revisa que nombre una decisión específica.\nLigada a una decisión: sí, parte de la acción requerida.\nAcotada: ${clean(values.scope) ? "el alcance está declarado" : "falta declarar el alcance"}.\nReferida a un resultado: sí, explicita el cambio esperado.\nOportuna: sí, incluye un horizonte.`;
  return { errors: {}, output, warnings };
}

export function buildLogicTree(values) {
  const errors = validate(values, ["question", "type", "branches"]);
  if (Object.keys(errors).length) return { errors, output: "", warnings: [] };
  const branches = clean(values.branches).split(/\s*[;\n]\s*/).filter(Boolean);
  const normalized = branches.map((branch) => branch.toLowerCase());
  const warnings = [];
  if (branches.length < 2) warnings.push("Agrega al menos dos ramas plausibles para comparar explicaciones.");
  if (branches.some((branch) => branch.split(" ").length < 2)) warnings.push("Alguna rama es demasiado amplia; conviértela en una pregunta comprobable.");
  if (new Set(normalized).size !== normalized.length) warnings.push("Hay ramas repetidas o con posible solapamiento.");
  if (!clean(values.evidence)) warnings.push("Conecta cada hoja con evidencia que pueda examinarse.");
  const output = `ÁRBOL LÓGICO · BORRADOR\nPregunta principal: ${clean(values.question)}\nTipo: ${clean(values.type)}\n\nRAMAS\n${branches.map((branch, index) => `${index + 1}. ${branch}\n   Hipótesis o nota: ${clean(values.hypotheses) || "Por formular"}\n   Evidencia necesaria: ${clean(values.evidence) || "Por definir"}\n   Prioridad: ${clean(values.priority) || "Por revisar"}`).join("\n")}\n\nREVISIÓN MANUAL\n□ Cada rama ayuda a responder la pregunta principal\n□ Las ramas no repiten el mismo análisis\n□ No falta una categoría decisiva\n□ Las hojas pueden investigarse con una acción concreta`;
  return { errors: {}, output, warnings };
}

const priorityLabel = ({ value, evidence, risk, effort, urgency }) => {
  const high = [value, evidence, risk, urgency].filter((item) => item === "Alto").length;
  if (value === "Alto" && effort !== "Alto") return "Primero";
  if (risk === "Alto" || urgency === "Alto" || high >= 3) return "Planificar pronto";
  if (value === "Bajo" && effort === "Alto") return "Diferir o descartar";
  return "Verificación secundaria";
};

export function prioritizeAnalysis(values) {
  const errors = validate(values, ["question", "value", "evidence", "risk", "effort"]);
  if (Object.keys(errors).length) return { errors, output: "", warnings: [] };
  const group = priorityLabel(values);
  const warnings = [clean(values.dependency) && `Dependencia declarada: ${clean(values.dependency)}. Verifica su secuencia antes de comenzar.`, values.risk === "Alto" && "Un riesgo alto merece revisión aunque el análisis sea costoso."].filter(Boolean);
  const output = `PRIORIZACIÓN VERA\n${line("Pregunta", values.question)}\n${line("Valor para la decisión", values.value)}\n${line("Evidencia disponible", values.evidence)}\n${line("Riesgo de ignorarla", values.risk)}\n${line("Accesibilidad / esfuerzo", values.effort)}\n${line("Urgencia", values.urgency)}\n${line("Dependencia", values.dependency, "Ninguna declarada")}\n\nGRUPO SUGERIDO: ${group}\nEste grupo es una orientación cualitativa. Reordena si aparecen riesgos de seguridad, exigencias normativas, dependencias críticas o evidencia nueva.\n\nREGLA DE PARADA\nDefine qué hallazgo sería suficiente para decidir y qué resultado exigiría profundizar.`;
  return { errors: {}, output, warnings };
}

export function buildWorkPlan(values) {
  const errors = validate(values, ["workstream", "question", "hypothesis", "analysis", "owner", "due"]);
  if (Object.keys(errors).length) return { errors, output: "", warnings: [] };
  const warnings = [!clean(values.source) && "Identifica una fuente y revisa su calidad.", !clean(values.stop) && "Define una regla de parada para evitar análisis sin fin.", !clean(values.output) && "Aclara qué entregable alimentará la decisión."].filter(Boolean);
  const output = `PLAN DE TRABAJO\n${line("Frente", values.workstream)}\n${line("Pregunta", values.question)}\n${line("Hipótesis provisional", values.hypothesis)}\n${line("Análisis", values.analysis)}\n${line("Datos necesarios", values.data)}\n${line("Fuente", values.source)}\n${line("Responsable", values.owner)}\n${line("Colaboradores", values.collaborators)}\n${line("Fecha objetivo", values.due)}\n${line("Dependencia", values.dependency, "Ninguna declarada")}\n${line("Resultado esperado", values.output)}\n${line("Punto de revisión", values.review)}\n${line("Regla de parada", values.stop)}\n\nCONTROL DE EVIDENCIA\nEtiqueta cada insumo como hecho, supuesto, estimación, interpretación o incógnita. Revisa el plan cuando una evidencia cambie la hipótesis.`;
  return { errors: {}, output, warnings };
}

export function buildRecommendation(values) {
  const errors = validate(values, ["question", "decision", "findings", "evidence", "next", "owner"]);
  if (Object.keys(errors).length) return { errors, output: "", warnings: [] };
  const warnings = [!clean(values.risks) && "Explicita al menos un riesgo y una respuesta.", !clean(values.conditions) && "Aclara bajo qué condiciones se sostiene la recomendación.", !clean(values.metric) && "Define una métrica y una fecha de revisión."].filter(Boolean);
  const concise = `${clean(values.decision)}. La recomendación se apoya en ${clean(values.findings)} y se ejecutaría primero mediante ${clean(values.next)}, bajo responsabilidad de ${clean(values.owner)}.`;
  const output = `RECOMENDACIÓN EJECUTIVA\n${concise}\n\nHIA\nHallazgo: ${clean(values.findings)}\nImplicación: este hallazgo cambia la respuesta a “${clean(values.question)}”.\nAcción: ${clean(values.next)}\n\nDECIR\nDecisión: ${clean(values.decision)}\nEvidencia: ${clean(values.evidence)}\nCondiciones: ${clean(values.conditions) || "Por explicitar"}\nImpacto esperado: ${clean(values.impact) || "Por estimar sin falsa precisión"}\nRiesgos: ${clean(values.risks) || "Por identificar"}\n\nIMPLEMENTACIÓN\nResponsable: ${clean(values.owner)}\nMétrica y revisión: ${clean(values.metric) || "Por definir"}\nIncertidumbre visible: la conclusión debe revisarse si aparece evidencia que contradiga los hallazgos.`;
  return { errors: {}, output, warnings };
}

export function buildBiasReview(values) {
  const errors = validate(values, ["decision", "preferred", "alternatives", "supporting", "contradicting", "assumptions", "review"]);
  if (Object.keys(errors).length) return { errors, output: "", warnings: [] };
  const warnings = [!clean(values.stakeholders) && "Falta una perspectiva afectada o necesaria para ejecutar.", !clean(values.anchor) && "Registra el primer número o explicación para revisar su posible influencia.", !clean(values.failure) && "Imagina un fracaso plausible antes de cerrar."].filter(Boolean);
  const output = `REVISIÓN DE LA DECISIÓN\n${line("Decisión propuesta", values.decision)}\n${line("Explicación preferida", values.preferred)}\n${line("Alternativas consideradas", values.alternatives)}\n${line("Evidencia a favor", values.supporting)}\n${line("Evidencia en contra", values.contradicting)}\n${line("Primer anclaje", values.anchor)}\n${line("Perspectivas consultadas", values.stakeholders)}\n${line("Supuestos", values.assumptions)}\n${line("Escenario de fracaso", values.failure)}\n${line("Fecha de revisión", values.review)}\n\nPREGUNTAS DE DESAFÍO\n¿Qué evidencia refutaría la explicación preferida?\n¿Qué alternativa no recibió una prueba justa?\n¿Quién soportaría el costo de estar equivocados?\n¿Qué restricción es real y cuál fue asumida?\n\nREGISTRO\nDocumenta quién decide, por qué, qué incertidumbre permanece y cuándo se revisará. Esta revisión no diagnostica sesgos psicológicos.`;
  return { errors: {}, output, warnings };
}
