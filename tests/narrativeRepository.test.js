import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { LocalWorkspaceRepository } from "../src/novel-studio/LocalWorkspaceRepository.js";
import { NARRATIVE_SCHEMA_VERSION } from "../src/novel-studio/narrative/model.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function fileSystemError(name, message) {
  const error = new Error(message);
  error.name = name;
  return error;
}

async function bytesFrom(data) {
  if (typeof data === "string") return encoder.encode(data);
  if (data instanceof Uint8Array) return data.slice();
  if (data instanceof ArrayBuffer) return new Uint8Array(data.slice(0));
  if (typeof data?.arrayBuffer === "function") return new Uint8Array(await data.arrayBuffer());
  return encoder.encode(String(data ?? ""));
}

class MemoryFileHandle {
  kind = "file";

  constructor(name) {
    this.name = name;
    this.bytes = new Uint8Array();
    this.lastModified = Date.now();
  }

  async getFile() {
    const bytes = this.bytes.slice();
    return {
      name: this.name,
      size: bytes.byteLength,
      lastModified: this.lastModified,
      async text() { return decoder.decode(bytes); },
      async arrayBuffer() { return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength); },
    };
  }

  async createWritable() {
    let pending = this.bytes.slice();
    return {
      write: async (data) => { pending = await bytesFrom(data); },
      close: async () => {
        this.bytes = pending;
        this.lastModified = Date.now();
      },
      abort: async () => {},
    };
  }
}

class MemoryDirectoryHandle {
  kind = "directory";

  constructor(name) {
    this.name = name;
    this.children = new Map();
  }

  async getDirectoryHandle(name, { create = false } = {}) {
    const child = this.children.get(name);
    if (child?.kind === "directory") return child;
    if (child) throw fileSystemError("TypeMismatchError", `${name} no es una carpeta`);
    if (!create) throw fileSystemError("NotFoundError", `No existe la carpeta ${name}`);
    const directory = new MemoryDirectoryHandle(name);
    this.children.set(name, directory);
    return directory;
  }

  async getFileHandle(name, { create = false } = {}) {
    const child = this.children.get(name);
    if (child?.kind === "file") return child;
    if (child) throw fileSystemError("TypeMismatchError", `${name} no es un archivo`);
    if (!create) throw fileSystemError("NotFoundError", `No existe el archivo ${name}`);
    const file = new MemoryFileHandle(name);
    this.children.set(name, file);
    return file;
  }

  async removeEntry(name, { recursive = false } = {}) {
    const child = this.children.get(name);
    if (!child) throw fileSystemError("NotFoundError", `No existe ${name}`);
    if (child.kind === "directory" && child.children.size && !recursive) {
      throw fileSystemError("InvalidModificationError", `${name} no está vacío`);
    }
    this.children.delete(name);
  }

  async *entries() { yield* this.children.entries(); }
  async *values() { yield* this.children.values(); }
}

async function directoryAt(root, path) {
  let directory = root;
  for (const part of path.split("/").filter(Boolean)) directory = await directory.getDirectoryHandle(part);
  return directory;
}

async function jsonAt(root, path) {
  const parts = path.split("/");
  const file = await (await directoryAt(root, parts.slice(0, -1).join("/"))).getFileHandle(parts.at(-1));
  return JSON.parse(await (await file.getFile()).text());
}

async function writeJsonAt(root, path, value) {
  const parts = path.split("/");
  const directory = await directoryAt(root, parts.slice(0, -1).join("/"));
  const writable = await (await directory.getFileHandle(parts.at(-1), { create: true })).createWritable();
  await writable.write(`${JSON.stringify(value)}\n`);
  await writable.close();
}

async function repositoryFixture() {
  const root = new MemoryDirectoryHandle("Novelas");
  const repository = new LocalWorkspaceRepository();
  await repository.initialize(root);
  repository.root = root;
  repository.manifest = await repository.validateWorkspace();
  return { repository, root };
}

test("createNovel initializes narrative.json and readNarrative returns a complete model", async () => {
  const { repository, root } = await repositoryFixture();
  const novel = await repository.createNovel({ title: "La ciudad sumergida", author: "Ada" });

  const stored = await jsonAt(root, `novels/${novel.id}/design/narrative.json`);
  const narrative = await repository.readNarrative(novel.id);

  assert.equal(stored.schemaVersion, NARRATIVE_SCHEMA_VERSION);
  assert.equal(narrative.schemaVersion, NARRATIVE_SCHEMA_VERSION);
  assert.deepEqual(narrative.storyBeats, []);
  assert.equal(narrative.foundation.idea, "");
});

