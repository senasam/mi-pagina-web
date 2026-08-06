import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import {
  Archive, ArrowDown, ArrowLeft, ArrowUp, BookOpen, Bold, Box,
  Clock3, Download, FileArchive, FilePlus2, FolderOpen, Grid2X2, Heading2,
  Highlighter, Italic, Library, List, ListOrdered, Maximize2, Menu, NotebookPen,
  PanelLeftClose, Pencil, Plus, Quote, Redo2, RotateCcw, Save, Search, Settings, Strikethrough,
  Sparkles, Trash2, UnderlineIcon, Undo2, Upload, UserRound, X,
} from "lucide-react";
import { workspaceRepository as repository, WorkspaceConflictError } from "./LocalWorkspaceRepository.js";
import {
  applyOutline, countWords, createActWithContent, createChapterWithScene, createCodexEntry, createScene, flattenScenes,
  makeId, nowIso, parseOutline,
} from "./model.js";
import { htmlToMarkdown, markdownToHtml } from "./editorFormat.js";
import { SectionNode } from "./SectionNode.js";
import { requestSceneSuggestion } from "./sceneAssistant.js";
import {
  OLLAMA_MODEL_PRESETS, buildChatGptManualPrompt, chooseOllamaModel, listOllamaModels, normalizeChatGptUrl,
  ollamaOriginCommand, pullOllamaModel,
} from "./aiProviders.js";
import "./novelStudio.css";

const routeParts = () => window.location.pathname.replace(/\/$/, "").split("/").filter(Boolean);
const studioHref = (novelId, mode = "plan") => `/estudio-novela/${novelId}/${mode}`;
const FORCE_SAVE_EVENT = "novel-studio:force-save";
const STUDIO_ROUTE_EVENT = "novel-studio:navigate";

function goStudio(href) {
  history.pushState({}, "", href);
  dispatchEvent(new Event(STUDIO_ROUTE_EVENT));
}

function handleStudioLink(event, href) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  goStudio(href);
}

function useForceSave(handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => {
    const listener = (event) => event.detail.tasks.push(Promise.resolve().then(() => handlerRef.current()));
    addEventListener(FORCE_SAVE_EVENT, listener);
    return () => removeEventListener(FORCE_SAVE_EVENT, listener);
  }, []);
}

function formatDate(value) {
  try { return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
  catch { return value || ""; }
}

function downloadText(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function useWorkspaceLock(workspaceId) {
  const [readOnly, setReadOnly] = useState(false);
  useEffect(() => {
    if (!workspaceId || !navigator.locks) return undefined;
    let release;
    let active = true;
    let retryTimer;
    let requesting = false;
    const acquire = () => {
      if (!active || requesting) return;
      requesting = true;
      navigator.locks.request(`novel-studio:${workspaceId}`, { ifAvailable: true }, async (lock) => {
        requesting = false;
        if (!active) return;
        if (!lock) {
          setReadOnly(true);
          retryTimer = setTimeout(acquire, 600);
          return;
        }
        setReadOnly(false);
        await new Promise((resolve) => { release = resolve; });
      }).catch(() => {
        requesting = false;
        if (active) retryTimer = setTimeout(acquire, 1000);
      });
    };
    acquire();
    return () => { active = false; clearTimeout(retryTimer); release?.(); };
  }, [workspaceId]);
  return readOnly;
}

export default function NovelStudioApp() {
  const [connection, setConnection] = useState({ loading: true, permission: "prompt", error: "" });
  const [manifest, setManifest] = useState(null);
  const [route, setRoute] = useState(routeParts);

  useEffect(() => {
    const previousTitle = document.title;
    let robots = document.querySelector('meta[name="robots"]');
    const created = !robots;
    if (!robots) { robots = document.createElement("meta"); robots.name = "robots"; document.head.appendChild(robots); }
    const previousRobots = robots.content;
    document.title = "Estudio de novela privado";
    robots.content = "noindex,nofollow,noarchive";
    return () => { document.title = previousTitle; if (created) robots.remove(); else robots.content = previousRobots; };
  }, []);

  const resume = useCallback(async (requestPermission = false) => {
    setConnection((state) => ({ ...state, loading: true, error: "" }));
    try {
      const result = await repository.reconnect({ requestPermission });
      if (result?.manifest) { setManifest(result.manifest); setConnection({ loading: false, permission: "granted", error: "" }); }
      else setConnection({ loading: false, permission: result?.permission || "missing", name: result?.name, error: "" });
    } catch (error) { setConnection({ loading: false, permission: "error", error: error.message }); }
  }, []);

  useEffect(() => { resume(false); }, [resume]);
  useEffect(() => {
    const updateRoute = () => setRoute(routeParts());
    const interceptStudioLinks = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target.closest?.("a[href]");
      if (!anchor) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || !url.pathname.startsWith("/estudio-novela")) return;
      event.preventDefault();
      goStudio(`${url.pathname}${url.search}${url.hash}`);
    };
    addEventListener("popstate", updateRoute);
    addEventListener(STUDIO_ROUTE_EVENT, updateRoute);
    document.addEventListener("click", interceptStudioLinks);
    return () => { removeEventListener("popstate", updateRoute); removeEventListener(STUDIO_ROUTE_EVENT, updateRoute); document.removeEventListener("click", interceptStudioLinks); };
  }, []);
  const readOnly = useWorkspaceLock(manifest?.workspaceId);

  if (!LocalSupport()) return <UnsupportedScreen />;
  if (connection.loading) return <StudioLoading />;
  if (!manifest) return <ConnectionScreen connection={connection} onConnected={(next) => { setManifest(next); setConnection({ loading: false, permission: "granted", error: "" }); }} onReconnect={() => resume(true)} />;

  const [, novelId, mode = "plan"] = route;
  return novelId
    ? <NovelWorkspace manifest={manifest} novelId={novelId} mode={mode} readOnly={readOnly} onClose={async () => { await repository.close(); setManifest(null); }} />
    : <LibraryPage manifest={manifest} readOnly={readOnly} onManifest={setManifest} onClose={async () => { await repository.close(); setManifest(null); }} />;
}

function LocalSupport() { return repository.constructor.isSupported(); }

function StudioLoading() {
  return <main className="studio-gate"><div className="studio-gate__card"><NotebookPen size={34} /><h1>Estudio de novela</h1><p>Buscando tu carpeta de escritura…</p></div></main>;
}

function UnsupportedScreen() {
  return <main className="studio-gate"><div className="studio-gate__card"><FolderOpen size={34} /><p className="studio-kicker">Compatibilidad</p><h1>Abre este estudio en Chrome o Edge</h1><p>Este navegador no permite mantener una carpeta local conectada. Tus páginas públicas siguen funcionando normalmente.</p><a className="studio-button studio-button--secondary" href="/">Volver al sitio</a></div></main>;
}

function ConnectionScreen({ connection, onConnected, onReconnect }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(connection.error || "");
  const connect = async (mode, createSubfolder = false) => {
    setBusy(true); setError("");
    try { onConnected(await repository.connect({ mode, createSubfolder })); }
    catch (caught) {
      if (caught.code === "NON_EMPTY_DIRECTORY" && confirm("La carpeta contiene otros archivos. ¿Crear dentro una subcarpeta llamada EstudioNovela?")) return connect("create", true);
      if (caught.name !== "AbortError") setError(caught.message);
    } finally { setBusy(false); }
  };
  const restore = async (file) => {
    if (!file) return;
    setBusy(true); setError("");
    try { onConnected(await repository.restoreWorkspaceBackup(file)); }
    catch (caught) { if (caught.name !== "AbortError") setError(caught.message); }
    finally { setBusy(false); }
  };
  return <main className="studio-gate"><div className="studio-gate__card studio-gate__card--wide">
    <p className="studio-kicker">Espacio privado · archivos locales</p><h1>Tu estudio de novela</h1>
    <p>Elige una carpeta de Windows. El manuscrito y el Codex se guardarán ahí como Markdown y JSON; el navegador solo recordará el permiso.</p>
    {connection.permission === "prompt" && connection.name && <div className="studio-notice"><strong>Carpeta recordada:</strong> {connection.name}<button className="studio-button" onClick={onReconnect}>Volver a conectar</button></div>}
    {error && <p className="studio-error" role="alert">{error}</p>}
    <div className="studio-gate__actions"><button className="studio-button" disabled={busy} onClick={() => connect("create")}><FilePlus2 size={18} /> Crear espacio de escritura</button><button className="studio-button studio-button--secondary" disabled={busy} onClick={() => connect("open")}><FolderOpen size={18} /> Abrir espacio existente</button><label className="studio-button studio-button--secondary"><FileArchive size={18} /> Restaurar respaldo ZIP<input hidden type="file" accept=".zip,application/zip" disabled={busy} onChange={(event) => restore(event.target.files[0])} /></label></div>
    <p className="studio-fineprint">El estudio no puede acceder a nada fuera de la carpeta que selecciones.</p><a href="/" className="studio-text-link">← Volver al sitio</a>
  </div></main>;
}

function WorkspaceHeader({ manifest, saveState = "saved", readOnly, onClose, children }) {
  const labels = { modified: "Modificado", saving: "Guardando…", saved: "Guardado", error: "Error al guardar", conflict: "Conflicto", idle: "Listo" };
  return <header className="studio-header"><a className="studio-logo" href="/estudio-novela" onClick={(event) => handleStudioLink(event, "/estudio-novela")} aria-label="Biblioteca"><NotebookPen size={21} /><span>Estudio</span></a><div className="studio-header__folder"><FolderOpen size={16} /><span>{repository.workspaceName}</span><span className="studio-permission">Permiso activo</span></div><div className="studio-header__right">{children}<span className={`studio-save studio-save--${saveState}`}><Save size={15} />{readOnly ? "Solo lectura · otra pestaña activa" : labels[saveState]}</span><button className="studio-icon-button" title="Cerrar workspace" onClick={onClose}><X size={19} /></button></div></header>;
}

