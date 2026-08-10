import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { defaultAgentClient } from "./client.js";

const AgentContext = createContext(defaultAgentClient);

export function AgentProvider({ client = defaultAgentClient, children }) {
  return <AgentContext.Provider value={client}>{children}</AgentContext.Provider>;
}

export function useAgentClient() {
  return useContext(AgentContext);
}

export function useAgent() {
  const client = useAgentClient();
  const connect = useCallback((options) => client.connect(options), [client]);
  const state = useSyncExternalStore(
    client.subscribe,
    client.getSnapshot,
    client.getSnapshot,
  );
  return useMemo(() => ({
    ...state,
    client,
    connect,
  }), [client, connect, state]);
}
