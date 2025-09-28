import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  base: '/mi-pagina-web/',
  plugins: [
    viteStaticCopy({
      targets: [
        { src: '*.html', dest: '' } // 👈 copia todos los .html a dist/
      ]
    })
  ]
})
