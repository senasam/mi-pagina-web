const clean = (value) => String(value ?? "").trim();
const required = (values, names) => Object.fromEntries(names.filter((name) => !clean(values[name])).map((name) => [name, "Completa este campo."]));
const lines = (title, entries) => [title, "", ...entries.map(([label, value]) => `${label}: ${clean(value) || "Por investigar"}`)].join("\n");

export const marketingMetricDefinitions = {
  conversion: { name: "Tasa de conversión", formula: "Conversiones ÷ visitas elegibles", numerator: "Conversiones", denominator: "Visitas elegibles", unit: "%", limitation: "El denominador y la calidad del tráfico cambian la interpretación." },
  ctr: { name: "CTR", formula: "Clics ÷ impresiones", numerator: "Clics", denominator: "Impresiones", unit: "%", limitation: "Un clic no demuestra valor ni rentabilidad." },
  cpc: { name: "Costo por clic", formula: "Costo ÷ clics", numerator: "Costo", denominator: "Clics", unit: "moneda", limitation: "No informa la calidad posterior del clic." },
  cpa: { name: "Costo por adquisición", formula: "Costo ÷ adquisiciones", numerator: "Costo", denominator: "Adquisiciones", unit: "moneda", limitation: "La adquisición debe definirse y atribuirse con cuidado." },
  cpl: { name: "Costo por lead", formula: "Costo ÷ leads", numerator: "Costo", denominator: "Leads", unit: "moneda", limitation: "No todos los leads tienen igual calidad." },
  revenueVisitor: { name: "Ingreso por visitante", formula: "Ingreso ÷ visitantes", numerator: "Ingreso", denominator: "Visitantes", unit: "moneda", limitation: "Ingreso no equivale a margen o beneficio." },
  aov: { name: "Valor medio del pedido", formula: "Ingreso de pedidos ÷ pedidos", numerator: "Ingreso", denominator: "Pedidos", unit: "moneda", limitation: "Puede subir por mezcla de productos, no por mejora general." },
  abandonment: { name: "Abandono de carrito", formula: "Carritos sin compra ÷ carritos creados", numerator: "Carritos sin compra", denominator: "Carritos creados", unit: "%", limitation: "La definición de carrito y periodo debe mantenerse." },
  repeat: { name: "Recompra", formula: "Clientes que repiten ÷ clientes elegibles", numerator: "Clientes que repiten", denominator: "Clientes elegibles", unit: "%", limitation: "La ventana debe ajustarse al ciclo de compra." },
  bounce: { name: "Rebote de email", formula: "Correos rebotados ÷ correos enviados", numerator: "Rebotes", denominator: "Enviados", unit: "%", limitation: "Distingue rebotes temporales y permanentes." },
  unsubscribe: { name: "Baja de email", formula: "Bajas ÷ correos entregados", numerator: "Bajas", denominator: "Entregados", unit: "%", limitation: "Una baja baja no demuestra satisfacción." },
  roas: { name: "ROAS", formula: "Ingreso atribuido ÷ costo publicitario", numerator: "Ingreso atribuido", denominator: "Costo publicitario", unit: "razón", limitation: "No equivale a beneficio ni demuestra incrementalidad." },
  roi: { name: "ROI simple", formula: "(Contribución incremental − costo) ÷ costo", numerator: "Contribución incremental menos costo", denominator: "Costo", unit: "%", limitation: "Depende de estimar incrementalidad y contribución." },
  cac: { name: "Costo de adquisición de cliente", formula: "Costo de adquisición ÷ clientes nuevos", numerator: "Costo de adquisición", denominator: "Clientes nuevos", unit: "moneda", limitation: "Define qué costos y clientes incluye." },
  clv: { name: "Valor simplificado del cliente", formula: "Valor medio × frecuencia × periodos × margen", numerator: "Valor esperado simplificado", denominator: "No aplica", unit: "moneda", limitation: "No existe una fórmula universal; cohortes, retención y descuento pueden cambiarla." },
  engagement: { name: "Interacción", formula: "Interacciones ÷ base elegida", numerator: "Interacciones", denominator: "Alcance, impresiones o seguidores", unit: "%", limitation: "Compara solo si el denominador es idéntico." },
  growth: { name: "Crecimiento", formula: "(Valor final − inicial) ÷ inicial", numerator: "Cambio", denominator: "Valor inicial", unit: "%", limitation: "Un inicio pequeño puede producir porcentajes engañosos." },
};

