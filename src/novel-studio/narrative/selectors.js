const list = (value) => Array.isArray(value) ? value : [];

export function selectCharacters(codex, { includeArchived = true } = {}) {
  return list(codex)
    .filter((entry) => entry?.type === 'character' && (includeArchived || !entry.archived))
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'es'));
}

export function resolveCodexEntry(codex, id) {
  return list(codex).find((entry) => entry?.id === id) || null;
}

export function selectStructureCatalog(structure) {
  const acts = list(structure?.acts);
  const chapters = acts.flatMap((act, actIndex) => list(act?.chapters).map((chapter, chapterIndex) => ({
    ...chapter, actId: act.id, actTitle: act.title, actIndex, chapterIndex,
  })));
  let order = 0;
  const scenes = acts.flatMap((act, actIndex) => list(act?.chapters).flatMap((chapter, chapterIndex) => list(chapter?.sceneIds).map((sceneId, sceneIndex) => {
    const scene = structure?.scenes?.[sceneId];
    if (!scene) return null;
    return { ...scene, actId: act.id, actTitle: act.title, chapterId: chapter.id, chapterTitle: chapter.title, actIndex, chapterIndex, sceneIndex, order: order++ };
  }).filter(Boolean)));
  return { acts, chapters, scenes };
}

export const resolveScene = (structure, id) => selectStructureCatalog(structure).scenes.find((item) => item.id === id) || null;
export const resolveChapter = (structure, id) => selectStructureCatalog(structure).chapters.find((item) => item.id === id) || null;

export function timelineOrder(structure, { sceneId, chapterId } = {}) {
  const catalog = selectStructureCatalog(structure);
  if (sceneId) return catalog.scenes.find((item) => item.id === sceneId)?.order ?? Number.MAX_SAFE_INTEGER;
  if (chapterId) return catalog.scenes.find((item) => item.chapterId === chapterId)?.order ?? Number.MAX_SAFE_INTEGER;
  return Number.MAX_SAFE_INTEGER;
}
