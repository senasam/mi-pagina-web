// Diagnósticos del Diseño Narrativo.
// Lógica pura, sin React ni DOM. Cada heurística es una observación de mentor,
// nunca un error: el objetivo es hacer preguntas útiles, no señalar fallos.

import { flattenScenes } from "../model.js";
import { normalizeNarrative } from "./model.js";

const SEVERITY_INFO = "info";
const SEVERITY_AVISO = "aviso";
const SEVERITY_ATENCION = "atencion";

const clean = (value) => String(value ?? "").trim();
const isEmpty = (value) => clean(value) === "";
const normalized = (value) => clean(value).toLocaleLowerCase("es").replace(/\s+/g, " ");
const almostEqual = (a, b) => normalized(a) === normalized(b);

const emptyInvolved = () => ({
  sceneIds: [],
  chapterIds: [],
  codexIds: [],
  stageIds: [],
  beatIds: [],
});

function makeDiagnostic({ id, type, severity = SEVERITY_INFO, title, observed = "", why, where = "", involved = {}, suggestions = [], target = null }) {
  return {
    id,
    type,
    severity,
    title,
    observed: observed || title,
    why,
    where,
    involvedIds: { ...emptyInvolved(), ...involved },
    suggestions,
    target,
  };
}

function checkCompassConflict(narrative) {
  const foundation = narrative.foundation || {};
  const started = [foundation.protagonistaId, foundation.objetivoGlobal, foundation.conflictoCentral].some((item) => !isEmpty(item));
  if (!started || !isEmpty(foundation.conflictoCentral)) return [];
  return [makeDiagnostic({ id: 'brujula-sin-conflicto', type: 'brujula-sin-conflicto', severity: SEVERITY_AVISO, title: 'La Brújula todavía no define el conflicto central', observed: 'Hay protagonista u objetivo, pero el conflicto central está vacío.', why: 'Sin una fuerza opuesta reconocible es difícil evaluar si escenas y tramas aumentan la presión.', where: 'Brújula', suggestions: ['Describe qué fuerza impide alcanzar el objetivo global.'], target: { tab: 'brujula' } })];
}

function whereForScene({ act, chapter, scene, actIndex, chapterIndex, sceneIndex }) {
  const parts = [];
  parts.push(act?.title || `Acto ${actIndex + 1}`);
  parts.push(chapter?.title || `Capítulo ${chapterIndex + 1}`);
  parts.push(scene?.title || `Escena ${sceneIndex + 1}`);
  return parts.join(" · ");
}

function whereForChapter({ act, chapter, actIndex, chapterIndex }) {
  return `${act?.title || `Acto ${actIndex + 1}`} · ${chapter?.title || `Capítulo ${chapterIndex + 1}`}`;
}

// --- Heurísticas de fundamento (foundation / opening) ---

function checkProtagonistaObjetivo(narrative) {
  const foundation = narrative.foundation || {};
  const hasProtagonista = !isEmpty(foundation.protagonistaId);
  const hasObjetivo = !isEmpty(foundation.objetivoGlobal);
  if (hasProtagonista === hasObjetivo) return [];
  const codexIds = hasProtagonista ? [foundation.protagonistaId] : [];
  if (hasProtagonista) {
    return [makeDiagnostic({
      id: `protagonista-sin-objetivo:${foundation.protagonistaId}`,
      type: "protagonista-sin-objetivo",
      severity: SEVERITY_AVISO,
      title: "Tu protagonista todavía no tiene un objetivo global",
      why: "Sabemos quién conduce la historia, pero no qué quiere conseguir. Sin un deseo claro, las escenas pueden avanzar sin una dirección reconocible para el lector.",
      where: "Fundamento narrativo",
      involved: { codexIds },
      suggestions: ["Escribe una frase sencilla: qué quiere conseguir tu protagonista antes de que termine la historia."],
    })];
  }
  return [makeDiagnostic({
    id: "objetivo-sin-protagonista",
    type: "protagonista-sin-objetivo",
    title: "Hay un objetivo global, pero nadie lo persigue",
    why: "Definiste qué se quiere conseguir, aunque todavía no elegiste quién lo quiere. Un objetivo sin dueño puede quedar flotando sin nadie que lo haga visible en escena.",
    where: "Fundamento narrativo",
    suggestions: ["Elige qué personaje del codex desea esto con más fuerza."],
  })];
}

function checkIncidenteSinDecision(narrative) {
  const opening = narrative.opening || {};
  const deQue = opening.deQue || {};
  if (isEmpty(deQue.incidente) || !isEmpty(deQue.primeraDecision)) return [];
  return [makeDiagnostic({
    id: "incidente-sin-decision",
    type: "incidente-sin-decision",
    title: "¿Qué decisión provoca el incidente incitador?",
    why: "Tienes claro qué sacude el mundo de tu protagonista, pero no qué decide hacer a causa de ello. Cuando el incidente no empuja a una primera decisión, la historia puede tardar en ponerse en marcha.",
    where: "Apertura",
    suggestions: ["Piensa en la primera elección concreta que tu protagonista toma justo después del incidente."],
  })];
}

