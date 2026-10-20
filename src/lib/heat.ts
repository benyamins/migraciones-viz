/*
  Color classes for passengers per hour on the index's heatmap: six classes of 250, the same
  for both processes and every month, so a color always means the same number. Fixed here on
  purpose, not read from the Excel: if the data ever grows a lot, the top class takes the extra.
  The colors are the .heat-N classes in src/assets/css/main.css.
*/

export const HEAT_STEP = 250
export const HEAT_CLASSES = 6

const integer = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 })

/** Class of an hour's passengers: 0 (0–249) to 5 (1.250 o más). */
export function heatClass(pax: number): number {
	return Math.min(Math.floor(pax / HEAT_STEP), HEAT_CLASSES - 1)
}

/** Legend text of each class: '0–249' … '1.250 o más' */
export const HEAT_LABELS = Array.from({ length: HEAT_CLASSES }, (_, i) => {
	const min = i * HEAT_STEP
	return i < HEAT_CLASSES - 1 ? `${integer.format(min)}–${integer.format(min + HEAT_STEP - 1)}` : `${integer.format(min)} o más`
})
