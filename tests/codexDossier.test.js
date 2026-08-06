import test from "node:test";
import assert from "node:assert/strict";
import { mergeDossierDetails, parseCharacterDossier } from "../src/novel-studio/codexDossier.js";

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