const metricExamples = {
  conversion: "4 registros ÷ 100 visitas elegibles = 4 %", ctr: "30 clics ÷ 2.000 impresiones = 1,5 %", cpc: "120 unidades monetarias ÷ 60 clics = 2", cpa: "600 ÷ 12 adquisiciones = 50", cpl: "300 ÷ 20 leads = 15", revenueVisitor: "2.400 ÷ 800 visitantes = 3", aov: "4.500 ÷ 90 pedidos = 50", abandonment: "45 carritos sin compra ÷ 150 creados = 30 %", repeat: "24 clientes que repiten ÷ 120 elegibles = 20 %", bounce: "8 rebotes ÷ 400 envíos = 2 %", unsubscribe: "3 bajas ÷ 300 entregados = 1 %", roas: "2.000 de ingreso atribuido ÷ 500 de publicidad = 4×", roi: "(900 de contribución incremental − 300 de costo) ÷ 300 = 200 %", cac: "1.200 de adquisición ÷ 24 clientes nuevos = 50", clv: "40 de valor × 3 compras × 2 periodos × 0,4 de margen = 96", engagement: "50 interacciones ÷ 1.000 personas alcanzadas = 5 %", growth: "(120 − 100) ÷ 100 = 20 %",
};

Object.entries(marketingMetricDefinitions).forEach(([key, item]) => {
  item.period = "Usa numerador y denominador del mismo periodo o cohorte.";
  item.interpretation = "Compáralo con una línea base y segmentos equivalentes antes de decidir.";
  item.example = `Ejemplo ficticio: ${metricExamples[key]}`;
});

