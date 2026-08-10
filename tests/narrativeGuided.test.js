import test from "node:test";
import assert from "node:assert/strict";
import {
  NARRATIVE_SCHEMA_VERSION,
  createFoundation,
  createFrameworkInstance,
  createStoryBeat,
  emptyNarrative,
  normalizeNarrative,
} from "../src/novel-studio/narrative/model.js";
import { nextBestStep } from "../src/novel-studio/narrative/guided.js";

function narrativeWithFoundation() {
  const narrative = emptyNarrative();
  narrative.foundation.idea = "Una isla que desaparece cada noche.";
  narrative.foundation.premisa = "Una cartógrafa busca una isla que desaparece cada noche.";
  narrative.foundation.protagonistaId = "character-1";
  narrative.foundation.objetivoGlobal = "Encontrar la isla antes del eclipse.";
  narrative.foundation.conflictoCentral = "El mapa se reescribe después de cada decisión.";
  return narrative;
}

test("normalizeNarrative convierte entradas inválidas en un modelo completo", () => {
  for (const value of [undefined, null, false, [], "narrativa"]) {
    const normalized = normalizeNarrative(value);
    assert.equal(normalized.schemaVersion, NARRATIVE_SCHEMA_VERSION);
    assert.deepEqual(normalized.storyBeats, []);
    assert.equal(normalized.foundation.premisa, "");
    assert.equal(normalized.opening.deQue.incidente, "");
    assert.deepEqual(normalized.sceneDesigns, {});
  }
});

test("normalizeNarrative rellena datos antiguos y conserva campos conocidos y futuros", () => {
  const old = {
    schemaVersion: 0,
    foundation: { premisa: "Una promesa imposible", extensionFutura: "se conserva" },
    storyBeats: [{ id: "beat-1", title: "La llamada" }],
    campoFuturo: { activo: true },
  };
  const normalized = normalizeNarrative(old);

  assert.equal(normalized.schemaVersion, NARRATIVE_SCHEMA_VERSION);
  assert.equal(normalized.foundation.premisa, "Una promesa imposible");
  assert.equal(normalized.foundation.objetivoGlobal, "");
  assert.equal(normalized.foundation.extensionFutura, "se conserva");
  assert.deepEqual(normalized.storyBeats, old.storyBeats);
  assert.deepEqual(normalized.campoFuturo, { activo: true });
  assert.equal(old.schemaVersion, 0, "la normalización no debe mutar la entrada");
});

test("las fábricas crean objetos independientes y valores narrativos seguros", () => {
  const first = createFoundation();
  const second = createFoundation();
  first.fieldStatus.premisa = "definido";
  assert.deepEqual(second.fieldStatus, {});

  const beat = createStoryBeat({ title: "  Giro  ", description: "Algo cambia" });
  assert.ok(beat.id);
  assert.equal(beat.title, "  Giro  ");
  assert.equal(beat.status, "borrador");
  assert.deepEqual(beat.codexIds, []);
  assert.ok(!Number.isNaN(Date.parse(beat.createdAt)));
});

test("el guiado comienza por la idea, sigue con la premisa y tolera entradas parciales", () => {
  assert.equal(nextBestStep(null).id, "definir-idea");
  assert.equal(nextBestStep({ foundation: { idea: "Una ciudad sin sombras", premisa: "   " } }).id, "definir-premisa");
});

test("el guiado recorre protagonista, objetivo y conflicto en ese orden", () => {
  const narrative = emptyNarrative();
  narrative.foundation.idea = "La luz desaparece.";
  narrative.foundation.premisa = "Alguien debe recuperar la luz.";
  assert.equal(nextBestStep(narrative).id, "elegir-protagonista");

  narrative.foundation.protagonistaId = "character-1";
  assert.equal(nextBestStep(narrative).id, "definir-objetivo");

  narrative.foundation.objetivoGlobal = "Recuperar la luz.";
  assert.equal(nextBestStep(narrative).id, "definir-conflicto");
});

test("tras completar la brújula recomienda una estructura", () => {
  const step = nextBestStep(narrativeWithFoundation());
  assert.equal(step.id, "elegir-estructura");
  assert.equal(step.tab, "estructura");
});

test("reconoce frameworks activos nuevos y antiguos y después pide un beat", () => {
  const narrative = narrativeWithFoundation();
  const framework = createFrameworkInstance({
    name: "Tres actos",
    stages: [{ name: "Inicio" }],
  });
  framework.active = false;
  narrative.frameworkInstances = [framework];
  narrative.activeFrameworkId = framework.id;

  assert.equal(nextBestStep(narrative).id, "crear-momento-clave");

  delete narrative.activeFrameworkId;
  framework.active = true;
  assert.equal(nextBestStep(narrative).id, "crear-momento-clave");
});

test("recomienda asignar el beat y termina al existir una relación estructural", () => {
  const narrative = narrativeWithFoundation();
  const framework = createFrameworkInstance({
    name: "Personalizada",
    stages: [{ name: "Decisión" }],
  });
  const beat = createStoryBeat({ title: "No hay vuelta atrás" });
  narrative.frameworkInstances = [framework];
  narrative.storyBeats = [beat];

  assert.equal(nextBestStep(narrative).id, "relacionar-estructura");

  narrative.assignments = [{
    id: "assignment-1",
    stageId: framework.stages[0].id,
    storyBeatIds: [beat.id],
    sceneIds: [],
    chapterIds: [],
    actIds: [],
  }];
  assert.equal(nextBestStep(narrative), null);
});

test("no exige asignaciones cuando todas las etapas se omiten", () => {
  const narrative = narrativeWithFoundation();
  const framework = createFrameworkInstance({
    name: "Flexible",
    stages: [{ name: "Etapa opcional", omitted: true }],
  });
  // createFrameworkInstance aplica defaults, pero conserva las propiedades de entrada.
  framework.stages[0].omitted = true;
  narrative.frameworkInstances = [framework];
  narrative.storyBeats = [createStoryBeat({ title: "Un giro" })];

  assert.equal(nextBestStep(narrative), null);
});

test("si ya hay escenas, recomienda vincularlas con el diseño", () => {
  const narrative = narrativeWithFoundation();
  const framework = createFrameworkInstance({ name: "Flexible", stages: [{ name: "Giro" }] });
  const beat = createStoryBeat({ title: "Cambio" });
  narrative.frameworkInstances = [framework];
  narrative.storyBeats = [beat];
  narrative.assignments = [{
    id: "assignment-1", stageInstanceId: framework.id, stageId: framework.stages[0].id,
    storyBeatIds: [beat.id], sceneIds: [], chapterIds: [], actIds: [],
  }];
  const structure = { scenes: { "scene-1": { id: "scene-1", archived: false } } };

  assert.equal(nextBestStep(narrative, { structure }).id, "vincular-escena");
  narrative.storyBeats[0].sceneIds = ["scene-1"];
  assert.equal(nextBestStep(narrative, { structure }), null);
});
