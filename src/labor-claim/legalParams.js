// Parámetros legales versionados del evaluador de demanda laboral.
//
// Cada parámetro es una lista de tramos { valor, vigenteDesde, vigenteHasta, fuenteId, verificado, nota }.
// - vigenteDesde / vigenteHasta usan "YYYY-MM" (mes de devengamiento de la remuneración). vigenteHasta null = sin término.
// - verificado:false se muestra en la UI como "pendiente de verificar".
// - Las tasas se expresan como fracción (0,1 = 10%).
//
// Para actualizar: agrega un tramo nuevo con su vigenteDesde y cierra el anterior con vigenteHasta.
// No modifiques valores de tramos pasados salvo para corregir un error verificado.

const t = (valor, vigenteDesde, vigenteHasta, fuenteId, extra = {}) => ({ valor, vigenteDesde, vigenteHasta, fuenteId, verificado: true, ...extra });
const pending = (nota) => ({ verificado: false, nota });

const AFP_PRE_2020 = pending("Valor anterior a marzo de 2020 no contrastado con Previred; se asume igual al de marzo de 2020.");

export const AFP_OPTIONS = [
  { id: "capital", label: "AFP Capital" },
  { id: "cuprum", label: "AFP Cuprum" },
  { id: "habitat", label: "AFP Habitat" },
  { id: "modelo", label: "AFP Modelo" },
  { id: "planvital", label: "AFP PlanVital" },
  { id: "provida", label: "AFP Provida" },
  { id: "uno", label: "AFP Uno" },
];

