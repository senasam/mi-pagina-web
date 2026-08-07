import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  applyOutline, buildChapterTitleContext, countWords, createActWithContent, createChapterWithScene, createCodexEntry, createScene, findMentions, groupMentionsByStory,
  flattenScenes, markdownBody, parseOutline, safeFileName, sceneToMarkdown,
} from "../src/novel-studio/model.js";
import { manuscriptImportPreview } from "../src/novel-studio/documentIO.js";

test("novel studio serializes readable scene markdown and removes front matter", () => {
  const scene = createScene("scene-1", "La llegada");
  const markdown = sceneToMarkdown(scene, "El tren llegó tarde.\n\nNadie bajó.");
  assert.match(markdown, /id: "scene-1"/);
  assert.match(markdown, /title: "La llegada"/);
  assert.equal(markdownBody(markdown), "El tren llegó tarde.\n\nNadie bajó.\n");
  assert.equal(countWords(markdown), 6);
});

test("novel studio sanitizes filenames for Windows", () => {
  assert.equal(safeFileName('Capítulo 1: ¿Qué pasó? <final>'), "Capitulo-1-¿Que-paso-final");
  assert.equal(safeFileName("..."), "archivo");
});

test("outline parser creates stable act chapter and scene hierarchy", () => {
  const parsed = parseOutline("# Acto I\n## Capítulo uno\n### Encuentro\n### Huida\n# Acto II\n## Regreso\n- Desenlace");
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].chapters[0].scenes.length, 2);
  assert.equal(parsed[1].chapters[0].scenes[0].title, "Desenlace");
  const structure = { schemaVersion: 1, acts: [], scenes: {} };
  const next = applyOutline(structure, parsed);
  assert.equal(next.acts.length, 2);
  assert.equal(Object.keys(next.scenes).length, 3);
});

test("mention engine supports aliases, exclusions and case sensitivity", () => {
  const entry = { ...createCodexEntry(), name: "William", aliases: ["Will"], exclusions: ["will"], caseSensitive: false };
  assert.deepEqual(findMentions("William saludó a Will, pero will no cuenta.", entry).map((item) => item.text), ["William"]);
  const sensitive = { ...entry, exclusions: [], caseSensitive: true };
  assert.deepEqual(findMentions("Will y will", sensitive).map((item) => item.text), ["Will"]);
});

test("mentions are grouped by act and chapter and summarize aliases", () => {
  const grouped = groupMentionsByStory([
    { actId: "a1", actTitle: "Acto I", chapterId: "c1", chapterTitle: "Llegada", sceneId: "s1", sceneTitle: "El tren", count: 2, matches: [{ text: "Rainiero" }, { text: "Cardona" }] },
    { actId: "a1", actTitle: "Acto I", chapterId: "c1", chapterTitle: "Llegada", sceneId: "s2", sceneTitle: "La casa", count: 1, matches: [{ text: "rainiero" }] },
  ]);
  assert.equal(grouped.total, 3);
  assert.equal(grouped.sceneCount, 2);
  assert.equal(grouped.acts[0].count, 3);
  assert.equal(grouped.acts[0].chapters[0].scenes.length, 2);
  assert.deepEqual(grouped.variants.map(({ label, count }) => [label, count]), [["Rainiero", 2], ["Cardona", 1]]);
});

test("manuscript import previews acts, chapters, scenes and contents", () => {
  const preview = manuscriptImportPreview("# Acto 1\n## Capítulo 1\n### Escena A\nHola mundo.\n### Escena B\nAdiós mundo.");
  assert.deepEqual(preview.counts, { acts: 1, chapters: 1, scenes: 2, words: 4 });
  assert.deepEqual(Object.values(preview.contents), ["Hola mundo.", "Adiós mundo."]);
});

