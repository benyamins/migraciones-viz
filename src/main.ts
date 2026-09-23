import '@fontsource-variable/public-sans'
import './assets/css/main.css'

import { addCollection } from '@iconify/vue'
import ui from '@nuxt/ui/vue-plugin'
import { createApp } from 'vue'
import App from './App.vue'
import icons from './assets/icons.json'

// Register the icons locally so Iconify never fetches them from its public API (see scripts/icons.mjs).
addCollection(icons)

createApp(App).use(ui).mount('#app')
