import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { resolveUf } from "./api/indicadores/uf.js";
import { resolveOpportunityIndicators } from "./api/indicadores/oportunidades.js";

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
    plugins: [react(), ufLocalEndpoint(env.CMF_API_KEY), opportunityLocalEndpoint(env.BCCH_API_USER, env.BCCH_API_PASSWORD)],
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
