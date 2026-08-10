import test from "node:test";
import assert from "node:assert/strict";
import { emptyNarrative } from "../src/novel-studio/narrative/model.js";
import { FRAMEWORK_TEMPLATES } from "../src/novel-studio/narrative/frameworkTemplates.js";
import {
  addStage, addStoryBeat, assign, compareFrameworks, createCustomFramework,
  instantiateFramework, mergeStages, removeFramework, removeStage, removeStoryBeat, reorderStages,
  sceneAssignments, setActiveFramework, unassign, updateStage, updateStoryBeat,
} from "../src/novel-studio/narrative/engine.js";

function withBeatAndFramework(templateId = "tres-actos") {
  let narrative = addStoryBeat(emptyNarrative(), { title: "La decisión", description: "Ya no hay vuelta atrás" });
  narrative = instantiateFramework(narrative, templateId);
  return narrative;
}

test("las plantillas incluidas tienen etapas completas y claves únicas", () => {
  assert.deepEqual(FRAMEWORK_TEMPLATES.map((template) => [template.id, template.stages.length]), [
    ["truby-22", 22],
    ["heroe-vogler", 12],
    ["tres-actos", 3],
  ]);
  for (const template of FRAMEWORK_TEMPLATES) {
    assert.equal(new Set(template.stages.map((stage) => stage.key)).size, template.stages.length);
  }
});

test("instanciar una plantilla crea copias editables sin mutar el catálogo", () => {
  const before = structuredClone(FRAMEWORK_TEMPLATES);
  let narrative = instantiateFramework(emptyNarrative(), "tres-actos");
  const framework = narrative.frameworkInstances[0];
  narrative = updateStage(narrative, framework.id, framework.stages[0].id, { name: "Mi comienzo" });

  assert.equal(narrative.frameworkInstances[0].stages[0].name, "Mi comienzo");
  assert.deepEqual(FRAMEWORK_TEMPLATES, before);
  assert.notEqual(framework.stages[0].id, FRAMEWORK_TEMPLATES[2].stages[0].id);
});

test("cambiar de framework conserva momentos y permite volver a activar otro", () => {
  let narrative = withBeatAndFramework();
  const firstId = narrative.activeFrameworkId;
  narrative = instantiateFramework(narrative, "heroe-vogler");
  const secondId = narrative.activeFrameworkId;

  assert.equal(narrative.storyBeats[0].title, "La decisión");
  assert.notEqual(firstId, secondId);
  assert.equal(narrative.frameworkInstances.find((item) => item.id === firstId).active, false);

  narrative = setActiveFramework(narrative, firstId);
  assert.equal(narrative.activeFrameworkId, firstId);
  assert.equal(narrative.frameworkInstances.find((item) => item.id === secondId).active, false);
});

test("eliminar una lente limpia solo sus enlaces y activa otra disponible", () => {
  let narrative = withBeatAndFramework();
  const first = narrative.frameworkInstances[0];
  const firstStage = first.stages[0];
  narrative = assign(narrative, first.id, firstStage.id, "beats", narrative.storyBeats[0].id);
  narrative = assign(narrative, first.id, firstStage.id, "scenes", "scene-1");
  narrative = instantiateFramework(narrative, "heroe-vogler");
  const second = narrative.frameworkInstances[1];
  narrative = assign(narrative, second.id, second.stages[0].id, "scenes", "scene-2");
  narrative = {
    ...narrative,
    sceneDesigns: { "scene-1": { id: "design-1", sceneId: "scene-1", objetivo: "Llegar", stageIds: [firstStage.id, second.stages[0].id] } },
    characterArcs: [{ id: "arc-1", codexId: "character-1", beats: [{ id: "arc-beat-1", label: "Prueba", stageId: firstStage.id }] }],
    frameworkCorrespondences: [{ id: "mapping-1", frameworkAId: first.id, stageAId: firstStage.id, frameworkBId: second.id, stageBId: second.stages[0].id }],
  };

  const next = removeFramework(narrative, second.id);
  assert.equal(next.frameworkInstances.length, 1);
  assert.equal(next.activeFrameworkId, first.id);
  assert.equal(next.frameworkInstances[0].active, true);
  assert.equal(next.storyBeats.length, 1);
  assert.equal(next.sceneDesigns["scene-1"].objetivo, "Llegar");
  assert.deepEqual(next.sceneDesigns["scene-1"].stageIds, [firstStage.id]);
  assert.equal(next.characterArcs[0].beats[0].stageId, firstStage.id);
  assert.equal(next.frameworkCorrespondences.length, 0);
  assert.equal(next.assignments.some((item) => item.stageInstanceId === second.id), false);
  assert.equal(next.assignments.some((item) => item.stageInstanceId === first.id), true);
  assert.equal(narrative.frameworkInstances.length, 2);
});

test("eliminar la última lente deja el diseño utilizable y conserva escenas y momentos", () => {
  let narrative = withBeatAndFramework();
  const framework = narrative.frameworkInstances[0];
  const stage = framework.stages[0];
  narrative = assign(narrative, framework.id, stage.id, "scenes", "scene-1");
  narrative.sceneDesigns = { "scene-1": { id: "design-1", sceneId: "scene-1", consecuencia: "Debe huir", stageIds: [stage.id] } };
  narrative.characterArcs = [{ id: "arc-1", beats: [{ id: "arc-beat-1", stageId: stage.id }] }];

  const next = removeFramework(narrative, framework.id);
  assert.deepEqual(next.frameworkInstances, []);
  assert.equal(next.activeFrameworkId, null);
  assert.deepEqual(next.assignments, []);
  assert.deepEqual(next.sceneDesigns["scene-1"].stageIds, []);
  assert.equal(next.sceneDesigns["scene-1"].consecuencia, "Debe huir");
  assert.equal(next.characterArcs[0].beats[0].stageId, null);
  assert.equal(next.storyBeats[0].title, "La decisión");
});

