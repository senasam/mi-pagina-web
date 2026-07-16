export const sizingPrompts = [
  { category: "Consumo", prompt: "Estima el ingreso anual de servicios de reparación de bicicletas en una capital regional.", structure: "Bicicletas activas × proporción reparada al año × reparaciones × ticket." },
  { category: "Digital", prompt: "Estima las transacciones mensuales de billeteras digitales entre estudiantes universitarios de una ciudad.", structure: "Estudiantes × elegibilidad × adopción activa × transacciones mensuales." },
  { category: "Capacidad", prompt: "Estima la demanda mensual de sesiones de carga pública para vehículos eléctricos en una región.", structure: "Vehículos × proporción que usa red pública × sesiones por mes." },
  { category: "B2B", prompt: "Estima el mercado anual de mantenimiento de refrigeradores para pequeños comercios.", structure: "Comercios × equipos por comercio × servicios anuales × precio." },
  { category: "Servicios", prompt: "Estima los ingresos mensuales de espacios de cowork en una ciudad intermedia.", structure: "Centros × escritorios × ocupación × precio mensual." },
];

export function nextSizingPrompt(category, version = 0) {
  const matches = category === "Todas" ? sizingPrompts : sizingPrompts.filter((item) => item.category === category);
  return matches[Math.abs(version) % matches.length];
}

const clean = (value) => String(value || "").trim();

export function buildExperiment(values) {
  const required = ["decision", "population", "hypothesis", "treatment", "control", "kpi"];
  const errors = Object.fromEntries(required.filter((key) => !clean(values[key])).map((key) => [key, "Completa este campo para construir el brief."]));
  if (Object.keys(errors).length) return { errors, output: "", warnings: [] };
  const warnings = [];
  if (!clean(values.guardrails)) warnings.push("Define al menos un guardrail que no debería deteriorarse.");
  if (!clean(values.duration)) warnings.push("Aclara una duración suficiente para observar el comportamiento relevante.");
  if (!clean(values.cost) || !clean(values.benefit)) warnings.push("Falta información para evaluar economía incremental.");
  const output = `DECISIÓN\n${clean(values.decision)}\n\nPOBLACIÓN\n${clean(values.population)}\n\nHIPÓTESIS\n${clean(values.hypothesis)}\n\nTRATAMIENTO\n${clean(values.treatment)}\n\nCOMPARACIÓN\n${clean(values.control)}\n\nKPI PRINCIPAL\n${clean(values.kpi)}\n\nGUARDRAILS\n${clean(values.guardrails) || "Por definir"}\n\nDURACIÓN\n${clean(values.duration) || "Por definir"}\n\nECONOMÍA ESPERADA\nCosto: ${clean(values.cost) || "por definir"}\nBeneficio: ${clean(values.benefit) || "por definir"}\n\nRESTRICCIONES\n${clean(values.constraints) || "Por definir"}`;
  return { errors: {}, output, warnings };
}

const structurePrompts = {
  "Rentabilidad": ["Ingresos: precio, volumen y mix", "Costos: fijos, variables y unitarios", "Segmentos donde cambia el resultado", "Acciones, factibilidad y riesgo"],
  "Crecimiento": ["Clientes actuales y nuevos", "Frecuencia, ticket y retención", "Producto, canal y geografía", "Economía, capacidades y riesgo"],
  "Entrada a mercado": ["Atractivo del mercado", "Capacidad para competir", "Economía y umbral", "Modo de entrada, ejecución y riesgo"],
  "Operaciones": ["Demanda y nivel de servicio", "Proceso y cuello de botella", "Capacidad, personas y tecnología", "Costo, calidad y ejecución"],
  "Experimentación": ["Decisión e hipótesis", "Población, tratamiento y control", "KPI, guardrails e incrementalidad", "Economía, sesgos y escala"],
};

export function buildCaseStructure(values) {
  const required = ["type", "client", "objective", "metric"];
  const errors = Object.fromEntries(required.filter((key) => !clean(values[key])).map((key) => [key, "Completa este campo."]));
  if (Object.keys(errors).length) return { errors, branches: [], questions: [] };
  const branches = structurePrompts[values.type] || structurePrompts.Crecimiento;
  const questions = [
    `¿Cómo define ${clean(values.client)} el éxito en ${clean(values.metric)}?`,
    `¿Qué segmento, geografía o periodo explica el cambio?`,
    `¿Qué hecho conocido apoya o contradice la primera hipótesis?`,
    `¿Qué restricción podría cambiar la decisión sobre ${clean(values.objective)}?`,
  ];
  return { errors: {}, branches, questions };
}