test("saveNarrative normalizes, queues and persists narrative data", async () => {
  const { repository, root } = await repositoryFixture();
  const novel = await repository.createNovel({ title: "La órbita" });

  const saved = await repository.saveNarrative(novel.id, {
    schemaVersion: 0,
    foundation: { idea: "Una cartógrafa encuentra un planeta imposible.", protagonistaId: "character-ada" },
    storyBeats: "entrada antigua inválida",
  });
  await repository.flush();
  const stored = await jsonAt(root, `novels/${novel.id}/design/narrative.json`);

  assert.equal(saved.schemaVersion, NARRATIVE_SCHEMA_VERSION);
  assert.equal(saved.foundation.idea, "Una cartógrafa encuentra un planeta imposible.");
  assert.equal(saved.foundation.protagonistaId, "character-ada");
  assert.deepEqual(saved.storyBeats, []);
  assert.deepEqual(stored, saved);
  assert.equal((await repository.readNarrative(novel.id)).foundation.protagonistaId, "character-ada");
  assert.match(saved.updatedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test("phase 2 survives save, tab changes represented by in-memory edits, and disk reload", async () => {
  const { repository } = await repositoryFixture();
  const novel = await repository.createNovel({ title: "Rainiero" });
  const state = await repository.readNarrative(novel.id);
  state.characterProfiles.push({ id: "profile-r", codexId: "rainiero", dramaticGoal: "Recuperar la corona", futureField: "preservar" });
  state.characterArcs.push({ id: "arc-r", codexId: "rainiero", type: "positivo", beats: [{ id: "beat-r", label: "Renuncia", order: 0, sceneId: "scene-1" }] });
  state.plots.push({ id: "plot-main", name: "La sucesión", type: "principal", sceneIds: ["scene-1"], characterIds: ["rainiero"] });
  state.opening.deQue.incidente = "El rey desaparece";
  await repository.saveNarrative(novel.id, state);
  await repository.flush();

  const reloaded = await repository.readNarrative(novel.id);
  assert.equal(reloaded.characterProfiles[0].dramaticGoal, "Recuperar la corona");
  assert.equal(reloaded.characterProfiles[0].futureField, "preservar");
  assert.equal(reloaded.characterArcs[0].beats[0].sceneId, "scene-1");
  assert.deepEqual(reloaded.plots[0].characterIds, ["rainiero"]);
  assert.equal(reloaded.opening.deQue.incidente, "El rey desaparece");
});

test("phase 3 persists the same scene/chapter design and causal links after reload", async () => {
  const { repository } = await repositoryFixture();
  const novel = await repository.createNovel({ title: "Cadena causal" });
  const state = await repository.readNarrative(novel.id);
  state.sceneDesigns["scene-1"] = { id: "sd-1", sceneId: "scene-1", objetivo: "Escapar", oposicion: "La guardia", consecuencia: "Pierde el mapa", characterGoals: [], plotIds: ["plot-1"] };
  state.chapterDesigns["chapter-1"] = { id: "cd-1", chapterId: "chapter-1", objetivo: "Cerrar la salida", pruebaNecesidad: { cambia: "Ya no puede volver" }, funcionesCumplidas: ["trama"] };
  state.causalLinks.push({ id: "cause-1", action: "Quema el puente", immediateConsequence: "Queda atrapado", sourceSceneId: "scene-1", payoffSceneId: "scene-2", characterIds: ["rainiero"], plotIds: ["plot-1"] });
  await repository.saveNarrative(novel.id, state);
  await repository.flush();
  const reloaded = await repository.readNarrative(novel.id);
  assert.equal(reloaded.sceneDesigns["scene-1"].consecuencia, "Pierde el mapa");
  assert.deepEqual(reloaded.sceneDesigns["scene-1"].plotIds, ["plot-1"]);
  assert.equal(reloaded.chapterDesigns["chapter-1"].pruebaNecesidad.cambia, "Ya no puede volver");
  assert.equal(reloaded.causalLinks[0].payoffSceneId, "scene-2");
});

test("phase 4 persists theme elaboration, motifs, conflicts and revelations", async () => {
  const { repository } = await repositoryFixture();
  const novel = await repository.createNovel({ title: "Tema y revelación" });
  const state = await repository.readNarrative(novel.id);
  state.foundation.premisa = "El poder exige una renuncia";
  state.themeAxis.valorA = "Deber"; state.themeAxis.valorB = "Libertad";
  state.themeAxis.decisionPoints.push({ id: "decision-1", text: "Abdica", sceneId: "scene-3", position: "Libertad" });
  state.symbols.push({ id: "symbol-1", name: "Corona", type: "objeto", codexIds: ["corona"], tracking: true, repeticiones: [{ id: "rep-1", sceneId: "scene-2", note: "Se rompe" }] });
  state.conflictThreads.push({ id: "conflict-1", name: "Sucesión", protagonistaId: "rainiero", nonPersonalAdversary: "La ley", protagonista: { objetivo: "Abdicar" }, adversario: {}, escalada: [] });
  state.reveals.push({ id: "reveal-1", title: "La heredera", info: "Isabel heredará", sceneId: "scene-3", quienDescubreId: "rainiero", quienSabiaIds: ["isabel"] });
  await repository.saveNarrative(novel.id, state); await repository.flush();
  const reloaded = await repository.readNarrative(novel.id);
  assert.equal(reloaded.foundation.premisa, "El poder exige una renuncia");
  assert.equal(reloaded.themeAxis.valorA, "Deber");
  assert.equal(reloaded.themeAxis.premisa, undefined);
  assert.equal(reloaded.symbols[0].repeticiones[0].note, "Se rompe");
  assert.equal(reloaded.conflictThreads[0].nonPersonalAdversary, "La ley");
  assert.deepEqual(reloaded.reveals[0].quienSabiaIds, ["isabel"]);
});

test("phase 5 persists dialogue, manual framework mappings and accepted provenance", async () => {
  const { repository } = await repositoryFixture();
  const novel = await repository.createNovel({ title: "Voces cruzadas" });
  const state = await repository.readNarrative(novel.id);
  state.sceneDesigns["scene-dialogue"] = {
    id: "design-dialogue", sceneId: "scene-dialogue",
    dialogue: { enabled: true, participants: [{ id: "speaker-1", codexId: "ada", objective: "Convencer" }], persuasion: { enabled: true, ethos: "Autoridad" } },
  };
  state.frameworkCorrespondences.push({ id: "mapping-1", frameworkAId: "a", stageAId: "a1", frameworkBId: "b", stageBId: "b1", note: "Eco manual" });
  state.acceptedAiProposals.push({ id: "accepted-1", task: "scene-review", target: "sceneDesigns.scene-dialogue.objetivo", provider: "ollama", acceptedAt: "2026-08-09T00:00:00.000Z" });
  await repository.saveNarrative(novel.id, state);
  await repository.flush();

  const reloaded = await repository.readNarrative(novel.id);
  assert.equal(reloaded.sceneDesigns["scene-dialogue"].dialogue.participants[0].objective, "Convencer");
  assert.equal(reloaded.sceneDesigns["scene-dialogue"].dialogue.persuasion.ethos, "Autoridad");
  assert.equal(reloaded.frameworkCorrespondences[0].note, "Eco manual");
  assert.equal(reloaded.acceptedAiProposals[0].provider, "ollama");
});

test("duplicateNovel copies narrative design without sharing later writes", async () => {
  const { repository } = await repositoryFixture();
  const original = await repository.createNovel({ title: "El faro" });
  await repository.saveNarrative(original.id, { foundation: { idea: "Una señal cruza el océano." } });

  const duplicate = await repository.duplicateNovel(original.id);
  assert.equal((await repository.readNarrative(duplicate.id)).foundation.idea, "Una señal cruza el océano.");

  await repository.saveNarrative(duplicate.id, { foundation: { idea: "La señal cambia de rumbo." } });
  assert.equal((await repository.readNarrative(original.id)).foundation.idea, "Una señal cruza el océano.");
});

test("readNarrative falls back for an old novel without design and save creates it", async () => {
  const { repository, root } = await repositoryFixture();
  const novel = await repository.createNovel({ title: "Archivo antiguo" });
  const novelDirectory = await directoryAt(root, `novels/${novel.id}`);
  await novelDirectory.removeEntry("design", { recursive: true });

  const fallback = await repository.readNarrative(novel.id);
  assert.equal(fallback.schemaVersion, NARRATIVE_SCHEMA_VERSION);
  assert.equal(fallback.foundation.idea, "");

  await repository.saveNarrative(novel.id, { foundation: { idea: "Recuperada" } });
  assert.equal((await jsonAt(root, `novels/${novel.id}/design/narrative.json`)).foundation.idea, "Recuperada");
});

test("listCodex recupera el id de personajes antiguos desde el nombre del archivo", async () => {
  const { repository, root } = await repositoryFixture();
  const novel = await repository.createNovel({ title: "Personajes heredados" });
  await writeJsonAt(root, `novels/${novel.id}/codex/rainiero-cardona.json`, {
    type: "character",
    name: "Rainiero Cardona de la Fuente",
    archived: false,
  });

  const [rainiero] = await repository.listCodex(novel.id);
  assert.equal(rainiero.id, "rainiero-cardona");
  await repository.saveNarrative(novel.id, { foundation: { protagonistaId: rainiero.id } });
  assert.equal((await repository.readNarrative(novel.id)).foundation.protagonistaId, "rainiero-cardona");
});

test("el botón global Guardar incluye explícitamente el diseño narrativo actual", async () => {
  const source = await readFile(new URL("../src/novel-studio/NovelStudioApp.jsx", import.meta.url), "utf8");
  assert.match(source, /tasks\.push\(repository\.saveNarrative\(novelId, narrativeRef\.current\)\)/);
  assert.match(source, /setNarrative\(\(current\) => \{/);
  assert.match(source, /repository\.saveNarrative\(novelId, narrative\)/);
  assert.match(source, /Guardar ahora todos los cambios, incluido el diseño narrativo/);
  assert.doesNotMatch(source, /disabled=\{readOnly \|\| saveState === "saving"\} onClick=\{forceSave\}/);
});
