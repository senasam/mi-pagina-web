const clean = (value) => String(value ?? "").trim().replace(/\s+/g, " ");
const required = (values, names) => Object.fromEntries(names.filter((name) => !clean(values[name])).map((name) => [name, "Completa este campo."]));
const result = (errors, output = "", warnings = []) => ({ errors, output, warnings });

function planBuilder({ heading, fields, render, warnings = [] }) {
  return (values = {}) => {
    const errors = required(values, fields);
    if (Object.keys(errors).length) return result(errors);
    return result({}, `${heading}\n\n${render(values)}`, warnings);
  };
}

export const buildProspectingDiagnostic = planBuilder({
  heading: "DIAGNÓSTICO REUNIÓN",
  fields: ["offer", "market", "problem", "evidence", "channels", "time", "objective", "tracking"],
  render: (v) => `RELEVANCIA\nMercado: ${clean(v.market)}\nOferta: ${clean(v.offer)}\n\nEVIDENCIA\n${clean(v.evidence)}\n\nUSUARIO, NECESIDAD E IMPACTO\nProblema por validar: ${clean(v.problem)}\n\nOPORTUNIDAD DE CONVERSACIÓN\n${clean(v.objective)}\n\nNAVEGACIÓN\nCanales actuales: ${clean(v.channels)}\nTiempo disponible: ${clean(v.time)}\nRegistro: ${clean(v.tracking)}\n\nRECOMENDACIÓN\nComienza con fundamentos y cliente ideal. Si no puedes sostener relevancia o evidencia sin exagerar, no contactes todavía.`,
  warnings: ["Este diagnóstico no es una puntuación científica.", "No contactes si la fuente de datos es impropia o existe una negativa clara."],
});

export const buildIcp = planBuilder({
  heading: "PERFIL DE CLIENTE IDEAL Y FOCO",
  fields: ["industry", "model", "size", "process", "problem", "trigger", "fit", "exclusions", "roles"],
  render: (v) => `ORGANIZACIÓN\nIndustria: ${clean(v.industry)}\nModelo: ${clean(v.model)}\nTamaño o complejidad: ${clean(v.size)}\nProceso relevante: ${clean(v.process)}\n\nPROBLEMA Y SEÑAL\n${clean(v.problem)}\nSeñal observable: ${clean(v.trigger)}\n\nFOCO\nEncaje descrito: ${clean(v.fit)}\nContactabilidad: por confirmar con una fuente legítima\nOferta creíble: depende de evidencia comparable\n\nEXCLUSIONES\n${clean(v.exclusions)}\n\nROLES DE COMPRA POR VALIDAR\n${clean(v.roles)}\n\nVACÍOS\nConfirma quién vive el problema, quién responde por el resultado y qué evidencia falta antes de contactar.`,
  warnings: ["El ICP describe organizaciones; no es una persona ficticia ni autoriza estereotipos.", "Usa etiquetas cualitativas, no precisión inventada."],
});

export const buildValueProposition = planBuilder({
  heading: "PROPUESTA DE VALOR CAMBIO",
  fields: ["context", "effect", "improvement", "evidence", "uncertainty", "question"],
  render: (v) => `VERSIÓN BREVE\nPara organizaciones donde ${clean(v.context)}, ayudamos a explorar ${clean(v.improvement)} frente a ${clean(v.effect)}.\n\nBASE DE CREDIBILIDAD\n${clean(v.evidence)}\n\nINCERTIDUMBRE\n${clean(v.uncertainty)}\n\nVARIACIÓN PARA UNA CUENTA\nEn su contexto podría ser relevante revisar ${clean(v.effect)}; no asumimos que el problema exista ni que el resultado esté garantizado.\n\nPREGUNTA DE VALIDACIÓN\n${clean(v.question)}\n\nRIESGO DE AFIRMACIÓN\nComprueba permiso, comparabilidad, causalidad y periodo antes de usar cifras o nombres.`,
  warnings: ["Una capacidad puede contribuir a un resultado, pero no lo garantiza.", "No uses nombres ni resultados de clientes sin permiso."],
});

export const buildProspectingMessage = planBuilder({
  heading: "MENSAJE CLAVE",
  fields: ["context", "priority", "outcome", "evidence", "nextStep", "channel"],
  render: (v) => `CANAL\n${clean(v.channel)}\n\nBORRADOR\nTe contacto porque ${clean(v.context)}. Esto podría relacionarse con ${clean(v.priority)}, aunque prefiero validarlo antes de asumirlo. Hemos trabajado en ${clean(v.outcome)}; la base disponible es ${clean(v.evidence)}. ¿${clean(v.nextStep)}? Si no es relevante o prefieres que no vuelva a contactar, lo respeto.\n\nREVISIÓN CLAVE\nContexto legítimo: presente\nLectura cauta: presente\nAporte posible: presente\nVerificación: pendiente de la respuesta\nElección sencilla: presente`,
  warnings: ["Edita el borrador para que suene natural y sea exacto.", "No inventes familiaridad, eventos, referencias ni urgencia."],
});

