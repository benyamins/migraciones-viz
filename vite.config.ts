import ui from '@nuxt/ui/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    ui({
      // single page: links render as plain <a>, no vue-router needed
      router: false,
      ui: {
        // `gob` is defined in src/assets/css/main.css from the gob.cl tokens
        colors: { primary: 'gob', neutral: 'slate' },
      },
    }),
  ],
  build: {
    // Vue + Nuxt UI (~185 KB gzipped) and ECharts (~170 KB gzipped, own chunk) are each
    // 500-630 KB minified, which is expected; warn only if a chunk grows beyond that.
    chunkSizeWarningLimit: 700,
  },
  server: {
    host: '127.0.0.1',
    port: 5173
  }
})
