import { createCausalLink, createChapterDesign, createSceneDesign, nowIso } from './model.js';

const list = (value) => Array.isArray(value) ? value : [];
const object = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const touch = (narrative, patch) => ({ ...narrative, ...patch, updatedAt: nowIso() });

export function ensureSceneDesign(narrative, sceneId) {
  if (!sceneId || narrative?.sceneDesigns?.[sceneId]) return narrative;
  return touch(narrative, { sceneDesigns: { ...object(narrative?.sceneDesigns), [sceneId]: createSceneDesign(sceneId) } });
}

export function updateSceneDesign(narrative, sceneId, changes) {
  const current = narrative?.sceneDesigns?.[sceneId];
  if (!current) return narrative;
  return touch(narrative, { sceneDesigns: { ...object(narrative.sceneDesigns), [sceneId]: { ...current, ...object(changes), id: current.id, sceneId: current.sceneId || sceneId, updatedAt: nowIso() } } });
}

export function addSceneCharacterGoal(narrative, sceneId, codexId) {
  const current = narrative?.sceneDesigns?.[sceneId];
  if (!current || !codexId || list(current.characterGoals).some((item) => item.codexId === codexId)) return narrative;
  return updateSceneDesign(narrative, sceneId, { characterGoals: [...list(current.characterGoals), { id: crypto.randomUUID(), codexId, objetivo: '', tactica: '', sabe: '', oculta: '' }] });
}

export function updateSceneCharacterGoal(narrative, sceneId, goalId, changes) {
  const current = narrative?.sceneDesigns?.[sceneId];
  if (!current) return narrative;
  return updateSceneDesign(narrative, sceneId, { characterGoals: list(current.characterGoals).map((item) => item.id === goalId ? { ...item, ...object(changes), id: item.id } : item) });
}

export function removeSceneCharacterGoal(narrative, sceneId, goalId) {
  const current = narrative?.sceneDesigns?.[sceneId];
  if (!current) return narrative;
  return updateSceneDesign(narrative, sceneId, { characterGoals: list(current.characterGoals).filter((item) => item.id !== goalId) });
}

export function ensureChapterDesign(narrative, chapterId) {
  if (!chapterId || narrative?.chapterDesigns?.[chapterId]) return narrative;
  return touch(narrative, { chapterDesigns: { ...object(narrative?.chapterDesigns), [chapterId]: createChapterDesign(chapterId) } });
}

export function updateChapterDesign(narrative, chapterId, changes) {
  const current = narrative?.chapterDesigns?.[chapterId];
  if (!current) return narrative;
  return touch(narrative, { chapterDesigns: { ...object(narrative.chapterDesigns), [chapterId]: { ...current, ...object(changes), id: current.id, chapterId: current.chapterId || chapterId, updatedAt: nowIso() } } });
}

export function updateChapterNecessity(narrative, chapterId, changes) {
  const current = narrative?.chapterDesigns?.[chapterId];
  if (!current) return narrative;
  return updateChapterDesign(narrative, chapterId, { pruebaNecesidad: { ...object(current.pruebaNecesidad), ...object(changes) } });
}

export function addCausalLink(narrative, values = {}) {
  return touch(narrative, { causalLinks: [...list(narrative?.causalLinks), createCausalLink(values)] });
}

export function updateCausalLink(narrative, linkId, changes) {
  return touch(narrative, { causalLinks: list(narrative?.causalLinks).map((item) => item.id === linkId ? { ...item, ...object(changes), id: item.id, updatedAt: nowIso() } : item) });
}

export function removeCausalLink(narrative, linkId) {
  return touch(narrative, { causalLinks: list(narrative?.causalLinks).filter((item) => item.id !== linkId) });
}

export function deriveCausalRows(narrative, structure) {
  const order = new Map();
  let index = 0;
  for (const act of structure?.acts || []) for (const chapter of act.chapters || []) for (const sceneId of chapter.sceneIds || []) order.set(sceneId, index++);
  const explicit = list(narrative?.causalLinks).map((item) => ({ ...item, source: 'manual', order: order.get(item.sourceSceneId) ?? Number.MAX_SAFE_INTEGER }));
  const designed = Object.values(object(narrative?.sceneDesigns)).filter((item) => item?.consecuencia || item?.resultado).map((item) => ({
    id: `scene:${item.sceneId}`, action: item.resultado || item.giro || item.objetivo, immediateConsequence: item.consecuencia || '', delayedConsequence: '', sourceSceneId: item.sceneId, payoffSceneId: null, characterIds: list(item.characterGoals).map((goal) => goal.codexId), plotIds: list(item.plotIds), source: 'scene', order: order.get(item.sceneId) ?? Number.MAX_SAFE_INTEGER,
  }));
  const reveals = list(narrative?.reveals).filter((item) => item.info).map((item) => ({
    id: `reveal:${item.id}`, action: item.decisionQueProvoca || item.info, immediateConsequence: item.cambioEnPlan || '', delayedConsequence: '', sourceSceneId: item.sceneId || null, payoffSceneId: null, characterIds: [item.quienDescubreId, ...list(item.quienSabiaIds)].filter(Boolean), plotIds: [], source: 'reveal', order: order.get(item.sceneId) ?? Number.MAX_SAFE_INTEGER,
  }));
  return [...explicit, ...designed, ...reveals].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}
