// Writes src/assets/icons.json with only the Lucide icons the app uses.
// Nuxt UI renders icon names with Iconify, which downloads any icon it doesn't
// have from a public API at runtime. Registering this subset keeps every icon local.
// Run `pnpm icons` after adding an icon name here.
import { writeFileSync } from 'node:fs'
import { icons as lucide } from '@iconify-json/lucide'
import { getIcons } from '@iconify/utils'

const names = [
  // used by our components
  'arrow-right',
  'calendar',
  'chart-line',
  'circle-alert',
  'grid-3x3',
  'table',
  // used internally by Nuxt UI (appConfig.ui.icons)
  'check',
  'chevron-down',
  'chevron-left',
  'chevron-right',
  'chevrons-left',
  'chevrons-right',
  'loader-circle',
  'moon',
  'sun',
  'x',
]

const subset = getIcons(lucide, names)
const missing = names.filter(name => !subset?.icons[name])
if (!subset || missing.length) throw new Error(`Unknown Lucide icons: ${missing.join(', ')}`)

writeFileSync(new URL('../src/assets/icons.json', import.meta.url), JSON.stringify(subset))
console.log(`src/assets/icons.json: ${names.length} icons`)