// --- Heurísticas de escena ---

function checkEscenaSinObjetivo(flat, sceneDesigns) {
  const out = [];
  for (const item of flat) {
    const design = sceneDesigns[item.scene.id];
    if (!design) continue;
    if (!isEmpty(design.objetivo)) continue;
    out.push(makeDiagnostic({
      id: `scene-sin-objetivo:${item.scene.id}`,
      type: "scene-sin-objetivo",
      title: "Esta escena todavía no tiene un objetivo claro",
      why: "Cuando nadie quiere nada concreto en una escena, los personajes pueden hablar o actuar sin tensión. Un objetivo pequeño y concreto suele bastar para que la escena tire hacia adelante.",
      where: whereForScene(item),
      involved: { sceneIds: [item.scene.id], chapterIds: [item.chapter.id] },
      suggestions: ["Pregúntate: ¿qué quiere conseguir el personaje POV en esta escena, aquí y ahora?"],
    }));
  }
  return out;
}

function checkEscenaSinOposicion(flat, sceneDesigns) {
  const out = [];
  for (const item of flat) {
    const design = sceneDesigns[item.scene.id];
    if (!design) continue;
    if (isEmpty(design.objetivo) || !isEmpty(design.oposicion)) continue;
    out.push(makeDiagnostic({
      id: `scene-sin-oposicion:${item.scene.id}`,
      type: "scene-sin-oposicion",
      title: "¿Qué se interpone en el objetivo de esta escena?",
      why: "El personaje quiere algo, pero nada parece resistirse. Sin oposición —otra persona, una circunstancia, una duda interna— la escena puede resolverse demasiado fácil y perder interés.",
      where: whereForScene(item),
      involved: { sceneIds: [item.scene.id], chapterIds: [item.chapter.id] },
      suggestions: ["Busca quién o qué puede decir «no» dentro de la escena."],
    }));
  }
  return out;
}

function checkEscenaSinCambio(flat, sceneDesigns) {
  const out = [];
  for (const item of flat) {
    const design = sceneDesigns[item.scene.id];
    if (!design) continue;
    const inicial = design.estadoInicial;
    const final = design.estadoFinal;
    const ambosVacios = isEmpty(inicial) && isEmpty(final);
    const iguales = !ambosVacios && almostEqual(inicial, final);
    const tieneProsa = (item.scene.wordCount || 0) > 0;
    if (!iguales && !(ambosVacios && tieneProsa)) continue;
    out.push(makeDiagnostic({
      id: `scene-sin-cambio:${item.scene.id}`,
      type: "scene-sin-cambio",
      title: "Esta escena podría no estar produciendo un cambio identificable",
      why: ambosVacios
        ? "La escena ya tiene texto escrito, pero no queda registrado qué cambia entre su inicio y su final. Si nada cambia, el lector puede sentir que la historia se queda quieta."
        : "El estado inicial y el final de la escena suenan casi iguales. Si la situación termina donde empezó, quizá la escena no esté moviendo la historia.",
      where: whereForScene(item),
      involved: { sceneIds: [item.scene.id], chapterIds: [item.chapter.id] },
      suggestions: ["Intenta completar: «Al final de la escena, X ya no puede seguir siendo como antes porque…»."],
    }));
  }
  return out;
}

// --- Heurísticas de capítulo ---

function checkCapituloSinAvance(flat, chapterDesigns) {
  const seen = new Map();
  for (const item of flat) {
    if (!seen.has(item.chapter.id)) seen.set(item.chapter.id, item);
  }
  const out = [];
  for (const item of seen.values()) {
    const design = chapterDesigns[item.chapter.id];
    if (!design) continue;
    if (!isEmpty(design.objetivo) || !isEmpty(design.giro) || !isEmpty(design.consecuencia)) continue;
    out.push(makeDiagnostic({
      id: `capitulo-sin-avance:${item.chapter.id}`,
      type: "capitulo-sin-avance",
      title: "Este capítulo todavía no registra cómo hace avanzar la historia",
      why: "Sin un objetivo, un giro o una consecuencia anotados, es difícil saber qué aporta este capítulo al conjunto. A veces el capítulo sí avanza y solo falta ponerlo en palabras.",
      where: whereForChapter(item),
      involved: { chapterIds: [item.chapter.id] },
      suggestions: ["Prueba con una frase: «Después de este capítulo, la situación ya no es la misma porque…»."],
    }));
  }
  return out;
}

// --- Heurísticas de reveals, adversarios, arcos, símbolos, perfiles ---

function checkRevealSinEfecto(narrative) {
  const out = [];
  for (const reveal of narrative.reveals || []) {
    if (isEmpty(reveal.info)) continue;
    if (!isEmpty(reveal.decisionQueProvoca) || !isEmpty(reveal.cambioEnPlan)) continue;
    out.push(makeDiagnostic({
      id: `reveal-sin-efecto:${reveal.id}`,
      type: "reveal-sin-efecto",
      title: "¿Qué decisión provoca esta revelación?",
      observed: `La revelación «${reveal.title || reveal.info}» no registra decisión ni cambio de plan.`,
      why: "La información está ahí, pero no parece cambiar lo que nadie decide ni lo que nadie planea. Una revelación que no altera nada puede pasar desapercibida para el lector.",
      where: reveal.titulo ? `Revelación: ${reveal.titulo}` : "Revelaciones",
      involved: { sceneIds: reveal.sceneId ? [reveal.sceneId] : [] },
      suggestions: ["Piensa qué hace distinto algún personaje justo después de saber esto."],
      target: { tab: 'tema', view: 'reveals', revealId: reveal.id },
    }));
  }
  return out;
}

