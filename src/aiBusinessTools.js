const clean = (value) => String(value ?? "").trim();
const required = (values, fields) => Object.fromEntries(fields.filter((field) => !clean(values[field])).map((field) => [field, "Completa este campo."]));
const result = (errors, output = "", warnings = []) => ({ errors, output, warnings });
const lines = (title, pairs, ending) => `${title}\n\n${pairs.map(([label, value]) => `${label}: ${clean(value) || "Por definir"}`).join("\n")}\n\n${ending}`;

export function evaluateOpportunity(values) {
  const errors = required(values, ["problem", "users", "baseline", "metric", "alternative", "consequence"]);
  if (Object.keys(errors).length) return result(errors);
  const weakBaseline = !/\d/.test(values.baseline);
  return result({}, lines("REVISIÓN VALORA", [
    ["Valor", `${values.metric}. Línea base: ${values.baseline}`], ["Alcance", `${values.users}; proceso: ${values.process}`],
    ["Límites", values.consequence], ["Operación", values.owner], ["Recursos", values.data],
    ["Aprendizaje", `Comparar con ${values.alternative}; detener o ajustar si ${values.stop}`],
  ], "Patrón candidato: empezar con el alcance mínimo que permita medir el resultado. La herramienta no determina viabilidad técnica ni recomienda un proveedor."), weakBaseline ? ["La línea base no parece contener una medida. Define unidad, periodo y fuente antes del piloto."] : []);
}

export function selectPattern(values) {
  const errors = required(values, ["task", "input", "output", "sensitivity", "current", "consistency", "integration", "evaluation"]);
  if (Object.keys(errors).length) return result(errors);
  const retrieval = values.current === "Alta";
  const multimodal = values.input !== "Solo texto";
  const sensitive = values.sensitivity === "Alta";
  const candidate = `${multimodal ? "Modelo multimodal" : "Modelo de lenguaje"}${retrieval ? " con recuperación desde fuentes autorizadas" : " con instrucciones y ejemplos evaluados"}`;
  return result({}, lines("PATRÓN DE SOLUCIÓN CANDIDATO", [
    ["Tarea", values.task], ["Patrón inicial", candidate], ["Integración", values.integration], ["Evaluación disponible", values.evaluation],
    ["Validación técnica", "Calidad por tarea, latencia, volumen, permisos, costo y comportamiento ante ausencia de evidencia"],
    ["Alternativa mínima", "Probar primero proceso, reglas, instrucciones y recuperación antes de ajustar el modelo"],
  ], "No se recomienda un producto. El ajuste fino solo conviene si existe un comportamiento estable, datos adecuados y capacidad de evaluación y mantenimiento."), sensitive ? ["La sensibilidad alta exige clasificación de datos, mínimo privilegio y revisión de seguridad antes de probar."] : []);
}

export function chooseApproach(values) {
  const errors = required(values, ["useCase", "importance", "sensitivity", "customization", "integration", "capability", "time", "dependence"]);
  if (Object.keys(errors).length) return result(errors);
  let recommendation = "Configurar";
  if (values.capability === "Baja" && (values.sensitivity === "Alta" || values.customization === "Alta")) recommendation = "Diferir";
  else if (values.customization === "Alta" && values.integration === "Alta" && values.capability === "Alta") recommendation = "Construir";
  else if (values.integration === "Alta" || values.customization === "Media") recommendation = "Integrar";
  return result({}, lines("DECISIÓN DE ENFOQUE", [
    ["Caso", values.useCase], ["Orientación inicial", recommendation], ["Razón", `Personalización ${values.customization.toLowerCase()}, integración ${values.integration.toLowerCase()} y capacidad interna ${values.capability.toLowerCase()}.`],
    ["Contraste necesario", "Comparar costo total, control, portabilidad, tiempo, riesgos y una solución convencional"],
    ["Validar", "Datos, licencias, accesibilidad, seguridad, desempeño, soporte y estrategia de salida"],
  ], "Esta orientación no sustituye evaluación técnica, contractual, legal o financiera y no representa una recomendación de proveedor."));
}

