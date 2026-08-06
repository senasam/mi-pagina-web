export const RELATIONSHIP_TYPES = Object.freeze([
  { value: "family", label: "Familia", color: "#8f3d56", dash: "" },
  { value: "friendship", label: "Amistad", color: "#3f7b63", dash: "" },
  { value: "romance", label: "Romance", color: "#bb5278", dash: "" },
  { value: "alliance", label: "Alianza", color: "#3f6f9c", dash: "" },
  { value: "rivalry", label: "Rivalidad", color: "#b56a2a", dash: "9 5" },
  { value: "conflict", label: "Conflicto", color: "#a63f36", dash: "4 4" },
  { value: "mentor", label: "Mentoría", color: "#73558f", dash: "" },
  { value: "professional", label: "Profesional", color: "#526a73", dash: "12 4 2 4" },
  { value: "other", label: "Otro vínculo", color: "#746f67", dash: "6 5" },
]);

export function normalizeRelationship(relation) {
  if (typeof relation === "string") return { targetId: relation, type: "other", strength: 3 };
  const strength = Math.max(1, Math.min(5, Number(relation?.strength) || 3));
  return { targetId: String(relation?.targetId || relation?.id || ""), type: RELATIONSHIP_TYPES.some((item) => item.value === relation?.type) ? relation.type : "other", strength };
}

export function relationshipStyle(type) {
  return RELATIONSHIP_TYPES.find((item) => item.value === type) || RELATIONSHIP_TYPES.at(-1);
}

export function planRelationshipUpdates(entries = [], connection = {}) {
  const source = entries.find((entry) => entry.id === connection.sourceId);
  const target = entries.find((entry) => entry.id === connection.targetId);
  if (!source || !target || source.id === target.id) return null;
  const nextRelation = normalizeRelationship({ targetId: target.id, type: connection.type, strength: connection.strength });
  const sourceRelations = (source.relations || []).map(normalizeRelationship);
  const requestedIndex = Number.isInteger(connection.relationIndex) ? connection.relationIndex : -1;
  const requestedRelation = sourceRelations[requestedIndex];
  const sourceIndex = requestedRelation?.targetId === target.id
    ? requestedIndex
    : sourceRelations.findIndex((relation) => relation.targetId === target.id && relation.type === nextRelation.type);
  const relations = sourceIndex >= 0
    ? sourceRelations.map((relation, index) => index === sourceIndex ? nextRelation : relation)
    : [...sourceRelations, nextRelation];
  const targetRelations = (target.relations || []).map(normalizeRelationship);
  const reverseExists = targetRelations.some((relation) => relation.targetId === source.id);
  const reverse = reverseExists ? null : { ...target, relations: [...targetRelations, { ...nextRelation, targetId: source.id }] };
  return { source: { ...source, relations }, reverse, sourceExisted: sourceIndex >= 0 };
}

export function characterNameParts(entry = {}) {
  const full = String(entry.name || "").trim();
  const words = full.split(/\s+/).filter(Boolean);
  const hasFirstName = Object.prototype.hasOwnProperty.call(entry, "firstName");
  const hasLastName = Object.prototype.hasOwnProperty.call(entry, "lastName");
  return {
    firstName: hasFirstName ? String(entry.firstName || "").trim() : words[0] || "",
    lastName: hasLastName ? String(entry.lastName || "").trim() : words.slice(1).join(" "),
  };
}

export function buildCharacterNetwork(entries = [], mentionTotals = {}) {
  const characters = entries.filter((entry) => entry.type === "character" && !entry.archived);
  const byId = new Map(characters.map((entry) => [entry.id, entry]));
  const maxMentions = Math.max(0, ...characters.map((entry) => Number(mentionTotals[entry.id]) || 0));
  const ordered = [...characters].sort((a, b) => (mentionTotals[b.id] || 0) - (mentionTotals[a.id] || 0) || a.name.localeCompare(b.name, "es"));
  const positions = new Map();
  if (ordered.length === 1) positions.set(ordered[0].id, { x: 450, y: 250 });
  if (ordered.length > 1) {
    positions.set(ordered[0].id, { x: 450, y: 250 });
    const remaining = ordered.slice(1);
    const firstRingCount = remaining.length > 10 ? Math.ceil(remaining.length / 2) : remaining.length;
    remaining.forEach((entry, index) => {
      const ring = index >= firstRingCount ? 2 : 1;
      const ringItems = ring === 1 ? remaining.slice(0, firstRingCount) : remaining.slice(firstRingCount);
      const ringIndex = ring === 1 ? index : index - firstRingCount;
      const angle = -Math.PI / 2 + (Math.PI * 2 * ringIndex) / Math.max(1, ringItems.length);
      const rx = ring === 1 ? 330 : 205;
      const ry = ring === 1 ? 195 : 125;
      positions.set(entry.id, { x: 450 + Math.cos(angle) * rx, y: 250 + Math.sin(angle) * ry });
    });
  }
  const nodes = ordered.map((entry) => {
    const mentions = Number(mentionTotals[entry.id]) || 0;
    const names = characterNameParts(entry);
    return { id: entry.id, name: names.firstName || entry.name, fullName: entry.name, mentions, radius: 25 + (maxMentions ? 23 * Math.sqrt(mentions / maxMentions) : 0), ...(positions.get(entry.id) || { x: 450, y: 250 }) };
  });
  const edges = [];
  for (const entry of characters) {
    for (const rawRelation of entry.relations || []) {
      const relation = normalizeRelationship(rawRelation);
      if (!relation.targetId || relation.targetId === entry.id || !byId.has(relation.targetId)) continue;
      const pair = [entry.id, relation.targetId].sort();
      const reciprocal = edges.find((edge) => edge.sourceId === relation.targetId && edge.targetId === entry.id && edge.type === relation.type && edge.strength === relation.strength && !edge.bidirectional);
      if (reciprocal) reciprocal.bidirectional = true;
      else edges.push({ id: `${entry.id}::${relation.targetId}::${relation.type}::${edges.length}`, pairId: pair.join("::"), sourceId: entry.id, targetId: relation.targetId, type: relation.type, strength: relation.strength, bidirectional: false });
    }
  }
  const edgesByPair = edges.reduce((groups, edge) => groups.set(edge.pairId, [...(groups.get(edge.pairId) || []), edge]), new Map());
  for (const pairEdges of edgesByPair.values()) pairEdges.forEach((edge, index) => { edge.parallelIndex = index; edge.parallelCount = pairEdges.length; });
  return { nodes, edges };
}
