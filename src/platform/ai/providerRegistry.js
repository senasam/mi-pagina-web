import { AI_PROVIDERS } from "./contracts.js";
import { hasSessionCredential } from "./credentialClient.js";

export const AI_PROVIDER_REGISTRY = Object.freeze({
  [AI_PROVIDERS.OPENAI]: Object.freeze({ id: AI_PROVIDERS.OPENAI, label: "OpenAI API", requiresCredential: true, execution: "api" }),
  [AI_PROVIDERS.OLLAMA]: Object.freeze({ id: AI_PROVIDERS.OLLAMA, label: "Ollama local", requiresCredential: false, execution: "device" }),
  [AI_PROVIDERS.CHATGPT_MANUAL]: Object.freeze({ id: AI_PROVIDERS.CHATGPT_MANUAL, label: "ChatGPT manual", requiresCredential: false, execution: "manual" }),
});

export function providerDefinition(provider) {
  return AI_PROVIDER_REGISTRY[provider] || null;
}

export function isProviderConfigured({ toolId, settings } = {}) {
  if (!settings?.enabled) return false;
  if (settings.provider === AI_PROVIDERS.CHATGPT_MANUAL) return true;
  if (settings.provider === AI_PROVIDERS.OLLAMA) return Boolean(settings.ollamaModel);
  if (settings.provider === AI_PROVIDERS.OPENAI) {
    return hasSessionCredential({ toolId, provider: settings.provider, credentialRef: settings.credentialRef });
  }
  return false;
}