export function evaluateAgent(values) {
  const errors = required(values, ["goal", "users", "data", "tools", "actions", "financial", "external", "reversible", "approval", "logging", "stop", "impact"]);
  if (Object.keys(errors).length) return result(errors);
  const high = values.financial === "Sí" || values.external === "Sí" || values.reversible === "No" || values.impact === "Alto";
  const missing = [values.approval === "No" && "aprobación humana", values.logging === "No" && "registro", !clean(values.stop) && "condición de parada"].filter(Boolean);
  const level = high ? "Preparar la acción y solicitar aprobación" : "Ejecutar solo una acción estrecha y reversible tras pruebas";
  return result({}, lines("REVISIÓN AUTORIZA", [
    ["Acción", values.actions], ["Usuario responsable", values.users], ["Trazabilidad", values.logging], ["Información", values.data],
    ["Revisión", values.approval], ["Interrupción", values.stop], ["Zona", `${values.tools}; impacto ${values.impact}`], ["Alternativa reversible", values.reversible],
    ["Nivel máximo sugerido", level], ["Salvaguardas faltantes", missing.join(", ") || "No identificadas en las respuestas; requieren validación independiente"],
  ], high ? "No automatices la ejecución final hasta demostrar reversibilidad, límites, aprobación y respuesta a incidentes." : "Aumentar autonomía requeriría una nueva evaluación y controles más fuertes."), high ? ["El impacto o los permisos descritos hacen inapropiada una autonomía amplia."] : []);
}

const number = (value) => Number.parseFloat(String(value).replace(",", ".")) || 0;
const money = (value) => new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(value);
export function calculateEconomics(values) {
  const errors = required(values, ["users", "frequency", "development", "integration", "governance", "training", "support", "timeSaved", "adoption", "hourValue", "horizon"]);
  if (Object.keys(errors).length) return result(errors);
  const users = number(values.users), frequency = number(values.frequency), horizon = Math.max(1, number(values.horizon));
  const initial = number(values.development) + number(values.integration) + number(values.training);
  const annual = users * number(values.subscription) * 12 + number(values.usage) * 12 + number(values.governance) + number(values.support);
  const gross = users * frequency * 12 * number(values.timeSaved) * number(values.hourValue);
  const adoption = Math.min(100, number(values.adoption)) / 100;
  const other = number(values.otherBenefit) + number(values.errorReduction);
  const scenarios = [["Conservador", .65, .8], ["Esperado", 1, 1], ["Optimista", 1.25, 1.15]].map(([name, benefitFactor, costFactor]) => {
    const benefit = gross * adoption * benefitFactor + other * benefitFactor;
    const operating = annual * costFactor;
    const net = benefit - operating;
    const roi = initial > 0 ? net / initial * 100 : null;
    const payback = net > 0 ? initial / (net / 12) : null;
    return `${name}: costo anual ${money(operating)} · beneficio incremental ${money(benefit)} · neto ${money(net)} · ROI simple ${roi === null ? "no calculable" : `${roi.toFixed(1)} %`} · recuperación ${payback === null ? "no alcanzada" : `${payback.toFixed(1)} meses`}`;
  });
  return result({}, `ECONOMÍA DE IA · MONEDA ELEGIDA POR EL USUARIO\n\nInversión inicial: ${money(initial)}\nHorizonte declarado: ${horizon} año(s)\n\n${scenarios.join("\n")}\n\nNo se convierte automáticamente toda capacidad liberada en ahorro. ROI y recuperación son aproximaciones simples: no incorporan valor temporal, impuestos, probabilidad completa, efectos distributivos ni todos los riesgos. Verifica supuestos y evita doble conteo.`, ["Los importes no incluyen precios de proveedores y conservan la moneda implícita que hayas usado."]);
}