export const buildSequence = planBuilder({
  heading: "SECUENCIA RITMO",
  fields: ["objective", "segment", "trigger", "channels", "firstValue", "secondValue", "spacing", "stopRule"],
  render: (v) => `OBJETIVO\n${clean(v.objective)}\n\nSEGMENTO Y RAZÓN\n${clean(v.segment)}\nSeñal: ${clean(v.trigger)}\n\nLISTA ORDENADA ACCESIBLE\n1. ${clean(v.channels)} — aportar ${clean(v.firstValue)}.\n2. Canal apropiado por decidir — aportar algo distinto: ${clean(v.secondValue)}.\n3. Cierre opcional — confirmar relevancia, pausar o terminar.\n\nTIEMPO\n${clean(v.spacing)}. No es una cadencia universal: adapta el intervalo al contexto.\n\nOPCIÓN DE SALIDA\n${clean(v.stopRule)}\n\nTRATAMIENTO DE RESPUESTAS\nInterés: acordar paso. Derivación: confirmar permiso. Momento: pausar con condición. Rechazo claro o exclusión: detener.`,
  warnings: ["Cada paso debe aportar contexto, evidencia o utilidad nueva.", "El silencio no autoriza contacto indefinido."],
});

export const buildObjectionPlan = planBuilder({
  heading: "PLAN ESCUCHA",
  fields: ["objection", "meaning", "agreement", "question", "utility", "decision"],
  render: (v) => `ENTENDER\nObjeción: ${clean(v.objection)}\nLectura posible: ${clean(v.meaning)}\n\nSEÑALAR ACUERDO\n${clean(v.agreement)}\n\nCLARIFICAR\n${clean(v.question)}\n\nUTILIDAD\n${clean(v.utility)}\n\nCERRAR O AVANZAR\n${clean(v.decision)}\n\nACEPTAR EL NO\nSi la negativa es clara, omite la pregunta y termina respetuosamente. No conviertas este plan en un libreto de presión.`,
  warnings: ["Una objeción puede indicar que corresponde pausar, derivar o cerrar.", "No intentes superar un rechazo claro."],
});

const number = (value) => Number(String(value).replace(",", "."));
const positive = (value) => Number.isFinite(number(value)) && number(value) > 0;
const validRate = (value) => positive(value) && number(value) <= 100;
const ceil = (value) => Math.ceil(value);

export function calculateProspecting(values = {}) {
  const errors = {};
  for (const name of ["revenue", "dealValue", "winRate", "opportunityMeetingRate", "meetingContactRate", "period"]) if (!clean(values[name])) errors[name] = "Completa este campo.";
  for (const name of ["revenue", "dealValue"]) if (clean(values[name]) && !positive(values[name])) errors[name] = "Ingresa un valor mayor que cero.";
  for (const name of ["winRate", "opportunityMeetingRate", "meetingContactRate"]) if (clean(values[name]) && !validRate(values[name])) errors[name] = "Usa un porcentaje mayor que 0 y menor o igual que 100.";
  if (Object.keys(errors).length) return result(errors);
  const wins = ceil(number(values.revenue) / number(values.dealValue));
  const opportunities = ceil(wins / (number(values.winRate) / 100));
  const meetings = ceil(opportunities / (number(values.opportunityMeetingRate) / 100));
  const contacts = ceil(meetings / (number(values.meetingContactRate) / 100));
  const lower = ceil(contacts / 1.2); const upper = ceil(contacts / 0.8);
  return result({}, `ESTIMACIÓN PARA ${clean(values.period).toUpperCase()}\n\nAcuerdos requeridos: ${wins}\nOportunidades calificadas: ${opportunities}\nReuniones realizadas: ${meetings}\nContactos entregados o realizados: ${contacts}\nRango de sensibilidad orientativo: ${lower}–${upper} contactos\n\nSUPUESTOS\nMeta de ingresos ÷ valor medio = acuerdos.\nAcuerdos ÷ tasa de ganancia = oportunidades.\nOportunidades ÷ tasa oportunidad/reunión = reuniones.\nReuniones ÷ tasa reunión/contacto = contactos.\n\nINTERPRETACIÓN\nEs una estimación de capacidad, no una promesa. Las tasas pueden cambiar por segmento, canal, mensaje, temporada y mercado.`, ["No uses la cifra para justificar volumen indiscriminado.", "Recalcula con una línea base comparable y conserva un rango."]);
}

