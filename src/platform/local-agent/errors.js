export class AgentRequestError extends Error {
  constructor(message, {
    code = "AGENT_REQUEST_FAILED",
    status = 0,
    details = null,
    requestId = "",
    retryable = false,
    cause,
  } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = "AgentRequestError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.requestId = requestId;
    this.retryable = retryable;
  }
}

export function isAgentUnavailable(error) {
  return error instanceof AgentRequestError
    && ["AGENT_UNAVAILABLE", "AGENT_TIMEOUT"].includes(error.code);
}
