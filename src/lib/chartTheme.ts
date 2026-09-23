export type ColorMode = 'light' | 'dark'

/**
 * Chart chrome per color mode. ECharts needs real color values (it can't read CSS
 * variables), so these mirror the slate neutrals Nuxt UI uses for the page.
 * Text colors keep at least 4.5:1 contrast against the card background (WCAG AA).
 */
export const CHART_THEME = {
	light: {
		text: '#64748b', // slate-500
		axis: '#cbd5e1', // slate-300
		grid: '#e2e8f0', // slate-200
		hourLine: '#eef2f6',
		pointer: '#94a3b8', // slate-400
		tooltipBg: '#ffffff',
		tooltipBorder: '#e2e8f0',
		tooltipText: '#334155', // slate-700
	},
	dark: {
		text: '#94a3b8', // slate-400
		axis: '#334155', // slate-700
		grid: '#1e293b', // slate-800
		hourLine: '#172033',
		pointer: '#64748b', // slate-500
		tooltipBg: '#1e293b',
		tooltipBorder: '#334155', // slate-700
		tooltipText: '#e2e8f0', // slate-200
	},
} satisfies Record<ColorMode, Record<string, string>>