function checkAdversarioSinObjetivo(narrative) {
  const out = [];
  for (const thread of narrative.conflictThreads || []) {
    if (isEmpty(thread.adversarioId) && isEmpty(thread.nonPersonalAdversary)) continue;
    const adversario = thread.adversario || {};
    if (!isEmpty(adversario.objetivo)) continue;
    out.push(makeDiagnostic({
      id: `adversario-sin-objetivo:${thread.adversarioId || thread.id}`,
      type: "adversario-sin-objetivo",
      severity: SEVERITY_AVISO,
      title: "Tu adversario todavía no quiere nada en concreto",
      why: "Un adversario que solo estorba puede sentirse plano. Cuando quiere algo propio —y eso choca con lo que quiere el protagonista— el conflicto suele volverse más creíble y más difícil de resolver.",
      where: thread.nombre ? `Conflicto: ${thread.nombre}` : "Hilos de conflicto",
      involved: { codexIds: thread.adversarioId ? [thread.adversarioId] : [] },
      target: { tab: 'tema', view: 'conflict', threadId: thread.id },
      suggestions: ["Pregúntate: ¿qué conseguiría tu adversario si el protagonista no existiera?"],
    }));
  }
  return out;
}

function checkArcoSinEvidencia(narrative) {
  const out = [];
  for (const arc of narrative.characterArcs || []) {
    if (isEmpty(arc.estadoFinal)) continue;
    if ((arc.beats || []).length > 0) continue;
    out.push(makeDiagnostic({
      id: `arco-sin-evidencia:${arc.id}`,
      type: "arco-sin-evidencia",
      title: "Este arco promete un cambio, pero todavía no hay escenas que lo muestren",
      why: "Sabemos en quién se convierte el personaje al final, aunque ningún momento concreto del recorrido enseña ese cambio ocurriendo. El lector suele creer los cambios cuando los ve paso a paso.",
      where: arc.codexId ? `Arco de personaje` : "Arcos de personaje",
      involved: { codexIds: arc.codexId ? [arc.codexId] : [] },
      suggestions: ["Elige dos o tres escenas donde el cambio del personaje se note en lo que hace, no solo en lo que piensa."],
    }));
  }
  return out;
}

function checkSimboloSinUso(narrative) {
  const out = [];
  for (const symbol of narrative.symbols || []) {
    if (!symbol.tracking) continue;
    const hasFirst = !isEmpty(symbol.primeraAparicionSceneId);
    const repetitions = symbol.repeticiones || [];
    const hasPayoff = !isEmpty(symbol.finalPayoffSceneId) || !isEmpty(symbol.transformacionFinal);
    if (hasFirst && repetitions.length > 0 && hasPayoff) continue;
    out.push(makeDiagnostic({
      id: `simbolo-sin-uso:${symbol.id}`,
      type: "simbolo-sin-uso",
      title: "Este motivo marcado para seguimiento aún no completa su recorrido",
      observed: `Primera aparición: ${hasFirst ? 'sí' : 'no'}; repeticiones: ${repetitions.length}; pago final: ${hasPayoff ? 'sí' : 'no'}.`,
      why: "Un motivo seguido suele ganar fuerza mediante aparición, repetición y transformación o pago.",
      where: symbol.nombre ? `Símbolo: ${symbol.nombre}` : "Símbolos",
      suggestions: ["Busca una escena temprana donde este símbolo pueda asomar de forma natural."],
      target: { tab: 'tema', view: 'symbols', symbolId: symbol.id },
    }));
  }
  return out;
}

function checkCharacterPlanning(narrative) {
  const out = [];
  for (const profile of narrative.characterProfiles || []) {
    const hasGoal = !isEmpty(profile.dramaticGoal);
    if (hasGoal && isEmpty(profile.mainOpposition)) out.push(makeDiagnostic({ id: `personaje-objetivo-sin-oposicion:${profile.id}`, type: 'personaje-objetivo-sin-oposicion', title: 'El objetivo de este personaje no tiene oposición registrada', observed: `Objetivo: ${profile.dramaticGoal}`, why: 'Un objetivo sin resistencia puede no producir decisiones dramáticas.', where: 'Personajes', involved: { codexIds: profile.codexId ? [profile.codexId] : [] }, suggestions: ['Define quién o qué puede impedirle conseguirlo.'], target: { tab: 'personajes', codexId: profile.codexId } }));
    if ((profile.roles || []).some((role) => !isEmpty(role.note)) && !(profile.sceneIds || []).length && !(profile.roles || []).some((role) => role.fromSceneId || role.toSceneId)) out.push(makeDiagnostic({ id: `personaje-funcion-sin-presencia:${profile.id}`, type: 'personaje-funcion-sin-presencia', title: 'Este personaje tiene función narrativa pero no presencia enlazada', observed: `${profile.roles.length} función(es) sin escenas relacionadas.`, why: 'Una función planeada necesita alguna evidencia en el manuscrito para llegar al lector.', where: 'Personajes', involved: { codexIds: profile.codexId ? [profile.codexId] : [] }, suggestions: ['Enlaza al menos una escena o un rango para esa función.'], target: { tab: 'personajes', codexId: profile.codexId } }));
  }
  return out;
}

