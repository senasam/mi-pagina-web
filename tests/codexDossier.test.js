import test from "node:test";
import assert from "node:assert/strict";
import { applyDossierClassification, mergeDossierDetails, parseCharacterDossier, parseCharacterDossierHtml } from "../src/novel-studio/codexDossier.js";

test("organiza una ficha importada en secciones avanzadas del personaje", () => {
  const parsed = parseCharacterDossier("# Índice general\n* 1. Ficha maestra\n# 1. Ficha maestra y cronología general\nNace en 1852.\n# 5. Perfil militar\nOficial de caballería.\n# Guía de voz y diálogo\nHabla con frases breves.");
  assert.equal(parsed["Ficha maestra y cronología general"], "Nace en 1852.");
  assert.equal(parsed["Perfil profesional o militar"], "Oficial de caballería.");
  assert.equal(parsed["Guía de voz y diálogo"], "Habla con frases breves.");
  assert.equal(Object.values(parsed).some((value) => value.includes("* 1. Ficha")), false);
});

test("combina una importación sin borrar el expediente existente", () => {
  const merged = mergeDossierDetails({ "Origen familiar e infancia": "Contenido anterior" }, { "Origen familiar e infancia": "Contenido importado", "Personas vinculadas": "Amanda" });
  assert.match(merged["Origen familiar e infancia"], /Contenido anterior\n\nContenido importado/);
  assert.equal(merged["Personas vinculadas"], "Amanda");
});

test("conserva tablas y formato HTML al separar una ficha de Word", () => {
  const parsed = parseCharacterDossierHtml("<h1>Perfil militar</h1><p><strong>Rango:</strong> capitán</p><table><tbody><tr><td>Arma</td><td>Sable</td></tr></tbody></table><h1>Guía de voz y diálogo</h1><ul><li>Frases breves</li></ul>");
  assert.match(parsed["Perfil profesional o militar"], /<strong>Rango:<\/strong>/);
  assert.match(parsed["Perfil profesional o militar"], /<table>/);
  assert.match(parsed["Guía de voz y diálogo"], /<ul>/);
});

test("reubica con la clasificación de IA solo campos personalizados y conserva su HTML", () => {
  const original = {
    "Datos de combate": "<p>Experto con sable.</p><table><tbody><tr><td>Arma</td><td>Sable</td></tr></tbody></table>",
    "Notas ambiguas": "<p>Por revisar.</p>",
    "Guía de voz y diálogo": "<p>Habla bajo.</p>",
  };
  const result = applyDossierClassification(original, JSON.stringify({ assignments: [
    { source: "Datos de combate", target: "Habilidades, destrezas, armas y poderes" },
    { source: "Notas ambiguas", target: "Un atributo inventado" },
    { source: "Guía de voz y diálogo", target: "Retrato físico y presencia corporal" },
  ] }));
  assert.equal(result.moved, 1);
  assert.match(result.sections["Habilidades, destrezas, armas y poderes"], /<table>/);
  assert.equal(result.sections["Datos de combate"], undefined);
  assert.equal(result.sections["Notas ambiguas"], "<p>Por revisar.</p>");
  assert.equal(result.sections["Guía de voz y diálogo"], "<p>Habla bajo.</p>");
});
