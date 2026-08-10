export const MUSIC_JOB_STATES = Object.freeze([
  "created", "queued", "validating", "preparing_engine", "downloading_model",
  "converting", "separating", "detecting_chords", "detecting_stem_chords",
  "exporting", "completed", "cancelling", "cancelled", "failed",
]);

export const TERMINAL_JOB_STATES = new Set(["completed", "cancelled", "failed"]);

export function isTerminalJob(job) {
  return Boolean(job && TERMINAL_JOB_STATES.has(job.state));
}

export function normalizePercentage(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
}
