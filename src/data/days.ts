import type { PaxRow } from './types'

/*
  dt_segmento is local wall-clock time without a zone. We read it *as if* it were UTC and
  always format in UTC, so neither the viewer's time zone nor Chile's daylight-saving
  changes (e.g. 2026-09-06 has no 00:00-00:59 in America/Santiago) can shift or drop a slot.
*/

/** 'YYYY-MM-DDTHH:MM:SS' → epoch ms, reading the wall-clock time as UTC. */
export function wallClockToMs(value: string): number {
	return Date.parse(`${value}Z`)
}

/** epoch ms (from wallClockToMs) → 'HH:MM' */
export function formatTime(ms: number): string {
	return new Date(ms).toISOString().slice(11, 16)
}

const longDate = new Intl.DateTimeFormat('es-CL', {
	weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
})
const shortDate = new Intl.DateTimeFormat('es-CL', {
	weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
})

/** 'YYYY-MM-DD' → 'Domingo, 1 de febrero de 2026' */
export function formatLongDate(day: string): string {
	const text = longDate.format(wallClockToMs(`${day}T00:00:00`))
	return text.charAt(0).toUpperCase() + text.slice(1)
}

/** 'YYYY-MM-DD' → 'dom, 1 feb 2026' */
export function formatShortDate(day: string): string {
	return shortDate.format(wallClockToMs(`${day}T00:00:00`))
}

/** Rows grouped by day ('YYYY-MM-DD'), keeping the rows' order inside each day. */
export function groupByDay(rows: PaxRow[]): Map<string, PaxRow[]> {
	const days = new Map<string, PaxRow[]>()
	for (const row of rows) {
		const day = row.dt_segmento.slice(0, 10)
		const list = days.get(day)
		if (list) list.push(row)
		else days.set(day, [row])
	}
	return days
}
