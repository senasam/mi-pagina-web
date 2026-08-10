// Fachada temporal para imports antiguos. Las pantallas nuevas usan AgentProvider.
import { defaultAgentClient } from "../platform/local-agent/client.js";
import { createMusicClient } from "../platform/local-agent/capabilities/music.js";

const music = createMusicClient(defaultAgentClient);

export const selectMusicSource = () => music.selectSource();
export const selectMusicDestination = () => music.selectDestination();
export const createMusicJob = (_token, payload) => music.createJob(payload);
export const getMusicJob = (_token, id) => music.getJob(id);
export const streamMusicEvents = ({ jobId, lastEventId, signal, onEvent }) => (
  music.streamJobEvents({ jobId, lastEventId, signal, onEvent })
);
export const fetchArtifact = (_token, jobId, artifactId) => (
  music.fetchArtifact(jobId, artifactId)
);
export const downloadArtifact = (_token, jobId, artifact) => (
  music.downloadArtifact(jobId, artifact)
);
export const absoluteMediaUrl = (relativeUrl) => music.mediaUrl(relativeUrl);
