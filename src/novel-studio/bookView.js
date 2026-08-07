export const BOOK_SCENE_STATUSES = new Set(["Revisión", "Final"]);

export function isBookScene(scene) {
  return Boolean(scene && !scene.archived && BOOK_SCENE_STATUSES.has(scene.status));
}

export function splitProseIntoPages(prose = "", targetLength = 1250) {
  const blocks = String(prose).trim().split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  if (!blocks.length) return [];
  const pages = [];
  let current = "";
  for (const block of blocks) {
    if (current && current.length + block.length + 2 > targetLength) { pages.push(current); current = ""; }
    if (block.length <= targetLength) current = current ? `${current}\n\n${block}` : block;
    else for (const word of block.split(/\s+/)) {
      if (current && current.length + word.length + 1 > targetLength) { pages.push(current); current = word; }
      else current = current ? `${current} ${word}` : word;
    }
  }
  if (current) pages.push(current);
  return pages;
}

function roman(value) {
  const pairs = [[1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"], [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]];
  let number = value; let result = "";
  for (const [amount, symbol] of pairs) while (number >= amount) { result += symbol; number -= amount; }
  return result;
}

export function buildBookPages(novel, sceneRecords = [], options = {}) {
  const editorial = novel.editorial || {};
  const prosePageLength = Number(options.prosePageLength) || 1250;
  const editorialPageLength = Number(options.editorialPageLength) || 1050;
  const tocEntriesPerPage = Number(options.tocEntriesPerPage) || 16;
  const pages = [{ kind: "cover", title: novel.title, subtitle: editorial.subtitle || "", author: novel.author, image: novel.coverImage || null }];
  const addTextPages = (kind, heading, text, targetLength = editorialPageLength) => {
    const chunks = splitProseIntoPages(text, targetLength);
    chunks.forEach((chunk, index) => pages.push({ kind, heading: index === 0 ? heading : "", runningTitle: heading, text: chunk }));
  };
  pages.push({ kind: "title", title: novel.title, subtitle: editorial.subtitle || "", author: novel.author, publisher: editorial.publisher || "" });
  const copyrightLines = [editorial.edition, editorial.publisher && `Editorial: ${editorial.publisher}`, editorial.printer && `Imprenta: ${editorial.printer}`,
    editorial.publicationPlace || editorial.publicationYear ? `${editorial.publicationPlace || ""}${editorial.publicationPlace && editorial.publicationYear ? ", " : ""}${editorial.publicationYear || ""}` : "",
    editorial.isbn && `ISBN: ${editorial.isbn}`, editorial.legalDeposit && `Depósito legal: ${editorial.legalDeposit}`,
    editorial.propertyRegistry && `Registro de propiedad intelectual: ${editorial.propertyRegistry}`,
    editorial.rights || (novel.author ? `© ${editorial.publicationYear || new Date().getFullYear()} ${novel.author}. Todos los derechos reservados.` : "Todos los derechos reservados."), editorial.credits].filter(Boolean);
  addTextPages("front", "Créditos editoriales", copyrightLines.join("\n\n"));
  for (const [heading, key] of [["Dedicatoria", "dedication"], ["Epígrafe", "epigraph"], ["Prefacio", "preface"], ["Agradecimientos", "acknowledgments"]]) if (editorial[key]?.trim()) addTextPages("front", heading, editorial[key].trim());
  let lastChapterId = "";
  for (const record of sceneRecords.filter(({ scene }) => isBookScene(scene))) {
    if (record.chapter.id !== lastChapterId) { pages.push({ kind: "chapter", actTitle: record.act.title, title: record.chapter.title }); lastChapterId = record.chapter.id; }
    splitProseIntoPages(record.prose, prosePageLength).forEach((text, index) => pages.push({ kind: "prose", title: record.scene.title, showTitle: index === 0, text, sceneId: record.scene.id }));
    for (const image of record.scene.images || []) pages.push({ kind: "image", image, title: image.caption || record.scene.title, sceneId: record.scene.id });
  }
  if (editorial.authorNotes?.trim()) addTextPages("back", "Notas del autor", editorial.authorNotes.trim());
  const firstBodyBeforeContents = pages.findIndex((page) => ["chapter", "prose", "image"].includes(page.kind));
  if (firstBodyBeforeContents >= 0) {
    const chapterCount = pages.filter((page) => page.kind === "chapter").length;
    const contentsPageCount = Math.max(1, Math.ceil(chapterCount / tocEntriesPerPage));
    pages.splice(firstBodyBeforeContents, 0, ...Array.from({ length: contentsPageCount }, (_, tocIndex) => ({ kind: "contents", heading: tocIndex === 0 ? "Índice" : "", runningTitle: "Índice", tocIndex })));
  }
  const firstBody = pages.findIndex((page) => ["chapter", "prose", "image"].includes(page.kind));
  const numbered = pages.map((page, index) => ({ ...page, pageLabel: index === 0 ? "" : firstBody >= 0 && index >= firstBody ? String(index - firstBody + 1) : roman(index) }));
  const entries = numbered.filter((page) => page.kind === "chapter").map((page) => ({ title: page.title, pageLabel: page.pageLabel }));
  return numbered.map((page) => page.kind === "contents" ? { ...page, entries: entries.slice(page.tocIndex * tocEntriesPerPage, page.tocIndex * tocEntriesPerPage + tocEntriesPerPage) } : page);
}
