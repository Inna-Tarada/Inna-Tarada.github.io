import { defineConfig } from 'vite'

export default defineConfig({
  base: '/https://inna-tarada.github.io//',
  build: {
    outDir: 'docs',
    emptyOutDir: true
  },
  publicDir: 'public'
})