export function buildDashboard(values = {}) {
  const names = ["accounts", "attempts", "responses", "positive", "booked", "held", "opportunities", "wins", "period"];
  const errors = required(values, names);
  for (const name of names.slice(0, -1)) if (clean(values[name]) && (!Number.isFinite(number(values[name])) || number(values[name]) < 0)) errors[name] = "Usa cero o un número positivo.";
  if (Object.keys(errors).length) return result(errors);
  const n = Object.fromEntries(names.slice(0, -1).map((name) => [name, number(values[name])]));
  if (n.responses > n.attempts) errors.responses = "Las respuestas no pueden superar los contactos intentados.";
  if (n.positive > n.responses) errors.positive = "Las respuestas positivas no pueden superar las respuestas.";
  if (n.held > n.booked) errors.held = "Las reuniones realizadas no pueden superar las agendadas.";
  if (n.opportunities > n.held) errors.opportunities = "Las oportunidades no pueden superar las reuniones realizadas.";
  if (n.wins > n.opportunities) errors.wins = "Los acuerdos no pueden superar las oportunidades.";
  if (Object.keys(errors).length) return result(errors);
  const rate = (a, b) => b === 0 ? "No calculable (denominador cero)" : `${((a / b) * 100).toFixed(1)} %`;
  const decision = n.attempts === 0 ? "No hay base para interpretar: prepara cuentas antes de contactar." : n.responses === 0 ? "Revisa entrega, relevancia, segmento y mensaje; considera pausar antes de aumentar volumen." : n.held === 0 ? "Examina el paso entre respuesta y reunión, además del encaje." : "Compara por segmento y canal antes de decidir un cambio.";
  return result({}, `TABLERO — ${clean(values.period).toUpperCase()}\n\nVOLUMEN\nCuentas objetivo: ${n.accounts}\nContactos intentados: ${n.attempts}\nRespuestas: ${n.responses}\nRespuestas positivas: ${n.positive}\nReuniones agendadas: ${n.booked}\nReuniones realizadas: ${n.held}\nOportunidades: ${n.opportunities}\nAcuerdos: ${n.wins}\n\nTASAS CON DENOMINADOR\nRespuesta = respuestas ÷ contactos: ${rate(n.responses, n.attempts)}\nRespuesta positiva = positivas ÷ contactos: ${rate(n.positive, n.attempts)}\nReunión agendada = agendadas ÷ contactos: ${rate(n.booked, n.attempts)}\nReunión realizada = realizadas ÷ agendadas: ${rate(n.held, n.booked)}\nOportunidad = oportunidades ÷ realizadas: ${rate(n.opportunities, n.held)}\nGanancia = acuerdos ÷ oportunidades: ${rate(n.wins, n.opportunities)}\n\nLECTURA\n${decision}`, ["Una tasa sin segmento, periodo y denominador puede ser engañosa.", "No optimices actividad sin observar relevancia, exclusiones y oportunidades."]);
}