function checkArcPlanning(narrative, structure) {
  const out = []; const order = new Map(); let index = 0;
  for (const act of structure?.acts || []) for (const chapter of act.chapters || []) for (const sceneId of chapter.sceneIds || []) order.set(sceneId, index++);
  for (const arc of narrative.characterArcs || []) {
    for (const beat of arc.beats || []) if (!beat.sceneId && !beat.chapterId && !beat.storyBeatId && !beat.stageId) out.push(makeDiagnostic({ id: `arco-hito-sin-enlace:${arc.id}:${beat.id}`, type: 'arco-hito-sin-enlace', title: 'Un hito de arco no tiene evidencia enlazada', observed: `Hito «${beat.label || 'sin título'}» sin escena, capítulo, momento ni etapa.`, why: 'Los hitos son más comprobables cuando apuntan a un elemento narrativo real.', where: 'Arcos', involved: { codexIds: arc.codexId ? [arc.codexId] : [] }, suggestions: ['Enlaza el hito o déjalo conscientemente como intención pendiente.'], target: { tab: 'arcos', arcId: arc.id } }));
    if (!isEmpty(arc.estadoFinal) && (arc.beats || []).length < 2) out.push(makeDiagnostic({ id: `arco-final-sin-preparacion:${arc.id}`, type: 'arco-final-sin-preparacion', title: 'El cambio final del arco tiene poca preparación registrada', observed: `Estado final definido con ${(arc.beats || []).length} hito(s).`, why: 'Una transformación suele resultar más creíble cuando varias decisiones la preparan.', where: 'Arcos', involved: { codexIds: arc.codexId ? [arc.codexId] : [] }, suggestions: ['Identifica una resistencia y una decisión que preparen el estado final.'], target: { tab: 'arcos', arcId: arc.id } }));
    const linked = (arc.beats || []).filter((beat) => order.has(beat.sceneId));
    if (linked.some((beat, i) => i > 0 && order.get(beat.sceneId) < order.get(linked[i - 1].sceneId))) out.push(makeDiagnostic({ id: `arco-orden-inconsistente:${arc.id}`, type: 'arco-orden-inconsistente', title: 'El orden del arco no coincide con el manuscrito', observed: 'Al menos un hito aparece antes en el manuscrito que el hito previo.', why: 'La visualización puede sugerir una transformación distinta de la que leerá el público.', where: 'Arcos', involved: { codexIds: arc.codexId ? [arc.codexId] : [], sceneIds: linked.map((item) => item.sceneId) }, suggestions: ['Reordena los hitos o revisa sus escenas enlazadas.'], target: { tab: 'arcos', arcId: arc.id } }));
  }
  return out;
}

function checkPlots(narrative, structure) {
  const out = []; const ordered = []; for (const act of structure?.acts || []) for (const chapter of act.chapters || []) ordered.push(...(chapter.sceneIds || []));
  for (const plot of narrative.plots || []) {
    const started = [plot.objective, plot.conflict, plot.progression, ...(plot.sceneIds || [])].some((item) => !isEmpty(item));
    if (!started) continue;
    if (isEmpty(plot.resolution)) out.push(makeDiagnostic({ id: `trama-sin-resolucion:${plot.id}`, type: 'trama-sin-resolucion', title: 'Esta trama no indica todavía cómo se resuelve', observed: `«${plot.name || 'Trama'}» tiene planificación o escenas, pero resolución vacía.`, why: 'Registrar una resolución permite distinguir una pausa deliberada de una trama abandonada.', where: 'Tramas', involved: { sceneIds: plot.sceneIds || [] }, suggestions: ['Indica una resolución prevista, incluso si será abierta.'], target: { tab: 'tramas', plotId: plot.id } }));
    const positions = (plot.sceneIds || []).map((id) => ordered.indexOf(id)).filter((value) => value >= 0);
    if (positions.length && Math.max(...positions) < ordered.length - 3 && isEmpty(plot.resolution)) out.push(makeDiagnostic({ id: `trama-posible-abandono:${plot.id}`, type: 'trama-posible-abandono', severity: SEVERITY_AVISO, title: 'Esta trama deja de aparecer antes del final', observed: `Última presencia en la escena ${Math.max(...positions) + 1} de ${ordered.length}.`, why: 'Una pausa larga puede ser intencional, pero conviene comprobar que el lector no espere un retorno.', where: 'Tramas', involved: { sceneIds: plot.sceneIds || [] }, suggestions: ['Marca su resolución o enlaza la escena donde vuelve o se cierra.'], target: { tab: 'tramas', plotId: plot.id } }));
  }
  return out;
}

