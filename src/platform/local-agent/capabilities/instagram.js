const environment = import.meta.env || {};

export const INSTAGRAM_INSTALLER_URL = environment.VITE_INSTAGRAM_AGENT_INSTALLER_URL
  || environment.VITE_LOCAL_TOOLS_INSTALLER_URL
  || "https://github.com/senasam/mi-pagina-web/releases/latest/download/FelipeLocalTools-Setup.exe";

export function createInstagramClient(agent) {
  return Object.freeze({
    selectDestination: () => agent.request("/destinations/select", {
      method: "POST", timeout: 120000,
    }),
    storeOpenAiCredential: (openaiApiKey) => agent.request("/credentials/openai", {
      method: "POST", body: JSON.stringify({ openaiApiKey }),
    }),
    exportAccount: async (input) => {
      // Prefer the new Task API when agent supports it; fallback to legacy /exports for older agents
      if (typeof agent.runTask === "function") {
        try {
          return await agent.runTask("instagram-exporter", "export-account", input);
        } catch (error) {
          if (error?.status === 404 || error?.code === "AGENT_HTTP_404") {
            return agent.request("/exports", { method: "POST", body: JSON.stringify(input) });
          }
          throw error;
        }
      }
      return agent.request("/exports", { method: "POST", body: JSON.stringify(input) });
    },
    getExport: (jobId) => (typeof agent.getTask === "function" ? agent.getTask(jobId) : agent.request(`/exports/${jobId}`)),
    signalExport: (jobId, action, body) => {
      // Prefer signaling task signals if available
      if (typeof agent.request === "function") {
        return agent.request(`/v1/tasks/${encodeURIComponent(jobId)}/signals/${encodeURIComponent(action)}`, {
          method: "POST",
          body: body ? JSON.stringify(body) : undefined,
        }).catch(() => agent.request(`/exports/${jobId}/${action}`, {
          method: "POST", body: body ? JSON.stringify(body) : undefined,
        }));
      }
      return agent.request(`/exports/${jobId}/${action}`, { method: "POST", body: body ? JSON.stringify(body) : undefined });
    },
    streamExportEvents: ({ jobId, lastEventId = 0, signal, onEvent }) => {
      // Prefer task-scoped events
      if (typeof agent.streamTaskEvents === "function") {
        return agent.streamTaskEvents({ taskId: jobId, lastEventId, signal, onEvent })
          .catch(() => agent.stream({ path: `/exports/${jobId}/events?last_event_id=${encodeURIComponent(lastEventId)}`, signal, onEvent }));
      }
      return agent.stream({ path: `/exports/${jobId}/events?last_event_id=${encodeURIComponent(lastEventId)}`, signal, onEvent });
    },
  });
}