export const toolConfigs = {
  diagnostic: { title: "Diagnóstico de marketing digital", path: "/herramientas/diagnostico-marketing-digital", event: "marketing_diagnostic_completed", fields: [
    ["business", "Tipo de negocio o actividad"], ["offer", "Oferta"], ["objective", "Objetivo principal"], ["audience", "Audiencia hipotética"], ["channels", "Canales actuales"], ["baseline", "Línea base disponible"], ["capabilities", "Capacidades internas"], ["budget", "Rango de recursos"], ["constraint", "Restricción principal"],
  ], build: buildDiagnostic },
  strategy: { title: "Crear una estrategia de marketing digital", path: "/herramientas/crear-estrategia-marketing-digital", event: "marketing_strategy_created", fields: [
    ["context", "Contexto del negocio"], ["objective", "Objetivo"], ["baseline", "Línea base"], ["audience", "Audiencia"], ["offer", "Oferta"], ["value", "Propuesta de valor"], ["competitors", "Alternativas consideradas"], ["constraints", "Restricciones"], ["channels", "Canales posibles"], ["metrics", "Métricas y decisión"], ["review", "Fecha de revisión", "date"],
  ], build: buildStrategy },
  journey: { title: "Mapa del recorrido del cliente", path: "/herramientas/mapa-recorrido-cliente", event: "marketing_journey_mapped", fields: [
    ["audience", "Audiencia basada en evidencia"], ["trigger", "Detonante"], ["goal", "Objetivo del cliente"], ["questions", "Preguntas por etapa"], ["touchpoints", "Puntos de contacto"], ["frictions", "Fricciones"], ["content", "Contenido necesario"], ["business", "Objetivo del negocio"], ["metrics", "Métricas"],
  ], build: buildJourney },
  audit: { title: "Auditoría de presencia digital", path: "/herramientas/auditoria-presencia-digital", event: "marketing_audit_completed", fields: [
    ["task", "Tarea principal de la persona"], ["discoverability", "Qué observaste sobre encontrabilidad"], ["accuracy", "Exactitud y consistencia"], ["mobile", "Experiencia móvil y accesibilidad"], ["trust", "Confianza e información"], ["conversion", "Ruta de acción"], ["measurement", "Medición disponible"], ["privacy", "Privacidad y permisos"],
  ], build: buildAudit },
  channels: { title: "Selector de canales de marketing", path: "/herramientas/seleccionar-canales-marketing", event: "marketing_channels_selected", fields: [
    ["objective", "Objetivo"], ["audience", "Audiencia y evidencia"], ["stage", "Etapa del recorrido", "select", ["Detonante", "Descubrimiento", "Evaluación", "Decisión", "Uso", "Continuidad"]], ["candidates", "Canales candidatos"], ["content", "Capacidad de contenido"], ["time", "Tiempo disponible"], ["budget", "Recursos económicos"], ["measurement", "Medición posible"], ["risks", "Dependencias y riesgos"],
  ], build: buildChannels },
  content: { title: "Plan de contenidos de marketing", path: "/herramientas/plan-contenidos-marketing", event: "marketing_content_plan_created", fields: [
    ["objective", "Objetivo"], ["audience", "Audiencia"], ["question", "Pregunta del cliente"], ["role", "Rol del contenido", "select", ["Atraer", "Aclarar", "Enseñar", "Demostrar", "Reducir incertidumbre", "Apoyar decisión", "Ayudar después", "Mantener relación"]], ["format", "Formato"], ["channel", "Canal"], ["cta", "Siguiente paso"], ["capacity", "Capacidad de producción"], ["review", "Revisión necesaria"], ["metric", "Métrica y decisión"],
  ], build: buildContent },
  measurement: { title: "Plan de medición de marketing", path: "/herramientas/plan-medicion-marketing", event: "marketing_measurement_plan_created", fields: [
    ["objective", "Objetivo"], ["baseline", "Línea base"], ["kpi", "Métrica principal"], ["support", "Métricas de apoyo"], ["source", "Fuente de datos"], ["definition", "Definición y denominador"], ["owner", "Responsable"], ["frequency", "Frecuencia"], ["segment", "Segmento"], ["threshold", "Umbral o regla de decisión"], ["limits", "Limitaciones"],
  ], build: buildMeasurement },
  metrics: { title: "Calculadora de métricas de marketing", path: "/herramientas/calculadora-metricas-marketing", event: "marketing_metric_calculated", fields: [
    ["metric", "Métrica", "select", Object.entries(marketingMetricDefinitions).map(([value, item]) => [value, item.name])], ["numerator", "Numerador o valor medio por compra", "number"], ["denominator", "Denominador", "number"], ["frequency", "Solo para valor del cliente: compras por periodo", "number"], ["cycles", "Solo para valor del cliente: periodos", "number"], ["margin", "Solo para valor del cliente: margen porcentual", "number"], ["period", "Periodo analizado"],
  ], build: buildMetric },
};

function buildDiagnostic(values) {
  const errors = required(values, ["business", "offer", "objective", "audience", "constraint"]); if (Object.keys(errors).length) return { errors };
  const warnings = [!clean(values.baseline) && "Falta una línea base antes de comparar resultados.", !clean(values.capabilities) && "No se documentó quién puede ejecutar y mantener el plan.", !clean(values.channels) && "Los canales deben elegirse después de objetivo y audiencia."].filter(Boolean);
  const output = lines("Diagnóstico CONECTA", [["Contexto", `${values.business}; ${values.offer}; límite: ${values.constraint}`], ["Objetivo", values.objective], ["Necesidad", values.audience], ["Experiencia", "Mapear preguntas, puntos de contacto y fricciones"], ["Canales", values.channels], ["Tácticas", "Elegir una acción sostenible después de completar fundamentos"], ["Aprendizaje", values.baseline], ["Módulos sugeridos", warnings.length ? "Fundamentos, clientes y recorrido, auditoría y medición" : "Estrategia, canales y contenidos"]]);
  return { errors: {}, output, warnings };
}

