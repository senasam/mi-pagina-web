import {
  createArcBeat, createDialogueDesign, createDialogueParticipant, createFrameworkCorrespondence,
  createStoryBeat, nowIso,
} from './model.js';
import { selectStructureCatalog } from './selectors.js';

const list = (value) => Array.isArray(value) ? value : [];
const object = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const unique = (values) => [...new Set(list(values).filter(Boolean))];
const touch = (narrative, patch) => ({ ...narrative, ...patch, updatedAt: nowIso() });

export function addFrameworkCorrespondence(narrative, values = {}) {
  return touch(narrative, { frameworkCorrespondences: [...list(narrative?.frameworkCorrespondences), createFrameworkCorrespondence(values)] });
}

export function updateFrameworkCorrespondence(narrative, id, changes = {}) {
  return touch(narrative, { frameworkCorrespondences: list(narrative?.frameworkCorrespondences).map((item) => item.id === id ? { ...item, ...object(changes), id: item.id, updatedAt: nowIso() } : item) });
}

export function removeFrameworkCorrespondence(narrative, id) {
  return touch(narrative, { frameworkCorrespondences: list(narrative?.frameworkCorrespondences).filter((item) => item.id !== id) });
}

function stageLinks(narrative, framework, stage) {
  const root = list(narrative?.assignments).filter((item) => item?.stageId === stage?.id && (!item.stageInstanceId || item.stageInstanceId === framework?.id));
  return {
    beatIds: unique([...list(stage?.assignments?.beats), ...root.flatMap((item) => list(item.storyBeatIds))]),
    sceneIds: unique([...list(stage?.assignments?.scenes), ...root.flatMap((item) => list(item.sceneIds))]),
    chapterIds: unique([...list(stage?.assignments?.chapters), ...root.flatMap((item) => list(item.chapterIds))]),
    actIds: unique([...list(stage?.assignments?.acts), ...root.flatMap((item) => list(item.actIds))]),
  };
}

export function buildFrameworkMatrix(narrative, structure, frameworkIds = [], filters = {}) {
  const chosen = list(narrative?.frameworkInstances).filter((item) => frameworkIds.includes(item.id));
  const catalog = selectStructureCatalog(structure);
  const sceneMap = new Map(catalog.scenes.map((scene) => [scene.id, scene]));
  const rows = [];
  for (let leftIndex = 0; leftIndex < chosen.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < chosen.length; rightIndex += 1) {
      const left = chosen[leftIndex]; const right = chosen[rightIndex];
      for (const a of list(left.stages)) for (const b of list(right.stages)) {
        const aLinks = stageLinks(narrative, left, a); const bLinks = stageLinks(narrative, right, b);
        const sharedSceneIds = aLinks.sceneIds.filter((id) => bLinks.sceneIds.includes(id));
        const sharedBeatIds = aLinks.beatIds.filter((id) => bLinks.beatIds.includes(id));
        const manual = list(narrative?.frameworkCorrespondences).find((item) =>
          (item.frameworkAId === left.id && item.stageAId === a.id && item.frameworkBId === right.id && item.stageBId === b.id)
          || (item.frameworkAId === right.id && item.stageAId === b.id && item.frameworkBId === left.id && item.stageBId === a.id));
        if (!manual && !sharedSceneIds.length && !sharedBeatIds.length) continue;
        const allScenes = unique([...aLinks.sceneIds, ...bLinks.sceneIds]);
        const actIds = unique([...aLinks.actIds, ...bLinks.actIds, ...allScenes.map((id) => sceneMap.get(id)?.actId)]);
        const plotIds = unique(list(manual?.plotIds));
        const characterIds = unique(list(manual?.characterIds));
        if (filters.actId && !actIds.includes(filters.actId)) continue;
        if (filters.plotId && !plotIds.includes(filters.plotId) && !allScenes.some((id) => list(narrative?.plots).find((plot) => plot.id === filters.plotId)?.sceneIds?.includes(id))) continue;
        if (filters.characterId && !characterIds.includes(filters.characterId) && !allScenes.some((id) => list(narrative?.characterProfiles).find((profile) => profile.codexId === filters.characterId)?.sceneIds?.includes(id))) continue;
        rows.push({ id: manual?.id || `derived:${a.id}:${b.id}`, frameworkA: left, stageA: a, frameworkB: right, stageB: b, sharedSceneIds, sharedBeatIds, manual: manual || null });
      }
    }
  }
  return rows;
}

