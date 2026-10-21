import { basename } from 'node:path'
import ui from '@nuxt/ui/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, type Plugin } from 'vite'
import { APP_NAME, PAGES } from './src/site.ts'

const pages = Object.values(PAGES)

/** Adds each page's tab title and description, from src/site.ts, to its HTML file. */
function pageMeta(): Plugin {
  return {
    name: 'page-meta',
    transformIndexHtml(_html, { filename }) {
      const page = pages.find(p => p.file === basename(filename))
      if (!page) throw new Error(`${basename(filename)} is not in PAGES (src/site.ts)`)
      return [
        { tag: 'title', children: `${page.title} · ${APP_NAME}`, injectTo: 'head' },
        { tag: 'meta', attrs: { name: 'description', content: page.description }, injectTo: 'head' },
      ]
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Relative asset URLs: the same build works at a domain's root and under /migraciones-viz/
  // on github.io. Safe because every page sits in the root folder, without client-side routes.
  base: './',
  // One HTML file per page (a multi-page app). GitHub Pages serves pdi.html at /pdi.
  input: pages.map(page => page.file),
  // No fallback to index.html: an unknown URL is a 404 in dev too, as on GitHub Pages
  appType: 'mpa',
  plugins: [
    vue(),
    pageMeta(),
    ui({
      // no client-side routes: links render as plain <a>, no vue-router needed
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