function buildStrategy(values) {
  const errors = required(values, ["context", "objective", "audience", "offer", "constraints", "review"]); if (Object.keys(errors).length) return { errors };
  const warnings = [!clean(values.baseline) && "El objetivo necesita una línea base verificable.", !clean(values.value) && "El posicionamiento todavía no tiene valor distintivo.", !clean(values.metrics) && "Define qué métrica apoyará qué decisión."].filter(Boolean);
  const output = lines("Brief CONECTA y META", [["Contexto", values.context], ["Objetivo / Magnitud", values.objective], ["Evidencia", values.baseline], ["Tensión", values.constraints], ["Aporte", "Confirmar conexión con el objetivo del negocio"], ["Audiencia y necesidad", values.audience], ["Oferta", values.offer], ["Posicionamiento", `${values.value || "Por definir"}; alternativas: ${values.competitors || "por investigar"}`], ["Canales", values.channels], ["Métricas", values.metrics], ["Revisión", values.review], ["Supuestos", "Audiencia, problema, valor y contribución requieren evidencia" ]]);
  return { errors: {}, output, warnings };
}

function buildJourney(values) {
  const errors = required(values, ["audience", "trigger", "goal", "questions", "frictions"]); if (Object.keys(errors).length) return { errors };
  const output = lines("Mapa accesible del recorrido", [["Audiencia", values.audience], ["Detonante", values.trigger], ["Objetivo", values.goal], ["Descubrimiento y evaluación", `${values.questions}; contactos: ${values.touchpoints || "por observar"}`], ["Decisión y uso", `Fricciones: ${values.frictions}`], ["Continuidad", values.content || "Definir apoyo posterior"], ["Objetivo del negocio", values.business], ["Métricas", values.metrics], ["Evidencia faltante", "Validar secuencia, preguntas y fricciones con investigación"]]);
  return { errors: {}, output, warnings: ["Este mapa es una hipótesis; el recorrido real puede no ser lineal."] };
}

function buildAudit(values) {
  const errors = required(values, ["task", "discoverability", "mobile", "conversion"]); if (Object.keys(errors).length) return { errors };
  const observations = [["Encontrabilidad", values.discoverability], ["Exactitud", values.accuracy], ["Móvil y accesibilidad", values.mobile], ["Confianza", values.trust], ["Conversión", values.conversion], ["Medición", values.measurement], ["Privacidad", values.privacy]];
  const missing = observations.filter(([, value]) => !clean(value)).map(([label]) => label);
  const output = lines("Revisión manual de presencia", [["Tarea crítica", values.task], ...observations, ["Correcciones rápidas", "Información contradictoria, enlaces rotos y siguiente paso"], ["Brechas estratégicas", missing.join(", ") || "Validar observaciones con personas usuarias"], ["Prioridad", "Corregir primero bloqueos de tarea, acceso, confianza y medición"]]);
  return { errors: {}, output, warnings: ["No es una auditoría técnica, legal ni de accesibilidad automatizada."] };
}

function buildChannels(values) {
  const errors = required(values, ["objective", "audience", "stage", "candidates", "content", "time", "risks"]); if (Object.keys(errors).length) return { errors };
  const lowCapacity = /poc|limit|baj|escas/i.test(`${values.content} ${values.time} ${values.budget}`);
  const output = lines("Selección CANAL", [["Cliente", values.audience], ["Acción", `${values.objective}; etapa: ${values.stage}`], ["Necesidad de recursos", `${values.content}; tiempo: ${values.time}; recursos: ${values.budget || "por definir"}`], ["Aprendizaje medible", values.measurement], ["Límite", values.risks], ["Canales candidatos", values.candidates], ["Canales a postergar", lowCapacity ? "Todo canal sin responsable, contenido reutilizable o medición" : "Los que dupliquen función o excedan capacidad" ]]);
  return { errors: {}, output, warnings: ["La herramienta compara funciones; no recomienda proveedores ni garantiza alcance."] };
}

