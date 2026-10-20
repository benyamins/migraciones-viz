import '@fontsource-variable/public-sans'
import './assets/css/main.css'

import { addCollection } from '@iconify/vue'
import ui from '@nuxt/ui/vue-plugin'
import { createApp, type Component } from 'vue'
import icons from './assets/icons.json'

// Register the icons locally so Iconify never fetches them from its public API (see scripts/icons.mjs).
addCollection(icons)

/** Shared start-up of every page: each page's entry file in src/pages/ calls it with its component. */
export function mountPage(page: Component) {
	createApp(page).use(ui).mount('#app')
}
