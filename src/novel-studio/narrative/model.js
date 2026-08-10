// Modelo de datos puro del módulo "Diseño Narrativo" (Fase 1).
// Sin React, sin DOM, sin dependencias del proyecto: lógica autocontenida
// para poder testearse con `node --test`.

export const NARRATIVE_SCHEMA_VERSION = 5;

const makeId = () => crypto.randomUUID();
export const nowIso = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Beats de historia y marcos estructurales
// ---------------------------------------------------------------------------

export function createStoryBeat({ title, description } = {}) {
  const now = nowIso();
  return {
    id: makeId(),
    title: title || '',
    description: description || '',
    codexIds: [],
    sceneIds: [],
    order: 0,
    status: 'borrador',
    createdAt: now,
    updatedAt: now,
  };
}

export function createFrameworkStage({ key, name, description } = {}) {
  return {
    id: makeId(),
    key: key || '',
    name: name || '',
    description: description || '',
    objective: '',
    guideQuestions: [],
    notes: '',
    // pendiente | explorando | definido | escrito | revisado | no-aplica
    status: 'pendiente',
    optional: false,
    omitted: false,
    position: 0,
    codexIds: [],
  };
}

export function createFrameworkInstance({ templateId, name, stages } = {}) {
  const now = nowIso();
  return {
    id: makeId(),
    templateId: templateId || null,
    name: name || '',
    stages: Array.isArray(stages) ? stages.map((s, i) => ({
      ...createFrameworkStage(s),
      position: typeof s?.position === 'number' ? s.position : i,
    })) : [],
    active: true,
    createdAt: now,
    updatedAt: now,
  };
}

// ---------------------------------------------------------------------------
// Brújula (fundamentos) y apertura
// ---------------------------------------------------------------------------

export function createFoundation() {
  return {
    idea: '',
    premisa: '',
    tema: '',
    preguntaTematica: '',
    contrapremisa: '',
    ideaControladora: '',
    valorInicial: '',
    valorFinal: '',
    causaCambio: '',
    conflictoCentral: '',
    protagonistaId: null,
    objetivoGlobal: '',
    necesidadInterna: '',
    antagonismo: '',
    stakes: '',
    estadoInicial: '',
    estadoFinal: '',
    simbolo: '',
    promesa: '',
    // Mapa campo → estado: sin-definir | borrador | definido | revisar
    fieldStatus: {},
  };
}

export function createOpening() {
  return {
    protagonistId: null,
    firstSceneId: null,
    firstStoryBeatId: null,
    deQuien: {
      pasado: '',
      formativas: '',
      cicatricesPositivas: '',
      cicatricesNegativas: '',
      capacidades: '',
      heridas: '',
      miedos: '',
      defectos: '',
      contradicciones: '',
      mostrar: '',
      ocultar: '',
    },
    deQue: {
      estadoNormal: '',
      incidente: '',
      queRompe: '',
      porQueReacciona: '',
      conflicto: '',
      objetivo: '',
      primeraDecision: '',
      primeraPregunta: '',
    },
    checklist: {
      personajeClaro: false,
      deseo: false,
      carencia: false,
      alteracion: false,
      objetivoVisible: false,
      razonSeguir: false,
    },
  };
}

// ---------------------------------------------------------------------------
// Personajes: perfil y arco
// ---------------------------------------------------------------------------

export function createCharacterProfile(codexId) {
  return {
    id: makeId(),
    codexId: codexId || null,
    importance: 'secundario',
    dramaticGoal: '',
    mainOpposition: '',
    activeDilemma: '',
    stakes: '',
    hiddenInformation: '',
    readerPromise: '',
    storyBeatIds: [],
    plotIds: [],
    sceneIds: [],
    // motor/conflicto/capacidades/expresion ya no se crean. Si existen en un
    // archivo antiguo, normalizeNarrative los conserva como notas heredadas.
    // Cada rol: { id, type, note, fromSceneId: null, toSceneId: null }
    roles: [],
    // positivo | negativo | plano | personalizado
    arcType: 'plano',
    updatedAt: nowIso(),
  };
}

export function createArcBeat({ label, text } = {}) {
  return {
    id: makeId(),
    label: label || '',
    text: text || '',
    sceneId: null,
    chapterId: null,
    storyBeatId: null,
    stageId: null,
    order: 0,
  };
}

