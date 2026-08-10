import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNarrativeFieldPrompt } from '../src/novel-studio/narrative/narrativeAssistant.js';

test('construye un prompt de campo narrativo con contexto circundante y sin metadatos de persistencia', () => {
  const prompt = buildNarrativeFieldPrompt({
    label: 'Objetivo dramático',
    instruction: '¿Qué persigue este personaje durante la novela?',
    currentValue: '',
    foundation: { premisa: 'Una médica investiga una desaparición.', updatedAt: 'ignorar' },
    context: { perfil: { stakes: 'Perder a su hermana', createdAt: 'ignorar' } },
    characters: [{ name: 'Elena', description: 'Médica reservada y persistente.' }],
    scenes: [{ title: 'La carta', summary: 'Elena recibe una amenaza.', prose: 'La firma pertenece a su hermana.' }],
  });
  assert.match(prompt, /¿Qué persigue este personaje durante la novela\?/);
  assert.match(prompt, /Una médica investiga una desaparición/);
  assert.match(prompt, /Médica reservada y persistente/);
  assert.match(prompt, /La firma pertenece a su hermana/);
  assert.doesNotMatch(prompt, /updatedAt|createdAt/);
});
