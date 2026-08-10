import { createArcBeat, createCharacterArc, createCharacterProfile, createPlot, nowIso } from './model.js';

const list = (value) => Array.isArray(value) ? value : [];
const touch = (narrative, patch) => ({ ...narrative, ...patch, updatedAt: nowIso() });
const updateById = (items, id, changes) => list(items).map((item) => item.id === id ? { ...item, ...changes, id: item.id, updatedAt: nowIso() } : item);

export function ensureCharacterProfile(narrative, codexId) {
  if (!codexId || list(narrative?.characterProfiles).some((item) => item.codexId === codexId)) return narrative;
  return touch(narrative, { characterProfiles: [...list(narrative?.characterProfiles), createCharacterProfile(codexId)] });
}

export function updateCharacterProfile(narrative, profileId, changes) {
  return touch(narrative, { characterProfiles: updateById(narrative?.characterProfiles, profileId, changes) });
}

export function createArcForCharacter(narrative, codexId) {
  if (!codexId) return narrative;
  return touch(narrative, { characterArcs: [...list(narrative?.characterArcs), createCharacterArc(codexId)] });
}

export function updateCharacterArc(narrative, arcId, changes) {
  return touch(narrative, { characterArcs: updateById(narrative?.characterArcs, arcId, changes) });
}

export function removeCharacterArc(narrative, arcId) {
  return touch(narrative, { characterArcs: list(narrative?.characterArcs).filter((item) => item.id !== arcId) });
}

export function addArcBeat(narrative, arcId, values = {}) {
  const arc = list(narrative?.characterArcs).find((item) => item.id === arcId);
  if (!arc) return narrative;
  const beat = { ...createArcBeat({ label: values.title || values.label, text: values.description || values.text }), ...values, order: list(arc.beats).length };
  return updateCharacterArc(narrative, arcId, { beats: [...list(arc.beats), beat] });
}

export function updateArcBeat(narrative, arcId, beatId, changes) {
  const arc = list(narrative?.characterArcs).find((item) => item.id === arcId);
  if (!arc) return narrative;
  return updateCharacterArc(narrative, arcId, { beats: updateById(arc.beats, beatId, changes) });
}

export function removeArcBeat(narrative, arcId, beatId) {
  const arc = list(narrative?.characterArcs).find((item) => item.id === arcId);
  if (!arc) return narrative;
  return updateCharacterArc(narrative, arcId, { beats: list(arc.beats).filter((item) => item.id !== beatId).map((item, order) => ({ ...item, order })) });
}

export function reorderArcBeat(narrative, arcId, beatId, offset) {
  const arc = list(narrative?.characterArcs).find((item) => item.id === arcId);
  const beats = [...list(arc?.beats)];
  const from = beats.findIndex((item) => item.id === beatId);
  const to = from + offset;
  if (!arc || from < 0 || to < 0 || to >= beats.length) return narrative;
  const [beat] = beats.splice(from, 1); beats.splice(to, 0, beat);
  return updateCharacterArc(narrative, arcId, { beats: beats.map((item, order) => ({ ...item, order })) });
}

export function addPlot(narrative, values = {}) {
  return touch(narrative, { plots: [...list(narrative?.plots), createPlot(values)] });
}

export function updatePlot(narrative, plotId, changes) {
  return touch(narrative, { plots: updateById(narrative?.plots, plotId, changes) });
}

export function removePlot(narrative, plotId) {
  return touch(narrative, {
    plots: list(narrative?.plots).filter((item) => item.id !== plotId),
    characterProfiles: list(narrative?.characterProfiles).map((profile) => ({ ...profile, plotIds: list(profile.plotIds).filter((id) => id !== plotId) })),
  });
}

export function updateOpening(narrative, section, changes) {
  const opening = narrative?.opening || {};
  if (section === 'root') return touch(narrative, { opening: { ...opening, ...changes } });
  return touch(narrative, { opening: { ...opening, [section]: { ...(opening[section] || {}), ...changes } } });
}