function checkDetailedSceneChapter(narrative, flat) {
  const out = [];
  for (const item of flat) {
    const design = narrative.sceneDesigns?.[item.scene.id]; if (!design) continue;
    for (const [key, label] of [['giro', 'giro'], ['resultado', 'resultado']]) if (isEmpty(design[key])) out.push(makeDiagnostic({ id: `scene-sin-${key}:${item.scene.id}`, type: `scene-sin-${key}`, title: `Esta ficha de escena no registra ${label}`, observed: `El campo ${label} está vacío en una ficha iniciada.`, why: `Sin ${label}, puede ser difícil explicar qué cambia o cómo termina la confrontación.`, where: whereForScene(item), involved: { sceneIds: [item.scene.id], chapterIds: [item.chapter.id] }, suggestions: [`Formula el ${label} en una frase concreta.`], target: { tab: 'escenas', sceneId: item.scene.id } }));
  }
  for (const [chapterId, design] of Object.entries(narrative.chapterDesigns || {})) if (!(design.funcionesCumplidas || []).length) out.push(makeDiagnostic({ id: `capitulo-sin-funciones:${chapterId}`, type: 'capitulo-sin-funciones', title: 'Esta ficha de capítulo no indica qué funciones cumple', observed: 'No se marcó trama, personaje, relación, información, tema ni ritmo.', why: 'Las funciones ayudan a evaluar la necesidad del capítulo según tus propias intenciones.', where: 'Capítulos', involved: { chapterIds: [chapterId] }, suggestions: ['Marca al menos una función si el capítulo ya está planificado.'], target: { tab: 'capitulos', chapterId } }));
  return out;
}

function checkKnowledgeOrder(narrative, structure) {
  const out = []; const order = new Map(); let index = 0;
  for (const act of structure?.acts || []) for (const chapter of act.chapters || []) for (const sceneId of chapter.sceneIds || []) order.set(sceneId, index++);
  for (const reveal of narrative.reveals || []) {
    if (!reveal.sceneId || !reveal.quienDescubreId) continue;
    const knowledge = normalized(reveal.sabeDespues || reveal.info); if (knowledge.length < 4) continue;
    const revealOrder = order.get(reveal.sceneId); if (revealOrder === undefined) continue;
    for (const design of Object.values(narrative.sceneDesigns || {})) {
      if ((order.get(design.sceneId) ?? Number.MAX_SAFE_INTEGER) >= revealOrder) continue;
      const goal = (design.characterGoals || []).find((item) => item.codexId === reveal.quienDescubreId && normalized(item.sabe).includes(knowledge));
      if (goal) out.push(makeDiagnostic({ id: `conocimiento-adelantado:${reveal.id}:${design.sceneId}:${goal.id}`, type: 'conocimiento-adelantado', severity: SEVERITY_AVISO, title: 'Un personaje parece usar conocimiento antes de adquirirlo', observed: `La ficha de una escena anterior dice que ya sabe «${goal.sabe}».`, why: 'El orden del conocimiento afecta la continuidad de decisiones y revelaciones.', where: 'Revelaciones', involved: { sceneIds: [design.sceneId, reveal.sceneId], codexIds: [reveal.quienDescubreId] }, suggestions: ['Revisa el texto de conocimiento o mueve la revelación al punto correcto.'], target: { tab: 'tema', view: 'reveals', revealId: reveal.id } }));
    }
  }
  return out;
}

function checkSecundarioSinObjetivo(narrative) {
  const out = [];
  for (const profile of narrative.characterProfiles || []) {
    const objective = profile.dramaticGoal || profile.motor?.objetivoVisible;
    if (!isEmpty(objective)) continue;
    out.push(makeDiagnostic({
      id: `secundario-sin-objetivo:${profile.codexId || profile.id}`,
      type: "secundario-sin-objetivo",
      title: "¿Qué quiere este personaje cuando entra en escena?",
      why: "Los personajes secundarios con un deseo propio —aunque sea pequeño o equivocado— suelen dar escenas más vivas que los que solo reaccionan al protagonista.",
      where: "Perfiles de personaje",
      involved: { codexIds: profile.codexId ? [profile.codexId] : [] },
      suggestions: ["Completa: «En cada escena, este personaje intenta conseguir…»."],
    }));
  }
  return out;
}

