import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyNarrative, NARRATIVE_SCHEMA_VERSION, normalizeNarrative } from '../src/novel-studio/narrative/model.js';
import {
  addConflictThread, addEscalationStep, addReveal, addSymbol, addSymbolRepetition, addThemeDecision,
  reorderEscalationStep, updateConflictSide, updateConflictThread, updateReveal, updateSymbol,
  updateSymbolRepetition, updateThemeAxis, updateThemeDecision,
} from '../src/novel-studio/narrative/phase4Engine.js';
import { ensureSceneDesign, addSceneCharacterGoal, updateSceneCharacterGoal } from '../src/novel-studio/narrative/phase3Engine.js';
import { filterDismissed, runDiagnostics } from '../src/novel-studio/narrative/diagnostics.js';

const structure = {
  acts: [{ id: 'a1', title: 'Acto I', chapters: [{ id: 'c1', title: 'Capítulo 1', sceneIds: ['s1', 's2', 's3', 's4'] }] }],
  scenes: Object.fromEntries(['s1', 's2', 's3', 's4'].map((id, index) => [id, { id, title: `Escena ${index + 1}`, archived: false, wordCount: 0 }])),
};
const codex = [{ id: 'rainiero', type: 'character', name: 'Rainiero' }, { id: 'isabel', type: 'character', name: 'Isabel' }, { id: 'corona', type: 'object', name: 'Corona' }];

test('schema v4 keeps legacy theme duplicates as compatibility without creating new copies', () => {
  const fresh = emptyNarrative();
  assert.equal('premisa' in fresh.themeAxis, false);
  const migrated = normalizeNarrative({ schemaVersion: 3, themeAxis: { premisa: 'Legado', valorA: 'Deber', futureTheme: true }, symbols: [{ id: 'sym', name: 'Corona' }] });
  assert.equal(migrated.schemaVersion, NARRATIVE_SCHEMA_VERSION);
  assert.equal(migrated.themeAxis.premisa, 'Legado');
  assert.equal(migrated.themeAxis.futureTheme, true);
  assert.deepEqual(migrated.themeAxis.decisionPoints, []);
  assert.equal(migrated.symbols[0].tracking, false);
});

test('theme elaboration stores only positions, ID links and decisions', () => {
  let state = updateThemeAxis(emptyNarrative(), { valorA: 'Deber', valorB: 'Libertad', personajesA: ['rainiero'], sceneIds: ['s2'] });
  state = addThemeDecision(state, { text: 'Renuncia a la corona', sceneId: 's3' });
  const decision = state.themeAxis.decisionPoints[0];
  state = updateThemeDecision(state, decision.id, { position: 'Libertad', consequence: 'Pierde el reino' });
  assert.equal(state.themeAxis.valorA, 'Deber');
  assert.equal(state.themeAxis.decisionPoints[0].sceneId, 's3');
  assert.equal('premisa' in state.themeAxis, false);
});

test('symbols link Codex entities and repetitions without duplicating their description', () => {
  let state = addSymbol(emptyNarrative(), { name: 'Corona', type: 'objeto' });
  const id = state.symbols[0].id;
  state = updateSymbol(state, id, { codexIds: ['corona'], tracking: true, primeraAparicionSceneId: 's1', finalPayoffSceneId: 's4' });
  state = addSymbolRepetition(state, id, { sceneId: 's2', note: 'Está rota' });
  const repetition = state.symbols[0].repeticiones[0];
  state = updateSymbolRepetition(state, id, repetition.id, { note: 'Pierde una piedra' });
  assert.deepEqual(state.symbols[0].codexIds, ['corona']);
  assert.equal(state.symbols[0].repeticiones[0].note, 'Pierde una piedra');
  assert.equal('description' in state.symbols[0], false);
});

test('conflict supports a non-personal force and ordered linked escalation', () => {
  let state = addConflictThread(emptyNarrative(), { name: 'La sucesión' });
  const id = state.conflictThreads[0].id;
  state = updateConflictThread(state, id, { protagonistaId: 'rainiero', nonPersonalAdversary: 'La ley de sucesión', incompatibilidad: 'Gobernar o ser libre' });
  state = updateConflictSide(state, id, 'protagonista', { objetivo: 'Abdicar', plan: 'Nombrar heredera' });
  state = addEscalationStep(state, id, { text: 'El consejo se opone', sceneId: 's2' });
  state = addEscalationStep(state, id, { text: 'Estalla la revuelta', sceneId: 's3' });
  const second = state.conflictThreads[0].escalada[1].id;
  state = reorderEscalationStep(state, id, second, -1);
  assert.equal(state.conflictThreads[0].nonPersonalAdversary, 'La ley de sucesión');
  assert.deepEqual(state.conflictThreads[0].escalada.map((item) => item.order), [0, 1]);
  assert.equal(state.conflictThreads[0].escalada[0].text, 'Estalla la revuelta');
});