function LibraryPage({ manifest, readOnly, onManifest, onClose }) {
  const [novels, setNovels] = useState([]); const [query, setQuery] = useState(""); const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState({ title: "", author: "" }); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const refresh = useCallback(async () => { setNovels(await repository.listNovels()); onManifest({ ...repository.manifest }); }, [onManifest]);
  useEffect(() => { refresh(); }, [refresh]);
  const create = async (event) => { event.preventDefault(); if (!form.title.trim() || readOnly) return; setBusy(true); try { const novel = await repository.createNovel(form); goStudio(studioHref(novel.id, "plan")); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const filtered = novels.filter((novel) => (showArchived || !novel.archived) && `${novel.title} ${novel.author}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const backupDue = useBackupDue();
  return <div className="studio-app"><WorkspaceHeader manifest={manifest} readOnly={readOnly} onClose={onClose}><a className="studio-icon-button" href="/" title="Ir al sitio"><ArrowLeft size={18} /></a></WorkspaceHeader><main className="studio-library">
    <section className="studio-library__intro"><div><p className="studio-kicker">Biblioteca local</p><h1>Tus novelas</h1><p>Todo lo que ves se lee directamente desde <strong>{repository.workspaceName}</strong>.</p></div><button className="studio-button studio-button--secondary" onClick={async () => { setBusy(true); try { await repository.createWorkspaceBackup({ download: true }); await refresh(); } catch (e) { setError(e.message); } finally { setBusy(false); } }}><FileArchive size={18} /> Crear respaldo ZIP</button></section>
    {backupDue && <div className="studio-notice studio-notice--gold"><FileArchive size={19} /><span>Ha pasado una semana desde el último respaldo. Crea un ZIP antes de una sesión importante.</span></div>}
    {error && <p className="studio-error" role="alert">{error}</p>}
    <form className="studio-new-novel" onSubmit={create}><div><label htmlFor="novel-title">Nueva novela</label><input id="novel-title" placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div><div><label htmlFor="novel-author">Autor</label><input id="novel-author" placeholder="Tu nombre" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></div><button className="studio-button" disabled={busy || readOnly}><Plus size={18} /> Crear</button></form>
    <div className="studio-library__tools"><label className="studio-search"><Search size={17} /><input aria-label="Buscar novelas" placeholder="Buscar por título o autor" value={query} onChange={(e) => setQuery(e.target.value)} /></label><label><input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Mostrar archivadas</label></div>
    <div className="studio-novel-grid">{filtered.map((novel) => <article className={`studio-novel-card ${novel.archived ? "is-archived" : ""}`} key={novel.id}><a href={studioHref(novel.id, "plan")} onClick={(event) => handleStudioLink(event, studioHref(novel.id, "plan"))}><BookOpen size={24} /><h2>{novel.title}</h2><p>{novel.author || "Sin autor indicado"}</p><small>Actualizada {formatDate(novel.updatedAt)}</small></a><div className="studio-card-actions">{!novel.archived && <button disabled={readOnly} onClick={async () => { setBusy(true); try { const copy = await repository.duplicateNovel(novel.id); goStudio(studioHref(copy.id, "plan")); } catch (e) { setError(e.message); setBusy(false); } }}><FilePlus2 size={16} />Duplicar</button>}<button disabled={readOnly} onClick={async () => { await repository.archiveNovel(novel.id, !novel.archived); refresh(); }}>{novel.archived ? <RotateCcw size={16} /> : <Archive size={16} />}{novel.archived ? "Restaurar" : "Archivar"}</button>{novel.archived && <button className="danger" disabled={readOnly} onClick={async () => { if (confirm(`¿Eliminar definitivamente “${novel.title}”?`)) { await repository.deleteNovel(novel.id); refresh(); } }}><Trash2 size={16} />Eliminar</button>}</div></article>)}</div>
    {!filtered.length && <div className="studio-empty"><Library size={30} /><h2>No hay novelas en esta vista</h2><p>Crea una arriba o cambia los filtros.</p></div>}
  </main></div>;
}

function useBackupDue() {
  const [due, setDue] = useState(false);
  useEffect(() => { repository.preferences().then((prefs) => setDue(!prefs.lastBackupAt || Date.now() - new Date(prefs.lastBackupAt).getTime() > 7 * 86400000)); }, []);
  return due;
}

function NovelWorkspace({ manifest, novelId, mode, readOnly, onClose }) {
  const [novel, setNovel] = useState(null); const [structure, setStructure] = useState(null); const [codex, setCodex] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [saveState, setSaveState] = useState("idle"); const [error, setError] = useState(""); const [sidebar, setSidebar] = useState(true);
  const reload = useCallback(async () => { try { const [n, s, c, p] = await Promise.all([repository.readNovel(novelId), repository.readStructure(novelId), repository.listCodex(novelId), repository.preferences()]); setNovel(n); setStructure(s); setCodex(c); setPreferences(p); setSaveState("saved"); } catch (e) { setError(e.message); } }, [novelId]);
  useEffect(() => { reload(); }, [reload]);
  const forceSave = async () => {
    if (readOnly || saveState === "saving") return;
    setSaveState("saving");
    try {
      const tasks = [];
      dispatchEvent(new CustomEvent(FORCE_SAVE_EVENT, { detail: { tasks } }));
      const results = await Promise.all(tasks);
      await repository.flush();
      setSaveState(results.includes(false) ? "error" : "saved");
    } catch { setSaveState("error"); }
  };
  if (error) return <div className="studio-app"><WorkspaceHeader manifest={manifest} saveState="error" readOnly={readOnly} onClose={onClose} /><main className="studio-fatal"><h1>No se pudo abrir la novela</h1><p>{error}</p><a className="studio-button" href="/estudio-novela">Volver a la biblioteca</a></main></div>;
  if (!novel || !structure || !preferences) return <StudioLoading />;
  const modes = [{ id: "plan", label: "Plan", icon: Grid2X2 }, { id: "escribir", label: "Escribir", icon: NotebookPen }, { id: "codex", label: "Codex", icon: Box }, { id: "configuracion", label: "Configuración", icon: Settings }];
  return <div className={`studio-app studio-workspace ${sidebar ? "" : "sidebar-closed"}`}><WorkspaceHeader manifest={manifest} saveState={saveState} readOnly={readOnly} onClose={onClose}><button type="button" className="studio-header-save-button" title="Forzar el guardado de todos los cambios pendientes" disabled={readOnly || saveState === "saving"} onClick={forceSave}><Save size={16} /><span>Guardar todo</span></button><button className="studio-icon-button" title="Mostrar u ocultar panel" onClick={() => setSidebar((value) => !value)}>{sidebar ? <PanelLeftClose size={18} /> : <Menu size={18} />}</button></WorkspaceHeader><aside className="studio-sidebar"><a className="studio-sidebar__back" href="/estudio-novela" onClick={(event) => handleStudioLink(event, "/estudio-novela")}><ArrowLeft size={16} /> Biblioteca</a><div className="studio-sidebar__novel"><BookOpen size={19} /><div><strong>{novel.title}</strong><small>{countNovelWords(structure).toLocaleString("es")} palabras registradas</small></div></div><nav>{modes.map(({ id, label, icon: Icon }) => <a className={mode === id ? "active" : ""} href={studioHref(novelId, id)} onClick={(event) => handleStudioLink(event, studioHref(novelId, id))} key={id}><Icon size={18} />{label}</a>)}</nav></aside><main className="studio-main">
    {readOnly && <div className="studio-notice"><strong>Solo lectura:</strong> cierra la otra pestaña del estudio para editar.</div>}
    {mode === "plan" && <PlanPage novel={novel} structure={structure} setStructure={setStructure} codex={codex} readOnly={readOnly} setSaveState={setSaveState} />}
    {mode === "escribir" && <WritePage novel={novel} structure={structure} setStructure={setStructure} codex={codex} aiSettings={preferences.ai} readOnly={readOnly} setSaveState={setSaveState} />}
    {mode === "codex" && <CodexPage novel={novel} structure={structure} entries={codex} setEntries={setCodex} readOnly={readOnly} setSaveState={setSaveState} />}
    {mode === "configuracion" && <SettingsPage novel={novel} setNovel={setNovel} structure={structure} preferences={preferences} setPreferences={setPreferences} readOnly={readOnly} setSaveState={setSaveState} />}
  </main></div>;
}

function countNovelWords(structure) { return Object.values(structure.scenes).filter((scene) => !scene.archived).reduce((sum, scene) => sum + (scene.wordCount || 0), 0); }

function PlanPage({ novel, structure, setStructure, codex, readOnly, setSaveState }) {
  const [view, setView] = useState("grid"); const [query, setQuery] = useState(""); const [outline, setOutline] = useState(""); const [showArchived, setShowArchived] = useState(false);
  const [statusFilter, setStatusFilter] = useState(""); const [povFilter, setPovFilter] = useState(""); const [codexFilter, setCodexFilter] = useState("");
  const [showOutline, setShowOutline] = useState(false); const [importPreview, setImportPreview] = useState(null); const [notice, setNotice] = useState("");
  const persist = async (next) => { setStructure(next); setSaveState("saving"); try { await repository.saveStructure(novel.id, next); setSaveState("saved"); } catch { setSaveState("error"); } };
  const changeScene = async (id, patch) => {
    const scene = { ...structure.scenes[id], ...patch, updatedAt: nowIso() };
    const next = { ...structure, scenes: { ...structure.scenes, [id]: scene } };
    setStructure(next); setSaveState("saving");
    try { await Promise.all([repository.saveSceneMetadata(novel.id, scene), repository.saveStructure(novel.id, next)]); setSaveState("saved"); }
    catch { setSaveState("error"); }
  };
  const addAct = async () => { const next = structuredClone(structure); const { act, scene } = createActWithContent(next.acts.length + 1); next.acts.push(act); next.scenes[scene.id] = scene; setSaveState("saving"); try { await repository.writeNewScene(novel.id, scene, ""); await persist(next); } catch (error) { setNotice(error.message); setSaveState("error"); } };
  const addChapter = async (actId) => { const next = structuredClone(structure); const act = next.acts.find((item) => item.id === actId); const { chapter, scene } = createChapterWithScene(act.chapters.length + 1); act.chapters.push(chapter); next.scenes[scene.id] = scene; setSaveState("saving"); try { await repository.writeNewScene(novel.id, scene, ""); await persist(next); } catch (error) { setNotice(error.message); setSaveState("error"); } };
  const addSceneTo = async (chapterId) => { const next = structuredClone(structure); const chapter = next.acts.flatMap((act) => act.chapters).find((item) => item.id === chapterId); const scene = createScene(makeId(), `Escena ${chapter.sceneIds.length + 1}`); next.scenes[scene.id] = scene; chapter.sceneIds.push(scene.id); setSaveState("saving"); await repository.writeNewScene(novel.id, scene, ""); await persist(next); };
  const moveScene = (chapterId, sceneId, offset) => { const next = structuredClone(structure); const chapter = next.acts.flatMap((act) => act.chapters).find((item) => item.id === chapterId); const index = chapter.sceneIds.indexOf(sceneId); const target = index + offset; if (target < 0 || target >= chapter.sceneIds.length) return; [chapter.sceneIds[index], chapter.sceneIds[target]] = [chapter.sceneIds[target], chapter.sceneIds[index]]; persist(next); };
  const moveSceneTo = (sceneId, targetChapterId, targetIndex = Number.MAX_SAFE_INTEGER) => {
    const next = structuredClone(structure);
    for (const act of next.acts) for (const chapter of act.chapters) chapter.sceneIds = chapter.sceneIds.filter((id) => id !== sceneId);
    const target = next.acts.flatMap((act) => act.chapters).find((chapter) => chapter.id === targetChapterId);
    if (!target) return;
    target.sceneIds.splice(Math.min(targetIndex, target.sceneIds.length), 0, sceneId);
    persist(next);
  };
  const chapterOptions = structure.acts.filter((act) => !act.archived).flatMap((act) => act.chapters.filter((chapter) => !chapter.archived).map((chapter) => ({ id: chapter.id, label: `${act.title} · ${chapter.title}` })));
  const setArchived = async (kind, id, archived) => { setSaveState("saving"); try { const next = await repository.archiveStoryItem(novel.id, kind, id, archived); setStructure(next); setSaveState("saved"); } catch (error) { setNotice(error.message); setSaveState("error"); } };
  const deleteArchived = async (kind, id, title) => { if (!confirm(`¿Eliminar definitivamente ${kind === "act" ? "el acto" : kind === "chapter" ? "el capítulo" : "la escena"} “${title}”? Esta acción también eliminará su contenido y no se puede deshacer.`)) return; setSaveState("saving"); try { const next = await repository.deleteStoryItem(novel.id, kind, id); setStructure(next); setSaveState("saved"); } catch (error) { setNotice(error.message); setSaveState("error"); } };
  const scenes = flattenScenes(structure).filter(({ scene }) =>
    `${scene.title} ${scene.summary} ${scene.status} ${scene.labels.join(" ")} ${(scene.subplots || []).join(" ")}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())
    && (!statusFilter || scene.status === statusFilter)
    && (!povFilter || scene.povId === povFilter)
    && (!codexFilter || scene.povId === codexFilter || (scene.subplots || []).includes(codexFilter)));
  const activeActs = structure.acts.filter((act) => !act.archived);
  const archivedItems = [
    ...structure.acts.filter((act) => act.archived).map((act) => ({ kind: "act", id: act.id, title: act.title, detail: `${act.chapters.length} capítulo(s)` })),
    ...structure.acts.flatMap((act) => act.chapters.filter((chapter) => chapter.archived).map((chapter) => ({ kind: "chapter", id: chapter.id, title: chapter.title, detail: `${act.title} · ${chapter.sceneIds.length} escena(s)` }))),
    ...structure.acts.flatMap((act) => act.chapters.flatMap((chapter) => chapter.sceneIds.map((id) => structure.scenes[id]).filter((scene) => scene?.archived).map((scene) => ({ kind: "scene", id: scene.id, title: scene.title, detail: `${act.title} · ${chapter.title} · ${scene.wordCount || 0} palabras` })))),
  ];
  const importFile = async (file) => { if (!file) return; try { const { fileToMarkdown, manuscriptImportPreview } = await import("./documentIO.js"); const { markdown, warnings } = await fileToMarkdown(file); setImportPreview({ ...manuscriptImportPreview(markdown, file.name.replace(/\.[^.]+$/, "")), warnings, fileName: file.name }); } catch (e) { setNotice(e.message); } };
  return <section className="studio-page"><PageTitle kicker="Arquitectura narrativa" title="Plan" text="Organiza actos, capítulos y escenas; todas las vistas actualizan el mismo structure.json."><button className="studio-button studio-button--secondary" onClick={() => setShowOutline((value) => !value)}><List size={17} /> Crear desde esquema</button><label className="studio-button studio-button--secondary"><Upload size={17} /> Importar manuscrito<input hidden type="file" accept=".docx,.md,.markdown,.txt" onChange={(e) => importFile(e.target.files[0])} /></label></PageTitle>
    {notice && <p className="studio-notice">{notice}</p>}
    {showOutline && <div className="studio-panel"><h2>Crear desde esquema</h2><p>Usa <code># Acto</code>, <code>## Capítulo</code> y <code>### Escena</code>.</p><textarea rows="9" value={outline} onChange={(e) => setOutline(e.target.value)} placeholder="# Acto 1&#10;## Capítulo 1&#10;### La llegada" /><div className="studio-row"><span>{parseOutline(outline).reduce((sum, act) => sum + act.chapters.reduce((inner, chapter) => inner + chapter.scenes.length, 0), 0)} escenas detectadas</span><button className="studio-button" disabled={readOnly || !outline.trim()} onClick={async () => { const parsed = parseOutline(outline); const next = applyOutline(structure, parsed); setSaveState("saving"); for (const act of parsed) for (const chapter of act.chapters) for (const scene of chapter.scenes) await repository.writeNewScene(novel.id, scene, ""); await persist(next); setOutline(""); setShowOutline(false); }}>Agregar al final</button></div></div>}
    {importPreview && <ImportPreview preview={importPreview} readOnly={readOnly} onCancel={() => setImportPreview(null)} onConfirm={async () => { setSaveState("saving"); await repository.importDocument(novel.id, importPreview.structure, importPreview.contents); setStructure(importPreview.structure); setImportPreview(null); setSaveState("saved"); }} />}
    <div className="studio-toolbar"><div className="studio-segmented">{[["grid", Grid2X2, "Cuadrícula"], ["outline", List, "Esquema"], ["matrix", Menu, "Matriz"]].map(([id, Icon, label]) => <button className={view === id ? "active" : ""} onClick={() => setView(id)} key={id}><Icon size={16} />{label}</button>)}</div><label className="studio-search"><Search size={16} /><input placeholder="Buscar escenas" value={query} onChange={(e) => setQuery(e.target.value)} /></label><select aria-label="Filtrar por estado" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">Todos los estados</option>{["Idea", "Esquema", "Borrador", "Revisión", "Final"].map((value) => <option key={value}>{value}</option>)}</select><select aria-label="Filtrar por POV" value={povFilter} onChange={(e) => setPovFilter(e.target.value)}><option value="">Todos los POV</option>{codex.filter((entry) => entry.type === "character").map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}</select><select aria-label="Filtrar por Codex" value={codexFilter} onChange={(e) => setCodexFilter(e.target.value)}><option value="">Todo el Codex</option>{codex.map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}</select><button className="studio-button studio-button--secondary" onClick={() => setShowArchived((value) => !value)}><Archive size={16} /> Archivo</button><button className="studio-button" disabled={readOnly} onClick={addAct}><Plus size={16} /> Acto</button></div>
    {view === "matrix" ? <PlanMatrix items={scenes} codex={codex} readOnly={readOnly} onChange={changeScene} /> : <div className={view === "grid" ? "studio-plan-grid" : "studio-plan-outline"}>{activeActs.map((act) => <section className="studio-act" key={act.id}><header><input aria-label="Título del acto" value={act.title} disabled={readOnly} onChange={(e) => { const next = structuredClone(structure); next.acts.find((item) => item.id === act.id).title = e.target.value; persist(next); }} /><div className="studio-heading-actions"><button disabled={readOnly} onClick={() => setArchived("act", act.id, true)} title="Archivar acto"><Archive size={15} /></button><button disabled={readOnly} onClick={() => addChapter(act.id)}><Plus size={15} /> Capítulo</button></div></header><div className="studio-chapters">{act.chapters.filter((chapter) => !chapter.archived).map((chapter) => <section className="studio-chapter" key={chapter.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const dragged = event.dataTransfer.getData("text/x-studio-scene"); if (dragged) moveSceneTo(dragged, chapter.id); }}><header><input aria-label="Título del capítulo" value={chapter.title} disabled={readOnly} onChange={(e) => { const next = structuredClone(structure); next.acts.flatMap((item) => item.chapters).find((item) => item.id === chapter.id).title = e.target.value; persist(next); }} /><div className="studio-heading-actions"><button disabled={readOnly} onClick={() => setArchived("chapter", chapter.id, true)} title="Archivar capítulo"><Archive size={14} /></button><button disabled={readOnly} onClick={() => addSceneTo(chapter.id)}><Plus size={14} /> Escena</button></div></header><div className="studio-scenes">{chapter.sceneIds.map((sceneId, index) => { const scene = structure.scenes[sceneId]; if (!scene || scene.archived || !scenes.some((item) => item.scene.id === sceneId)) return null; return <article className="studio-scene-card" key={sceneId} draggable={!readOnly} onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/x-studio-scene", sceneId); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); event.stopPropagation(); const dragged = event.dataTransfer.getData("text/x-studio-scene"); if (dragged && dragged !== sceneId) moveSceneTo(dragged, chapter.id, index); }}><div className="studio-scene-card__top"><span title="Arrastra para reordenar">⋮⋮ {index + 1}</span><div><button title="Subir" disabled={readOnly || index === 0} onClick={() => moveScene(chapter.id, sceneId, -1)}><ArrowUp size={14} /></button><button title="Bajar" disabled={readOnly || index === chapter.sceneIds.length - 1} onClick={() => moveScene(chapter.id, sceneId, 1)}><ArrowDown size={14} /></button></div></div><input className="studio-scene-title" value={scene.title} disabled={readOnly} onChange={(e) => changeScene(sceneId, { title: e.target.value })} /><textarea rows={view === "grid" ? 4 : 2} placeholder="Resumen de la escena" value={scene.summary} disabled={readOnly} onChange={(e) => changeScene(sceneId, { summary: e.target.value })} /><label className="studio-move-select">Mover a<select aria-label={`Mover ${scene.title} a otro capítulo`} value={chapter.id} disabled={readOnly} onChange={(e) => moveSceneTo(sceneId, e.target.value)}>{chapterOptions.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select></label><footer><span className="studio-tag">{scene.status}</span><span>{scene.wordCount || 0} palabras</span><button className="studio-inline-action" disabled={readOnly} onClick={() => setArchived("scene", scene.id, true)} title="Archivar escena"><Archive size={14} /></button><a className="studio-edit-link" href={`${studioHref(novel.id, "escribir")}?scene=${scene.id}`} aria-label={`Editar ${scene.title}`} title="Editar escena"><Pencil size={15} /></a></footer></article>; })}</div></section>)}</div></section>)}</div>}
    {showArchived && <section className="studio-panel"><h2>Archivo</h2><p>Restaura un elemento o elimínalo definitivamente. Al eliminar un acto o capítulo también se eliminan todas las escenas que contiene.</p>{archivedItems.length ? <div className="studio-archive-list">{archivedItems.map((item) => <div key={`${item.kind}:${item.id}`}><span><strong>{item.title}</strong><small>{item.kind === "act" ? "Acto" : item.kind === "chapter" ? "Capítulo" : "Escena"} · {item.detail}</small></span><div className="studio-row"><button className="studio-button studio-button--secondary" disabled={readOnly} onClick={() => setArchived(item.kind, item.id, false)}><RotateCcw size={15} /> Restaurar</button><button className="studio-button studio-button--danger" disabled={readOnly} onClick={() => deleteArchived(item.kind, item.id, item.title)}><Trash2 size={15} /> Eliminar</button></div></div>)}</div> : <p>No hay actos, capítulos ni escenas archivados.</p>}</section>}
  </section>;
}

function PlanMatrix({ items, codex, readOnly, onChange }) {
  const characters = codex.filter((entry) => entry.type === "character");
  return <div className="studio-matrix-wrap"><table className="studio-matrix"><thead><tr><th>Acto / capítulo</th><th>Escena</th><th>Resumen</th><th>POV</th><th>Estado</th><th>Tiempo</th><th>Etiquetas</th><th>Subtramas</th><th>Palabras</th></tr></thead><tbody>{items.map(({ act, chapter, scene }) => <tr key={scene.id}><td><small>{act.title}<br />{chapter.title}</small></td><td><input value={scene.title} disabled={readOnly} onChange={(e) => onChange(scene.id, { title: e.target.value })} /></td><td><textarea rows="2" value={scene.summary} disabled={readOnly} onChange={(e) => onChange(scene.id, { summary: e.target.value })} /></td><td><select value={scene.povId || ""} disabled={readOnly} onChange={(e) => onChange(scene.id, { povId: e.target.value || null })}><option value="">—</option>{characters.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></td><td><select value={scene.status} disabled={readOnly} onChange={(e) => onChange(scene.id, { status: e.target.value })}>{["Idea", "Esquema", "Borrador", "Revisión", "Final"].map((value) => <option key={value}>{value}</option>)}</select></td><td><select value={scene.temporal} disabled={readOnly} onChange={(e) => onChange(scene.id, { temporal: e.target.value })}>{["Pasado", "Presente", "Futuro"].map((value) => <option key={value}>{value}</option>)}</select></td><td><input value={(scene.labels || []).join(", ")} disabled={readOnly} onChange={(e) => onChange(scene.id, { labels: e.target.value.split(",").map((value) => value.trim()).filter(Boolean) })} /></td><td><select multiple size="3" value={scene.subplots || []} disabled={readOnly} onChange={(e) => onChange(scene.id, { subplots: [...e.target.selectedOptions].map((option) => option.value) })}>{codex.filter((entry) => entry.type === "subplot").map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}</select></td><td>{scene.wordCount || 0}</td></tr>)}</tbody></table></div>;
}

function ImportPreview({ preview, readOnly, onCancel, onConfirm }) {
  return <div className="studio-panel studio-import-preview"><div><p className="studio-kicker">Previsualización</p><h2>{preview.fileName}</h2></div><div className="studio-stat-row"><span><strong>{preview.counts.acts}</strong> actos</span><span><strong>{preview.counts.chapters}</strong> capítulos</span><span><strong>{preview.counts.scenes}</strong> escenas</span><span><strong>{preview.counts.words}</strong> palabras</span></div>{preview.warnings?.length > 0 && <details><summary>Advertencias del documento</summary><ul>{preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></details>}<p>La importación reemplazará la estructura actual después de crear un respaldo ZIP.</p><div className="studio-row"><button className="studio-button studio-button--secondary" onClick={onCancel}>Cancelar</button><button className="studio-button" disabled={readOnly} onClick={onConfirm}>Confirmar importación</button></div></div>;
}

function WritePage({ novel, structure, setStructure, codex, aiSettings, readOnly, setSaveState }) {
  const available = flattenScenes(structure); const requested = new URLSearchParams(location.search).get("scene");
  const [sceneId, setSceneId] = useState(requested && structure.scenes[requested] ? requested : available[0]?.scene.id);
  const [metadata, setMetadata] = useState(null); const [prose, setProse] = useState(""); const [dirty, setDirty] = useState(false);
  const [conflict, setConflict] = useState(null); const [focus, setFocus] = useState(false); const [revisions, setRevisions] = useState([]); const [showHistory, setShowHistory] = useState(false);
  const [aiState, setAiState] = useState({ busy: "", proposal: null, error: "" });
  const aiRequestRef = useRef(0);
  const openAiConfirmedRef = useRef(false);
  const load = useCallback(async (id) => { if (!id) return; aiRequestRef.current += 1; const scene = await repository.readScene(novel.id, id); setMetadata(scene.metadata); setProse(scene.prose); setDirty(false); setAiState({ busy: "", proposal: null, error: "" }); setSaveState("saved"); setRevisions(await repository.listRevisions(novel.id, id)); }, [novel.id, setSaveState]);
  useEffect(() => { load(sceneId); }, [sceneId, load]);
  useEffect(() => { const warn = (event) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } }; addEventListener("beforeunload", warn); return () => removeEventListener("beforeunload", warn); }, [dirty]);
  useEffect(() => {
    const inspectDisk = async () => {
      if (!sceneId || !metadata) return;
      try {
        const change = await repository.detectExternalChanges(novel.id, sceneId);
        if (!change.changed) return;
        if (dirty) { setConflict({ ...change, localContent: prose }); setSaveState("conflict"); }
        else await load(sceneId);
      } catch { /* permisos o archivo temporalmente no disponibles: el próximo guardado mostrará el error */ }
    };
    addEventListener("focus", inspectDisk);
    return () => removeEventListener("focus", inspectDisk);
  }, [dirty, load, metadata, novel.id, prose, sceneId, setSaveState]);
  const save = useCallback(async () => {
    if (!dirty || readOnly || !metadata) return true;
    setSaveState("saving");
    try {
      const saved = await repository.saveScene(novel.id, metadata, prose);
      setMetadata(saved); setDirty(false);
      const nextStructure = { ...structure, scenes: { ...structure.scenes, [saved.id]: saved } };
      setStructure(nextStructure); await repository.saveStructure(novel.id, nextStructure); setSaveState("saved"); return true;
    } catch (error) {
      if (error instanceof WorkspaceConflictError) { setConflict(error.conflict); setSaveState("conflict"); }
      else setSaveState("error");
      return false;
    }
  }, [dirty, readOnly, metadata, novel.id, prose, setSaveState, setStructure, structure]);
  useForceSave(save);
  useEffect(() => { if (!dirty) return undefined; const timer = setTimeout(save, 800); return () => clearTimeout(timer); }, [dirty, prose, metadata, save]);
  const updateProse = (value) => { setProse(value); setDirty(true); setSaveState("modified"); };
  const updateMeta = (patch) => { setMetadata((current) => ({ ...current, ...patch })); setDirty(true); setSaveState("modified"); };
  const suggestWithAi = async (task) => {
    if (readOnly || !prose.trim() || aiState.busy) return;
    if (aiSettings?.provider === "openai" && !openAiConfirmedRef.current) {
      const accepted = confirm("Esta acción enviará la prosa de la escena a OpenAI y puede generar costos en tu cuenta API. ¿Quieres continuar?");
      if (!accepted) return;
      openAiConfirmedRef.current = true;
    }
    if (aiSettings?.provider === "chatgpt-manual") {
      try {
        const prompt = buildChatGptManualPrompt(task, prose, metadata);
        const url = normalizeChatGptUrl(aiSettings.manualUrl);
        window.open(url, "_blank", "noopener,noreferrer");
        navigator.clipboard?.writeText(prompt)?.catch(() => {});
        setAiState({ busy: "", proposal: null, error: "", manual: { task, prompt, url } });
      } catch (error) { setAiState({ busy: "", proposal: null, error: error.message }); }
      return;
    }
    const requestId = ++aiRequestRef.current;
    setAiState({ busy: task, proposal: null, error: "" });
    try {
      const value = await requestSceneSuggestion({ task, prose, metadata, settings: aiSettings });
      if (requestId !== aiRequestRef.current) return;
      setAiState({ busy: "", proposal: { task, value }, error: "" });
    } catch (error) { if (requestId === aiRequestRef.current) setAiState({ busy: "", proposal: null, error: error.message }); }
  };
  const aiConfigured = aiSettings?.provider === "chatgpt-manual"
    || (aiSettings?.provider === "ollama" ? Boolean(aiSettings.ollamaModel) : Boolean(aiSettings?.apiKey));
  const aiHint = !aiConfigured
    ? <><a href={studioHref(novel.id, "configuracion")}>Configura la IA</a> para habilitar estas sugerencias.</>
    : aiSettings.provider === "ollama"
      ? `La escena se procesa localmente con ${aiSettings.ollamaModel}; no se envía a OpenAI.`
      : aiSettings.provider === "chatgpt-manual"
        ? "Se copiará una solicitud y se abrirá ChatGPT; tú pegarás el resultado de vuelta."
        : "La prosa de esta escena se envía a OpenAI solo al pulsar uno de los botones.";
  const applyAiProposal = () => {
    const proposal = aiState.proposal;
    if (!proposal) return;
    updateMeta(proposal.task === "title" ? { title: proposal.value } : { summary: proposal.value });
    setAiState({ busy: "", proposal: null, error: "" });
  };
  if (!metadata) return <div className="studio-empty"><NotebookPen size={30} /><h2>No hay escenas activas</h2><p>Crea una escena desde Plan.</p></div>;
  return <section className={`studio-page studio-write ${focus ? "is-focus" : ""}`}><PageTitle kicker="Manuscrito" title={metadata.title} text={`${countWords(prose).toLocaleString("es")} palabras en esta escena`}><button className="studio-button studio-button--secondary" onClick={() => setShowHistory((value) => !value)}><Clock3 size={17} /> Historial</button><button className="studio-button studio-button--secondary" onClick={() => setFocus((value) => !value)}><Maximize2 size={17} /> Concentración</button></PageTitle>
    <div className="studio-write-layout"><aside className="studio-scene-nav"><strong>Escenas</strong>{available.map(({ act, chapter, scene }) => <button className={scene.id === sceneId ? "active" : ""} key={scene.id} onClick={async () => { await save(); setSceneId(scene.id); history.replaceState({}, "", `${studioHref(novel.id, "escribir")}?scene=${scene.id}`); }}><small>{act.title} · {chapter.title}</small><span>{scene.title}</span><em>{scene.wordCount || 0}</em></button>)}</aside><div className="studio-editor-column"><div className="studio-scene-meta"><div className="studio-ai-field"><input aria-label="Título de escena" className="studio-write-title" value={metadata.title} disabled={readOnly} onChange={(e) => updateMeta({ title: e.target.value })} /><button type="button" className="studio-ai-button" disabled={readOnly || !aiConfigured || !prose.trim() || Boolean(aiState.busy)} onClick={() => suggestWithAi("title")}><Sparkles size={15} /> {aiState.busy === "title" ? "Pensando…" : "Sugerir título"}</button></div><input aria-label="Subtítulo" placeholder="Subtítulo opcional" value={metadata.subtitle} disabled={readOnly} onChange={(e) => updateMeta({ subtitle: e.target.value })} /><div className="studio-ai-field studio-ai-field--summary"><textarea aria-label="Resumen" rows="3" placeholder="Resumen" value={metadata.summary} disabled={readOnly} onChange={(e) => updateMeta({ summary: e.target.value })} /><button type="button" className="studio-ai-button" disabled={readOnly || !aiConfigured || !prose.trim() || Boolean(aiState.busy)} onClick={() => suggestWithAi("summary")}><Sparkles size={15} /> {aiState.busy === "summary" ? "Resumiendo…" : "Generar resumen"}</button></div><input aria-label="Beats" placeholder="Beats separados por punto y coma" value={(metadata.beats || []).join("; ")} disabled={readOnly} onChange={(e) => updateMeta({ beats: e.target.value.split(";").map((x) => x.trim()).filter(Boolean) })} />{aiState.error && <p className="studio-ai-error" role="alert">{aiState.error}</p>}<small className="studio-ai-hint">{aiHint}</small></div><RichEditor sceneId={sceneId} value={prose} readOnly={readOnly} onChange={updateProse} /></div>{showHistory && <HistoryPanel revisions={revisions} onClose={() => setShowHistory(false)} onRestore={async (revision) => { if (!confirm("¿Restaurar esta revisión? La versión actual también quedará guardada.")) return; await repository.restoreRevision(novel.id, revision); await load(sceneId); setShowHistory(false); }} />}</div>
    {conflict && <ConflictDialog conflict={conflict} onResolve={async (resolution) => { const result = await repository.resolveConflict(novel.id, metadata, prose, resolution, conflict); setConflict(null); if (resolution === "disk") { setMetadata(result.metadata); setProse(result.prose); } else setMetadata(result.metadata); setDirty(false); setSaveState("saved"); }} onEmergency={() => downloadText(prose, `${metadata.title || "escena"}-emergencia.md`)} />}
    {aiState.proposal && <AiSuggestionDialog proposal={aiState.proposal} currentValue={aiState.proposal.task === "title" ? metadata.title : metadata.summary} onApply={applyAiProposal} onCancel={() => setAiState({ busy: "", proposal: null, error: "" })} />}
    {aiState.manual && <ManualChatGptDialog request={aiState.manual} onCancel={() => setAiState({ busy: "", proposal: null, error: "" })} onApply={(value) => { updateMeta(aiState.manual.task === "title" ? { title: value } : { summary: value }); setAiState({ busy: "", proposal: null, error: "" }); }} />}
  </section>;
}

function RichEditor({ sceneId, value, readOnly, onChange }) {
  const suppress = useRef(false);
  const editor = useEditor({
    extensions: [StarterKit, Underline, Highlight.configure({ multicolor: true }), TextAlign.configure({ types: ["heading", "paragraph"] }), SectionNode],
    content: markdownToHtml(value), editable: !readOnly,
    onUpdate: ({ editor: active }) => { if (!suppress.current) onChange(htmlToMarkdown(active.getHTML())); },
    editorProps: { attributes: { class: "studio-prose", "aria-label": "Texto de la escena" } },
  });
  useEffect(() => { if (!editor) return; suppress.current = true; editor.commands.setContent(markdownToHtml(value), { emitUpdate: false }); suppress.current = false; }, [sceneId, editor]);
  useEffect(() => { editor?.setEditable(!readOnly); }, [editor, readOnly]);
  if (!editor) return null;
  const button = (label, Icon, action, active) => <button type="button" title={label} className={active ? "active" : ""} onClick={action}><Icon size={17} /></button>;
  return <div className="studio-editor"><div className="studio-editor-toolbar">{button("Deshacer", Undo2, () => editor.chain().focus().undo().run())}{button("Rehacer", Redo2, () => editor.chain().focus().redo().run())}<span />{button("Negrita", Bold, () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}{button("Cursiva", Italic, () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}{button("Subrayado", UnderlineIcon, () => editor.chain().focus().toggleUnderline().run(), editor.isActive("underline"))}{button("Tachado", Strikethrough, () => editor.chain().focus().toggleStrike().run(), editor.isActive("strike"))}{button("Resaltado", Highlighter, () => editor.chain().focus().toggleHighlight({ color: "#f1d58a" }).run(), editor.isActive("highlight"))}<span />{button("Encabezado", Heading2, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }))}{button("Cita", Quote, () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"))}{button("Lista", List, () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}{button("Lista numerada", ListOrdered, () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"))}<button type="button" title="Insertar sección" onClick={() => editor.chain().focus().insertContent({ type: "studioSection", attrs: { title: "Nota", color: "gold" }, content: [{ type: "paragraph" }] }).run()}><Box size={17} /></button></div><EditorContent editor={editor} /></div>;
}

function HistoryPanel({ revisions, onClose, onRestore }) {
  return <aside className="studio-history"><header><div><p className="studio-kicker">Versiones</p><h2>Historial</h2></div><button className="studio-icon-button" onClick={onClose}><X size={18} /></button></header>{revisions.length ? revisions.map((revision) => <article key={revision.id}><strong>{formatDate(revision.createdAt)}</strong><span>{revision.reason}</span><p>{String(revision.content || "").slice(0, 150) || "Sin contenido"}</p><button onClick={() => onRestore(revision)}>Restaurar</button></article>) : <p>Aún no hay revisiones anteriores.</p>}</aside>;
}

function ConflictDialog({ conflict, onResolve, onEmergency }) {
  return <div className="studio-modal" role="dialog" aria-modal="true" aria-labelledby="conflict-title"><div className="studio-modal__card"><p className="studio-kicker">Cambio externo detectado</p><h2 id="conflict-title">El archivo cambió fuera del estudio</h2><p>No se sobrescribirá automáticamente. Elige qué versión conservar.</p><div className="studio-gate__actions"><button className="studio-button studio-button--secondary" onClick={() => onResolve("disk")}>Usar archivo del disco</button><button className="studio-button" onClick={() => onResolve("local")}>Usar mi edición</button><button className="studio-button studio-button--secondary" onClick={() => onResolve("both")}>Guardar ambas</button></div><button className="studio-text-link" onClick={onEmergency}>Descargar edición de emergencia</button><small>{conflict.path}</small></div></div>;
}

function AiSuggestionDialog({ proposal, currentValue, onApply, onCancel }) {
  const isTitle = proposal.task === "title";
  return <div className="studio-modal" role="dialog" aria-modal="true" aria-labelledby="ai-suggestion-title"><div className="studio-modal__card studio-ai-dialog"><p className="studio-kicker"><Sparkles size={15} /> Sugerencia de IA</p><h2 id="ai-suggestion-title">{isTitle ? "Título propuesto" : "Resumen propuesto"}</h2><p className="studio-ai-privacy">Revisa el resultado antes de reemplazar el texto actual. Nada se aplicará si cancelas.</p>{currentValue && <div className="studio-ai-comparison"><small>Actual</small><p>{currentValue}</p></div>}<div className="studio-ai-comparison is-proposal"><small>Propuesta</small><p>{proposal.value}</p></div><div className="studio-row"><button type="button" className="studio-button studio-button--secondary" onClick={onCancel}>Cancelar</button><button type="button" className="studio-button" onClick={onApply}><Sparkles size={16} /> Aplicar sugerencia</button></div></div></div>;
}

function ManualChatGptDialog({ request, onApply, onCancel }) {
  const [value, setValue] = useState("");
  const copyPrompt = async () => {
    try { await navigator.clipboard.writeText(request.prompt); }
    catch { /* El prompt permanece visible para copiarlo manualmente. */ }
  };
  return <div className="studio-modal" role="dialog" aria-modal="true" aria-labelledby="manual-chatgpt-title"><div className="studio-modal__card studio-manual-dialog"><p className="studio-kicker"><Sparkles size={15} /> ChatGPT manual</p><h2 id="manual-chatgpt-title">Completa la solicitud en ChatGPT</h2><ol><li>Inicia sesión en la pestaña de ChatGPT o del proyecto que se abrió.</li><li>Pega la solicitud con <kbd>Ctrl</kbd> + <kbd>V</kbd> y envíala.</li><li>Copia solamente el resultado y pégalo abajo.</li></ol><details><summary>Ver la solicitud preparada</summary><textarea readOnly rows="8" value={request.prompt} /></details><div className="studio-row"><button type="button" className="studio-button studio-button--secondary" onClick={copyPrompt}>Copiar solicitud</button><button type="button" className="studio-button studio-button--secondary" onClick={() => window.open(request.url || "https://chatgpt.com/", "_blank", "noopener,noreferrer")}>Abrir ChatGPT o proyecto</button></div><label>{request.task === "title" ? "Título devuelto" : "Resumen devuelto"}<textarea autoFocus rows={request.task === "title" ? 2 : 5} placeholder="Pega aquí el resultado de ChatGPT" value={value} onChange={(event) => setValue(event.target.value)} /></label><div className="studio-row"><button type="button" className="studio-button studio-button--secondary" onClick={onCancel}>Cancelar</button><button type="button" className="studio-button" disabled={!value.trim()} onClick={() => onApply(value.trim())}>Aplicar resultado</button></div></div></div>;
}

function CodexPage({ novel, structure, entries, setEntries, readOnly, setSaveState }) {
  const [selectedId, setSelectedId] = useState(entries[0]?.id || null); const [draft, setDraft] = useState(entries[0] || null); const [query, setQuery] = useState(""); const [mentions, setMentions] = useState({});
  useEffect(() => { const selected = entries.find((entry) => entry.id === selectedId); if (selected) setDraft(selected); }, [selectedId, entries]);
  useEffect(() => {
    let worker; let cancelled = false;
    (async () => {
      const scenes = [];
      for (const { scene } of flattenScenes(structure)) { try { scenes.push({ ...scene, prose: (await repository.readScene(novel.id, scene.id)).prose }); } catch { /* skip */ } }
      if (cancelled) return;
      worker = new Worker(new URL("./mentions.worker.js", import.meta.url), { type: "module" }); worker.onmessage = (event) => setMentions(event.data); worker.postMessage({ scenes, entries });
    })(); return () => { cancelled = true; worker?.terminate(); };
  }, [entries, novel.id, structure]);
  const save = async () => { if (!draft || readOnly) return true; setSaveState("saving"); try { const saved = await repository.saveCodexEntry(novel.id, draft); setEntries((current) => [...current.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name, "es"))); setDraft(saved); setSaveState("saved"); return true; } catch { setSaveState("error"); return false; } };
  useForceSave(save);
  const create = () => { const entry = createCodexEntry(); setEntries((current) => [...current, entry]); setSelectedId(entry.id); setDraft(entry); };
  const filtered = entries.filter((entry) => `${entry.name} ${entry.type} ${(entry.aliases || []).join(" ")}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <section className="studio-page"><PageTitle kicker="Biblia de la historia" title="Codex" text="Personajes, lugares, objetos, conocimientos y subtramas conectados con el manuscrito."><button className="studio-button" disabled={readOnly} onClick={create}><Plus size={17} /> Nueva entrada</button></PageTitle><div className="studio-codex-layout"><aside className="studio-codex-list"><label className="studio-search"><Search size={16} /><input placeholder="Buscar Codex" value={query} onChange={(e) => setQuery(e.target.value)} /></label>{filtered.map((entry) => <button className={entry.id === selectedId ? "active" : ""} key={entry.id} onClick={() => setSelectedId(entry.id)}><span>{entry.type === "character" ? <UserRound size={17} /> : <Box size={17} />}{entry.name}</span><small>{(mentions[entry.id] || []).reduce((sum, item) => sum + item.count, 0)} menciones</small></button>)}</aside>{draft ? <div className="studio-codex-editor"><div className="studio-form-grid"><label>Nombre<input value={draft.name} disabled={readOnly} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label><label>Tipo<select value={draft.type} disabled={readOnly} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>{[["character", "Personaje"], ["location", "Ubicación"], ["object", "Objeto"], ["lore", "Conocimiento"], ["subplot", "Subtrama"], ["other", "Otro"]].map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div><label>Alias<input value={(draft.aliases || []).join(", ")} disabled={readOnly} onChange={(e) => setDraft({ ...draft, aliases: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} /></label><label>Descripción<textarea rows="10" value={draft.description || ""} disabled={readOnly} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label><label>Detalles personalizados <small>Un campo por línea: Nombre: valor</small><textarea rows="5" value={Object.entries(draft.details || {}).map(([key, value]) => `${key}: ${value}`).join("\n")} disabled={readOnly} onChange={(e) => setDraft({ ...draft, details: Object.fromEntries(e.target.value.split(/\r?\n/).map((line) => { const split = line.indexOf(":"); return split > 0 ? [line.slice(0, split).trim(), line.slice(split + 1).trim()] : null; }).filter(Boolean)) })} /></label><div className="studio-form-grid"><label>Categorías<input value={(draft.categories || []).join(", ")} disabled={readOnly} onChange={(e) => setDraft({ ...draft, categories: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} /></label><label>Exclusiones<input value={(draft.exclusions || []).join(", ")} disabled={readOnly} onChange={(e) => setDraft({ ...draft, exclusions: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} /></label></div><label>Relaciones con otras entradas<select multiple size="5" value={draft.relations || []} disabled={readOnly} onChange={(e) => setDraft({ ...draft, relations: [...e.target.selectedOptions].map((option) => option.value) })}>{entries.filter((entry) => entry.id !== draft.id).map((entry) => <option value={entry.id} key={entry.id}>{entry.name} · {entry.type}</option>)}</select></label><section className="studio-progressions"><h3>Progresiones</h3><p>Estos cambios solo estarán vigentes desde la escena elegida en adelante.</p>{(draft.progressions || []).map((progression, index) => <div key={progression.id}><select value={progression.sceneId} disabled={readOnly} onChange={(e) => { const next = structuredClone(draft.progressions); next[index].sceneId = e.target.value; setDraft({ ...draft, progressions: next }); }}>{flattenScenes(structure).map(({ scene }) => <option value={scene.id} key={scene.id}>{scene.title}</option>)}</select><input value={progression.text} disabled={readOnly} onChange={(e) => { const next = structuredClone(draft.progressions); next[index].text = e.target.value; setDraft({ ...draft, progressions: next }); }} /><button className="studio-icon-button" disabled={readOnly} onClick={() => setDraft({ ...draft, progressions: draft.progressions.filter((item) => item.id !== progression.id) })}><Trash2 size={16} /></button></div>)}<button className="studio-button studio-button--secondary" disabled={readOnly || !flattenScenes(structure).length} onClick={() => setDraft({ ...draft, progressions: [...(draft.progressions || []), { id: makeId(), sceneId: flattenScenes(structure)[0].scene.id, text: "", createdAt: nowIso() }] })}><Plus size={16} /> Añadir progresión</button></section><div className="studio-checks"><label><input type="checkbox" checked={draft.trackMentions} disabled={readOnly} onChange={(e) => setDraft({ ...draft, trackMentions: e.target.checked })} /> Detectar menciones</label><label><input type="checkbox" checked={draft.caseSensitive} disabled={readOnly} onChange={(e) => setDraft({ ...draft, caseSensitive: e.target.checked })} /> Distinguir mayúsculas</label></div><div className="studio-row"><button className="studio-button" disabled={readOnly || !draft.name.trim()} onClick={save}><Save size={17} /> Guardar entrada</button><button className="studio-button studio-button--danger" disabled={readOnly} onClick={async () => { if (confirm("¿Eliminar esta entrada del Codex?")) { await repository.deleteCodexEntry(novel.id, draft.id); setEntries((current) => current.filter((item) => item.id !== draft.id)); setDraft(null); } }}><Trash2 size={17} /> Eliminar</button></div><section className="studio-mentions"><h3>Menciones</h3>{(mentions[draft.id] || []).map((item) => <a key={item.sceneId} href={`${studioHref(novel.id, "escribir")}?scene=${item.sceneId}`}><span>{item.sceneTitle}</span><strong>{item.count}</strong></a>)}{!(mentions[draft.id] || []).length && <p>No se encontraron menciones.</p>}</section></div> : <div className="studio-empty"><Box size={28} /><p>Selecciona o crea una entrada.</p></div>}</div></section>;
}

function SettingsPage({ novel, setNovel, structure, preferences, setPreferences, readOnly, setSaveState }) {
  const [draft, setDraft] = useState(novel);
  const [aiDraft, setAiDraft] = useState(preferences.ai);
  const [message, setMessage] = useState("");
  const [exportOptions, setExportOptions] = useState({ includeProse: true, includeSummaries: true });
  const save = async () => {
    setSaveState("saving");
    try { const saved = await repository.saveNovel(draft); setNovel(saved); setDraft(saved); setSaveState("saved"); setMessage("Configuración de la novela guardada."); return true; }
    catch (e) { setSaveState("error"); setMessage(e.message); return false; }
  };
  const saveAi = async (nextAi = aiDraft) => {
    setSaveState("saving"); setMessage("");
    try {
      const current = await repository.preferences();
      const cleanAi = {
        ...nextAi,
        enabled: true,
        apiKey: nextAi.apiKey.trim(),
        manualUrl: nextAi.provider === "chatgpt-manual" ? normalizeChatGptUrl(nextAi.manualUrl) : nextAi.manualUrl,
      };
      const saved = await repository.savePreferences({ ...current, ai: cleanAi });
      setPreferences(saved); setAiDraft(saved.ai); setSaveState("saved");
      setMessage("Configuración de IA guardada en preferences.json."); return true;
    } catch (error) { setSaveState("error"); setMessage(error.message); return false; }
  };
  useForceSave(async () => (await save()) && (await saveAi()));
  return <section className="studio-page"><PageTitle kicker="Proyecto y portabilidad" title="Configuración" text="Metadatos, IA, exportación editorial y respaldo completo del workspace." />
    {message && <p className="studio-notice" role="status">{message}</p>}
    <div className="studio-settings-grid">
      <section className="studio-panel"><h2>Datos de la novela</h2><label>Título<input value={draft.title} disabled={readOnly} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label><label>Autor<input value={draft.author} disabled={readOnly} onChange={(e) => setDraft({ ...draft, author: e.target.value })} /></label><label>Género<input value={draft.genre} disabled={readOnly} onChange={(e) => setDraft({ ...draft, genre: e.target.value })} /></label><label>Sinopsis<textarea rows="6" value={draft.synopsis} disabled={readOnly} onChange={(e) => setDraft({ ...draft, synopsis: e.target.value })} /></label><label>Meta de palabras<input type="number" min="0" value={draft.wordGoal} disabled={readOnly} onChange={(e) => setDraft({ ...draft, wordGoal: Number(e.target.value) })} /></label><button className="studio-button" disabled={readOnly} onClick={save}><Save size={17} /> Guardar</button></section>
      <AiSettingsPanel aiDraft={aiDraft} setAiDraft={setAiDraft} savedAi={preferences.ai} readOnly={readOnly} onSave={saveAi} onMessage={setMessage} />
      <section className="studio-panel"><h2>Exportación editorial</h2><p>Genera una copia legible del manuscrito. Los archivos originales no se modifican.</p><label><input type="checkbox" checked={exportOptions.includeProse} onChange={(e) => setExportOptions({ ...exportOptions, includeProse: e.target.checked })} /> Incluir prosa</label><label><input type="checkbox" checked={exportOptions.includeSummaries} onChange={(e) => setExportOptions({ ...exportOptions, includeSummaries: e.target.checked })} /> Incluir resúmenes</label><div className="studio-row"><button className="studio-button studio-button--secondary" onClick={async () => { const { exportNovelMarkdown } = await import("./documentIO.js"); await exportNovelMarkdown(repository, novel, structure, exportOptions); }}><Download size={17} /> Markdown</button><button className="studio-button studio-button--secondary" onClick={async () => { const { exportNovelDocx } = await import("./documentIO.js"); await exportNovelDocx(repository, novel, structure, exportOptions); }}><Download size={17} /> DOCX</button></div><hr /><h2>Respaldo completo</h2><p>Incluye biblioteca, manuscritos, Codex, historial y configuración de todas las novelas.</p><button className="studio-button" onClick={async () => { const result = await repository.createWorkspaceBackup({ download: true }); setMessage(`Respaldo creado: ${result.filename}`); }}><FileArchive size={17} /> Crear ZIP</button></section>
      <section className="studio-panel studio-danger-zone"><h2>Archivo</h2><p>Una novela archivada desaparece de la biblioteca principal, pero sus archivos permanecen intactos.</p><button className="studio-button studio-button--danger" disabled={readOnly} onClick={async () => { await repository.archiveNovel(novel.id, true); location.href = "/estudio-novela"; }}><Archive size={17} /> Archivar novela</button></section>
    </div>
  </section>;
}

function AiSettingsPanel({ aiDraft, setAiDraft, savedAi, readOnly, onSave, onMessage }) {
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [ollamaModels, setOllamaModels] = useState([]);
  const [ollamaStatus, setOllamaStatus] = useState("idle");
  const [installMode, setInstallMode] = useState("desktop");
  const [statusDialog, setStatusDialog] = useState(null);
  const installControllerRef = useRef(null);
  const originCommand = ollamaOriginCommand(window.location.origin);
  const ollamaRecovery = {
    command: originCommand,
    steps: [
      "Presiona la tecla Windows o haz clic en Inicio.",
      "Escribe PowerShell y abre Windows PowerShell. No necesitas usarlo como administrador.",
      "Pulsa Copiar comando aquí, vuelve a PowerShell, pega el comando y presiona Enter.",
      "Cierra Ollama desde su icono junto al reloj de Windows. Luego abre Inicio, escribe Ollama y haz clic en Ollama para iniciarlo nuevamente.",
      "Regresa a esta página y pulsa Comprobar instalación otra vez.",
    ],
  };
  useEffect(() => {
    if (aiDraft.provider === "ollama" && !aiDraft.ollamaModel) {
      setAiDraft((current) => ({ ...current, ollamaModel: OLLAMA_MODEL_PRESETS[0].id, enabled: false }));
    }
  }, [aiDraft.provider, aiDraft.ollamaModel, setAiDraft]);
  let manualUrlError = "";
  if (aiDraft.provider === "chatgpt-manual") {
    try { normalizeChatGptUrl(aiDraft.manualUrl); }
    catch (error) { manualUrlError = error.message; }
  }
  const providerReady = aiDraft.provider === "chatgpt-manual"
    ? !manualUrlError
    : aiDraft.provider === "ollama" ? Boolean(aiDraft.ollamaModel) : Boolean(aiDraft.apiKey.trim());
  const update = (patch) => setAiDraft({ ...aiDraft, ...patch });
  const selectedModelInstalled = aiDraft.provider === "ollama" && ollamaModels.some((model) => model.name === aiDraft.ollamaModel);
  const copy = async (text) => { try { await navigator.clipboard.writeText(text); onMessage("Comando copiado al portapapeles."); } catch { onMessage("No se pudo copiar automáticamente; selecciona el comando manualmente."); } };
  const detectOllama = async () => {
    setDetecting(true); setOllamaStatus("checking"); onMessage("");
    setStatusDialog({ kind: "detect", state: "working", provider: "Ollama local", model: aiDraft.ollamaModel || "Sin seleccionar", title: "Comprobando Ollama", message: "Consultando los modelos instalados en este PC…" });
    try {
      const models = await listOllamaModels(aiDraft.ollamaUrl);
      const chosenModel = chooseOllamaModel(models, aiDraft.ollamaModel);
      const installed = models.some((model) => model.name === chosenModel);
      setOllamaModels(models); setOllamaStatus(installed ? "installed" : models.length ? "missing" : "empty");
      if (chosenModel !== aiDraft.ollamaModel) update({ ollamaModel: chosenModel, enabled: false });
      onMessage(models.length ? `Ollama conectado: ${models.length} modelo(s) disponible(s).` : "Ollama está instalado, pero todavía no tiene modelos descargados.");
      setStatusDialog({ kind: "detect", state: installed ? "success" : "warning", provider: "Ollama local", model: chosenModel || "Sin seleccionar", title: installed ? "Modelo instalado" : "Modelo no instalado", message: installed ? `${chosenModel} está disponible y listo para probarse.` : chosenModel ? `${chosenModel} no aparece entre los modelos instalados en este PC.` : "Ollama respondió, pero no hay ningún modelo instalado." });
    } catch (error) { setOllamaModels([]); setOllamaStatus("unavailable"); onMessage(error.message); setStatusDialog({ kind: "detect", state: "error", provider: "Ollama local", model: aiDraft.ollamaModel || OLLAMA_MODEL_PRESETS[0].id, title: "No se pudo comprobar Ollama", message: error.message, recovery: ollamaRecovery }); }
    finally { setDetecting(false); }
  };
  const installOllamaModel = async () => {
    const model = aiDraft.ollamaModel;
    if (!model) return;
    const controller = new AbortController();
    installControllerRef.current = controller;
    setStatusDialog({ kind: "install", state: "working", provider: "Ollama local", model, title: "Instalando modelo", message: "Conectando con Ollama…", percent: 0 });
    try {
      await pullOllamaModel({ baseUrl: aiDraft.ollamaUrl, model, signal: controller.signal, onProgress: (progress) => setStatusDialog((current) => ({ ...current, message: progress.status, percent: progress.percent })) });
      const models = await listOllamaModels(aiDraft.ollamaUrl);
      setOllamaModels(models); setOllamaStatus(models.some((item) => item.name === model) ? "installed" : "missing");
      update({ enabled: false });
      setStatusDialog({ kind: "install", state: "success", provider: "Ollama local", model, title: "Modelo instalado", message: `${model} terminó de descargarse y ya está disponible.`, percent: 100 });
    } catch (error) {
      const cancelled = error?.name === "AbortError";
      setStatusDialog({ kind: "install", state: cancelled ? "warning" : "error", provider: "Ollama local", model, title: cancelled ? "Instalación cancelada" : "No se pudo instalar el modelo", message: cancelled ? "La solicitud de descarga fue cancelada." : error.message, percent: 0 });
    } finally { installControllerRef.current = null; }
  };
  const testProvider = async () => {
    setTesting(true); onMessage("");
    const provider = aiDraft.provider === "ollama" ? "Ollama local" : aiDraft.provider === "openai" ? "OpenAI API" : "ChatGPT manual";
    const model = aiDraft.provider === "ollama" ? aiDraft.ollamaModel : aiDraft.provider === "openai" ? aiDraft.model : "Sin modelo automático";
    setStatusDialog({ kind: "test", state: "working", provider, model, title: "Probando conexión", message: `Esperando respuesta de ${model}…` });
    try {
      if (aiDraft.provider === "chatgpt-manual") {
        const url = normalizeChatGptUrl(aiDraft.manualUrl);
        window.open(url, "_blank", "noopener,noreferrer");
        setStatusDialog({ kind: "test", state: "success", provider, model, title: "Modo manual listo", message: "Se abrió la dirección configurada. Este modo no realiza una conexión automática." });
        return;
      }
      const suggestion = await requestSceneSuggestion({ task: "title", prose: "Una viajera encuentra una puerta iluminada en mitad del bosque.", metadata: {}, settings: aiDraft });
      setStatusDialog({ kind: "test", state: "success", provider, model, title: "Conexión correcta", message: `El modelo respondió: “${suggestion}”` });
    } catch (error) { setStatusDialog({ kind: "test", state: "error", provider, model, title: "Falló la prueba de conexión", message: error.message, recovery: aiDraft.provider === "ollama" ? ollamaRecovery : null }); }
    finally { setTesting(false); }
  };
  const removeKey = async () => {
    if (!confirm("¿Eliminar la clave API guardada en este workspace?")) return;
    await onSave({ ...aiDraft, enabled: false, apiKey: "" });
  };
  return <section className="studio-panel studio-ai-settings"><div className="studio-panel-heading"><div><p className="studio-kicker">Workspace completo</p><h2>Inteligencia artificial</h2></div><Sparkles size={24} /></div><p>Elige cómo generar títulos y resúmenes. La selección se comparte entre todas las novelas de esta carpeta.</p>
    <label>Proveedor<select value={aiDraft.provider} disabled={readOnly} onChange={(event) => update({ provider: event.target.value, ollamaModel: event.target.value === "ollama" ? aiDraft.ollamaModel || OLLAMA_MODEL_PRESETS[0].id : aiDraft.ollamaModel, enabled: false })}><option value="chatgpt-manual">ChatGPT manual</option><option value="ollama">Ollama · modelos locales</option><option value="openai">OpenAI API</option></select></label>
    {aiDraft.provider === "openai" && <><label>Clave API de OpenAI<div className="studio-secret-field"><input type={showKey ? "text" : "password"} autoComplete="off" spellCheck="false" placeholder="sk-…" value={aiDraft.apiKey} disabled={readOnly} onChange={(event) => update({ apiKey: event.target.value, enabled: event.target.value ? aiDraft.enabled : false })} /><button type="button" className="studio-button studio-button--secondary" onClick={() => setShowKey((value) => !value)}>{showKey ? "Ocultar" : "Mostrar"}</button></div></label><label>Modelo<select value={aiDraft.model} disabled={readOnly} onChange={(event) => update({ model: event.target.value })}><option value="gpt-5.6-luna">GPT-5.6 Luna · menor costo</option><option value="gpt-5.6-terra">GPT-5.6 Terra · equilibrado</option><option value="gpt-5.6-sol">GPT-5.6 Sol · máxima capacidad</option></select></label><div className="studio-local-secret-warning"><strong>Almacenamiento local sin cifrar</strong><p>La clave se guardará en <code>preferences.json</code> y se incluirá en los respaldos ZIP.</p></div></>}
    {aiDraft.provider === "chatgpt-manual" && <><label>URL de ChatGPT o del proyecto<input type="url" inputMode="url" autoComplete="url" spellCheck="false" placeholder="https://chatgpt.com/…" value={aiDraft.manualUrl || ""} disabled={readOnly} onChange={(event) => update({ manualUrl: event.target.value, enabled: false })} /><small>Puedes pegar la URL de un proyecto de ChatGPT. Se guarda solamente en el <code>preferences.json</code> de esta carpeta.</small></label>{manualUrlError && <p className="studio-ai-error" role="alert">{manualUrlError}</p>}<div className="studio-row"><button type="button" className="studio-button studio-button--secondary" disabled={readOnly} onClick={() => update({ manualUrl: "https://chatgpt.com/", enabled: false })}>Usar ChatGPT general</button></div><div className="studio-provider-info"><strong>Sin API y sin automatización de la cuenta</strong><p>Al usar IA se copiará una solicitud y se abrirá la dirección configurada. Tú iniciarás sesión, enviarás el texto y pegarás el resultado de vuelta en el estudio.</p></div></>}
    {aiDraft.provider === "ollama" && <div className="studio-ollama-settings"><label>Servidor local<input value={aiDraft.ollamaUrl} disabled={readOnly} onChange={(event) => update({ ollamaUrl: event.target.value, enabled: false })} /></label><div className={`studio-model-status is-${ollamaStatus}`}><strong>Modelo seleccionado: {aiDraft.ollamaModel || "ninguno"}</strong><span>{selectedModelInstalled ? "Instalado y detectado en este PC" : ollamaStatus === "checking" ? "Comprobando instalación…" : ollamaStatus === "missing" || ollamaStatus === "empty" ? "No está instalado" : "Estado todavía no comprobado"}</span></div><button type="button" className="studio-button studio-button--secondary" disabled={detecting} onClick={detectOllama}>{detecting ? "Detectando…" : "Comprobar instalación"}</button>{ollamaModels.length > 0 && <label>Usar un modelo ya instalado<select value={selectedModelInstalled ? aiDraft.ollamaModel : ""} disabled={readOnly} onChange={(event) => update({ ollamaModel: event.target.value, enabled: false })}><option value="" disabled>Selecciona un modelo instalado</option>{ollamaModels.map((model) => <option key={model.name} value={model.name}>{model.name}{model.parameterSize ? ` · ${model.parameterSize}` : ""}{model.size ? ` · ${(model.size / 1e9).toFixed(1)} GB` : ""}</option>)}</select></label>}{!selectedModelInstalled && <OllamaSetupWizard aiDraft={aiDraft} update={update} installMode={installMode} setInstallMode={setInstallMode} originCommand={originCommand} onCopy={copy} onInstall={installOllamaModel} />}</div>}
    <div className="studio-row"><button className="studio-button" disabled={readOnly || !providerReady} onClick={() => onSave()}><Save size={17} /> Guardar IA</button><button className="studio-button studio-button--secondary" disabled={!providerReady || testing} onClick={testProvider}><Sparkles size={17} /> {testing ? "Probando…" : aiDraft.provider === "chatgpt-manual" ? "Abrir ChatGPT" : "Probar conexión"}</button>{savedAi.apiKey && aiDraft.provider === "openai" && <button className="studio-button studio-button--danger" disabled={readOnly} onClick={removeKey}>Eliminar clave</button>}</div>
    {statusDialog && <AiStatusDialog dialog={statusDialog} onClose={() => setStatusDialog(null)} onCopy={copy} onCancel={statusDialog.kind === "install" && statusDialog.state === "working" ? () => installControllerRef.current?.abort() : null} />}
  </section>;
}

function OllamaSetupWizard({ aiDraft, update, installMode, setInstallMode, originCommand, onCopy, onInstall }) {
  const pullCommand = aiDraft.ollamaModel ? `ollama pull ${aiDraft.ollamaModel}` : "";
  return <div className="studio-ollama-wizard">
    <div><p className="studio-kicker">Asistente de instalación</p><h3>1. ¿Qué instalación prefieres?</h3><div className="studio-choice-grid"><button type="button" className={installMode === "desktop" ? "active" : ""} onClick={() => setInstallMode("desktop")}><strong>Aplicación estable</strong><small>Recomendada para Windows; se actualiza con Ollama.</small></button><button type="button" className={installMode === "cli" ? "active" : ""} onClick={() => setInstallMode("cli")}><strong>CLI independiente</strong><small>Avanzada, pensada para servicio o instalación personalizada.</small></button></div></div>
    <div><h3>2. ¿Qué tamaño de modelo quieres?</h3><p className="studio-ai-privacy">La RAM indicada es una orientación aproximada; la GPU, el contexto y otros programas abiertos también influyen.</p><div className="studio-model-grid">{OLLAMA_MODEL_PRESETS.map((model) => <button type="button" className={aiDraft.ollamaModel === model.id ? "active" : ""} key={model.id} onClick={() => update({ ollamaModel: model.id, enabled: false })}><strong>{model.label} · {model.id}</strong><span>{model.download} de descarga</span><span>{model.ram}</span><small>{model.detail}</small></button>)}</div></div>
    {installMode && aiDraft.ollamaModel && <div className="studio-install-steps"><h3>3. Instala y conecta, en este orden</h3><ol className="studio-setup-sequence"><li><strong>Descarga e instala Ollama.</strong><p>{installMode === "desktop" ? "Pulsa el botón, abre el archivo OllamaSetup.exe descargado y termina la instalación. Si Ollama ya está instalado, puedes omitir este punto." : "Abre la guía oficial y completa la instalación de la CLI antes de continuar."}</p><a className="studio-button studio-button--secondary" href={installMode === "desktop" ? "https://ollama.com/download/windows" : "https://docs.ollama.com/windows#standalone-cli"} target="_blank" rel="noreferrer">{installMode === "desktop" ? "A. Descargar Ollama para Windows" : "A. Abrir guía de instalación CLI"}</a></li><li><strong>Autoriza esta página una sola vez.</strong><p>Presiona la tecla <kbd>Windows</kbd> o haz clic en <strong>Inicio</strong>, escribe <strong>PowerShell</strong> y abre <strong>Windows PowerShell</strong>. No necesitas usarlo como administrador. Luego pulsa <strong>Copiar comando</strong>, vuelve a PowerShell, pégalo y presiona <kbd>Enter</kbd>.</p><div className="studio-command"><code>{originCommand}</code><button type="button" onClick={() => onCopy(originCommand)}>Copiar comando</button></div></li><li><strong>Reinicia Ollama.</strong><p>Cierra Ollama desde su icono junto al reloj de Windows. Después abre <strong>Inicio</strong>, escribe <strong>Ollama</strong> y haz clic en la aplicación para iniciarla nuevamente.</p></li><li><strong>Comprueba la instalación.</strong><p>Regresa a esta sección y pulsa <strong>Comprobar instalación</strong>. Si Ollama encuentra modelos instalados, el primero quedará seleccionado automáticamente.</p></li><li><strong>Descarga el modelo elegido si todavía no tienes uno.</strong><p>Con Ollama abierto, este botón instalará <strong>{aiDraft.ollamaModel}</strong> en el PC y mostrará el progreso.</p><button type="button" className="studio-button" onClick={onInstall}><Download size={17} /> Instalar {aiDraft.ollamaModel}</button></li></ol><details><summary>Alternativa: instalar el modelo desde PowerShell</summary><div className="studio-command"><code>{pullCommand}</code><button type="button" onClick={() => onCopy(pullCommand)}>Copiar</button></div></details></div>}
  </div>;
}

function AiStatusDialog({ dialog, onClose, onCancel, onCopy }) {
  const working = dialog.state === "working";
  return <div className="studio-modal" role={dialog.state === "error" ? "alertdialog" : "dialog"} aria-modal="true" aria-labelledby="ai-status-title" aria-describedby="ai-status-message"><div className={`studio-modal__card studio-status-dialog is-${dialog.state}`}><p className="studio-kicker"><Sparkles size={15} /> Estado de IA</p><h2 id="ai-status-title">{dialog.title}</h2><dl><div><dt>Proveedor</dt><dd>{dialog.provider}</dd></div><div><dt>Modelo</dt><dd>{dialog.model}</dd></div></dl>{dialog.kind === "install" && <div className="studio-install-progress"><progress max="100" value={dialog.percent || 0} /><strong>{dialog.percent || 0}%</strong></div>}<p id="ai-status-message">{dialog.message}</p>{dialog.recovery && <div className="studio-ollama-recovery"><h3>Cómo resolverlo en Windows</h3><ol>{dialog.recovery.steps.map((step) => <li key={step}>{step}</li>)}</ol><div className="studio-command"><code>{dialog.recovery.command}</code><button type="button" onClick={() => onCopy(dialog.recovery.command)}>Copiar comando</button></div></div>}<div className="studio-row">{onCancel && <button type="button" className="studio-button studio-button--danger" onClick={onCancel}>Cancelar descarga</button>}<button type="button" className="studio-button" disabled={working} onClick={onClose}>{working ? "Espera…" : "Cerrar"}</button></div></div></div>;
}

function PageTitle({ kicker, title, text, children }) {
  return <header className="studio-page-title"><div><p className="studio-kicker">{kicker}</p><h1>{title}</h1><p>{text}</p></div><div className="studio-page-title__actions">{children}</div></header>;
}
