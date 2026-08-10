export function formatBytes(value) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let amount = bytes / 1024;
  let unit = units[0];
  for (let index = 1; index < units.length && amount >= 1024; index += 1) {
    amount /= 1024;
    unit = units[index];
  }
  return `${amount.toFixed(amount >= 10 ? 1 : 2)} ${unit}`;
}

export function formatDuration(value) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) return "Duracion no disponible";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export const stateLabel = (state) => ({
  created: "Creado", queued: "En cola", validating: "Validando audio",
  converting: "Convirtiendo", separating: "Separando pistas",
  detecting_chords: "Detectando acordes", detecting_stem_chords: "Analizando pistas",
  exporting: "Preparando resultados", cancelling: "Cancelando",
  cancelled: "Cancelado", completed: "Completado", failed: "Fallido",
}[state] || state || "Preparando");
