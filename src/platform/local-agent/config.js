const environment = import.meta.env || {};

export const LOCAL_AGENT_URL = (
  environment.VITE_LOCAL_AGENT_URL
  || environment.VITE_INSTAGRAM_AGENT_URL
  || "http://127.0.0.1:8765"
).replace(/\/$/, "");
