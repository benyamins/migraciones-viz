/*
  The app's name and its pages. The header links, each page's title area, the tab titles
  (added to the HTML files by vite.config.ts) and the index's cards all read from here, so
  each name lives in one place. Plain data without browser APIs: vite.config.ts imports it too.
*/

/** Shown in the header of every page and at the end of each tab title. */
export const APP_NAME = 'Capacidad Nuevo Pudahuel'

export interface Page {
	/** The page's HTML file, in the project root. */
	file: string
	/**
	 * Relative link, so the site works at a domain's root and under /migraciones-viz/.
	 * GitHub Pages serves casetas.html at `casetas`. Never end a link with '/': GitHub Pages
	 * would look for casetas/index.html and answer 404.
	 */
	href: string
	/** Link text in the header. */
	label: string
	/** The page's h1, and the start of its tab title. */
	title: string
	/** One sentence under the h1, also the page's meta description. */
	description: string
}

// The header lists the links in this order: most used first (USWDS: "Present links in priority order").
export const PAGES = {
	pasajeros: {
		file: 'index.html',
		href: './',
		label: 'Pasajeros',
		title: 'Flujo de pasajeros',
		description: 'Pasajeros proyectados por hora en el control migratorio.',
	},
	casetas: {
		file: 'casetas.html',
		href: './casetas',
		label: 'Casetas',
		title: 'Capacidad de casetas',
		description: 'Casetas proyectadas (NPU/PDI) y capacidad propuesta, en intervalos de 10 minutos.',
	},
	aduanasSag: {
		file: 'aduanas-sag.html',
		href: './aduanas-sag',
		label: 'Aduanas y SAG',
		title: 'Capacidad Aduanas y SAG',
		description: 'Canales SC y K9 según los pasajeros que llegan cada hora, en intervalos de 10 minutos.',
	},
} as const satisfies Record<string, Page>

export type PageId = keyof typeof PAGES
