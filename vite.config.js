import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { resolveUf } from "./api/indicadores/uf.js";
import { resolveOpportunityIndicators } from "./api/indicadores/oportunidades.js";
import { generateSceneSuggestion, SceneAssistantError } from "./api/novel-studio/scene-assistant.js";

async function readJsonBody(request, limit = 75000) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > limit) throw new SceneAssistantError("La escena supera el tamaño permitido.", 413, "PAYLOAD_TOO_LARGE");
  }
  try { return body ? JSON.parse(body) : {}; }
  catch { throw new SceneAssistantError("Solicitud JSON no válida.", 400, "INVALID_JSON"); }
}

function novelAssistantLocalEndpoint() {
  const install = (server) => {
    server.middlewares.use("/api/novel-studio/scene-assistant", async (request, response) => {
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.setHeader("Cache-Control", "no-store");
      if (request.method !== "POST") {
        response.statusCode = 405; response.setHeader("Allow", "POST");
        response.end(JSON.stringify({ error: "Método no permitido", code: "METHOD_NOT_ALLOWED" })); return;
      }
      try {
        const body = await readJsonBody(request);
        const result = await generateSceneSuggestion(body);
        response.statusCode = 200; response.end(JSON.stringify(result));
      } catch (error) {
        response.statusCode = error instanceof SceneAssistantError ? error.status : 500;
        response.end(JSON.stringify({ error: error instanceof SceneAssistantError ? error.message : "No se pudo generar la sugerencia.", code: error.code || "SCENE_ASSISTANT_ERROR" }));
      }
    });
  };
  return { name: "novel-assistant-local-endpoint", configureServer: install, configurePreviewServer: install };
}

function ufLocalEndpoint(apiKey) {
  const install = (server) => {
    server.middlewares.use("/api/indicadores/uf", async (request, response) => {
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.setHeader("Cache-Control", "no-store");
      if (request.method !== "GET") {
        response.statusCode = 405;
        response.setHeader("Allow", "GET");
        response.end(JSON.stringify({ error: "Método no permitido" }));
        return;
      }
      try {
        response.statusCode = 200;
        response.end(JSON.stringify(await resolveUf({ apiKey })));
      } catch {
        response.statusCode = 200;
        response.end(JSON.stringify({ valueClp: null, effectiveDate: null, retrievedAt: new Date().toISOString(), sourceCategory: "unavailable", status: "unavailable", stale: true }));
      }
    });
  };
  return {
    name: "uf-local-endpoint",
    configureServer: install,
    configurePreviewServer: install,
  };
}

function opportunityLocalEndpoint(user, password) {
  const install = (server) => {
    server.middlewares.use("/api/indicadores/oportunidades", async (request, response) => {
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.setHeader("Cache-Control", "no-store");
      if (request.method !== "GET") {
        response.statusCode = 405;
        response.setHeader("Allow", "GET");
        response.end(JSON.stringify({ error: "Método no permitido" }));
        return;
      }
      try {
        response.statusCode = 200;
        response.end(JSON.stringify(await resolveOpportunityIndicators({ user, password })));
      } catch {
        response.statusCode = 200;
        response.end(JSON.stringify({ retrievedAt: new Date().toISOString(), status: "unavailable", inflation: null, mortgageRate: null, alternatives: [] }));
      }
    });
  };
  return { name: "opportunity-local-endpoint", configureServer: install, configurePreviewServer: install };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: env.GITHUB_PAGES === "true" ? "/mi-pagina-web/" : "/",
    plugins: [react(), ufLocalEndpoint(env.CMF_API_KEY), opportunityLocalEndpoint(env.BCCH_API_USER, env.BCCH_API_PASSWORD), novelAssistantLocalEndpoint()],
    build: {
      rollupOptions: {
        input: {
          main: resolve(process.cwd(), "index.html"),
          about: resolve(process.cwd(), "about.html"),
          services: resolve(process.cwd(), "services.html"),
          experience: resolve(process.cwd(), "experience.html"),
          projects: resolve(process.cwd(), "projects.html"),
          testimonials: resolve(process.cwd(), "testimonials.html"),
          contact: resolve(process.cwd(), "contact.html"),
        },
      },
    },
  };
});
