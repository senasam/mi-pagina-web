const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

const requiredFields = {
  userName: "Escribe tu nombre.",
  currentSituation: "Describe brevemente tu situación actual.",
  contactName: "Escribe el nombre de la persona que quieres contactar.",
  contactContext: "Indica su rol o contexto profesional.",
  organization: "Indica la empresa, universidad o industria.",
  objective: "Explica qué quieres conversar.",
  specificReason: "Incluye una razón específica para contactar a esta persona.",
};

export function validateMessageForm(values) {
  const errors = {};
  Object.entries(requiredFields).forEach(([field, message]) => {
    if (clean(values[field]).length < 2) errors[field] = message;
  });
  if (!["15", "20", "30"].includes(values.duration)) errors.duration = "Selecciona una duración.";
  if (!["linkedin", "email", "mensaje"].includes(values.channel)) errors.channel = "Selecciona un canal.";
  if (!["profesional", "cercano", "directo"].includes(values.tone)) errors.tone = "Selecciona un tono.";
  return errors;
}

const toneParts = {
  profesional: {
    greeting: (name) => `Hola, ${name}:`,
    request: (duration) => `¿Tendrías disponibilidad para una conversación de ${duration} minutos?`,
    close: "Muchas gracias por considerar la invitación.",
  },
  cercano: {
    greeting: (name) => `Hola, ${name}. ¿Cómo estás?`,
    request: (duration) => `¿Te acomodaría conversar ${duration} minutos en las próximas semanas?`,
    close: "Gracias desde ya por tu tiempo.",
  },
  directo: {
    greeting: (name) => `Hola, ${name}:`,
    request: (duration) => `¿Podríamos conversar durante ${duration} minutos?`,
    close: "Gracias por tu tiempo.",
  },
};

const connectors = [
  (v) => `Te contacto porque ${v.specificReason}. Me gustaría conversar sobre ${v.objective}.`,
  (v) => `El motivo de mi mensaje es concreto: ${v.specificReason}. Quisiera conocer tu perspectiva sobre ${v.objective}.`,
  (v) => `Elegí escribirte porque ${v.specificReason}. Estoy buscando orientación para conversar sobre ${v.objective}.`,
];

const introductions = [
  (v) => `Soy ${v.userName} y actualmente ${v.currentSituation}.`,
  (v) => `Mi nombre es ${v.userName}. En este momento, ${v.currentSituation}.`,
  (v) => `Soy ${v.userName}; actualmente ${v.currentSituation}.`,
];

export function generateNetworkingMessage(rawValues, variation = 0) {
  const errors = validateMessageForm(rawValues);
  if (Object.keys(errors).length) return { message: "", errors };

  const values = Object.fromEntries(Object.entries(rawValues).map(([key, value]) => [key, clean(value)]));
  const variant = Math.abs(variation) % connectors.length;
  const tone = toneParts[values.tone];
  const commonPoint = values.sharedConnection ? `Tenemos este punto en común: ${values.sharedConnection}.` : "";
  const contribution = values.contribution ? `Si te resulta útil, también puedo compartir ${values.contribution}.` : "";
  const context = `Vi tu experiencia como ${values.contactContext} en ${values.organization}.`;
  const body = [tone.greeting(values.contactName), introductions[variant](values), context, commonPoint, connectors[variant](values), contribution, tone.request(values.duration), tone.close, values.userName].filter(Boolean);

  if (values.channel === "email") {
    return { message: `Asunto: Consulta breve sobre ${values.objective}\n\n${body.join("\n\n")}`, errors: {} };
  }
  if (values.channel === "mensaje") {
    const compact = [tone.greeting(values.contactName), introductions[variant](values), context, commonPoint, connectors[variant](values), contribution, tone.request(values.duration), `Gracias, ${values.userName}`].filter(Boolean);
    return { message: compact.join(" "), errors: {} };
  }
  return { message: body.join("\n\n"), errors: {} };
}
