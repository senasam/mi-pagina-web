// Estadísticas judiciales para estimar la probabilidad de ganar y la duración de un juicio por despido.
// No son normas legales: son datos empíricos con fuente, fecha y alcance. Revisar cuando se publiquen nuevos informes.
//
// Fuente principal: Libertad y Desarrollo, Serie Informe Justicia N° 34 (julio 2026), con datos del Poder Judicial
// procesados por el Observatorio Judicial: 43.565 sentencias por despido injustificado (2015–2025), 145 tribunales.

export const STATS_REVIEWED_ON = "2026-10-17";

// Tasa de acogimiento de la demanda cuando el juicio llega a sentencia (fracción).
export const acceptanceRates = {
  overall: 0.702,
  byCause: {
    sinCausal: 0.702, // despidos sin causal invocada (36% de las causas)
    necesidadesEmpresa: 0.834, // art. 161 inc. 1°
    conclusionObra: 0.73, // art. 159 N° 5
    vencimientoPlazo: 0.52, // art. 159 N° 4
    objetivas: 0.799, // arts. 159 y 161 en conjunto
    subjetivas: 0.606, // art. 160 en conjunto
  },
  byEmployer: {
    privada: 0.737,
    personaNatural: 0.671,
    municipalidad: 0.56,
    otroPublico: 0.457,
  },
  sourceIds: ["lyd-sij-34", "observatorio-judicial-despido"],
};

export const EMPLOYER_TYPES = [
  { id: "privada", label: "Empresa privada", rate: acceptanceRates.byEmployer.privada },
  { id: "personaNatural", label: "Persona natural (empleador individual)", rate: acceptanceRates.byEmployer.personaNatural },
  { id: "municipalidad", label: "Municipalidad o corporación municipal", rate: acceptanceRates.byEmployer.municipalidad },
  { id: "otroPublico", label: "Otro organismo público (servicio, gobierno regional, empresa estatal)", rate: acceptanceRates.byEmployer.otroPublico },
];

// Cómo terminan las causas por despido injustificado (2015–2025).
export const resolutionShares = { conciliacion: 0.36, avenimiento: 0.21, acuerdoTotal: 0.57, sourceIds: ["lyd-sij-34"] };

// Duración: no hay una cifra oficial reciente publicada. La serie disponible es de tramitación en primera instancia
// (Poder Judicial, vía Diario Financiero) y los ingresos se triplicaron entre 2021 y 2025, por lo que hoy podría ser mayor.
export const durations = {
  firstInstanceDays: { 2017: 87, 2020: 163, 2021: 218 },
  conciliationDays: { 2020: 143, 2021: 180 },
  supremeCourtLaborDays: 115, // duración promedio en la Sala Laboral y Previsional de la Corte Suprema
  appealsExtraMonths: [7, 20], // recursos ante Cortes y Corte Suprema; estimación de un abogado citada por la prensa
  sourceIds: ["df-duracion-2021", "df-duracion-2020", "pjud-numeros-cs"],
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Probabilidad de ganar sugerida: tasa de la causal ajustada por el tipo de empleador (relativo al promedio general).
// No existe un cruce publicado causal × empleador ni un dato específico para honorarios encubiertos o autodespido.
export function suggestWinProbability({ terminationType, surchargeRate, employerType = "privada" }) {
  const { byCause, overall } = acceptanceRates;
  let base;
  let causeLabel;
  let specific = true;
  if (terminationType === "despido-injustificado" && Number(surchargeRate) === 0.3) { base = byCause.necesidadesEmpresa; causeLabel = "necesidades de la empresa (art. 161)"; }
  else if (terminationType === "despido-injustificado") { base = (byCause.conclusionObra + byCause.vencimientoPlazo) / 2; causeLabel = "art. 159: conclusión de la obra 73,0% y vencimiento del plazo 52,0% (promedio)"; }
  else if (terminationType === "despido-sin-causa") { base = byCause.sinCausal; causeLabel = "despidos sin causal invocada"; }
  else if (terminationType === "falta-grave-inventada") { base = byCause.subjetivas; causeLabel = "causales del art. 160"; }
  else { base = overall; causeLabel = "promedio general (no hay dato publicado para el autodespido)"; specific = false; }
  const employer = EMPLOYER_TYPES.find((type) => type.id === employerType) || EMPLOYER_TYPES[0];
  const probability = clamp(Math.round(base * (employer.rate / overall) * 100) / 100, 0.05, 0.95);
  return { probability, base, causeLabel, employer, employerFactor: employer.rate / overall, specific, sourceIds: acceptanceRates.sourceIds };
}
