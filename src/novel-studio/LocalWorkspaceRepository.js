import JSZip from "jszip";
import {
  SCHEMA_VERSION, createNovelRecord, emptyStructure, markdownBody, nowIso,
  sceneToMarkdown, sha256, safeFileName,
} from "./model.js";

const DB_NAME = "fmd-novel-studio-handles";
const STORE_NAME = "handles";
const HANDLE_KEY = "workspace-directory";

export function normalizePreferences(value = {}) {
  const provider = ["openai", "ollama", "chatgpt-manual"].includes(value.ai?.provider) ? value.ai.provider : "openai";
  return {
    schemaVersion: 1,
    lastNovelId: value.lastNovelId || null,
    lastBackupAt: value.lastBackupAt || null,
    editor: value.editor && typeof value.editor === "object" ? value.editor : {},
    ai: {
      provider,
      enabled: Boolean(value.ai?.enabled),
      apiKey: typeof value.ai?.apiKey === "string" ? value.ai.apiKey : "",
      model: typeof value.ai?.model === "string" && value.ai.model ? value.ai.model : "gpt-5.6-luna",
      ollamaUrl: typeof value.ai?.ollamaUrl === "string" && value.ai.ollamaUrl ? value.ai.ollamaUrl : "http://localhost:11434",
      ollamaModel: typeof value.ai?.ollamaModel === "string" && value.ai.ollamaModel ? value.ai.ollamaModel : "qwen3:4b",
      manualUrl: typeof value.ai?.manualUrl === "string" && value.ai.manualUrl ? value.ai.manualUrl : "https://chatgpt.com/",
    },
  };
}

function openHandleDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeHandle(handle) {
  const db = await openHandleDb();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

async function loadHandle() {
  const db = await openHandleDb();
  const result = await new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(HANDLE_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
}

async function forgetHandle() {
  const db = await openHandleDb();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(HANDLE_KEY);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

async function directoryIsEmpty(handle) {
  for await (const _entry of handle.values()) return false;
  return true;
}

async function getDirectory(root, parts, create = false) {
  let current = root;
  for (const part of parts.filter(Boolean)) current = await current.getDirectoryHandle(part, { create });
  return current;
}

async function getFileHandle(root, parts, create = false) {
  const fileName = parts.at(-1);
  const directory = await getDirectory(root, parts.slice(0, -1), create);
  return directory.getFileHandle(fileName, { create });
}

async function readFile(root, path) {
  const handle = await getFileHandle(root, path.split("/"));
  const file = await handle.getFile();
  return { text: await file.text(), lastModified: file.lastModified, size: file.size };
}

async function writeFile(root, path, data) {
  const handle = await getFileHandle(root, path.split("/"), true);
  const writable = await handle.createWritable();
  try {
    await writable.write(data);
    await writable.close();
  } catch (error) {
    await writable.abort().catch(() => {});
    throw error;
  }
}

async function readJson(root, path) {
  const { text } = await readFile(root, path);
  return JSON.parse(text);
}

async function writeJson(root, path, value) {
  await writeFile(root, path, `${JSON.stringify(value, null, 2)}\n`);
}

async function exists(root, path, kind = "file") {
  try {
    if (kind === "directory") await getDirectory(root, path.split("/"));
    else await getFileHandle(root, path.split("/"));
    return true;
  } catch (error) {
    if (error?.name === "NotFoundError") return false;
    throw error;
  }
}

async function copyDirectoryContents(source, target) {
  for await (const [name, handle] of source.entries()) {
    if (handle.kind === "directory") {
      const next = await target.getDirectoryHandle(name, { create: true });
      await copyDirectoryContents(handle, next);
    } else {
      const writable = await (await target.getFileHandle(name, { create: true })).createWritable();
      await writable.write(await (await handle.getFile()).arrayBuffer());
      await writable.close();
    }
  }
}

function rebaseAsset(asset, sourceNovelId, targetNovelId) {
  if (!asset?.path) return asset || null;
  return { ...asset, path: String(asset.path).replace(`novels/${sourceNovelId}/`, `novels/${targetNovelId}/`) };
}

export class WorkspaceConflictError extends Error {
  constructor(conflict) {
    super("El archivo cambió fuera del estudio.");
    this.name = "WorkspaceConflictError";
    this.conflict = conflict;
  }
}

export class LocalWorkspaceRepository {
  constructor() {
    this.root = null;
    this.manifest = null;
    this.observed = new Map();
    this.writeQueues = new Map();
  }

  static isSupported() {
    return typeof window !== "undefined" && "showDirectoryPicker" in window && "indexedDB" in window;
  }

  get workspaceName() { return this.root?.name || ""; }
  get connected() { return Boolean(this.root && this.manifest); }

  async checkPermission(request = false) {
    if (!this.root) return "denied";
    const options = { mode: "readwrite" };
    let state = await this.root.queryPermission(options);
    if (state !== "granted" && request) state = await this.root.requestPermission(options);
    return state;
  }

  async connect({ mode = "open", createSubfolder = false } = {}) {
    let selected = await window.showDirectoryPicker({ id: "fmd-novel-studio", mode: "readwrite", startIn: "documents" });
    if (await selected.requestPermission({ mode: "readwrite" }) !== "granted") throw new DOMException("Permiso denegado", "NotAllowedError");
    const hasManifest = await exists(selected, "workspace.json");
    if (!hasManifest && mode === "open") throw new Error("La carpeta no contiene un workspace.json válido.");
    if (!hasManifest && mode === "create") {
      if (!(await directoryIsEmpty(selected))) {
        if (!createSubfolder) {
          const error = new Error("La carpeta contiene otros archivos.");
          error.code = "NON_EMPTY_DIRECTORY";
          throw error;
        }
        selected = await selected.getDirectoryHandle("EstudioNovela", { create: true });
        if (!(await directoryIsEmpty(selected)) && !(await exists(selected, "workspace.json"))) {
          throw new Error("La subcarpeta EstudioNovela ya existe y contiene archivos que no pertenecen a un workspace.");
        }
      }
      if (!(await exists(selected, "workspace.json"))) await this.initialize(selected);
    }
    this.root = selected;
    this.manifest = await this.validateWorkspace();
    if (this.manifest.schemaVersion < SCHEMA_VERSION) this.manifest = await this.migrateWorkspace();
    await storeHandle(selected);
    return this.manifest;
  }

  async reconnect({ requestPermission = false } = {}) {
    const handle = await loadHandle();
    if (!handle) return null;
    this.root = handle;
    const permission = await this.checkPermission(requestPermission);
    if (permission !== "granted") return { permission, name: handle.name };
    this.manifest = await this.validateWorkspace();
    if (this.manifest.schemaVersion < SCHEMA_VERSION) this.manifest = await this.migrateWorkspace();
    return { permission, name: handle.name, manifest: this.manifest };
  }

  async restoreWorkspaceBackup(file) {
    if (!file || !/\.zip$/i.test(file.name)) throw new Error("Selecciona un respaldo ZIP válido.");
    const selected = await window.showDirectoryPicker({ id: "fmd-novel-studio-restore", mode: "readwrite", startIn: "documents" });
    if (await selected.requestPermission({ mode: "readwrite" }) !== "granted") throw new DOMException("Permiso denegado", "NotAllowedError");
    if (!(await directoryIsEmpty(selected))) throw new Error("La restauración requiere una carpeta completamente vacía.");
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const manifestEntry = zip.file("workspace.json");
    if (!manifestEntry) throw new Error("El ZIP no contiene workspace.json.");
    let manifest;
    try { manifest = JSON.parse(await manifestEntry.async("text")); } catch { throw new Error("workspace.json está dañado."); }
    if (!manifest || !Array.isArray(manifest.novels) || !Number.isInteger(manifest.schemaVersion)) throw new Error("El respaldo no tiene un manifiesto válido.");
    if (manifest.schemaVersion > SCHEMA_VERSION) throw new Error("El respaldo pertenece a una versión más reciente del estudio.");
    const entries = Object.values(zip.files).filter((entry) => !entry.dir).sort((a, b) => (a.name === "workspace.json" ? 1 : b.name === "workspace.json" ? -1 : a.name.localeCompare(b.name)));
    for (const entry of entries) {
      const normalized = entry.name.replace(/\\/g, "/");
      if (normalized.startsWith("/") || normalized.split("/").includes("..")) throw new Error("El respaldo contiene una ruta insegura.");
    }
    for (const entry of entries) await writeFile(selected, entry.name, await entry.async("uint8array"));
    await getDirectory(selected, ["backups"], true);
    this.root = selected;
    this.manifest = await this.validateWorkspace();
    if (this.manifest.schemaVersion < SCHEMA_VERSION) this.manifest = await this.migrateWorkspace();
    await storeHandle(selected);
    return this.manifest;
  }

  async close() {
    this.root = null;
    this.manifest = null;
    this.observed.clear();
    await forgetHandle();
  }

  async initialize(handle) {
    const timestamp = nowIso();
    const manifest = {
      schemaVersion: SCHEMA_VERSION, workspaceId: crypto.randomUUID(), name: handle.name,
      createdAt: timestamp, updatedAt: timestamp, novels: [],
    };
    await getDirectory(handle, ["novels"], true);
    await getDirectory(handle, ["backups"], true);
    await writeJson(handle, "workspace.json", manifest);
    await writeJson(handle, "preferences.json", normalizePreferences());
  }

  async validateWorkspace() {
    if (!this.root) throw new Error("No hay una carpeta conectada.");
    const manifest = await readJson(this.root, "workspace.json");
    if (!manifest || !Array.isArray(manifest.novels) || !Number.isInteger(manifest.schemaVersion)) throw new Error("workspace.json no es válido.");
    if (manifest.schemaVersion > SCHEMA_VERSION) throw new Error("Este workspace fue creado por una versión más reciente del estudio.");
    this.manifest = manifest;
    return manifest;
  }

  async migrateWorkspace() {
    const manifest = await this.validateWorkspace();
    if (manifest.schemaVersion === SCHEMA_VERSION) return manifest;
    await this.createWorkspaceBackup({ reason: "antes-de-migrar", download: false });
    manifest.schemaVersion = SCHEMA_VERSION;
    manifest.updatedAt = nowIso();
    await writeJson(this.root, "workspace.json", manifest);
    return manifest;
  }

  async saveManifest() {
    this.manifest.updatedAt = nowIso();
    await this.enqueue("workspace.json", () => writeJson(this.root, "workspace.json", this.manifest));
  }

  async preferences() {
    try { return normalizePreferences(await readJson(this.root, "preferences.json")); }
    catch { return normalizePreferences(); }
  }

  async savePreferences(value) {
    const normalized = normalizePreferences(value);
    await this.enqueue("preferences.json", () => writeJson(this.root, "preferences.json", normalized));
    return normalized;
  }

  async listNovels({ includeArchived = true } = {}) {
    const result = [];
    for (const summary of this.manifest.novels) {
      if (!includeArchived && summary.archived) continue;
      try { result.push(await readJson(this.root, `novels/${summary.id}/novel.json`)); }
      catch { result.push({ ...summary, unavailable: true }); }
    }
    return result.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }

  async createNovel({ title, author = "" }) {
    const novel = createNovelRecord(title, author);
    const base = `novels/${novel.id}`;
    for (const folder of ["cover", "manuscript/scenes", "manuscript/images", "codex", "codex/images", "history", "archive", "imports"]) await getDirectory(this.root, `${base}/${folder}`.split("/"), true);
    const structure = emptyStructure();
    await writeJson(this.root, `${base}/novel.json`, novel);
    await writeJson(this.root, `${base}/manuscript/structure.json`, structure);
    for (const scene of Object.values(structure.scenes)) await this.writeNewScene(novel.id, scene, "");
    this.manifest.novels.push({ id: novel.id, title: novel.title, archived: false, updatedAt: novel.updatedAt });
    await this.saveManifest();
    return novel;
  }

  async readNovel(novelId) { return readJson(this.root, `novels/${novelId}/novel.json`); }

  async duplicateNovel(novelId) {
    const original = await this.readNovel(novelId);
    const duplicate = createNovelRecord(`Copia de ${original.title}`, original.author);
    Object.assign(duplicate, { synopsis: original.synopsis, genre: original.genre, language: original.language, wordGoal: original.wordGoal, coverImage: rebaseAsset(original.coverImage, original.id, duplicate.id), editorial: structuredClone(original.editorial || duplicate.editorial) });
    const novelsDirectory = await getDirectory(this.root, ["novels"]);
    const source = await novelsDirectory.getDirectoryHandle(novelId);
    const target = await novelsDirectory.getDirectoryHandle(duplicate.id, { create: true });
    for (const folder of ["cover", "manuscript", "codex"]) {
      try { await copyDirectoryContents(await source.getDirectoryHandle(folder), await target.getDirectoryHandle(folder, { create: true })); } catch { /* optional folder */ }
    }
    try {
      const structure = await readJson(target, "manuscript/structure.json");
      for (const scene of Object.values(structure.scenes || {})) {
        scene.images = (scene.images || []).map((asset) => rebaseAsset(asset, original.id, duplicate.id));
        await writeJson(target, `manuscript/scenes/${scene.id}.json`, scene);
      }
      await writeJson(target, "manuscript/structure.json", structure);
      const codexDirectory = await getDirectory(target, ["codex"]);
      for await (const [name, handle] of codexDirectory.entries()) if (handle.kind === "file" && name.endsWith(".json")) {
        const entry = JSON.parse(await (await handle.getFile()).text());
        entry.image = rebaseAsset(entry.image, original.id, duplicate.id);
        await writeJson(codexDirectory, name, entry);
      }
    } catch { /* workspaces antiguos pueden no contener imágenes */ }
    for (const folder of ["history", "archive", "imports"]) await target.getDirectoryHandle(folder, { create: true });
    await writeJson(target, "novel.json", duplicate);
    this.manifest.novels.push({ id: duplicate.id, title: duplicate.title, archived: false, updatedAt: duplicate.updatedAt });
    await this.saveManifest();
    return duplicate;
  }

  async saveNovel(novel) {
    novel.updatedAt = nowIso();
    await writeJson(this.root, `novels/${novel.id}/novel.json`, novel);
    const summary = this.manifest.novels.find((item) => item.id === novel.id);
    if (summary) Object.assign(summary, { title: novel.title, archived: novel.archived, updatedAt: novel.updatedAt });
    await this.saveManifest();
    return novel;
  }

  async saveImageAsset(novelId, area, file) {
    if (!file || !String(file.type || "").startsWith("image/")) throw new Error("Selecciona un archivo de imagen válido.");
    if (file.size > 20 * 1024 * 1024) throw new Error("La imagen no puede superar 20 MB.");
    const folders = { cover: "cover", scene: "manuscript/images", codex: "codex/images" };
    const folder = folders[area];
    if (!folder) throw new Error("Destino de imagen no válido.");
    const extension = String(file.name || "imagen").match(/\.[a-z0-9]{1,8}$/i)?.[0] || "";
    const name = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeFileName(String(file.name || "imagen").replace(/\.[^.]+$/, ""))}${extension}`;
    const path = `novels/${novelId}/${folder}/${name}`;
    await writeFile(this.root, path, file);
    return { path, name: file.name || name, mimeType: file.type, caption: "", createdAt: nowIso() };
  }

  async imageUrl(asset) {
    if (!asset?.path || !String(asset.path).startsWith("novels/")) return "";
    const handle = await getFileHandle(this.root, String(asset.path).split("/"));
    return URL.createObjectURL(await handle.getFile());
  }

  async archiveNovel(novelId, archived = true) {
    const novel = await this.readNovel(novelId);
    novel.archived = archived;
    return this.saveNovel(novel);
  }

  async deleteNovel(novelId) {
    const novel = await this.readNovel(novelId);
    if (!novel.archived) throw new Error("Primero debes archivar la novela.");
    const novelsDir = await getDirectory(this.root, ["novels"]);
    await novelsDir.removeEntry(novelId, { recursive: true });
    this.manifest.novels = this.manifest.novels.filter((item) => item.id !== novelId);
    await this.saveManifest();
  }

  async readStructure(novelId) { return readJson(this.root, `novels/${novelId}/manuscript/structure.json`); }
  async saveStructure(novelId, structure) {
    await this.enqueue(`structure:${novelId}`, () => writeJson(this.root, `novels/${novelId}/manuscript/structure.json`, structure));
  }

  async saveSceneMetadata(novelId, metadata) {
    await this.enqueue(`metadata:${novelId}:${metadata.id}`, () => writeJson(this.root, `novels/${novelId}/manuscript/scenes/${metadata.id}.json`, metadata));
  }

  async writeNewScene(novelId, scene, prose) {
    const markdown = sceneToMarkdown(scene, prose);
    scene.contentHash = await sha256(markdown);
    scene.wordCount = prose.trim() ? prose.trim().split(/\s+/u).length : 0;
    await writeFile(this.root, `novels/${novelId}/manuscript/scenes/${scene.id}.md`, markdown);
    await writeJson(this.root, `novels/${novelId}/manuscript/scenes/${scene.id}.json`, scene);
    this.observed.set(`${novelId}:${scene.id}`, scene.contentHash);
    return scene;
  }

  async readScene(novelId, sceneId) {
    const mdPath = `novels/${novelId}/manuscript/scenes/${sceneId}.md`;
    const jsonPath = `novels/${novelId}/manuscript/scenes/${sceneId}.json`;
    const [{ text, lastModified }, metadata] = await Promise.all([readFile(this.root, mdPath), readJson(this.root, jsonPath)]);
    const hash = await sha256(text);
    this.observed.set(`${novelId}:${sceneId}`, hash);
    return { metadata: { ...metadata, contentHash: hash }, markdown: text, prose: markdownBody(text), hash, lastModified };
  }

  async detectExternalChanges(novelId, sceneId) {
    const path = `novels/${novelId}/manuscript/scenes/${sceneId}.md`;
    const { text, lastModified } = await readFile(this.root, path);
    const actualHash = await sha256(text);
    const expectedHash = this.observed.get(`${novelId}:${sceneId}`) || "";
    return { changed: Boolean(expectedHash && actualHash !== expectedHash), path, expectedHash, actualHash, diskContent: text, lastModified };
  }

  async saveScene(novelId, metadata, prose, { force = false, reason = "autosave" } = {}) {
    const key = `${novelId}:${metadata.id}`;
    return this.enqueue(key, async () => {
      const change = await this.detectExternalChanges(novelId, metadata.id);
      const localMarkdown = sceneToMarkdown(metadata, prose);
      if (change.changed && !force) throw new WorkspaceConflictError({ ...change, localContent: localMarkdown });
      if (reason !== "autosave" || await this.shouldSnapshot(novelId, metadata.id)) await this.createRevision(novelId, metadata.id, "scene", reason);
      const next = { ...metadata, wordCount: prose.trim() ? prose.trim().split(/\s+/u).length : 0, updatedAt: nowIso() };
      next.contentHash = await sha256(localMarkdown);
      await writeFile(this.root, `novels/${novelId}/manuscript/scenes/${metadata.id}.md`, localMarkdown);
      await writeJson(this.root, `novels/${novelId}/manuscript/scenes/${metadata.id}.json`, next);
      this.observed.set(key, next.contentHash);
      return next;
    });
  }

  async resolveConflict(novelId, metadata, prose, resolution, conflict) {
    if (resolution === "disk") return this.readScene(novelId, metadata.id);
    if (resolution === "both") {
      const directory = await getDirectory(this.root, `novels/${novelId}/manuscript/scenes`.split("/"));
      const name = `${metadata.id}-conflicto-${Date.now()}.md`;
      await writeFile(directory, name, conflict.diskContent);
    }
    const saved = await this.saveScene(novelId, metadata, prose, { force: true, reason: "resolver-conflicto" });
    return { metadata: saved, prose, markdown: sceneToMarkdown(saved, prose), hash: saved.contentHash };
  }

  async moveScene(novelId, sceneId, targetChapterId, targetIndex) {
    const structure = await this.readStructure(novelId);
    for (const act of structure.acts) for (const chapter of act.chapters) chapter.sceneIds = chapter.sceneIds.filter((id) => id !== sceneId);
    const target = structure.acts.flatMap((act) => act.chapters).find((chapter) => chapter.id === targetChapterId);
    if (!target) throw new Error("Capítulo de destino no encontrado.");
    target.sceneIds.splice(Math.max(0, Math.min(targetIndex, target.sceneIds.length)), 0, sceneId);
    await this.saveStructure(novelId, structure);
    return structure;
  }

  async archiveStoryItem(novelId, kind, itemId, archived = true) {
    const structure = await this.readStructure(novelId);
    if (kind === "act") {
      const act = structure.acts.find((item) => item.id === itemId);
      if (!act) throw new Error("Acto no encontrado.");
      act.archived = archived;
    } else if (kind === "chapter") {
      const owner = structure.acts.find((act) => act.chapters.some((chapter) => chapter.id === itemId));
      const chapter = owner?.chapters.find((item) => item.id === itemId);
      if (!chapter) throw new Error("Capítulo no encontrado.");
      chapter.archived = archived;
      if (!archived) owner.archived = false;
    } else if (kind === "scene") {
      const scene = structure.scenes[itemId];
      if (!scene) throw new Error("Escena no encontrada.");
      await this.createRevision(novelId, itemId, "scene", archived ? "archivar" : "restaurar");
      scene.archived = archived;
      scene.updatedAt = nowIso();
      if (!archived) {
        const ownerAct = structure.acts.find((act) => act.chapters.some((chapter) => chapter.sceneIds.includes(itemId)));
        const ownerChapter = ownerAct?.chapters.find((chapter) => chapter.sceneIds.includes(itemId));
        if (ownerAct) ownerAct.archived = false;
        if (ownerChapter) ownerChapter.archived = false;
      }
    } else throw new Error("Tipo de elemento no válido.");
    await this.saveStructure(novelId, structure);
    return structure;
  }

  async deleteStoryItem(novelId, kind, itemId) {
    const structure = await this.readStructure(novelId);
    let sceneIds = [];
    if (kind === "act") {
      const act = structure.acts.find((item) => item.id === itemId);
      if (!act) throw new Error("Acto no encontrado.");
      if (!act.archived) throw new Error("Primero debes archivar el acto.");
      sceneIds = act.chapters.flatMap((chapter) => chapter.sceneIds);
      structure.acts = structure.acts.filter((item) => item.id !== itemId);
    } else if (kind === "chapter") {
      const owner = structure.acts.find((act) => act.chapters.some((chapter) => chapter.id === itemId));
      const chapter = owner?.chapters.find((item) => item.id === itemId);
      if (!chapter) throw new Error("Capítulo no encontrado.");
      if (!chapter.archived) throw new Error("Primero debes archivar el capítulo.");
      sceneIds = [...chapter.sceneIds];
      owner.chapters = owner.chapters.filter((item) => item.id !== itemId);
    } else if (kind === "scene") {
      const scene = structure.scenes[itemId];
      if (!scene) throw new Error("Escena no encontrada.");
      if (!scene.archived) throw new Error("Primero debes archivar la escena.");
      sceneIds = [itemId];
      for (const act of structure.acts) for (const chapter of act.chapters) chapter.sceneIds = chapter.sceneIds.filter((id) => id !== itemId);
    } else throw new Error("Tipo de elemento no válido.");
    const scenesDirectory = await getDirectory(this.root, `novels/${novelId}/manuscript/scenes`.split("/"));
    const historyDirectory = await getDirectory(this.root, `novels/${novelId}/history`.split("/"));
    for (const sceneId of sceneIds) {
      await scenesDirectory.removeEntry(`${sceneId}.json`).catch(() => {});
      await scenesDirectory.removeEntry(`${sceneId}.md`).catch(() => {});
      await historyDirectory.removeEntry(sceneId, { recursive: true }).catch(() => {});
      delete structure.scenes[sceneId];
      this.observed.delete(`${novelId}:${sceneId}`);
    }
    await this.saveStructure(novelId, structure);
    return structure;
  }

  async listCodex(novelId, { includeArchived = false } = {}) {
    const directory = await getDirectory(this.root, `novels/${novelId}/codex`.split("/"));
    const entries = [];
    for await (const [name, handle] of directory.entries()) {
      if (handle.kind !== "file" || !name.endsWith(".json")) continue;
      const metadata = JSON.parse(await (await handle.getFile()).text());
      if (!includeArchived && metadata.archived) continue;
      let description = "";
      try { description = (await readFile(this.root, `novels/${novelId}/codex/${metadata.id}.md`)).text; } catch { /* optional */ }
      entries.push({ ...metadata, description });
    }
    return entries.sort((a, b) => a.name.localeCompare(b.name, "es"));
  }

  async saveCodexEntry(novelId, entry, { reason = "editar-codex" } = {}) {
    const existsAlready = await exists(this.root, `novels/${novelId}/codex/${entry.id}.json`);
    if (existsAlready && (reason !== "autosave" || await this.shouldSnapshot(novelId, entry.id))) await this.createRevision(novelId, entry.id, "codex", reason);
    const { description = "", ...metadata } = entry;
    metadata.updatedAt = nowIso();
    await writeFile(this.root, `novels/${novelId}/codex/${entry.id}.md`, description.trimEnd() + "\n");
    await writeJson(this.root, `novels/${novelId}/codex/${entry.id}.json`, metadata);
    return { ...metadata, description };
  }

  async deleteCodexEntry(novelId, entryId) {
    const directory = await getDirectory(this.root, `novels/${novelId}/codex`.split("/"));
    await directory.removeEntry(`${entryId}.json`).catch(() => {});
    await directory.removeEntry(`${entryId}.md`).catch(() => {});
  }

  async shouldSnapshot(novelId, entityId) {
    const revisions = await this.listRevisions(novelId, entityId);
    if (!revisions.length) return true;
    return Date.now() - new Date(revisions[0].createdAt).getTime() >= 5 * 60 * 1000;
  }

  async createRevision(novelId, entityId, entityType, reason) {
    const createdAt = nowIso();
    let content = ""; let metadata = null;
    try {
      if (entityType === "scene") {
        const scene = await this.readScene(novelId, entityId); content = scene.prose; metadata = scene.metadata;
      } else {
        const entries = await this.listCodex(novelId, { includeArchived: true });
        metadata = entries.find((entry) => entry.id === entityId) || null; content = metadata?.description || "";
      }
    } catch { return null; }
    const revision = { schemaVersion: 1, id: crypto.randomUUID(), entityId, entityType, reason, createdAt, pinned: false, content, metadata };
    const directory = await getDirectory(this.root, `novels/${novelId}/history/${entityId}`.split("/"), true);
    await writeJson(directory, `${createdAt.replace(/[:.]/g, "-")}-${revision.id}.json`, revision);
    await this.pruneRevisions(directory);
    return revision;
  }

  async listRevisions(novelId, entityId) {
    let directory;
    try { directory = await getDirectory(this.root, `novels/${novelId}/history/${entityId}`.split("/")); }
    catch { return []; }
    const revisions = [];
    for await (const [name, handle] of directory.entries()) if (handle.kind === "file" && name.endsWith(".json")) {
      try { revisions.push(JSON.parse(await (await handle.getFile()).text())); } catch { /* ignore corrupt revision */ }
    }
    return revisions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async pruneRevisions(directory) {
    const items = [];
    for await (const [name, handle] of directory.entries()) if (handle.kind === "file" && name.endsWith(".json")) {
      try { items.push({ name, value: JSON.parse(await (await handle.getFile()).text()) }); } catch { /* keep unknown */ }
    }
    items.sort((a, b) => b.value.createdAt.localeCompare(a.value.createdAt));
    for (const item of items.slice(200).filter((item) => !item.value.pinned)) await directory.removeEntry(item.name);
  }

  async restoreRevision(novelId, revision) {
    await this.createRevision(novelId, revision.entityId, revision.entityType, "antes-de-restaurar");
    if (revision.entityType === "scene") return this.saveScene(novelId, revision.metadata, revision.content, { force: true, reason: "restaurar" });
    return this.saveCodexEntry(novelId, { ...revision.metadata, description: revision.content }, { reason: "restaurar" });
  }

  async importDocument(novelId, structure, sceneContents) {
    await this.createWorkspaceBackup({ reason: "antes-de-importar", download: false });
    for (const [sceneId, content] of Object.entries(sceneContents)) await this.writeNewScene(novelId, structure.scenes[sceneId], content);
    await this.saveStructure(novelId, structure);
    return structure;
  }

  async createWorkspaceBackup({ reason = "manual", download = true } = {}) {
    const zip = new JSZip();
    await this.addDirectoryToZip(zip, this.root, "", new Set(["backups"]));
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
    const filename = `estudio-novela-${safeFileName(reason)}-${new Date().toISOString().slice(0, 10)}.zip`;
    await writeFile(this.root, `backups/${filename}`, blob);
    const preferences = await this.preferences();
    preferences.lastBackupAt = nowIso();
    await this.savePreferences(preferences);
    if (download) this.downloadBlob(blob, filename);
    return { filename, size: blob.size };
  }

  async addDirectoryToZip(zip, directory, prefix, excludedAtRoot = new Set()) {
    for await (const [name, handle] of directory.entries()) {
      if (!prefix && excludedAtRoot.has(name)) continue;
      const path = prefix ? `${prefix}/${name}` : name;
      if (handle.kind === "directory") await this.addDirectoryToZip(zip, handle, path, new Set());
      else zip.file(path, await (await handle.getFile()).arrayBuffer());
    }
  }

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = filename; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  enqueue(key, operation) {
    const previous = this.writeQueues.get(key) || Promise.resolve();
    const next = previous.catch(() => {}).then(operation);
    const tracked = next.finally(() => { if (this.writeQueues.get(key) === tracked) this.writeQueues.delete(key); });
    this.writeQueues.set(key, tracked);
    return next;
  }

  async flush() {
    while (this.writeQueues.size) await Promise.all([...this.writeQueues.values()]);
  }
}

export const workspaceRepository = new LocalWorkspaceRepository();
