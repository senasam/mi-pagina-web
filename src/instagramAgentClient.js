// Fachada temporal para imports antiguos. Las pantallas nuevas usan AgentProvider.
import {
  LOCAL_AGENT_URL,
  agentFetch,
  checkAgentHealth,
  defaultAgentClient,
  pairWithAgent,
} from "./platform/local-agent/client.js";
import {
  createInstagramClient,
  INSTAGRAM_INSTALLER_URL,
} from "./platform/local-agent/capabilities/instagram.js";

const instagram = createInstagramClient(defaultAgentClient);

export const INSTAGRAM_AGENT_URL = LOCAL_AGENT_URL;
export { agentFetch, checkAgentHealth, INSTAGRAM_INSTALLER_URL, pairWithAgent };

export function streamExportEvents({ jobId, lastEventId = 0, signal, onEvent }) {
  return instagram.streamExportEvents({ jobId, lastEventId, signal, onEvent });
}
