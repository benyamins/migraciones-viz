import { wholePax } from './pax'
import { busiest60, SEGMENTS_PER_HOUR, sum60, tenthsBySegment } from './segments'
import type { PaxRow, Tipo } from './types'

export interface DaySummary {
	/** 'YYYY-MM-DD' */
	day: string
	/** Passengers in each clock hour, 00 to 23 (the six 10-minute segments added up), rounded. */
	hours: number[]
	/** The day's passengers, rounded. */
	total: number
	/** Hora punta: the day's busiest 60 minutes. `start` is their first 10-minute segment (0 to 138). */
	peak: { start: number; pax: number }
}

/** 'YYYY-MM' of every month with data, sorted. */
export function monthsOf(days: string[]): string[] {
	return [...new Set(days.map(day => day.slice(0, 7)))].sort()
}

/** One summary per day of `month` ('YYYY-MM') for one direction, in date order. */
export function summarizeMonth(byDay: Map<string, PaxRow[]>, month: string, tipo: Tipo): DaySummary[] {
	return [...byDay.keys()]
		.filter(day => day.startsWith(month))
		.sort()
		.map(day => summarizeDay(day, byDay.get(day)!.filter(row => row.tipo === tipo)))
}

function summarizeDay(day: string, rows: PaxRow[]): DaySummary {
	// Everything adds whole tenths and rounds at the end (see pax.ts)
	const segments = tenthsBySegment(rows)
	const peak = busiest60(segments)
	return {
		day,
		hours: Array.from({ length: 24 }, (_, hour) => wholePax(sum60(segments, hour * SEGMENTS_PER_HOUR))),
		total: wholePax(segments.reduce((sum, value) => sum + value, 0)),
		peak: { start: peak.start, pax: wholePax(peak.tenths) },
	}
}

/** The busiest 60 minutes and the busiest day of a month. On a tie, the earliest. */
export function monthHighlights(days: DaySummary[]) {
	let peakDay = days[0]
	let busiestDay = days[0]
	for (const summary of days) {
		if (summary.peak.pax > peakDay.peak.pax) peakDay = summary
		if (summary.total > busiestDay.total) busiestDay = summary
	}
	return { peakDay, busiestDay }
}
