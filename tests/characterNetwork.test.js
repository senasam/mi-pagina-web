import test from "node:test";
import assert from "node:assert/strict";
import { buildCharacterNetwork, characterNameParts, normalizeRelationship, planRelationshipUpdates, relationshipStyle } from "../src/novel-studio/characterNetwork.js";

test("construye nodos de personajes cuyo tamaño depende de las menciones", () => {
  const entries = [
    { id: "a", name: "Ana", type: "character", relations: [{ targetId: "b", type: "alliance", strength: 5 }] },
    { id: "b", name: "Bruno", type: "character", relations: [] },
    { id: "place", name: "Santiago", type: "location", relations: [] },
  ];
  const network = buildCharacterNetwork(entries, { a: 25, b: 4, place: 100 });
  assert.equal(network.nodes.length, 2);
  assert.ok(network.nodes.find((node) => node.id === "a").radius > network.nodes.find((node) => node.id === "b").radius);
  assert.deepEqual(network.edges[0], { id: "a::b", sourceId: "a", targetId: "b", type: "alliance", strength: 5 });
});

test("interpreta relaciones antiguas y evita duplicar conectores recíprocos", () => {
  const entries = [
    { id: "a", name: "Ana", type: "character", relations: ["b"] },
    { id: "b", name: "Bruno", type: "character", relations: [{ targetId: "a", type: "conflict", strength: 4 }] },
  ];
  const network = buildCharacterNetwork(entries, {});
  assert.equal(network.edges.length, 1);
  assert.equal(network.edges[0].type, "conflict");
  assert.equal(network.edges[0].strength, 4);
  assert.deepEqual(normalizeRelationship("b"), { targetId: "b", type: "other", strength: 3 });
  assert.equal(relationshipStyle("conflict").label, "Conflicto");
});

test("muestra solo el nombre en el nodo y conserva el nombre completo", () => {
  const network = buildCharacterNetwork([{ id: "r", name: "Rainiero Cardona y De la Fuente", type: "character", relations: [] }], { r: 2 });
  assert.equal(network.nodes[0].name, "Rainiero");
  assert.equal(network.nodes[0].fullName, "Rainiero Cardona y De la Fuente");
  assert.deepEqual(characterNameParts({ name: "Rainiero Cardona y De la Fuente" }), { firstName: "Rainiero", lastName: "Cardona y De la Fuente" });
  assert.deepEqual(characterNameParts({ name: "Don Alonso", firstName: "Don Alonso", lastName: "" }), { firstName: "Don Alonso", lastName: "" });
});

test("crea la relacion inversa sin sobrescribirla y permite editar cada direccion", () => {
  const entries = [
    { id: "a", name: "Ana", relations: [] },
    { id: "b", name: "Bruno", relations: [] },
  ];
  const created = planRelationshipUpdates(entries, { sourceId: "a", targetId: "b", type: "friendship", strength: 4 });
  assert.deepEqual(created.source.relations, [{ targetId: "b", type: "friendship", strength: 4 }]);
  assert.deepEqual(created.reverse.relations, [{ targetId: "a", type: "friendship", strength: 4 }]);
  const mirrored = [created.source, created.reverse];
  const edited = planRelationshipUpdates(mirrored, { sourceId: "a", targetId: "b", type: "conflict", strength: 2 });
  assert.equal(edited.reverse, null);
  assert.deepEqual(edited.source.relations, [{ targetId: "b", type: "conflict", strength: 2 }]);
  assert.deepEqual(mirrored[1].relations, [{ targetId: "a", type: "friendship", strength: 4 }]);
});
