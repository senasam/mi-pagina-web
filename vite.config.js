import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/mi-pagina-web/',   // 👈 IMPORTANTE: usa el nombre exacto de tu repo
})