export const legalParams = {
  // ——— Previsión (DL 3.500) ———
  tasaCuentaIndividualAfp: [t(0.10, "1981-05", null, "dl-3500")],
  tasaSalud: [t(0.07, "1981-05", null, "dl-3500", { nota: "Art. 84 DL 3.500; destino Fonasa (Ley 18.469 / DFL 1 de 2005) o Isapre." })],

  topeImponibleAfpUf: [
    t(73.2, "2015-01", "2015-12", "sp-topes-2026", pending("Tope 2015 no contrastado.")),
    t(74.3, "2016-01", "2016-12", "sp-topes-2026", pending("Tope 2016 no contrastado.")),
    t(75.7, "2017-01", "2017-12", "sp-topes-2026", pending("Tope 2017 no contrastado.")),
    t(78.3, "2018-01", "2018-12", "sp-topes-2026", pending("Tope 2018 no contrastado.")),
    t(79.3, "2019-01", "2019-12", "sp-topes-2026", pending("Tope 2019 no contrastado.")),
    t(80.2, "2020-01", "2020-12", "previred-indicadores"),
    t(81.6, "2021-01", "2023-12", "previred-indicadores", { nota: "Enero 2021 se publicó 81,7 UF y luego se corrigió a 81,6 UF." }),
    t(84.3, "2024-01", "2024-12", "previred-indicadores"),
    t(87.8, "2025-01", "2025-12", "previred-indicadores"),
    t(89.9, "2026-01", "2026-01", "sp-topes-2026", { nota: "Res. exenta 26 de 2026, dejada sin efecto desde el 1 de febrero de 2026." }),
    t(90.0, "2026-02", null, "sp-topes-2026", { nota: "Res. 236 de 2026 de la Superintendencia de Pensiones." }),
  ],
  topeImponibleCesantiaUf: [
    t(109.8, "2015-01", "2015-12", "sp-topes-2026", pending("Tope 2015 no contrastado.")),
    t(111.4, "2016-01", "2016-12", "sp-topes-2026", pending("Tope 2016 no contrastado.")),
    t(113.5, "2017-01", "2017-12", "sp-topes-2026", pending("Tope 2017 no contrastado.")),
    t(117.5, "2018-01", "2018-12", "sp-topes-2026", pending("Tope 2018 no contrastado.")),
    t(119.1, "2019-01", "2019-12", "sp-topes-2026", pending("Tope 2019 no contrastado.")),
    t(120.4, "2020-01", "2020-12", "previred-indicadores"),
    t(122.6, "2021-01", "2023-12", "previred-indicadores"),
    t(126.6, "2024-01", "2024-12", "previred-indicadores"),
    t(131.8, "2025-01", "2025-02", "previred-indicadores"),
    t(131.9, "2025-03", "2025-12", "previred-indicadores"),
    t(135.1, "2026-01", "2026-01", "sp-topes-2026"),
    t(135.2, "2026-02", null, "sp-topes-2026"),
  ],

  // Tasa SIS de cargo del empleador, por mes de remuneración (Previred, contrastado mes a mes desde marzo 2020).
  tasaSis: [
    t(0.0115, "2014-07", "2016-06", "sp-sis", pending("Serie anterior a 2020 no contrastada.")),
    t(0.0141, "2016-07", "2018-06", "sp-sis", pending("Serie anterior a 2020 no contrastada.")),
    t(0.0153, "2018-07", "2020-06", "previred-indicadores", { nota: "Contrastado desde marzo 2020; inicio en julio 2018 pendiente de verificar." }),
    t(0.0199, "2020-07", "2020-12", "previred-indicadores"),
    t(0.0230, "2021-01", "2021-03", "previred-indicadores"),
    t(0.0194, "2021-04", "2021-06", "previred-indicadores"),
    t(0.0221, "2021-07", "2021-09", "previred-indicadores"),
    t(0.0185, "2021-10", "2022-03", "previred-indicadores"),
    t(0.0186, "2022-04", "2022-06", "previred-indicadores", pending("Cambio confirmado en mayo 2022; marzo y abril 2022 no contrastados.")),
    t(0.0184, "2022-07", "2022-09", "previred-indicadores", { nota: "Septiembre 2022 no contrastado." }),
    t(0.0154, "2022-10", "2022-12", "previred-indicadores"),
    t(0.0155, "2023-01", "2023-03", "previred-indicadores"),
    t(0.0161, "2023-04", "2023-06", "previred-indicadores"),
    t(0.0188, "2023-07", "2023-09", "previred-indicadores"),
    t(0.0147, "2023-10", "2023-12", "previred-indicadores"),
    t(0.0149, "2024-01", "2024-06", "previred-indicadores"),
    t(0.0201, "2024-07", "2024-09", "previred-indicadores"),
    t(0.0150, "2024-10", "2024-12", "previred-indicadores"),
    t(0.0138, "2025-01", "2025-03", "previred-indicadores"),
    t(0.0178, "2025-04", "2025-06", "previred-indicadores"),
    t(0.0188, "2025-07", "2025-09", "previred-indicadores"),
    t(0.0149, "2025-10", "2025-12", "previred-indicadores"),
    t(0.0154, "2026-01", "2026-04", "previred-indicadores"),
    t(0.0162, "2026-05", "2026-06", "previred-indicadores", { nota: "La Superintendencia informa 1,62% desde abril 2026; Previred lo aplica desde remuneraciones de mayo." }),
    t(0.0200, "2026-07", "2026-08", "previred-indicadores"),
    t(0.0178, "2026-09", null, "previred-indicadores"),
  ],

  // Comisión por depósito de cotizaciones, % de la remuneración imponible (cargo del trabajador).
  comisionAfp: {
    capital: [t(0.0144, "2015-01", "2020-02", "previred-indicadores", AFP_PRE_2020), t(0.0144, "2020-03", null, "previred-indicadores")],
    cuprum: [t(0.0144, "2015-01", "2020-02", "previred-indicadores", AFP_PRE_2020), t(0.0144, "2020-03", null, "previred-indicadores")],
    habitat: [t(0.0127, "2015-01", "2020-02", "previred-indicadores", AFP_PRE_2020), t(0.0127, "2020-03", null, "previred-indicadores")],
    planvital: [t(0.0116, "2015-01", "2020-02", "previred-indicadores", AFP_PRE_2020), t(0.0116, "2020-03", null, "previred-indicadores")],
    provida: [t(0.0145, "2015-01", "2020-02", "previred-indicadores", AFP_PRE_2020), t(0.0145, "2020-03", null, "previred-indicadores")],
    modelo: [t(0.0077, "2015-01", "2020-02", "previred-indicadores", AFP_PRE_2020), t(0.0077, "2020-03", "2021-09", "previred-indicadores"), t(0.0058, "2021-10", null, "previred-indicadores")],
    uno: [t(0.0069, "2019-10", "2020-02", "previred-indicadores", AFP_PRE_2020), t(0.0069, "2020-03", "2023-09", "previred-indicadores"), t(0.0049, "2023-10", "2025-09", "previred-indicadores"), t(0.0046, "2025-10", null, "previred-indicadores")],
  },

  // Ley 21.735, art. 4° transitorio. Desde agosto 2026 el SIS queda dentro del Seguro Social:
  // expectativa de vida = seguroSocial − tasa SIS (Previred: 0,50% + 2,00% en agosto; 0,72% + 1,78% desde septiembre 2026).
  aporteEmpleador21735: [
    t({ cuentaIndividual: 0, rentabilidadProtegida: 0, seguroSocial: 0, incluyeSis: false }, "1981-05", "2025-07", "ley-21735"),
    t({ cuentaIndividual: 0.001, rentabilidadProtegida: 0, seguroSocial: 0.009, incluyeSis: false }, "2025-08", "2026-07", "ley-21735"),
    t({ cuentaIndividual: 0.001, rentabilidadProtegida: 0.009, seguroSocial: 0.025, incluyeSis: true }, "2026-08", "2027-07", "ley-21735"),
    t({ cuentaIndividual: 0.0025, rentabilidadProtegida: 0.015, seguroSocial: 0.025, incluyeSis: true }, "2027-08", "2028-07", "ley-21735"),
    t({ cuentaIndividual: 0.01, rentabilidadProtegida: 0.015, seguroSocial: 0.025, incluyeSis: true }, "2028-08", "2029-07", "ley-21735"),
    t({ cuentaIndividual: 0.017, rentabilidadProtegida: 0.015, seguroSocial: 0.025, incluyeSis: true }, "2029-08", "2030-07", "ley-21735"),
    t({ cuentaIndividual: 0.024, rentabilidadProtegida: 0.015, seguroSocial: 0.025, incluyeSis: true }, "2030-08", "2031-07", "ley-21735"),
    t({ cuentaIndividual: 0.031, rentabilidadProtegida: 0.015, seguroSocial: 0.025, incluyeSis: true }, "2031-08", "2032-07", "ley-21735"),
    t({ cuentaIndividual: 0.038, rentabilidadProtegida: 0.015, seguroSocial: 0.025, incluyeSis: true }, "2032-08", "2033-07", "ley-21735"),
    t({ cuentaIndividual: 0.045, rentabilidadProtegida: 0.015, seguroSocial: 0.025, incluyeSis: true }, "2033-08", "2045-07", "ley-21735"),
  ],

  // ——— Seguro de cesantía (Ley 19.728), contrato indefinido ———
  cesantiaTrabajador: [t(0.006, "2002-10", null, "ley-19728")],
  cesantiaEmpleadorCic: [t(0.016, "2002-10", null, "ley-19728")],
  cesantiaEmpleadorFcs: [t(0.008, "2002-10", null, "ley-19728")],
  cesantiaMesesMaxCic: [t(132, "2002-10", null, "ley-19728", { nota: "Las cotizaciones a la CIC se enteran por un máximo de 11 años en cada relación laboral; el aporte al FCS continúa." })],

  // ——— Accidentes del trabajo (Ley 16.744) y SANNA ———
  accidentesBasica: [t(0.009, "1968-05", null, "ley-16744")],
  accidentesExtraordinaria: [
    t(0.0005, "1998-09", "2017-03", "ley-19578"),
    t(0.0004, "2017-04", "2017-12", "ley-21010"),
    t(0.00015, "2018-01", "2018-12", "ley-21010"),
    t(0.0001, "2019-01", "2019-12", "ley-21010"),
    t(0, "2020-01", null, "ley-21010"),
  ],
  tasaSanna: [
    t(0, "1900-01", "2017-03", "ley-21010"),
    t(0.0001, "2017-04", "2017-12", "ley-21010"),
    t(0.00015, "2018-01", "2018-12", "ley-21010"),
    t(0.0002, "2019-01", "2019-12", "ley-21010"),
    t(0.0003, "2020-01", null, "ley-21010"),
  ],

  // ——— Código del Trabajo ———
  topeIndemnizacionUf: [t(90, "1900-01", null, "ct-172")],
  maxAniosServicio: [t(11, "1900-01", null, "ct-163")],
  fraccionMesesQueCuentaComoAnio: [t(6, "1900-01", null, "ct-163", { nota: "Fracción superior a 6 meses cuenta como año completo." })],
  mesesAvisoPrevio: [t(1, "1900-01", null, "ct-162")],
  diasHabilesFeriadoAnual: [t(15, "1900-01", null, "ct-67")],
  maxPeriodosFeriadoAcumulados: [t(2, "1900-01", null, "ct-70")],
  divisorValorDia: [t(30, "1900-01", null, "dt-feriado-proporcional")],
  semanasPrenatal: [t(6, "1900-01", null, "ct-195")],
  semanasPostnatal: [t(12, "1900-01", null, "ct-195")],
  mesesFueroTrasPostnatal: [t(12, "1900-01", null, "ct-201")],
  tutelaRemuneracionesMin: [t(6, "1900-01", null, "ct-489")],
  tutelaRemuneracionesMax: [t(11, "1900-01", null, "ct-489")],
  diasHabilesPlazoDemanda: [t(60, "1900-01", null, "ct-168", { nota: "Mismo plazo para tutela (art. 486); se suspende al reclamar ante la Inspección del Trabajo, con máximo de 90 días hábiles." })],

  // ——— Ley 17.322: cotizaciones impagas ———
  factorInteresPenal: [t(1.5, "1900-01", null, "ley-17322", { nota: "Interés corriente para operaciones reajustables, aumentado en 50%, capitalizado mensualmente." })],
  tasaInteresCorrienteReajustableAnual: [t(0.045, "1900-01", null, "ley-17322", pending("Estimación de la tasa de interés corriente para operaciones reajustables; la CMF la fija mes a mes."))],
  multaDeclaracionUf: [t(0.75, "1900-01", null, "ley-17322", { nota: "Art. 22 a): 0,75 UF por trabajador y por período no declarado." })],
};