const fields = {
  diagnostic: [["offer", "Oferta general *"], ["market", "Mercado objetivo *"], ["problem", "Problema que podría resolver *"], ["evidence", "Evidencia disponible *"], ["channels", "Canales actuales *"], ["time", "Tiempo disponible *"], ["contacts", "Relaciones existentes"], ["objective", "Objetivo de la primera conversación *"], ["tracking", "Método de registro *"]],
  icp: [["industry", "Industria *"], ["model", "Modelo de negocio *"], ["size", "Tamaño o complejidad *"], ["process", "Proceso relevante *"], ["problem", "Intensidad del problema *"], ["trigger", "Señal observable *"], ["fit", "Encaje estratégico *"], ["exclusions", "Criterios de exclusión *"], ["roles", "Roles de compra probables *"]],
  value: [["context", "Contexto del cliente *"], ["effect", "Afectación *"], ["improvement", "Mejora esperada *"], ["evidence", "Base de credibilidad *"], ["uncertainty", "Incertidumbre y dependencias *"], ["question", "Pregunta de validación *"]],
  message: [["channel", "Canal *", "select", ["Correo", "Teléfono", "LinkedIn", "Referencia", "Evento"]], ["context", "Contexto legítimo *"], ["priority", "Prioridad como hipótesis *"], ["outcome", "Aporte o resultado posible *"], ["evidence", "Evidencia breve *"], ["nextStep", "Elección sencilla *"]],
  sequence: [["objective", "Objetivo *"], ["segment", "Segmento *"], ["trigger", "Señal o razón *"], ["channels", "Primer canal y función *"], ["firstValue", "Valor del primer contacto *"], ["secondValue", "Valor nuevo del seguimiento *"], ["spacing", "Criterio de tiempo *"], ["stopRule", "Regla de parada *"]],
  objection: [["objection", "Objeción recibida *"], ["meaning", "Qué podría comunicar *"], ["agreement", "Qué puedes reconocer *"], ["question", "Pregunta opcional *"], ["utility", "Información útil *"], ["decision", "Avanzar, derivar, pausar o cerrar *", "select", ["Avanzar", "Derivar", "Pausar", "Cerrar", "No contactar"]]],
  calculator: [["revenue", "Meta de ingresos *", "number"], ["dealValue", "Valor medio por acuerdo *", "number"], ["winRate", "Tasa de ganancia (%) *", "number"], ["opportunityMeetingRate", "Tasa oportunidad/reunión (%) *", "number"], ["meetingContactRate", "Tasa reunión/contacto (%) *", "number"], ["period", "Periodo *"]],
  dashboard: [["accounts", "Cuentas objetivo *", "number"], ["attempts", "Contactos intentados *", "number"], ["responses", "Respuestas *", "number"], ["positive", "Respuestas positivas *", "number"], ["booked", "Reuniones agendadas *", "number"], ["held", "Reuniones realizadas *", "number"], ["opportunities", "Oportunidades calificadas *", "number"], ["wins", "Acuerdos ganados *", "number"], ["period", "Periodo *"]],
};

export const toolConfigs = {
  diagnostic: { title: "Diagnóstico de prospección B2B", path: "/herramientas/diagnostico-prospeccion-b2b", event: "prospecting_diagnostic_created", fields: fields.diagnostic, build: buildProspectingDiagnostic },
  icp: { title: "Definir cliente ideal B2B", path: "/herramientas/definir-cliente-ideal-b2b", event: "prospecting_icp_created", fields: fields.icp, build: buildIcp },
  value: { title: "Crear propuesta de valor B2B", path: "/herramientas/crear-propuesta-valor-b2b", event: "prospecting_value_created", fields: fields.value, build: buildValueProposition },
  message: { title: "Crear mensaje de prospección B2B", path: "/herramientas/crear-mensaje-prospeccion-b2b", event: "prospecting_message_created", fields: fields.message, build: buildProspectingMessage },
  sequence: { title: "Crear secuencia de prospección", path: "/herramientas/crear-secuencia-prospeccion", event: "prospecting_sequence_created", fields: fields.sequence, build: buildSequence },
  objection: { title: "Preparar respuestas a objeciones", path: "/herramientas/preparar-respuestas-objeciones", event: "prospecting_objection_created", fields: fields.objection, build: buildObjectionPlan },
  calculator: { title: "Calculadora de prospección B2B", path: "/herramientas/calculadora-prospeccion-b2b", event: "prospecting_calculator_completed", fields: fields.calculator, build: calculateProspecting },
  dashboard: { title: "Tablero de prospección B2B", path: "/herramientas/tablero-prospeccion-b2b", event: "prospecting_dashboard_created", fields: fields.dashboard, build: buildDashboard },
};

export const prospectingMetricDefinitions = {
  response: { name: "Tasa de respuesta", numerator: "Respuestas", denominator: "Contactos entregados", formula: "Respuestas ÷ contactos entregados", limitation: "No distingue intención." },
  positive: { name: "Respuesta positiva", numerator: "Respuestas positivas", denominator: "Contactos entregados", formula: "Positivas ÷ contactos entregados", limitation: "Requiere una definición estable de positiva." },
  booked: { name: "Reunión agendada", numerator: "Reuniones agendadas", denominator: "Contactos entregados", formula: "Agendadas ÷ contactos entregados", limitation: "No equivale a reunión realizada." },
  held: { name: "Reunión realizada", numerator: "Reuniones realizadas", denominator: "Reuniones agendadas", formula: "Realizadas ÷ agendadas", limitation: "No equivale a oportunidad." },
  opportunity: { name: "Tasa de oportunidad", numerator: "Oportunidades calificadas", denominator: "Reuniones realizadas", formula: "Oportunidades ÷ reuniones realizadas", limitation: "Depende de la definición de calificación." },
  win: { name: "Tasa de ganancia", numerator: "Acuerdos ganados", denominator: "Oportunidades o propuestas, declarado explícitamente", formula: "Ganadas ÷ denominador elegido", limitation: "No mezcles denominadores entre periodos." },
};
