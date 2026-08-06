import test from "node:test";
import assert from "node:assert/strict";
import { buildCharacterNetwork, normalizeRelationship, relationshipStyle } from "../src/novel-studio/characterNetwork.js";

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
