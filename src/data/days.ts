import { today } from '@internationalized/date'
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

const weekday = new Intl.DateTimeFormat('es-CL', { weekday: 'short', timeZone: 'UTC' })
const weekdayLong = new Intl.DateTimeFormat('es-CL', { weekday: 'long', timeZone: 'UTC' })
const monthName = new Intl.DateTimeFormat('es-CL', { month: 'long', timeZone: 'UTC' })

/** 'YYYY-MM-DD' → 'sáb', for a row of a month (the heatmap puts the day number at the right) */
export function formatShortWeekday(day: string): string {
	return weekday.format(wallClockToMs(`${day}T00:00:00`))
}

/** 'YYYY-MM-DD' → 'sábado 17', for running text */
export function formatWeekdayAndDay(day: string): string {
	return `${weekdayLong.format(wallClockToMs(`${day}T00:00:00`))} ${Number(day.slice(8, 10))}`
}

/** 'YYYY-MM' → 'octubre 2026' */
export function formatMonth(month: string): string {
	return `${monthName.format(wallClockToMs(`${month}-01T00:00:00`))} ${month.slice(0, 4)}`
}

const shortMonth = new Intl.DateTimeFormat('es-CL', { month: 'short', year: 'numeric', timeZone: 'UTC' })

/** 'YYYY-MM' → 'sept 2026', the month as formatShortDate writes it */
export function formatShortMonth(month: string): string {
	return shortMonth.format(wallClockToMs(`${month}-01T00:00:00`))
}

/** 'YYYY-MM-DD' → 1 (Monday) to 7 (Sunday) */
export function isoWeekday(day: string): number {
	return new Date(wallClockToMs(`${day}T00:00:00`)).getUTCDay() || 7
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

/** Today in Chile, 'YYYY-MM-DD', whatever the viewer's time zone. */
export function todayInChile(): string {
	return today('America/Santiago').toString()
}

/**
 * The day a page opens on: `wanted` (from the URL) if it has data, else today in Chile if it
 * has data, else the latest day. '' when there are no days.
 */
export function defaultDay(days: string[], wanted?: string | null): string {
	if (wanted && days.includes(wanted)) return wanted
	const now = todayInChile()
	return days.includes(now) ? now : days[days.length - 1] ?? ''
}
