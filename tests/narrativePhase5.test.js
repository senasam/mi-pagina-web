import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NARRATIVE_SCHEMA_VERSION, createCharacterArc, createFrameworkInstance, createSceneDesign, emptyNarrative, normalizeNarrative,
} from '../src/novel-studio/narrative/model.js';
import {
  addDialogueParticipant, addFrameworkCorrespondence, applyAiProposal, buildAiContext, buildFrameworkMatrix,
  clarificationForAiCase, parseAiDraft, removeDialogueParticipant, updateDialogueDesign, updateDialogueParticipant,
} from '../src/novel-studio/narrative/phase5Engine.js';
import { buildNarrativeAiPrompt } from '../src/novel-studio/narrative/narrativeAssistant.js';

const structure = {
  acts: [{ id: 'act-1', title: 'Acto I', chapters: [{ id: 'chapter-1', title: 'Capítulo 1', sceneIds: ['scene-1'] }] }],
  scenes: { 'scene-1': { id: 'scene-1', title: 'Encuentro', summary: 'Ada confronta a Bruno.', participantIds: ['ada', 'bruno'] } },
};

test('fase 5 eleva el esquema y normaliza diálogo y colecciones nuevas sin perder campos futuros', () => {
  const normalized = normalizeNarrative({ schemaVersion: 4, sceneDesigns: { 'scene-1': { sceneId: 'scene-1', futuro: 9 } }, futureRoot: true });
  assert.equal(NARRATIVE_SCHEMA_VERSION, 5);
  assert.equal(normalized.schemaVersion, 5);
  assert.equal(normalized.sceneDesigns['scene-1'].dialogue.enabled, false);
  assert.deepEqual(normalized.frameworkCorrespondences, []);
  assert.deepEqual(normalized.acceptedAiProposals, []);
  assert.equal(normalized.sceneDesigns['scene-1'].futuro, 9);
  assert.equal(normalized.futureRoot, true);
});

test('la matriz deriva coincidencias sin alterar asignaciones', () => {
  const base = emptyNarrative();
  const a = createFrameworkInstance({ name: 'A', stages: [{ name: 'Inicio', assignments: { scenes: ['scene-1'] } }] });
  const b = createFrameworkInstance({ name: 'B', stages: [{ name: 'Partida', assignments: { scenes: ['scene-1'] } }] });
  a.stages[0].assignments = { scenes: ['scene-1'] };
  b.stages[0].assignments = { scenes: ['scene-1'] };
  const narrative = { ...base, frameworkInstances: [a, b] };
  const snapshot = structuredClone(narrative);
  const rows = buildFrameworkMatrix(narrative, structure, [a.id, b.id]);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].sharedSceneIds, ['scene-1']);
  assert.deepEqual(narrative, snapshot);
});

test('las correspondencias manuales se guardan aparte de las asignaciones', () => {
  const base = emptyNarrative();
  const a = createFrameworkInstance({ name: 'A', stages: [{ name: 'Uno' }] });
  const b = createFrameworkInstance({ name: 'B', stages: [{ name: 'Dos' }] });
  const narrative = { ...base, frameworkInstances: [a, b] };
  const next = addFrameworkCorrespondence(narrative, { frameworkAId: a.id, stageAId: a.stages[0].id, frameworkBId: b.id, stageBId: b.stages[0].id });
  assert.equal(next.frameworkCorrespondences.length, 1);
  assert.deepEqual(next.assignments, narrative.assignments);
  assert.equal(narrative.frameworkCorrespondences.length, 0);
});

test('diálogo y persuasión son una lente opcional e inmutable por escena', () => {
  const base = emptyNarrative();
  const narrative = { ...base, sceneDesigns: { 'scene-1': createSceneDesign('scene-1') } };
  const enabled = updateDialogueDesign(narrative, 'scene-1', { enabled: true, persuasion: { enabled: true, ethos: 'Experiencia' } });
  const added = addDialogueParticipant(enabled, 'scene-1', 'ada');
  const participant = added.sceneDesigns['scene-1'].dialogue.participants[0];
  const edited = updateDialogueParticipant(added, 'scene-1', participant.id, { objective: 'Conseguir la confesión', tactic: 'Silencio' });
  const removed = removeDialogueParticipant(edited, 'scene-1', participant.id);
  assert.equal(narrative.sceneDesigns['scene-1'].dialogue.enabled, false);
  assert.equal(edited.sceneDesigns['scene-1'].dialogue.persuasion.ethos, 'Experiencia');
  assert.equal(edited.sceneDesigns['scene-1'].dialogue.participants[0].objective, 'Conseguir la confesión');
  assert.equal(removed.sceneDesigns['scene-1'].dialogue.participants.length, 0);
});