function checkPhase2References(narrative, structure, codex) {
  const diagnostics = [];
  const codexIds = Array.isArray(codex) ? new Set(codex.map((item) => item.id)) : null;
  const sceneIds = structure ? new Set(Object.keys(structure.scenes || {})) : null;
  const chapterIds = structure ? new Set((structure.acts || []).flatMap((act) => (act.chapters || []).map((chapter) => chapter.id))) : null;
  const beatIds = new Set((narrative.storyBeats || []).map((item) => item.id));
  const stageIds = new Set((narrative.frameworkInstances || []).flatMap((item) => (item.stages || []).map((stage) => stage.id)));
  const plotIds = new Set((narrative.plots || []).map((item) => item.id));
  const arcIds = new Set((narrative.characterArcs || []).map((item) => item.id));
  const broken = (kind, ownerId, ids, known, involved) => {
    if (!known) return;
    const missing = (ids || []).filter((id) => id && !known.has(id));
    if (!missing.length) return;
    const targetByKind = { Personajes: { tab: 'personajes' }, Arcos: { tab: 'arcos' }, 'Hitos de arco': { tab: 'arcos' }, Tramas: { tab: 'tramas' }, Escenas: { tab: 'escenas' }, Capítulos: { tab: 'capitulos' }, Causalidad: { tab: 'capitulos' }, Inicio: { tab: 'inicio' }, Tema: { tab: 'tema', view: 'theme' }, Símbolos: { tab: 'tema', view: 'symbols' }, Conflicto: { tab: 'tema', view: 'conflict' }, Revelaciones: { tab: 'tema', view: 'reveals' } };
    diagnostics.push(makeDiagnostic({
      id: `referencia-rota:${kind}:${ownerId}:${missing.sort().join(',')}`,
      type: 'referencia-rota', severity: SEVERITY_ATENCION,
      title: 'Hay una referencia narrativa que ya no se puede resolver',
      why: 'El diseño se conserva para que puedas enlazarlo de nuevo; no se elimina automáticamente cuando cambia el Codex o el manuscrito.',
      where: kind,
      involved: { [involved]: missing },
      suggestions: ['Abre el elemento indicado y elige una referencia disponible, o conserva el enlace hasta poder repararlo.'],
      target: targetByKind[kind] || { tab: 'resumen' },
    }));
  };
  for (const profile of narrative.characterProfiles || []) {
    broken('Personajes', profile.id, [profile.codexId], codexIds, 'codexIds');
    broken('Personajes', profile.id, profile.sceneIds, sceneIds, 'sceneIds');
    broken('Personajes', profile.id, profile.storyBeatIds, beatIds, 'beatIds');
  }
  for (const arc of narrative.characterArcs || []) {
    broken('Arcos', arc.id, [arc.codexId], codexIds, 'codexIds');
    for (const beat of arc.beats || []) {
      broken('Hitos de arco', beat.id, [beat.sceneId], sceneIds, 'sceneIds');
      broken('Hitos de arco', beat.id, [beat.chapterId], chapterIds, 'chapterIds');
      broken('Hitos de arco', beat.id, [beat.storyBeatId], beatIds, 'beatIds');
      broken('Hitos de arco', beat.id, [beat.stageId], stageIds, 'stageIds');
    }
  }
  for (const plot of narrative.plots || []) {
    broken('Tramas', plot.id, plot.codexId ? [plot.codexId] : [], codexIds, 'codexIds');
    broken('Tramas', plot.id, plot.characterIds, codexIds, 'codexIds');
    broken('Tramas', plot.id, plot.sceneIds, sceneIds, 'sceneIds');
    broken('Tramas', plot.id, plot.chapterIds, chapterIds, 'chapterIds');
    broken('Tramas', plot.id, plot.storyBeatIds, beatIds, 'beatIds');
  }
  for (const [sceneId, design] of Object.entries(narrative.sceneDesigns || {})) {
    broken('Escenas', design.id || sceneId, [sceneId], sceneIds, 'sceneIds');
    broken('Escenas', design.id || sceneId, (design.characterGoals || []).map((item) => item.codexId), codexIds, 'codexIds');
    broken('Escenas', design.id || sceneId, design.plotIds, plotIds, 'plotIds');
    broken('Escenas', design.id || sceneId, design.arcIds, arcIds, 'arcIds');
    broken('Escenas', design.id || sceneId, design.storyBeatIds, beatIds, 'beatIds');
    broken('Escenas', design.id || sceneId, design.stageIds, stageIds, 'stageIds');
  }
  for (const [chapterId, design] of Object.entries(narrative.chapterDesigns || {})) {
    broken('Capítulos', design.id || chapterId, [chapterId], chapterIds, 'chapterIds');
    broken('Capítulos', design.id || chapterId, design.plotIds, plotIds, 'plotIds');
  }
  for (const link of narrative.causalLinks || []) {
    broken('Causalidad', link.id, [link.sourceSceneId, link.payoffSceneId], sceneIds, 'sceneIds');
    broken('Causalidad', link.id, link.characterIds, codexIds, 'codexIds');
    broken('Causalidad', link.id, link.plotIds, plotIds, 'plotIds');
  }
  broken('Tema', 'theme-axis', narrative.themeAxis?.personajesA, codexIds, 'codexIds');
  broken('Tema', 'theme-axis', narrative.themeAxis?.personajesB, codexIds, 'codexIds');
  broken('Tema', 'theme-axis', narrative.themeAxis?.sceneIds, sceneIds, 'sceneIds');
  broken('Tema', 'theme-axis', narrative.themeAxis?.storyBeatIds, beatIds, 'beatIds');
  for (const decision of narrative.themeAxis?.decisionPoints || []) {
    broken('Tema', decision.id, [decision.sceneId], sceneIds, 'sceneIds');
    broken('Tema', decision.id, [decision.storyBeatId], beatIds, 'beatIds');
  }
  for (const symbol of narrative.symbols || []) {
    broken('Símbolos', symbol.id, symbol.codexIds, codexIds, 'codexIds');
    broken('Símbolos', symbol.id, [symbol.primeraAparicionSceneId, symbol.finalPayoffSceneId, ...(symbol.repeticiones || []).map((item) => item.sceneId)], sceneIds, 'sceneIds');
  }
  for (const thread of narrative.conflictThreads || []) {
    broken('Conflicto', thread.id, [thread.protagonistaId, thread.adversarioId], codexIds, 'codexIds');
    broken('Conflicto', thread.id, [...(thread.sceneIds || []), ...(thread.escalada || []).map((item) => item.sceneId)], sceneIds, 'sceneIds');
    broken('Conflicto', thread.id, [...(thread.plotIds || []), ...(thread.escalada || []).map((item) => item.plotId)], plotIds, 'plotIds');
    broken('Conflicto', thread.id, [...(thread.storyBeatIds || []), ...(thread.escalada || []).map((item) => item.storyBeatId)], beatIds, 'beatIds');
  }
  for (const reveal of narrative.reveals || []) {
    broken('Revelaciones', reveal.id, [reveal.quienDescubreId, ...(reveal.quienSabiaIds || [])], codexIds, 'codexIds');
    broken('Revelaciones', reveal.id, [reveal.sceneId], sceneIds, 'sceneIds');
    broken('Revelaciones', reveal.id, [reveal.storyBeatId], beatIds, 'beatIds');
  }
  broken('Inicio', 'opening', [narrative.opening?.protagonistId], codexIds, 'codexIds');
  broken('Inicio', 'opening', [narrative.opening?.firstSceneId], sceneIds, 'sceneIds');
  broken('Inicio', 'opening', [narrative.opening?.firstStoryBeatId], beatIds, 'beatIds');
  return diagnostics;
}

