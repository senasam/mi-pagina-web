import test from "node:test";
import assert from "node:assert/strict";
import {
  applyOutline, countWords, createCodexEntry, createScene, findMentions,
  markdownBody, parseOutline, safeFileName, sceneToMarkdown,
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

test("manuscript import previews acts, chapters, scenes and contents", () => {
  const preview = manuscriptImportPreview("# Acto 1\n## Capítulo 1\n### Escena A\nHola mundo.\n### Escena B\nAdiós mundo.");
  assert.deepEqual(preview.counts, { acts: 1, chapters: 1, scenes: 2, words: 4 });
  assert.deepEqual(Object.values(preview.contents), ["Hola mundo.", "Adiós mundo."]);
});
