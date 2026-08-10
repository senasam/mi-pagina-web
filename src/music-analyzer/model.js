export const DEFAULT_MUSIC_OPTIONS = Object.freeze({
  separateStems: true,
  detectChords: true,
  detectStemChords: false,
  createZip: true,
  convertToWav: true,
  model: "htdemucs",
  device: "auto",
});

export function buildMusicJobRequest(source, destination, options = DEFAULT_MUSIC_OPTIONS) {
  if (!source?.sourceId) throw new Error("Selecciona un audio antes de comenzar.");
  if (!options.separateStems && !options.detectChords && !options.detectStemChords) {
    throw new Error("Activa al menos una tarea de analisis.");
  }
  if (options.detectStemChords && !options.separateStems) {
    throw new Error("Los acordes por pista requieren separar las pistas.");
  }
  return {
    sourceId: source.sourceId,
    destinationId: destination?.destinationId || null,
    tasks: {
      separateStems: options.separateStems,
      detectChords: options.detectChords,
      detectStemChords: options.detectStemChords,
      createZip: options.createZip,
    },
    separation: { provider: "local-demucs", model: options.model, device: options.device },
    audio: { convertToWav: options.convertToWav },
  };
}

export function applyMusicEvent(current, event) {
  if (event?.data?.job) return event.data.job;
  if (event?.data?.jobId && current?.id === event.data.jobId) {
    return { ...current, ...event.data };
  }
  return current;
}