function checkCausalLinks(narrative) {
  const out = [];
  for (const link of narrative.causalLinks || []) {
    const hasAction = !isEmpty(link.action);
    const hasConsequence = !isEmpty(link.immediateConsequence) || !isEmpty(link.delayedConsequence);
    if (hasAction && !hasConsequence) out.push(makeDiagnostic({ id: `causa-sin-consecuencia:${link.id}`, type: 'causa-sin-consecuencia', title: 'Esta acción todavía no tiene una consecuencia visible', why: 'Una decisión importante suele sentirse más sólida cuando algo cambia a causa de ella, de inmediato o más adelante.', where: 'Acción y consecuencia', involved: { sceneIds: link.sourceSceneId ? [link.sourceSceneId] : [] }, suggestions: ['Pregunta qué empeora, mejora o se vuelve inevitable después de esta acción.'] }));
    if (!hasAction && hasConsequence) out.push(makeDiagnostic({ id: `consecuencia-sin-causa:${link.id}`, type: 'consecuencia-sin-causa', title: 'Esta consecuencia todavía no tiene una causa visible', why: 'Si el lector no puede relacionar el efecto con una acción anterior, el cambio puede parecer arbitrario.', where: 'Acción y consecuencia', involved: { sceneIds: [link.sourceSceneId, link.payoffSceneId].filter(Boolean) }, suggestions: ['Busca la decisión o el hecho previo que pone esta consecuencia en marcha.'] }));
  }
  return out;
}

// --- Heurísticas de estructura: stages, beats, tramos ---

function activeFrameworkInstance(narrative) {
  const instances = narrative.frameworkInstances || [];
  return instances.find((instance) => instance.active || instance.activa || instance.id === narrative.activeFrameworkId) || instances[0] || null;
}

function collectAssignments(instance, narrative = null) {
  // assignments: mapa stageId -> [sceneId] (o lista de { stageId, sceneId })
  const byStage = new Map();
  const byScene = new Map();
  const raw = instance?.assignments;
  const add = (stageId, sceneId) => {
    if (!stageId || !sceneId) return;
    if (!byStage.has(stageId)) byStage.set(stageId, []);
    byStage.get(stageId).push(sceneId);
    if (!byScene.has(sceneId)) byScene.set(sceneId, []);
    byScene.get(sceneId).push(stageId);
  };
  if (Array.isArray(raw)) {
    for (const entry of raw) add(entry.stageId, entry.sceneId);
  } else {
    for (const [stageId, sceneIds] of Object.entries(raw || {})) {
      for (const sceneId of sceneIds || []) add(stageId, sceneId);
    }
  }
  for (const assignment of narrative?.assignments || []) if (!assignment.stageInstanceId || assignment.stageInstanceId === instance?.id) for (const sceneId of assignment.sceneIds || []) add(assignment.stageId, sceneId);
  for (const stage of instance?.stages || []) for (const sceneId of stage.assignments?.scenes || []) add(stage.id, sceneId);
  return { byStage, byScene };
}

