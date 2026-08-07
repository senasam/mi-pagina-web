import test from "node:test";
import assert from "node:assert/strict";
import { buildBookPages, isBookScene, splitProseIntoPages } from "../src/novel-studio/bookView.js";

test("la vista libro admite únicamente escenas en Revisión o Final", () => {
  assert.equal(isBookScene({ status: "Borrador", archived: false }), false);
  assert.equal(isBookScene({ status: "Revisión", archived: false }), true);
  assert.equal(isBookScene({ status: "Final", archived: false }), true);
  assert.equal(isBookScene({ status: "Final", archived: true }), false);
});

test("pagina la prosa sin perder texto", () => {
  const prose = `${"palabra ".repeat(250)}\n\n${"final ".repeat(120)}`.trim();
  const pages = splitProseIntoPages(prose, 500);
  assert.ok(pages.length > 2);
  assert.equal(pages.join(" ").replace(/\s+/g, " ").trim(), prose.replace(/\s+/g, " ").trim());
});

test("construye preliminares, capítulos, ilustraciones y notas con numeración editorial", () => {
  const novel = { title: "El viaje", author: "Ana", coverImage: { path: "cover.jpg" }, editorial: { publisher: "Editorial Sur", dedication: "Para M.", authorNotes: "Sobre esta historia." } };
  const base = { act: { title: "Acto I" }, chapter: { id: "c1", title: "La partida" } };
  const pages = buildBookPages(novel, [
    { ...base, scene: { id: "draft", status: "Borrador", images: [] }, prose: "No debe aparecer." },
    { ...base, scene: { id: "final", title: "El tren", status: "Final", images: [{ path: "tren.jpg", caption: "El tren nocturno" }] }, prose: "El tren partió." },
  ]);
  assert.equal(pages[0].kind, "cover");
  assert.ok(pages.some((page) => page.heading === "Créditos editoriales"));
  assert.ok(pages.some((page) => page.heading === "Dedicatoria"));
  assert.ok(pages.some((page) => page.kind === "contents" && page.entries[0].title === "La partida"));
  assert.ok(pages.some((page) => page.kind === "chapter"));
  assert.ok(pages.some((page) => page.kind === "image" && page.title === "El tren nocturno"));
  assert.ok(pages.some((page) => page.heading === "Notas del autor"));
  assert.equal(pages.some((page) => page.sceneId === "draft"), false);
  assert.equal(pages.find((page) => page.kind === "chapter").pageLabel, "1");
});

test("divide textos editoriales extensos y el índice en varias páginas", () => {
  const records = Array.from({ length: 20 }, (_, index) => ({ act: { title: "Acto I" }, chapter: { id: `c${index}`, title: `Capítulo ${index + 1}` }, scene: { id: `s${index}`, title: "Escena", status: "Final", images: [] }, prose: "Texto breve." }));
  const pages = buildBookPages({ title: "Novela", author: "Autora", editorial: { preface: "prefacio ".repeat(500) } }, records);
  assert.ok(pages.filter((page) => page.runningTitle === "Prefacio").length > 1);
  assert.equal(pages.filter((page) => page.kind === "contents").length, 2);
  assert.equal(pages.filter((page) => page.kind === "contents").flatMap((page) => page.entries).length, 20);
});

test("permite recalcular la cantidad de páginas según el tamaño de lectura", () => {
  const record = { act: { title: "Acto I" }, chapter: { id: "c1", title: "Capítulo" }, scene: { id: "s1", title: "Escena", status: "Final", images: [] }, prose: "texto ".repeat(800) };
  const smallType = buildBookPages({ title: "Novela", editorial: {} }, [record], { prosePageLength: 1900 });
  const largeType = buildBookPages({ title: "Novela", editorial: {} }, [record], { prosePageLength: 700 });
  assert.ok(largeType.length > smallType.length);
});