export function designGovernance(values) {
  const errors = required(values, ["useCase", "users", "classification", "audience", "consequence", "review", "action", "logging", "retention", "incident", "stakeholders"]);
  if (Object.keys(errors).length) return result(errors);
  const high = values.classification === "Confidencial" || values.audience === "Externa" || values.consequence === "Alta" || values.action === "Sí";
  return result({}, lines("PLAN GUARDA", [
    ["Gobierno", `Nombrar dueño de proceso y aprobador para ${values.useCase}`], ["Uso permitido", `Usuarios: ${values.users}; audiencia: ${values.audience}`],
    ["Acceso", `Clasificación ${values.classification}; aplicar mínimo privilegio`], ["Revisión", values.review],
    ["Documentación", `Registrar versión, pruebas, fuentes, decisiones y retención: ${values.retention}`], ["Auditoría", `Revisar desempeño, registros (${values.logging}) e incidentes (${values.incident})`],
    ["Personas afectadas", values.stakeholders], ["Roles", "Dueño de proceso, datos, tecnología, seguridad, riesgo y respuesta a incidentes"],
  ], "Este plan es una lista de trabajo. No certifica cumplimiento, seguridad, legalidad ni idoneidad."), high ? ["La audiencia, los datos, la acción o la consecuencia requieren revisión especializada antes de un piloto."] : []);
}

export function designPilot(values) {
  const errors = required(values, ["problem", "users", "baseline", "hypothesis", "scope", "exclusions", "solution", "data", "oversight", "businessMetric", "qualityMetric", "riskMetric", "adoptionMetric", "costMetric", "duration", "stop", "decision"]);
  if (Object.keys(errors).length) return result(errors);
  return result({}, lines("BRIEF DE PILOTO", [
    ["Problema", values.problem], ["Usuarios", values.users], ["Línea base", values.baseline], ["Hipótesis", values.hypothesis],
    ["Alcance", values.scope], ["Exclusiones", values.exclusions], ["Solución y datos", `${values.solution}; ${values.data}`], ["Revisión humana", values.oversight],
    ["Métrica de negocio", values.businessMetric], ["Calidad", values.qualityMetric], ["Riesgo", values.riskMetric], ["Adopción", values.adoptionMetric], ["Costo", values.costMetric],
    ["Duración", values.duration], ["Parada", values.stop], ["Decisión al cierre", values.decision],
  ], "El piloto debe comparar resultados con la línea base y producir evidencia para detener, ajustar, ampliar o escalar; no para justificar una decisión ya tomada."));
}

export function buildAdoption(values) {
  const errors = required(values, ["change", "roles", "concerns", "skills", "training", "support", "incentives", "experiment", "signals", "owner", "review"]);
  if (Object.keys(errors).length) return result(errors);
  return result({}, lines("PLAN DE ADOPCIÓN", [
    ["Cambio de trabajo", values.change], ["Roles afectados", values.roles], ["Preocupaciones", values.concerns], ["Habilidades", values.skills],
    ["Formación situada", values.training], ["Soporte", values.support], ["Incentivos a revisar", values.incentives], ["Experimento", values.experiment],
    ["Señales", values.signals], ["Responsable", values.owner], ["Revisión", values.review],
  ], "No midas éxito solo por accesos o frecuencia. Observa uso pertinente, calidad, carga de revisión, confianza calibrada y efectos sobre las personas."));
}

export function evaluateScale(values) {
  const errors = required(values, ["value", "quality", "risk", "adoption", "economics", "ownership", "monitoring", "support", "change", "exit", "rollback", "gaps"]);
  if (Object.keys(errors).length) return result(errors);
  const negatives = ["No", "Débil"].reduce((count, word) => count + Object.values(values).filter((value) => value === word).length, 0);
  const orientation = negatives >= 3 ? "Detener o ajustar antes de ampliar" : negatives > 0 ? "Ampliar solo con alcance limitado" : "Preparar una ampliación gradual, no un despliegue automático";
  return result({}, lines("REVISIÓN DE ESCALA", [
    ["Orientación", orientation], ["Valor", values.value], ["Calidad", values.quality], ["Riesgo", values.risk], ["Adopción", values.adoption], ["Economía", values.economics],
    ["Propiedad", values.ownership], ["Monitoreo", values.monitoring], ["Soporte", values.support], ["Gestión de cambios", values.change], ["Salida", values.exit], ["Reversión", values.rollback], ["Brechas", values.gaps],
  ], "La preparación para escalar requiere evidencia independiente y un modelo operativo con autoridad para limitar, cambiar o retirar la solución."));
}