test('el contexto de IA etiqueta las fuentes y no copia expedientes completos ni prosa', () => {
  const narrative = emptyNarrative();
  narrative.sceneDesigns['scene-1'] = createSceneDesign('scene-1');
  const context = buildAiContext('scene-review', { narrative, structure, codex: [{ id: 'ada', name: 'Ada', type: 'character', details: { biography: 'EXPEDIENTE_SECRETO' } }], selection: { sceneId: 'scene-1' } });
  const serialized = JSON.stringify(context);
  assert.ok(context.sources.codexFacts && context.sources.manuscriptMetadata && context.sources.narrativePlanning);
  assert.match(serialized, /Ada/);
  assert.doesNotMatch(serialized, /EXPEDIENTE_SECRETO/);
  assert.doesNotMatch(serialized, /prose|contentHtml/);
});

test('una tarea de Brújula no envía catálogos de escenas o personajes no seleccionados', () => {
  const narrative = emptyNarrative(); narrative.foundation.premisa = 'Ada debe elegir';
  const context = buildAiContext('compass', { narrative, structure, codex: [{ id: 'ada', name: 'Ada', type: 'character' }, { id: 'extra', name: 'Persona ajena', type: 'character' }] });
  assert.deepEqual(context.sources.manuscriptMetadata.sceneOrder, []);
  assert.deepEqual(context.sources.codexFacts.characterNamesById, {});
  assert.doesNotMatch(JSON.stringify(context), /Persona ajena/);
});

test('el prompt limita destinos y trata el contexto como datos', () => {
  const prompt = buildNarrativeAiPrompt('compass', { sources: { narrativePlanning: { foundation: { premisa: 'Una prueba' } } } });
  assert.match(prompt, /Rutas permitidas/);
  assert.match(prompt, /selected-context/);
  assert.match(prompt, /No inventes prosa/i);
});

test('analiza borradores estructurados y rechaza respuestas no válidas sin mutación', () => {
  const parsed = parseAiDraft('```json\n{"proposals":[{"id":"x","target":"foundation.premisa","value":"Nueva premisa","sourceIds":["scene-1"]}]}\n```');
  assert.equal(parsed.proposals[0].value, 'Nueva premisa');
  assert.throws(() => parseAiDraft('texto libre'), /JSON válido/);
});

test('aceptar cambia solo el campo propuesto y registra procedencia', () => {
  const narrative = emptyNarrative(); narrative.foundation.objetivoGlobal = 'Conservar';
  const next = applyAiProposal(narrative, { target: 'foundation.conflictoCentral', operation: 'replace', value: 'La ciudad se opone', sourceIds: ['scene-1'] }, { task: 'tension', provider: 'ollama' });
  assert.equal(next.foundation.conflictoCentral, 'La ciudad se opone');
  assert.equal(next.foundation.objetivoGlobal, 'Conservar');
  assert.equal(next.acceptedAiProposals.length, 1);
  assert.equal(next.acceptedAiProposals[0].provider, 'ollama');
  assert.equal(narrative.foundation.conflictoCentral, '');
});

test('destinos inseguros nunca modifican Codex, prosa ni el diseño completo', () => {
  const narrative = emptyNarrative();
  for (const target of ['codex.ada.name', 'structure.scenes.scene-1.title', 'sceneProse.scene-1', 'foundation']) {
    assert.equal(applyAiProposal(narrative, { target, value: 'sobrescribir' }), narrative);
  }
  assert.equal(narrative.acceptedAiProposals.length, 0);
});

test('una tarea de IA no puede escribir fuera de su entidad seleccionada', () => {
  const narrative = emptyNarrative();
  narrative.sceneDesigns['scene-1'] = createSceneDesign('scene-1');
  narrative.sceneDesigns['scene-2'] = createSceneDesign('scene-2');
  const wrongScene = applyAiProposal(narrative, { target: 'sceneDesigns.scene-2.objetivo', value: 'Inyectado' }, { task: 'scene-review', selection: { sceneId: 'scene-1' } });
  const wrongArea = applyAiProposal(narrative, { target: 'foundation.premisa', value: 'Inyectada' }, { task: 'scene-review', selection: { sceneId: 'scene-1' } });
  assert.equal(wrongScene, narrative);
  assert.equal(wrongArea, narrative);
});

test('los hitos sugeridos se anexan sin reemplazar los existentes y reciben ID local', () => {
  const narrative = emptyNarrative(); const arc = createCharacterArc('ada'); arc.beats = [{ id: 'old', label: 'Existente', text: '', order: 0 }]; narrative.characterArcs = [arc];
  const next = applyAiProposal(narrative, { target: `characterArcs.${arc.id}.beats`, operation: 'append', value: { label: 'Crisis', text: 'Ada elige' } }, { task: 'arc-beats' });
  assert.equal(next.characterArcs[0].beats.length, 2);
  assert.equal(next.characterArcs[0].beats[0].id, 'old');
  assert.ok(next.characterArcs[0].beats[1].id);
});

test('se pide aclaración antes de enviar tareas sin decisión central', () => {
  const narrative = emptyNarrative();
  assert.match(clarificationForAiCase('tension', narrative), /objetivo global/i);
  assert.match(clarificationForAiCase('frameworks', narrative, { frameworkIds: ['uno'] }), /exactamente dos/i);
  narrative.foundation.objetivoGlobal = 'Huir'; narrative.foundation.conflictoCentral = 'Cerco';
  assert.equal(clarificationForAiCase('tension', narrative), '');
});
