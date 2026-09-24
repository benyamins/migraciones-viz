import ui from '@nuxt/ui/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset URLs: the same build works at a domain's root and under /migraciones-viz/
  // on github.io. Safe because this is a single page without client-side routes.
  base: './',
  plugins: [
    vue(),
    ui({
      // single page: links render as plain <a>, no vue-router needed
      router: false,
      ui: {
        // `gob` is defined in src/assets/css/main.css from the gob.cl tokens
        colors: { primary: 'gob', neutral: 'slate' },
      },
      // Size (CSS 27 KB -> 12 KB gzipped): generate theme styles only for the color aliases
      // the app uses (neutral is always there) and only for the components it uses
      theme: { colors: ['primary', 'error'] },
      experimental: { componentDetection: true },
      // Icons come from our own subset (src/assets/icons.json, registered in src/main.ts);
      // without this, Nuxt UI would also bundle its 43 default icons
      icon: { clientBundle: false },
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
