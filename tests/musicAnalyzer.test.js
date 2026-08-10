import test from "node:test";
import assert from "node:assert/strict";

import { buildMusicJobRequest, applyMusicEvent, DEFAULT_MUSIC_OPTIONS } from "../src/music-analyzer/model.js";
import { formatBytes, formatDuration, stateLabel } from "../src/music-analyzer/formatters.js";

test("music analyzer builds the strict API payload", () => {
  const payload = buildMusicJobRequest(
    { sourceId: "source-token" },
    { destinationId: "destination-token" },
    { ...DEFAULT_MUSIC_OPTIONS, model: "htdemucs_6s" },
  );
  assert.equal(payload.sourceId, "source-token");
  assert.equal(payload.destinationId, "destination-token");
  assert.equal(payload.separation.model, "htdemucs_6s");
  assert.equal(payload.tasks.detectChords, true);
  assert.throws(() => buildMusicJobRequest(null, null, DEFAULT_MUSIC_OPTIONS), /Selecciona/);
  assert.throws(() => buildMusicJobRequest(
    { sourceId: "x" }, null,
    { ...DEFAULT_MUSIC_OPTIONS, separateStems: false, detectChords: false, detectStemChords: false },
  ), /Activa/);
});

test("music analyzer applies events and formats metadata", () => {
  const current = { id: "job-1", state: "queued" };
  assert.equal(applyMusicEvent(current, { data: { job: { id: "job-1", state: "completed" } } }).state, "completed");
  assert.equal(applyMusicEvent(current, { data: { jobId: "job-1", percentage: 40 } }).percentage, 40);
  assert.equal(formatBytes(1024), "1.00 KB");
  assert.equal(formatDuration(65), "1:05");
  assert.equal(stateLabel("separating"), "Separando pistas");
});