export function createCharacterArc(codexId) {
  return {
    id: makeId(),
    codexId: codexId || null,
    // positivo | negativo | plano | personalizado
    type: 'plano',
    estadoInicial: '',
    creenciaInicial: '',
    puntoCiego: '',
    deseo: '',
    necesidad: '',
    resistencia: '',
    estadoFinal: '',
    nuevaCreencia: '',
    gano: '',
    perdio: '',
    notes: '',
    beats: [],
  };
}

export function createPlot({ name, type = 'principal', codexId = null, patternId = null } = {}) {
  return {
    id: makeId(),
    name: name || '',
    type,
    codexId,
    patternId,
    objective: '',
    conflict: '',
    progression: '',
    resolution: '',
    characterIds: [],
    storyBeatIds: [],
    chapterIds: [],
    sceneIds: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

// ---------------------------------------------------------------------------
// Diseño de escena y capítulo
// ---------------------------------------------------------------------------

export function createSceneDesign(sceneId) {
  return {
    id: makeId(),
    sceneId: sceneId || null,
    funciones: [],
    objetivo: '',
    oposicion: '',
    tacticas: '',
    giro: '',
    // Sugeridos: si | no | si-pero | no-y-ademas
    resultado: '',
    consecuencia: '',
    preguntaNarrativa: '',
    estadoInicial: '',
    estadoFinal: '',
    // Cada uno: { id, codexId, objetivo: '', tactica: '', sabe: '', oculta: '' }
    characterGoals: [],
    plotIds: [],
    arcIds: [],
    storyBeatIds: [],
    stageIds: [],
    dialogue: createDialogueDesign(),
    updatedAt: nowIso(),
  };
}

export function createDialogueParticipant(codexId) {
  return {
    id: makeId(), codexId: codexId || null, objective: '', tactic: '', tacticChanges: '',
    explicitInformation: '', implicitInformation: '', hiddenInformation: '', subtext: '',
  };
}

export function createDialogueDesign() {
  return {
    enabled: false,
    participants: [],
    powerBefore: '',
    powerAfter: '',
    powerShift: '',
    result: '',
    persuasion: { enabled: false, ethos: '', pathos: '', logos: '' },
  };
}

export function createChapterDesign(chapterId) {
  return {
    id: makeId(),
    chapterId: chapterId || null,
    funcionPrincipal: '',
    pregunta: '',
    povId: null,
    estadoInicial: '',
    objetivo: '',
    stakes: '',
    giro: '',
    estadoFinal: '',
    consecuencia: '',
    nuevaPregunta: '',
    // trama | personaje | relacion | informacion | tema | ritmo
    funcionesCumplidas: [],
    // objetivo-conflicto-desastre | reaccion-dilema-decision |
    // preparacion-confrontacion | investigacion-revelacion |
    // relacion-cambio | cuenta-regresiva | revelacion-retrospectiva
    modelo: '',
    pruebaNecesidad: {
      cambia: '',
      decide: '',
      masDificil: '',
      aprendeLector: '',
      obligaContinuar: '',
    },
    plotIds: [],
    updatedAt: nowIso(),
  };
}

export function createCausalLink({ action, sourceSceneId } = {}) {
  return {
    id: makeId(),
    action: action || '',
    immediateConsequence: '',
    delayedConsequence: '',
    sourceSceneId: sourceSceneId || null,
    payoffSceneId: null,
    characterIds: [],
    plotIds: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

// ---------------------------------------------------------------------------
// Tramas, conflictos, revelaciones, símbolos y tema
// ---------------------------------------------------------------------------

export function createPlotPatternInstance({ templateId, scope } = {}) {
  return {
    id: makeId(),
    templateId: templateId || null,
    // principal | secundaria | personaje
    scope: scope || 'principal',
    codexId: null,
    notes: '',
  };
}

export function createConflictThread({ name } = {}) {
  return {
    id: makeId(),
    name: name || '',
    protagonistaId: null,
    adversarioId: null,
    nonPersonalAdversary: '',
    protagonista: {
      objetivo: '',
      plan: '',
      recursos: '',
      debilidad: '',
    },
    adversario: {
      objetivo: '',
      plan: '',
      recursos: '',
      ventaja: '',
      estrategia: '',
    },
    incompatibilidad: '',
    // Cada item: { id, text, order }
    escalada: [],
    sceneIds: [],
    plotIds: [],
    storyBeatIds: [],
    updatedAt: nowIso(),
  };
}

export function createReveal({ info } = {}) {
  return {
    id: makeId(),
    title: '',
    info: info || '',
    quienDescubreId: null,
    quienSabiaIds: [],
    sceneId: null,
    storyBeatId: null,
    creiaAntes: '',
    sabeDespues: '',
    decisionQueProvoca: '',
    cambioEnPlan: '',
    updatedAt: nowIso(),
  };
}

export function createSymbolMotif({ name, type } = {}) {
  return {
    id: makeId(),
    name: name || '',
    // simbolo | imagen | metafora | objeto | lugar | gesto | sonido | frase
    type: type || 'simbolo',
    significado: '',
    codexIds: [],
    primeraAparicionSceneId: null,
    // Cada una: { id, sceneId, note }
    repeticiones: [],
    evolucion: '',
    transformacionFinal: '',
    finalPayoffSceneId: null,
    tracking: false,
    updatedAt: nowIso(),
  };
}

export function createThemeAxis() {
  return {
    valorA: '',
    valorB: '',
    personajesA: [],
    personajesB: [],
    decisionesConflicto: '',
    climaxTematico: '',
    conclusion: '',
    decisionPoints: [],
    sceneIds: [],
    storyBeatIds: [],
    updatedAt: nowIso(),
  };
}

export function createThemeDecision({ text, sceneId, storyBeatId } = {}) {
  return { id: makeId(), text: text || '', sceneId: sceneId || null, storyBeatId: storyBeatId || null, position: '', consequence: '' };
}

export function createFrameworkCorrespondence(values = {}) {
  return {
    id: makeId(),
    frameworkAId: values.frameworkAId || null,
    stageAId: values.stageAId || null,
    frameworkBId: values.frameworkBId || null,
    stageBId: values.stageBId || null,
    note: values.note || '',
    actIds: Array.isArray(values.actIds) ? values.actIds : [],
    plotIds: Array.isArray(values.plotIds) ? values.plotIds : [],
    characterIds: Array.isArray(values.characterIds) ? values.characterIds : [],
    createdAt: nowIso(), updatedAt: nowIso(),
  };
}

// ---------------------------------------------------------------------------
// Estructura raíz y normalización defensiva
// ---------------------------------------------------------------------------

export function emptyNarrative() {
  return {
    schemaVersion: NARRATIVE_SCHEMA_VERSION,
    storyBeats: [],
    frameworkInstances: [],
    // Cada item: { id, stageInstanceId, stageId, storyBeatIds: [], sceneIds: [], chapterIds: [], actIds: [] }
    assignments: [],
    foundation: createFoundation(),
    opening: createOpening(),
    characterProfiles: [],
    characterArcs: [],
    plots: [],
    sceneDesigns: {},
    chapterDesigns: {},
    causalLinks: [],
    plotPatterns: [],
    conflictThreads: [],
    reveals: [],
    symbols: [],
    themeAxis: createThemeAxis(),
    frameworkCorrespondences: [],
    acceptedAiProposals: [],
    dismissedDiagnostics: [],
    guidedStep: 0,
    updatedAt: nowIso(),
  };
}

const isPlainObject = (v) =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

// Mezcla defensiva: conserva lo válido de `value`, rellena con `defaults`.
// Arrays y valores nulos del default se sustituyen enteros (no se mezclan).
function deepMergeDefaults(value, defaults) {
  if (Array.isArray(defaults)) {
    return Array.isArray(value) ? value : defaults;
  }
  if (isPlainObject(defaults)) {
    const out = {};
    const src = isPlainObject(value) ? value : {};
    for (const key of Object.keys(defaults)) {
      out[key] = deepMergeDefaults(src[key], defaults[key]);
    }
    // Conserva claves extra que el usuario pudiera tener (forward-compatible)
    for (const key of Object.keys(src)) {
      if (!(key in out)) out[key] = src[key];
    }
    return out;
  }
  return value === undefined || value === null ? defaults : value;
}

// Nunca lanza: cualquier entrada inválida produce una estructura completa.
export function normalizeNarrative(value) {
  try {
    const base = emptyNarrative();
    if (!isPlainObject(value)) return base;
    const merged = deepMergeDefaults(value, base);
    merged.opening = deepMergeDefaults(merged.opening, createOpening());
    merged.characterProfiles = (Array.isArray(merged.characterProfiles) ? merged.characterProfiles : []).map((profile) => {
      const normalized = deepMergeDefaults(profile, createCharacterProfile(profile?.codexId || profile?.personajeId || null));
      normalized.codexId = normalized.codexId || profile?.personajeId || null;
      return normalized;
    });
    merged.characterArcs = (Array.isArray(merged.characterArcs) ? merged.characterArcs : []).map((arc) => {
      const normalized = deepMergeDefaults(arc, createCharacterArc(arc?.codexId || arc?.personajeId || null));
      normalized.codexId = normalized.codexId || arc?.personajeId || null;
      normalized.beats = (Array.isArray(arc?.beats) ? arc.beats : []).map((beat, index) => ({
        ...createArcBeat(), ...beat, order: typeof beat?.order === 'number' ? beat.order : index,
      }));
      return normalized;
    });
    const sourcePlots = Array.isArray(value.plots) ? value.plots : [];
    merged.plots = sourcePlots.map((plot) => deepMergeDefaults(plot, createPlot(plot)));
    merged.sceneDesigns = Object.fromEntries(Object.entries(isPlainObject(merged.sceneDesigns) ? merged.sceneDesigns : {}).map(([sceneId, design]) => {
      const normalized = deepMergeDefaults(design, createSceneDesign(design?.sceneId || sceneId));
      normalized.dialogue = deepMergeDefaults(design?.dialogue, createDialogueDesign());
      normalized.dialogue.participants = (Array.isArray(design?.dialogue?.participants) ? design.dialogue.participants : []).map((item) => deepMergeDefaults(item, createDialogueParticipant(item?.codexId)));
      return [sceneId, normalized];
    }));
    merged.chapterDesigns = Object.fromEntries(Object.entries(isPlainObject(merged.chapterDesigns) ? merged.chapterDesigns : {}).map(([chapterId, design]) => [chapterId, deepMergeDefaults(design, createChapterDesign(design?.chapterId || chapterId))]));
    merged.causalLinks = (Array.isArray(merged.causalLinks) ? merged.causalLinks : []).map((link) => deepMergeDefaults(link, createCausalLink(link)));
    merged.themeAxis = deepMergeDefaults(merged.themeAxis, createThemeAxis());
    merged.themeAxis.decisionPoints = (Array.isArray(merged.themeAxis.decisionPoints) ? merged.themeAxis.decisionPoints : []).map((item) => deepMergeDefaults(item, createThemeDecision(item)));
    merged.symbols = (Array.isArray(merged.symbols) ? merged.symbols : []).map((item) => {
      const symbol = deepMergeDefaults(item, createSymbolMotif(item));
      symbol.repeticiones = (Array.isArray(item?.repeticiones) ? item.repeticiones : []).map((repetition) => ({ id: repetition?.id || makeId(), sceneId: repetition?.sceneId || null, note: repetition?.note || '' , ...repetition }));
      return symbol;
    });
    merged.conflictThreads = (Array.isArray(merged.conflictThreads) ? merged.conflictThreads : []).map((item) => {
      const thread = deepMergeDefaults(item, createConflictThread(item));
      thread.escalada = (Array.isArray(item?.escalada) ? item.escalada : []).map((step, order) => ({ id: step?.id || makeId(), text: '', order, sceneId: null, storyBeatId: null, plotId: null, ...step }));
      return thread;
    });
    merged.reveals = (Array.isArray(merged.reveals) ? merged.reveals : []).map((item) => deepMergeDefaults(item, createReveal(item)));
    merged.frameworkCorrespondences = (Array.isArray(merged.frameworkCorrespondences) ? merged.frameworkCorrespondences : []).map((item) => deepMergeDefaults(item, createFrameworkCorrespondence(item)));
    merged.acceptedAiProposals = Array.isArray(merged.acceptedAiProposals) ? merged.acceptedAiProposals : [];
    merged.schemaVersion = NARRATIVE_SCHEMA_VERSION;
    return merged;
  } catch {
    return emptyNarrative();
  }
}