export function ensureDialogueDesign(narrative, sceneId) {
  const current = narrative?.sceneDesigns?.[sceneId];
  if (!current) return narrative;
  if (current.dialogue) return narrative;
  return touch(narrative, { sceneDesigns: { ...narrative.sceneDesigns, [sceneId]: { ...current, dialogue: createDialogueDesign(), updatedAt: nowIso() } } });
}

export function updateDialogueDesign(narrative, sceneId, changes = {}) {
  const design = narrative?.sceneDesigns?.[sceneId];
  if (!design) return narrative;
  const dialogue = { ...createDialogueDesign(), ...object(design.dialogue), ...object(changes) };
  if (changes.persuasion) dialogue.persuasion = { ...createDialogueDesign().persuasion, ...object(design.dialogue?.persuasion), ...object(changes.persuasion) };
  return touch(narrative, { sceneDesigns: { ...narrative.sceneDesigns, [sceneId]: { ...design, dialogue, updatedAt: nowIso() } } });
}

export function addDialogueParticipant(narrative, sceneId, codexId) {
  const participants = list(narrative?.sceneDesigns?.[sceneId]?.dialogue?.participants);
  if (!codexId || participants.some((item) => item.codexId === codexId)) return narrative;
  return updateDialogueDesign(narrative, sceneId, { participants: [...participants, createDialogueParticipant(codexId)] });
}

export function updateDialogueParticipant(narrative, sceneId, id, changes = {}) {
  return updateDialogueDesign(narrative, sceneId, { participants: list(narrative?.sceneDesigns?.[sceneId]?.dialogue?.participants).map((item) => item.id === id ? { ...item, ...object(changes), id: item.id } : item) });
}

export function removeDialogueParticipant(narrative, sceneId, id) {
  return updateDialogueDesign(narrative, sceneId, { participants: list(narrative?.sceneDesigns?.[sceneId]?.dialogue?.participants).filter((item) => item.id !== id) });
}

export const AI_ASSISTANT_CASES = Object.freeze([
  { id: 'compass', label: 'Completar Brújula', entity: 'none' },
  { id: 'tension', label: 'Tensión objetivo–conflicto', entity: 'none' },
  { id: 'arc-beats', label: 'Proponer hitos de arco', entity: 'arc' },
  { id: 'causal-gap', label: 'Escena ausente entre causa y consecuencia', entity: 'causal' },
  { id: 'frameworks', label: 'Comparar dos marcos', entity: 'frameworks' },
  { id: 'scene-review', label: 'Preguntas de revisión de escena', entity: 'scene' },
  { id: 'chapter-review', label: 'Preguntas de revisión de capítulo', entity: 'chapter' },
  { id: 'reveal-continuity', label: 'Continuidad de revelaciones', entity: 'reveal' },
]);

export function clarificationForAiCase(task, narrative, selection = {}) {
  if (task === 'tension' && (!narrative?.foundation?.objetivoGlobal || !narrative?.foundation?.conflictoCentral)) return 'Define primero el objetivo global y el conflicto central para poder contrastarlos.';
  if (task === 'arc-beats' && !selection.arcId) return 'Elige el arco que quieres desarrollar.';
  if (task === 'causal-gap' && !selection.causalId) return 'Elige el enlace causal que quieres revisar.';
  if (task === 'frameworks' && list(selection.frameworkIds).length !== 2) return 'Elige exactamente dos marcos para compararlos.';
  if (task === 'scene-review' && !selection.sceneId) return 'Elige una escena con ficha narrativa.';
  if (task === 'chapter-review' && !selection.chapterId) return 'Elige un capítulo con ficha narrativa.';
  if (task === 'reveal-continuity' && !selection.revealId) return 'Elige una revelación que quieras revisar.';
  return '';
}

const pick = (source, keys) => Object.fromEntries(keys.map((key) => [key, source?.[key]]).filter(([, value]) => value !== undefined));

