const environment = import.meta.env || {};

export const LOCAL_TOOLS_INSTALLER_URL = environment.VITE_LOCAL_TOOLS_INSTALLER_URL
  || "https://github.com/senasam/mi-pagina-web/releases/latest/download/FelipeLocalTools-Setup.exe";

export function createMusicClient(agent) {
  const fetchArtifact = (jobId, artifactId) => agent.requestRaw(
    `/v1/music/jobs/${jobId}/artifacts/${artifactId}/download`,
  );
  return Object.freeze({
    selectSource: () => agent.request("/v1/music/sources/select", {
      method: "POST", timeout: 120000,
    }),
    selectDestination: () => agent.request("/v1/music/destinations/select", {
      method: "POST", timeout: 120000,
    }),
    createJob: (payload) => {
      // Prefer the Task API when available; fallback to legacy music jobs
      if (typeof agent.runTask === "function") {
        return agent.runTask("music-analyzer", "analyze", payload).catch((error) => {
          if (error?.status === 404 || error?.code === "AGENT_HTTP_404") {
            return agent.request("/v1/music/jobs", { method: "POST", body: JSON.stringify(payload) });
          }
          throw error;
        });
      }
      return agent.request("/v1/music/jobs", { method: "POST", body: JSON.stringify(payload) });
    },
    getJob: (jobId) => (typeof agent.getTask === "function" ? agent.getTask(jobId) : agent.request(`/v1/music/jobs/${jobId}`)),
    cancelJob: (jobId) => (typeof agent.cancelTask === "function" ? agent.cancelTask(jobId) : agent.request(`/v1/music/jobs/${jobId}/cancel`, { method: "POST" })),
    streamJobEvents: ({ jobId, lastEventId = 0, signal, onEvent }) => {
      if (typeof agent.streamTaskEvents === "function") {
        return agent.streamTaskEvents({ taskId: jobId, lastEventId, signal, onEvent })
          .catch(() => agent.stream({ path: `/v1/music/jobs/${jobId}/events?last_event_id=${encodeURIComponent(lastEventId)}`, signal, onEvent }));
      }
      return agent.stream({ path: `/v1/music/jobs/${jobId}/events?last_event_id=${encodeURIComponent(lastEventId)}`, signal, onEvent });
    },
    getEngine: async () => {
      const software = await agent.request("/v1/software/audio-engine-pack");
      return {
        ...software,
        available: software.state === "installed",
        version: software.availableVersion,
        installable: software.installable,
        downloadBytes: null,
      };
    },
    startEngineInstall: () => agent.request("/v1/software/audio-engine-pack/actions/install", { method: "POST" }).then((payload) => payload.install),
    getEngineInstall: (id) => agent.request(`/v1/software/installs/${encodeURIComponent(id)}`),
    streamEngineInstallEvents: ({ installId, lastEventId = 0, signal, onEvent }) => agent.stream({
      path: `/v1/software/installs/${encodeURIComponent(installId)}/events?last_event_id=${encodeURIComponent(lastEventId)}`,
      signal,
      onEvent,
    }),
    cancelEngineInstall: (id) => agent.request(`/v1/software/installs/${encodeURIComponent(id)}/cancel`, { method: "POST" }).then((payload) => payload.install),
    listModels: () => agent.request("/v1/models"),
    pullModel: (modelId) => agent.request("/v1/models/pulls", {
      method: "POST", body: JSON.stringify({ engine: "demucs", modelId }),
    }),
    getModelPull: (id) => agent.request(`/v1/models/pulls/${id}`),
    cancelModelPull: (id) => agent.request(`/v1/models/pulls/${id}/cancel`, { method: "POST" }),
    deleteModel: (modelId) => agent.request(`/v1/models/demucs/${modelId}`, { method: "DELETE" }),
    createMediaSession: (jobId, artifactId) => agent.request(
      `/v1/music/jobs/${jobId}/artifacts/${artifactId}/media-session`,
      { method: "POST" },
    ),
    mediaUrl: (relativeUrl) => `${agent.baseUrl}${relativeUrl}`,
    fetchArtifact,
    async downloadArtifact(jobId, artifact) {
      const response = await fetchArtifact(jobId, artifact.id);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = artifact.label || "resultado";
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    openOutput: (jobId) => agent.request(`/v1/music/jobs/${jobId}/open-output`, { method: "POST" }),
  });
}