test("las asignaciones son many-to-many, idempotentes y consultables a la inversa", () => {
  let narrative = withBeatAndFramework();
  const framework = narrative.frameworkInstances[0];
  const [firstStage, secondStage] = framework.stages;
  const beatId = narrative.storyBeats[0].id;

  narrative = assign(narrative, framework.id, firstStage.id, "beats", beatId);
  narrative = assign(narrative, framework.id, secondStage.id, "beats", beatId);
  narrative = assign(narrative, framework.id, firstStage.id, "scenes", "scene-1");
  narrative = assign(narrative, framework.id, firstStage.id, "scenes", "scene-1");

  assert.equal(sceneAssignments(narrative, "beat", beatId).length, 2);
  assert.equal(sceneAssignments(narrative, "scene", "scene-1").length, 1);
  assert.deepEqual(
    narrative.frameworkInstances[0].stages[0].assignments.scenes,
    ["scene-1"],
  );

  narrative = unassign(narrative, framework.id, firstStage.id, "scenes", "scene-1");
  assert.deepEqual(sceneAssignments(narrative, "scene", "scene-1"), []);
});

test("reordenar y quitar etapas no borra los momentos independientes", () => {
  let narrative = withBeatAndFramework();
  const framework = narrative.frameworkInstances[0];
  const removedStageId = framework.stages[0].id;
  const beatId = narrative.storyBeats[0].id;
  narrative = assign(narrative, framework.id, removedStageId, "beats", beatId);
  narrative = reorderStages(narrative, framework.id, 0, 2);
  assert.equal(narrative.frameworkInstances[0].stages[2].id, removedStageId);

  narrative = removeStage(narrative, framework.id, removedStageId);
  assert.equal(narrative.storyBeats[0].id, beatId);
  assert.equal(narrative.assignments.some((item) => item.stageId === removedStageId), false);
  assert.deepEqual(narrative.frameworkInstances[0].stages.map((stage) => stage.position), [0, 1]);
});

test("fusionar etapas reúne contenido y asignaciones sin borrar elementos", () => {
  let narrative = withBeatAndFramework();
  const framework = narrative.frameworkInstances[0];
  const [first, second] = framework.stages;
  const beatId = narrative.storyBeats[0].id;
  narrative = assign(narrative, framework.id, first.id, "beats", beatId);
  narrative = assign(narrative, framework.id, second.id, "scenes", "scene-1");
  narrative = mergeStages(narrative, framework.id, first.id, second.id);

  const merged = narrative.frameworkInstances[0].stages[0];
  assert.equal(narrative.frameworkInstances[0].stages.length, 2);
  assert.match(merged.name, /Acto I.*Acto II/);
  assert.deepEqual(merged.assignments.beats, [beatId]);
  assert.deepEqual(merged.assignments.scenes, ["scene-1"]);
  assert.equal(narrative.assignments.some((item) => item.stageId === second.id), false);
  assert.equal(narrative.storyBeats.length, 1);
});

test("editar y eliminar un momento actualiza todas sus referencias", () => {
  let narrative = withBeatAndFramework();
  const framework = narrative.frameworkInstances[0];
  const stage = framework.stages[0];
  const beatId = narrative.storyBeats[0].id;
  narrative = assign(narrative, framework.id, stage.id, "beats", beatId);
  narrative = updateStoryBeat(narrative, beatId, { title: "Decisión definitiva" });
  assert.equal(narrative.storyBeats[0].title, "Decisión definitiva");

  narrative = removeStoryBeat(narrative, beatId);
  assert.equal(narrative.storyBeats.length, 0);
  assert.equal(narrative.assignments.some((item) => item.storyBeatIds.includes(beatId)), false);
  assert.equal(narrative.frameworkInstances[0].stages[0].assignments.beats.includes(beatId), false);
});

test("los momentos conservan enlaces directos al Codex y a escenas", () => {
  let narrative = addStoryBeat(emptyNarrative(), { title: "Encuentro", codexIds: ["char-1"], sceneIds: ["scene-1"] });
  assert.deepEqual(narrative.storyBeats[0].codexIds, ["char-1"]);
  assert.deepEqual(narrative.storyBeats[0].sceneIds, ["scene-1"]);
  narrative = updateStoryBeat(narrative, narrative.storyBeats[0].id, { sceneIds: ["scene-2"] });
  assert.deepEqual(narrative.storyBeats[0].sceneIds, ["scene-2"]);
});

test("frameworks personalizados y comparación no alteran el diseño existente", () => {
  let narrative = withBeatAndFramework();
  const first = narrative.frameworkInstances[0];
  narrative = assign(narrative, first.id, first.stages[0].id, "beats", narrative.storyBeats[0].id);
  narrative = createCustomFramework(narrative, { name: "Mi marco", stages: [{ name: "Umbral" }] });
  const custom = narrative.frameworkInstances.at(-1);
  narrative = addStage(narrative, custom.id, { name: "Consecuencia" });
  narrative = assign(narrative, custom.id, custom.stages[0].id, "beats", narrative.storyBeats[0].id);

  const rows = compareFrameworks(narrative, first.id, custom.id);
  assert.equal(rows.length, 1);
  assert.match(rows[0].a, /Acto I/);
  assert.equal(rows[0].b, "Umbral");
  assert.equal(narrative.storyBeats.length, 1);
});