export function buildAiContext(task, { narrative, structure, codex = [], selection = {} }) {
  const catalog = selectStructureCatalog(structure);
  const allNames = Object.fromEntries(list(codex).map((item) => [item.id, item.name]));
  const foundation = pick(narrative?.foundation, ['idea', 'premisa', 'tema', 'preguntaTematica', 'contrapremisa', 'objetivoGlobal', 'conflictoCentral', 'antagonismo', 'stakes']);
  let selected = {};
  if (task === 'arc-beats') { const arc = list(narrative?.characterArcs).find((item) => item.id === selection.arcId); selected = { arc: arc ? { ...pick(arc, ['id', 'codexId', 'type', 'estadoInicial', 'creenciaInicial', 'puntoCiego', 'deseo', 'necesidad', 'resistencia', 'estadoFinal', 'nuevaCreencia', 'gano', 'perdio']), characterName: allNames[arc.codexId], beats: list(arc.beats).map((beat) => pick(beat, ['label', 'text', 'sceneId', 'chapterId', 'storyBeatId'])) } : null }; }
  if (task === 'causal-gap') selected = { causalLink: list(narrative?.causalLinks).find((item) => item.id === selection.causalId) };
  if (task === 'frameworks') selected = { frameworks: list(narrative?.frameworkInstances).filter((item) => list(selection.frameworkIds).includes(item.id)).map((item) => ({ id: item.id, name: item.name, stages: list(item.stages).map((stage) => ({ id: stage.id, name: stage.name, objective: stage.objective })) })), moments: list(narrative?.storyBeats).map((item) => pick(item, ['id', 'title', 'description', 'sceneIds'])) };
  if (task === 'scene-review') { const scene = catalog.scenes.find((item) => item.id === selection.sceneId); selected = { scene: scene && pick(scene, ['id', 'title', 'summary', 'chapterId', 'povId', 'participantIds']), design: narrative?.sceneDesigns?.[selection.sceneId] }; }
  if (task === 'chapter-review') { const chapter = catalog.chapters.find((item) => item.id === selection.chapterId); selected = { chapter: chapter && pick(chapter, ['id', 'title', 'actId', 'sceneIds']), design: narrative?.chapterDesigns?.[selection.chapterId], scenes: catalog.scenes.filter((item) => item.chapterId === selection.chapterId).map((item) => ({ id: item.id, title: item.title, summary: item.summary, design: narrative?.sceneDesigns?.[item.id] })) }; }
  if (task === 'reveal-continuity') selected = { reveal: list(narrative?.reveals).find((item) => item.id === selection.revealId), precedingReveals: list(narrative?.reveals).filter((item) => item.id !== selection.revealId).map((item) => pick(item, ['id', 'title', 'info', 'sceneId', 'quienDescubreId', 'quienSabiaIds'])) };
  const sceneIds = new Set(); const codexIds = new Set();
  const collectRefs = (value) => {
    if (Array.isArray(value)) { value.forEach(collectRefs); return; }
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      if (/sceneIds?$/i.test(key)) list(Array.isArray(item) ? item : [item]).forEach((id) => id && sceneIds.add(id));
      if (/^(codexId|protagonistaId|adversarioId|quienDescubreId|quienSabiaIds|participantIds|povId|characterIds)$/i.test(key)) list(Array.isArray(item) ? item : [item]).forEach((id) => id && codexIds.add(id));
      collectRefs(item);
    }
  };
  collectRefs(selected);
  const characterNamesById = Object.fromEntries([...codexIds].filter((id) => allNames[id]).map((id) => [id, allNames[id]]));
  const sceneOrder = catalog.scenes.filter((item) => sceneIds.has(item.id)).map((item) => ({ id: item.id, title: item.title, chapterId: item.chapterId, order: item.order }));
  return { task, sources: { codexFacts: { characterNamesById }, manuscriptMetadata: { sceneOrder }, narrativePlanning: { foundation, selected } } };
}

export function parseAiDraft(value) {
  const text = String(value || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw new Error('La respuesta no contiene un borrador JSON válido. No se aplicó ningún cambio.'); }
  const proposals = list(parsed?.proposals).slice(0, 12).map((item, index) => ({
    id: String(item?.id || `proposal-${index + 1}`), target: String(item?.target || ''), operation: item?.operation === 'append' ? 'append' : 'replace',
    label: String(item?.label || item?.target || 'Propuesta'), value: item?.value, reason: String(item?.reason || ''), sourceIds: list(item?.sourceIds).map(String).slice(0, 20),
  })).filter((item) => item.target && (typeof item.value === 'string' || (item.operation === 'append' && object(item.value))));
  return { needsClarification: String(parsed?.needsClarification || ''), proposals };
}

const FOUNDATION_FIELDS_AI = new Set(['idea', 'premisa', 'preguntaTematica', 'contrapremisa', 'objetivoGlobal', 'conflictoCentral', 'antagonismo', 'stakes']);
const SCENE_FIELDS_AI = new Set(['objetivo', 'oposicion', 'tacticas', 'giro', 'resultado', 'consecuencia', 'preguntaNarrativa']);
const CHAPTER_FIELDS_AI = new Set(['funcionPrincipal', 'pregunta', 'objetivo', 'stakes', 'giro', 'consecuencia', 'nuevaPregunta']);
const REVEAL_FIELDS_AI = new Set(['creiaAntes', 'sabeDespues', 'decisionQueProvoca', 'cambioEnPlan']);