function checkStageSinAsignacion(narrative, flat) {
  const instance = activeFrameworkInstance(narrative);
  if (!instance) return [];
  const { byStage } = collectAssignments(instance, narrative);
  const out = [];
  for (const stage of instance.stages || []) {
    if (stage.omitted || stage.notApplicable || stage.status === 'no-aplica') continue;
    if ((byStage.get(stage.id) || []).length > 0) continue;
    out.push(makeDiagnostic({
      id: `stage-sin-asignacion:${stage.id}`,
      type: "stage-sin-asignacion",
      title: `La etapa «${stage.name || stage.nombre || stage.id}» todavía no tiene escenas asignadas`,
      why: "Esta etapa del marco estructural está activa pero vacía. Puede que la historia aún no haya llegado ahí, o que esa parte del arco esté quedando sin representar.",
      where: "Estructura",
      involved: { stageIds: [stage.id] },
      target: { tab: 'estructura', stageId: stage.id },
      suggestions: ["Revisa si alguna escena existente cumple la función de esta etapa, o si falta escribirla."],
    }));
  }
  return out;
}

function checkTramoSinBeats(narrative, flat) {
  const instance = activeFrameworkInstance(narrative);
  if (!instance) return [];
  const { byScene } = collectAssignments(instance, narrative);
  const UMBRAL = 5;
  const out = [];
  let tramo = [];
  const cerrarTramo = () => {
    if (tramo.length <= UMBRAL) { tramo = []; return; }
    const primero = tramo[0];
    const ultimo = tramo[tramo.length - 1];
    out.push(makeDiagnostic({
      id: `tramo-sin-beats:${primero.scene.id}:${ultimo.scene.id}`,
      type: "tramo-sin-beats",
      severity: SEVERITY_AVISO,
      title: `Hay ${tramo.length} escenas seguidas sin ningún hito estructural`,
      why: "Los tramos largos sin hitos pueden hacer que el ritmo se vuelva plano o que el lector pierda la sensación de progreso. A veces el tramo está bien y solo falta reconocer qué hito ya ocurre dentro de él.",
      where: `De «${primero.scene.title || "escena"}» (${primero.chapter.title}) a «${ultimo.scene.title || "escena"}» (${ultimo.chapter.title})`,
      involved: {
        sceneIds: tramo.map((item) => item.scene.id),
        chapterIds: [...new Set(tramo.map((item) => item.chapter.id))],
      },
      suggestions: ["Mira el tramo y pregúntate si alguna de estas escenas es en realidad un giro, una revelación o un punto de no retorno."],
    }));
    tramo = [];
  };
  for (const item of flat) {
    if ((byScene.get(item.scene.id) || []).length > 0) cerrarTramo();
    else tramo.push(item);
  }
  cerrarTramo();
  return out;
}

/**
 * Ejecuta todas las heurísticas sobre el estado narrativo.
 * @param {{ narrative: object, structure: object, codex?: object }} input
 * @returns {Array<object>} diagnósticos ordenados por severidad y tipo.
 */
export function runDiagnostics({ narrative, structure, codex } = {}) {
  const state = normalizeNarrative(narrative);
  const flat = structure ? flattenScenes(structure) : [];
  const sceneDesigns = state.sceneDesigns || {};
  const chapterDesigns = state.chapterDesigns || {};

  const diagnostics = [
    ...checkProtagonistaObjetivo(state),
    ...checkCompassConflict(state),
    ...checkIncidenteSinDecision(state),
    ...checkEscenaSinObjetivo(flat, sceneDesigns),
    ...checkEscenaSinOposicion(flat, sceneDesigns),
    ...checkEscenaSinCambio(flat, sceneDesigns),
    ...checkCapituloSinAvance(flat, chapterDesigns),
    ...checkRevealSinEfecto(state),
    ...checkAdversarioSinObjetivo(state),
    ...checkStageSinAsignacion(state, flat),
    ...checkTramoSinBeats(state, flat),
    ...checkSimboloSinUso(state),
    ...checkArcoSinEvidencia(state),
    ...checkSecundarioSinObjetivo(state),
    ...checkCharacterPlanning(state),
    ...checkArcPlanning(state, structure),
    ...checkPlots(state, structure),
    ...checkDetailedSceneChapter(state, flat),
    ...checkPhase2References(state, structure, codex),
    ...checkCausalLinks(state),
    ...checkKnowledgeOrder(state, structure),
  ];

  const orden = { [SEVERITY_ATENCION]: 0, [SEVERITY_AVISO]: 1, [SEVERITY_INFO]: 2 };
  return diagnostics.sort((a, b) =>
    (orden[a.severity] ?? 2) - (orden[b.severity] ?? 2) || a.id.localeCompare(b.id, "es"));
}

/**
 * Filtra los diagnósticos que el usuario ya descartó.
 * @param {Array<object>} diagnostics
 * @param {Iterable<string>} dismissedIds
 * @returns {Array<object>}
 */
export function filterDismissed(diagnostics, dismissedIds) {
  const dismissed = new Set(dismissedIds || []);
  return (diagnostics || []).filter((diagnostic) => !dismissed.has(diagnostic.id));
}
