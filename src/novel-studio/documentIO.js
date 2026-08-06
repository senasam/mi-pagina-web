import mammoth from "mammoth/mammoth.browser.js";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { createScene, makeId, nowIso, safeFileName } from "./model.js";

export async function fileToMarkdown(file) {
  if (/\.docx$/i.test(file.name)) {
    const result = await mammoth.convertToMarkdown({ arrayBuffer: await file.arrayBuffer() });
    return { markdown: result.value, warnings: result.messages.map((message) => message.message) };
  }
  if (/\.(md|markdown|txt)$/i.test(file.name)) return { markdown: await file.text(), warnings: [] };
  throw new Error("Formato no compatible. Usa DOCX, Markdown o TXT.");
}

export function manuscriptImportPreview(markdown, fallbackTitle = "Importación") {
  const structure = { schemaVersion: 1, acts: [], scenes: {} };
  const contents = {};
  let act = null; let chapter = null; let scene = null;
  const ensureAct = () => {
    if (!act) { act = { id: makeId(), title: "Acto 1", numbered: true, chapters: [] }; structure.acts.push(act); }
    return act;
  };
  const ensureChapter = () => {
    ensureAct();
    if (!chapter) { chapter = { id: makeId(), title: "Capítulo 1", numbered: true, sceneIds: [] }; act.chapters.push(chapter); }
    return chapter;
  };
  const ensureScene = (title = fallbackTitle) => {
    ensureChapter();
    if (!scene) {
      scene = createScene(makeId(), title);
      structure.scenes[scene.id] = scene; chapter.sceneIds.push(scene.id); contents[scene.id] = "";
    }
    return scene;
  };
  for (const rawLine of markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").split(/\r?\n/)) {
    const heading = /^(#{1,3})\s+(.+)$/.exec(rawLine.trim());
    if (heading?.[1].length === 1) {
      act = { id: makeId(), title: heading[2].trim(), numbered: true, chapters: [] };
      structure.acts.push(act); chapter = null; scene = null;
    } else if (heading?.[1].length === 2) {
      ensureAct(); chapter = { id: makeId(), title: heading[2].trim(), numbered: true, sceneIds: [] };
      act.chapters.push(chapter); scene = null;
    } else if (heading?.[1].length === 3) {
      ensureChapter(); scene = createScene(makeId(), heading[2].trim());
      structure.scenes[scene.id] = scene; chapter.sceneIds.push(scene.id); contents[scene.id] = "";
    } else {
      const current = ensureScene();
      contents[current.id] += `${rawLine}\n`;
    }
  }
  for (const id of Object.keys(contents)) contents[id] = contents[id].trim();
  return {
    structure, contents,
    counts: {
      acts: structure.acts.length,
      chapters: structure.acts.reduce((sum, item) => sum + item.chapters.length, 0),
      scenes: Object.keys(structure.scenes).length,
      words: Object.values(contents).join(" ").trim().split(/\s+/u).filter(Boolean).length,
    },
  };
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportNovelMarkdown(repository, novel, structure, options = {}) {
  const includeSummaries = options.includeSummaries !== false;
  const includeProse = options.includeProse !== false;
  const selected = new Set(options.sceneIds || Object.keys(structure.scenes));
  const lines = [`# ${novel.title}`, "", novel.author ? `**${novel.author}**` : "", ""];
  for (const act of structure.acts) {
    const includedChapters = act.chapters.filter((chapter) => chapter.sceneIds.some((id) => selected.has(id) && !structure.scenes[id]?.archived));
    if (!includedChapters.length) continue;
    lines.push(`# ${act.title}`, "");
    for (const chapter of includedChapters) {
      lines.push(`## ${chapter.title}`, "");
      for (const sceneId of chapter.sceneIds) {
        const metadata = structure.scenes[sceneId];
        if (!metadata || metadata.archived || !selected.has(sceneId)) continue;
        lines.push(`### ${metadata.title}`, "");
        if (metadata.subtitle) lines.push(`*${metadata.subtitle}*`, "");
        if (includeSummaries && metadata.summary) lines.push(`> ${metadata.summary.replace(/\n/g, "\n> ")}`, "");
        if (includeProse) {
          const scene = await repository.readScene(novel.id, sceneId);
          lines.push(scene.prose.trim(), "");
        }
      }
    }
  }
  const markdown = `${lines.filter((line, index) => line || lines[index - 1]).join("\n").trim()}\n`;
  download(new Blob([markdown], { type: "text/markdown;charset=utf-8" }), `${safeFileName(novel.title)}.md`);
  return markdown;
}

function markdownPlainText(markdown) {
  return markdown.replace(/<[^>]+>/g, "").replace(/^[>#*-]+\s*/gm, "").replace(/[*_~`\[\]]/g, "");
}

export async function exportNovelDocx(repository, novel, structure, options = {}) {
  const markdown = await buildMarkdownWithoutDownload(repository, novel, structure, options);
  const paragraphs = [];
  for (const line of markdown.split(/\r?\n/)) {
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      paragraphs.push(new Paragraph({ text: markdownPlainText(heading[2]), heading: [null, HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][heading[1].length] }));
    } else if (line.trim()) paragraphs.push(new Paragraph({ children: [new TextRun(markdownPlainText(line))] }));
    else paragraphs.push(new Paragraph(""));
  }
  const document = new Document({ creator: novel.author || "Estudio de novela", title: novel.title, description: `Exportado ${nowIso()}`, sections: [{ children: paragraphs }] });
  const blob = await Packer.toBlob(document);
  download(blob, `${safeFileName(novel.title)}.docx`);
}

async function buildMarkdownWithoutDownload(repository, novel, structure, options) {
  const includeSummaries = options.includeSummaries !== false;
  const includeProse = options.includeProse !== false;
  const lines = [`# ${novel.title}`, ""];
  for (const act of structure.acts) {
    lines.push(`# ${act.title}`, "");
    for (const chapter of act.chapters) {
      lines.push(`## ${chapter.title}`, "");
      for (const sceneId of chapter.sceneIds) {
        const metadata = structure.scenes[sceneId];
        if (!metadata || metadata.archived) continue;
        lines.push(`### ${metadata.title}`, "");
        if (includeSummaries && metadata.summary) lines.push(`> ${metadata.summary}`, "");
        if (includeProse) lines.push((await repository.readScene(novel.id, sceneId)).prose, "");
      }
    }
  }
  return lines.join("\n");
}