// Recargos sobre la indemnización por años de servicio, según la causal o acción.
export const TERMINATION_TYPES = [
  { id: "despido-injustificado", label: "Despido injustificado (causal del art. 159 o 161 mal aplicada)", recargos: [0.3, 0.5], recargoPorDefecto: 0.5, fuenteId: "ct-168", nota: "30% si se aplicó mal el art. 161 (necesidades de la empresa); 50% si se aplicó mal el art. 159." },
  { id: "despido-sin-causa", label: "Despido sin causa legal", recargos: [0.5], recargoPorDefecto: 0.5, fuenteId: "ct-168", nota: "50% cuando no se invocó ninguna causal legal." },
  { id: "falta-grave-inventada", label: "Falta grave inventada (art. 160 indebido)", recargos: [0.8, 1], recargoPorDefecto: 0.8, fuenteId: "ct-168", nota: "80% si la causal del art. 160 fue indebida; 100% si además se invocaron los N° 1, 5 o 6 del art. 160 y el juez declara el despido carente de motivo plausible." },
  { id: "autodespido", label: "Autodespido (art. 171)", recargos: [0.5, 0.8], recargoPorDefecto: 0.5, fuenteId: "ct-171", nota: "50% por incumplimiento grave (art. 160 N° 7, por ejemplo no pagar cotizaciones); hasta 80% por las causales del art. 160 N° 1 y 5." },
];