test("AI actions activate from valid settings without an extra checkbox", async () => {
  const source = await readFile(new URL("../src/novel-studio/NovelStudioApp.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /Habilitar botones de IA/);
  assert.doesNotMatch(source, /!aiSettings\?\.enabled/);
  assert.match(source, /puede generar costos en tu cuenta API/);
  assert.match(source, /enabled: activate/);
  assert.match(source, /La clave vive sólo en la memoria de esta pestaña/);
  assert.match(source, /Momentos clave de la escena/);
  assert.match(source, /suggestWithAi\("beats"\)/);
  assert.match(source, /Generar momentos/);
  assert.doesNotMatch(source, /Concentración/);
  assert.doesNotMatch(source, /Guardar todo/);
  assert.match(source, />Guardar<\/span>/);
  assert.match(source, /TOGGLE_HISTORY_EVENT/);
  assert.match(source, /Ir a la escena anterior/);
  assert.match(source, /Ir a la escena siguiente/);
  assert.match(source, /studio-header-scene-navigation/);
  assert.match(source, /SCENE_NAVIGATION_STATE_EVENT/);
  assert.match(source, /addEventListener\(PREVIOUS_SCENE_EVENT, goBack\)/);
  assert.doesNotMatch(source, /studio-scene-position/);
  assert.match(source, /navigation=\{sidebarToggle\}/);
  assert.doesNotMatch(source, /aria-label="Título de escena"/);
  assert.doesNotMatch(source, /Subtítulo opcional/);
  assert.match(source, /sceneLocation\.act\.title/);
  assert.match(source, /sceneLocation\.chapter\.title/);
  assert.match(source, /scrollIntoView\(\{ behavior: "smooth", block: "center" \}\)/);
  assert.match(source, /setFocusStoryId\(act\.id\)/);
  assert.match(source, /setFocusStoryId\(chapter\.id\)/);
  assert.match(source, /text\/x-studio-act/);
  assert.match(source, /text\/x-studio-chapter/);
  assert.match(source, /const moveActTo/);
  assert.match(source, /const moveChapterTo/);
  assert.match(source, /Contraer acto/);
  assert.match(source, /Contraer capítulo/);
  assert.match(source, /Acto \{actIndex \+ 1\}/);
  assert.match(source, /Cap\. \{chapterIndex \+ 1\}/);
  assert.match(source, /Editar nombres del acto y del capítulo/);
  assert.match(source, /aria-label="Nombre del acto"/);
  assert.match(source, /aria-label="Nombre del capítulo"/);
  assert.match(source, /act\.title = actTitle/);
  assert.match(source, /chapter\.title = chapterTitle/);
  assert.doesNotMatch(source, /Personajes que participan/);
  assert.doesNotMatch(source, /Añadir otro personaje/);
  assert.match(source, /placeholder="Añadir personaje…"/);
  assert.match(source, /aria-autocomplete="list"/);
  assert.match(source, /findMentions\(prose, entry\)/);
  assert.match(source, /participantIds/);
  assert.match(source, /aria-pressed=\{selected\}/);
  assert.match(source, /aria-label="Estado de la escena"/);
  assert.match(source, /updateMeta\(\{ status: event\.target\.value \}\)/);
  assert.match(source, /SCENE_STATUSES\.map/);
  assert.match(source, /function proseExcerpt/);
  assert.match(source, /Resumir con IA/);
  assert.match(source, /studio-plan-participants/);
  assert.match(source, /function characterChipLabel/);
  assert.match(source, /characterChipLabel\(character\)/);
  assert.match(source, /scene\.participantIds/);
  assert.match(source, /repository\.readScene\(novel\.id, id\)/);
  assert.match(source, /Cargando escena…/);
  assert.match(source, /value === lastValue\.current/);
  assert.match(source, /\[sceneId, editor, value\]/);
  assert.match(source, /loadId !== sceneLoadRef\.current/);
  assert.match(source, /no aparece en el manuscrito final/);
  assert.match(source, /label: "Codex"/);
  assert.match(source, /title="Codex"/);
  assert.match(source, /personajes, lugares, objetos, conocimientos y subtramas/);
  assert.match(source, /Alias y otras formas de nombrar esta entrada/);
  assert.match(source, /event\.key === "Enter" \|\| event\.key === ","/);
  assert.match(source, /aria-label={`Quitar \${value}`}/);
  assert.match(source, /Sugerencias usadas en este tipo:/);
  assert.match(source, /task: "codex-categories"/);
  assert.match(source, /Personaliza libremente o elige las ya usadas/);
  assert.match(source, /setTimeout\(save, 600\)/);
  assert.match(source, /reason: "autosave"/);
  assert.match(source, /Los cambios se guardan automáticamente/);
  assert.match(source, /Expediente del personaje/);
  assert.match(source, /<details className="studio-dossier">/);
  assert.match(source, /Abrir o cerrar expediente/);
  assert.ok(source.indexOf("Categorías del personaje") < source.indexOf('<div className="studio-codex-description"'));
  assert.match(source, />Nombre<input value=\{draftNames\.firstName\}/);
  assert.match(source, /Apellido o apellidos/);
  assert.match(source, /task: "codex-name"/);
  assert.match(source, /task: "codex-relationship"/);
  assert.match(source, /Sugerir tipo e intensidad usando ambas fichas/);
  assert.match(source, /Importar ficha/);
  assert.match(source, /Combinar con la ficha/);
  assert.match(source, /Reemplazar secciones detectadas/);
  assert.match(source, /Clasificar con IA/);
  assert.match(source, /codex-import-classification/);
  assert.match(source, /createDossierClassificationBatches/);
  assert.match(source, /Lote \$\{index \+ 1\} de \$\{batches\.length\}/);
  assert.match(source, /TableKit\.configure/);
  assert.match(source, /insertTable\(\{ rows: 3, cols: 3/);
  assert.match(source, /fileToHtml/);
  assert.match(source, /suggestCodexField\("Descripción"\)/);
  assert.match(source, /ATRIBUTO OBJETIVO:/);
  assert.match(source, /ATRIBUTOS AVANZADOS:/);
  assert.match(source, /Escribir con IA/);
  assert.match(source, /Vaciar sección/);
  assert.match(source, /Archivar entrada/);
  assert.match(source, /Archivo del Codex/);
  assert.match(source, /restaurar-codex/);
  assert.match(source, />Abrir todas<\/button>/);
  assert.match(source, />Cerrar todas<\/button>/);
  assert.match(source, /const \[open, setOpen\] = useState\(false\)/);
  assert.match(source, /Mapa de relaciones/);
  assert.match(source, /id: "relaciones", label: "Relaciones"/);
  assert.match(source, /mode === "relaciones" && <CharacterNetworkPage/);
  assert.match(source, /studioHref\(novel\.id, "codex"\)\}\?entry=/);
  assert.match(source, /El tamaño del nodo representa sus menciones/);
  assert.match(source, /Conectar dos personajes/);
  assert.match(source, /Agregar conexión/);
  assert.match(source, /Necesitas al menos dos entradas de tipo Personaje/);
  assert.match(source, /Intensidad:/);
  assert.match(source, /buildCharacterNetwork/);
  assert.match(source, /Sus resultados se agrupan por acto y capítulo/);
  assert.match(source, /Encontrado como:/);
  assert.doesNotMatch(source, /placeholder="Beats/);
});

test("new acts and chapters include a blank scene ready to write", () => {
  const { act, scene: actScene } = createActWithContent(2);
  assert.equal(act.title, "Acto 2");
  assert.equal(act.chapters.length, 1);
  assert.deepEqual(act.chapters[0].sceneIds, [actScene.id]);
  const { chapter, scene } = createChapterWithScene(3);
  assert.equal(chapter.title, "Capítulo 3");
  assert.deepEqual(chapter.sceneIds, [scene.id]);
  assert.equal(scene.title, "Escena 1");
  assert.deepEqual(scene.participantIds, []);
});

test("chapter title context uses scene summaries instead of scene titles", () => {
  const { act, scene } = createActWithContent(1);
  scene.title = "La carta";
  scene.summary = "Elena descubre un mensaje oculto.";
  const context = buildChapterTitleContext({ title: "El umbral", genre: "Misterio", synopsis: "Una casa guarda un secreto." }, act, act.chapters[0], { [scene.id]: scene });
  assert.match(context, /Novela: El umbral/);
  assert.match(context, /Acto: Acto 1/);
  assert.match(context, /1\. Elena descubre un mensaje oculto/);
  assert.doesNotMatch(context, /La carta/);
});

test("archived acts chapters and scenes disappear from the active manuscript", () => {
  const { act, scene } = createActWithContent(1);
  const structure = { schemaVersion: 1, acts: [act], scenes: { [scene.id]: scene } };
  assert.equal(flattenScenes(structure).length, 1);
  act.chapters[0].archived = true;
  assert.equal(flattenScenes(structure).length, 0);
  act.chapters[0].archived = false;
  act.archived = true;
  assert.equal(flattenScenes(structure).length, 0);
});

test("studio retries the edit lock and exposes archive lifecycle actions", async () => {
  const [app, repository] = await Promise.all([
    readFile(new URL("../src/novel-studio/NovelStudioApp.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/novel-studio/LocalWorkspaceRepository.js", import.meta.url), "utf8"),
  ]);
  assert.match(app, /setTimeout\(acquire, 600\)/);
  assert.match(app, /className="studio-edit-link"/);
  assert.match(app, /<Pencil size=\{15\}/);
  assert.match(app, /Sugerir nombre con IA/);
  assert.match(repository, /archiveStoryItem/);
  assert.match(repository, /deleteStoryItem/);
  assert.match(repository, /Primero debes archivar el capítulo/);
});