function replaceItemField(items, id, field, allowed, value) {
  if (!allowed.has(field) || typeof value !== 'string' || !list(items).some((item) => item.id === id)) return null;
  return list(items).map((item) => item.id === id ? { ...item, [field]: value, updatedAt: nowIso() } : item);
}

function proposalMatchesTask(proposal, provenance) {
  const task = provenance?.task; const target = String(proposal?.target || ''); const selection = object(provenance?.selection);
  if (!task) return true;
  if (['compass', 'tension'].includes(task)) return target.startsWith('foundation.');
  if (task === 'arc-beats') return target === `characterArcs.${selection.arcId || target.split('.')[1]}.beats`;
  if (task === 'causal-gap') return target === 'storyBeats';
  if (task === 'frameworks') return target === 'frameworkCorrespondences';
  if (task === 'scene-review') return target.startsWith(`sceneDesigns.${selection.sceneId || target.split('.')[1]}.`);
  if (task === 'chapter-review') return target.startsWith(`chapterDesigns.${selection.chapterId || target.split('.')[1]}.`);
  if (task === 'reveal-continuity') return target.startsWith(`reveals.${selection.revealId || target.split('.')[1]}.`);
  return false;
}

export function applyAiProposal(narrative, proposal, provenance = {}) {
  if (!proposalMatchesTask(proposal, provenance)) return narrative;
  const parts = String(proposal?.target || '').split('.'); let next = null;
  if (parts[0] === 'foundation' && FOUNDATION_FIELDS_AI.has(parts[1]) && typeof proposal.value === 'string') next = touch(narrative, { foundation: { ...narrative.foundation, [parts[1]]: proposal.value } });
  if (parts[0] === 'sceneDesigns' && parts.length === 3) { const design = narrative?.sceneDesigns?.[parts[1]]; if (design && SCENE_FIELDS_AI.has(parts[2]) && typeof proposal.value === 'string') next = touch(narrative, { sceneDesigns: { ...narrative.sceneDesigns, [parts[1]]: { ...design, [parts[2]]: proposal.value, updatedAt: nowIso() } } }); }
  if (parts[0] === 'chapterDesigns' && parts.length === 3) { const design = narrative?.chapterDesigns?.[parts[1]]; if (design && CHAPTER_FIELDS_AI.has(parts[2]) && typeof proposal.value === 'string') next = touch(narrative, { chapterDesigns: { ...narrative.chapterDesigns, [parts[1]]: { ...design, [parts[2]]: proposal.value, updatedAt: nowIso() } } }); }
  if (parts[0] === 'reveals' && parts.length === 3) { const reveals = replaceItemField(narrative?.reveals, parts[1], parts[2], REVEAL_FIELDS_AI, proposal.value); if (reveals) next = touch(narrative, { reveals }); }
  if (proposal.operation === 'append' && proposal.target === 'storyBeats' && object(proposal.value)) next = touch(narrative, { storyBeats: [...list(narrative.storyBeats), { ...createStoryBeat({ title: String(proposal.value.title || ''), description: String(proposal.value.description || '') }), sceneIds: [] }] });
  if (proposal.operation === 'append' && parts[0] === 'characterArcs' && parts[2] === 'beats' && object(proposal.value)) { const arc = list(narrative.characterArcs).find((item) => item.id === parts[1]); if (arc) next = touch(narrative, { characterArcs: list(narrative.characterArcs).map((item) => item.id === arc.id ? { ...item, beats: [...list(item.beats), { ...createArcBeat({ label: String(proposal.value.label || ''), text: String(proposal.value.text || '') }), order: list(item.beats).length }] } : item) }); }
  if (proposal.operation === 'append' && proposal.target === 'frameworkCorrespondences' && object(proposal.value)) { const a = list(narrative.frameworkInstances).find((item) => item.id === proposal.value.frameworkAId); const b = list(narrative.frameworkInstances).find((item) => item.id === proposal.value.frameworkBId); if (a?.stages?.some((item) => item.id === proposal.value.stageAId) && b?.stages?.some((item) => item.id === proposal.value.stageBId)) next = addFrameworkCorrespondence(narrative, proposal.value); }
  if (!next) return narrative;
  const record = { id: crypto.randomUUID(), task: String(provenance.task || ''), target: proposal.target, sourceIds: list(proposal.sourceIds), provider: String(provenance.provider || ''), acceptedAt: nowIso() };
  return { ...next, acceptedAiProposals: [...list(next.acceptedAiProposals), record].slice(-100) };
}
