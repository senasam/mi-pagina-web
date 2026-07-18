import { BROKERAGE_MODES, BROKERAGE_TAX } from "./brokerageEngine.js";

export const BROKERAGE_REVIEW_DATE = "2026-07-18";

export const brokeragePresets = Object.freeze([
  { id: "one-plus", label: "1% + IVA", mode: BROKERAGE_MODES.PERCENTAGE, amount: "1", taxTreatment: BROKERAGE_TAX.ADDED },
  { id: "one-quarter-plus", label: "1,25% + IVA", mode: BROKERAGE_MODES.PERCENTAGE, amount: "1,25", taxTreatment: BROKERAGE_TAX.ADDED },
  { id: "one-half-final", label: "1,5% final, IVA incluido", mode: BROKERAGE_MODES.PERCENTAGE, amount: "1,5", taxTreatment: BROKERAGE_TAX.INCLUDED },
  { id: "one-half-plus", label: "1,5% + IVA", mode: BROKERAGE_MODES.PERCENTAGE, amount: "1,5", taxTreatment: BROKERAGE_TAX.ADDED },
  { id: "two-final", label: "2% final", mode: BROKERAGE_MODES.PERCENTAGE, amount: "2", taxTreatment: BROKERAGE_TAX.INCLUDED },
  { id: "two-plus", label: "2% + IVA", mode: BROKERAGE_MODES.PERCENTAGE, amount: "2", taxTreatment: BROKERAGE_TAX.ADDED },
]);

export const brokerageEditorialBands = Object.freeze([
  { label: "1% + IVA", note: "Escenario comparativo bajo dentro de esta ayuda editorial." },
  { label: "1,25% a 1,5% + IVA", note: "Escenarios intermedios para explorar una negociación." },
  { label: "1,5% final", note: "Ejemplo útil para distinguir un total con IVA de una tasa neta." },
  { label: "2% + IVA", note: "Referencia comercial tradicional observada en propuestas, no tarifa legal." },
  { label: "Sobre 2% + IVA", note: "Escenario para revisar con atención alcance, exclusividad y complejidad." },
]);

export const brokerageServices = Object.freeze([
  ["sourcing", "Búsqueda de propiedades según criterios"],
  ["publication", "Publicación o difusión del inmueble"],
  ["visits", "Coordinación de visitas"],
  ["price-comparison", "Comparación de precios"],
  ["buyer-negotiation", "Negociación para el comprador"],
  ["seller-negotiation", "Negociación para el vendedor"],
  ["documents", "Recopilación de antecedentes del inmueble"],
  ["offer", "Coordinación de oferta"],
  ["reservation", "Coordinación de reserva"],
  ["promise", "Coordinación de promesa"],
  ["lender", "Coordinación con la institución financiera"],
  ["appraisal", "Coordinación de tasación"],
  ["title-study", "Coordinación del estudio de títulos"],
  ["deed", "Coordinación de escritura"],
  ["registration", "Seguimiento de inscripción"],
  ["delivery", "Coordinación de entrega"],
  ["observations", "Gestión de observaciones"],
  ["follow-up", "Seguimiento posterior a la firma"],
]);

export const brokerageQuestions = Object.freeze([
  "¿Quién encargó originalmente el servicio?",
  "¿El corredor actúa principalmente para el vendedor, para el comprador o presta servicios separados?",
  "¿El vendedor también pagará una comisión y por qué servicio?",
  "¿Cuál es la comisión neta?",
  "¿La cifra informada ya incluye IVA?",
  "¿Qué documento tributario se emitirá?",
  "¿Cuál es el monto total que tendría que pagar?",
  "¿Qué precio se usa como base del porcentaje?",
  "¿Qué tareas están incluidas?",
  "¿Qué tareas quedan excluidas?",
  "¿Cuándo se entiende cumplido o devengado el servicio?",
  "¿Cuándo debe pagarse la comisión?",
  "¿Qué ocurre si el financiamiento no es aprobado?",
  "¿Qué ocurre si el estudio de títulos detecta un problema?",
  "¿Qué ocurre si el vendedor desiste?",
  "¿Existe una comisión mínima?",
  "¿Existe un tope máximo?",
  "¿El encargo es exclusivo?",
  "¿El porcentaje o monto puede negociarse?",
  "¿Todas las condiciones quedarán documentadas por escrito?",
]);

export const brokerageTemplates = Object.freeze({
  percentage: "Antes de presentar una oferta, quisiera dejar documentado el corretaje. Propongo [porcentaje]% + IVA, pagadero en [momento], si se concreta la operación bajo las condiciones y tareas acordadas.",
  final: "Propongo un costo final de [porcentaje o monto], con IVA incluido. El acuerdo debería identificar las tareas, el documento tributario, el hito de pago y la condición que hace exigible la comisión.",
  dual: "Antes de acordar un pago, necesito confirmar si la otra parte también remunerará al intermediario y qué servicio específico recibiré como comprador.",
  fixed: "Como alternativa al porcentaje, propongo un monto de UF [monto], [+ IVA / IVA incluido], sujeto al cierre de la operación y a las condiciones escritas.",
});