// Feriados. Los días con regla fija se calculan en holidays.js con estas fuentes.
export const holidayParams = {
  fixed: [
    { md: "01-01", label: "Año Nuevo", fuenteId: "ley-2977" },
    { md: "05-01", label: "Día del Trabajo", fuenteId: "ley-2977" },
    { md: "05-21", label: "Glorias Navales", fuenteId: "ley-2977" },
    { md: "07-16", label: "Virgen del Carmen", fuenteId: "ley-2977" },
    { md: "08-15", label: "Asunción de la Virgen", fuenteId: "ley-2977" },
    { md: "09-18", label: "Independencia Nacional", fuenteId: "ley-2977" },
    { md: "09-19", label: "Glorias del Ejército", fuenteId: "ley-2977" },
    { md: "11-01", label: "Todos los Santos", fuenteId: "ley-2977" },
    { md: "12-08", label: "Inmaculada Concepción", fuenteId: "ley-2977" },
    { md: "12-25", label: "Navidad", fuenteId: "ley-2977" },
  ],
  // Día del solsticio de invierno (hora de Chile continental), Ley 21.357, desde 2021.
  solsticioInvierno: { 2021: "06-21", 2022: "06-21", 2023: "06-21", 2024: "06-20", 2025: "06-20", 2026: "06-21", 2027: "06-21", 2028: "06-20", 2029: "06-20", 2030: "06-21", 2031: "06-21", 2032: "06-20", 2033: "06-20", 2034: "06-21", 2035: "06-21" },
  // Feriados extraordinarios por ley especial. Las elecciones caen en domingo y no alteran el conteo.
  extraordinarios: [
    { date: "2022-09-16", label: "Feriado extraordinario de Fiestas Patrias", fuenteId: "ley-2977", verificado: false },
  ],
};

export const LEGAL_PARAMS_REVIEWED_ON = "2026-10-17";
