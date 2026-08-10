import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { emptyNarrative, NARRATIVE_SCHEMA_VERSION, normalizeNarrative } from '../src/novel-studio/narrative/model.js';
import {
  addCausalLink, addSceneCharacterGoal, deriveCausalRows, ensureChapterDesign,
  ensureSceneDesign, updateCausalLink, updateChapterDesign, updateChapterNecessity,
  updateSceneCharacterGoal, updateSceneDesign,
} from '../src/novel-studio/narrative/phase3Engine.js';
import { runDiagnostics } from '../src/novel-studio/narrative/diagnostics.js';
import { selectStructureCatalog } from '../src/novel-studio/narrative/selectors.js';

const structure = () => ({
  acts: [{ id: 'a1', title: 'Acto I', archived: false, chapters: [{ id: 'c1', title: 'Capítulo 1', archived: false, sceneIds: ['s1', 's2'] }] }],
  scenes: {
    s1: { id: 's1', title: 'La carta', summary: 'Llega una carta.', status: 'Borrador', archived: false, participantIds: ['rainiero'], povId: 'rainiero' },
    s2: { id: 's2', title: 'La decisión', summary: '', status: 'Idea', archived: false, participantIds: [], povId: null },
  },
});

test('schema v3 migrates scene, chapter and causality records without losing future fields', () => {
  const state = normalizeNarrative({
    schemaVersion: 2,
    sceneDesigns: { s1: { id: 'sd1', sceneId: 's1', objetivo: 'Leer', futureScene: true } },
    chapterDesigns: { c1: { id: 'cd1', chapterId: 'c1', objetivo: 'Romper la calma', futureChapter: 3 } },
    causalLinks: [{ id: 'cause1', action: 'Abre la carta', futureCause: 'keep' }],
  });
  assert.equal(state.schemaVersion, NARRATIVE_SCHEMA_VERSION);
  assert.deepEqual(state.sceneDesigns.s1.plotIds, []);
  assert.equal(state.sceneDesigns.s1.futureScene, true);
  assert.equal(state.chapterDesigns.c1.futureChapter, 3);
  assert.equal(state.causalLinks[0].futureCause, 'keep');
});

test('scene design uses a sceneId and never mutates canonical structure metadata', () => {
  const manuscript = structure();
  const before = structuredClone(manuscript);
  let state = ensureSceneDesign(emptyNarrative(), 's1');
  state = updateSceneDesign(state, 's1', { objetivo: 'Comprender el mensaje', plotIds: ['plot-1'] });
  state = addSceneCharacterGoal(state, 's1', 'rainiero');
  const goal = state.sceneDesigns.s1.characterGoals[0];
  state = updateSceneCharacterGoal(state, 's1', goal.id, { tactica: 'Ocultarlo' });
  assert.equal(state.sceneDesigns.s1.objetivo, 'Comprender el mensaje');
  assert.equal(state.sceneDesigns.s1.characterGoals[0].tactica, 'Ocultarlo');
  assert.deepEqual(manuscript, before);
});

test('moving or archiving a scene retains its design and a duplicate gets no implicit copy', () => {
  let state = ensureSceneDesign(emptyNarrative(), 's1');
  state = updateSceneDesign(state, 's1', { consecuencia: 'Debe huir' });
  const manuscript = structure();
  manuscript.acts[0].chapters[0].sceneIds.reverse();
  manuscript.scenes.s1.archived = true;
  manuscript.scenes.s3 = { ...manuscript.scenes.s1, id: 's3', archived: false };
  manuscript.acts[0].chapters[0].sceneIds.push('s3');
  assert.equal(state.sceneDesigns.s1.consecuencia, 'Debe huir');
  assert.equal(state.sceneDesigns.s3, undefined);
  assert.equal(selectStructureCatalog(manuscript).scenes.find((item) => item.id === 's1').archived, true);
});

test('chapter design is optional and necessity updates preserve the rest of the record', () => {
  let state = ensureChapterDesign(emptyNarrative(), 'c1');
  state = updateChapterDesign(state, 'c1', { objetivo: 'Forzar una elección', funcionesCumplidas: ['trama', 'personaje'] });
  state = updateChapterNecessity(state, 'c1', { cambia: 'Rainiero pierde la corte' });
  assert.equal(state.chapterDesigns.c1.objetivo, 'Forzar una elección');
  assert.deepEqual(state.chapterDesigns.c1.funcionesCumplidas, ['trama', 'personaje']);
  assert.equal(state.chapterDesigns.c1.pruebaNecesidad.cambia, 'Rainiero pierde la corte');
});

test('causality combines manual links with designed scenes in manuscript order', () => {
  let state = ensureSceneDesign(emptyNarrative(), 's2');
  state = updateSceneDesign(state, 's2', { resultado: 'Acepta el trato', consecuencia: 'Pierde un aliado' });
  state = addCausalLink(state, { action: 'Lee la carta', sourceSceneId: 's1' });
  const manual = state.causalLinks[0];
  state = updateCausalLink(state, manual.id, { delayedConsequence: 'La corte descubre la traición', payoffSceneId: 's2' });
  const rows = deriveCausalRows(state, structure());
  assert.equal(rows[0].sourceSceneId, 's1');
  assert.ok(rows.some((item) => item.id === 'scene:s2' && item.immediateConsequence === 'Pierde un aliado'));
});

test('orphan scene/chapter/causal references are diagnostics, not render failures', () => {
  let state = ensureSceneDesign(emptyNarrative(), 'missing-scene');
  state = ensureChapterDesign(state, 'missing-chapter');
  state = addCausalLink(state, { action: 'Algo ocurre', sourceSceneId: 'missing-scene' });
  const diagnostics = runDiagnostics({ narrative: state, structure: structure(), codex: [] });
  assert.ok(diagnostics.some((item) => item.type === 'referencia-rota' && item.involvedIds.sceneIds.includes('missing-scene')));
  assert.ok(diagnostics.some((item) => item.type === 'referencia-rota' && item.involvedIds.chapterIds.includes('missing-chapter')));
  assert.ok(diagnostics.some((item) => item.type === 'causa-sin-consecuencia'));
});

test('Plan and Write render the shared scene narrative editor and shared persistence callback', async () => {
  const source = await readFile(new URL('../src/novel-studio/NovelStudioApp.jsx', import.meta.url), 'utf8');
  assert.match(source, /function PlanPage\(\{[^}]*narrative, setNarrative/);
  assert.match(source, /function WritePage\(\{[^}]*narrative, setNarrative/);
  assert.ok((source.match(/<SceneDesignEditor/g) || []).length >= 2);
  assert.match(source, /setNarrative=\{persistNarrative\}/);
});
