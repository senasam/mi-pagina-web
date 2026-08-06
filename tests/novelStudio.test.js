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
  assert.match(source, /enabled: true/);
  assert.match(source, /Momentos clave de la escena/);
  assert.match(source, /no aparece en el manuscrito final/);
  assert.match(source, /label: "Codex"/);
  assert.match(source, /title="Codex"/);
  assert.match(source, /personajes, lugares, objetos, conocimientos y subtramas/);
  assert.match(source, /Alias y otras formas de nombrar esta entrada/);
  assert.match(source, /event\.key === "Enter" \|\| event\.key === ","/);
  assert.match(source, /aria-label={`Quitar \${value}`}/);
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
});

test("chapter title context includes novel act and scene summaries", () => {
  const { act, scene } = createActWithContent(1);
  scene.title = "La carta";
  scene.summary = "Elena descubre un mensaje oculto.";
  const context = buildChapterTitleContext({ title: "El umbral", genre: "Misterio", synopsis: "Una casa guarda un secreto." }, act, act.chapters[0], { [scene.id]: scene });
  assert.match(context, /Novela: El umbral/);
  assert.match(context, /Acto: Acto 1/);
  assert.match(context, /La carta — Elena descubre/);
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
