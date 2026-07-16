import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/mi-pagina-web/" : "/",
  plugins: [react()],
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
});
