import test from "node:test";
import assert from "node:assert/strict";
import { createActWithContent } from "../src/novel-studio/model.js";
import {
  createFrameworkInstance,
  createSceneDesign,
  emptyNarrative,
} from "../src/novel-studio/narrative/model.js";
import {
  filterDismissed,
  runDiagnostics,
} from "../src/novel-studio/narrative/diagnostics.js";

function oneSceneStructure() {
  const { act, scene } = createActWithContent(1);
  scene.title = "La puerta cerrada";
  return {
    schemaVersion: 1,
    acts: [act],
    scenes: { [scene.id]: scene },
  };
}

test("runDiagnostics usa el contrato de objeto y normaliza una narrativa ausente", () => {
  assert.deepEqual(runDiagnostics(), []);
  assert.deepEqual(runDiagnostics({ narrative: null }), []);
});

test("detecta un protagonista sin objetivo global", () => {
  const narrative = emptyNarrative();
  narrative.foundation.protagonistaId = "character-ada";

  const diagnostics = runDiagnostics({ narrative, structure: oneSceneStructure(), codex: [] });
  const diagnostic = diagnostics.find((item) => item.type === "protagonista-sin-objetivo");

  assert.ok(diagnostic);
  assert.equal(diagnostic.id, "protagonista-sin-objetivo:character-ada");
  assert.equal(diagnostic.severity, "aviso");
  assert.deepEqual(diagnostic.involvedIds.codexIds, ["character-ada"]);
});

test("detecta un objetivo global que todavía no tiene protagonista", () => {
  const narrative = emptyNarrative();
  narrative.foundation.objetivoGlobal = "Encontrar la ciudad sumergida";

  const diagnostics = runDiagnostics({ narrative, structure: oneSceneStructure() });
  const diagnostic = diagnostics.find((item) => item.id === "objetivo-sin-protagonista");

  assert.ok(diagnostic);
  assert.equal(diagnostic.type, "protagonista-sin-objetivo");
  assert.deepEqual(diagnostic.involvedIds.codexIds, []);
});

test("una escena sin ficha de diseño no produce diagnósticos de escena", () => {
  const narrative = emptyNarrative();
  const structure = oneSceneStructure();

  const diagnostics = runDiagnostics({ narrative, structure });

  assert.equal(diagnostics.some((item) => item.type.startsWith("scene-")), false);
});

test("una ficha de escena sin objetivo señala la escena y su capítulo", () => {
  const narrative = emptyNarrative();
  const structure = oneSceneStructure();
  const scene = Object.values(structure.scenes)[0];
  const chapter = structure.acts[0].chapters[0];
  narrative.sceneDesigns[scene.id] = createSceneDesign(scene.id);

  const diagnostics = runDiagnostics({ narrative, structure });
  const diagnostic = diagnostics.find((item) => item.id === `scene-sin-objetivo:${scene.id}`);

  assert.ok(diagnostic);
  assert.match(diagnostic.where, /La puerta cerrada/);
  assert.deepEqual(diagnostic.involvedIds.sceneIds, [scene.id]);
  assert.deepEqual(diagnostic.involvedIds.chapterIds, [chapter.id]);
});

test("una etapa activa sin escenas asignadas genera un diagnóstico explicable", () => {
  const narrative = emptyNarrative();
  const framework = createFrameworkInstance({
    name: "Estructura flexible",
    stages: [{ name: "Cruzar el umbral" }],
  });
  framework.activa = true;
  narrative.frameworkInstances = [framework];

  const diagnostics = runDiagnostics({ narrative, structure: oneSceneStructure() });
  const diagnostic = diagnostics.find((item) => item.id === `stage-sin-asignacion:${framework.stages[0].id}`);

  assert.ok(diagnostic);
  assert.equal(diagnostic.type, "stage-sin-asignacion");
  assert.deepEqual(diagnostic.involvedIds.stageIds, [framework.stages[0].id]);
  assert.ok(diagnostic.why.length > 0);
  assert.ok(diagnostic.suggestions.length > 0);
});

test("una etapa con una escena asignada no se marca como vacía", () => {
  const narrative = emptyNarrative();
  const structure = oneSceneStructure();
  const scene = Object.values(structure.scenes)[0];
  const framework = createFrameworkInstance({
    name: "Estructura flexible",
    stages: [{ name: "Decisión" }],
  });
  framework.activa = true;
  framework.assignments = { [framework.stages[0].id]: [scene.id] };
  narrative.frameworkInstances = [framework];

  const diagnostics = runDiagnostics({ narrative, structure });

  assert.equal(
    diagnostics.some((item) => item.id === `stage-sin-asignacion:${framework.stages[0].id}`),
    false,
  );
});

test("filterDismissed acepta cualquier iterable y no modifica la lista original", () => {
  const diagnostics = [
    { id: "uno", title: "Primero" },
    { id: "dos", title: "Segundo" },
    { id: "tres", title: "Tercero" },
  ];

  const filtered = filterDismissed(diagnostics, new Set(["uno", "tres"]));

  assert.deepEqual(filtered, [{ id: "dos", title: "Segundo" }]);
  assert.equal(diagnostics.length, 3);
  assert.deepEqual(filterDismissed(diagnostics), diagnostics);
  assert.notEqual(filterDismissed(diagnostics), diagnostics);
});