function buildContent(values) {
  const errors = required(values, ["objective", "audience", "question", "role", "channel", "capacity"]); if (Object.keys(errors).length) return { errors };
  const output = lines("Plan de contenido sostenible", [["Objetivo", values.objective], ["Audiencia", values.audience], ["Pregunta", values.question], ["Rol", values.role], ["Pieza base", `${values.format || "Formato por decidir"} en ${values.channel}`], ["Siguiente paso", values.cta], ["Capacidad", values.capacity], ["Revisión", values.review || "Hechos, marca, derechos y accesibilidad"], ["Métrica y decisión", values.metric], ["Reutilización", "Derivar formatos solo si conservan contexto y calidad"]]);
  return { errors: {}, output, warnings: ["La frecuencia debe ajustarse a la capacidad real de producir, revisar e interactuar."] };
}

function buildMeasurement(values) {
  const errors = required(values, ["objective", "baseline", "kpi", "source", "definition", "threshold", "limits"]); if (Object.keys(errors).length) return { errors };
  const output = lines("Plan de medición", [["Objetivo", values.objective], ["Línea base", values.baseline], ["KPI", values.kpi], ["Apoyos", values.support], ["Fuente", values.source], ["Definición", values.definition], ["Responsable", values.owner], ["Frecuencia", values.frequency], ["Segmento", values.segment], ["Regla de decisión", values.threshold], ["Limitaciones", values.limits]]);
  return { errors: {}, output, warnings: ["Una asociación observada no demuestra causalidad; documenta cambios y factores externos."] };
}

function buildMetric(values) {
  const errors = required(values, ["metric", "numerator", "period"]); const def = marketingMetricDefinitions[values.metric];
  const numerator = Number(values.numerator), denominator = Number(values.denominator);
  if (!Number.isFinite(numerator) || numerator < 0) errors.numerator = "Usa un número igual o mayor que cero.";
  if (values.metric !== "clv" && (!Number.isFinite(denominator) || denominator <= 0)) errors.denominator = "El denominador debe ser mayor que cero.";
  const frequency = Number(values.frequency), cycles = Number(values.cycles), margin = Number(values.margin);
  if (values.metric === "clv") {
    if (!Number.isFinite(frequency) || frequency <= 0) errors.frequency = "Usa una frecuencia mayor que cero.";
    if (!Number.isFinite(cycles) || cycles <= 0) errors.cycles = "Usa un número de periodos mayor que cero.";
    if (!Number.isFinite(margin) || margin < 0 || margin > 100) errors.margin = "Usa un margen entre 0 y 100 %.";
  }
  if (!def) errors.metric = "Selecciona una métrica."; if (Object.keys(errors).length) return { errors };
  let result;
  if (values.metric === "clv") result = numerator * frequency * cycles * (margin / 100);
  else if (["conversion", "ctr", "abandonment", "repeat", "bounce", "unsubscribe", "roi", "engagement", "growth"].includes(values.metric)) result = numerator / denominator * 100;
  else result = numerator / denominator;
  const formatted = def.unit === "%" ? `${result.toFixed(2)} %` : def.unit === "razón" ? `${result.toFixed(2)}×` : result.toFixed(2);
  const inputs = values.metric === "clv" ? `${numerator} × ${frequency} × ${cycles} × ${margin / 100}` : `${def.numerator}: ${numerator}; ${def.denominator}: ${values.denominator}`;
  const output = lines(def.name, [["Fórmula", def.formula], ["Valores", inputs], ["Periodo", `${values.period}. ${def.period}`], ["Resultado", formatted], ["Interpretación", def.interpretation], ["Limitación", def.limitation], ["Ejemplo", def.example]]);
  return { errors: {}, output, warnings: [def.limitation] };
}
