import { createConflictThread, createReveal, createSymbolMotif, createThemeDecision, nowIso } from './model.js';

const list = (value) => Array.isArray(value) ? value : [];
const object = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const touch = (narrative, patch) => ({ ...narrative, ...patch, updatedAt: nowIso() });
const updateItem = (items, id, changes) => list(items).map((item) => item.id === id ? { ...item, ...object(changes), id: item.id, updatedAt: nowIso() } : item);

export function updateThemeAxis(narrative, changes) {
  return touch(narrative, { themeAxis: { ...object(narrative?.themeAxis), ...object(changes), updatedAt: nowIso() } });
}

export function addThemeDecision(narrative, values = {}) {
  return updateThemeAxis(narrative, { decisionPoints: [...list(narrative?.themeAxis?.decisionPoints), createThemeDecision(values)] });
}

export function updateThemeDecision(narrative, decisionId, changes) {
  return updateThemeAxis(narrative, { decisionPoints: updateItem(narrative?.themeAxis?.decisionPoints, decisionId, changes) });
}

export function removeThemeDecision(narrative, decisionId) {
  return updateThemeAxis(narrative, { decisionPoints: list(narrative?.themeAxis?.decisionPoints).filter((item) => item.id !== decisionId) });
}

export function addSymbol(narrative, values = {}) {
  return touch(narrative, { symbols: [...list(narrative?.symbols), createSymbolMotif(values)] });
}

export function updateSymbol(narrative, symbolId, changes) {
  return touch(narrative, { symbols: updateItem(narrative?.symbols, symbolId, changes) });
}

export function removeSymbol(narrative, symbolId) {
  return touch(narrative, { symbols: list(narrative?.symbols).filter((item) => item.id !== symbolId) });
}

export function addSymbolRepetition(narrative, symbolId, values = {}) {
  const symbol = list(narrative?.symbols).find((item) => item.id === symbolId);
  if (!symbol) return narrative;
  return updateSymbol(narrative, symbolId, { repeticiones: [...list(symbol.repeticiones), { id: crypto.randomUUID(), sceneId: values.sceneId || null, note: values.note || '' }] });
}

export function updateSymbolRepetition(narrative, symbolId, repetitionId, changes) {
  const symbol = list(narrative?.symbols).find((item) => item.id === symbolId);
  if (!symbol) return narrative;
  return updateSymbol(narrative, symbolId, { repeticiones: updateItem(symbol.repeticiones, repetitionId, changes) });
}

export function removeSymbolRepetition(narrative, symbolId, repetitionId) {
  const symbol = list(narrative?.symbols).find((item) => item.id === symbolId);
  if (!symbol) return narrative;
  return updateSymbol(narrative, symbolId, { repeticiones: list(symbol.repeticiones).filter((item) => item.id !== repetitionId) });
}

export function addConflictThread(narrative, values = {}) {
  return touch(narrative, { conflictThreads: [...list(narrative?.conflictThreads), createConflictThread(values)] });
}

export function updateConflictThread(narrative, threadId, changes) {
  return touch(narrative, { conflictThreads: updateItem(narrative?.conflictThreads, threadId, changes) });
}

export function removeConflictThread(narrative, threadId) {
  return touch(narrative, { conflictThreads: list(narrative?.conflictThreads).filter((item) => item.id !== threadId) });
}

export function updateConflictSide(narrative, threadId, side, changes) {
  const thread = list(narrative?.conflictThreads).find((item) => item.id === threadId);
  if (!thread || !['protagonista', 'adversario'].includes(side)) return narrative;
  return updateConflictThread(narrative, threadId, { [side]: { ...object(thread[side]), ...object(changes) } });
}

export function addEscalationStep(narrative, threadId, values = {}) {
  const thread = list(narrative?.conflictThreads).find((item) => item.id === threadId);
  if (!thread) return narrative;
  return updateConflictThread(narrative, threadId, { escalada: [...list(thread.escalada), { id: crypto.randomUUID(), text: values.text || '', order: list(thread.escalada).length, sceneId: values.sceneId || null, storyBeatId: values.storyBeatId || null, plotId: values.plotId || null }] });
}

export function updateEscalationStep(narrative, threadId, stepId, changes) {
  const thread = list(narrative?.conflictThreads).find((item) => item.id === threadId);
  if (!thread) return narrative;
  return updateConflictThread(narrative, threadId, { escalada: updateItem(thread.escalada, stepId, changes) });
}

export function removeEscalationStep(narrative, threadId, stepId) {
  const thread = list(narrative?.conflictThreads).find((item) => item.id === threadId);
  if (!thread) return narrative;
  return updateConflictThread(narrative, threadId, { escalada: list(thread.escalada).filter((item) => item.id !== stepId).map((item, order) => ({ ...item, order })) });
}

export function reorderEscalationStep(narrative, threadId, stepId, offset) {
  const thread = list(narrative?.conflictThreads).find((item) => item.id === threadId);
  const steps = [...list(thread?.escalada)];
  const from = steps.findIndex((item) => item.id === stepId); const to = from + offset;
  if (!thread || from < 0 || to < 0 || to >= steps.length) return narrative;
  const [step] = steps.splice(from, 1); steps.splice(to, 0, step);
  return updateConflictThread(narrative, threadId, { escalada: steps.map((item, order) => ({ ...item, order })) });
}

export function addReveal(narrative, values = {}) {
  return touch(narrative, { reveals: [...list(narrative?.reveals), { ...createReveal(values), ...values }] });
}

export function updateReveal(narrative, revealId, changes) {
  return touch(narrative, { reveals: updateItem(narrative?.reveals, revealId, changes) });
}

export function removeReveal(narrative, revealId) {
  return touch(narrative, { reveals: list(narrative?.reveals).filter((item) => item.id !== revealId) });
}
