import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyNarrative, NARRATIVE_SCHEMA_VERSION, normalizeNarrative } from '../src/novel-studio/narrative/model.js';
import {
  addArcBeat, addPlot, createArcForCharacter, ensureCharacterProfile, reorderArcBeat,
  updateCharacterProfile, updateOpening, updatePlot,
} from '../src/novel-studio/narrative/phase2Engine.js';
import { selectCharacters, selectStructureCatalog, timelineOrder } from '../src/novel-studio/narrative/selectors.js';
import { runDiagnostics } from '../src/novel-studio/narrative/diagnostics.js';

const structure = {
  acts: [{ id: 'a1', title: 'Acto I', chapters: [{ id: 'c1', title: 'Capítulo 1', sceneIds: ['s1', 's2'] }] }],
  scenes: { s1: { id: 's1', title: 'Primera', archived: false }, s2: { id: 's2', title: 'Segunda', archived: false } },
};

test('schema v2 normalizes old profiles without discarding legacy or future fields', () => {
  const state = normalizeNarrative({ schemaVersion: 1, futureRoot: { ok: true }, characterProfiles: [{ id: 'p1', personajeId: 'rainiero', motor: { objetivoVisible: 'Vencer' }, futureField: 42 }] });
  assert.equal(state.schemaVersion, NARRATIVE_SCHEMA_VERSION);
  assert.equal(state.characterProfiles[0].codexId, 'rainiero');
  assert.equal(state.characterProfiles[0].motor.objetivoVisible, 'Vencer');
  assert.equal(state.characterProfiles[0].futureField, 42);
  assert.deepEqual(state.futureRoot, { ok: true });
  assert.deepEqual(state.plots, []);
});

test('character profile stores story projection by codexId and keeps identity outside narrative', () => {
  let state = ensureCharacterProfile(emptyNarrative(), 'rainiero');
  const profile = state.characterProfiles[0];
  state = updateCharacterProfile(state, profile.id, { dramaticGoal: 'Recuperar el reino', sceneIds: ['s1'] });
  assert.equal(state.characterProfiles[0].codexId, 'rainiero');
  assert.equal(state.characterProfiles[0].dramaticGoal, 'Recuperar el reino');
  assert.equal('name' in state.characterProfiles[0], false);
});

test('arc beats reorder independently from structure and survive unrelated frameworks', () => {
  let state = createArcForCharacter(emptyNarrative(), 'rainiero');
  const arcId = state.characterArcs[0].id;
  state = addArcBeat(state, arcId, { title: 'Resiste', sceneId: 's2' });
  state = addArcBeat(state, arcId, { title: 'Acepta', sceneId: 's1' });
  const secondId = state.characterArcs[0].beats[1].id;
  state = reorderArcBeat(state, arcId, secondId, -1);
  assert.deepEqual(state.characterArcs[0].beats.map((item) => item.label), ['Acepta', 'Resiste']);
  assert.deepEqual(state.characterArcs[0].beats.map((item) => item.order), [0, 1]);
});

test('plots can overlap scenes, cross chapters and change pattern without losing links', () => {
  let state = addPlot(emptyNarrative(), { name: 'Principal', type: 'principal' });
  state = addPlot(state, { name: 'Lealtad', type: 'secundaria' });
  const [main, secondary] = state.plots;
  state = updatePlot(state, main.id, { sceneIds: ['s1', 's2'], chapterIds: ['c1'], patternId: 'busqueda' });
  state = updatePlot(state, secondary.id, { sceneIds: ['s2'], characterIds: ['rainiero'] });
  state = updatePlot(state, main.id, { patternId: 'venganza' });
  assert.deepEqual(state.plots[0].sceneIds, ['s1', 's2']);
  assert.equal(state.plots[1].sceneIds.includes('s2'), true);
});

test('opening updates nested sections without losing links', () => {
  let state = updateOpening(emptyNarrative(), 'root', { protagonistId: 'rainiero', firstSceneId: 's1' });
  state = updateOpening(state, 'deQue', { incidente: 'Llega una carta' });
  assert.equal(state.opening.firstSceneId, 's1');
  assert.equal(state.opening.deQue.incidente, 'Llega una carta');
});

test('selectors resolve canonical names and real manuscript order', () => {
  const codex = [{ id: 'z', type: 'location', name: 'Z' }, { id: 'r', type: 'character', name: 'Rainiero', archived: true }];
  assert.deepEqual(selectCharacters(codex).map((item) => item.name), ['Rainiero']);
  assert.equal(selectStructureCatalog(structure).scenes[1].chapterId, 'c1');
  assert.equal(timelineOrder(structure, { sceneId: 's2' }), 1);
});

test('missing phase 2 references produce repairable diagnostics', () => {
  let state = ensureCharacterProfile(emptyNarrative(), 'missing-character');
  state = updateCharacterProfile(state, state.characterProfiles[0].id, { dramaticGoal: 'Volver', sceneIds: ['missing-scene'] });
  const diagnostics = runDiagnostics({ narrative: state, structure, codex: [] }).filter((item) => item.type === 'referencia-rota');
  assert.ok(diagnostics.some((item) => item.involvedIds.codexIds.includes('missing-character')));
  assert.ok(diagnostics.some((item) => item.involvedIds.sceneIds.includes('missing-scene')));
});
