export const CHARACTER_DOSSIER_GROUPS = Object.freeze([
  {
    title: "Historia y cronología",
    sections: [
      "Ficha maestra y cronología general",
      "Origen familiar e infancia",
      "Formación escolar",
      "Estudios en el extranjero y regreso",
      "Viajes y desplazamientos",
      "Correspondencia y documentos",
    ],
  },
  {
    title: "Cuerpo, personalidad y voz",
    sections: [
      "Retrato físico y presencia corporal",
      "Personalidad y evolución psicológica",
      "Guía de voz y diálogo",
      "Conductas visibles para cada emoción",
      "Vida cotidiana, gustos y aversiones",
      "Habilidades, destrezas, armas y poderes",
    ],
  },
  {
    title: "Trayectoria, salud y creencias",
    sections: [
      "Perfil profesional o militar",
      "Trayectoria profesional o militar",
      "Heridas, crisis y convalecencias",
      "Expediente médico y secuelas",
      "Creencias, valores y orientación religiosa",
    ],
  },
  {
    title: "Relaciones y secretos",
    sections: [
      "Matriz de relaciones y secretos",
      "Personas vinculadas",
    ],
  },
]);

const KNOWN_SECTIONS = CHARACTER_DOSSIER_GROUPS.flatMap((group) => group.sections);

function normalized(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase()
    .replace(/^\s*\d+[.)-]?\s*/, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function canonicalSection(title) {
  const clean = normalized(title);
  if (/^indice general$/.test(clean)) return null;
  const rules = [
    [/ficha maestra|cronologia general/, "Ficha maestra y cronología general"],
    [/origen familiar|infancia/, "Origen familiar e infancia"],
    [/formacion escolar|escolar.*santiago/, "Formación escolar"],
    [/regreso.*orientacion religiosa/, "Creencias, valores y orientación religiosa"],
    [/estudios.*europa|estudios.*extranjero/, "Estudios en el extranjero y regreso"],
    [/viaje|desplazamiento|itinerario/, "Viajes y desplazamientos"],
    [/correspondencia/, "Correspondencia y documentos"],
    [/retrato fisico|presencia corporal|apariencia/, "Retrato físico y presencia corporal"],
    [/personalidad|evolucion psicologica/, "Personalidad y evolución psicológica"],
    [/voz|dialogo/, "Guía de voz y diálogo"],
    [/conductas?.*emocion|emociones?/, "Conductas visibles para cada emoción"],
    [/vida cotidiana|gustos|aversiones/, "Vida cotidiana, gustos y aversiones"],
    [/habilidades|destrezas|armas|poderes/, "Habilidades, destrezas, armas y poderes"],
    [/perfil militar|perfil profesional/, "Perfil profesional o militar"],
    [/trayectoria militar|trayectoria profesional/, "Trayectoria profesional o militar"],
    [/herida|evacuacion|convalecencia|crisis/, "Heridas, crisis y convalecencias"],
    [/expediente medico|secuelas|salud/, "Expediente médico y secuelas"],
    [/religiosa|religion|creencias|valores/, "Creencias, valores y orientación religiosa"],
    [/relaciones.*secretos|matriz de relaciones/, "Matriz de relaciones y secretos"],
    [/personas vinculadas|registro de personas/, "Personas vinculadas"],
  ];
  return rules.find(([pattern]) => pattern.test(clean))?.[1] || title.replace(/^\s*\d+[.)-]?\s*/, "").trim();
}

export function parseCharacterDossier(markdown, fallbackTitle = "Documentación importada") {
  const sections = {};
  let current = fallbackTitle;
  let ignoringIndex = false;
  const append = (title, line) => {
    if (!title) return;
    sections[title] = `${sections[title] || ""}${sections[title] ? "\n" : ""}${line}`;
  };

  for (const rawLine of String(markdown || "").split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    const markdownHeading = /^#{1,6}\s+(.+)$/.exec(trimmed);
    const boldHeading = /^\*\*(.{3,120})\*\*$/.exec(trimmed);
    const numberedHeading = /^(\d+)[.)]\s+(.{3,120})$/.exec(trimmed);
    if (markdownHeading || boldHeading || numberedHeading) {
      const heading = (markdownHeading?.[1] || boldHeading?.[1] || numberedHeading?.[2] || "").replace(/[*_]/g, "").trim();
      current = canonicalSection(heading);
      ignoringIndex = current === null;
      continue;
    }
    if (ignoringIndex) continue;
    if (!trimmed) {
      if (current && sections[current] && !sections[current].endsWith("\n")) sections[current] += "\n";
      continue;
    }
    append(current, rawLine.trimEnd());
  }

  const cleanSections = Object.fromEntries(Object.entries(sections).map(([title, content]) => [title, content.trim()]).filter(([, content]) => content));
  if (!Object.keys(cleanSections).length && String(markdown || "").trim()) cleanSections[fallbackTitle] = String(markdown).trim();
  return cleanSections;
}

export function mergeDossierDetails(current = {}, imported = {}) {
  const merged = { ...current };
  for (const [title, content] of Object.entries(imported)) {
    if (!content.trim()) continue;
    merged[title] = merged[title]?.trim() && merged[title].trim() !== content.trim()
      ? `${merged[title].trim()}\n\n${content.trim()}`
      : content.trim();
  }
  return merged;
}

export function customDossierSections(details = {}) {
  return Object.keys(details).filter((title) => !KNOWN_SECTIONS.includes(title));
}
