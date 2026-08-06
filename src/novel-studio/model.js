export const SCHEMA_VERSION = 1;

export const nowIso = () => new Date().toISOString();
export const makeId = () => crypto.randomUUID();

export function emptyStructure() {
  const { act, scene } = createActWithContent(1);
  return {
    schemaVersion: SCHEMA_VERSION,
    acts: [act],
    scenes: { [scene.id]: scene },
  };
}

export function createScene(id = makeId(), title = "Nueva escena") {
  return {
    id, title, subtitle: "", summary: "", beats: [], povId: null,
    status: "Borrador", temporal: "Presente", labels: [], subplots: [],
    wordCount: 0, contentHash: "", updatedAt: nowIso(), archived: false,
  };
}

export function createChapterWithScene(index = 1) {
  const scene = createScene(makeId(), "Escena 1");
  return {
    chapter: { id: makeId(), title: `Capítulo ${index}`, numbered: true, archived: false, sceneIds: [scene.id] },
    scene,
  };
}

export function createActWithContent(index = 1) {
  const { chapter, scene } = createChapterWithScene(1);
  return {
    act: { id: makeId(), title: `Acto ${index}`, numbered: true, archived: false, chapters: [chapter] },
    scene,
  };
}

export function createNovelRecord(title, author = "") {
  const timestamp = nowIso();
  return {
    id: makeId(), title: title.trim() || "Novela sin título", author: author.trim(),
    synopsis: "", genre: "", language: "es", wordGoal: 80000,
    archived: false, createdAt: timestamp, updatedAt: timestamp,
  };
}

export function createCodexEntry(type = "character") {
  return {
    id: makeId(), type, name: "Nueva entrada", aliases: [], categories: [], details: {},
    relations: [], progressions: [], trackMentions: true, caseSensitive: false,
    exclusions: [], archived: false, updatedAt: nowIso(),
  };
}

export function countWords(value = "") {
  const clean = value
    .replace(/^---[\s\S]*?---\s*/m, "")
    .replace(/<[^>]+>|[#>*_~`\[\](){}:+-]/g, " ")
    .trim();
  return clean ? clean.split(/\s+/u).filter(Boolean).length : 0;
}

export function safeFileName(value = "archivo") {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").replace(/\s+/g, "-")
    .replace(/-+/g, "-").replace(/^[.-]+|[.-]+$/g, "").slice(0, 80) || "archivo";
}

export async function sha256(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function sceneToMarkdown(scene, prose = "") {
  const yamlString = (value) => JSON.stringify(String(value ?? ""));
  return [
    "---",
    `id: ${yamlString(scene.id)}`,
    `title: ${yamlString(scene.title)}`,
    "version: 1",
    "---",
    "",
    prose.trimEnd(),
    "",
  ].join("\n");
}

export function markdownBody(markdown = "") {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").replace(/^\s+/, "");
}

export function parseOutline(text) {
  const acts = [];
  let currentAct = null;
  let currentChapter = null;
  for (const sourceLine of text.split(/\r?\n/)) {
    const line = sourceLine.trim();
    if (!line) continue;
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading?.[1].length === 1) {
      currentAct = { id: makeId(), title: heading[2], numbered: true, archived: false, chapters: [] };
      acts.push(currentAct); currentChapter = null;
    } else if (heading?.[1].length === 2) {
      if (!currentAct) { currentAct = { id: makeId(), title: "Acto 1", numbered: true, archived: false, chapters: [] }; acts.push(currentAct); }
      currentChapter = { id: makeId(), title: heading[2], numbered: true, archived: false, scenes: [] };
      currentAct.chapters.push(currentChapter);
    } else {
      if (!currentAct) { currentAct = { id: makeId(), title: "Acto 1", numbered: true, archived: false, chapters: [] }; acts.push(currentAct); }
      if (!currentChapter) { currentChapter = { id: makeId(), title: "Capítulo 1", numbered: true, archived: false, scenes: [] }; currentAct.chapters.push(currentChapter); }
      const title = heading?.[2] || line.replace(/^[-*]\s+/, "");
      currentChapter.scenes.push({ ...createScene(), title });
    }
  }
  return acts;
}

export function applyOutline(structure, parsedActs) {
  const next = structuredClone(structure);
  for (const parsedAct of parsedActs) {
    const act = { id: parsedAct.id, title: parsedAct.title, numbered: parsedAct.numbered, archived: false, chapters: [] };
    for (const parsedChapter of parsedAct.chapters) {
      const chapter = { id: parsedChapter.id, title: parsedChapter.title, numbered: parsedChapter.numbered, archived: false, sceneIds: [] };
      for (const scene of parsedChapter.scenes) {
        next.scenes[scene.id] = scene;
        chapter.sceneIds.push(scene.id);
      }
      act.chapters.push(chapter);
    }
    next.acts.push(act);
  }
  return next;
}

export function findMentions(text, entry) {
  if (!entry?.trackMentions) return [];
  const terms = [entry.name, ...(entry.aliases || [])].filter(Boolean).sort((a, b) => b.length - a.length);
  if (!terms.length) return [];
  const exclusions = new Set((entry.exclusions || []).map((x) => entry.caseSensitive ? x : x.toLocaleLowerCase()));
  const escaped = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const flags = entry.caseSensitive ? "gu" : "giu";
  const regex = new RegExp(`(?<![\\p{L}\\p{N}_])(${escaped.join("|")})(?![\\p{L}\\p{N}_])`, flags);
  return [...String(text).matchAll(regex)]
    .filter((match) => !exclusions.has(entry.caseSensitive ? match[0] : match[0].toLocaleLowerCase()))
    .map((match) => ({ index: match.index, length: match[0].length, text: match[0] }));
}

export function flattenScenes(structure) {
  return structure.acts.filter((act) => !act.archived).flatMap((act, actIndex) => act.chapters.filter((chapter) => !chapter.archived).flatMap((chapter, chapterIndex) =>
    chapter.sceneIds.map((sceneId, sceneIndex) => ({
      act, chapter, scene: structure.scenes[sceneId], actIndex, chapterIndex, sceneIndex,
    })).filter((item) => item.scene && !item.scene.archived)));
}