test('revelations preserve knowledge owners, chronology and narrative effects', () => {
  let state = addReveal(emptyNarrative(), { title: 'La heredera', info: 'Isabel es la heredera', sceneId: 's3' });
  const id = state.reveals[0].id;
  state = updateReveal(state, id, { quienDescubreId: 'rainiero', quienSabiaIds: ['isabel'], sabeDespues: 'Isabel es la heredera', decisionQueProvoca: 'Rainiero abdica', cambioEnPlan: 'Protege a Isabel' });
  assert.deepEqual(state.reveals[0].quienSabiaIds, ['isabel']);
  assert.equal(state.reveals[0].sceneId, 's3');
});

test('phase 4 diagnostics stay silent for untouched modules and honor symbol tracking', () => {
  assert.equal(runDiagnostics({ narrative: emptyNarrative(), structure, codex }).some((item) => ['simbolo-sin-uso', 'trama-sin-resolucion'].includes(item.type)), false);
  let state = addSymbol(emptyNarrative(), { name: 'Corona' });
  assert.equal(runDiagnostics({ narrative: state, structure, codex }).some((item) => item.type === 'simbolo-sin-uso'), false);
  state = updateSymbol(state, state.symbols[0].id, { tracking: true });
  assert.equal(runDiagnostics({ narrative: state, structure, codex }).some((item) => item.type === 'simbolo-sin-uso'), true);
});

test('diagnostics cover plot, scene, chapter and arc planning with stable IDs and targets', () => {
  const state = emptyNarrative();
  state.plots = [{ id: 'plot-1', name: 'Sucesión', objective: 'Elegir heredera', resolution: '', sceneIds: ['s1'], characterIds: [], storyBeatIds: [], chapterIds: [] }];
  state.sceneDesigns.s1 = { id: 'sd1', sceneId: 's1', objetivo: 'Escapar', oposicion: 'Guardia', giro: '', resultado: '', estadoInicial: 'Libre', estadoFinal: 'Preso', characterGoals: [] };
  state.chapterDesigns.c1 = { id: 'cd1', chapterId: 'c1', objetivo: 'Cerrar puertas', giro: 'Traición', consecuencia: 'Huida', funcionesCumplidas: [] };
  state.characterArcs = [{ id: 'arc1', codexId: 'rainiero', estadoFinal: 'Libre', beats: [{ id: 'ab1', label: 'Decide', order: 0 }] }];
  const first = runDiagnostics({ narrative: state, structure, codex });
  const second = runDiagnostics({ narrative: state, structure, codex });
  for (const type of ['trama-sin-resolucion', 'scene-sin-giro', 'scene-sin-resultado', 'capitulo-sin-funciones', 'arco-hito-sin-enlace']) assert.ok(first.some((item) => item.type === type), type);
  assert.deepEqual(first.map((item) => item.id), second.map((item) => item.id));
  assert.ok(first.every((item) => item.observed && item.why));
  assert.ok(first.find((item) => item.type === 'scene-sin-giro').target);
});

test('detects a character using knowledge before the linked revelation', () => {
  let state = ensureSceneDesign(emptyNarrative(), 's1');
  state = addSceneCharacterGoal(state, 's1', 'rainiero');
  const goal = state.sceneDesigns.s1.characterGoals[0];
  state = updateSceneCharacterGoal(state, 's1', goal.id, { sabe: 'Isabel es la heredera' });
  state = addReveal(state, { title: 'La heredera', info: 'Isabel es la heredera', sabeDespues: 'Isabel es la heredera', quienDescubreId: 'rainiero', sceneId: 's3' });
  const diagnostic = runDiagnostics({ narrative: state, structure, codex }).find((item) => item.type === 'conocimiento-adelantado');
  assert.ok(diagnostic);
  assert.deepEqual(diagnostic.involvedIds.sceneIds, ['s1', 's3']);
});

test('dismissed diagnostic IDs filter output without changing narrative content', () => {
  const state = emptyNarrative(); state.foundation.protagonistaId = 'rainiero';
  const diagnostics = runDiagnostics({ narrative: state, structure, codex });
  const id = diagnostics[0].id; const snapshot = structuredClone(state);
  const visible = filterDismissed(diagnostics, [id]);
  assert.equal(visible.some((item) => item.id === id), false);
  assert.deepEqual(state, snapshot);
});
